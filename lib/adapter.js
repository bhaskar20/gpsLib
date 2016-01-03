/* */
f = require("./functions.js");

exports.protocol="GT06";
exports.model_name="GT06";
exports.compatible_hardware=["GT06N"];

var adapter = function(device){
	if(!(this instanceof adapter)) return new adapter(device);
	
	this.format = {"start":"7878","end":"0D0A","separator":" "}
	this.device = device;
	this.parse_data = function(data){
		data = data.toString();
		data = data.replace(/\s/g,"");
		var protocolNum = data.substr(6,2);
		var parts={
			"start" 		: data.substr(0,4),
			"packetLength"  : data.substr(4,2),
			"protocolNumber": data.substr(6,2), //mandatory
			"finish" 		: data.substr(data.length-4,4)
		};
		//parts=start,packetLength,protocolNumber,infoContent,infoNum,errorCheck,finish
		switch(parts.protocolNumber){
			case "01":
				this.device.uid= f.hexToString(data.substr(8,16),8);
				parts.action="login_request";
				parts.infoContent = data.substr(8,16);
				parts.infoSrNum = data.substr(24,4);
				parts.errorCheck = data.substr(28,4);	
				break;
			case "12":
				parts.action="ping";
				parts.infoContent = data.substr(8,52);
				parts.infoSrNum = data.substr(60,4);
				parts.errorCheck = data.substr(64,4);	
				break;
			case "16":
				part.action = "alarm";
				parts.infoContent = data.substr(8,64);
				parts.infoSrNum = data.substr(64,4);
				parts.errorCheck = data.substr(68,4);	
				break;
			case "13":
				part.action = "status";
				parts.infoContent = data.substr(8,10);
				parts.infoSrNum = data.substr(18,4);
				parts.errorCheck = data.substr(22,4);
				break;
		}
		return parts;
	}
	this.authorize =function(msgParts){
		console.log(msgParts+ "from auth");
		loginResp = f.getLoginResp(msgParts);
		console.log(loginResp);
		this.device.send(loginResp);
	}
	this.getParsedPingData = function(str){
		var data = f.parseGpsData(str);
		return data;	
	}
	this.sendAlarmResponse = function (msgParts) {
		resp = f.getLoginResp(msgParts);
		console.log(resp);
		this.device.send(resp);
	}
	this.sendStatusResponse = function (msgParts) {
		resp = f.getLoginResp(msgParts);
		console.log(resp);
		this.device.send(resp);
	}
}
exports.adapter = adapter;
