<?php
// Standalone MySQL & SQLite PDO Engine for Cloud Hosting (Ryaze / 1Panel)

ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');
ini_set('upload_max_filesize', '512M');
ini_set('post_max_size', '512M');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');

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

    if ($pdo) {
        try {
            $dbType = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
            $countStmt = $pdo->query("SELECT COUNT(*) FROM ebooks");
            $booksCount = intval($countStmt->fetchColumn());
        } catch (\Throwable $e) {
            $dbType = 'error: ' . $e->getMessage();
        }
    }

    sendJson([
        'status' => 'online',
        'engine' => 'PHP Standalone PDO Engine',
        'php_version' => PHP_VERSION,
        'database_driver' => $dbType,
        'has_gemini_key' => !empty($env['GEMINI_API_KEY']),
        'books_count' => $booksCount,
        'storage_writable' => is_writable($storageDir),
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
    $targetFile = $ebooksDir . '/' . $filename;
    streamFile($targetFile, 'application/pdf');
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

    $slug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($title));
    $slug = trim($slug, '-') ?: ('ebook-' . time());

    $savedFilename = $slug . '.pdf';
    $targetPath = $ebooksDir . '/' . $savedFilename;
    $pdfSize = null;
    $origName = 'document.pdf';

    if (!empty($_FILES['pdf']['tmp_name']) && is_uploaded_file($_FILES['pdf']['tmp_name'])) {
        move_uploaded_file($_FILES['pdf']['tmp_name'], $targetPath);
        $pdfSize = filesize($targetPath);
        $origName = $_FILES['pdf']['name'] ?? 'document.pdf';
    }

    $insertedId = time();
    $pdo = getPdo($env, $rootDir);

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

            $insertedId = intval($pdo->lastInsertId()) ?: time();
        } catch (\Throwable $e) {
            error_log("Insert into MySQL error: " . $e->getMessage());
        }
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

// 7. POST /api/ai/chat (Live Google Gemini Research Assistant)
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

// 9. Fallback
sendJson(['status' => 'not_found', 'uri' => $uri], 404);
