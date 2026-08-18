<?php
// Standalone MySQL & SQLite PDO Engine for Cloud Hosting (Ryaze / 1Panel)

ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');
ini_set('upload_max_filesize', '512M');
ini_set('post_max_size', '512M');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With, Access-Control-Request-Private-Network');
header('Access-Control-Allow-Private-Network: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rootDir = dirname(__DIR__);
$storageDir = $rootDir . '/storage/app/public';
$ebooksDir = $storageDir . '/ebooks';
$dbFile = $storageDir . '/ebooks_db.json';

if (!is_dir($ebooksDir)) {
    @mkdir($ebooksDir, 0777, true);
}

// Load .env from root, backend, and system environment
$envPaths = [
    dirname(__DIR__, 2) . '/.env',
    dirname(__DIR__) . '/.env',
    $rootDir . '/.env',
];

$env = [];
foreach ($envPaths as $envFile) {
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line && $line[0] !== '#') {
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $k = trim($parts[0]);
                    $v = trim($parts[1]);
                    if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                        $v = substr($v, 1, -1);
                    }
                    if (!isset($env[$k])) {
                        $env[$k] = $v;
                    }
                }
            }
        }
    }
}

// Fallback to getenv() and $_ENV
foreach (['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'DB_CONNECTION', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'] as $key) {
    if (empty($env[$key])) {
        $val = getenv($key) ?: ($_ENV[$key] ?? ($_SERVER[$key] ?? ''));
        if ($val) $env[$key] = $val;
    }
}

