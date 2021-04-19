// Broker, Database, Publisher and Subscribers in one file.

// ----- Broker -----

var mosca = require('mosca');
require('dotenv').config()
var settings = { port: 8080 }
var broker = new mosca.Server(settings)

// DB 
var MongoClient = require('mongodb').MongoClient;

// Broker started
broker.on('ready', () => { console.log('broker ready') })

// Broker stores to DB when data is published to it.
broker.on('published', (packet) => {
    const payload = packet.payload.toString()
    // console.log(payload)
    if (packet.topic !== 'Bedroom' && packet.topic !== 'LivingRoom' && packet.topic !== 'Garage') return console.log('info:', packet.topic)
    const data = JSON.parse(payload)
    data.topic = packet.topic
    MongoClient.connect(process.env.DB_URL, function (err, db) {
        if (err) throw err;

        db.collection("logs").insertOne(data, function (err, res) {
            if (err) throw err;
            // console.log("1 record inserted", DBEntry);
            db.close();
        });
    });
})


// ----- Subscribers and Publishers -------

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost:8080')

// ---- Publisher ----
var message = { v: 'Celsius', t: 15 }
var rooms = ['Bedroom', 'Garage', 'LivingRoom', 'Basement']
// console.log('initial msg', message)

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

client.on('connect', () => {
    setInterval(
        () => {
            const temp = getRandomInt(30);
            message.t = temp;
            const id = getRandomInt(3)
            topic = rooms[id];
            msg = JSON.stringify(message)
            client.publish(topic, msg);
            // console.log('message sent', topic, msg)
        }, 7000
    )
})

// ---- Subscribers ----
client.on('message', (topic, packet) => {
    const msg = packet.toString()
    console.log('\ntopic:', topic, '\ndata:', msg, '\nsaved to DB')
    // could save to DB here in different collections -> topic
})
client.on('connect', () => {
    client.subscribe('Garage')
    client.subscribe('Bedroom')
    client.subscribe('LivingRoom')
})