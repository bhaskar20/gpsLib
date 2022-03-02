const collect = require('collect.js');
const mysql = require('mysql');
const fs = require('fs');

var con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'vino',
    password: 'vino#2022',
    database: 'test'
});

var data = false;
var latlng  = [];
var content = false;

con.connect(function (err) {
    if (err) throw err;
    data = con.query(`SELECT * FROM location WHERE created_at BETWEEN '2022-03-02' AND '2022-03-03'`, function (err, result, fields) {
        if (err) throw err;
        data = collect(result).sortByDesc('created_at').all();
        // console.log(data);        
        data.forEach((element, index, array) => {            
            let parsed = JSON.parse(element.location);
            latlng.push([parsed.longitude,parsed.latitude])
        });
        content = `{
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "type": "LineString",
                  "coordinates": ${JSON.stringify(latlng)}
                }
              }
            ]
          }`;
        fs.writeFile('file.geojson', content, function(err){
            if (err) throw err;
            console.log('berhasil membuat file');
        });
    });
});