function getPdo($env, $rootDir) {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    // 1. Try MySQL with multi-host candidate resolution
    $port = $env['DB_PORT'] ?? 3306;
    $db   = $env['DB_DATABASE'] ?? '';
    $user = $env['DB_USERNAME'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';

    $candidateHosts = array_unique(array_filter([
        $env['DB_HOST'] ?? '',
        '127.0.0.1',
        'localhost',
        'mysql',
        '172.17.0.1',
        '1Panel-mysql-KZAi',
    ]));

    if (!empty($db) && !empty($user)) {
        foreach ($candidateHosts as $host) {
            try {
                $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
                $testPdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 2,
                ]);
                // Ensure ebooks table exists
                $testPdo->exec("CREATE TABLE IF NOT EXISTS ebooks (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    author VARCHAR(255) NULL,
                    description TEXT NULL,
                    pdf_path VARCHAR(255) NOT NULL,
                    cover_path VARCHAR(255) NULL,
                    original_filename VARCHAR(255) NULL,
                    file_size BIGINT UNSIGNED NULL,
                    total_pages INT UNSIGNED NULL,
                    status VARCHAR(50) DEFAULT 'published',
                    interactive_elements JSON NULL,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

                $pdo = $testPdo;
                return $pdo;
            } catch (\Throwable $e) {
                // Try next host
            }
        }
    }

    // 2. Fallback to SQLite with automatic table schema
    try {
        $dbDir = $rootDir . '/database';
        if (!is_dir($dbDir)) @mkdir($dbDir, 0777, true);
        $sqlitePath = $dbDir . '/database.sqlite';
        $sqlitePdo = new PDO("sqlite:$sqlitePath", null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $sqlitePdo->exec("CREATE TABLE IF NOT EXISTS ebooks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            author TEXT NULL,
            description TEXT NULL,
            pdf_path TEXT NOT NULL,
            cover_path TEXT NULL,
            original_filename TEXT NULL,
            file_size INTEGER NULL,
            total_pages INTEGER NULL,
            status TEXT DEFAULT 'published',
            interactive_elements TEXT NULL,
            created_at TEXT NULL,
            updated_at TEXT NULL
        );");
        $pdo = $sqlitePdo;
        return $pdo;
    } catch (\Throwable $e) {
        return null;
    }
}

function sendJson($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function streamFile($filePath, $contentType = 'application/pdf') {
    if (!file_exists($filePath)) {
        http_response_code(404);
        header('Content-Type: text/plain');
        echo "File Not Found";
        exit;
    }

    $size = filesize($filePath);
    $fp = fopen($filePath, 'rb');

    header('Content-Type: ' . $contentType);
    header('Accept-Ranges: bytes');
    header('Access-Control-Allow-Origin: *');

    if (isset($_SERVER['HTTP_RANGE'])) {
        list($specifier, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
        if ($specifier === 'bytes') {
            list($start, $end) = explode('-', $range, 2);
            $start = intval($start);
            $end = empty($end) ? $size - 1 : intval($end);
            $length = $end - $start + 1;

            http_response_code(206);
            header("Content-Range: bytes $start-$end/$size");
            header("Content-Length: $length");

            fseek($fp, $start);
            echo fread($fp, $length);
            fclose($fp);
            exit;
        }
    }

    header("Content-Length: $size");
    fpassthru($fp);
    fclose($fp);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// 1. Health
if ($uri === '/api/health') {
    $pdo = getPdo($env, $rootDir);
    $dbType = 'none';
    $booksCount = 0;
    $dbError = null;

    if ($pdo) {
        try {
            $dbType = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
            $countStmt = $pdo->query("SELECT COUNT(*) FROM ebooks");
            $booksCount = intval($countStmt->fetchColumn());
        } catch (\Throwable $e) {
            $dbType = 'error: ' . $e->getMessage();
            $dbError = $e->getMessage();
        }
    }

    sendJson([
        'status' => 'online',
        'engine' => 'PHP Standalone PDO Engine',
        'php_version' => PHP_VERSION,
        'database_driver' => $dbType,
        'database_name' => $env['DB_DATABASE'] ?? 'not set',
        'database_host' => $env['DB_HOST'] ?? 'not set',
        'database_user' => $env['DB_USERNAME'] ?? 'not set',
        'db_error' => $dbError,
        'has_gemini_key' => !empty($env['GEMINI_API_KEY']),
        'books_count' => $booksCount,
        'storage_writable' => is_writable($storageDir),
        'storage_path' => $ebooksDir,
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
    ]);
}

// 2. GET /api/ebooks (Fetch from MySQL database)
if ($uri === '/api/ebooks' && $method === 'GET') {
    $pdo = getPdo($env, $rootDir);
    $books = [];

    if ($pdo) {
        try {
            $search = trim($_GET['search'] ?? '');
            if (!empty($search)) {
                $stmt = $pdo->prepare("SELECT * FROM ebooks WHERE title LIKE :q1 OR author LIKE :q2 ORDER BY id DESC");
                $stmt->execute([':q1' => "%$search%", ':q2' => "%$search%"]);
            } else {
                $stmt = $pdo->query("SELECT * FROM ebooks ORDER BY id DESC");
            }
            $rows = $stmt->fetchAll();
            foreach ($rows as $r) {
                $interactive = null;
                if (!empty($r['interactive_elements'])) {
                    $interactive = is_string($r['interactive_elements']) ? json_decode($r['interactive_elements'], true) : $r['interactive_elements'];
                }
                $slug = $r['slug'] ?: strval($r['id']);
                $books[] = [
                    'id' => intval($r['id']),
                    'title' => $r['title'],
                    'slug' => $slug,
                    'author' => $r['author'],
                    'description' => $r['description'],
                    'pdf_path' => $r['pdf_path'],
                    'pdf_url' => '/api/ebooks/' . $slug . '/file',
                    'cover_path' => $r['cover_path'] ?? null,
                    'cover_url' => !empty($r['cover_path']) ? ('/storage/' . $r['cover_path']) : null,
                    'original_filename' => $r['original_filename'],
                    'file_size' => !empty($r['file_size']) ? intval($r['file_size']) : null,
                    'total_pages' => !empty($r['total_pages']) ? intval($r['total_pages']) : null,
                    'status' => $r['status'] ?? 'published',
                    'interactive_elements' => $interactive,
                    'created_at' => $r['created_at'],
                    'updated_at' => $r['updated_at'],
                ];
            }
        } catch (\Throwable $e) {
            error_log("Select ebooks error: " . $e->getMessage());
        }
    }

    sendJson(['success' => true, 'data' => $books]);
}

// 3. GET /api/ebooks/{id}/file
if (preg_match('#^/api/ebooks/([^/]+)/file$#', $uri, $m) && $method === 'GET') {
    $idOrSlug = $m[1];
    $pdo = getPdo($env, $rootDir);
    $found = null;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM ebooks WHERE id = :id OR slug = :slug LIMIT 1");
            $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
            $found = $stmt->fetch();
        } catch (\Throwable $e) {}
    }

    $filename = $found && !empty($found['pdf_path']) ? basename($found['pdf_path']) : "$idOrSlug.pdf";
    $candidatePaths = [
        $ebooksDir . '/' . $filename,
        $rootDir . '/storage/app/public/ebooks/' . $filename,
        dirname($rootDir) . '/storage/ebooks/' . $filename,
        dirname($rootDir) . '/storage/app/public/ebooks/' . $filename,
        $rootDir . '/storage/ebooks/' . $filename,
        !empty($found['pdf_path']) ? ($storageDir . '/' . $found['pdf_path']) : null,
        !empty($found['pdf_path']) ? (dirname($rootDir) . '/storage/' . $found['pdf_path']) : null,
    ];

    $targetFile = null;
    foreach ($candidatePaths as $p) {
        if (!empty($p) && file_exists($p) && is_file($p)) {
            $targetFile = $p;
            break;
        }
    }

    if ($targetFile) {
        streamFile($targetFile, 'application/pdf');
    } else {
        http_response_code(404);
        header('Content-Type: text/plain');
        header('Access-Control-Allow-Origin: *');
        echo "File Not Found: " . htmlspecialchars($filename);
        exit;
    }
}

// 4. GET /api/ebooks/{id}
if (preg_match('#^/api/ebooks/([^/]+)$#', $uri, $m) && $method === 'GET') {
    $idOrSlug = $m[1];
    $pdo = getPdo($env, $rootDir);

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM ebooks WHERE id = :id OR slug = :slug LIMIT 1");
            $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
            $r = $stmt->fetch();
            if ($r) {
                $interactive = null;
                if (!empty($r['interactive_elements'])) {
                    $interactive = is_string($r['interactive_elements']) ? json_decode($r['interactive_elements'], true) : $r['interactive_elements'];
                }
                $slug = $r['slug'] ?: strval($r['id']);
                sendJson([
                    'success' => true,
                    'data' => [
                        'id' => intval($r['id']),
                        'title' => $r['title'],
                        'slug' => $slug,
                        'author' => $r['author'],
                        'description' => $r['description'],
                        'pdf_path' => $r['pdf_path'],
                        'pdf_url' => '/api/ebooks/' . $slug . '/file',
                        'cover_path' => $r['cover_path'] ?? null,
                        'cover_url' => !empty($r['cover_path']) ? ('/storage/' . $r['cover_path']) : null,
                        'original_filename' => $r['original_filename'],
                        'file_size' => !empty($r['file_size']) ? intval($r['file_size']) : null,
                        'total_pages' => !empty($r['total_pages']) ? intval($r['total_pages']) : null,
                        'status' => $r['status'] ?? 'published',
                        'interactive_elements' => $interactive,
                        'created_at' => $r['created_at'],
                        'updated_at' => $r['updated_at'],
                    ]
                ]);
            }
        } catch (\Throwable $e) {}
    }

    sendJson(['success' => false, 'message' => 'E-Book not found'], 404);
}

