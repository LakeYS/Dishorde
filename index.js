////// # Requirements and Initialization # //////
const pjson = require("./package.json");

console.log("\x1b[7m# 7DTD Discord Integration v" + pjson.version + " #\x1b[0m");

const minimist = require("minimist");
const https = require("https");
const fs = require("fs");

var TelnetClient = require("telnet-client");
const Telnet = new TelnetClient();

var d7dtdState = {};
var channel = void 0;

d7dtdState.doReconnect = 1;

d7dtdState.waitingForTime = 0;
d7dtdState.waitingForVersion = 0;
d7dtdState.waitingForPlayers = 0;
//d7dtdState.waitingForPref = 0;
d7dtdState.receivedData = 0;

d7dtdState.skipVersionCheck = 0;

// Connection initialized?
d7dtdState.connInitialized = 0;

// Connection status
// -1 = Error, 0 = No connection/connecting, 1 = Online, -100 = Override or N/A (value is ignored)
d7dtdState.connStatus = -100;

////// # Arguments # //////
// We have to treat the channel ID as a string or the number will parse incorrectly.
var argv = minimist(process.argv.slice(2), {string: ["channel","port"]});

// This is a simple check to see if we're using arguments or the config file.
// If the user is using arguments, config.json is ignored.
var config;
var configFile;
if(Object.keys(argv).length > 2) {
  config = argv;
  console.log("********\nWARNING: Configuring the bot with arguments is no-longer supported and may not work correctly. Please consider using config.json instead.\nThe arguments must be removed from run.bat/run.sh in order for the config file to take effect.\n********");
}
else {
  configFile = "./config.json";

  if(typeof argv.configFile !== "undefined") {
    configFile = argv.configFile;
  }

  config = require(configFile);
}

// IP
// This argument allows you to run the bot on a remote network.
var ip;
if(typeof config.ip === "undefined") {
  ip = "localhost";
}
else {
  ip = config.ip;
}

// Port
var port;
if(typeof config.port === "undefined") {
  port = 8081; // If no port, default to 8081
}
else {
  port = parseInt(config.port);
}

// Telnet Password
if(typeof config.password === "undefined") {
  console.error("\x1b[31mERROR: No telnet password specified!\x1b[0m");
  process.exit();
}
var pass = config.password;

// Discord token
if(typeof config.token === "undefined") {
  console.error("\x1b[31mERROR: No Discord token specified!\x1b[0m");
  process.exit();
}
var token = config.token;

// Discord channel
var skipChannelCheck;
if(typeof config.channel === "undefined" || config.channel === "channelid") {
  console.warn("\x1b[33mWARNING: No Discord channel specified! You will need to set one with 'setchannel #channelname'\x1b[0m");
  skipChannelCheck = 1;
}
else {
  skipChannelCheck = 0;
}
var channelid = config.channel.toString();

// Prefix
var prefix;
if(typeof config.prefix !== "string") {
  prefix = "7dtd!";
}
else {
  prefix = config.prefix.toUpperCase();
}

// Load the Discord client
const Discord = require("discord.js");
const client = new Discord.Client();

// 7dtd!exec command
if(config["allow-exec-command"] === true) {
  console.warn("\x1b[33mWARNING: Config option 'allow-exec-command' is enabled. This may pose a security risk for your server.\x1b[0m");
}

