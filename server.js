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
      res.writeHead(404, { 'Content-Type': 'text/plain' });
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
      books_count: getDatabase().length,
      storage_writable: true,
    });
  }

  // 1. GET /api/ebooks
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

  // 5. POST /api/ebooks (Multipart Upload)
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

  // 6. Serve /storage/ files
  if (pathname.startsWith('/storage/')) {
    const relPath = pathname.replace(/^\/storage\//, '');
    const fullPath = path.join(STORAGE_DIR, relPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    return streamFile(req, res, fullPath, contentType);
  }

  // 7. Serve Static Frontend files
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
