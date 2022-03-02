module.exports = require('./lib/main');
const main = require('./lib/main');
var mysql = require('mysql');
const collect = require('collect.js');

var conDB = mysql.createConnection({
    host: '127.0.0.1',
    user: 'vino',
    password: 'vino#2022',
    database: 'test'
});

const options = {
    debug: true,
    port: 94,
    device_adapter: 'GT06',
};

main.server(options,(device, connection) => {
    console.log(device);
    device.on("login_request", function(device_id, msg_parts){
        this.login_authorized(true, msg_parts);
    });
    device.on("ping", function(data){
        console.log(data);
        let imei = this.getUID();
        conDB.query(`INSERT INTO location(imei, location, created_at) VALUES ('${imei}','${JSON.stringify(data)}', NOW())`);
        return data;
    })
    device.on("status", function(data){
        let imei = this.getUID();
        conDB.query(`INSERT INTO status(imei, status, created_at) VALUES ('${imei}','${JSON.stringify(data)}', NOW())`);
        return data;
    })
    device.on("alarm", function(data){
        console.log(data);
        return data;
    })
});
