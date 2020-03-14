'use strict';
// Module dependencies.
var config = require('./config'),
    dsutilities = require('./utilities');

//Proccess button events.
var Buttons = function(controller) {

    var buttons = config.getControllerConfig().buttons;

    // convert strings to numbers, e.g. "0x01" to 0x01
    // must be converted because JSON doesn't allow numbers with leading zeros
    buttons.forEach(function(button) {
        if (typeof button.buttonValue == "string") {
            button.buttonValue = parseInt(button.buttonValue);
        }

        if (typeof button.mask == "string") {
            button.mask = parseInt(button.mask);
        } else if (!(button.mask instanceof Number)) {
            button.mask = 0xFF;
        }

        //generate event name aliases:
        button.eventPrefixes = dsutilities.generateEventPrefixAliases(button.name);
    });

    var buffer = {};

    var processButton = function(button, data) {
        //make sure the data contains a value for the specified block
        //and bitwise operation for the button value

        var block = data[button.buttonBlock] & button.mask;
        var hit = (block & button.buttonValue) == button.buttonValue;
        var value = 0;
        var state = 0; // 0: up, 1: down, 2: hold

        // special case for the dualshock 4's dpadUp button as it causes the
        // lower 8 bits of it's block to be zeroed
        if (!button.buttonValue) {
            hit = !block;
        }

        // special case for dualshock 4's dpad - they are not bitmasked values as
        // they cannot be pressed together - ie. up, left and upleft are three
        // different values - upleft is not equal to up & left
        if (button.buttonBlock == 5 && block < 0x08) {
            hit = block == button.buttonValue;
        }

        if (hit) {
            value = 1;

            //if the button is in the released state.
            if (!buffer[button.name]) {
                state = 1;
                buffer[button.name] = true;
            } else {
                state = 2;
            }

            //send the analog data
            if (button.analogPin && data[button.analogPin]) {
                value = data[button.analogPin];
            }

        } else if (buffer[button.name]) {
            //button was pressed and is not released
            buffer[button.name] = false;
            value = 0;
        }

        return button.analogPin ? value : state;
    };

    // Public methods
    //process all the analog events.
    var prevHasResult = false;

    this.process = function(data) {
        var result = {};
        var hasResult = false;
        for (var i = 0; i < buttons.length; i++) {
            result[buttons[i].name] = processButton(buttons[i], data);
            if (result[buttons[i].name] > 0) {
                hasResult = true;
            }
        }
        if (hasResult) {
            controller.emit('buttons', result);
            prevHasResult = true;
        }
        if (prevHasResult && !hasResult) {
            controller.emit('buttons', result);
            prevHasResult = false;
        }
    };
};

module.exports = Buttons;