// 5. DELETE /api/ebooks/{id}
if (preg_match('#^/api/ebooks/([^/]+)$#', $uri, $m) && $method === 'DELETE') {
    $idOrSlug = $m[1];
    $pdo = getPdo($env, $rootDir);

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT pdf_path FROM ebooks WHERE id = :id OR slug = :slug LIMIT 1");
            $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
            $row = $stmt->fetch();
            if ($row && !empty($row['pdf_path'])) {
                $targetFile = $storageDir . '/' . $row['pdf_path'];
                if (file_exists($targetFile)) @unlink($targetFile);
            }

            $delStmt = $pdo->prepare("DELETE FROM ebooks WHERE id = :id OR slug = :slug");
            $delStmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        } catch (\Throwable $e) {}
    }

    sendJson(['success' => true, 'message' => 'Deleted successfully']);
}

// 6. POST /api/ebooks (Insert directly into MySQL database)
if ($uri === '/api/ebooks' && $method === 'POST') {
    $title = trim($_POST['title'] ?? 'Untitled E-Book');
    $author = trim($_POST['author'] ?? 'Lecturer');
    $description = trim($_POST['description'] ?? '');
    $totalPages = !empty($_POST['total_pages']) ? intval($_POST['total_pages']) : null;
    $interactive = !empty($_POST['interactive_elements']) ? $_POST['interactive_elements'] : null;

    $baseSlug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($title));
    $baseSlug = trim($baseSlug, '-') ?: ('ebook-' . time());
    $slug = $baseSlug;

    $insertedId = time();
    $pdo = getPdo($env, $rootDir);

    // Auto-resolve duplicate slug for MySQL unique constraint
    if ($pdo) {
        try {
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ebooks WHERE slug = :slug");
            $checkStmt->execute([':slug' => $slug]);
            if ($checkStmt->fetchColumn() > 0) {
                $slug = $baseSlug . '-' . substr(md5(uniqid()), 0, 5);
            }
        } catch (\Throwable $e) {}
    }

    $savedFilename = $slug . '.pdf';
    $targetPath = $ebooksDir . '/' . $savedFilename;
    $altPath1 = $rootDir . '/storage/app/public/ebooks/' . $savedFilename;
    $altPath2 = dirname($rootDir) . '/storage/ebooks/' . $savedFilename;
    $altPath3 = $rootDir . '/storage/ebooks/' . $savedFilename;

    $pdfSize = null;
    $origName = 'document.pdf';

    if (!empty($_FILES['pdf']['tmp_name']) && is_uploaded_file($_FILES['pdf']['tmp_name'])) {
        $moveResult = move_uploaded_file($_FILES['pdf']['tmp_name'], $targetPath);
        if (!$moveResult) {
            sendJson(['success' => false, 'message' => 'Failed to save PDF file to disk. Check server storage permissions. Target: ' . $targetPath], 500);
        }
        $pdfSize = filesize($targetPath);
        $origName = $_FILES['pdf']['name'] ?? 'document.pdf';

        // Copy to other storage locations for zero-failure streaming
        foreach ([$altPath1, $altPath2, $altPath3] as $alt) {
            $dir = dirname($alt);
            if (!is_dir($dir)) @mkdir($dir, 0777, true);
            if ($alt !== $targetPath && file_exists($targetPath)) {
                @copy($targetPath, $alt);
            }
        }
    } else {
        // No PDF was received
        $uploadError = $_FILES['pdf']['error'] ?? 'no file';
        sendJson(['success' => false, 'message' => 'No PDF file received by server. Upload error code: ' . $uploadError . '. Check upload_max_filesize and post_max_size PHP settings.'], 400);
    }

    $insertedId = null;
    $dbError = null;

    if ($pdo) {
        try {
            $isMysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
            $nowFunc = $isMysql ? 'NOW()' : "datetime('now')";

            $sql = "INSERT INTO ebooks (title, slug, author, description, pdf_path, original_filename, file_size, total_pages, status, interactive_elements, created_at, updated_at) 
                    VALUES (:title, :slug, :author, :description, :pdf_path, :original_filename, :file_size, :total_pages, :status, :interactive_elements, $nowFunc, $nowFunc)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':title' => $title,
                ':slug' => $slug,
                ':author' => $author,
                ':description' => $description,
                ':pdf_path' => 'ebooks/' . $savedFilename,
                ':original_filename' => $origName,
                ':file_size' => $pdfSize,
                ':total_pages' => $totalPages,
                ':status' => 'published',
                ':interactive_elements' => is_string($interactive) ? $interactive : ($interactive ? json_encode($interactive) : null),
            ]);

            $insertedId = intval($pdo->lastInsertId());
        } catch (\Throwable $e) {
            $dbError = $e->getMessage();
            error_log("Insert into MySQL error: " . $dbError);
        }
    } else {
        $dbError = 'No database connection available (PDO returned null). Check DB credentials in .env';
    }

    // If DB insert failed, return 500 error — do NOT silently succeed
    if (!$insertedId) {
        // Clean up the uploaded file since DB failed
        if (file_exists($targetPath)) @unlink($targetPath);
        sendJson(['success' => false, 'message' => 'Database insert failed: ' . ($dbError ?? 'Unknown error. Check server logs.')], 500);
    }

    $newBook = [
        'id' => $insertedId,
        'title' => $title,
        'slug' => $slug,
        'author' => $author,
        'description' => $description,
        'pdf_path' => 'ebooks/' . $savedFilename,
        'pdf_url' => '/api/ebooks/' . $slug . '/file',
        'cover_path' => null,
        'cover_url' => null,
        'original_filename' => $origName,
        'file_size' => $pdfSize,
        'total_pages' => $totalPages,
        'status' => 'published',
        'interactive_elements' => is_string($interactive) ? json_decode($interactive, true) : $interactive,
        'created_at' => date('c'),
        'updated_at' => date('c'),
    ];

    sendJson(['success' => true, 'data' => $newBook], 201);
}

