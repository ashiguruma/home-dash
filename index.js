var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var http = require('http');

var doc = new GoogleSpreadsheet('1pSr6GwDHmQMpJDWvA43q9IUgkAaSt1lqbCdMYqARIA4');
var sheet;
var data = [];

//Lets define a port we want to listen to
const PORT=8080;

//We need a function which handles requests and send response
function handleRequest(request, response){
  async.series([
    function setAuth(step) {
      // see notes below for authentication instructions!
      var creds = require('./.gapi.json');

      doc.useServiceAccountAuth(creds, step);
    },
    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        console.log('Loaded doc: '+info.title+' by '+info.author.email);

        sheet = info.worksheets[0];
        console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
        step();
      });
    },
    function workingWithRows(step) {
      // google provides some query options
      sheet.getRows({
        offset: 1,
        limit: 25,
        orderby: 'Category'
      }, function( err, rows ){
        console.log('Read '+rows.length+' rows');

        rows.forEach(function(row) {
          data.push({
            'category': row.category,
            'budget': Number(row.budget.replace(/£|,/gi, '')),
            'spend': Number(row.spend.replace(/£|,/gi, ''))
          });
        });

        step();
      });
    },
    function returnData() {
      response.setHeader('Access-Control-Allow-Origin', 'http://localhost:8000');
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(data));
    }
  ]);
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
