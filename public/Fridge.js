/***********************************************************
 * Fridge.js
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

// Class which holds
// all magnet objects
class Fridge
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
    }

    update()
    {
        for (let i = 0; i < this.magnets.length; i++) 
        {
            this.magnets[i].update();
        }
    }
}


