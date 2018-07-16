var mongojs = require('mongojs');
var db = mongojs('iottest');

var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var PORT = 4000;

server.on("listening",function(){
    var address = server.address();
    console.log("Listening UDP on "+address.address + ":"+ address.port);
});

server.on("message",function(message,remote){
    console.log(remote.address + " : " + remote.port + " - " +message);
});

server.on("error",function(err){
    console.log("server error : "+err);
    server.close();
});

server.bind(PORT);