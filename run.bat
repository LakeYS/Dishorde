@echo off
rem WARNING: Keep this file secure as it contains sensitive information.

rem See the official installation guide for more information:
rem https://github.com/LakeYS/7DTD-Discord-Integration

rem Note: Node.js and NPM are required to run this. Telnet must be enabled on your server.
rem If any problems occur, ensure that both are installed and that your system is up-to-date.
rem Support e-mail: contact@lakeys.net

rem Port: (Optional) Your server's telnet port. This defaults to 8081 if none is specified.
rem Password: Your server's telnet password.
rem Token: Your Discord bot token.
rem Channel: The channel you want the bot to operate in. (Will be optional in the future)

rem Replace the following arguments with your Discord and game information.

node ./index.js

pause
