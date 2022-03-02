const main = require('./lib/main');
const options = {
    'debug'                 : true,
    'port'                  : 94,
    'device_adapter'        : "GT06"
}
 
main.server(options, function(device, connection){
    console.log(device, connection)
})
console.log(main);