var mongojs = require('mongojs');
var db = mongojs('iottest');

var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var HOST = '0.0.0.0';
var PORT = 4000;

server.on("listening",function(){
    var address = server.address();
    console.log("Listening UDP on "+address.addres + " : "+ address.port);
});

server.on("message",function(message,remote){
    console.log(remote.address + " : " + remote.port + " - " +message);
    var strMessage = JSON.parse(message);
    console.log("strMessage = "+strMessage);

    // var db_c = db.collection('iottest1');
    // var d = new Date();
    // var utc = d.getTime();
})

server.bind(PORT);