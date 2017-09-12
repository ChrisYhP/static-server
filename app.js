let http = require('http');
let url = require('url');
let fs = require('fs');
let mime = require('./mime').types;
let config = require('./config');
let zlib = require('zlib');
let path = require('path');
http.createServer(function (request,response) {
    let pathname = url.parse(request.url).pathname;
    if (pathname.slice(-1) === "/") {
        pathname = pathname + config.Welcome.file;
    }
    let realPath = path.join("assets", path.normalize(pathname.replace(/\.\./g, "")));
    fs.exists(realPath,function (exists) {
        if(!exists){
            response.writeHead(404,{'Content-Type':'text/plain'});
            response.write("This request URL " + pathname + "was not found on this server");
            response.end();
        }else {
           fs.readFile(realPath,'binary',function (err,file) {
               if(err){
                   response.writeHead(500,{"Content-Type":"text/plain"});
                   response.end(err)
               }else {
                   let ext = path.extname(realPath);
                   ext = ext ? ext.slice(1) : 'unknown';
                   let contentType = mime[ext] || 'text/plain';
                   response.setHeader("Content-Type",contentType);
                   /*expires*/
                   if (ext.match(config.Expires.fileMatch)) {
                       let expires = new Date();
                       expires.setTime(expires.getTime() + config.Expires.maxAge * 1000)
                       response.setHeader("Expires", expires.toUTCString());
                       response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge)
                   }
                   /*lastmodify*/
                   fs.stat(realPath, function (err, stat) {
                       let lastModified = stat.mtime.toUTCString();
                       if (request.headers.ifModifiedSince && lastModified == request.headers.ifModifiedSince) {
                           response.writeHead(304, "Not Modified");
                           response.end();
                       }
                       response.setHeader('Last-Modified', lastModified)
                       let raw = fs.createReadStream(realPath);
                       let acceptEncoding = request.headers['accept-encoding'] || '';
                       let matched = ext.match(config.compress.match);
                       /*是否开gzip*/
                       if (matched && acceptEncoding.match(/\bgzip\b/)) {
                           response.writeHead(200, "Ok", {"Content-Encoding": "gzip"})
                           raw.pipe(zlib.createGzip()).pipe(response);
                       } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                           response.writeHead(200, "Ok", {
                               "Content-Enconding": "deflate"
                           })
                           raw.pipe(zlib.createDeflate()).pipe(response);
                       } else {
                           response.writeHead(200, "Ok");
                           raw.pipe(response)
                       }
                   })
               }
           })
        }
    });
}).listen(8080,'127.0.0.1');


