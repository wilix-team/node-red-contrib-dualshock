'use strict';
// Module dependencies.
var dsutilities = require('./utilities'),
    Smoothing = require('./smoothing'),
    config = require('./config');

//Proccess Analog stick events.
var Analogs = function(controller) {

    var varianceThreshhold = 1,
        smoothInput = config.getOptions().analogStickSmoothing,
        outputSmoothing = new Smoothing(smoothInput),
        analogSticks = config.getControllerConfig().analogSticks;

    //Private methods
    var processStick = function(analogStick, data) {
        var currentValue = {
                x: data[analogStick.x],
                y: data[analogStick.y]
            },
            previousValue = {
                x: outputSmoothing.readLastPosition(analogStick.name + 'x'),
                y: outputSmoothing.readLastPosition(analogStick.name + 'y')
            };

        //we only raise an event if both
        if (dsutilities.isWithinVariance(previousValue.x, currentValue.x, varianceThreshhold) ||
            dsutilities.isWithinVariance(previousValue.y, currentValue.y, varianceThreshhold)) {

            currentValue.x = outputSmoothing.smooth(analogStick.name + 'x', currentValue.x);
            currentValue.y = outputSmoothing.smooth(analogStick.name + 'y', currentValue.y);
            return { changed: true, x: currentValue.x, y: currentValue.y };
        }
        return { changed: false, x: currentValue.x, y: currentValue.y };
    };
    
    // Public methods
    //process all the analog events.
    var prevHasResult = false;

    this.process = function(data) {
        var result = {};
        var hasResult = false;
        for (var i = 0; i < analogSticks.length; i++) {
            result[analogSticks[i].name] = processStick(analogSticks[i], data);
            if (result[analogSticks[i].name].changed) {
                hasResult = true;
            }
        }
        if (hasResult) {
            controller.emit('sticks', result);
            prevHasResult = true;
        }
        if (prevHasResult && !hasResult) {
            controller.emit('sticks', result);
            prevHasResult = false;
        }
    };
};

module.exports = Analogs;
