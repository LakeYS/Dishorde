/*jshint esversion: 6 */
/*jshint evil:true */

////// # Requirements and Initialization # //////
const pjson = require('./package.json');

console.log("7DTD Discord Integration v" + pjson.version);

const Discord = require('discord.js');
const client = new Discord.Client();
const minimist = require('minimist');
const semver = require('semver-compare');
const https = require('https');

var telnet = require('telnet-client');
connection = new telnet();

doReconnect = 1;

waitingForTime = 0;
waitingForVersion = 0;
waitingForPlayers = 0;
receivedData = 0;

// Client status: 0 = Error/Offline, 1 = Online
clientStatus = 0;

// Connection initialized?
connectionInitialized = 0;

////// # Version Check # //////
var options = {
  host: 'api.github.com',
  path: '/repos/LakeYS/7DTD-Discord/releases/latest',
  method: 'GET',
  headers: {'user-agent':'7DTD-Discord-Integration'}
};

var input = "";
json = "";
var request = https.request(options, (res) => {
  res.on('data', (data) => {
    input = input + data; // Combine the data
  });
  res.on('error', (err) => {
    console.log(err);
  });
  res.on('uncaughtException', (err) => {
    console.log(err);
  });

  // Note that if there is an error while parsing the JSON data, the bot will crash.
  res.on('end', function() {
    if(input !== undefined) {
      json = JSON.parse(input.toString());
      if(json.tag_name !== undefined) {
        release = json.tag_name.replace("v",""); // Mark the release

        // Compare this build's version to the latest release.
        var releaseRelative = semver(pjson.version, release);

        if(releaseRelative == 1)
          console.log("********\nNOTICE: You are currently running v" + pjson.version + ". This build is considered unstable.\nCheck here for the latest stable versions of this script:\nhttps://github.com/LakeYS/7DTD-Discord/releases\n********");

        if(releaseRelative == -1)
          console.log("********\nNOTICE: You are currently running v" + pjson.version + ". A newer version is available.\nCheck here for the latest version of this script:\nhttps://github.com/LakeYS/7DTD-Discord/releases\n********");
        } else {
          console.log(json);
          console.log("ERROR: Unable to parse version data.");
        }
      }
    else {
      console.log(input); // Log the input on error
      console.log("ERROR: Unable to parse version data.");
    }
  });
});

request.end();
process.nextTick(() => {
  request.on('error', (err) => {
    console.log(err);
    console.log("ERROR: Unable to query version data.");
  });
});

////// # Arguments # //////
// We have to treat the channel ID as a string or the number will parse incorrectly.
argv = minimist(process.argv.slice(2), {string: ['channel','port']});

// This is a simple check to see if we're using arguments or the config file.
// If the user is using arguments, config.json is ignored.
if(Object.keys(argv).length > 2)
  config = argv;
else
{
  configFile = "./config.json";

  if(argv.configfile !== undefined) {
    var configFile = argv.configfile;
  }

  config = require(configFile);
}

// IP
// This argument allows you to run the bot on a remote network.
// For debugging purposes only.
if(typeof config.ip === 'undefined')
  ip = "localhost";
else
  ip = config.ip;

// Port
if(typeof config.port === 'undefined')
  port = 8081; // If no port, default to 8081
else
  port = parseInt(config.port);

// Telnet Password
if(typeof config.password === 'undefined') {
  console.log("ERROR: No telnet password specified!");
  process.exit();
}
pass = config.password;

// Discord token
if(typeof config.token === 'undefined') {
  console.log("ERROR: No Discord token specified!");
  process.exit();
}
token = config.token;

// Discord channel
if(typeof config.channel === 'undefined') {
  console.log("ERROR: No Discord channel specified!");
  process.exit();
}
channelid = config.channel.toString();

////// # Discord # //////
client.login(token);

client.on('ready', () => {
  clientStatus = 0;

  console.log('Connected to ' + client.guilds.size + ' Discord servers.');
  client.user.setGame("No connection");
  client.user.setStatus('dnd');

  channel = client.channels.find("id", channelid);

  if(!channel)
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
  if(event.code != 1000) {
    console.log("Discord client disconnected with reason: " + event.reason + " (" + event.code + "). Attempting to reconnect in 6s...");
    setTimeout(function(){ client.login(token); }, 6000);
  }
});

