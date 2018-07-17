var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var PORT_UDP = 4000;

var admin = require("firebase-admin");
var serviceAccount = require("./iotproject-210213-firebase-adminsdk-fxqnx-fc1a399120.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://iotproject-210213.firebaseio.com"
});
var db = admin.database();

server.on("listening",function(){
    var address = server.address();
    console.log("Listening UDP on "+address.address + ":"+ address.port);
});

server.on("message",function(message,remote){
    console.log(remote.address + ":" + remote.port + " - " +message);
});

server.on("error",function(err){
    console.log("server error : "+err);
    server.close();
});

server.bind(PORT_UDP);

var express = require('express');
var app = express();
var PORT_TCP = 8000;

app.listen(PORT_TCP,function(){
    var startTime = new Date();
    console.log('Server start at '+startTime);
    db.put("login_date", new Date());
});

app.get('/',function(req,res){
    res.send('Hello World!!');
});