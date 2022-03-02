var formatBitLen = function (str) {
		var length = str.length;
		var diff =8-length;
		var str1= str;
		for(var i=0;i<diff;i++){
			str1 = "0"+str1;
		}
		return str1;
};
var parseDateData = function (str) {
	var date = {
		"year" : "20"+parseInt(str.substr(0,2),16),
		"month":  parseInt(str.substr(2,2),16),
		"day"  : parseInt(str.substr(4,2),16),
		"hour" : parseInt(str.substr(6,2),16),
		"minute" :parseInt(str.substr(8,2),16),
		"second": parseInt(str.substr(10,2),16),
	}
	return date;
};
var parseGpsData = function (str) {
	var parsedVal = parseFloat(parseInt(str,16));
	var temp = parsedVal/30000.0;
	var deg = parseInt(temp/60);
	var minute = temp-deg*60;
	var minuteFix = parseFloat(minute.toFixed(4));
	var decimalCoord = deg+minuteFix/60;
	// return decimalCoord.toFixed(4);
	return decimalCoord;
};
function parseCourseData (str) {
	var gpsInfo,gpsPos,gpsLong,gpsLat,gpsCourse;
	var byte1 = str.substr(0,2);
	var byte2 = str.substr(2,2);
	var bit1 = parseInt(byte1,16).toString(2);
	var bit2 = parseInt(byte2,16).toString(2);
	var FormatterdBit1 = formatBitLen(bit1);
	var FormatterdBit2 = formatBitLen(bit2);
	var gpsInfoBit = FormatterdBit1.substr(5,1);
	var gpsPosBit = FormatterdBit1.substr(4,1);
	var gpsLongBit = FormatterdBit1.substr(3,1);
	var gpsLatBit = FormatterdBit1.substr(2,1);
	var gpsCourseBit = FormatterdBit1.substr(1,1)+FormatterdBit1.substr(0,1)+FormatterdBit2;
	if(gpsInfoBit==="0"){
		gpsInfo = "realTimeGps";
	}
	else{
		gpsInfo = "differentialGps"; 
	}
	if(gpsPosBit==="0"){
		gpsPos = false;
	}
	else{
		gpsPos = true; 
	}
	if(gpsLongBit==="0"){
		gpsLong = "east";
	}
	else{
		gpsLong = "west"; 
	}
	if(gpsLatBit==="0"){
		gpsLat = "south";
	}
	else{
		gpsLat = "north"; 
	}

	gpsCourse = parseInt(gpsCourseBit,2).toString(10);
	var data = {
		"gpsInfo" : gpsInfo,
		"gpsPos"  : gpsPos,
		"gpsLong" : gpsLong,
		"gpsLat"  : gpsLat,
		"gpsCourse":gpsCourse
	}
	return data;
};
function parseTerminalData (str) {
	var terminfoBit = parseInt(str,16).toString(2);
	var terminfoFormatted = formatBitLen(terminfoBit);
	// console.log('str', str);
	// console.log('termininfobit', terminfoBit);
	// console.log('terminfomformatted', terminfoFormatted);
	var data = {
	};
	if(terminfoFormatted.substr(0,1)==="1"){
		data["activated"]=true;
	}
	else{
		data["activated"]=false;	
	}
	if(terminfoFormatted.substr(1,1)==="1"){
		data["ACC"]="high";
	}
	else{
		data["ACC"]="low";	
	}
	if(terminfoFormatted.substr(2,1)==="1"){
		data["charge"]=true;
	}
	else{
		data["activated"]=false;	
	}
	if(terminfoFormatted.substr(3,3)==="000"){
		data["type"]="normal";
	}
	else if(terminfoFormatted.substr(3,3)==="001"){
		data["type"]="shock";	
	}
	else if(terminfoFormatted.substr(3,3)==="010"){
		data["type"]="powerCut";	
	}
	else if(terminfoFormatted.substr(3,3)==="011"){
		data["type"]="lowBattery";	
	}
	else if(terminfoFormatted.substr(3,3)==="100"){
		data["type"]="sos";	
	}
	else{
		console.log("not defined in parseterminaldata in functions");
	}
	if(terminfoFormatted.substr(6,1)==="1"){
		data["gpstracking"]=true;
	}
	else{
		data["gpstracking"]=false;	
	}
	if(terminfoFormatted.substr(2,1)==="1"){
		data["oilElec"]=false;
	}
	else{
		data["oilElec"]=true;	
	}
	return data;
}
function parseAlarmData (str) {
	var voltLevel,gsmSignal,lang,voltmsg,gsmMsg,alarmType,alarmMsg,alarmLangCode,alarmLang,termInfoContent;
	voltLevel = parseInt(str.substr(2,2),16).toString(10);
	gsmSignal = parseInt(str.substr(4,2),16).toString(10);
	alarmType = parseInt(str.substr(6,2),16).toString(10);
	alarmLangCode = parseInt(str.substr(8, 2), 16).toString(10);
	termInfoContent = parseTerminalData(str.substr(0, 2));
	switch(voltLevel){
		case "0":
			voltmsg="noPower";
			break;
		case "1":
			voltmsg="extremelyLow";
			break;
		case "2":
			voltmsg="veryLow";
			break;
		case "3":
			voltmsg="low";
			break;
		case "4":
			voltmsg="medium";
			break;
		case "5":
			voltmsg="high";
			break;
		case "6":
			voltmsg="veryHigh";
			break;
	}
	switch(gsmSignal){
		case "0":
			gsmMsg="noSignal";
			break;
		case "1":
			gsmMsg="extremelyWeak";
			break;
		case "2":
			gsmMsg="veryWeak";
			break;
		case "3":
			gsmMsg="good";
			break;
		case "4":
			gsmMsg="strong";
			break;
	}
	switch(alarmType){
		case "0":
			alarmMsg="normal";
			break;
		case "1":
			alarmMsg="sos";
			break;
		case "2":
			alarmMsg="powerCut";
			break;
		case "3":
			alarmMsg="shock";
			break;
		case "4":
			alarmMsg="fenceIn";
			break;
		case "5":
			alarmMsg = "fenceOut";
			break;
	}
	if(alarmLangCode == 1){
		alarmLang = "chinese";
	}
	else{
		alarmLang = "english";
	}
	return {
			"termInfoContent": termInfoContent,
			"voltLevel"		 : voltmsg,
			"gsmSignal" 	 : gsmMsg,
			"alarmLang"		 : {
				"alarmType"	 : alarmMsg,
				"language"	 : alarmLang
			}	
		}
}
function crc16(buf){
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
        //console.log("str "+str);
        str_hex = parseInt(str,16);

        j = (crcX ^ str_hex) & cr1;
        crcX = (crcX >> 8) ^ crcTable[j] ;

        i = i + 2;
    }

    crcX = crcX ^ 0xffff;

    crcX= crcX.toString(16);
    //console.log("crcX - " + crcX);
    if(crcX.length==3){
        crcX="0"+crcX;
    }
    return crcX;
};
exports.hexToString = function (str,n) {
	return str;
};
exports.getLoginResp = function (msgParts) {
	var str = msgParts.start+"05"+msgParts.protocolNumber+msgParts.infoSrNum;
	str+= crc16("05"+msgParts.protocolNumber+msgParts.infoSrNum);
	str+= msgParts.finish;
	//console.log(str+"from getLoginResp");
	return str;
};
exports.parsePingData = function(str){
	var data = {
		"date"			: parseDateData(str.substr(0,12)),
		"GpsSatNum"		: parseInt(str.substr(13,1),16),		
		"latitude"		: parseGpsData(str.substr(14,8)),
		"longitude"		: parseGpsData(str.substr(22,8)),
		"speed"			: parseInt(str.substr(30,2),16),
		"course"		: parseCourseData(str.substr(32,4)),
		"Mcc"			: parseInt(str.substr(36,4),16),
		"Mnc"			: parseInt(str.substr(40,2),16),
		"Lac"			: parseInt(str.substr(42,4),16),
		"CellTowerId"	: parseInt(str.substr(46,6),16)
	};
	console.log(str);
	return data;	
};
exports.getParsedAlarmData = function (str) {
	var data = {
		"date"			: parseDateData(str.substr(0,12)),
		"GpsSatNum"		: parseInt(str.substr(13,1),16),
		"latitude"		: parseGpsData(str.substr(14,8)),
		"longitude"		: parseGpsData(str.substr(22,8)),
		"speed"			: parseInt(str.substr(30,2),16),
		"course"		: parseCourseData(str.substr(32,4)),
		"LbsDataLength"	: str.substr(36,2),
		"Mcc"			: parseInt(str.substr(38,4),16),
		"Mnc"			: parseInt(str.substr(42,2),16),
		"Lac"			: parseInt(str.substr(44,4),16),
		"CellTowerId"	: parseInt(str.substr(48,6),16),
		"alarmData"		: parseAlarmData(str.substr(54,10)) 
	};
	return data;
};
exports.getParsedStatusData = function (str) {
	var data = parseAlarmData(str);
	return data;	
}
