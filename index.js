/*jshint esversion: 6 */
/*jshint evil:true */

////// # Requirements and Initialization # //////
const pjson = require("./package.json");

console.log("7DTD Discord Integration v" + pjson.version);

const Discord = require("discord.js");
const client = new Discord.Client();
const minimist = require('minimist');

var telnet = require('telnet-client');
connection = new telnet();

doReconnect = 1;

// Client status: 0 = Error/Offline, 1 = Online
clientStatus = 0;

// Connection initialized?
connectionInitialized = 0;

////// # Arguments # //////
// We have to treat the channel ID as a string or the number will parse incorrectly.
argv = minimist(process.argv.slice(2), {string: ['channel','port']});

// IP
// This argument allows you to run the bot on a remote network.
// For debugging purposes only.
if(typeof argv.ip === 'undefined')
  ip = "localhost";
else
  ip = argv.ip;

// Port
if(typeof argv.port === 'undefined')
  port = 8081; // If no port, default to 8081
else
  port = parseInt(argv.port);

// Telnet Password
if(typeof argv.password === 'undefined') {
  console.log("ERROR: No telnet password specified!");
  process.exit();
}
pass = argv.password;

// Discord token
if(typeof argv.token === 'undefined') {
  console.log("ERROR: No Discord token specified!");
  process.exit();
}
token = argv.token;

// Discord channel
if(typeof argv.channel === 'undefined') {
  console.log("ERROR: No Discord channel specified!");
  process.exit();
}
channelid = argv.channel.toString();

////// # Discord # //////
client.login(token);

client.on('ready', () => {
  clientStatus = 0;

  console.log('Connected to ' + client.guilds.size + ' Discord servers.');
  client.user.setGame("7DTD||Type 7dtd!info");

  channel = client.channels.find("id", channelid);

  if(channel == 'null')
  {
    console.log("Failed to identify channel with ID '" + channelid + "'");
    process.exit();
  }

  // Wait until the Discord client is ready before connecting to the game.
  if(connectionInitialized !== 1)
  {
    connectionInitialized = 1; // Make sure we only do this once
    connection.connect(params);
  }
});

client.on('disconnect', function(event) {
  if(event.code != 1000)
  {
    console.log("Discord client disconnected with reason: " + event.reason + " (" + event.code + "). Attempting to reconnect in 6s...");
    setTimeout(function(){ client.login(token); }, 6000);
  }
});

client.on('message', function(msg) {
  if((msg.channel == channel || msg.channel.type == "dm") && msg.author != client.user) {
    if(msg.toString().toUpperCase().startsWith("7DTD!"))
      parseDiscordCommand(msg);
    else if(msg.channel.type == "text") {
      msg = "[" + msg.author.username + "] " + msg.cleanContent;
      handleMsgToGame(msg);
    }
  }
});

function parseDiscordCommand(msg) {
  // TODO: Ensure connection is valid before executing commands

  var cmd = msg.toString().toUpperCase().replace("7DTD!", "");

  // 7dtd!info
  if(cmd == "INFO" || cmd == "I" || cmd == "HELP" || cmd == "H")
  {
    msg.author.send("**Info:** This bot relays chat messages to and from a 7 Days to Die server. Commands are accepted in DMs as well.\n**Source code:** https://github.com/LakeYS/7DTD-Discord");

    if(argv["disable-commands"] !== 'true')
      msg.author.send("**Commands:** 7dtd!info, 7dtd!time, 7dtd!version");
  }

  if(argv["disable-commands"] !== 'true') {
    // 7dtd!time
    if(cmd == "TIME" || cmd == "T" || cmd == "DAY") {
      connection.exec("gettime", function(err, response) {
        // Sometimes the "response" has more than what we're looking for.
        // We have to double-check and make sure the correct line is returned.

        var lines = response.split("\n");
        for(var i = 0; i <= lines.length-1; i++) {
          var line = lines[i];
          if(line.startsWith("Day")) {
            var day = line.split(",")[0].replace("Day ","");
            var dayHorde = (parseInt(day / 7) + 1) * 7 - day;

            msg.reply(line + "\n" + dayHorde + " days to next horde.");
          }
        }
      });
    }

    // 7dtd!version
    if(cmd == "VERSION" || cmd == "V") {
      connection.exec("version", function(err, response) {
        // Sometimes the "response" has more than what we're looking for.
        // We have to double-check and make sure the correct line is returned.
        var lines = response.split("\n");
        for(var i = 0; i <= lines.length-1; i++) {
          var line = lines[i];
          if(line.startsWith("Game version:"))
            msg.reply(line);
        }
      });
    }
  }
}

