# Dishorde - 7 Days to Die Discord Integration
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d343cf10ae934d9186f0914c977c05a2)](https://www.codacy.com/app/Lake/7DTD-Discord?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=LakeYS/7DTD-Discord&amp;utm_campaign=Badge_Grade)

[How to Install](https://github.com/LakeYS/7DTD-Discord#how-to-install---windows) | [Support it on Patreon](https://www.patreon.com/LakeYS) | [Join the Discord](https://discord.gg/s3vCQba) | [Website](http://lakeys.net/discord7dtd)
------------ | ------------- | ------------- | -------------

Dishorde is a Discord bridge bot for 7 Days to Die. It integrates a dedicated game server's chat with Discord, granting players access to the server's chat through Discord.

The bot runs as a completely separate application, so no mods are required to run it.

**See below for download links instructions on how to install the bot. Dedicated servers on PC only.**

# How it Works
This script works by connecting to your server's console and monitoring it for chat messages. Messages are relayed to and from the server using Discord, allowing for communication between in-game players and Discord users.

# Development and Support
I will continue to keep this project up-to-date with new features and fixes whenever possible. If running v1.3.0 or higher, notifications for updates are displayed in the terminal.

For support, questions, and comments, you can join the Discord server, or [submit an issue](https://github.com/LakeYS/7DTD-Discord/issues/new) for bugs and support.

For developers: If you are interested in helping out, [GitHub pull requests](https://help.github.com/articles/about-pull-requests/) are welcome and greatly appreciated.

For business inquiries, contact: contact@lakeys.net

# Commands
Commands can be sent via DM or in the specified chat channel.

`7d!info`
`7d!time`
`7d!version`
`7d!players`

# Terminal Commands
`exit`

# Configuration
The bot can be configured by editing config.json. Here's a list of the preferences:
- `allow-exec-command` - Enables a command called `7d!exec`. This allows anybody with the 'manage server' permission to execute commands on the server. The command works in any channel. **WARNING: Enabling this may pose a security risk for your server.**
- `disable-commands` - Disable Discord commands such as 7d!time. Does not disable 7d!info.
- `disable-chatmsgs` - Disable chat messages to and from the server. Does not disable other in-game messages such as join/leave and deaths.
- `disable-join-leave-gmsgs` - Disables player join/leave messages.
- `disable-misc-gmsgs` - Disables all other global messages (player deaths, etc.)
- `disable-status-updates` - Disable the bot's presence and online status display.
- `hide-prefix` - Hides all chat messages that start with a forward slash. This may be useful if your server uses commands.
- `log-messages` - Chat messages will show up in the terminal.
- `log-telnet` - All output from the connection will show up in the terminal.
- `prefix` - The prefix for bot commands. ('7d!' by default)

- `skip-discord-auth` - The bot will not log in to Discord.

# How to Install - Windows
## Creating the bot account
1. Log in to the [Discord Developer Portal](https://discordapp.com/developers/applications/) in a browser and click "Create an application". Name the bot anything you'd like. Write down the client ID as you'll need it for later.
2. On the left hand side, click "Bot". Now click the "Add Bot" button to create your bot. Now you can set an avatar for your bot if desired.
3. Once your bot is created, find the switch that is labeled "Public bot". Make sure that this is **OFF**. Click "Save Changes" to confirm.
4. Under "Token" click the link that says "Click to Reveal Token". This is the password for your bot's account. You'll need both this and the Client ID number later. Copy them both somewhere safe or keep the tab open.
5. Paste the URL below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

## Setting up the bot
1. [Download](https://github.com/LakeYS/7DTD-Discord/releases/download/v1.7.3/7DTD-Discord.zip) this repository and extract it somewhere on your server's system.
2. Install Node.js LTS from [this website](https://nodejs.org/en/download/).
3. Once Node.js is finished installing, run install.bat in the bot's folder. This will automatically install the required modules for the bot.
4. Now you'll need to edit your server's config xml file. If you're using the Steam dedicated server, it should be located in `C:\Program Files (x86)\Steam\steamapps\common\7 Days to Die Dedicated Server`.
5. Open serverconfig.xml in a text editor (Right click and select 'Edit' to open it in Nodepad) and find "TelnetEnabled". Set it to true. Make sure TelnetPort is 8081 (or use the "port" argument in config.json). Set a telnet password.
6. Right click the bot's config.json file and click "Edit".
7. Find "changeme" and replace it with your server's Telnet password. Replace "your_token_here" with the Discord token from earlier. If running the bot on a different network from the server, add `--ip=[your server's external ip]` (May require port forwarding if using an external IP. Make sure your Telnet password is secure.)

## Run the bot!
Once you complete all of this, you will be able to run the bot by opening run.bat. If you've done all of this correctly, you will see the following in the terminal:
`Connected to game. Connected to 1 Discord Servers.`

To set the channel for your server's chat, open Discord and type `7d!setchannel #yourchannel` in your server. If the setchannel command doesn't work, try [setting it manually](https://github.com/LakeYS/7DTD-Discord/wiki/Setting-up-the-channel-manually). Once complete, the bot should be all set!


Note that if you close this terminal the bot will be disconnected. The bot can be run in the background with no terminal by opening run_silent.vbs.

You may want to create a shortcut to run.bat or run_silent.vbs in your Startup folder:

`C:\Users\[YOURNAME]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`


# How to Install - Linux
## Raspberry Pi/Raspbian OS Setup
The bot can be run from a Raspberry Pi device by installing NodeJS. You may need access to a desktop computer in order to create the bot account.

First, follow the [NodeJS install instructions found here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) under "Debian and Ubuntu based Linux distributions".

If running the bot on the same network as the Raspberry Pi, you will likely need to enter the computer's internal IP. Open a commant prompt on the system that the server is running on and type `ipconfig`. Look for the field labeled 'IPv4 address' and copy the IP next to it (the IP should start with `196.168`). Then, copy this IP into the config.json under 'ip'. If this does not work, consider forwarding your telnet port (make sure the password is secure) and using the network's external IP.

## Setting up the bot
1. Open a terminal on your system.
2. Install Node.js and NPM. Install build tools if instructed. [[How to install via package manager]](https://nodejs.org/en/download/package-manager/). **Skip this step if installing to an Android or Raspberry Pi device.**
3. Type `curl -L https://github.com/LakeYS/7DTD-Discord/releases/download/v1.7.3/7DTD-Discord.tar.gz > 7dtdbot.tar.gz` to download the bot's files to an archive named `7dtdbot.tar.gz`.
4. Type `tar -xzf 7dtdbot.tar.gz` to extract the archive. This will create a directory named "7DTD-Discord-master". Navigate to the directory with `cd 7DTD-Discord-master`.
5. Type `sudo chmod +x run.sh`. This gives you permission to execute run.sh. (If this does not work, try `chmod +x run.sh`)
6. Type `npm install` to install the required packages for the bot to run.

## Creating the bot account
1. Log in to the [Discord Developer Portal](https://discordapp.com/developers/applications/) in a browser and click "Create an application". Name the bot anything you'd like. Write down the client ID as you'll need it for later.
2. On the left hand side, click "Bot". Now click the "Add Bot" button to create your bot. Now you can set an avatar for your bot if desired.
3. Once your bot is created, find the switch that is labeled "Public bot". Make sure that this is **OFF**. Click "Save Changes" to confirm.
4. Under "Token" click the link that says "Click to Reveal Token". This is the password for your bot's account. You'll need both this and the Client ID number later. Copy them both somewhere safe or keep the tab open.
5. Paste the URL below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

## Configuring the bot
1. On your server's system, navigate to the game's directory and edit your the config xml file.
2. Find "TelnetEnabled" and make sure it is set to "true". Set a telnet password and save the file. **Make sure your telnet password is secure , especially if the telnet port is open or the server is running on a VPS.**
3. Now navigate back to the bot's folder. Edit config.json.
4. Find the line containing `"password": "changeme",` and replace "changeme" with your server's telnet password.
5. If running the bot on a different network from the server, change "localhost" to your server's external IP. (If using an external IP to connect the bot, forwarding the telnet port may be required)
6. Replace "your_token_here" with the Discord bot token from earlier.  Keep the file open for the next section.

## Run the bot!
Once you complete all of this, you will be able to run the bot by executing run.sh (Navigate to the bot's directory and enter `./run.sh`). If you've done all of this correctly, you will see the following:
`Connected to game. Connected to 1 Discord Servers.`

To set the channel for your server's chat, open Discord and type `7d!setchannel #yourchannel` in your server. If the setchannel command doesn't work, try [setting it manually](https://github.com/LakeYS/7DTD-Discord/wiki/Setting-up-the-channel-manually). Once complete, the bot should be all set!
