@echo off
rem Be sure to keep this file secure as it contains sensitive information.

rem Note: Node.js and NPM are required to run this. Telnet must be enabled on your server.
rem If any problems occur, ensure that both are installed and that your system is up-to-date.

rem Replace the arguments here with your Discord and game information.
rem Port: (Optional) Your server's telnet port. This defaults to 8081 if none is specified.
rem Password: Your server's telnet password.
rem Token: Your Discord bot token.
rem Channel: The channel you want the bot to operate in. (Will be optional in the future)
node ./index.js --password="changeme" --token="your_token_here" --channel="319257907579453440"
pause
