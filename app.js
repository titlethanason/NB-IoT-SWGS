var dgram = require('dgram');
var bodyParser = require('body-parser');
var server = dgram.createSocket('udp4');
var PORT_UDP = 4000;

var request = require("request")
var express = require('express');
var app = express();
var PORT_TCP = 8000;
app.use(bodyParser.urlencoded({extended: true}));
var EventEmitter = require("events").EventEmitter;

var admin = require("firebase-admin");
var serviceAccount = require("./iotproject-210213-firebase-adminsdk-fxqnx-fc1a399120.json");
var serviceAccount2 = require("./sgws-c9237-31348e7ff988.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://iotproject-210213.firebaseio.com"
});
var db2 = admin.database();
var other = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount2)
  },'other');
var db = other.firestore();

server.on("listening",function(){
    var startTime = new Date().toLocaleString();
    var address = server.address();
    console.log("Listening UDP on "+address.address + ":"+ address.port);
    db2.ref("/").set({last_login : startTime});
});
server.on("message",function(message,remote){
    console.log(remote.address + ":" + remote.port + " - " +message);
    data = message.toString('utf8');
    data = JSON.parse(data);
    db2.ref("users/" + data.name).set({"soil-moisture" : data.sm}); // name = gardenID
    var sendBack = new Buffer('200 OK');
    server.send(sendBack,0,sendBack.length,remote.port,remote.address,function(err,bytes){
        if(err) throw err;
        console.log('Server respone to '+remote.address+':'+remote.port+' | '+sendBack);
    });
});
server.on("error",function(err){
    console.log("server error : "+err);
    server.close();
});

server.bind(PORT_UDP);

app.listen(PORT_TCP,function(){
    var startTime = new Date().toLocaleString();
    console.log('Server start at '+startTime);
});
app.get('/',function(req,res){
    res.send('Hello World!!');
});

// app.post('/soilMoisture',function(req,res){

// });

// app.post('/status',function(req,res){
    
// });

var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.hour = 3;
rule.minute = 0;

var j = schedule.scheduleJob(rule, function(){
    let startTime = new Date(Date.now() + 500);
    let endTime = new Date(startTime.getTime() + 7200000);
    var k = schedule.scheduleJob({ start: startTime, end: endTime, rule: '* */5 * * * *' }, function(){
      console.log('Time for tea!');
    });
});

function addWatering (){
    db.collection('garden').get()
    .then((snapshot) => {
        snapshot.forEach((doc) => {
            db.collection('garden').doc(doc.id).get().then((s) => {
                let lat = s.data().location.lat
                let long = s.data().location.long
                getWeather(lat,long,function(s){
                    let mois = Math.random() * 60 + 40
                    db.collection('garden').doc(doc.id).update({watering: {time: new Date(), temp: s.temp, moisture: Math, status: 'Automatic'}});
                })
            })
        });
    })
    .catch((err) => {
        console.log('Error getting documents', err);
    });
}

function getWeather(lat,long,callback){
    var url = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + long + '&appid=86eb79574951a234c5a5913b940ca90b'
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        //console.log(body.weather[0].main) // Print the json response
        callback({'weather' : body.weather[0].main,'temp' : body.main.temp-272.15});
    });
}
// a = db.collection('garden').doc('K79fWANeCMfTDqVOTIts').get().then((s) => {
//     console.log(s.data().location);
// })

getWeather(52.52000659999999,13.404953999999975,function(s){
    console.log(s.temp);
})