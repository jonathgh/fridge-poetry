/***********************************************************
 * js
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
 * The following example uses p5 in global mode,
 * which should be avoided for any semi-professional website!
 * Please refer to sketch_instance mode.js as example
 * for using p5 in instance mode.
 * I chose to go with global mode in this example as the code
 * is less cluttered and easier to read. Also, if you are a
 * beginner, working in global mode is just fine.
 *********************************************************/ 

"use strict";

// As described in the Note above, we are working with p5 
// in global mode with global variables. This should be
// avoided in a professional context!

// TODO 5
let socket = io();

const CANVASW = windowHeight; 
const CANVASH = windowWidth; 

let fridge;
let magnetDragged;

function preload() 
{
    // Keep in mind that you have to clear the database first for switching words
    fridge = new Fridge('./data/text/wordkit_happiness.txt'); //~200 words


    // fridge = new Fridge('./data/text/wordkit_original.txt'); //~300 words
    // fridge = new Fridge('./data/text/wordkit_bigwords.txt'); //~160 words
    // fridge = new Fridge('./data/text/wordkit_awesome.txt'); //~200 words

}

function setup() 
{ 

    
    let canvas = createCanvas(CANVASW , CANVASH);
    fridge.init();

    // TODO 9
    socket.on('serverBroadcastMove', (data) => 
    {
        console.log('Received: ', data);

        //set magnet pos
        fridge.magnets[data.index].x = data.x;
        fridge.magnets[data.index].y = data.y;
    });

    // TODO 15
    socket.on('serverAsksForMagnetData', () => 
    {
        console.log('Sending all Magnet data');
        for (let i = 0, i < fridge.magnets.length; i++) {
            let data = 
            {
                index: fridge.magnets[i].index,
                x: fridge.magnets[i].x,
                y: fridge.magnets[i].y
            }

            socket.emit('clientMagnetMove', data);
        }
    });
    // TODO 18
    //receive all magnet data from a server
    socket.on('serverSendsDbData', (data) => 
    {
        for (let i = 0; i < data.length; i++) {
            let index = fridge.magnets.findIndex(obj => obj.index === data[i].index);

            fridge.magnets[index].index = data[i].index;
            fridge.magnets[index].x = data[i].x;
            fridge.magnets[index].y = data[i].y;
        }
    });

    // TODO 12
    socket.emit('clientSetupReady');

}

function draw()  
{
    background(240);
    fridge.update();
}



