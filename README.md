# 7 Days to Die Discord Integration
A Discord bot for 7 Days to Die. This integrates a dedicated game server's chat with Discord, granting players access to the server's chat through Discord.

# Commands
`7dtd!info`

# How to Install
## Windows
### Creating the bot account
1. Log in to the [Discord developers section](https://discordapp.com/developers/applications/me) and click "New App".
2. Name the bot anything you'd like and click "Create App".
3. Click "Create a Bot User".
4. Next to "Token:" click the link that says "click to reveal". This is the password for your bot's account. You'll need this and the "Client ID" number later. Copy them both somewhere safe or keep the tab open.
5. Paste the URL listed below into your browser and replace "CLIENT_ID" with your client ID number. Hit enter and select the desired Discord server. Once this is done, the bot will show up in your server!

`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot`

### Setting up the bot
1. [Download](https://github.com/LakeYS/7DTD-Discord-Integration/archive/master.zip) this repository and extract it somewhere on your server's system.
2. Install Node.js LTS from [this website](https://nodejs.org/en/download/).
3. Once Node.js is finished installing, run install.bat in the extracted folder. This will automatically install the required modules for the bot.
4. Now you'll need to edit your server's config xml file. Find "TelnetEnabled" and set it to true. Make sure TelnetPort is 8081 (or use the --port argument in run.bat). If you haven't already, set a telnet password.
5. Right click the bot's run.bat and click "Edit".
6. Find "changeme" and replace it with your server's Telnet password. Replace "your_token_here" with the Discord token from earlier.

### Setting up the channel
1. Open Discord.
2. Open your user settings (gear in the bottom left) and go to "Appearance".
3. Scroll down to "Advanced" and turn Developer Mode on.
4. Now go to your Discord server. Create a text channel or choose an existing one for your server's chat.
5. Right-click the text channel you want to use and click "Copy ID". This will copy the channel's number ID to your clipboard.
6. Go back to your run.bat file and paste the ID in place of "channelid".

### Run the bot!
Once you complete all of this, you will be able to run the bot by opening run.bat. If you've done all of this correctly, you will see the following in the terminal:
`Connected to game. Connected to 1 Discord Servers.`

You may want to create a shortcut to run.bat in your Startup folder.

`C:\Users\[YOURNAME]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## Linux
Linux guide coming soon.
