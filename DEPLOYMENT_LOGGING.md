# Deployment runtime log

Both supported backends write newline-delimited JSON diagnostics to:

```text
/www/sites/hosting_clients/ebook/storage/logs/ebook-runtime.log
```

The directory and file are created automatically when either backend starts or
receives a request. The log does not contain database passwords, API keys, PDF
contents, or form descriptions.

## What the result means

- No log file after deployment: neither `node server.js` nor
  `backend/public/standalone_api.php` executed. Check the hosting start command,
  `.port` file, OpenResty routing, or PHP-FPM upstream.
- `server.started`: the Node backend started successfully. Confirm its `port`
  matches `/www/sites/hosting_clients/ebook/.port`.
- `server.listen_failed`: the Node port is unavailable or invalid.
- `api.request_started` without `api.request_completed`: the request was
  interrupted, timed out, or the process terminated.
- `upload.aborted`: the browser, proxy, or client disconnected during upload.
- `upload.file_missing`: PHP rejected or did not receive the uploaded file.
  Check the logged PHP upload error and size limits.
- `database.connection_failed`: the log identifies the attempted driver, host,
  port, and error without exposing credentials.
- `database.write_failed` or `upload.database_insert_failed`: storage or the
  database accepted the request but could not persist the book.
- `upload.completed`: the server saved the PDF and database record.
- `process.fatal_error`, `process.uncaught_exception`, or
  `process.unhandled_rejection`: the backend crashed; inspect the accompanying
  error and stack fields.

## Quick verification after redeployment

Open:

```text
https://ebook.ryz.my.id/api/health
```

A functioning backend returns JSON and includes `runtime_log_file`. Then try one
upload and inspect the newest lines at the bottom of `ebook-runtime.log`.

Because the file can grow over time, archive or truncate it from the hosting
file manager after diagnosing the deployment.
