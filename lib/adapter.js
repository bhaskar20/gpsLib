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
	this.authorize =function(msg_parts){
		console.log(msg_parts+ "from auth");
		loginResp = f.getLoginResp(msg_parts);
		console.log(loginResp);
		this.device.send(loginResp);
	}
	this.run_other = function(cmd,msg_parts){
		switch(cmd){
			case "BP00": //Handshake
				this.device.send(this.format_data(this.device.uid+"AP01HSO"));
				break;
		}
	}
	this.receive_alarm = function(msg_parts){
		//@TODO: implement this
		
		//Maybe we can save the gps data too.
		//gps_data = msg_parts.data.substr(1);
		// alarm_code = msg_parts.data.substr(0,1);
		// alarm = false;
		// switch(alarm_code.toString()){
		// 	case "0":
		// 		alarm = {"code":"power_off","msg":"Vehicle Power Off"};
		// 		break;
		// 	case "1":
		// 		alarm = {"code":"accident","msg":"The vehicle suffers an acciden"};
		// 		break;
		// 	case "2":
		// 		alarm = {"code":"sos","msg":"Driver sends a S.O.S."};
		// 		break;
		// 	case "3":
		// 		alarm = {"code":"alarming","msg":"The alarm of the vehicle is activated"};
		// 		break;
		// 	case "4":
		// 		alarm = {"code":"low_speed","msg":"Vehicle is below the min speed setted"};
		// 		break;
		// 	case "5":
		// 		alarm = {"code":"overspeed","msg":"Vehicle is over the max speed setted"};
		// 		break;
		// 	case "6":
		// 		alarm = {"code":"gep_fence","msg":"Out of geo fence"};
		// 		break;
		// }
		// this.send_comand("AS01",alarm_code.toString());
		// return alarm
	}
	
	
	this.get_ping_data = function(msg_parts){
		var str = msg_parts.infoContent;
		var data = {
			"date"			: str.substr(0,6),
			"availability"	: str.substr(6,1),
			"latitude"		: functions.minute_to_decimal(parseFloat(str.substr(7,9)),str.substr(16,1)),
			"longitude"	: functions.minute_to_decimal(parseFloat(str.substr(17,9)),str.substr(27,1)),
			"speed"			: parseFloat(str.substr(28,5)),
			"time"			: str.substr(33,6),
			"orientation"	: str.substr(39,6),
			"io_state"		: str.substr(45,8),
			"mile_post"	: str.substr(53,1),
			"mile_data"	: parseInt(str.substr(54,8),16)
		};
		var datetime = "20"+data.date.substr(0,2)+"/"+data.date.substr(2,2)+"/"+data.date.substr(4,2);
		datetime += " "+data.time.substr(0,2)+":"+data.time.substr(2,2)+":"+data.time.substr(4,2)
		data.datetime=new Date(datetime);
		res = {
			latitude		: data.latitude,
			longitude		: data.longitude,
			time			: new Date(data.date+" "+data.time),
			speed			: data.speed,
			orientation	: data.orientation,
			mileage			: data.mile_data
		}
		return res;	
	}
	
	/* SET REFRESH TIME */
	this.set_refresh_time = function(interval,duration){
		//XXXXYYZZ
		//XXXX Hex interval for each message in seconds
		//YYZZ Total time for feedback
		//YY Hex hours
		//ZZ Hex minutes
		var hours = parseInt(duration/3600);
		var minutes = parseInt((duration-hours*3600)/60);
		var time = f.str_pad(interval.toString(16),4,'0')+ f.str_pad(hours.toString(16),2,'0')+ f.str_pad(minutes.toString(16),2,'0')
		this.send_comand("AR00",time);
	}
	
	/* INTERNAL FUNCTIONS */
	
	this.send_comand = function(cmd,data){
		var msg = [this.device.uid,cmd,data];
		this.device.send(this.format_data(msg));
	}
	this.format_data = function(params){
		/* FORMAT THE DATA TO BE SENT */
		var str = this.format.start;
		if(typeof(params) == "string"){
			str+=params
		}else if(params instanceof Array){
			str += params.join(this.format.separator);
		}else{
			throw "The parameters to send to the device has to be a string or an array";
		}
		str+= this.format.end;
		return str;	
	}
}
exports.adapter = adapter;
