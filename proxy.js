var http = require('http'),
    httpProxy = require('http-proxy');
    url = require('url');
    request = require('request');

function processRequest(req, res, proxy, new_req){
  req.url = new_req.path
  req.headers.host = new_req.host
  res.oldWriteHead = res.writeHead;
  res.writeHead = function(statusCode, headers) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.oldWriteHead(statusCode, headers);
  }
  try{
    proxy.proxyRequest(req, res, {
      host: req.headers.host.split(":")[0],
      port: parseInt(req.headers.host.split(":")[1]) || 80
    });
  }catch(err){
    console.log(err);
  }
}

httpProxy.createServer(function (req, res, proxy) {
  if (req.method === 'OPTIONS') {
      console.log('!OPTIONS');
      var headers = {};
      // IE8 does not allow domains to be specified, just the *
      // headers["Access-Control-Allow-Origin"] = req.headers.origin;
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
      headers["Access-Control-Allow-Credentials"] = true;
      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
      headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, If-Modified-Since";
      res.writeHead(200, headers);
      res.end();
  } else {
      var url_path = req.url.slice(1)
      if(url_path == "crossdomain.xml"){
        proxy.proxyRequest(req, res, {
          host: '127.0.0.1',
          port: 9000
        });
      }
      else{
        new_req = url.parse(url_path)
        if(new_req.host == "avatars.io"){
          request({
            url: new_req.href,
            followRedirect:false
          }, function(error, response, body){
            var final_req = url.parse(response.headers.location);
            processRequest(req, res, proxy, final_req);
          });
        }
        else{
          if(new_req.host && new_req.host.match(/dgm59|cloudinary|twimg|instagram|facebook|fbcdn|distillery|qrserver|igcdn|naver/)){
            processRequest(req, res, proxy, new_req);
            console.log("allowed " + new_req.host)
          }else{
            console.log("disallowed " + new_req.host)
            res.writeHead(400);
            res.write('Not Allowed');
            res.end();
          }
        }
      }
  }
}).listen(process.env.PORT || 8000);

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.write('<?xml version="1.0"?>\n<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">\n<cross-domain-policy>\n<allow-access-from domain="*" />\n</cross-domain-policy>\n');
  res.end();
}).listen(9000);


process.on('uncaughtException', function(e){
  console.log(e)
});