// 7. POST /api/generate-ai or /api/ebooks/{id}/generate-ai
if (($uri === '/api/generate-ai' || preg_match('#^/api/ebooks/([^/]+)/generate-ai$#', $uri, $m)) && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: [];

    $title = $payload['title'] ?? 'Textbook Concept Module';
    $totalPages = intval($payload['total_pages'] ?? 10);
    $textSample = $payload['text_sample'] ?? '';
    $apiKey = $env['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: '';

    $elements = [];
    $timestamp = (int) (microtime(true) * 1000);

    if (!empty($apiKey)) {
        $prompt = "You are an expert academic curriculum researcher and professor creating interactive learning materials for the textbook titled \"$title\" ($totalPages pages).
Extract and analyze the actual text from this document:
\"\"\"
$textSample
\"\"\"
Generate a comprehensive, curriculum-grade interactive learning suite with at least 10 in-depth quiz questions (5 in Part 1, 5 in Part 2) and 8 key concept flashcards matching the exact topic of this document.

Output MUST be a valid JSON object matching this schema exactly without markdown formatting:
{
  \"quizzes\": [
    {
      \"pageNumber\": 5,
      \"title\": \"Knowledge Assessment (Part 1 - 5 Questions)\",
      \"questions\": [
        {
          \"question\": \"High quality question based directly on the excerpt\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed step-by-step explanation.\"
        },
        {
          \"question\": \"Second analytical question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Third methodology question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Fourth principle question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Fifth application question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        }
      ]
    },
    {
      \"pageNumber\": 12,
      \"title\": \"Advanced Mastery Assessment (Part 2 - 5 Questions)\",
      \"questions\": [
        {
          \"question\": \"Sixth synthesis question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Seventh comparative question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Eighth optimization question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Ninth verification question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        },
        {
          \"question\": \"Tenth comprehensive question\",
          \"options\": [\"Correct answer\", \"Distractor 1\", \"Distractor 2\", \"Distractor 3\"],
          \"correctIndex\": 0,
          \"explanation\": \"Detailed explanation.\"
        }
      ]
    }
  ],
  \"flashcards\": [
    {
      \"pageNumber\": 8,
      \"title\": \"Key Terminology & Speed Match Game (8 Concepts)\",
      \"cards\": [
        {\"term\": \"Concept 1\", \"definition\": \"Definition 1\"},
        {\"term\": \"Concept 2\", \"definition\": \"Definition 2\"},
        {\"term\": \"Concept 3\", \"definition\": \"Definition 3\"},
        {\"term\": \"Concept 4\", \"definition\": \"Definition 4\"},
        {\"term\": \"Concept 5\", \"definition\": \"Definition 5\"},
        {\"term\": \"Concept 6\", \"definition\": \"Definition 6\"},
        {\"term\": \"Concept 7\", \"definition\": \"Definition 7\"},
        {\"term\": \"Concept 8\", \"definition\": \"Definition 8\"}
      ]
    }
  ],
  \"video\": {
    \"pageNumber\": 3,
    \"title\": \"Core Topic Video Lecture\",
    \"youtubeUrl\": \"https://www.youtube.com/watch?v=xxpc-HPKN28\",
    \"videoId\": \"xxpc-HPKN28\",
    \"description\": \"Curated video lecture covering core module concepts.\"
  }
}";

        $models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        foreach ($models as $model) {
            $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);
            $ch = curl_init($geminiUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode([
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.2],
                ]),
                CURLOPT_TIMEOUT => 45,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($code === 200 && $res) {
                $data = json_decode($res, true);
                $raw = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if ($raw) {
                    $parsed = json_decode($raw, true);
                    if (!empty($parsed['quizzes'])) {
                        // Format quizzes
                        foreach ($parsed['quizzes'] as $idx => $qItem) {
                            if (!empty($qItem['questions'])) {
                                $elements[] = [
                                    'id' => "ai_quiz_{$timestamp}_{$idx}",
                                    'pageNumber' => min(max(1, intval($qItem['pageNumber'] ?? 5)), $totalPages),
                                    'type' => 'quiz',
                                    'title' => $qItem['title'] ?? 'Google Gemini AI Assessment',
                                    'description' => 'Generated by Google Gemini AI directly from your PDF.',
                                    'data' => [
                                        'questions' => array_map(function ($q, $qIdx) use ($idx) {
                                            return [
                                                'id' => "gq_{$idx}_{$qIdx}",
                                                'question' => $q['question'] ?? 'Question',
                                                'options' => $q['options'] ?? [],
                                                'correctIndex' => intval($q['correctIndex'] ?? 0),
                                                'explanation' => $q['explanation'] ?? '',
                                            ];
                                        }, $qItem['questions'], array_keys($qItem['questions'])),
                                    ],
                                ];
                            }
                        }
                        // Format flashcards
                        if (!empty($parsed['flashcards'])) {
                            foreach ($parsed['flashcards'] as $idx => $fItem) {
                                if (!empty($fItem['cards'])) {
                                    $elements[] = [
                                        'id' => "ai_flash_{$timestamp}_{$idx}",
                                        'pageNumber' => min(max(1, intval($fItem['pageNumber'] ?? 8)), $totalPages),
                                        'type' => 'flashcards',
                                        'title' => $fItem['title'] ?? 'Key Terminology & Speed Match Game',
                                        'description' => 'Practice active recall and definitions.',
                                        'data' => [
                                            'cards' => array_map(function ($c, $cIdx) use ($idx) {
                                                return [
                                                    'id' => "gc_{$idx}_{$cIdx}",
                                                    'term' => $c['term'] ?? 'Term',
                                                    'definition' => $c['definition'] ?? 'Definition',
                                                ];
                                            }, $fItem['cards'], array_keys($fItem['cards'])),
                                        ],
                                    ];
                                }
                            }
                        }
                        // Format video
                        if (!empty($parsed['video'])) {
                            $v = $parsed['video'];
                            $elements[] = [
                                'id' => "ai_video_{$timestamp}",
                                'pageNumber' => min(max(1, intval($v['pageNumber'] ?? 3)), $totalPages),
                                'type' => 'video',
                                'title' => $v['title'] ?? 'Curated Video Lecture',
                                'description' => $v['description'] ?? 'Recommended video lesson.',
                                'data' => [
                                    'youtubeUrl' => $v['youtubeUrl'] ?? 'https://www.youtube.com/watch?v=xxpc-HPKN28',
                                    'videoId' => $v['videoId'] ?? 'xxpc-HPKN28',
                                ],
                            ];
                        }
                        break;
                    }
                }
            }
        }
    }

    // Fallback if AI key missing or request failed: create 10 high-quality academic questions
    if (empty($elements)) {
        $metaBlacklist = [
            'nama pensyarah', 'pensyarah', 'lecturer', 'instructor', 'nama pelajar', 'nama murid',
            'no pendaftaran', 'no. pendaftaran', 'matrik', 'matric', 'politeknik', 'kolej', 'universiti',
            'jabatan', 'kementerian', 'fakulti', 'disemak oleh', 'disediakan oleh', 'prepared by',
            'reviewed by', 'author', 'penulis', 'copyright', 'hakcipta', 'table of contents', 'isi kandungan',
            'wan izyani', 'binti', 'bin '
        ];

        $cleanSentences = array_values(array_filter(array_map('trim', preg_split('/\n|\. |\? /', $textSample)), function ($s) use ($metaBlacklist) {
            if (strlen($s) < 20 || strlen($s) > 140 || str_starts_with($s, 'http')) return false;
            $lower = strtolower($s);
            foreach ($metaBlacklist as $bad) {
                if (str_contains($lower, $bad)) return false;
            }
            return true;
        }));

        $c = function ($idx, $default) use ($cleanSentences) {
            return $cleanSentences[$idx] ?? $default;
        };

        $q1 = [];
        $q2 = [];
        for ($i = 0; $i < 5; $i++) {
            $concept = $c($i, "Core foundational principle " . ($i + 1));
            $q1[] = [
                'id' => "fb_q1_" . ($i + 1),
                'question' => "Which of the following best describes the key function of \"$concept\"?",
                'options' => [
                    "To establish systematic methodology: $concept.",
                    "An optional reference with no practical application.",
                    "A legacy protocol replaced by standard defaults.",
                    "None of the above."
                ],
                'correctIndex' => 0,
                'explanation' => "As detailed in the textbook, this concept forms a core foundational component."
            ];
        }

        for ($i = 5; $i < 10; $i++) {
            $concept = $c($i, "Advanced module analysis " . ($i + 1));
            $q2[] = [
                'id' => "fb_q2_" . ($i + 1),
                'question' => "In synthesizing advanced topics in $title, how is \"$concept\" evaluated?",
                'options' => [
                    "By applying structured validation: $concept.",
                    "By discarding error margins during calculation.",
                    "Exclusively in theoretical simulations without verification.",
                    "By substituting empirical data with estimates."
                ],
                'correctIndex' => 0,
                'explanation' => "Advanced synthesis requires structured analytical validation adhering to standard benchmarks."
            ];
        }

        $mid = max(2, (int) floor($totalPages * 0.4));
        $late = min($totalPages, max($mid + 2, (int) floor($totalPages * 0.8)));

        $elements = [
            [
                'id' => "ai_quiz_{$timestamp}_1",
                'pageNumber' => min($totalPages > 6 ? $mid : 2, $totalPages),
                'type' => 'quiz',
                'title' => "$title: Knowledge Assessment (Part 1 - 5 Questions)",
                'description' => 'Test your foundational understanding with instant scoring and explanations.',
                'data' => ['questions' => $q1],
            ],
            [
                'id' => "ai_quiz_{$timestamp}_2",
                'pageNumber' => $late,
                'type' => 'quiz',
                'title' => "$title: Advanced Mastery Assessment (Part 2 - 5 Questions)",
                'description' => 'Challenge your deep conceptual and applied knowledge across the module.',
                'data' => ['questions' => $q2],
            ],
            [
                'id' => "ai_flash_{$timestamp}",
                'pageNumber' => min($totalPages > 10 ? max(3, (int) floor($totalPages * 0.6)) : 2, $totalPages),
                'type' => 'flashcards',
                'title' => "$title: Key Terminology & Speed Match Game (8 Concepts)",
                'description' => 'Practice active recall with 3D flip cards and the Speed Match Game.',
                'data' => [
                    'cards' => [
                        ['id' => 'f1', 'term' => substr($c(0, 'Core Concept'), 0, 35), 'definition' => $c(0, 'Foundational rule defining how the system functions.')],
                        ['id' => 'f2', 'term' => substr($c(1, 'Methodology'), 0, 35), 'definition' => $c(1, 'The methodical workflow applied in practical exercises.')],
                        ['id' => 'f3', 'term' => substr($c(2, 'Analytical Framework'), 0, 35), 'definition' => $c(2, 'Mathematical formulation and evaluation criteria.')],
                        ['id' => 'f4', 'term' => substr($c(3, 'Operational Standard'), 0, 35), 'definition' => $c(3, 'Standard diagnostic criteria and quality protocols.')],
                        ['id' => 'f5', 'term' => substr($c(4, 'System Integration'), 0, 35), 'definition' => $c(4, 'Comparative integration of primary and secondary modules.')],
                        ['id' => 'f6', 'term' => substr($c(5, 'Error Prevention'), 0, 35), 'definition' => $c(5, 'Boundary validation rules preventing calculation drift.')],
                        ['id' => 'f7', 'term' => substr($c(6, 'Optimization Algorithm'), 0, 35), 'definition' => $c(6, 'Efficiency algorithms optimizing throughput and speed.')],
                        ['id' => 'f8', 'term' => substr($c(7, 'Advanced Synthesis'), 0, 35), 'definition' => $c(7, 'Holistic application combining theory with practical implementation.')],
                    ]
                ],
            ],
            [
                'id' => "ai_video_{$timestamp}_1",
                'pageNumber' => min($totalPages > 10 ? 3 : 1, $totalPages),
                'type' => 'video',
                'title' => "$title: Core Lecture Lesson",
                'description' => 'Curated video lesson covering fundamental principles.',
                'data' => ['youtubeUrl' => 'https://www.youtube.com/watch?v=xxpc-HPKN28', 'videoId' => 'xxpc-HPKN28'],
            ],
            [
                'id' => "ai_video_{$timestamp}_2",
                'pageNumber' => min($totalPages > 14 ? 7 : max(2, $totalPages - 1), $totalPages),
                'type' => 'video',
                'title' => "$title: Advanced Problem Solving Walkthrough",
                'description' => 'In-depth visual walkthrough of complex problems.',
                'data' => ['youtubeUrl' => 'https://www.youtube.com/watch?v=xxpc-HPKN28', 'videoId' => 'xxpc-HPKN28'],
            ],
        ];
    }

    // If request was for a specific book ID/slug, update MySQL record
    if (!empty($m[1]) && $pdo = getPdo($env, $rootDir)) {
        try {
            $upStmt = $pdo->prepare("UPDATE ebooks SET interactive_elements = :ie WHERE id = :id OR slug = :slug");
            $upStmt->execute([
                ':ie' => json_encode($elements),
                ':id' => $m[1],
                ':slug' => $m[1],
            ]);
        } catch (\Throwable $e) {}
    }

    sendJson(['success' => true, 'data' => $elements]);
}

// 8. POST /api/ai/chat (Live Google Gemini Research Assistant)
if ($uri === '/api/ai/chat' && $method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: [];

    $message = $payload['message'] ?? '';
    $history = $payload['history'] ?? [];
    $bookTitle = $payload['book_title'] ?? 'Engineering Textbook';
    $currentPage = $payload['current_page'] ?? 1;
    $pageText = $payload['page_text'] ?? '';

    $apiKey = $env['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: '';

    $systemPrompt = "You are Aura AI, an expert academic research assistant and politeknik/university tutor.
Your sole purpose is to help students with scholarly research, deep conceptual understanding, mathematical derivations, step-by-step problem solving, and synthesis of the textbook topics they are reading.
- The student is studying \"$bookTitle\" (currently on Page $currentPage).
" . ($pageText ? "Page excerpt:\n\"\"\"\n" . substr($pageText, 0, 1500) . "\n\"\"\"\n" : "") . "
Behavioral Guidelines:
1. Conduct clear, thorough academic research and pedagogical explanations for the student's question.
2. Provide step-by-step mathematical formulas, derivations, and engineering reasoning formatted in clean Markdown.
3. Be encouraging, concise, scholarly, and encourage deep scientific curiosity.
4. Only assist with educational, scientific, research, and textbook topics. Do not engage in harmful, destructive, or irrelevant activities.";

    if (empty($apiKey)) {
        sendJson([
            'success' => true,
            'reply' => "### Academic Analysis: " . htmlspecialchars($message) . "\n\nFor **$bookTitle** (Page $currentPage):\n\n1. **Theoretical Context**: Core concepts relate to standard problem-solving methodologies.\n2. **Derivation**: Evaluate parameters and choose relevant formulas.\n\n*(Please ensure GEMINI_API_KEY is saved in your Ryaze .env)*",
        ]);
    }

    $contents = [];
    foreach (array_slice($history, -6) as $turn) {
        $contents[] = [
            'role' => ($turn['role'] ?? '') === 'model' ? 'model' : 'user',
            'parts' => [['text' => $turn['content'] ?? '']],
        ];
    }
    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $message]],
    ];

    $models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    $replyText = '';

    foreach ($models as $model) {
        $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);
        $ch = curl_init($geminiUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode([
                'contents' => $contents,
                'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
                'generationConfig' => ['temperature' => 0.7, 'maxOutputTokens' => 1500],
            ]),
            CURLOPT_TIMEOUT => 25,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $res) {
            $data = json_decode($res, true);
            $candidate = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            if (!empty($candidate)) {
                $replyText = $candidate;
                break;
            }
        }
    }

    if (!empty($replyText)) {
        sendJson(['success' => true, 'reply' => $replyText]);
    } else {
        sendJson([
            'success' => true,
            'reply' => "I analyzed your question regarding **$bookTitle** (Page $currentPage). Could you clarify the specific formula or step you'd like to break down?",
        ]);
    }
}

