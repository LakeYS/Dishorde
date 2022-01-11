const minimist = require("minimist");
const fs = require("fs");
const pjson = require("./package.json");
const Discord = require("discord.js");
var TelnetClient = require("telnet-client");
const DishordeInitializer = require("./lib/init.js");
const Logger = require("./lib/log.js");

const { Client, Intents } = Discord;
var intents = ["GUILDS", "GUILD_MESSAGES"];

console.log("\x1b[7m# Dishorde v" + pjson.version + " #\x1b[0m");
console.log("NOTICE: Remote connections to 7 Days to Die servers are not encrypted. To keep your server secure, do not run this application on a public network, such as a public wi-fi hotspot. Be sure to use a unique telnet password.\n");

const lineSplit = /\n|\r/g;

var channel = void 0;

var d7dtdState = {
  doReconnect: 1,

  waitingForTime: 0,
  waitingForVersion: 0,
  waitingForPlayers: 0,
  //waitingForPref: 0,
  receivedData: 0,

  skipVersionCheck: 0,

  // Connection initialized?
  connInitialized: 0,

  previousLine: null,
  dataCheck: null,

  // Connection status
  // -1 = Error, 0 = No connection/connecting, 1 = Online
  // -100 = Override or N/A (value is ignored)
  connStatus: -100
};

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

// Logging init
if(config["log-console"]) {
  d7dtdState.logger = new Logger();
}

var telnet = config["demo-mode"]?require("./lib/demoServer.js").client:new TelnetClient();

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
  prefix = "7d!";
}
else {
  prefix = config.prefix.toUpperCase();
}

// Load the Discord client
const client = new Client({
  intents: new Intents(intents),
  retryLimit: 3,
  messageCacheMaxSize: 50
});

// 7d!exec command
if(config["allow-exec-command"] === true) {
  console.warn("\x1b[33mWARNING: Config option 'allow-exec-command' is enabled. This may pose a security risk for your server.\x1b[0m");
}

////// # Init/Version Check # //////
const configPrivate = {
  githubAuthor: "LakeYS",
  githubName: "Dishorde",
  socketPort: 7383
};

new DishordeInitializer(pjson, config, configPrivate);

