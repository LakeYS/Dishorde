/*jshint esversion: 6 */
/*jshint evil:true */

////// # Requirements and Initialization # //////
const pjson = require('./package.json');

console.log("\x1b[7m# 7DTD Discord Integration v" + pjson.version + " #\x1b[0m");

const minimist = require('minimist');
const https = require('https');
const fs = require('fs');

var telnet = require('telnet-client');
connection = new telnet();

doReconnect = 1;

waitingForTime = 0;
waitingForVersion = 0;
waitingForPlayers = 0;
//waitingForPref = 0;
receivedData = 0;

skipVersionCheck = 0;

// Client status: 0 = Error/Offline, 1 = Online
clientStatus = 0;

// Connection initialized?
connectionInitialized = 0;

////// # Arguments # //////
// We have to treat the channel ID as a string or the number will parse incorrectly.
argv = minimist(process.argv.slice(2), {string: ['channel','port']});

// This is a simple check to see if we're using arguments or the config file.
// If the user is using arguments, config.json is ignored.
if(Object.keys(argv).length > 2)
  config = argv;
else {
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
  console.error("\x1b[31mERROR: No telnet password specified!\x1b[0m");
  process.exit();
}
pass = config.password;

// Discord token
if(typeof config.token === 'undefined') {
  console.error("\x1b[31mERROR: No Discord token specified!\x1b[0m");
  process.exit();
}
token = config.token;

// Discord channel
if(typeof config.channel === 'undefined' || config.channel == 'channelid') {
  console.warn("\x1b[33mWARNING: No Discord channel specified! You will need to set one with '7dtd!setchannel #channelname'\x1b[0m");
  skipChannelCheck = 1;
}
else
  skipChannelCheck = 0;
channelid = config.channel.toString();

// Load the Discord client
if(config["skip-discord-auth"] !== true) {
  Discord = require('discord.js');
  client = new Discord.Client();
}

////// # Version Check # //////
if(!config['disable-version-check']) {
  // If, for whatever reason, semver-compare isn't installed, we'll skip the version check.
  try {
    semver = require('semver-compare');
  } catch(err) {
    if(err.code == 'MODULE_NOT_FOUND') {
      console.warn("********\nWARNING: semver-compare module not found. The version check will be skipped.\nMake sure to keep the bot up-to-date! Check here for newer versions:\nhttps://github.com/LakeYS/7DTD-Discord/releases\n********");
      skipVersionCheck = 1;
    }
    else
      throw(err);
  }

  if(!skipVersionCheck) {
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
              console.log("********\nNOTICE: You are currently running\x1b[1m v" + pjson.version + "\x1b[0m. This build is considered unstable.\nCheck here for the latest stable versions of this script:\n\x1b[1m https://github.com/LakeYS/7DTD-Discord/releases \n\x1b[0m********");

            if(releaseRelative == -1)
              console.log("********\nNOTICE: You are currently running\x1b[1m v" + pjson.version + "\x1b[0m. A newer version is available.\nCheck here for the latest version of this script:\n\x1b[1m https://github.com/LakeYS/7DTD-Discord/releases \n\x1b[0m********");
            } else {
              console.log(json);
              console.warn("WARNING: Unable to parse version data.");
            }
          }
        else {
          console.log(input); // Log the input on error
          console.warn("WARNING: Unable to parse version data.");
        }
      });
    });

    request.end();
    process.nextTick(() => {
      request.on('error', (err) => {
        console.log(err);
        console.warn("WARNING: Unable to query version data.");
      });
    });
  }
}

