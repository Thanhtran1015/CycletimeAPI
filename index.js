const morgan = require('morgan');
const helmet = require('helmet');
const Joi = require('joi');
const logger = require('./logger');
const express = require('express');
const app = express();

//Khai bao thu vien Mongodb
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";

// Database Name
const dbName = 'IoT';

// Create a new MongoClient
//const client = new MongoClient(url);
const client = new MongoClient(url, { useNewUrlParser: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());
app.use(morgan('tiny'));

app.use(logger);

app.use(function (req, res, next) {
    console.log('Authenticating...');
    next();
});

var realCTs = [];
var cycleTimes = [];
var id = 0;
var date = new Date();

var machines = [
    { machineId: 08060001, machineName: "Leather Cutting Machine", modelNo: "07A96LC005", line: "M1A" }
];

var workers = [
    { workerId: 63040, workerName: "Nguyen Thi A", leaderId: 21006, leaderName: "Tran Thi Y" }
];

var componentCollections = [
    ["Leather type D06", "Leather type E25", "Fabric type A02"],
    ["Leather type X02", "Fabric type F02"]
];

var analysisDatas = {edo:0,ebdo:0,edb:0,dobn:0,eho:0,ebho:0,ehb:0,hobn:0}

//debugger;



debugger;
app.get('/', (req, res) => {
    //res.send('Welcome to SHC Cycle Time!');

    client.connect(function (err) {

        console.log("Connected successfully to server");

        const db = client.db(dbName);

        const collection = db.collection('CycleTime');
        collection.find({}).toArray(function (err, result) {
            if (err) throw err;
            console.log(result);
            res.send(result);
            //db.close();
        });

        //client.close();
    });
});

app.get('/dateTime', (req, res) => {
    client.connect(function (err) {

        var date1 = new Date();

        var nowHour = date1.getHours();
        var nowMinute = date1.getMinutes();
        var nowSecond = date1.getSeconds();

        var nowHourString = String(nowHour);
        var nowMinuteString = String(nowMinute);
        var nowSecondString = String(nowSecond);

        if (nowHour < 10 ) {
            nowHourString = "0" + nowHourString;
        }
        if (nowMinute < 10 ) {
            nowMinuteString = "0" + nowMinuteString;
        }
        if (nowSecond < 10 ) {
            nowSecondString = "0" + nowSecondString;
        }

        var nowDateString = "";
        var nowTimeString = nowHourString + ":" + nowMinuteString + ":" + nowSecondString;

        var nowDateTimeString = nowDateString + nowTimeString;
        var nowDateTimeObject = {str: nowDateTimeString}
        res.send(nowDateTimeObject);

    })
});

app.get('/api/cycleTimes', (req, res) => {

    client.connect(function (err) {

        console.log("Connected successfully to server");

        var date1 = new Date();

        var nowHour = date1.getHours();
        var nowMinute = date1.getMinutes();
        var nowSecond = date1.getSeconds();

        var nowHourString = String(nowHour);
        var nowMinuteString = String(nowMinute);
        var nowSecondString = String(nowSecond);

        if (nowHour < 10 ) {
            nowHourString = "0" + nowHourString;
        }
        if (nowMinute < 10 ) {
            nowMinuteString = "0" + nowMinuteString;
        }
        if (nowSecond < 10 ) {
            nowSecondString = "0" + nowSecondString;
        }

        var nowDateString = "";
        var nowTimeString = nowHourString + ":" + nowMinuteString + ":" + nowSecondString;

        var nowDateTimeString = nowDateString + nowTimeString;

        const db = client.db(dbName);

        const collection2 = db.collection('DisplayData');
        // collection2.find({}).toArray(function (err, result) {
        //     if (err) throw err;
        //     console.log(result);
        //     res.send(result);
        //     //db.close();
        // });

        debugger;
        collection2.find({}, { sort: { _id: -1 }, limit: 1 }).toArray(function (err, result) {
            if (err) throw err;

            var date2 = new Date();
            console.log(result[0]);

            var newId = result[0].Count;
            var newAverageCT = Math.round(((result[0].TotalTime / result[0].Count) / 1000.0) * 10) / 10;
            var zeroData = [{ a: "", s: "", e: "", d: 0.0, sq: 0, c: "" }];
            var newCycleTimeCollection = [zeroData, zeroData, zeroData, zeroData, zeroData, zeroData, zeroData, zeroData, zeroData, zeroData];
            var i;
            for (i = 0; i < 10; i++) {
                if (result[0].CycleTimeCollection[i] != 0) {
                    newCycleTimeCollection[i] = result[0].CycleTimeCollection[i];
                    newCycleTimeCollection[i].d = (Math.round(newCycleTimeCollection[i].d / 100)) / 10;
                }
                
            }
            var newBestCT = Math.round((result[0].MinRealTime / 1000) * 10) / 10;
            var totalTimeInSecs = result[0].TotalTime / 1000;
            var nowInSecs = date2.getHours() * 3600 + date2.getMinutes() * 60 + date2.getSeconds();
            var from0to730InSecs = 7 * 3600 + 30 * 60;
            var from730ToNowInSecs = nowInSecs - from0to730InSecs;
            var newAvailability = Math.round((result[0].UpTime * 100 / from730ToNowInSecs) * 10) / 10;
            var lastCreatedTime = result[0].CycleTimeCollection[9].c;
            var lastCreatedHour = parseInt(lastCreatedTime.substring(0, 2));
            var lastCreatedMinute = parseInt(lastCreatedTime.substring(3, 5));
            var lastCreatedSecond = parseInt(lastCreatedTime.substring(6, 8));

            var onGoingTime = (nowHour - lastCreatedHour) * 3600 + (nowMinute - lastCreatedMinute) * 60 + (nowSecond - lastCreatedSecond)

            cycleTimes.push({ id: newId, operationId: 'M1AC01', operationName: 'Cutting', standardCT: 30.0, cycleTimeCollection: newCycleTimeCollection, averageCT: newAverageCT, bestCT: newBestCT, availability: newAvailability });
            var cycleTimesToSend = [];
            cycleTimesToSend.push({ id: newId, operationId: 'M1AC01', operationName: 'Cutting', standardCT: 30.0, cycleTimeCollection: newCycleTimeCollection, averageCT: newAverageCT, bestCT: newBestCT, availability: newAvailability, lastH: lastCreatedHour, lastM: lastCreatedMinute, lastS: lastCreatedSecond, now: nowDateTimeString, onGoing: onGoingTime, from0730ToNow: from730ToNowInSecs, totalTime: totalTimeInSecs });
            res.send(cycleTimesToSend);
            //db.close();

        });

        //client.close();
    });


});

app.get('/api/RPMs', (req, res) => {

    client.connect(function (err) {

        console.log("Connected successfully to server");

        const db = client.db(dbName);

        const collection4 = db.collection('RPMDisplayData');

        
        debugger;
        collection4.find({}, { sort: { _id: -1 }, limit: 1 }).toArray(function (err, result) {
            if (err) throw err;

            res.send(result);
            //db.close();

        });

        //client.close();
    });


});

app.get('/api/cycleTimes/:id', (req, res) => {
    const cycleTime = cycleTimes.find(i => i.id === parseInt(req.params.id));
    if (!cycleTime) return res.status(404).send('Item not found.');
    res.send(cycleTime);
});

app.post('/api/cycleTimes', (req, res) => {
    const { error } = validateItem(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    const cycleTime = {
        id: cycleTimes.length + 1,
        name: req.body.name
    };
    cycleTimes.push(cycleTime);
    res.send(cycleTime);
});

app.put('/api/cycleTimes/:id', (req, res) => {
    const cycleTime = cycleTimes.find(i => i.id === parseInt(req.params.id));
    if (!cycleTime) return res.status(404).send('Item not found.');

    const { error } = validateItem(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    cycleTime.name = req.body.name;
    res.send(cycleTime);
});

function validateItem(cycleTime) {
    const schema = {
        name: Joi.string().min(3).required()
    };
    return Joi.validate(cycleTime, schema);
}

app.delete('/api/cycleTimes/:id', (req, res) => {
    const cycleTime = cycleTimes.find(i => i.id === parseInt(req.params.id));
    if (!cycleTime) return res.status(404).send('Item not found.');

    const index = cycleTimes.indexOf(cycleTime);
    cycleTimes.splice(index, 1);
    res.send(cycleTime);
});

app.get('/api/machines', (req, res) => {
    res.send(machines);
});

app.get('/api/workers', (req, res) => {
    res.send(workers);
});

app.get('/api/analysis', (req, res) => {
    const db = client.db(dbName);

        const collection2 = db.collection('DisplayData');
        // collection2.find({}).toArray(function (err, result) {
        //     if (err) throw err;
        //     console.log(result);
        //     res.send(result);
        //     //db.close();
        // });

        debugger;
        collection2.find({}, { sort: { _id: -1 }, limit: 1 }).toArray(function (err, result) {
            if (err) throw err;

            var date2 = new Date();

            var newAverageCT = Math.round(((result[0].TotalTime / result[0].Count) / 1000.0) * 10) / 10;
            var newBestCT = Math.round((result[0].MinRealTime / 1000) * 10) / 10;
            var totalTimeInSecs = result[0].TotalTime / 1000;
            var nowInSecs = date2.getHours() * 3600 + date2.getMinutes() * 60 + date2.getSeconds();
            var from0to730InSecs = 7 * 3600 + 30 * 60;
            var from730ToNowInSecs = nowInSecs - from0to730InSecs;
            var from0To18InSecs = 18 * 3600;
            var from730To18InSecs = from0To18InSecs - from0to730InSecs;

            analysisDatas.edo = Math.round(from730To18InSecs / (newAverageCT * componentCollections.length * 2));
            analysisDatas.ebdo = Math.round(from730To18InSecs / (newBestCT * componentCollections.length * 2));
            analysisDatas.edb = Math.round(analysisDatas.ebdo - analysisDatas.edo);
            analysisDatas.dobn = Math.round(result[0].Count / componentCollections.length / 2);

            analysisDatas.eho = Math.round(analysisDatas.edo / 9.5);
            analysisDatas.ebho = Math.round(analysisDatas.ebdo / 9.5);
            analysisDatas.ehb = Math.round(analysisDatas.ebho - analysisDatas.eho);
            analysisDatas.hobn = Math.round(analysisDatas.dobn / (from730ToNowInSecs / 3600));

            
        });

    res.send(analysisDatas);
});


app.get('/api/componentCollections', (req, res) => {
    res.send(componentCollections);
});

//PORT
const port = process.env.PORT || 1904;
app.listen(port, () => console.log(`Listening on port ${port}...`));