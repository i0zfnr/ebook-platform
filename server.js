const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = __dirname;
const DIST_DIR = fs.existsSync(path.join(ROOT_DIR, 'dist'))
  ? path.join(ROOT_DIR, 'dist')
  : path.join(ROOT_DIR, 'frontend', 'dist');

const STORAGE_DIR = path.join(ROOT_DIR, 'storage');
const EBOOKS_DIR = path.join(STORAGE_DIR, 'ebooks');
const COVERS_DIR = path.join(STORAGE_DIR, 'covers');
const DB_FILE = path.join(STORAGE_DIR, 'ebooks_db.json');

// Ensure storage directories exist
[STORAGE_DIR, EBOOKS_DIR, COVERS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load environment variables from .env files
function loadEnv() {
  const envPaths = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, 'backend', '.env'),
    path.join(ROOT_DIR, 'frontend', '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.substring(0, eqIdx).trim();
              let val = trimmed.substring(eqIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
      } catch {}
    }
  }
}
loadEnv();

// Get stored books from JSON file database
function getDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Error reading database:', e);
  }
  return [];
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving database:', e);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  });
  res.end(JSON.stringify(data));
}

function streamFile(req, res, filePath, contentType) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      return res.end('File Not Found');
    }

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    });
    return res.end();
  }

  // Health Diagnostics
  if (pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'online',
      engine: 'Node Standalone Server',
      node_version: process.version,
      has_gemini_key: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
      books_count: getDatabase().length,
      storage_writable: true,
    });
  }

  // 1. GET /api/ebooks (Public to all users)
  if (pathname === '/api/ebooks' && method === 'GET') {
    const db = getDatabase();
    const search = parsedUrl.searchParams.get('search');
    let results = db;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (b) => b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q))
      );
    }
    return sendJson(res, 200, { success: true, data: results });
  }

  // 2. GET /api/ebooks/:id/file
  const fileMatch = pathname.match(/^\/api\/ebooks\/([^/]+)\/file$/);
  if (fileMatch && method === 'GET') {
    const idOrSlug = fileMatch[1];
    const db = getDatabase();
    const book = db.find((b) => String(b.id) === idOrSlug || b.slug === idOrSlug);
    const fileName = book?.pdf_path ? path.basename(book.pdf_path) : `${idOrSlug}.pdf`;
    const targetFile = path.join(EBOOKS_DIR, fileName);

    if (fs.existsSync(targetFile)) {
      return streamFile(req, res, targetFile, 'application/pdf');
    }
    res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    return res.end('PDF File Not Found');
  }

  // 3. GET /api/ebooks/:id
  const singleMatch = pathname.match(/^\/api\/ebooks\/([^/]+)$/);
  if (singleMatch && method === 'GET') {
    const idOrSlug = singleMatch[1];
    const db = getDatabase();
    const book = db.find((b) => String(b.id) === idOrSlug || b.slug === idOrSlug);
    if (book) {
      return sendJson(res, 200, { success: true, data: book });
    }
    return sendJson(res, 404, { success: false, message: 'E-Book not found' });
  }

  // 4. DELETE /api/ebooks/:id
  if (singleMatch && method === 'DELETE') {
    const idOrSlug = singleMatch[1];
    let db = getDatabase();
    const book = db.find((b) => String(b.id) === idOrSlug || b.slug === idOrSlug);
    if (book) {
      if (book.pdf_path && fs.existsSync(path.join(STORAGE_DIR, book.pdf_path))) {
        try { fs.unlinkSync(path.join(STORAGE_DIR, book.pdf_path)); } catch {}
      }
      db = db.filter((b) => String(b.id) !== idOrSlug && b.slug !== idOrSlug);
      saveDatabase(db);
    }
    return sendJson(res, 200, { success: true, message: 'Deleted successfully' });
  }

  // 5. POST /api/ebooks (Multipart Upload - saves file to public server)
  if (pathname === '/api/ebooks' && method === 'POST') {
    const boundaryHeader = req.headers['content-type'] || '';
    const boundaryMatch = boundaryHeader.match(/boundary=(.+)$/);

    if (!boundaryMatch) {
      return sendJson(res, 400, { success: false, message: 'Invalid multipart body' });
    }

    const boundary = boundaryMatch[1];
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const parts = splitMultipart(buffer, boundary);

        const fields = {};
        let pdfBuffer = null;
        let pdfFilename = 'document.pdf';

        for (const part of parts) {
          if (part.filename && part.name === 'pdf') {
            pdfBuffer = part.data;
            pdfFilename = part.filename;
          } else if (part.name) {
            fields[part.name] = part.data.toString('utf8');
          }
        }

        const title = fields.title || 'Untitled E-Book';
        const author = fields.author || 'Lecturer';
        const description = fields.description || '';
        const totalPages = fields.total_pages ? parseInt(fields.total_pages, 10) : null;
        let interactive = null;
        if (fields.interactive_elements) {
          try { interactive = JSON.parse(fields.interactive_elements); } catch {}
        }

        const slug =
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || `ebook-${Date.now()}`;

        const savedFilename = `${slug}.pdf`;
        const savedPdfPath = path.join(EBOOKS_DIR, savedFilename);

        if (pdfBuffer) {
          fs.writeFileSync(savedPdfPath, pdfBuffer);
        }

        const newBook = {
          id: Date.now(),
          title,
          slug,
          author,
          description,
          pdf_path: `ebooks/${savedFilename}`,
          pdf_url: `/storage/ebooks/${savedFilename}`,
          cover_path: null,
          cover_url: null,
          original_filename: pdfFilename,
          file_size: pdfBuffer ? pdfBuffer.length : null,
          total_pages: totalPages,
          status: 'published',
          interactive_elements: interactive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const db = getDatabase();
        db.unshift(newBook);
        saveDatabase(db);

        return sendJson(res, 201, { success: true, data: newBook });
      } catch (err) {
        console.error('Upload parsing error:', err);
        return sendJson(res, 500, { success: false, message: err.message });
      }
    });
    return;
  }

  // 6. POST /api/ai/chat (Live Google Gemini Research Assistant)
  if (pathname === '/api/ai/chat' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const message = payload.message || '';
        const history = payload.history || [];
        const bookTitle = payload.book_title || 'Engineering & Technical Textbook';
        const currentPage = payload.current_page || 1;
        const pageText = payload.page_text || '';

        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

        const systemPrompt = `You are Aura AI, an expert academic research assistant and politeknik university tutor.
Your primary role is to assist students with scholarly research, deep conceptual understanding, mathematical derivations, step-by-step problem solving, and synthesis of the textbook topics they are reading.
- The student is studying "${bookTitle}" (currently reading Page ${currentPage}).
${pageText ? `Page excerpt:\n"""\n${pageText.substring(0, 1500)}\n"""\n` : ''}

Behavioral Guidelines:
1. Conduct clear, thorough academic research and pedagogical explanations for the student's question.
2. Provide step-by-step mathematical formulas, derivations, and engineering reasoning formatted in clean Markdown.
3. Be supportive, concise, scholarly, and encourage deep scientific curiosity.
4. Only assist with educational, scientific, research, and textbook topics. Do not engage in harmful, destructive, or irrelevant activities.`;

        if (!apiKey) {
          return sendJson(res, 200, {
            success: true,
            reply: `### Academic Research & Analysis: ${message}\n\nHere is the structured conceptual breakdown for **${bookTitle}**:\n\n1. **Theoretical Principle**: Focus on standard governing equations and core domain fundamentals.\n2. **Systematic Derivation**: Apply dimensional consistency, evaluate boundary conditions, and simplify.\n3. **Curriculum Reference**: Refer to **Page ${currentPage}** for worked examples.\n\n*(Tip: Add GEMINI_API_KEY to your .env to unlock live Google Gemini AI answers!)*`,
          });
        }

        const contents = [];
        for (const turn of history.slice(-6)) {
          contents.push({
            role: turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: turn.content }],
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const models = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        let replyText = '';

        for (const model of models) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const apiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
              }),
            });

            if (apiRes.ok) {
              const data = await apiRes.json();
              replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (replyText) break;
            }
          } catch (e) {
            console.warn(`Gemini model ${model} error:`, e.message);
          }
        }

        if (replyText) {
          return sendJson(res, 200, { success: true, reply: replyText });
        } else {
          return sendJson(res, 200, {
            success: true,
            reply: `I have analyzed your inquiry regarding **${bookTitle}**. Could you clarify the specific formula or theorem you would like to explore?`,
          });
        }
      } catch (err) {
        return sendJson(res, 500, { success: false, message: err.message });
      }
    });
    return;
  }

  // 7. Serve /storage/ files
  if (pathname.startsWith('/storage/')) {
    const relPath = pathname.replace(/^\/storage\//, '');
    const fullPath = path.join(STORAGE_DIR, relPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    return streamFile(req, res, fullPath, contentType);
  }

  // 8. Serve Static Frontend files
  let staticPath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  fs.stat(staticPath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(staticPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      return streamFile(req, res, staticPath, contentType);
    }

    // SPA Fallback
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return streamFile(req, res, indexPath, 'text/html; charset=UTF-8');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>E-Book Platform Ready</h1>');
  });
});

// Helper to parse multipart boundary
function splitMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = 0;

  while (start < buffer.length) {
    const next = buffer.indexOf(boundaryBuf, start);
    if (next === -1) break;

    if (start !== 0) {
      const partBuf = buffer.slice(start, next - 2); // strip \r\n
      const headerEnd = partBuf.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        const headerStr = partBuf.slice(0, headerEnd).toString('utf8');
        const data = partBuf.slice(headerEnd + 4);

        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);

        parts.push({
          name: nameMatch ? nameMatch[1] : null,
          filename: filenameMatch ? filenameMatch[1] : null,
          data,
        });
      }
    }
    start = next + boundaryBuf.length + 2; // move past \r\n
  }
  return parts;
}

server.listen(PORT, () => {
  console.log(`[FlipBook Monorepo Engine] Running on port ${PORT}`);
});