////// # Discord # //////
if(config["skip-discord-auth"] !== true) {
  client.login(token);

  client.on('ready', () => {
    clientStatus = 0;

    console.log('Connected to\x1b[1m ' + client.guilds.size + ' \x1b[0mDiscord server(s).');

    if(client.guilds.size == 0)
      console.log("\x1b[31m********\nWARNING: The bot is currently not in a Discord server. You can invite it to a guild using this invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot\n********\x1b[0m");

    client.user.setGame("No connection");
    client.user.setStatus('dnd');

    channel = client.channels.find("id", channelid);

    if(!channel && !skipChannelCheck)
      console.log("\x1b[33mERROR: Failed to identify channel with ID '" + channelid + "'\x1b[0m");

    // Wait until the Discord client is ready before connecting to the game.
    if(connectionInitialized !== 1) {
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
    console.log(err);
    console.log("Discord client error '" + err.code + "'. Attempting to reconnect in 6s...");

    client.destroy();
    setTimeout(function(){ client.login(config.token); }, 6000);
  });

  client.on('message', function(msg) {
    if(msg.author != client.user) {
      if(msg.toString().toUpperCase().startsWith("7DTD!"))
        parseDiscordCommand(msg);
      else if(msg.channel == channel && msg.channel.type == "text") {
        msg = "[" + msg.author.username + "] " + msg.cleanContent;
        handleMsgToGame(msg);
      }
    }
  });
}

function parseDiscordCommand(msg) {
  var cmd = msg.toString().toUpperCase().replace("7DTD!", "");

  // 7dtd!setchannel
  if(cmd.startsWith("SETCHANNEL")) {
    if(msg.member.permissions.has("MANAGE_GUILD")) {
      var str = msg.toString().toUpperCase().replace("7DTD!SETCHANNEL ", "");
      var id = str.replace("<#","").replace(">","");
      var channelobj = client.channels.find("id", id);

      if(channelobj !== null) {
        channel = channelobj;
        channelid = channel.id;

        config.channel = channelid;

        fs.writeFile(configFile, JSON.stringify(config, null, '\t'), "utf8", (err) => {
          if(err) {
            console.error("Failed to write to the config file with the following err:\n" + err + "\nMake sure your config file is not read-only or missing.");
            msg.reply(":warning: Channel set successfully to <#" + channelobj.id + "> (" + channelobj.id + "), however the configuration has failed to save. The configured channel will not save when the bot restarts. See the bot's console for more info.");
          }
          else
            msg.reply(":white_check_mark: The channel has been successfully set to <#" + channelobj.id + "> (" + channelobj.id + ")");
        });
      }
      else
        msg.reply(":x: Failed to identify the channel you specified.");
    }
    else {
      msg.author.send("You do not have permission to do this. (7dtd!setchannel)");
    }
  }

  // The following commands only work in the specified channel if one is set.
  if(msg.channel == channel || msg.channel.type == "dm") {

    // 7dtd!info
    if(cmd == "INFO" || cmd == "I" || cmd == "HELP" || cmd == "H") {

      msg.channel.send("**Info:** This bot relays chat messages to and from a 7 Days to Die server. Commands are accepted in DMs as well.\nRunning v" + pjson.version + "\n**Source code:** https://github.com/LakeYS/7DTD-Discord");

      if(config["disable-commands"] !== 'true')
        msg.channel.send("**Commands:** 7dtd!info, 7dtd!time, 7dtd!version, 7dtd!players");
    }

    // The following commands only work if disable-commands is OFF. (includes above conditions)
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
            }
          }

          // Sometimes, the response doesn't have the data we're looking for...
          if(!receivedData) {
            waitingForPlayers = 1;
            waitingForPlayersMsg = msg;
          }
        });
      }

      //if(cmd == "PREF") {
      //  connection.exec("getgamepref", function(err, response) {
      //    var str = msg.toString().toUpperCase().replace("7DTD!PREF ", "").replace("7DTD!PREF", "");
      //    // Sometimes the "response" has more than what we're looking for.
      //    // We have to double-check and make sure the correct line is returned.
      //    if(response !== undefined) {
      //      var lines = response.split("\n");
      //      receivedData = 0;

      //      final = "";
      //      for(var i = 0; i <= lines.length-1; i++) {
      //        var line = lines[i];
      //        if(line.startsWith("GamePref.")) {
      //          final = final + "\n" + line.replace("GamePref.","");
      //          receivedData = 1;
      //        }
      //      }
      //      msg.author.send(final);
      //      msg.channel.send("Server configuration has been sent to you via DM.");
      //      // TODO: Make sure user can receive DMs before sending
      //    }

      //    if(!receivedData) {
      //      waitingForPref = 1;
      //      waitingForPrefMsg = msg;
      //    }
      //  });
      //}
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

// If Discord auth is skipped, we have to connect now rather than waiting for the Discord client.
if(config["skip-discord-auth"] == true)
  connection.connect(params);

connection.on('ready', function(prompt) {
  console.log("Connected to game. (" +  Date() + ")");

  if(clientStatus === 0 && config["skip-discord-auth"] !== true) {
    client.user.setStatus('online');
    client.user.setGame("[Type '7dtd!info']");
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

    //console.log("LINE: " + line);

    var split = line.split(" ");

    if(split[2] == "INF" && split[3] == "[NET]" && split[4] == "ServerShutdown\r") {
      // If we don't destroy the connection, crashes will happen when someone types a message.
      // This is a workaround until better measures can be put in place for sending data to the game.
      console.log("The server has shut down. Closing connection...");
      connection.destroy();

      channel.send({embed: {
        color: 14164000,
        description: "The server has shut down."
      }});
    }

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
    //else if(waitingForPref && line.startsWith("GamePref.")) {
    //  waitingForPrefMsg.reply(line);
    //}
    else
      handleMsgFromGame(line);
  }
});

connection.on('error', function(data) {
  console.log(data);

  if(clientStatus == 1 && config["skip-discord-auth"] !== true) {
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

      if(config["log-messages"])
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
    var lines = response.split("\n");
    for(var i = 0; i <= lines.length-1; i++) {
      var line = lines[i];
      handleMsgFromGame(line);
    }
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

  if(config["skip-discord-auth"] !== true)
    client.destroy();
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  if(config["skip-discord-auth"] !== true) {
    console.log("Unhandled rejection: '" + err.code + "'. Attempting to reconnect...");
    client.destroy();
    setTimeout(function(){ client.login(token); }, 6000);
  }
});
