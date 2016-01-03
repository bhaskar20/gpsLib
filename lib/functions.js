/*****************************************
FUNCTIONS 
******************************************/
exports.rad = function(x) {
  return x * Math.PI / 180;
};
exports.hexToString = function (str,n) {
	// converts n hexdigits to string and sends the concated response
	return str;
}
exports.getLoginResp = function (msgParts) {
	var str = msgParts.start+"05"+msgParts.protocolNumber+msgParts.infoSrNum;
	str+= crc16("05"+msgParts.protocolNumber+msgParts.infoSrNum);
	str+= msgParts.finish;
	console.log(str1+"from getLoginResp");
	return str1;
}
exports.get_distance = function(p1, p2) {
	var R = 6378137; // Earth’s mean radius in meter
	var dLat = exports.rad(p2.lat - p1.lat);
	var dLong = exports.rad(p2.lng - p1.lng);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	Math.cos(exports.rad(p1.lat)) * Math.cos(exports.rad(p2.lat)) *
	Math.sin(dLong / 2) * Math.sin(dLong / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d; // returns the distance in meter
};

exports.send = function(socket,msg){
	socket.write(msg);
	console.log("Sending to "+socket.name+": "+msg);
}
exports.parse_gps_data = function(str){
	var data = {
		"date"			: str.substr(0,6),
		"availability"	: str.substr(6,1),
		"latitude"		: gps_minute_to_decimal(parseFloat(str.substr(7,9))),
		"latitude_i"	: str.substr(16,1),
		"longitude"	: gps_minute_to_decimal(parseFloat(str.substr(17,9))),
		"longitude_i"	: str.substr(27,1),
		"speed"			: str.substr(28,5),
		"time"			: str.substr(33,6),
		"orientation"	: str.substr(39,6),
		"io_state"		: str.substr(45,8),
		"mile_post"	: str.substr(53,1),
		"mile_data"	: parseInt(str.substr(54,8),16)
	};
	return data;	
}

exports.send_to = function(socket,cmd,data){
	if(typeof(socket.device_id) == "undefined")throw "The socket is not paired with a device_id yet";
	var str = gps_format.start;
	str += socket.device_id+gps_format.separator+cmd;
	if(typeof(data) != "undefined")str += gps_format.separator+data;
	str += gps_format.end;
	send(socket,str);
	//Example: (<DEVICE_ID>|<CMD>|<DATA>) - separator: | ,start: (, end: )
}

exports.minute_to_decimal = function(pos,pos_i){
	if(typeof(pos_i) == "undefined")pos_i = "N";
	var dg = parseInt(pos/100);
	var minutes = pos-(dg*100);
	var res = (minutes/60)+dg;
	return (pos_i.toUpperCase()=="S" || pos_i.toUpperCase()=="W")?res*-1:res;	
}

// Send a message to all clients
exports.broadcast = function(message, sender) {
	clients.forEach(function (client) {
	  if (client === sender) return;
	  client.write(message);
	});
	process.stdout.write(message+"\n");
}
exports.data_to_hex_array = function(data){
		var arr = [];
		for (var i  = 0; i < data.length; i++)arr.push( data[i].toString(16));
		return arr;
	}
	/* RETRUN AN INTEGER FROM A HEX CHAR OR integer */
exports.hex_to_int = function(hex_char){
	return parseInt(hex_char,16);
}
exports.sum_hex_array = function(hex_array){
	var sum = 0;
	for(var i in hex_array)sum+=exports.hex_to_int(hex_array[i]);
	return sum;
}
exports.hex_array_to_hex_str = function(hex_array){
	var str = "";
	for(var i in hex_array){
		var char;
		if(typeof(hex_array[i]) == "number")char = hex_array[i].toString(16)
		else char = hex_array[i].toString();
		str += exports.str_pad(char,2,'0');
	}
	return str;
}
exports.str_pad = function(input, length, string) {
	string = string || '0'; input = input + '';
	return input.length >= length ? input : new Array(length - input.length + 1).join(string) + input;
}
function crc16(buf)
{

    var crcTable = 
    [
        0X0000, 0X1189, 0X2312, 0X329B, 0X4624, 0X57AD, 0X6536, 0X74BF, 0X8C48, 0X9DC1, 0XAF5A, 
        0XBED3, 0XCA6C, 0XDBE5, 0XE97E, 0XF8F7, 0X1081, 0X0108, 0X3393, 0X221A, 0X56A5, 0X472C, 
        0X75B7, 0X643E, 0X9CC9, 0X8D40, 0XBFDB, 0XAE52, 0XDAED, 0XCB64, 0XF9FF, 0XE876, 0X2102, 
        0X308B, 0X0210, 0X1399, 0X6726, 0X76AF, 0X4434, 0X55BD, 0XAD4A, 0XBCC3, 0X8E58, 0X9FD1, 
        0XEB6E, 0XFAE7, 0XC87C, 0XD9F5, 0X3183, 0X200A, 0X1291, 0X0318, 0X77A7, 0X662E, 0X54B5, 
        0X453C, 0XBDCB, 0XAC42, 0X9ED9, 0X8F50, 0XFBEF, 0XEA66, 0XD8FD, 0XC974, 0X4204, 0X538D, 
        0X6116, 0X709F, 0X0420, 0X15A9, 0X2732, 0X36BB, 0XCE4C, 0XDFC5, 0XED5E, 0XFCD7, 0X8868, 
        0X99E1, 0XAB7A, 0XBAF3, 0X5285, 0X430C, 0X7197, 0X601E, 0X14A1, 0X0528, 0X37B3, 0X263A, 
        0XDECD, 0XCF44, 0XFDDF, 0XEC56, 0X98E9, 0X8960, 0XBBFB, 0XAA72, 0X6306, 0X728F, 0X4014, 
        0X519D, 0X2522, 0X34AB, 0X0630, 0X17B9, 0XEF4E, 0XFEC7, 0XCC5C, 0XDDD5, 0XA96A, 0XB8E3, 
        0X8A78, 0X9BF1, 0X7387, 0X620E, 0X5095, 0X411C, 0X35A3, 0X242A, 0X16B1, 0X0738, 0XFFCF, 
        0XEE46, 0XDCDD, 0XCD54, 0XB9EB, 0XA862, 0X9AF9, 0X8B70, 0X8408, 0X9581, 0XA71A, 0XB693, 
        0XC22C, 0XD3A5, 0XE13E, 0XF0B7, 0X0840, 0X19C9, 0X2B52, 0X3ADB, 0X4E64, 0X5FED, 0X6D76, 
        0X7CFF, 0X9489, 0X8500, 0XB79B, 0XA612, 0XD2AD, 0XC324, 0XF1BF, 0XE036, 0X18C1, 0X0948, 
        0X3BD3, 0X2A5A, 0X5EE5, 0X4F6C, 0X7DF7, 0X6C7E, 0XA50A, 0XB483, 0X8618, 0X9791, 0XE32E, 
        0XF2A7, 0XC03C, 0XD1B5, 0X2942, 0X38CB, 0X0A50, 0X1BD9, 0X6F66, 0X7EEF, 0X4C74, 0X5DFD, 
        0XB58B, 0XA402, 0X9699, 0X8710, 0XF3AF, 0XE226, 0XD0BD, 0XC134, 0X39C3, 0X284A, 0X1AD1, 
        0X0B58, 0X7FE7, 0X6E6E, 0X5CF5, 0X4D7C, 0XC60C, 0XD785, 0XE51E, 0XF497, 0X8028, 0X91A1, 
        0XA33A, 0XB2B3, 0X4A44, 0X5BCD, 0X6956, 0X78DF, 0X0C60, 0X1DE9, 0X2F72, 0X3EFB, 0XD68D, 
        0XC704, 0XF59F, 0XE416, 0X90A9, 0X8120, 0XB3BB, 0XA232, 0X5AC5, 0X4B4C, 0X79D7, 0X685E, 
        0X1CE1, 0X0D68, 0X3FF3, 0X2E7A, 0XE70E, 0XF687, 0XC41C, 0XD595, 0XA12A, 0XB0A3, 0X8238, 
        0X93B1, 0X6B46, 0X7ACF, 0X4854, 0X59DD, 0X2D62, 0X3CEB, 0X0E70, 0X1FF9, 0XF78F, 0XE606, 
        0XD49D, 0XC514, 0XB1AB, 0XA022, 0X92B9, 0X8330, 0X7BC7, 0X6A4E, 0X58D5, 0X495C, 0X3DE3, 
        0X2C6A, 0X1EF1, 0X0F78
    ];


    crcX = parseInt("FFFF",16);
    cr1 = parseInt("FF",16);
    cr2 = parseInt("FFFF",16);
    i = 0;

    while(i < buf.length)
    {
        str = buf.substring(i,i+2);
        console.log("str "+str);
        str_hex = parseInt(str,16);

        j = (crcX ^ str_hex) & cr1;
        crcX = (crcX >> 8) ^ crcTable[j] ;

        i = i + 2;
    }

    crcX = crcX ^ 0xffff;

    crcX= crcX.toString(16);
    console.log("crcX - " + crcX);
    if(crcX.length==3){
        crcX="0"+crcX;
    }
    return crcX;
}