////// # Telnet # //////
params = {
  host: ip,
  port: port,
  timeout: 15000,
  username: '',
  password: pass,

  passwordPrompt: /Please enter password:/i,
  shellPrompt: /\r\n$/,

  debug: false,
};

connection.on('ready', function(prompt) {
  console.log("Connected to game. (" +  Date() + ")");

  if(clientStatus === 0) {
    client.user.setStatus('online');
    client.user.setGame("7DTD||Type 7dtd!info");
    clientStatus = 1;
  }
});

connection.on('failedlogin', function(prompt) {
    console.log("Login to game failed! (" +  Date() + ")");
});

connection.on('timeout', function() {
  //console.log('Connection to game timed out. This is normal if the server is empty. Ignoring...');
  //connection.end();
  //setTimeout(function(){ connection.connect(params); }, 5000);
});

connection.on('close', function() {
  console.log('Connection to game closed.');

  if(doReconnect) {
    connection.end(); // Just in case
    setTimeout(function(){ connection.connect(params); }, 5000);
  }
});

connection.on('data', function(data) {
  data = data.toString();
  var lines = data.split("\n");

  // Error catcher for password re-prompt
  if(data == "Please enter password:\r\n\u0000\u0000") {
    console.log("ERROR: Received password prompt!");
    process.exit();
    //connection.exec(pass);
  }


  for(var i = 0; i <= lines.length-1; i++) {
    //console.log("*LINE" + " " + i + " " + lines[i]);
    var line = lines[i];

    handleMsgFromGame(line);
  }
});

connection.on('error', function(data) {
  //console.log(data);
  console.log("Connection to game FAILED with error: " + data.code);

  if(clientStatus == 1) {
    client.user.setGame("Error||Type 7dtd!info");
    client.user.setStatus('dnd');
    clientStatus = 0;
  }
});

////// # Functions # //////
function handleMsgFromGame(line) {
  var split = line.split(" ");
  var type = split[3];

  if((argv["disable-chatmsgs"] !== 'true' && type == "Chat:") || (argv["disable-gmsgs"] !== 'true' && type == "GMSG:")) {
    // Make sure the channel exists.
    if(channel !== null) {
      // Cut off the timestamp and other info
      var msg = split[4];
      for(var i = 5; i <= split.length-1; i++)
        msg = msg + " " + split[i];

      // Convert it to Discord-friendly text.
      msg = msg.replace("'","").replace("'","");

      if(argv["hide-prefix"] == 'true')
      {
        // Do nothing if the prefix '/' is in the message.
        if(msg.includes(": /"))
          return;
      }

      channel.send(msg);
    }
  }
}

function handleMsgToGame(line) {
  // TODO: Ensure connection is valid before executing commands
  connection.exec("say \"" + line + "\"", function(err, response) {
    // Empty
  });
}

////// # Console Input # //////
process.stdin.on('data', function (text) {
  if(text.toString() == "stop\r\n" || text.toString() == "exit\r\n" || text.toString() == "stop\n" || text.toString() == "exit\n")
    process.exit();
  else if(text.toString() == "help\r\n" || text.toString() == "help\n")
    console.log("This is the console for the Discord bot. It currently only accepts JavaScript commands for advanced users. Type 'exit' to shut it down.");
  else
    eval(text.toString());
});

process.on('exit',  () => {
  doReconnect = 0;
  client.destroy();
});

process.on('uncaughtException', (err) => {
  console.log(err);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log("Unhandled rejection: '" + err.code + "'. Attempting to reconnect...");
  client.destroy();
  setTimeout(function(){ client.login(token); }, 6000);
});