client.on('error', function(err) {
  console.log("Discord client error '" + err.code + "'. Attempting to reconnect in 6s...");

  client.destroy();
  setTimeout(function(){ client.login(config.token); }, 6000);
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
  var cmd = msg.toString().toUpperCase().replace("7DTD!", "");

  // 7dtd!info
  if(cmd == "INFO" || cmd == "I" || cmd == "HELP" || cmd == "H")
  {
    msg.author.send("**Info:** This bot relays chat messages to and from a 7 Days to Die server. Commands are accepted in DMs as well.\nRunning v" + pjson.version + "\n**Source code:** https://github.com/LakeYS/7DTD-Discord");

    if(config["disable-commands"] !== 'true')
      msg.author.send("**Commands:** 7dtd!info, 7dtd!time, 7dtd!version");
  }

  if(config["disable-commands"] !== 'true') {
    // 7dtd!time
    if(cmd == "TIME" || cmd == "T" || cmd == "DAY") {
      connection.exec("gettime", function(err, response) {
        // Sometimes the "response" has more than what we're looking for.
        // We have to double-check and make sure the correct line is returned.

        if(response !== undefined) {
          var lines = response.split("\n");
          receivedData = 0;
          for(var i = 0; i <= lines.length-1; i++) {
            var line = lines[i];
            if(line.startsWith("Day")) {
              receivedData = 1;

              handleTime(line, msg);
            }
          }
        }

        // Sometimes, the response doesn't have the data we're looking for...
        if(!receivedData) {
          waitingForTime = 1;
          waitingForTimeMsg = msg;
        }
      });
    }

    // 7dtd!version
    if(cmd == "VERSION" || cmd == "V") {
      connection.exec("version", function(err, response) {
        // Sometimes the "response" has more than what we're looking for.
        // We have to double-check and make sure the correct line is returned.
        if(response !== undefined) {
          var lines = response.split("\n");
          receivedData = 0;
          for(var i = 0; i <= lines.length-1; i++) {
            var line = lines[i];
            if(line.startsWith("Game version:")) {
              msg.reply(line);
              receivedData = 1;
            }
          }
        }

        if(!receivedData) {
          waitingForVersion = 1;
          waitingForVersionMsg = msg;
        }
      });
    }

    // 7dtd!players
    if(cmd == "PLAYERS" || cmd == "P" || cmd == "PL" || cmd == "LP") {
      connection.exec("lp", function(err, response) {
        // Sometimes the "response" has more than what we're looking for.
        // We have to double-check and make sure the correct line is returned.

        if(response !== undefined) {
          var lines = response.split("\n");
          receivedData = 0;
          for(var i = 0; i <= lines.length-1; i++) {
            var line = lines[i];
            if(line.startsWith("Total of ")) {
              receivedData = 1;

              handlePlayerCount(line, msg);
            }
            // TODO: Add code to detect player listing
          }
        }

        // Sometimes, the response doesn't have the data we're looking for...
        if(!receivedData) {
          waitingForPlayers = 1;
          waitingForPlayersMsg = msg;
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
  }


  for(var i = 0; i <= lines.length-1; i++) {
    //console.log("*LINE" + " " + i + " " + lines[i]);
    var line = lines[i];

    // This is a workaround for responses not working properly, particularly on local connections.
    if(waitingForTime && line.startsWith("Day")) {
      handleTime(line, waitingForTimeMsg);
    }
    else if(waitingForVersion && line.startsWith("Game version:")) {
      waitingForVersionMsg.reply(line);
    }
    else if(waitingForPlayers && line.startsWith("Total of ")) {
      waitingForPlayersMsg.reply(line);
    }
    else
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

  if((config["disable-chatmsgs"] !== 'true' && type == "Chat:") || (config["disable-gmsgs"] !== 'true' && type == "GMSG:")) {
    // Make sure the channel exists.
    if(channel !== null) {
      // Cut off the timestamp and other info
      var msg = split[4];
      for(var i = 5; i <= split.length-1; i++)
        msg = msg + " " + split[i];

      if(config["log-messages"] == 'true')
        console.log(msg);

      // When using a local connection, messages go through as new data rather than a response.
      // This string check is a workaround for that.
      if(msg.startsWith("'Server': ["))
        return;

      // Convert it to Discord-friendly text.
      msg = msg.replace("'","").replace("'","");

      if(config["hide-prefix"] == 'true')
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

function handleTime(line, msg) {
  var day = line.split(",")[0].replace("Day ","");
  var dayHorde = (parseInt(day / 7) + 1) * 7 - day;

  msg.reply(line + "\n" + dayHorde + " days to next horde.");
}

function handlePlayerCount(line, msg) {
  msg.reply(line);
}

////// # Console Input # //////
process.stdin.on('data', function (text) {
  if(text.toString() == "stop\r\n" || text.toString() == "exit\r\n" || text.toString() == "stop\n" || text.toString() == "exit\n")
    process.exit();
  else if(text.toString() == "help\r\n" || text.toString() == "help\n")
    console.log("This is the console for the Discord bot. It currently only accepts JavaScript commands for advanced users. Type 'exit' to shut it down.");
  else
  {
    try {
      eval(text.toString());
    }
    catch(err) {
      console.log(err);
    }
  }
});

process.on('exit',  () => {
  doReconnect = 0;
  client.destroy();
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log("Unhandled rejection: '" + err.code + "'. Attempting to reconnect...");
  client.destroy();
  setTimeout(function(){ client.login(token); }, 6000);
});
