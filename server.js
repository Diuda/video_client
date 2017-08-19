var WebSocketServer = require('ws').Server,
	express = require('express'),
	https = require('https'),
	http = require('http'),
	app = express(),
	util = require('util'),
	fs = require('fs');

var ssl = {
  key: fs.readFileSync('/etc/letsencrypt/live/www.diuda.me/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/www.diuda.me/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/www.diuda.me/chain.pem')
};

var wss = null;
var sslSrv = null;
var c=[];

app.use(express.static('client'));

sslSrv = https.createServer(ssl, app).listen(449);
console.log('https running...');

wss = new WebSocketServer({server: sslSrv});
console.log('Websocket Running');

wss.on('connection', function(client){
	console.log('connected');
	// console.log(client);
	c.push(client);
	console.log(c.length);
	client.on('message', function (message){
		// console.log("message...");
		wss.broadcast(message, client);
	});
});

wss.broadcast = function(data, exclude) {
	
	var i = 0, n = c ? c.length : 0, client = null;
	console.log('broadcasting working clients' +n);
	if(n < 1){
	console.log("only 1 client"); 
		// return;
	}
	console.log('broadcasting...');
	for(; i < n; i++) {
		client = c[i];
		// console.log(client[i]);
		if(client == exclude)
			continue;
		if(client.readyState == client.OPEN)
			client.send(data);
		else
			console.log("State: "+client.readyState);
	}
};
