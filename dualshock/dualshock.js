module.exports = function(RED) {
  var dualShockLib = require('./../src/dualshock.js');
  var timeoutVar = null;

  console.log('init-node');
  function dualShock(config) {
    console.log('create-node');
    RED.nodes.createNode(this, config);
    var node = this;
    var controller = null;

    function subscribe(controller) {
        //make sure you add an error event handler
      controller.on('error', err => {
        console.log(err);
        node.status({
          fill: "red",
          shape: "ring",
          text: "disconnected"
        });
        timeoutVar = setTimeout(connect.bind(node), 2000);
      });

      //DualShock 4 control rumble and light settings for the controller
      controller.setExtras({
        rumbleLeft:  40,   // 0-255 (Rumble left intensity)
        rumbleRight: 0,   // 0-255 (Rumble right intensity)
        red:         0,   // 0-255 (Red intensity)
        green:       75,  // 0-255 (Blue intensity)
        blue:        225, // 0-255 (Green intensity)
        flashOn:     40,  // 0-255 (Flash on time)
        flashOff:    10   // 0-255 (Flash off time)
      });

      //add event handlers:
      controller.on('left:move', data => node.send({ payload: { left: data } }));
      controller.on('right:move', data => node.send({ payload: { right: data } }));
      controller.on('buttons', data => node.send({ payload: data }));
      controller.on('sticks', data => node.send({ payload: data }));

      //sixasis motion events:
      //the object returned from each of the movement events is as follows:
      //{
      //    direction : values can be: 1 for right, forward and up. 2 for left, backwards and down.
      //    value : values will be from 0 to 120 for directions right, forward and up and from 0 to -120 for left, backwards and down.
      //}

      //DualShock 4 TouchPad
      //finger 1 is x1 finger 2 is x2
      controller.on('touchpad:x1:active', () => console.log('touchpad one finger active'));
      controller.on('touchpad:x2:active', () => console.log('touchpad two fingers active'));
      controller.on('touchpad:x2:inactive', () => console.log('touchpad back to single finger'));
      controller.on('touchpad:x1', data => console.log('touchpad x1:', data.x, data.y));
      controller.on('touchpad:x2', data => console.log('touchpad x2:', data.x, data.y));

      //right-left movement
      controller.on('rightLeft:motion', data => console.log(data));
      //forward-back movement
      controller.on('forwardBackward:motion', data => console.log(data));
      //up-down movement
      controller.on('upDown:motion', data => console.log(data));

      //controller status
      //as of version 0.6.2 you can get the battery %, if the controller is connected and if the controller is charging
      controller.on('battery:change', data => console.log(data));
      controller.on('connection:change', data => console.log(data));
      controller.on('charging:change', data => console.log(data));
    }

    function connect() {
      try {
        controller = dualShockLib({
            config: "dualShock4-v2",
            logging: false,
            accelerometerSmoothing: true,
            analogStickSmoothing: true
        });
  
        node.status({
          fill: "green",
          shape: "dot",
          text: "connected"
        });

        subscribe(controller);
      } catch (err) {
        // console.error(err);
        node.status({
          fill: "red",
          shape: "ring",
          text: "disconnected"
        });
        timeoutVar = setTimeout(connect.bind(node), 2000);
      }
    }

    this.on('close', function(removed, done) {
        if (controller) {
          controller.disconnect();
          controller = null;
          if (timeoutVar) {
            clearTimeout(timeoutVar);
          }
        }
        done();
    });

    if (timeoutVar) {
      clearTimeout(timeoutVar);
    }
    connect();
  }

  RED.nodes.registerType("dualShock", dualShock);
}