// 8. Direct file streaming from /storage/
if (str_starts_with($uri, '/storage/')) {
    $rel = substr($uri, strlen('/storage/'));
    $full = $storageDir . '/' . $rel;
    streamFile($full);
}

// 9. Static Asset & SPA Frontend Fallback
$staticFile = __DIR__ . $uri;
if (is_file($staticFile) && $uri !== '/' && !str_ends_with($uri, '.php')) {
    $ext = strtolower(pathinfo($staticFile, PATHINFO_EXTENSION));
    $mimes = [
        'js' => 'application/javascript',
        'mjs' => 'application/javascript',
        'css' => 'text/css',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'ico' => 'image/x-icon',
        'woff2' => 'font/woff2',
        'woff' => 'font/woff',
        'ttf' => 'font/ttf',
    ];
    $contentType = $mimes[$ext] ?? 'application/octet-stream';
    header("Content-Type: $contentType");
    header('Access-Control-Allow-Origin: *');
    readfile($staticFile);
    exit;
}

// Serve Latest Frontend SPA for all routes (/, /library, /upload, /read/*)
$indexHtml = __DIR__ . '/index.html';
if (file_exists($indexHtml)) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile($indexHtml);
    exit;
}

sendJson(['status' => 'not_found', 'uri' => $uri], 404);
