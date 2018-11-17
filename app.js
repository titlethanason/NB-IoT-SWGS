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

admin.firestore().settings({
    timestampsInSnapshots: true 
})
server.on("listening",function(){
    var startTime = new Date().toLocaleString();
    var address = server.address();
    console.log("Listening UDP on "+address.address + ":"+ address.port);
    db2.ref("/").update({last_login : startTime});
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

app.post('/immediateWatering',function(req,res){
    var time = req.body.time*60000;
    setBoardWatering("on",time)
});

app.post('/smartWatering',function(req,res){
    var before = req.body.before
    var after = req.body.after
    setTimeWatering(after,before);
});

app.post('/stopWatering',function(req,res){
    setBoardWatering("off",0)
});

var schedule = require('node-schedule');
var rule = new schedule.RecurrenceRule();
rule.hour = 00;
rule.minute = 00;
intervalMills = 3*60*60*1000;
var j = schedule.scheduleJob(rule, function(){
    console.log("start 1")
    let startTime = new Date(Date.now());
    let endTime = new Date(startTime.getTime() + intervalMillis);
    var k = schedule.scheduleJob({ start: startTime, end: endTime, rule: '0 1 * * * *' }, function(){
        console.log("start 2")
        addWatering(function(s){
        });
    });
});

function setTimeWatering(after,before){
    rule.hour = after
    intervalMillis = (before - after)*60*60*1000
    console.log(intervalMillis);
}

var ruleReset = new schedule.RecurrenceRule();
ruleReset.hour = 00;
ruleReset.minute = 00;
var resetSchedule = schedule.scheduleJob(ruleReset, function(){
    console.log("STARTTT !!")
    resetDaily(function(s){
        console.log("all daily is reset")
    })
})

function resetDaily (callback){
    db.collection('garden').get()
    .then((snapshot) => {
        snapshot.forEach((doc) => {
            db.collection('garden').doc(doc.id).update({daily: 0})
        });
    })
    .catch((err) => {
        console.log('Error getting documents', err);
    }); 
}

function addWatering (callback){
    db.collection('garden').get()
    .then((snapshot) => {
        snapshot.forEach((doc) => {
            db.collection('garden').doc(doc.id).get().then((s) => {
                console.log("start 1L")
                if(s.data().daily == 0){
                    console.log("start 2L")
                    let lat = s.data().location.lat
                    let long = s.data().location.long
                    getWeather(lat,long,function(m){
                        console.log("start 3L")
                        if(m.weather != "Rain"){
                            console.log("start 4L")                    
                            let mois = Math.random() * 60 + 40
                            db.collection('garden').doc(doc.id).update({watering: admin.firestore.FieldValue.arrayUnion({time: new Date(), temp: m.temp, moisture: mois, status: 'Smart Watering'}), daily: 1}).then(() => {
                                console.log("start 5L")
                                callback(1);
                            });
                        }
                    })
                }
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
        callback({'weather' : body.weather[0].main,'temp' : body.main.temp});
    });
}

function setBoardWatering(command,time){
    db2.ref("/users/title").orderByChild("ip").on("child_added", function(data) {
        // console.log(data.val());
        address = data.val();
        let sendBack = new Buffer(command+','+time);
        console.log(sendBack.toString());
        server.send(sendBack,0,sendBack.length,4000,address,function(err,bytes){
        if(err) throw err;
        console.log('Server respone to '+address+':'+ 4000 +' | '+sendBack);
        });
    });
}

setBoardWatering('on',2);