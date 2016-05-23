// Ring.js
// Eric Huang 
// This is an extension for development and testing of the Scratch Javascript Extension API.

// http://scratchx.org/?url=http://erichuang2013.github.io/ring.js

(function(ext) {
    var device = null;
    var rawData = null;

    // Motor states: power: 0 to 100, dir: -1 or 1
    var motors = [
        {power: 100, dir: 1, isOn: false},
        {power: 100, dir: 1, isOn: false}
    ];
    var motorOffTime = 0;

    // Sensor states:
    var id0 = 0;
    var id1 = 0;
    var weDoDistance = 0;
    var weDoTilt = 0;
    var rgbData = new Uint8Array(9);
    // Commands
 
    ext.resetAll = function() {
	  ext.allOff();
    };
    ext.allOff = function() {
        for(i=0; i<9; i++) rgbData[i] = 0;
        device.write(rgbData.buffer);
    };
    ext.getTilt = function() { return getTilt(); };

    
    
    ext.sendRGBData = function() {
        device.write(rgbData.buffer);
    };
    
    ext.rgbRaw = function(index, data) {
        if(index<1) return;
        index = --index % 8;
        rgbData[index+1] = data;
        device.write(rgbData.buffer);
    }
    
    ext.rgbRGB = function(index, r, g, b) {
        if(index<1) return;
        index = --index % 8;
        data = Math.ceil(r*8*32/10) + Math.ceil(g*8*4/10) + Math.ceil(b*4/10);
        rgbData[index] = data;
        device.write(rgbData.buffer);
    }
    
    var poller = null;
    ext._deviceConnected = function(dev) {
        console.log("_deviceConnected()");
        if(device) return;
        device = dev;
        device.open();
    };

    ext._deviceRemoved = function(dev) {
        console.log("_deviceRemoved()");
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function() {
        console.log("_shutdown()");
        if(poller) poller = clearInterval(poller);
        if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: ' Ring disconnected'};
        return {status: 2, msg: ' Ring connected'};
    }

    var descriptor = {
        blocks: [
            [' ', 'set light:%n raw:%n', 'rgbRaw', '1', '255'],
            [' ', 'set light:%n r %n g %n b %n', 'rgbRGB', '1', '10', '10', '10'],
            [' ', 'turn %m.light on', 'rgbOn', '1'],
            [' ', 'all lights off', 'allOff'],
            ['r', 'tilt',                                   'getTilt']
        ],
        menus: {
            eNe: ['=','not =']
        },
        
	url: 'https://github.com/erichuang2013/'
    };
    ScratchExtensions.register('Ring', descriptor, ext, {type: 'hid', vendor:1684, product:6});
})({});