const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8089;
const HTML_FILE = path.join(__dirname, 'simulator.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/simulator.html' || req.url.startsWith('/?')) {
    fs.readFile(HTML_FILE, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error loading simulator.html: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  } else if (req.url === '/apk') {
    const apkPath = path.join(__dirname, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="krupet-debug.apk"'
      });
      fs.createReadStream(apkPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('APK not found');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`KruPet Mobile UI Simulator running at http://localhost:${PORT}/`);
  // Open default browser automatically
  exec(`start http://localhost:${PORT}/`, (err) => {
    if (err) console.error('Failed to open browser:', err);
    else console.log('Opened browser to http://localhost:' + PORT);
  });
});
