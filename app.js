/***********************************************************
 * app.js
 *
 * Author: Lena Gieseke
 * 
 * Date: December 2018
 * Update: January 2021
 * 
 * Purpose: Browser-based representation
 *          of word magnets on a fridge.
 *
 * Usage: 
 * 
 * Notes: SOLUTION
 *
 *********************************************************/ 

// Loading the modules
// TODO 1
const express = require('express');

// TODO 3a
const socketio = require('socket.io');

// TODO 10a
const mongoose = require('mongoose');

//Establish database connection
// TODO 10b

const pw = '3g@Xx%3wXJYjATi5#&Bp';
const pwURI = encodeURIComponent(pw);
const dbURL = 'mongodb+srv://jho-01:' + pwURI + '@mongocluster01.aecoh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(dbURL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('Connection established with: ',dbURL ))
    .catch(err => console.error('Unable to connect with the mongoDB server. Error: ', err.message));

// TODO 11
let MagnetSchema = new mongoose.Schema(
    {
        index: Number,
        x: Number,
        y: Number,
    }
);

let Magnet = mongoose.model('magnet', MagnetSchema);


// APPLICATION //////////////////////////////////////// 

// TODO 2 
const port = process.env.PORT || 3000;
const app = express();
const server = app
                .use(express.static('public'))
                .listen(port, () => console.log(`Started server on port ${port}`));

// TODO 3b
const io = socketio(server);

//on = addEventListener
io.on('connection', socket =>
{
    console.log('New client connected');

    // TODO 13
    socket.on('clientSetupReady', () => 
    {
        console.log('Client ready');

        Magnet.find()
            .then(docs =>
                {
                    if(docs.length == 0){
                        //TODO 14
                        console.log('Init Database');
                        socket.emit('serverAsksForMagnetData');
                    } else {
                        //TODO 17
                        console.log('Init Client');
                        socket.emit('serverSendsDbData', dataDb);
                    }
                })
                .catch(err => console.error(err));
    });

    // TODO 7

    socket.on('clientMagnetMove', (data) => 
    {
        console.log('Moved', data);
        
        // TODO 8
        socket.broadcast.emit('serverBroadcastMagnetMove', data);

        // TODO 16
        Magnet.findOne({index:Number(data.index)})
                .then(docs =>
                    {
                        if(docs !== null) //update
                        {
                            docs.x = data.x;
                            docs.y = data.y;
                            docs.save();
                        } else {
                            let tmpMagnet = new Magnet(data);
                            tmpMagnet.save()
                                .then(doc => console.log('New Magnet Saved to db', doc))
                                .catch(err => console.error(err));
                        }
                    })
                    .catch(err => console.error(err));
    });


});