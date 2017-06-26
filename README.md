# 7 Days to Die Discord Integration
A Discord bot for 7 Days to Die. This integrates a dedicated game server's chat with Discord, granting players access to the server's chat through Discord.

**NOTE: This bot only works with dedicated servers.**

# Commands
Commands can be sent via DM or in the specified chat channel.

`7dtd!info`
`7dtd!time`
`7dtd!version`

# Terminal Commands
`exit`

# How to Install - Windows
## Creating the bot account
1. Log in to the [Discord developers section](https://discordapp.com/developers/applications/me) and click "New App".
2. Name the bot anything you'd like and click "Create App".
3. Click "Create a Bot User".
4. Next to "Token:" click the link that says "click to reveal". This is the password for your bot's account. You'll need this and the "Client ID" number later. Copy them both somewhere safe or keep the tab open.
5. Paste the URL listed below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

## Setting up the bot
1. [Download](https://github.com/LakeYS/7DTD-Discord-Integration/archive/master.zip) this repository and extract it somewhere on your server's system.
2. Install Node.js LTS from [this website](https://nodejs.org/en/download/).
3. Once Node.js is finished installing, run install.bat in the bot's folder. This will automatically install the required modules for the bot.
4. Now you'll need to edit your server's config xml file. If you're using the Steam dedicated server, it should be located in `C:\Program Files (x86)\Steam\steamapps\common\7 Days to Die Dedicated Server`.
5. Open serverconfig.xml in a text editor (Right click and select 'Edit' to open it in Nodepad) and find "TelnetEnabled". Set it to true. Make sure TelnetPort is 8081 (or use the --port argument in run.bat). Set a telnet password.
6. Right click the bot's run.bat and click "Edit".
7. Find "changeme" and replace it with your server's Telnet password. Replace "your_token_here" with the Discord token from earlier.

## Setting up the channel
1. Open Discord.
2. Open your user settings (gear in the bottom left) and go to "Appearance".
3. Scroll down to "Advanced" and turn Developer Mode on.
4. Now go to your Discord server. Create a text channel or choose an existing one for your server's chat.
5. Right-click the text channel you want to use and click "Copy ID". This will copy the channel's number ID to your clipboard.
6. Go back to your run.bat file and paste the ID in place of "channelid".

## Run the bot!
Once you complete all of this, you will be able to run the bot by opening run.bat. If you've done all of this correctly, you will see the following in the terminal:
`Connected to game. Connected to 1 Discord Servers.`

You may want to create a shortcut to run.bat in your Startup folder.

`C:\Users\[YOURNAME]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`


# How to Install - Linux
## Setting up the bot
1. Open a terminal on your system.
2. Install Node.js and NPM. Install build tools if instructed. [[How to install via package manager]](https://nodejs.org/en/download/package-manager/)
3. Type `curl -L https://github.com/LakeYS/7DTD-Discord/archive/master.tar.gz > 7dtdbot.tar.gz` to download the bot's files to an archive named `7dtdbot.tar.gz`.
4. Type `tar -xzf 7dtdbot.tar.gz` to extract the archive. This will create a directory named "7DTD-Discord-master". Navigate to the directory with `cd 7DTD-Discord-master`.
5. Type `sudo chmod +x run.sh`. This gives you permission to execute run.sh.
6. Type `npm install discord.js telnet-client minimist` to install the required packages for the bot to run.

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
3. Now navigate back to the bot's folder. Edit run.sh.
4. Find the line starting with `node ./index.js` and replace "changeme" with your server's telnet password.
5. Replace "your_token_here" with the Discord bot token from earlier. Keep the file open for the next section.

## Setting up the channel
1. Open Discord in a browser.
2. Open your user settings (gear in the bottom left) and go to "Appearance".
3. Scroll down to "Advanced" and turn Developer Mode on.
4. Now go to your Discord server. Create a text channel or choose an existing one for your server's chat.
5. Right-click the text channel you want to use and click "Copy ID". This will copy the channel's number ID to your clipboard.
6. Go back to your server's run.sh file and enter the ID in place of "channelid".
7. Save and close the file.

## Run the bot!
Once you complete all of this, you will be able to run the bot by executing run.sh (Navigate to the bot's directory and enter `./run.sh`). If you've done all of this correctly, you will see the following:
`Connected to game. Connected to 1 Discord Servers.`