////// # Functions # //////
function sanitizeMsgFromGame(msg) {
  // Replace @everyone and @here
  msg = msg.replace(/@everyone|@here|<@.*>/g, "`$&`");
  
  if(!config["allow-links-from-game"]) {
    // Filter links
    msg = msg.replace(/https:\/\//g, "https\\://");
    msg = msg.replace(/http:\/\//g, "http\\://");
  }

  return msg;
}

function sanitizeMsgToGame(msg) {
  msg = msg.replace(/"/g, "");
  return msg;
}

function handleMsgFromGame(line) {
  // Nothing to do with empty lines.
  if(line === "") {
    return;
  }

  if(d7dtdState.previousLine === line) {
    console.warn(`WARNING: Caught attempting to send a duplicate line from the game. This line will be skipped. Line: ${line}`);
    d7dtdState.data = ""; // Clear the data cache

    return;
  }

  d7dtdState.previousLine = line;
  
  // Regex for identifying a chat message
  // Ex 1: 2021-09-14T18:14:40 433.266 INF Chat (from '-non-player-', entity id '-1', to 'Global'): 'Server': test
  // Ex 2: 2021-09-14T18:49:39 2532.719 INF GMSG: Player 'Lake' left the game
  // Ex 3: 2021-09-15T20:42:00 1103.462 INF Chat (from '12345678901234567', entity id '171', to 'Global'): 'Lake': the quick brown fox jumps over the lazy dog
  var dataRaw = line.match(/(.+)T(.+) (.+) INF (Chat|GMSG)(.*): (.*)/);
  var content = { name: null, text: null, from: null, to: null, entityId: null };

  if(dataRaw === null) {
    return;
  }

  // Evaluate the source info (i.e. " (from '-non-player-', entity id '-1', to 'Global'): 'Server'") separately because it may not exist.
  // Source info includes the sender name (i.e. 'Server')
  var sourceInfoRaw = dataRaw[5].match(/\(from '(.+)', entity id '(.+)', to '(.+)'\): '(.+)'/);
  if(sourceInfoRaw === null) {
    content.text = dataRaw[6];
  }
  else {
    // We have content info to derive from the source info match
    content.name = sourceInfoRaw[4];
    content.text = dataRaw[6];

    content.from = sourceInfoRaw[1];
    content.to = sourceInfoRaw[3];
    content.entityId = sourceInfoRaw[2];
  }

  var data = {
    date: dataRaw[1],
    time: dataRaw[2],
    type: dataRaw[4],
    content
  };

  if(config["disable-non-player-chatmsgs"] && data.content.from === "-non-player-") { 
    return;
  }

  if((!config["disable-chatmsgs"] && data.type === "Chat") || (!config["disable-gmsgs"] && data.type === "GMSG")) {
    var msg;
    if(data.content.name === null) msg = data.content.text;
    else msg = `${data.content.name}: ${data.content.text}`;

    // Make sure the channel exists.
    if(typeof channel !== "undefined") {
      if(data.type === "Chat") {
        if(data.content.to !== "Global") {
          if(config["show-private-chat"] && data.content.name !== null) {
            msg = `*(Private)* ${data.content.name}: ${data.content.text}`;
          }
          else {
            return;
          }
        }
      }

      if(config["log-messages"] && data.content.name !== null) {
        console.log(msg);
      }

      if(data.type === "GMSG") {
        // Remove join and leave messages.
        if(data.content.text.endsWith("the game") && config["disable-join-leave-gmsgs"]) {
          return;
        }

        // Remove other global messages (player deaths, etc.)
        if(!data.content.text.endsWith("the game") && config["disable-misc-gmsgs"]) {
          return;
        }
      }

      if(config["hide-prefix"])
      {
        // Do nothing if the prefix "/" is in the message.
        if(data.content.text.startsWith("/")) {
          return;
        }
      }

      // Sanitize the resulting message, username included.
      msg = sanitizeMsgFromGame(msg);

      // If we didn't filter the message down to nothing, send it.
      if(msg !== "") {
        channel.send(msg);
      }
    }
  }
}

function handleMsgToGame(line) {
  if(!config["disable-chatmsgs"]) {
    var msg = sanitizeMsgToGame(line);
    telnet.exec("say \"" + msg + "\"", (err, response) => {
      if(err) {
        console.log("Error while attempting to send message: " + err.message);
      }
      else {
        var lines = response.split(lineSplit);
        for(var i = 0; i <= lines.length-1; i++) {
          var lineResponse = lines[i];
          handleMsgFromGame(lineResponse);
        }
      }
    });
  }
}

function handleCmdError(err) {
  if(err) {
    if(err.message === "response not received") {
      channel.send("Command failed because the server is not responding. It may be frozen or loading.");
    }
    else if(err.message === "socket not writable") {
      channel.send("Command failed because the bot is not connected to the server. Type 7d!info to see the current status.");
    }
    else {
      channel.send(`Command failed with error "${err.message}"`);
    }
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
      client.user.setPresence({ 
        activities: [{ name: `Connecting... | Type ${prefix}info` }],
        status: "dnd"
      });
    } else if(status === -1 && d7dtdState.connStatus !== -1) {
      client.user.setPresence({ 
        activities: [{ name: `Error | Type ${prefix}help` }],
        status: "dnd"
      });
    } else if(status === 1 && d7dtdState.connStatus !== 1) {
      if(typeof config.channel === "undefined" || config.channel === "channelid") {
        client.user.setPresence({ 
          activities: [{ name: `No channel | Type ${prefix}setchannel` }],
          status: "idle"
        });
      }
      else {
        client.user.setPresence({ 
          activities: [{ name: `7DTD | Type ${prefix}help` }],
          status: "online"
        });
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

function processTelnetResponse(response, callback) {
  // Sometimes the "response" has more than what we're looking for.
  // We have to double-check and make sure the correct line is returned.
  if(typeof response !== "undefined") {
    var lines = response.split(lineSplit);
    d7dtdState.receivedData = 0;
    for(var i = 0; i <= lines.length-1; i++) {
      callback(lines[i]);
    }
  }
}

function parseDiscordCommand(msg, mentioned) {
  var cmd = msg.toString().toUpperCase().replace(prefix, "");

  if(msg.author.bot === true) {
    return;
  }

  // 7d!setchannel
  if(cmd.startsWith("SETCHANNEL")) {
    var channelExists = (typeof channel !== "undefined");

    if(!channelExists || msg.channel.type !== "text") {
      return;
    }

    if(!msg.member.permissions.has("MANAGE_GUILD") || msg.guild !== channel.guild) {
      msg.author.send("You do not have permission to do this. (setchannel)");
      return;
    }

    console.log("User " + msg.author.tag + " (" + msg.author.id + ") executed command: " + cmd);
    var str = msg.toString().toUpperCase().replace(prefix + "SETCHANNEL ", "");
    var id = str.replace("<#","").replace(">","");

    // If blank str, use active channel.
    var channelobj;
    if(id === prefix + "SETCHANNEL") {
      channelobj = msg.channel;
    }
    else {
      channelobj = client.channels.cache.find((channelobj) => (channelobj.id === id));
    }

    if(typeof channel !== "undefined" && channelobj.id === channel.id && typeof d7dtdState.setChannelError == "undefined") {
      msg.channel.send(":warning: This channel is already set as the bot's active channel!");
      return;
    }

    if(typeof channelobj === "undefined") {
      msg.channel.send(":x: Failed to identify the channel you specified.");
      return;
    }

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

  // 7d!exec
  // This command must be explicitly enabled due to the security risks of allowing it.
  if(cmd.startsWith("EXEC")) {
    if(msg.channel.type !== "text" || !config["allow-exec-command"]) {
      return;
    }

    if(!msg.member.permissions.has("MANAGE_GUILD") || msg.guild !== channel.guild) {
      msg.author.send("You do not have permission to do this. (exec)");
      return;
    }

    console.log("User " + msg.author.tag + " (" + msg.author.id + ") executed command: " + cmd);
    var execStr = msg.toString().replace(new RegExp(prefix + "EXEC", "ig"), "");
    telnet.exec(execStr);
  }

  // The following commands only work in the specified channel if one is set.
  if(msg.channel === channel || msg.channel.type === "dm") {
    // 7d!info
    if(cmd === "INFO" || cmd === "I" || cmd === "HELP" || cmd === "H" || mentioned) {
      // -1 = Error, 0 = No connection/connecting, 1 = Online, -100 = Override or N/A (value is ignored)
      var statusMsg;
      switch(d7dtdState.connStatus) {
      default:
        statusMsg = ":red_circle: Error";
        break;
      case 0:
        statusMsg = ":white_circle: Connecting...";
        break;
      case 1:
        statusMsg = ":green_circle: Online";
        break;
      }

      var cmdString = "";
      if(!config["disable-commands"]) {
        var pre = prefix.toLowerCase();
        cmdString = `\n**Commands:** ${pre}info, ${pre}time, ${pre}version, ${pre}players`;
      }

      var string = `Server connection: ${statusMsg}${cmdString}\n\n*Dishorde v${pjson.version} - Powered by discord.js ${pjson.dependencies["discord.js"].replace("^","")}.*`;
      msg.channel.send({embeds: [{description: string}] })
        .catch((err) => {
          console.log(err);
          // If the embed fails, try sending without it.
          msg.channel.send(string);
        });
    }

    // The following commands only work if disable-commands is OFF. (includes above conditions)
    // TODO: Refactor
    if(!config["disable-commands"]) {
      // 7d!time
      if(cmd === "TIME" || cmd === "T" || cmd === "DAY") {
        telnet.exec("gettime", (err, response) => {
          if(!err) {
            processTelnetResponse(response, (line) => {
              if(line.startsWith("Day")) {
                d7dtdState.receivedData = 1;
                handleTime(line, msg);
              }
            });

            // Sometimes, the response doesn't have the data we're looking for...
            if(!d7dtdState.receivedData) {
              d7dtdState.waitingForTime = 1;
              d7dtdState.waitingForTimeMsg = msg;
            }
          }
          else {
            handleCmdError(err);
          }
        });
      }

      // 7d!version
      if(cmd === "VERSION" || cmd === "V") {
        telnet.exec("version", (err, response) => {
          if(!err) {
            processTelnetResponse(response, (line) => {
              if(line.startsWith("Game version:")) {
                msg.channel.send(line);
                d7dtdState.receivedData = 1;
              }
            });

            if(!d7dtdState.receivedData) {
              d7dtdState.waitingForVersion = 1;
              d7dtdState.waitingForVersionMsg = msg;
            }
          }
          else {
            handleCmdError(err);
          }
        });
      }

      // 7d!players
      if(cmd === "PLAYERS" || cmd === "P" || cmd === "PL" || cmd === "LP") {
        telnet.exec("lp", (err, response) => {
          if(!err) {
            processTelnetResponse(response, (line) => {
              if(line.startsWith("Total of ")) {
                d7dtdState.receivedData = 1;
                handlePlayerCount(line, msg);
              }
            });

            if(!d7dtdState.receivedData) {
              d7dtdState.waitingForPlayers = 1;
              d7dtdState.waitingForPlayersMsg = msg;
            }
          }
          else {
            handleCmdError(err);
          }
        });
      }

      //if(cmd === "PREF") {
      //  Telnet.exec("getgamepref", (err, response) => {
      //    if(!err) {
      //      var str = msg.toString().toUpperCase().replace(prefix + "PREF ", "").replace(prefix + "PREF", "");
      //      // Sometimes the "response" has more than what we're looking for.
      //      // We have to double-check and make sure the correct line is returned.
      //      if(typeof response !== "undefined") {
      //        var lines = response.split(lineSplit);
      //        d7dtdState.receivedData = 0;

      //        final = "";
      //        for(var i = 0; i <= lines.length-1; i++) {
      //          var line = lines[i];
      //          if(line.startsWith("GamePref.")) {
      //            final = final + lineSplit + line.replace("GamePref.","");
      //            d7dtdState.receivedData = 1;
      //          }
      //        }
      //        msg.author.send(final);
      //        msg.channel.send("Server configuration has been sent to you via DM.");
      //        // TODO: Make sure user can receive DMs before sending
      //      }

      //      if(!d7dtdState.receivedData) {
      //        d7dtdState.waitingForPref = 1;
      //        d7dtdState.waitingForPrefMsg = msg;
      //      }
      //    }
      //    else {
      //      handleCmdError(err);
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
  telnet.connect(params);
}

telnet.on("ready", () => {
  console.log("Connected to game. (" +  Date() + ")");

  if(!config["skip-discord-auth"]) {
    updateDiscordStatus(1);
  }
});

telnet.on("failedlogin", () => {
  console.log("Login to game failed! (" +  Date() + ")");
  process.exit();
});

telnet.on("close", () => {
  // Empty the cache.
  d7dtdState.data = "";

  // If there is no error, update status to 'No connection'
  if(d7dtdState.connStatus !== -1) {
    updateDiscordStatus(0);
  }

  if(d7dtdState.doReconnect) {
    telnet.end(); // Just in case
    setTimeout(() => { telnet.connect(params); }, 5000);
  }
});

telnet.on("data", (data) => {
  if(config["debug-mode"]) {
    var str = data.toString();

    var lineEnding = "!!!NONE!!!";
    if(str.endsWith("\r\n")) lineEnding = "CRLF";
    else if(str.endsWith("\r")) lineEnding = "CR";
    else if(str.endsWith("\n")) lineEnding = "LF";

    console.log(`[DEBUG] Buffer length: ${data.length}; Line ending: ${lineEnding};`);

    if(lineEnding === "!!!NONE!!!") console.warn("[DEBUG] Buffer is missing a line ending!");

    if(str.startsWith("\r\n") || str.startsWith("\n") || str.startsWith("\r")) {
      console.log("[DEBUG] Line starts with a line ending. Possible issues?");
    }

    if(config["debug-buffer-log"]) {
      console.log(`[BUFFERDMP1] ${str}`);
    }
  }

  data = d7dtdState.data + data.toString();

  if(data.endsWith("\n") || data.endsWith("\r")) {
    d7dtdState.data = ""; // Clear the existing data cache.
  }
  else {
    // Fill the cache to be completed on the next "data" call.
    d7dtdState.data = d7dtdState.data + data;

    // Await further information.
    return;
  }

  var lines = data.split(lineSplit);

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
    var line = lines[i];

    // escapeRegExp
    lines[i] = lines[i].replace(/[.*+?^${}()|[\]\\]/g, " ");

    var split = line.split(" ");

    if(split[2] === "INF" && split[3] === "[NET]" && split[4] === "ServerShutdown\r") {
      // If we don't destroy the connection, crashes will happen when someone types a message.
      // This is a workaround until better measures can be put in place for sending data to the game.
      console.log("The server has shut down. Closing connection...");
      telnet.destroy();

      channel.send({embeds: [{
        color: 14164000,
        description: "The server has shut down."
      }] })
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

telnet.on("error", (error) => {
  var errMsg = error.message || error;
  console.log(`An error occurred while connecting to the game:\n${errMsg}`);
  //d7dtdState.lastTelnetErr = data.message;

  updateDiscordStatus(-1);
});

function doLogin() {
  client.login(token)
    .catch((error) => {
    // We want the error event to trigger if this part fails.
      client.emit("error", error);
    });
}

var firstLogin;
if(!config["skip-discord-auth"]) {
  doLogin();

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


    if(client.guilds.cache.size === 0) {
      console.log("\x1b[31m********\nWARNING: The bot is currently not in a Discord server. You can invite it to a guild using this invite link:\nhttps://discord.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot\n********\x1b[0m");
    }

    if(client.guilds.cache.size > 1) {
      console.log("\x1b[31m********\nWARNING: The bot is currently in more than one Discord server. Please type 'leaveguilds' in the console to clear the bot from all guilds.\nIt is highly recommended that you verify 'Public bot' is UNCHECKED on this page:\n\x1b[1m https://discord.com/developers/applications/" + client.user.id + "/information \x1b[0m\n\x1b[31m********\x1b[0m");
    }

    channel = client.channels.cache.find((channel) => (channel.id === channelid));

    if(!channel && !skipChannelCheck) {
      console.log("\x1b[33mERROR: Failed to identify channel with ID '" + channelid + "'\x1b[0m");
      config.channel = "channelid";
    }

    // Wait until the Discord client is ready before connecting to the game.
    if(d7dtdState.connInitialized !== 1) {
      d7dtdState.connInitialized = 1; // Make sure we only do this once
      telnet.connect(params);
    }
  });

  client.on("error", (error) => {
    console.log("Discord client disconnected with reason: " + error);

    if(error.code === "TOKEN_INVALID") {
      if(token === "your_token_here") {
        console.log("It appears that you have not yet added a token. Please replace \"your_token_here\" with a valid token in the config file.");
      }
      else if(token.length < 50) {
        console.log("It appears that you have entered a client secret or other invalid string. Please ensure that you have entered a bot token and try again.");
      }
      else {
        console.log("Please double-check the configured token and try again.");
      }
      process.exit();
    }

    console.log("Attempting to reconnect in 6s...");
    setTimeout(() => { doLogin(); }, 6000);
  });

  client.on("messageCreate", (msg) => {
    if(msg.author === client.user) {
      return;
    }

    // If the bot is mentioned, pass through as if the user typed 7d!info
    // Also includes overrides for the default prefix.
    var mentioned = msg.content.includes("<@" + client.user.id + ">") || msg.content === "7d!info" || msg.content === "7d!help";

    if(msg.content.toUpperCase().startsWith(prefix) || mentioned) {
      parseDiscordCommand(msg, mentioned);
    }
    else if(msg.channel === channel && msg.channel.type === "GUILD_TEXT") {
      msg = "[" + msg.member.displayName + "] " + msg.cleanContent;
      handleMsgToGame(msg);
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
    client.guilds.cache.forEach((guild) => {
      console.log("Leaving guild \"" + guild.name + "\"");
      guild.leave();
    });
    console.log("Left all servers. Use this link to re-invite the bot: \n\x1b[1m https://discord.com/oauth2/authorize?client_id=" + client.user.id + "&scope=bot \x1b[0m");
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
  if(!config["skip-discord-auth"]) {
    console.log(err.stack);
    console.log("Unhandled rejection: '" + err.message + "'. Attempting to reconnect...");
    client.destroy();
    setTimeout(() => { doLogin(); }, 6000);
  }
});
