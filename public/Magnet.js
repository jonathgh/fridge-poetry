/***********************************************************
 * Magnet.js
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

        this.w = textWidth(this.text) + (this.h_half * 0.8);
        this.w_half = 0.5 * this.w;

        textFont('Gill Sans', fontSize);
        textSize(fontSize);
        textAlign(CENTER, CENTER);

    }

    setPosition()
    {
        this.x = round(random(this.w_half, CANVASW - this.w_half));
        this.y = round(random(this.h_half, CANVASH - this.h_half));
    }

    update()
    {
        this.move();
        this.drawMagnet();
    }

    move()
    {

        if(mouseIsPressed && this.insideMagnetRect(mouseX, mouseY))
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
            if(mouseX > this.w_half && mouseX < CANVASW - this.w_half) this.x = round(mouseX);
            if(mouseY > this.h_half && mouseY < CANVASH - this.h_half) this.y = round(mouseY);


            // TODO 6: 
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
        rect(this.getLeft() + this.shadowOffset, this.getTop() + this.shadowOffset, this.w + this.shadowOffset, this.h + this.shadowOffset);

        // Rectangle Magnet
        fill(255);
        stroke(200);
        rect(this.getLeft(), this.getTop(), this.w, this.h);

        // Text
        this.setFont();
        noStroke();
        fill(0);
        text(this.text, this.x, this.y);
    }
}
