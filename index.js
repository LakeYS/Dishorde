////// # Requirements and Initialization
const Discord = require("discord.js");
const client = new Discord.Client();

var telnet = require('telnet-client');
connection = new telnet();

////// Arguments
// TODO: Replace with proper checks
pass = process.argv[3];
token = process.argv[5];
channelid = process.argv[7].toString();

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
  var data = data.toString();
  var split = data.split(" ");
  var type = split[3];

  if(type == "Chat:")
  {
    // Make sure the channel exists.
    if(channel !== null)
    {
      // Cut off the timestamp and other info
      var msg = data.substring(40,data.length);

      // Convert it to Discord-friendly text.
      msg = msg.replace("'","").replace("'","");

      channel.sendMessage(msg);
      console.log(msg);
    }
  }
});

connection.on('error', function(data) {
  console.log(data);
});

connection.connect(params);

////// # Discord
client.login(token);

client.on("message", msg => {

});

client.on('ready', () => {
  console.log('Connected to ' + client.guilds.size + ' servers.');

  channel = client.channels.find("id","319257907579453440");

  console.log(channel);
  console.log(channelid);
});

client.on('message', function(msg) {
  if(msg.channel == channel && msg.author != client.user)
    channel.sendMessage("WIP: Messages are not sent to the server yet.");
});

////// # Input
process.stdin.on('data', function (text) {
  if(text == "stop\r\n")
    process.exit();
  else
    eval(text.toString());
});

process.on('exit',  () => {
  client.destroy();
});
