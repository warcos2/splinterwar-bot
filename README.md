# SplinterWar Bot
A multi-account bot for playing splinterlands. 100% free and open source.

- Based on https://github.com/alfficcadenti/splinterlands-bot
- And: https://github.com/PCJones/ultimate-splinterlands-bot

## IMPORTANT:
Currently there are 2 branches:
- Master (this one): better overall stability and performance, but less updates.
- Beta: more updates, but may have some bugs and degraded performance.

## Actual Features
- Multiple accounts with only one instance.
- Login via Email or Username.
- Better Team Selection - the bot will chose cards with best win rate, not the ones that are most used.
- The bot will play for the quests, including sneak and snipe (can be disabled).
- Minimum Energy Capture Rate - the bot will pause automatically if the energy capture rate is below a specified percentage.
- Option to enable/disable automatic quest reward chest opening.
- Support for the private API of the original bot.

## Next Features
- **Coming Soon**: Statistics on how each account is performing

# Support / Community

- [Discord](https://discord.gg/8Kf3wuta5Z)
- Telegram: coming soon.

## How to install
- Download and install [NodeJs](https://nodejs.org/it/download/)
- Download the [bot](https://github.com/warcos2/splinterwar-bot) (extract if its .zip)
- Edit .env file (using notepad or nano)
- On windows: Execute `install.bat` in bot folder
- On MacOS/Linux: open terminal in bot folder and execute command `npm install`

## How to start the bot
- On windows: Execute `start.bat` in bot folder
- On MacOS/Linux: open terminal in bot folder and execute command `npm start`

## Bot configuration:

Configuration with default values:

- `QUEST_PRIORITY=true` Disable/Enable quest priority

- `MINUTES_BATTLES_INTERVAL=5` Sleep time before the bot will fight with all accounts again. Subtract 2-3 minutes per account

- `ERC_THRESHOLD=75` If your energy capture rate goes below this the bot will stop fighting with this account until it's above again. Set to 0 to disable

- `CLAIM_SEASON_REWARD=true` Disable/Enable season reward claiming

- `CLAIM_QUEST_REWARD=true` Disable/Enable quest reward claiming

- `HEADLESS=true` Disable/Enable headless("invisible") browser (e.g. to see where the bot fails)

- `KEEP_BROWSER_OPEN=true` Disable/Enable keeping the browser instances open after fighting. Recommended to have it on true to avoid having each account to login for each fight. Disable if CPU/Ram usage is too high (check in task manager)

- `LOGIN_VIA_EMAIL=false` Disable/Enable login via e-mail adress. See below for further explanation

- `EMAIL=account1@email.com,account2@email.com,account3@email.com` Your login e-mails, each account seperated by comma. Ignore line if `LOGIN_VIA_EMAIL` is `false`

- `ACCUSERNAME=username1,username2,username3` Your login usernames, each account seperated by comma. **Even if you login via email you have to also set the usernames!**

- `PASSWORD=password1,password2,password3` Your login passwords/posting keys. Use password if you login via email, **use the posting key if you login via username**

- `USE_API=true` Enable/Disable the team selection API. If disabled the bot will play the most played cards from local newHistory.json file. **Experimental - set to false if you lose a lot**

- `API_URL=` Ignore/Don't change unless you have the private API from the original bot

- `USE_CLASSIC_BOT_PRIVATE_API=false` Set to false unless you have the private API from the original bot

# Donations

In case you want to donate to me for updating this bot, I would be very happy!

Coming soon...

Please also consider donating to the original bot creator.

# FAQ
**Can I have some accounts that login via email and some via username?**

Yes! Config Example:
```
LOGIN_VIA_EMAIL=true
EMAIL=account1@email.com,account2@email.com,username3
ACCUSERNAME=username1,username2,username3
PASSWORD=password1,password2,POST_KEY3
```

**How to get history data from users of my choice?**

1. Open battlesGetData.js in notepad and change the usersToGrab on line 70 to the users of your choice
2. Run `node battlesGetData.js` in the bot folder
3. File history.json is created, rename it to newHistory.json to replace the existing history data OR extend the newHistory.json file (see below)

**How to extend the newHistory.json without deleting existing data?**

1. Backup newHistory.json in case something goes wrong
2. Run `node combine.js` in the data folder to add the data from history.json to the newHistory.json file
