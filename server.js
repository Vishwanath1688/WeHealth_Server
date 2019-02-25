let express = require('express');
let file = require('fs');
let firebaseAdmin = require('firebase-admin');
let cors = require('cors');
var bodyParser = require('body-parser');
let serviceAccount = require('./wehealth-f3359-firebase-adminsdk-s3s9d-ea6a89b0e4.json');
let mqtt = require('mqtt');
let constants = require('./constants');
let app = express();
//let optionsMQTT = require('./mqtt_utils');

app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 

let optionsMQTT = { 
    clientId: 'com.dhriti.wehealth.server',
    username: 'jggbujym',
    port: 16170,
    host: 'mqtt://m16.cloudmqtt.com',
    password: 'mOCnFeDz4O3s',
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
    encoding: 'utf8'
};

let port = process.env.PORT || constants.SERVER_PORT;

let MQTT_URI = constants.MQTT_SERVER_URI;
let client = mqtt.connect('mqtt://m16.cloudmqtt.com', optionsMQTT);

client.on('connect', function() { 
     console.log('connected');
     setInterval(function(){
        let random = Math.floor((Math.random() * 100) + 1);
        client.publish(constants.MQTT_TOPIC, random + constants.BODY_TEMP_UNIT, function() {
            console.log("Message is published");
        });       
    }, 3000);
 });

app.use(cors());
app.options('*', cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get(constants.GET_HEALTH_VITALS, function(resquest, response) {
     file.readFile( __dirname + "/" + constants.HEALTH_VITALS_JSON, constants.UTF_ENCODING, function (err, data) {
         console.log( data );
         response.end( data );
      });
});

app.get(constants.GET_DEVICES_LIST, function(request, response){
     file.readFile( __dirname + "/" + constants.VITAL_SOURCES_JSON, 
        constants.UTF_ENCODING, function (err, data) {
            console.log( data );
            response.end( data );
      });
 });

app.post(constants.RESET_DEVICES, function(request, response) {
     console.log(request.body);
     response.writeHead(200, {'Content-Type': 'text/html'});
     response.end('event registered');
 });

app.post(constants.REGISTER_FIREBASE_TOKEN, function(request, response) {
    console.log(request.body.token);

    file.writeFile( __dirname + "/" + 'firebase_token.json', JSON.stringify(request.body),
     'utf8', function(success, error){
        if(success) {
            console.log('write successfull'); 
        }
    });

    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end('registartion token received');
});

firebaseAdmin.initializeApp({
   credential: firebaseAdmin.credential.cert(serviceAccount)
});

let message = {
     notification: {
         title: constants.FIREBASE_MSG_TITLE,
         body: constants.FIREBASE_MSG_BODY
       },
     token: constants.FIREBASE_REGISTER_TOKEN
};

firebaseAdmin.messaging().send(message)
   .then((response) => {
    console.log('Successfully sent message:', response);
   })
   .catch((error) => {
     console.log('Error sending message:', error);
});

app.listen(port, function(){
    console.log('Server Running On Port : ' + port);
});
