//'use strict';
require('dotenv').config()
const puppeteer = require('puppeteer');
const fetch = require("node-fetch");

const splinterlandsPage = require('./splinterlandsPage');
const user = require('./user');
const card = require('./cards');
const helper = require('./helper');
const quests = require('./quests');
const ask = require('./possibleTeams');
const version = 0.1;

async function checkForUpdate() {
	console.log('-----------------------------------------------------------------------------------------------------');
	await fetch('http://jofri.pf-control.de/prgrms/splnterlnds/version.txt')
	.then(response=>response.json())
	.then(newestVersion=>{ 
		if (newestVersion > version) {
			console.log('New Update! Please download on https://github.com/PCJones/ultimate-splinterlands-bot');
			console.log('New Update! Please download on https://github.com/PCJones/ultimate-splinterlands-bot');
			console.log('New Update! Please download on https://github.com/PCJones/ultimate-splinterlands-bot');
		} else {
			console.log('No update available');
		}
	})
	console.log('-----------------------------------------------------------------------------------------------------');
}

// Close popups by Jones
async function closePopups(page) {
	try {
        await page.waitForSelector('.close', { timeout: 6000 })
            .then(button => {
				console.log('Closing popup 1');
				button.click();
				return;
			});
    } catch (e) {
        console.info('popup 1 not found')
    }
	
	try {
        await page.waitForSelector('.modal-close-new', { timeout: 1000 })
            .then(button => {
				console.log('Closing popup 2');
				button.click();
				return;
			});
    } catch (e) {
        console.info('popup 2 not found')
    }
}

// await loading circle by Jones
async function waitUntilLoaded(page) {
	try {
        await page.waitForSelector('.loading', { timeout: 6000 })
            .then(() => {
				console.log('Waiting until page is loaded...');
			});
    } catch (e) {
        console.info('No loading circle...')
		return;
    }
	
	await page.waitForFunction(() => !document.querySelector('.loading'), { timeout: 120000 });
}

async function clickMenuFightButton(page) {
	try {
        await page.waitForSelector('#menu_item_battle', { timeout: 6000 })
            .then(button => button.click());
    } catch (e) {
        console.info('fight button not found')
    }
	
}

// LOAD MY CARDS
async function getCards() {
    const myCards = await user.getPlayerCards(process.env.ACCUSERNAME.split('@')[0]) //split to prevent email use
    return myCards;
} 

async function getQuest() {
    return quests.getPlayerQuest(process.env.ACCUSERNAME.split('@')[0])
        .then(x=>x)
        .catch(e=>console.log('No quest data, splinterlands API didnt respond, or you are wrongly using the email and password instead of username and posting key'))
}

async function createBrowsers(count, headless) {
	let browsers = [];
	for (let i = 0; i < count; i++) {
		const browser = await puppeteer.launch({
			headless: headless,
		});
		const page = await browser.newPage();
		await page.setDefaultNavigationTimeout(500000);
		await page.on('dialog', async dialog => {
			await dialog.accept();
		});
		
		browsers[i] = browser;
	}
	
	return browsers;
}

