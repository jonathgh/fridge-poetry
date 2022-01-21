/***********************************************************
 * sketch.js
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

"use strict";

const s = (sketch) => 
{

    // TODO 5
    let socket = io();

    const CANVASW = 1024; 
    const CANVASH = 512; 


    // Not the prettiest setup 
    // with global variables
    // and no explicit namespace
    // but super easy to use
    let fridge;
    let magnetDragged;

    sketch.preload = () => 
    {
        fridge = new Fridge('./data/text/wordkit_happiness.txt'); //~200 words

        // Keep in mind that to have to clear the database before switching these
        // fridge = new Fridge('./data/text/wordkit_original.txt'); //~300 words
        // fridge = new Fridge('./data/text/wordkit_bigwords.txt'); //~160 words
        // fridge = new Fridge('./data/text/wordkit_awesome.txt'); //~200 words

    }

    sketch.setup = () => 
    { 

        
        let canvas = sketch.createCanvas(CANVASW , CANVASH);
        fridge.init();


        // TODO 9
        // Receive signal from server that
        // a magnet moved
        socket.on('serverBroadcastMagnetMove', (data) =>
        {
            console.log('I received:', data);

            // Set the position of the magnet
            fridge.magnets[data.index].x = data.x;
            fridge.magnets[data.index].y = data.y;
        });

        // TODO 15
        // Receive signal from server that
        // it wants to know the data of all
        // magnets
        socket.on('serverAsksForMagnetData', () =>
        {
            console.log('Sending all magnet data');
            for (let i = 0; i < fridge.magnets.length; i++) 
            {
                let data = 
                { 
                    index: fridge.magnets[i].index, 
                    x: fridge.magnets[i].x, 
                    y: fridge.magnets[i].y
                }
                // Make use of the already existing pipe
                socket.emit('clientMagnetMove', data);
            }
        });

        // TODO 18
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
                let index = fridge.magnets.findIndex(obj => 
                {
                    return obj.index === data[i].index
                });

                fridge.magnets[index].index = data[i].index;
                fridge.magnets[index].x = data[i].x;
                fridge.magnets[index].y = data[i].y;
            }
        });

        // TODO 12
        socket.emit('clientSetupReady');
    }

    sketch.draw = () =>  
    {
        sketch.background(240);
        fridge.update();
    }





    // Class which holds
    // all magnet objects
    class Fridge
    {
        constructor(file)
        {
            this.canvasW = 0;
            this.canvasH = 0;
            this.magnets = [];
            this.words = sketch.loadStrings(file);
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
        constructor(t, i)
        {
            this.text = t;
            this.index = i;

            // x,y define the center
            // of the magnet
            this.x = 0;
            this.y = 0;

            this.dragged = false;

            this.w = 0;
            this.w_half = 0;
            this.h = 0;
            this.h_half = 0;

            // For simplicity not constant
            this.shadowOffset = 1;

            this.setFont();
            this.setPosition();
        }


        setFont()
        {

            let fontSize = CANVASH * 0.02;

            this.h = fontSize * 1.3;
            this.h_half = 0.5 * this.h;

            this.w = sketch.textWidth(this.text) + (this.h_half * 0.8);
            this.w_half = 0.5 * this.w;

            sketch.textFont('Gill Sans', fontSize);
            sketch.textSize(fontSize);
            sketch.textAlign(sketch.CENTER, sketch.CENTER);

        }

        setPosition()
        {
            this.x = sketch.random(this.w_half, CANVASW - this.w_half);
            this.y = sketch.random(this.h_half, CANVASH - this.h_half);
        }

        update()
        {
            this.move();
            this.drawMagnet();
        }

        move()
        {

            if(sketch.mouseIsPressed && this.insideMagnetRect(sketch.mouseX, sketch.mouseY))
            {
                if(!magnetDragged)
                {
                    magnetDragged = true;
                    this.dragged = true;
                }
            }
            else if(!sketch.mouseIsPressed)
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
                if(sketch.mouseX > this.w_half && sketch.mouseX < CANVASW - this.w_half) this.x = sketch.mouseX;
                if(sketch.mouseY > this.h_half && sketch.mouseY < CANVASH - this.h_half) this.y = sketch.mouseY;


                // TODO 6: 
                // 6a. Create a magnet object
                let data =
                {
                    index: this.index,
                    x: this.x,
                    y: this.y
                }
                // 6b. and send it to the server 
                // (emit a signal) 
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
            sketch.fill(0, 0, 0, 100);
            sketch.noStroke();
            sketch.rect(this.getLeft() + this.shadowOffset, this.getTop() + this.shadowOffset, this.w + this.shadowOffset, this.h + this.shadowOffset);

            // Rectangle Magnet
            sketch.fill(255);
            sketch.stroke(200);
            sketch.rect(this.getLeft(), this.getTop(), this.w, this.h);

            // Text
            this.setFont();
            sketch.noStroke();
            sketch.fill(0);
            sketch.text(this.text, this.x, this.y);
        }
    }


}
let p5Sketch = new p5(s);

