// wedoExtension.js
// Shane M. Clements, January 2014
// LEGO WEDO Scratch Extension
//
// This is an extension for development and testing of the Scratch Javascript Extension API.

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

    // Commands
 
    ext.resetAll = function() {
	  ext.allMotorsOff('a');
    };
    ext.startMotorPower = function(motor, power) {
	switch(motor) {
	    case "motor":
		setMotorPower('m', 0, power);
		setMotorPower('m', 1, power);
		setMotorOn('m', 0, true);
		setMotorOn('m', 1, true);
		break;
	    case "motor A":
		setMotorPower('m', 0, power);
		setMotorOn('m', 0, true);
		break;
	    case "motor B":
		setMotorPower('m', 1, power);
		setMotorOn('m', 1, true);
		break;
	    case "lights":
		setMotorPower('l', 0, power);
		setMotorPower('l', 1, power);
		setMotorOn('l', 0, true);
		setMotorOn('l', 1, true);
		break;
	    default:
		setMotorPower('a', 0, power);
		setMotorPower('a', 1, power);
		setMotorOn('a', 0, true);
		setMotorOn('a', 1, true);
	}
    };

  
    // Hat blocks
    ext.whenDistance = function(s, dist) { return device!=null && ('<' == s ? (getDistance() < dist) : (getDistance() > dist)); };
    ext.whenTilt = function(s, tilt) { return device!=null && ('=' == s ? (getTilt() == tilt) : (getTilt() != tilt)); };
    //ext.whenDistanceLessThan = function(dist) { return device!=null && getDistance() < dist; };
    //ext.whenTiltIs = function(tilt) { return device!=null && getTilt() == tilt; };

    // Reporters
    ext.getDistance = function() { return getDistance(); };
    ext.getTilt = function() { return getTilt(); };

    
    var rgbCommand = new Uint8Array(9);
    ext.sendRGBData = function() {
    //function sendRGBData() {
        rgbCommand[2] = 128;
        device.write(rgbCommand.buffer);
    };
    
    
    var poller = null;
    ext._deviceConnected = function(dev) {
        if(device) return;

        device = dev;
        device.open();
        /*
        poller = setInterval(function() {
            device.read(function(data) {
                rawData = data;
            });
        }, 20);
        */
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        //if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function() {
        if(poller) poller = clearInterval(poller);
        if(device) device.close();
        
        device = null;
    };

    ext._getStatus = function() {
        //if(!device) return {status: 1, msg: ' Ring disconnected'};
        return {status: 2, msg: ' Ring connected'};
    }

    var descriptor = {
        blocks: [
            [' ', 'test rgb',                           'sendRGBData'],
            /*
            ['w', 'turn %m.motor on for %n secs',               'motorOnFor',       'motor',1],
            [' ', 'turn %m.motor on',                           'motorOn',          'motor'],
            [' ', 'turn %m.motor off',                          'motorOff',         'motor'],
            [' ', 'set %m.motor power to %n',                   'startMotorPower',  'motor',100],
            [' ', 'set %m.motor2 direction to %m.motorDirection','setMotorDirection','motor','this way'],
            ['h', 'when distance %m.lessMore %n',               'whenDistance',     '<',    20],
            ['h', 'when tilt %m.eNe %n',                        'whenTilt',         '=',    1],
            ['r', 'distance',                                   'getDistance'],
            */
            ['r', 'tilt',                                       'getTilt']
        ],
        menus: {
            motor: ['motor', 'motor A', 'motor B', 'lights', 'everything'],
	    motor2: ['motor', 'motor A', 'motor B', 'all motors'],
            motorDirection: ['this way', 'that way', 'reverse'],
            lessMore: ['<', '>'],
            eNe: ['=','not =']
        },
	url: '/info/help/studio/tips/ext/LEGO WeDo/'
    };
    ScratchExtensions.register('Ring', descriptor, ext, {type: 'hid', vendor:1684, product:6});
})({});