util			= require('util');
EventEmitter	= require('events').EventEmitter;
net				= require('net');
extend			= require('node.extend');
functions		= require('./functions.js');

util.inherits(Device, EventEmitter);
util.inherits(server, EventEmitter);

function server(opts, callback) {
	if (!(this instanceof server))
		return new server(opts, callback);
	EventEmitter.call(this);
	var defaults = {
		debug:						false,
		port:						8080,
		device_adapter:				false
	};

	//Merge default options with user options
	this.opts = extend(defaults, opts);

	var thisServer = this;
	this.devices = [];
	this.db = false;

	this.server = false;
	this.availableAdapters = {
		GT06:		'./adapter.js'
	};

	/****************************
	SOME FUNCTIONS
	*****************************/
	/* */
	this.setAdapter = function(adapter){
		if (typeof adapter.adapter != 'function')
			throw 'The adapter needs an adpater() method to start an instance of it';
		this.device_adapter = adapter;
	};

	this.getAdapter = function() {
		return this.device_adapter;
	};

	this.init = function(cb) {
		//Set debug
		thisServer.setDebug(this.opts.debug);

		/*****************************
		DEVICE ADAPTER INITIALIZATION
		******************************/
		if (thisServer.opts.device_adapter === false)
			throw 'The app don\'t set the device_adapter to use. Which model is sending data to this server?';

		if (typeof thisServer.opts.device_adapter == 'string') {

			//Check if the selected model has an available adapter registered
			if (typeof this.availableAdapters[this.opts.device_adapter] == 'undefined')
				throw 'The class adapter for ' + this.opts.device_adapter + ' doesn\'t exists';

			//Get the adapter
			var adapterFile = (this.availableAdapters[this.opts.device_adapter]);

			this.setAdapter(require(adapterFile));

		}
		thisServer.emit('before_init');
		if (typeof cb == 'function') cb();
		thisServer.emit('init');

		/* FINAL INIT MESSAGE */
		console.log('\n=================================================\nLogiPort GPS LISTENER running at port ' + thisServer.opts.port + '\nEXPECTING DEVICE MODEL:  ' + thisServer.getAdapter().model_name + '\n=================================================\n');
	};

	this.do_log = function (msg,from){
		//If debug is disabled, return false
		if(this.getDebug() === false)return false;

		//If from parameter is not set, default is server.
		if(typeof(from) == "undefined")from = "SERVER";

		msg = "#" + from + ": " + msg;
		console.log(msg);

	};

	/****************************************
	SOME SETTERS & GETTERS
	****************************************/
	this.setDebug = function(val){
		this.debug = (val === true);
	};

	this.getDebug = function(){
		return this.debug;
	};



	//Init app
	this.init(function(){
		/*************************************
		AFTER INITIALIZING THE APP...
		*************************************/
		thisServer.server = net.createServer(function (connection) {
			//Now we are listening!

			//We create an new device and give the an adapter to parse the incomming messages
			connection.device = new Device(thisServer.getAdapter(),connection,thisServer);
			thisServer.devices.push(connection);

			connection.setEncoding('hex');
			//Once we receive data...
			connection.on('data', function (data) {
				connection.device.emit("data",data);
			});

			// Remove the device from the list when it leaves
			// connection.on('end', function () {
			// 	thisServer.devices.splice(thisServer.devices.indexOf(connection), 1);
			// 	connection.device.emit("disconnected");
			// });

			callback(connection.device,connection);

			connection.device.emit('connected');
		}).listen(opts.port);
	});

	/* Search a device by ID */
	this.find_device = function(device_id){
		for(var i in this.devices){
			var dev = this.devices[i].device;
			if(dev.uid == device_id)return dev;
		}
		return false;
	};

	/* SEND A MESSAGE TO DEVICE ID X */
	this.send_to = function(device_id,msg){
		var dev = this.find_device(device_id);
		dev.send(msg);
	};

	return this;
}

function Device(adapter,connection,gps_server){
	/* Inherits EventEmitter class */
	EventEmitter.call(this);

	var this_device 	= this;

	this.connection 	= connection;
	this.server 		= gps_server;
	this.adapter		= adapter.adapter(this);

	this.uid = false;
	this.ip = connection.ip;
	this.port = connection.port;
	this.name = false;
	this.loged = false;


	init();
	function init(){
	}
	this.on("data",function(data) {
		console.log(data + "from device");
		msgParts = this_device.adapter.parse_data(data.toString());
		console.log(msgParts);
		if(msgParts === false) { //something bad happened
			this_device.do_log("The message (" + data + ") can't be parsed. Discarding...");
			return;
		}
		if(typeof(msgParts.protocolNumber) == "undefined")throw "The adapter doesn't return the command (cmd) parameter";
		this_device.make_action(msgParts.action,msgParts);
	});

	this.make_action = function(action, msgParts) {
		switch(action){
			case "login_request":
				this_device.login_request(msgParts);
				break;
			case "ping":
				this_device.ping(msgParts);
				break;
			case "alarm":
				this_device.receiveAlarm(msgParts);
				break;
			case "status":
				this_device.recieveStatus(msgParts);
				break;
		}
	};
	this.login_request = function(msgParts) {
		this_device.do_log("I'm requesting to be loged.");
		this_device.emit("login_request",this.getUID(),msgParts);
	};
	this.login_authorized = function(val, msgParts) {
		if(val){
			this.do_log("Device " + this_device.getUID() + " has been authorized. Welcome!");
			this.loged = true;
			this.adapter.authorize(msgParts);
		}else{
			this.do_log("Device " + this_device.getUID() + " not authorized. Login request rejected");
		}
	};
	this.ping = function(msgParts){
		var gps_data = this.adapter.getParsedPingData(msgParts.infoContent);
		if(gps_data === false){
			//Something bad happened
			this_device.do_log("GPS Data can't be parsed. Discarding packet...");
			return false;
		}
		gps_data.inserted=new Date();
		this_device.emit("ping", gps_data);
	};
	this.receiveAlarm = function(msgParts) {
		var data = f.getParsedAlarmData(msgParts.infoContent);
		this_device.emit("alarm", data, data.alarmData,msgparts);
		this.adapter.sendAlarmResponse(msgParts);
	};
	this.recieveStatus = function (msgParts) {
		var data = f.getParsedStatusData(msgParts.infoContent);
		this_device.emit("status",data,msgParts);
		this.adapter.sendStatusResponse(msgParts);
	}


	this.set_refresh_time = function(interval, duration) {
		this_device.adapter.set_refresh_time(interval, duration);
	};

	/* adding methods to the adapter */
	this.adapter.get_device = function(){
		return device;
	};
	this.send = function(msg){
		this.emit("send_data",msg);
		var buf = new Buffer(msg,'hex');
		this.connection.write(buf);
		this.do_log("Sending to "+this_device.getUID() + ": " + msg);
	};

	this.do_log = function (msg){
		this_device.server.do_log(msg,this_device.getUID());
	};

	this.send_byte_array = function(array){
		this.emit("send_byte_data",array);
		var buff = new Buffer(array);
		console.log(buff);
		this.do_log("Sending to " + this_device.uid + ": <Array: [" + array + "]>");
	};

	/****************************************
	SOME SETTERS & GETTERS
	****************************************/
	this.getName = function(){
		return this.name;
	};
	this.setName = function(name) {
		this.name = name;
	};

	this.getUID = function() {
		return this.uid;
	};
	this.setUID = function(uid) {
		this.uid = uid;
	};

}


exports.server = server;
exports.version = require('../package').version;
