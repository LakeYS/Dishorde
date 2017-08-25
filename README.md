# 7 Days to Die Discord Integration
A Discord bot for 7 Days to Die. This integrates a dedicated game server's chat with Discord, granting players access to the server's chat through Discord.

*Note: Dedicated servers only.*

![Screenshot](http://lakeys.net/discord7dtd/screenshot.png)

# How it Works
This script works by connecting to your server's admin console and monitoring it for chat messages. Messages are relayed to and from the server using Discord, allowing for communication between in-game players and Discord users.

# Commands
Commands can be sent via DM or in the specified chat channel.

`7dtd!info`
`7dtd!time`
`7dtd!version`

# Terminal Commands
`exit`

# Configuration
The bot can be configured by editing config.json. Here's a list of the preferences:
- `disable-commands` - Disable Discord commands such as 7dtd!time. Does not disable 7dtd!info.
- `disable-chatmsgs` - Disable chat messages. Does not disable other messages such as join/leave and deaths.
- `disable-gmsgs` - Disable other messages. Includes deaths, leaves/joins, etc.
- `hide-prefix` - Hides all chat messages that start with a forward slash. This may be useful if your server uses commands.
- `log-messages` - Chat messages will show up in the terminal.

# How to Install - Windows
## Creating the bot account
1. Log in to the [Discord developers section](https://discordapp.com/developers/applications/me) and click "New App".
2. Name the bot anything you'd like and click "Create App".
3. Click "Create a Bot User".
4. Next to "Token:" click the link that says "click to reveal". This is the password for your bot's account. You'll need this and the "Client ID" number later. Copy them both somewhere safe or keep the tab open.
5. Paste the URL listed below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

## Setting up the bot
1. [Download](https://github.com/LakeYS/7DTD-Discord/releases/download/v1.4.0/7DTD-Discord.zip) this repository and extract it somewhere on your server's system.
2. Install Node.js LTS from [this website](https://nodejs.org/en/download/).
3. Once Node.js is finished installing, run install.bat in the bot's folder. This will automatically install the required modules for the bot.
4. Now you'll need to edit your server's config xml file. If you're using the Steam dedicated server, it should be located in `C:\Program Files (x86)\Steam\steamapps\common\7 Days to Die Dedicated Server`.
5. Open serverconfig.xml in a text editor (Right click and select 'Edit' to open it in Nodepad) and find "TelnetEnabled". Set it to true. Make sure TelnetPort is 8081 (or use the "port" argument in config.json). Set a telnet password.
6. Right click the bot's config.json file and click "Edit".
7. Find "changeme" and replace it with your server's Telnet password. Replace "your_token_here" with the Discord token from earlier. If running the bot on a different network from the server, add `--ip=[your server's external ip]` (May require port forwarding if using an external IP. Make sure your Telnet password is secure.)

## Run the bot!
Once you complete all of this, you will be able to run the bot by opening run.bat. If you've done all of this correctly, you will see the following in the terminal:
`Connected to game. Connected to 1 Discord Servers.`

To set the channel for your server's chat, open Discord and type `7dtd!setchannel #yourchannel` in your server. If the setchannel command doesn't work, try [setting it manually](https://github.com/LakeYS/7DTD-Discord/wiki/Setting-up-the-channel-manually). Once complete, the bot should be all set!


Note that if you close this terminal the bot will be disconnected. The bot can be run in the background with no terminal by opening run_silent.vbs.

You may want to create a shortcut to run.bat or run_silent.vbs in your Startup folder:

`C:\Users\[YOURNAME]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`


# How to Install - Linux
## Android Devices
The bot can be installed on Android devices using the [Termux](https://play.google.com/store/apps/details?id=com.termux&hl=en) app. Once installed, enter `apt update` and `apt install nodejs curl`. Then, proceed with the installation as a Linux system. Note that you may need access to a desktop computer in order to create the bot account.

*Warning: For security purposes, please do not run this bot on an unsecured network (such as public wi-fi).*

## Setting up the bot
1. Open a terminal on your system.
2. Install Node.js and NPM. Install build tools if instructed. [[How to install via package manager]](https://nodejs.org/en/download/package-manager/). **Skip this step if installing to an Android device.**
3. Type `curl -L https://github.com/LakeYS/7DTD-Discord/releases/download/v1.4.0/7DTD-Discord-master.tar.gz > 7dtdbot.tar.gz` to download the bot's files to an archive named `7dtdbot.tar.gz`.
4. Type `tar -xzf 7dtdbot.tar.gz` to extract the archive. This will create a directory named "7DTD-Discord-master". Navigate to the directory with `cd 7DTD-Discord-master`.
5. Type `sudo chmod +x run.sh`. This gives you permission to execute run.sh. (If this does not work, try `chmod +x run.sh`)
6. Type `npm install` to install the required packages for the bot to run.

## Creating the bot account
1. Log in to the [Discord developers section](https://discordapp.com/developers/applications/me) in a browser and click "New App".
2. Name the bot anything you'd like and click "Create App".
3. Click "Create a Bot User".
4. Next to "Token:" click the link that says "click to reveal". This is the password for your bot's account. You'll need this and the "Client ID" number later. Copy them both somewhere safe or keep the tab open for later.
5. Paste the URL listed below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

## Configuring the bot
1. On your server's system, navigate to the game's directory and edit your the config xml file.
2. Find "TelnetEnabled" and make sure it is set to "true". Set a telnet password and save the file.
3. Now navigate back to the bot's folder. Edit config.json.
4. Find the line containing `"password": "changeme",` and replace "changeme" with your server's telnet password.
5. If running the bot on a different network from the server, change "localhost" to your server's external IP. (If using an external IP to connect the bot, forwarding the telnet port may be required)
6. Replace "your_token_here" with the Discord bot token from earlier.  Keep the file open for the next section.

## Run the bot!
Once you complete all of this, you will be able to run the bot by executing run.sh (Navigate to the bot's directory and enter `./run.sh`). If you've done all of this correctly, you will see the following:
`Connected to game. Connected to 1 Discord Servers.`

To set the channel for your server's chat, open Discord and type `7dtd!setchannel #yourchannel` in your server. If the setchannel command doesn't work, try [setting it manually](https://github.com/LakeYS/7DTD-Discord/wiki/Setting-up-the-channel-manually). Once complete, the bot should be all set!