async function startBotPlayMatch(page, myCards, quest) {
    
    console.log( new Date().toLocaleString())
    if(myCards) {
        console.log(process.env.ACCUSERNAME, ' deck size: '+myCards.length)
    } else {
        console.log(process.env.EMAIL, ' playing only basic cards')
    }
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    await page.setViewport({
        width: 1800,
        height: 1500,
        deviceScaleFactor: 1,
    });

    await page.goto('https://splinterlands.io/');
    await page.waitForTimeout(8000);

    let item = await page.waitForSelector('#log_in_button > button', {
        visible: true,
      })
      .then(res => res)
      .catch(()=> console.log('Already logged in'))

    if (item != undefined)
    {console.log('Login')
        await splinterlandsPage.login(page).catch(e=>{
            console.log(e);
            throw new Error('Login Error');
        });
    }
	
    await page.waitForTimeout(6000);
	await waitUntilLoaded(page);
	await page.waitForTimeout(1000);
    await closePopups(page);
	await page.waitForTimeout(2000);
	await clickMenuFightButton(page);
    await page.waitForTimeout(3000);

    //check if season reward is available
    if (process.env.CLAIM_SEASON_REWARD === 'true') {
        try {
            console.log('Season reward check: ');
            await page.waitForSelector('#claim-btn', { visible:true, timeout: 3000 })
            .then(async (button) => {
                button.click();
                console.log(`claiming the season reward. you can check them here https://peakmonsters.com/@${process.env.ACCUSERNAME}/explorer`);
                await page.waitForTimeout(20000);
                await page.reload();

            })
            .catch(()=>console.log('no season reward to be claimed, but you can still check your data here https://peakmonsters.com/@${process.env.ACCUSERNAME}/explorer'));
            await page.waitForTimeout(3000);
            await page.reload();
        }
        catch (e) {
            console.info('no season reward to be claimed')
        }
    }

    //if quest done claim reward
    console.log('Quest details: ', quest);
    try {
        await page.waitForSelector('#quest_claim_btn', { timeout: 5000 })
            .then(button => button.click());
    } catch (e) {
        console.info('no quest reward to be claimed waiting for the battle...')
    }

    await page.waitForTimeout(5000);

	if (!page.url().includes("battle_history")) {
		console.log("Seems like battle button menu didn't get clicked correctly - try again");
		console.log('Clicking fight menu button again');
		await clickMenuFightButton(page);
		await page.waitForTimeout(5000);
	}

    // LAUNCH the battle
    try {
        console.log('waiting for battle button...')
        await page.waitForXPath("//button[contains(., 'BATTLE')]", { timeout: 20000 })
            .then(button => {
				console.log('Battle button clicked'); button.click()
				})
            .catch(e=>console.error('[ERROR] waiting for Battle button. is Splinterlands in maintenance?'));
        await page.waitForTimeout(5000);

        console.log('waiting for an opponent...')
        await page.waitForSelector('.btn--create-team', { timeout: 25000 })
            .then(()=>console.log('start the match'))
            .catch(async (e)=> {
            console.error('[Error while waiting for battle]');
			console.log('Clicking fight menu button again');
			await clickMenuFightButton(page);
            console.error('Refreshing the page and retrying to retrieve a battle');
            await page.waitForTimeout(5000);
            await page.reload();
            await page.waitForTimeout(5000);
            await page.waitForSelector('.btn--create-team', { timeout: 50000 })
                .then(()=>console.log('start the match'))
                .catch(async ()=>{
                    console.log('second attempt failed reloading from homepage...');
                    await page.goto('https://splinterlands.io/');
                    await page.waitForTimeout(5000);
                    await page.waitForXPath("//button[contains(., 'BATTLE')]", { timeout: 20000 })
                        .then(button => button.click())
                        .catch(e=>console.error('[ERROR] waiting for Battle button second time'));
                    await page.waitForTimeout(5000);
                    await page.waitForSelector('.btn--create-team', { timeout: 25000 })
                        .then(()=>console.log('start the match'))
                        .catch((e)=>{
                            console.log('third attempt failed');
                            throw new Error(e);})
                        })
        })
    } catch(e) {
        console.error('[Battle cannot start]:', e)
        throw new Error('The Battle cannot start');

    }
    await page.waitForTimeout(10000);
    let [mana, rules, splinters] = await Promise.all([
        splinterlandsPage.checkMatchMana(page).then((mana) => mana).catch(() => 'no mana'),
        splinterlandsPage.checkMatchRules(page).then((rulesArray) => rulesArray).catch(() => 'no rules'),
        splinterlandsPage.checkMatchActiveSplinters(page).then((splinters) => splinters).catch(() => 'no splinters')
    ]);

    const matchDetails = {
        mana: mana,
        rules: rules,
        splinters: splinters,
        myCards: myCards
    }
    await page.waitForTimeout(2000);
    const possibleTeams = await ask.possibleTeams(matchDetails).catch(e=>console.log('Error from possible team API call: ',e));

    if (possibleTeams && possibleTeams.length) {
        console.log('Possible Teams based on your cards: ', possibleTeams.length, '\n', possibleTeams);
    } else {
        console.log('Error:', matchDetails, possibleTeams)
        throw new Error('NO TEAMS available to be played');
    }
    
    //TEAM SELECTION
    const teamToPlay = await ask.teamSelection(possibleTeams, matchDetails, quest);

    if (teamToPlay) {
        page.click('.btn--create-team')[0];
    } else {
        throw new Error('Team Selection error');
    }
    await page.waitForTimeout(5000);
    try {
        await page.waitForXPath(`//div[@card_detail_id="${teamToPlay.summoner}"]`, { timeout: 10000 }).then(summonerButton => summonerButton.click());
        if (card.color(teamToPlay.cards[0]) === 'Gold') {
            console.log('Dragon play TEAMCOLOR', helper.teamActualSplinterToPlay(teamToPlay.cards))
            await page.waitForXPath(`//div[@data-original-title="${helper.teamActualSplinterToPlay(teamToPlay.cards)}"]`, { timeout: 8000 }).then(selector => selector.click())
        }
        await page.waitForTimeout(5000);
        for (i = 1; i <= 6; i++) {
            console.log('play: ', teamToPlay.cards[i].toString())
            await teamToPlay.cards[i] ? page.waitForXPath(`//div[@card_detail_id="${teamToPlay.cards[i].toString()}"]`, { timeout: 10000 }).then(selector => selector.click()) : console.log('nocard ', i);
            await page.waitForTimeout(1000);
        }

        await page.waitForTimeout(5000);
        try {
            await page.click('.btn-green')[0]; //start fight
        } catch {
            console.log('Start Fight didnt work, waiting 5 sec and retry');
            await page.waitForTimeout(5000);
            await page.click('.btn-green')[0]; //start fight
        }
        await page.waitForTimeout(5000);
        await page.waitForSelector('#btnRumble', { timeout: 90000 }).then(()=>console.log('btnRumble visible')).catch(()=>console.log('btnRumble not visible'));
        await page.waitForTimeout(5000);
        await page.$eval('#btnRumble', elem => elem.click()).then(()=>console.log('btnRumble clicked')).catch(()=>console.log('btnRumble didnt click')); //start rumble
        await page.waitForSelector('#btnSkip', { timeout: 10000 }).then(()=>console.log('btnSkip visible')).catch(()=>console.log('btnSkip not visible'));
        await page.$eval('#btnSkip', elem => elem.click()).then(()=>console.log('btnSkip clicked')).catch(()=>console.log('btnSkip not visible')); //skip rumble
        await page.waitForTimeout(10000);
        try {
            await page.click('.btn--done')[0]; //close the fight
        } catch(e) {
            console.log('btn done not found')
            throw new Error('btn done not found');
        }
    } catch (e) {
        throw new Error(e);
    }


}