////// # Version Check # //////
if(!config["disable-version-check"]) {
  // If, for whatever reason, semver-compare isn't installed, we'll skip the version check.
  var semver;
  try {
    semver = require("semver-compare");
  } catch(err) {
    if(err.code === "MODULE_NOT_FOUND") {
      console.warn("********\nWARNING: semver-compare module not found. The version check will be skipped.\nMake sure to keep the bot up-to-date! Check here for newer versions:\nhttps://github.com/LakeYS/7DTD-Discord/releases\n********");
      d7dtdState.skipVersionCheck = 1;
    }
    else {
      throw(err);
    }
  }

  if(!d7dtdState.skipVersionCheck) {
    var options = {
      host: "api.github.com",
      path: "/repos/LakeYS/7DTD-Discord/releases/latest",
      method: "GET",
      headers: {"user-agent":"7DTD-Discord-Integration"}
    };

    var input = "";
    var json = "";
    var request = https.request(options, (res) => {
      res.on("data", (data) => {
        input = input + data; // Combine the data
      });
      res.on("error", (err) => {
        console.log(err);
      });
      res.on("uncaughtException", (err) => {
        console.log(err);
      });

      // Note that if there is an error while parsing the JSON data, the bot will crash.
      res.on("end", () => {
        if(typeof input !== "undefined") {
          json = JSON.parse(input.toString());
          if(typeof json.tag_name !== "undefined") {
            var release = json.tag_name.replace("v",""); // Mark the release

            // Compare this build"s version to the latest release.
            var releaseRelative = semver(pjson.version, release);

            if(releaseRelative === 1) {
              console.log("********\nNOTICE: You are currently running\x1b[1m v" + pjson.version + "\x1b[0m. This build is considered unstable.\nCheck here for the latest stable versions of this script:\n\x1b[1m https://github.com/LakeYS/7DTD-Discord/releases \n\x1b[0m********");
            }

            if(releaseRelative === -1) {
              console.log("********\nNOTICE: You are currently running\x1b[1m v" + pjson.version + "\x1b[0m. A newer version is available.\nCheck here for the latest version of this script:\n\x1b[1m https://github.com/LakeYS/7DTD-Discord/releases \n\x1b[0m********");
            }
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
      request.on("error", (err) => {
        console.log(err);
        console.warn("WARNING: Unable to query version data.");
      });
    });
  }
}

////// # Functions # //////
function handleMsgFromGame(line) {
  var split = line.split(" ");
  var type = split[3];

  if((!config["disable-chatmsgs"] && type === "Chat:") || (!config["disable-gmsgs"] && type === "GMSG:")) {
    // Make sure the channel exists.
    if(channel !== null) {
      // Cut off the timestamp and other info
      var msg = split[4];
      for(var i = 5; i <= split.length-1; i++) {
        msg = msg + " " + split[i];
      }

      if(config["log-messages"]) {
        console.log(msg);
      }

      // When using a local connection, messages go through as new data rather than a response.
      // This string check is a workaround for that.
      if(msg.startsWith("'Server': [")) {
        return;
      }

      // Convert it to Discord-friendly text.
      msg = msg.replace("'","").replace("'","").replace("\n","");

      if(type === "GMSG:") {
        // Remove join and leave messages.
        if(msg.endsWith("the game") && config["disable-join-leave-gmsgs"]) {
          return;
        }

        // Remove other global messages (player deaths, etc.)
        if(!msg.endsWith("the game") && config["disable-misc-gmsgs"]) {
          return;
        }
      }

      if(!config["hide-prefix"])
      {
        // Do nothing if the prefix "/" is in the message.
        if(msg.includes(": /")) {
          return;
        }
      }

      channel.send(msg);
    }
  }
}

function handleMsgToGame(line) {
  // TODO: Ensure connection is valid before executing commands
  if(!config["disable-chatmsgs"]) {
    Telnet.exec("say \"" + line + "\"", (err, response) => {
      if(err) {
        console.log("Error while attempting to send message: " + err.message);
      }
      else {
        var lines = response.split("\n");
        for(var i = 0; i <= lines.length-1; i++) {
          var line = lines[i];
          handleMsgFromGame(line);
        }
      }
    });
  }
}

function handleTime(line, msg) {
  var day = line.split(",")[0].replace("Day ","");
  var dayHorde = (parseInt(day / 7) + 1) * 7 - day;

  msg.channel.send(`${line}\n${dayHorde} day${dayHorde===1?"":"s"} to next horde.`);
}

function handlePlayerCount(line, msg) {
  msg.channel.send(line);
}

////// # Discord # //////

// updateDiscordStatus
// NOTE: This function will 'cache' the current status to avoid re-sending it.
// If you want to forcibly re-send the same status, set 'd7dtdState.connStatus' to -100 first.
function updateDiscordStatus(status) {
  if(!config["disable-status-updates"]) {
    if(status === 0 && d7dtdState.connStatus !== 0) {
      client.user.setActivity(`Connecting... | Type ${prefix}info`);
      client.user.setStatus("dnd");
    } else if(status === -1 && d7dtdState.connStatus !== -1) {
      client.user.setActivity(`Error | Type ${prefix}help`);
      client.user.setStatus("dnd");
    } else if(status === 1 && d7dtdState.connStatus !== 1) {
      if(typeof config.channel === "undefined" || config.channel === "channelid") {
        client.user.setActivity(`No channel | Type ${prefix}setchannel`);
        client.user.setStatus("idle");
      }
      else {
        client.user.setActivity(`7DTD | Type ${prefix}help`);
        client.user.setStatus("online");
      }
    }

    // Update the status so we don't keep sending duplicates to Discord
    d7dtdState.connStatus = status;
  }
}

function refreshDiscordStatus() {
  var status = d7dtdState.connStatus;
  d7dtdState.connStatus = -100;
  updateDiscordStatus(status);
}

// This function prevent's the bot's staus from showing up as blank.
function d7dtdHeartbeat() {
  var status = d7dtdState.connStatus;
  d7dtdState.connStatus = -100;
  updateDiscordStatus(status);

  d7dtdState.timeout = setTimeout(() => {
    d7dtdHeartbeat();
  }, 3.6e+6); // Heartbeat every hour
}

function parseDiscordCommand(msg, mentioned) {
  var cmd = msg.toString().toUpperCase().replace(prefix, "");

  // 7dtd!setchannel
  if(cmd.startsWith("SETCHANNEL")) {
    if(msg.channel.type === "text" && channel !== null?(msg.member.permissions.has("MANAGE_GUILD") && msg.guild === channel.guild):1) {
      console.log("User " + msg.author.tag + " (" + msg.author.id + ") executed command: " + cmd);
      var str = msg.toString().toUpperCase().replace(prefix + "SETCHANNEL ", "");
      var id = str.replace("<#","").replace(">","");

      // If blank str, use active channel.
      var channelobj;
      if(id === prefix + "SETCHANNEL") {
        channelobj = msg.channel;
      }
      else {
        channelobj = client.channels.find("id", id);
      }

      if(channel !== null && channelobj.id === channel.id && typeof d7dtdState.setChannelError == "undefined") {
        msg.channel.send(":warning: This channel is already set as the bot's active channel!");
        return;
      }

      if(channelobj !== null) {
        channel = channelobj;
        channelid = channel.id;

        config.channel = channelid;

        fs.writeFile(configFile, JSON.stringify(config, null, "\t"), "utf8", (err) => {
          if(err) {
            console.error("Failed to write to the config file with the following err:\n" + err + "\nMake sure your config file is not read-only or missing.");
            msg.channel.send(":warning: Channel set successfully to <#" + channelobj.id + "> (" + channelobj.id + "), however the configuration has failed to save. The configured channel will not save when the bot restarts. See the bot's console for more info.");
            d7dtdState.setChannelError = err;
          }
          else {
            d7dtdState.setChannelError = void 0;
            msg.channel.send(":white_check_mark: The channel has been successfully set to <#" + channelobj.id + "> (" + channelobj.id + ")");
          }
        });

        refreshDiscordStatus();
      }
      else {
        msg.channel.send(":x: Failed to identify the channel you specified.");
      }
    }
    else {
      msg.author.send("You do not have permission to do this. (setchannel)");
    }
  }

  // 7dtd!exec
  // This command must be explicitly enabled due to the security risks of allowing it.
  if(config["allow-exec-command"] === true)
  {
    if(cmd.startsWith("EXEC")) {
      if(msg.channel.type === "text" && msg.member.permissions.has("MANAGE_GUILD") && msg.guild === channel.guild) {
        console.log("User " + msg.author.tag + " (" + msg.author.id + ") executed command: " + cmd);
        var execStr = msg.toString().replace(new RegExp(prefix + "EXEC", "ig"), "");
        Telnet.exec(execStr);
      }
      else {
        msg.author.send("You do not have permission to do this. (exec)");
      }
    }
  }

  // The following commands only work in the specified channel if one is set.
  if(msg.channel === channel || msg.channel.type === "dm") {
    // 7dtd!info
    if(cmd === "INFO" || cmd === "I" || cmd === "HELP" || cmd === "H" || mentioned) {
      // -1 = Error, 0 = No connection/connecting, 1 = Online, -100 = Override or N/A (value is ignored)
      var statusMsg;
      switch(d7dtdState.connStatus) {
      case -1:
        statusMsg = ":red_circle: Error";
        break;
      case 0:
        statusMsg = ":white_circle: Connecting...";
        break;
      case 1:
        statusMsg = ":large_blue_circle: Online";
        break;
      }

      var cmdString = "";
      if(!config["disable-commands"]) {
        var pre = prefix.toLowerCase();
        cmdString = `\n**Commands:** ${pre}info, ${pre}time, ${pre}version, ${pre}players`;
      }


      var string = `Server connection: ${statusMsg}${cmdString}\n\n*7DTD-Discord v${pjson.version} - http://lakeys.net/discord7dtd - Powered by discord.js ${pjson.dependencies["discord.js"].replace("^","")}.*`;
      msg.channel.send({embed: {
        description: string
      }})
        .catch(() => {
          // If the embed fails, try sending without it.
          msg.channel.send(string);
        });
    }

    // The following commands only work if disable-commands is OFF. (includes above conditions)
    if(!config["disable-commands"]) {

      // 7dtd!time
      if(cmd === "TIME" || cmd === "T" || cmd === "DAY") {
        Telnet.exec("gettime", (err, response) => {
          // Sometimes the "response" has more than what we're looking for.
          // We have to double-check and make sure the correct line is returned.

          if(typeof response !== "undefined") {
            var lines = response.split("\n");
            d7dtdState.receivedData = 0;
            for(var i = 0; i <= lines.length-1; i++) {
              var line = lines[i];
              if(line.startsWith("Day")) {
                d7dtdState.receivedData = 1;
                handleTime(line, msg);
              }
            }
          }

          // Sometimes, the response doesn't have the data we're looking for...
          if(!d7dtdState.receivedData) {
            d7dtdState.waitingForTime = 1;
            d7dtdState.waitingForTimeMsg = msg;
          }
        });
      }

      // 7dtd!version
      if(cmd === "VERSION" || cmd === "V") {
        Telnet.exec("version", (err, response) => {
          // Sometimes the "response" has more than what we're looking for.
          // We have to double-check and make sure the correct line is returned.
          if(typeof response !== "undefined") {
            var lines = response.split("\n");
            d7dtdState.receivedData = 0;
            for(var i = 0; i <= lines.length-1; i++) {
              var line = lines[i];
              if(line.startsWith("Game version:")) {
                msg.channel.send(line);
                d7dtdState.receivedData = 1;
              }
            }
          }

          if(!d7dtdState.receivedData) {
            d7dtdState.waitingForVersion = 1;
            d7dtdState.waitingForVersionMsg = msg;
          }
        });
      }

      // 7dtd!players
      if(cmd === "PLAYERS" || cmd === "P" || cmd === "PL" || cmd === "LP") {
        Telnet.exec("lp", (err, response) => {
          // Sometimes the "response" has more than what we're looking for.
          // We have to double-check and make sure the correct line is returned.

          if(typeof response !== "undefined") {
            var lines = response.split("\n");
            d7dtdState.receivedData = 0;
            for(var i = 0; i <= lines.length-1; i++) {
              var line = lines[i];
              if(line.startsWith("Total of ")) {
                d7dtdState.receivedData = 1;

                handlePlayerCount(line, msg);
              }
            }
          }

          // Sometimes, the response doesn't have the data we're looking for...
          if(!d7dtdState.receivedData) {
            d7dtdState.waitingForPlayers = 1;
            d7dtdState.waitingForPlayersMsg = msg;
          }
        });
      }

      //if(cmd === "PREF") {
      //  Telnet.exec("getgamepref", (err, response) => {
      //    var str = msg.toString().toUpperCase().replace(prefix + "PREF ", "").replace(prefix + "PREF", "");
      //    // Sometimes the "response" has more than what we're looking for.
      //    // We have to double-check and make sure the correct line is returned.
      //    if(typeof response !== "undefined") {
      //      var lines = response.split("\n");
      //      d7dtdState.receivedData = 0;

      //      final = "";
      //      for(var i = 0; i <= lines.length-1; i++) {
      //        var line = lines[i];
      //        if(line.startsWith("GamePref.")) {
      //          final = final + "\n" + line.replace("GamePref.","");
      //          d7dtdState.receivedData = 1;
      //        }
      //      }
      //      msg.author.send(final);
      //      msg.channel.send("Server configuration has been sent to you via DM.");
      //      // TODO: Make sure user can receive DMs before sending
      //    }

      //    if(!d7dtdState.receivedData) {
      //      d7dtdState.waitingForPref = 1;
      //      d7dtdState.waitingForPrefMsg = msg;
      //    }
      //  });
      //}
    }
  }
}

////// # Telnet # //////
var params = {
  host: ip,
  port,
  timeout: 15000,
  username: "",
  password: pass,

  passwordPrompt: /Please enter password:/i,
  shellPrompt: /\r\n$/,

  debug: false,
};

// If Discord auth is skipped, we have to connect now rather than waiting for the Discord client.
if(config["skip-discord-auth"]) {
  Telnet.connect(params);
}

Telnet.on("ready", () => {
  console.log("Connected to game. (" +  Date() + ")");

  if(!config["skip-discord-auth"]) {
    updateDiscordStatus(1);
  }
});

Telnet.on("failedlogin", () => {
  console.log("Login to game failed! (" +  Date() + ")");
  process.exit();
});

Telnet.on("close", () => {
  console.log("Connection to game closed.");

  // If there is no error, update status to 'No connection'
  if(d7dtdState.connStatus !== -1) {
    updateDiscordStatus(0);
  }

  if(d7dtdState.doReconnect) {
    Telnet.end(); // Just in case
    setTimeout(() => { Telnet.connect(params); }, 5000);
  }
});

Telnet.on("data", (data) => {
  data = data.toString();
  var lines = data.split("\n");

  if(config["log-telnet"]) {
    console.log("[Telnet] " + data);
  }

  // Error catchers for password re-prompts
  if(data === "Please enter password:\r\n\u0000\u0000") {
    console.log("ERROR: Received password prompt!");
    process.exit();
  }

  if(data === "Password incorrect, please enter password:\r\n") {
    console.log("ERROR: Received password prompt! (Telnet password is incorrect)");
    process.exit();
  }

  for(var i = 0; i <= lines.length-1; i++) {
    //console.log("*LINE" + " " + i + " " + lines[i]);
    var line = lines[i];

    //console.log("LINE: " + line);

    var split = line.split(" ");

    if(split[2] === "INF" && split[3] === "[NET]" && split[4] === "ServerShutdown\r") {
      // If we don't destroy the connection, crashes will happen when someone types a message.
      // This is a workaround until better measures can be put in place for sending data to the game.
      console.log("The server has shut down. Closing connection...");
      Telnet.destroy();

      channel.send({embed: {
        color: 14164000,
        description: "The server has shut down."
      }})
        .catch(() => {
        // Try re-sending without the embed if an error occurs.
          channel.send("**The server has shut down.**")
            .catch((err) => {
              console.log("Failed to send message with error: " + err.message);
            });
        });
    }

    // This is a workaround for responses not working properly, particularly on local connections.
    if(d7dtdState.waitingForTime && line.startsWith("Day")) {
      handleTime(line, d7dtdState.waitingForTimeMsg);
    }
    else if(d7dtdState.waitingForVersion && line.startsWith("Game version:")) {
      d7dtdState.waitingForVersionMsg.channel.send(line);
    }
    else if(d7dtdState.waitingForPlayers && line.startsWith("Total of ")) {
      d7dtdState.waitingForPlayersMsg.channel.send(line);
    }
    //else if(d7dtdState.waitingForPref && line.startsWith("GamePref.")) {
    //  d7dtdState.waitingForPrefMsg.channel.send(line);
    //}
    else {
      handleMsgFromGame(line);
    }
  }
});

Telnet.on("error", (data) => {
  console.log("An error occurred while connecting to the game.");
  console.log(data);
  //d7dtdState.lastTelnetErr = data.message;

  updateDiscordStatus(-1);
});

var firstLogin;
if(!config["skip-discord-auth"]) {
  client.login(token);

  client.on("ready", () => {
    if(firstLogin !== 1) {
      firstLogin = 1;
      console.log("Discord client connected successfully.");

      // Set the initial status and begin the heartbeat timer.
      d7dtdState.connStatus = 0;
      d7dtdHeartbeat();
    }
    else {
      console.log("Discord client re-connected successfully.");

      // When the client reconnects, we have to re-establish the status.
      refreshDiscordStatus();
    }


    if(client.guilds.size === 0) {
      console.log("\x1b[31m********\nWARNING: The bot is currently not in a Discord server. You can invite it to a guild using this invite link:\nhttps://discordapp.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot\n********\x1b[0m");
    }

    if(client.guilds.size > 1) {
      console.log("\x1b[31m********\nWARNING: The bot is currently in more than one guild. Please type 'leaveguilds' in the console to clear the bot from all guilds.\nIt is highly recommended that you verify 'Public bot' is UNCHECKED on this page:\n\x1b[1m https://discordapp.com/developers/applications/me/" + client.user.id + " \x1b[0m\n\x1b[31m********\x1b[0m");
    }

    channel = client.channels.find("id", channelid);

    if(!channel && !skipChannelCheck) {
      console.log("\x1b[33mERROR: Failed to identify channel with ID '" + channelid + "'\x1b[0m");
    }

    // Wait until the Discord client is ready before connecting to the game.
    if(d7dtdState.connInitialized !== 1) {
      d7dtdState.connInitialized = 1; // Make sure we only do this once
      Telnet.connect(params);
    }
  });

  client.on("disconnect", (event) => {
    if(event.code !== 1000) {
      console.log("Discord client disconnected with reason: " + event.reason + " (" + event.code + "). Attempting to reconnect in 6s...");
      setTimeout(() => { client.login(token); }, 6000);
    }
  });

  client.on("error", (err) => {
    console.log(err);
    console.log("Discord client error '" + err.code + "'. Attempting to reconnect in 6s...");

    client.destroy();
    setTimeout(() => { client.login(config.token); }, 6000);
  });

  client.on("message", (msg) => {
    if(msg.author !== client.user) {
      // If the bot is mentioned, pass through as if the user typed 7dtd!info
      var mentioned = msg.content.includes("<@" + client.user.id + ">");

      if(msg.content.toUpperCase().startsWith(prefix) || mentioned) {
        parseDiscordCommand(msg, mentioned);
      }
      else if(msg.channel === channel && msg.channel.type === "text") {
        msg = "[" + msg.author.username + "] " + msg.cleanContent;
        handleMsgToGame(msg);
      }
    }
  });
}

////// # Console Input # //////
process.stdin.on("data", (text) => {
  if(text.toString() === "stop\r\n" || text.toString() === "exit\r\n" || text.toString() === "stop\n" || text.toString() === "exit\n") {
    process.exit();
  }
  else if(text.toString() === "help\r\n" || text.toString() === "help\n") {
    console.log("This is the console for the Discord bot. It currently only accepts JavaScript commands for advanced users. Type 'exit' to shut it down.");
  }
  else if(text.toString() === "leaveguilds\r\n" || text.toString() === "leaveguilds\n") {
    client.guilds.forEach((guild) => {
      console.log("Leaving guild \"" + guild.name + "\"");
      guild.leave();
    });
    console.log("Left all guilds. Use this link to re-invite the bot: \n\x1b[1m https://discordapp.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot \x1b[0m");
  }
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

process.on("exit",  () => {
  d7dtdState.doReconnect = 0;

  if(!config["skip-discord-auth"]) {
    client.destroy();
  }
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  if(!config["skip-discord-auth"]) {
    console.log("Unhandled rejection: '" + err.code + "'. Attempting to reconnect...");
    client.destroy();
    setTimeout(() => { client.login(token); }, 6000);
  }
});
