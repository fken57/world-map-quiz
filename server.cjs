const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
http.createServer((req,res) => {
  let pathname;
  try {pathname = decodeURIComponent(req.url.split('?')[0]);} catch {res.writeHead(400);return res.end();}
  if(pathname.startsWith('/world-map-quiz/')) pathname = pathname.slice('/world-map-quiz'.length);
  if(pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if(!file.startsWith(root + path.sep) || pathname.split('/').some(part => part.startsWith('.'))) {res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json'})[path.extname(file)] || 'application/octet-stream');res.end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
