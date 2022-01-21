/***********************************************************
 * fridgepoetry.js
 *
 * Author: Lena Gieseke
 * 
 * Date: December 2018
 * Update: December 2019
 * 
 * Purpose: Browser-based representation
 *          of word magnets on a fridge.
 *
 * Usage: 
 * 
 * Notes: This code is optimized for simplicity
 *        and readability, not for performance and
 *        elegance.
 *
 *********************************************************/ 

"use strict";

let socket = io();

const FLEXIBLE_CANVAS_SIZE = true;

// Only needed for non-flexible canvas size
const CANVASW = 1024; 
const CANVASH = 768; // only needed for non-flexible canvas size

// Only needed for flexible canvas size
const CANVASH_FAC = 0.88; // value based on eyesight
const CANVASW_FAC = 0.98; // value based on eyesight

// Not the prettiest setup 
// but super easy to use
let poetry;
let magnetDragged;

function preload() 
{
    // poetry = new FridgePoetry('./data/text/wordkit_happiness.txt'); //~200 words

    // poetry = new FridgePoetry('./data/text/wordkit_original.txt'); //~300 words
    poetry = new FridgePoetry('./data/text/wordkit_bigwords.txt'); //~160 words

    if(FLEXIBLE_CANVAS_SIZE)
    {
        poetry.canvasW = windowWidth * CANVASW_FAC; 
        poetry.canvasH = windowHeight * CANVASH_FAC; 
    }
    else
    {
        poetry.canvasW = CANVASW;
        poetry.canvasH = CANVASH;
    }
}

function setup() 
{
    
    let canvas = createCanvas(poetry.canvasW , poetry.canvasH);
    poetry.init();

    // Receive signal from server that
    // a magnet moved
    socket.on('serverBroadcastMagnetMove', (data) =>
    {
        // console.log('I received:', data);

        // Set the position of the magnet
        poetry.magnets[data.index].x = data.x;
        poetry.magnets[data.index].y = data.y;
    });

    // Receive signal from server that
    // it wants to know the data of all
    // magnets
    socket.on('serverAsksForMagnetData', () =>
    {
        console.log('Sending all magnet data');
        for (let i = 0; i < poetry.magnets.length; i++) 
        {
            let data = 
            { 
                index: poetry.magnets[i].index, 
                x: poetry.magnets[i].x, 
                y: poetry.magnets[i].y
            }
            // Make use of the already existing pipe
            socket.emit('clientMagnetMove', data);
        }
    });

    // Receive signal from server that
    // it sending all magnet data
    // from the database
    socket.on('serverSendsDbData', (data) =>
    {
        for (let i = 0; i < data.length; i++) 
        {
            // We can't be sure that data array from the
            // database has the same order as the magnets
            // array. We need to identify each element
            // by its index.
            let index = poetry.magnets.findIndex(obj => 
            {
                return obj.index === data[i].index
            });

            poetry.magnets[index].index = data[i].index;
            poetry.magnets[index].x = data[i].x;
            poetry.magnets[index].y = data[i].y;
        }
    });

    console.log('setup ready');
    socket.emit('clientSetupReady');
}

function draw() 
{
    background(240);
    poetry.update();
}



function windowResized()
{
    if(FLEXIBLE_CANVAS_SIZE)
    {
        poetry.canvasW = windowWidth * CANVASW_FAC; 
        poetry.canvasH = windowHeight * CANVASH_FAC; 
        resizeCanvas(poetry.canvasW, poetry.canvasH);
    }
}


class FridgePoetry
{
    constructor(file)
    {
        this.canvasW = 0;
        this.canvasH = 0;
        this.magnets = [];
        this.words = loadStrings(file);
    }

    init()
    {
        // Load the magnets
        for (let i = 0; i < this.words.length; i++) 
        {
            // Passing the word 
            // and the array index to use as id
            this.magnets.push(new Magnet(this.words[i], i));
        }
        
        // Test case:
        // this.magnets.push(new Magnet('Happy', this.allowCollisions));
        // this.magnets.push(new Magnet('New', this.allowCollisions));
        // this.magnets.push(new Magnet('Year', this.allowCollisions));
    }

    update()
    {
        for (let i = 0; i < this.magnets.length; i++) 
        {
            this.magnets[i].update();
        }
    }
}



class Magnet
{
    constructor(t, i, cw, ch)
    {
        this.text = t;
        this.index = i;

        // higher values
        // mean more in front
        // as they are drawn last
        this.z = -1; 
        
        // For simplicity not constants
        this.borderX = 4;
        this.shadowOffset = 1;

        this.dragged = false;

        this.w = 0;
        this.w_half = 0;
        this.h = 0;
        this.h_half = 0;
        this.x = 0;
        this.y = 0;

        this.setFont();
        this.setPosition();
    }


    setFont()
    {

        let fontSize = poetry.canvasH * 0.018;

        this.h = (fontSize / poetry.canvasH) * 1.25;
        this.h_half = 0.5 * this.h;

        this.w = (textWidth(this.text) / poetry.canvasW) + (this.h_half * 0.7);
        this.w_half = 0.5 * this.w;

        textFont('Gill Sans', fontSize);
        textSize(fontSize);
        textAlign(CENTER, CENTER);

    }

    setPosition()
    {
        this.x = random(this.w_half, 1 - this.w_half);
        this.y = random(this.h_half, 1 - this.h_half);

        // this.z += (this.numberOfCollisions(this.x, this.y) + 1);
    }

    update()
    {
        this.move();
        this.drawMagnet();
    }

    move()
    {
        let x = mouseX / poetry.canvasW;
        let y = mouseY / poetry.canvasH;
        if(mouseIsPressed && this.insideMagnetRect(x, y))
        {
            if(!magnetDragged)
            {
                magnetDragged = true;
                this.dragged = true;
            }
        }
        else if(!mouseIsPressed)
        {
            if(this.dragged)
            {
                this.dragged = false;
                magnetDragged = false;
            }
        }

        if(this.dragged)
        {
            // Constraint possible movements
            // to the canvas size
            if(x > this.w_half && x < 1 - this.w_half) this.x = x;
            if(y > this.h_half && y < 1 - this.h_half) this.y = y;


            // TODO 1: 
            // a. Create a magnet object
            // b. and send it to the server 
            // (emit a signal) 
            let data =
            {
                index: this.index,
                x: this.x,
                y: this.y
            }
            socket.emit('clientMagnetMove', data);
        }
    }

    insideMagnetRect(x, y)
    {
        return (x > this.getLeft() && x < this.getRight() &&
                y > this.getTop() && y < this.getBottom());
    }

    getLeft()
    {
        return (this.x - this.w_half);
    }
    getRight()
    {
        return (this.x + this.w_half);
    }
    getTop()
    {
        return (this.y - this.h_half);
    }
    getBottom()
    {
        return (this.y + this.h_half);
    }


    drawMagnet()
    {
        // Fake Shadow
        fill(0, 0, 0, 100);
        noStroke();
        rect(this.getLeft() * poetry.canvasW + this.shadowOffset, this.getTop() * poetry.canvasH+ this.shadowOffset, this.w* poetry.canvasW+ this.shadowOffset, this.h * poetry.canvasH+ this.shadowOffset);

        // Rectangle Magnet
        fill(255);
        stroke(200);
        rect(this.getLeft() * poetry.canvasW, this.getTop() * poetry.canvasH, this.w* poetry.canvasW, this.h * poetry.canvasH);

        // Text
        this.setFont();
        noStroke();
        fill(0);
        text(this.text, this.x * poetry.canvasW, this.y* poetry.canvasH);
    }
}