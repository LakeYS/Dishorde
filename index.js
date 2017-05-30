////// # Requirements and Initialization
const Discord = require("discord.js");
const client = new Discord.Client();

var telnet = require('telnet-client');
connection = new telnet();

////// Arguments
pass = process.argv[3]; // Simple temporary check.

////// Telnet
var params = {
  host: '149.56.109.127',
  port: 8081,
  timeout: 32000,
  username: '',
  password: pass,

  passwordPrompt: /Please enter password:/i,
  shellPrompt: /\r\n$/,

  debug: false,
}

//var cmd = 'say "--telnet connected--"';
var cmd = 'version';

connection.on('ready', function(prompt) {
  connection.exec(cmd, function(err, response) {
    console.log(response);
  })
})

connection.on('failedlogin', function(prompt) {
    console.log("login failed!");
})

connection.on('timeout', function() {
  console.log('socket timeout!');
  connection.end();
})

connection.on('close', function() {
  console.log('connection closed');
})

connection.on('data', function(data) {
  console.log(data.toString());
});

connection.on('error', function(data) {
  console.log(data);
});

connection.connect(params);

////// # Input
process.stdin.on('data', function (text) {
  if(text.toString() == "stop\r\n")
    process.exit();
  else
    eval(text.toString());
});