// 30 MINUTES INTERVAL BETWEEN EACH MATCH (if not specified in the .env file)
const sleepingTimeInMinutes = process.env.MINUTES_BATTLES_INTERVAL || 30;
const sleepingTime = sleepingTimeInMinutes * 60000;

(async () => {
	try {
		await checkForUpdate();
		const loginViaEmail = JSON.parse(process.env.LOGIN_VIA_EMAIL.toLowerCase());
		const accountusers = process.env.ACCUSERNAME.split(',');
		const accounts = loginViaEmail ? process.env.EMAIL.split(',') : accountusers;
		const passwords = process.env.PASSWORD.split(',');
		const headless = JSON.parse(process.env.HEADLESS.toLowerCase());
		const keepBrowserOpen = JSON.parse(process.env.KEEP_BROWSER_OPEN.toLowerCase());
		let browsers = [];
		console.log('Headless', headless);
		console.log('Keep Browser Open', keepBrowserOpen);
		console.log('Login via Email', loginViaEmail);
		console.log('Loaded', accounts.length, ' Accounts')
		console.log('START ', accounts, new Date().toLocaleString())

		// edit by jones, neues while true
		while (true) {
			for (let i = 0; i < accounts.length; i++) {
				process.env['EMAIL'] = accounts[i];
				process.env['PASSWORD'] = passwords[i];
				process.env['ACCUSERNAME'] = accountusers[i];
				
				if (keepBrowserOpen && browsers.length == 0) {
					console.log('Opening browsers');
					browsers = await createBrowsers(accounts.length, headless);
				} else if (!keepBrowserOpen) { // close browser, only have 1 instance at a time
					console.log('Opening browser');
					browsers = await createBrowsers(1, headless);
				}
							
				const page = (await (keepBrowserOpen ? browsers[i] : browsers[0]).pages())[1];
				
				//page.goto('https://splinterlands.io/');
				console.log('getting user cards collection from splinterlands API...')
				const myCards = await getCards()
					.then((x)=>{console.log('cards retrieved'); return x})
					.catch(()=>console.log('cards collection api didnt respond. Did you use username? avoid email!'));
				console.log('getting user quest info from splinterlands API...');
				const quest = await getQuest();
				if(!quest) {
					console.log('Error for quest details. Splinterlands API didnt work or you used incorrect username, remove @ and dont use email')
				}
				await startBotPlayMatch(page, myCards, quest)
					.then(() => {
						console.log('Closing battle', new Date().toLocaleString());        
					})
					.catch((e) => {
						console.log(e)
					})
				
				await page.waitForTimeout(5000);
				if (keepBrowserOpen) {
					await page.waitForTimeout(5000);
					await page.goto('about:blank');	
				} else {
					await browsers[0].close();
				}
			}
			await console.log('Waiting for the next battle in', sleepingTime / 1000 / 60 , ' minutes at ', new Date(Date.now() +sleepingTime).toLocaleString() );
			await console.log('Join the telegram group https://t.me/ultimatesplinterlandsbot and discord https://discord.gg/hwSr7KNGs9');
			await new Promise(r => setTimeout(r, sleepingTime));
		}
	} catch (e) {
		console.log('Routine error at: ', new Date().toLocaleString(), e)
	}
})();