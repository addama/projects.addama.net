const DEBUG = false
const REGIONS = [ 'na', 'sa', 'eu', 'af', 'as', 'oc' ]
const CATEGORIES = [ 'energy', 'materials', 'industrials', 'leisure', 'consumables', 'healthcare', 'financials', 'tech', 'communications', 'utilities', 'realestate' ]
const TICK_LENGTH = 3000
const STARTING_TRADE_MONEY = 6000
const STARTING_BANK_MONEY = 0
const RANDOM_STOCKS = 19
const RANDOM_SIZE_MIN = 1
const RANDOM_SIZE_MAX = 1000
const WORLD_TREND_MIN = 5
const WORLD_TREND_MAX = 20	
const STOCK_TREND_MIN = 2
const STOCK_TREND_MAX = 7	
const REGION_TREND_MIN = 3
const REGION_TREND_MAX = 12
const CATEGORY_TREND_MIN = 1
const CATEGORY_TREND_MAX = 10
const VALUE_UNIT_MAX = 1.0
const VALUE_UNIT_MIN = 0.01
const PERCENT_CHANGE_MIN = -75
const PERCENT_CHANGE_MAX = 200
const SPLIT_LIMIT = 300
const EMA_WINDOW = 30
// const SELL_FEE = 0.01
const DIVIDEND_INCREMENT = 15
const TRADE_INTEREST_PERCENT = 0.001
const BANK_INTEREST_PERCENT = 0.006
const BANK_INTEREST_INCREMENT = DIVIDEND_INCREMENT * 4 * 4
const TAX_INCREMENT = 100
const TAX_PERCENT = 0.15
const HISTORY_LENGTH_MAX = 5
const SAVE_INCREMENT = 10
const BOND_INCREMENT = 60
const BOND_COUPON_INCREMENT = BOND_INCREMENT / 2
const BOND_RATINGS = [
	[ BOND_INCREMENT, 		0.05, 	1000 ], 	// 0 rating
	[ BOND_INCREMENT * 2, 	0.025, 	10000 ],	// 1 rating
	[ BOND_INCREMENT * 3, 	0.01, 	100000 ]	// 2 rating
]
const STORAGE = window.localStorage

var TIMER
var ticks = 0
var isRunning = false

/********************************************************
*	DATA
********************************************************/

var trends = {
	"world": { type: 'world' },
	"na": { type: 'region' },
	"sa": { type: 'region' },
	"eu": { type: 'region' },
	"af": { type: 'region' },
	"as": { type: 'region' },
	"oc": { type: 'region' },
	"energy": { type: 'category' },					// consumable fuels, mostly
	"materials": { type: 'category' },				// chemicals, glass, paper, wood, packaging, metal
	"industrials": { type: 'category' },			// construction, aerospace, machinery, security, consulting, transportation
	"leisure": { type: 'category' },				// clothes, leisure, appliances, auto
	"consumables": { type: 'category' },			// food, drink, tobacco, supermarkets
	"healthcare": { type: 'category' },
	"financials": { type: 'category' },
	"tech": { type: 'category' },					// hardware, equipment, semiconductors, phones
	"communications": { type: 'category' },			// telecom, media, GAMING
	"utilities": { type: 'category' },				
	"realestate": { type: 'category' },
}

/* 

International Genetic Technologies, Inc	healthcare
Acme Corp								*
Aperture Science Innovators				tech
Weyland-Yutani Corp						*
Wayne Enterprises						*
Oceanic Airlines						industrials
ENCOM									*
Massive Dynamic							*
Gekko & Co. (high end)					financials
Genco Pura Olive Oil Company			materials
Hooli									tech
North Central Positronics				materials
VersaLife Corporation					healthcare
Abstergo Industries						tech
Cyberdyne Systems						tech
Nakatomi Corporation					*
Shinra Electric Power Company			energy
Volition, Inc							*
Primatech Paper Co.						materials
Bluth Company
Soylent Corporation
Stay Puft Corporation
Buy and Large Corp
Capsule Corporation
Delos
Vandelay Industries
Veidt
Izon (military weaponry)
Arctic & European Fish Oil Company
Benthic Petroleum
Ewing Oil
Slate Rock and Gravel Co
Ellingson Mineral Corporation
ORINCO oil
Dunder Mifflin
McMahon and Tate ads
Parcher and Murphy ads
Sterling-Cooper-Draper-Price ads
Skarloey Railway
Sodor & Mainland Railway
Dharma Initiative

*/

var stocks = [
	{ ticker: 'HELLO', category: 'energy',			region: 'na',	dividendTick: DIVIDEND_INCREMENT }
	// TODO: ADD FUNDS THAT TRACK REGION/CATEGORY
]

var portfolio = { money: STARTING_TRADE_MONEY, bank: STARTING_BANK_MONEY, stocks: {}, bonds: [], taxable: 0 }
var eventHistory = []

/********************************************************
*	UTILITY
********************************************************/

function id(len) {
	// Creates a random 4 character ticker string
	return Math.random().toString(36).substring(2,2+len)
}

function r(min, max) {
	// Random roll between min and max inclusive
	return Math.floor(Math.random() * max) + min
}

function dF(num=2) {
	// Rolls the given number of fudge dice, which have equal probabilities of being -1, 0, or +1
	// I'm rolling individual dice instead of just r(-num,num) because these represent slightly different
	// probability sets
	let total = 0
	for (var i = 0; i < num; i++) {
		total += (Math.floor(Math.random() * 3)) - 1
	}
	return total
}

function getPercentChange(base, current) {
	// Calculates the percent difference from one number to another
	return -((base - current) / base * 100)
}

function money(num) {
	// Returns #?.## as a number
	return +Number.parseFloat(num).toFixed(2)
}

function toMoney(num, isSigned=false) {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', signDisplay: (isSigned)? 'exceptZero' : 'auto' }).format(num)
}

function mod(against) {
	// Compares the current tick incrementer to a comparison value
	// Used for checking if a tick lines up with an increment (e.g. every 15 ticks)
	return (ticks % against === 0)
}

function properCase(s) {
	return s[0].toUpperCase() + s.slice(1)
}

/********************************************************
*	ENGINE
********************************************************/

function addHistory(message, type='event') {
	eventHistory.push({ tick: ticks, type, message })
	if (eventHistory.length > HISTORY_LENGTH_MAX) eventHistory.shift()
}

function getRating(s) {
	// Returns a string representing positive or negative rating, representing the reaction
	// of a stock
	let rating = trends.world.trend + trends[s.region].trend + trends[s.category].trend + s.trend.trend
	if (rating < 0) return '-'.repeat(Math.abs(rating))
	if (rating > 0) return '+'.repeat(rating)
	return '='
	
}

function setGlobalTrends() {
	// Set global trends, to include country and category trends
	// These trends operate independently, representing ups and downs to the factors
	// that make up what a stock is. World events don't necessarily affect tech stocks,
	// and tech stocks don't affect chinese stocks

	for (let [key, trend] of Object.entries(trends)) {
		let isWorld = (trend.type == 'world')
		if (ticks <= 1) {
			trend.time = 10
			trend.trend = (isWorld) ? 1 : 0
		} else {
			let isRegion = (trend.type == 'region')
			if (trend.time == undefined || trend.time == 0) {
				trend.time = r(
					(isWorld) ? WORLD_TREND_MIN : (isRegion) ? REGION_TREND_MIN : CATEGORY_TREND_MIN,
					(isWorld) ? WORLD_TREND_MAX : (isRegion) ? REGION_TREND_MAX : CATEGORY_TREND_MAX
				)
				trend.trend = dF()
			} else {
				trend.time -= 1
			}
		}
	}
}

function setStockReactions(s) {
	// Set individual stock trend, which is analogous to profitable years, scandals, etc

	if (s.trend.time == undefined || s.trend.time == 0 || s.base_percent_change <= PERCENT_CHANGE_MIN) {
		s.trend.time = r(STOCK_TREND_MIN, STOCK_TREND_MAX)
		s.trend.trend = dF()
		// Bad/good luck protection
		if (s.base_percent_change <= PERCENT_CHANGE_MIN) s.trend.trend = 4
		if (s.base_percent_change > PERCENT_CHANGE_MAX) {
			s.trend.trend = -4
			if (s.base_percent_change >= SPLIT_LIMIT) {
				splitShares(s.stockIndex)
				addHistory(`${s.ticker} has split shares!`)
			}
		}
		// console.log(s.ticker, s.trend.trend, 'for', s.trend.time)
	} else {
		s.trend.time -= 1
	}
	
	// The situation of the world, country, and category that the stock is in exerts pressure
	// on the stock's value, which is helped or hindered by the company's traits
	let reaction = s.trend.trend + trends.world.trend + trends[s.region].trend + trends[s.category].trend
	s.rating = getRating(s)
	
	// The most you can change in a single update is your competency skill converted to a percent
	let valueUnit = Math.max(s.worth * (s.competence / 100), VALUE_UNIT_MIN)
	let change = money(valueUnit * reaction)
	// Protect the worth from hitting 0 if we can
	if (change >= s.worth) change /= 2
	s.worth = money(s.worth + change)
	// If our protections didn't work, the minimum is VALUE_UNIT_MIN
	if (s.worth <= VALUE_UNIT_MIN) s.worth = VALUE_UNIT_MIN
	// Update the min and max historical stats
	if (s.worth < s.limit_min) s.limit_min = s.worth
	if (s.worth > s.limit_max) s.limit_max = s.worth
	s.last_change = change
	s.base_percent_change = money(getPercentChange(s.base_worth, s.worth))
}

function applyDividend(s) {
	// If the stock pays dividends, it will have dividendTick. Any tick that mods
	// for that dividendTick will see a payment per share of valueUnit, the same base amount
	// that the stock can fluctuate by in any given tick
	if (!s.dividendTick) return 0
	if (!portfolio.stocks[s.ticker]) return 0
	if (mod(s.dividendTick)) {
		let valueUnit = Math.max(s.worth * (s.competence / 100), VALUE_UNIT_MIN)
		let count = 0
		for (let i = 0; i < portfolio.stocks[s.ticker].purchases.length; i++) {
			let p = portfolio.stocks[s.ticker].purchases[i]
			count += p.count
		}
		portfolio.money += money(valueUnit * count) 
		addHistory(`${s.ticker} paid ${money(valueUnit)} dividend per each of your ${count} shares (${money(valueUnit * count)} total)!`)
		return count
	}
}

function applyTaxes() {
	if (portfolio.taxable > 0) {
		portfolio.money -= portfolio.taxable
		if (portfolio.money < 0) portfolio.money = 0
		addHistory(`You were charged taxes on your profit at a rate of 15% (${money(portfolio.taxable)} total)`)
		portfolio.taxable = 0
	}
}

function applyInterest() {
	// Unallocated money is subject to a small interest payment
	let bank_interest = portfolio.bank * BANK_INTEREST_PERCENT
	portfolio.bank += bank_interest
	if (bank_interest > 0) addHistory(`You earned ${money(bank_interest)} in interest from your bank account balance!`)
}

function calcEMA(s, w=EMA_WINDOW) {
	// Keeps track of the worth value for the last 10 ticks, then calculates
	// the Exponential Moving Average across those 10 values, which is stored
	// in ema10
	s.last10.push(s.worth)
	if (s.last10.length > EMA_WINDOW) s.last10.shift()
	let list = s.last10
	let k = 2/(w + 1)
	result = [list[0]]
	for (let i = 1; i < list.length; i++) {
		result.push(list[i] * k + result[i - 1] * (1 - k))
	}
	s.ema10 = money(result[result.length - 1])
	return s.ema10
}

function specialEvents() {
	// Random events may rarely affect stocks, based on ticks and a d100 roll
	let roll = r(0,99)
	let s = stocks[r(0,stocks.length-1)]
	if (roll >= 96) {
		s.competence = Math.random()
		addHistory(`${s.ticker} hired a new financial advisor!`)
	}
	
	if (roll < 3) {
		s.trend.trend = 8
		s.trend.time = 2
		addHistory(`${s.ticker} is enjoying positive media exposure!`)
	}
	
	if (roll > 2 && roll <= 6) {
		s.trend.trend = -8
		s.trend.time = 2
		addHistory(`${s.ticker} is suffering negative media exposure!`)
	}
}

function applyBondCoupons() {
	// Bonds pay a percentage of the amount lent twice per standard period
	for (let i = 0; i < portfolio.bonds.length; i++) {
		let bond = portfolio.bonds[i]
		
		if (bond.remaining === 0) {
			// Pay the interest, then reset remaining to BOND_COUPON_INCREMENT
			let interest = money(bond.worth * bond.percent)
			portfolio.money += interest
			bond.remaining = BOND_COUPON_INCREMENT
			addHistory(`A bond paid its interest of ${interest}!`)
		} else {
			bond.remaining--
		}
		
		if (ticks >= bond.maturity) {
			// Bond has fully matured, so the original purchase price is returned
			portfolio.money += money(bond.worth)
			portfolio.bonds.splice(i, 1)
			addHistory(`A bond came to maturity, returning ${money(bond.worth)} to your trade account!`)
			continue
		}
	}
}

function start(app) {
	// Initialize stock values
	function prepass(s) {
		// Do standard data massaging regardless of whether it's a preset
		// stock or a randomized one
		if (!s.size) s.size = r(RANDOM_SIZE_MIN,RANDOM_SIZE_MAX)
		if (!s.ticker) s.ticker = id(4).toUpperCase()
		if (!s.competence) s.competence = Math.random()
		if (!s.region) s.region = REGIONS[r(0,REGIONS.length-1)]
		if (!s.category) s.category = CATEGORIES[r(0,CATEGORIES.length-1)]
		if (!s.shares) s.shares = Math.floor(s.size * 100 * (s.competence * 10))
		if (!s.trend) s.trend = { time: 10, trend: 0 }
		if (!s.splits) s.splits = 0
		s.worth = money((s.shares / 10000) * (1 + s.competence))
		s.base_worth = s.worth 
		s.limit_min = s.base_worth
		s.limit_max = s.base_worth
		s.ema10 = s.base_worth
		s.last10 = []
		s.rating = getRating(s)
		return s
	}
	
	if (ticks <= 1) {
		let from_storage = _loadProgress()		
		if (!from_storage) {
			// Preset stocks are massaged to have real usable data that cannot be 
			// predicted or stored
			if (stocks.length > 0) {
				for (let i = 0; i < stocks.length; i++) {
					let s = prepass(stocks[i])
					s.stockIndex = i
				}
			}
			
			// If RANDOM_STOCKS, create that many randomized stocks to fill in the 
			// roster a bit
			if (RANDOM_STOCKS > 0) {
				for (let i = 0; i < RANDOM_STOCKS; i++) {
					let s = prepass({
						stockIndex: stocks.length
					})
					if (dF() === -1) s.dividendTick = DIVIDEND_INCREMENT * r(1,4)
					stocks.push(s)
				}
			}
		}
	}
	// Start the timer
	tick(app)
	TIMER = setInterval(() => {
		tick(app)
	}, TICK_LENGTH)
	isRunning = true
}

function tick(app) {
	// The heartbeat of the script, updating all applicable trends and values
	// console.clear()
	ticks++

	// Update trends as necessary
	setGlobalTrends()
	
	// Apply rare special events
	if (ticks > 10) specialEvents()
	
	// Adjust stock reactions to trends
	for (let i = 0; i < stocks.length; i++) {
		setStockReactions(stocks[i])
		calcEMA(stocks[i])
		applyDividend(stocks[i])
	}

	// Apply interest
	if (mod(BANK_INTEREST_INCREMENT)) applyInterest()
	
	// Apply bond coupons
	if (portfolio.bonds.length) applyBondCoupons()
	
	// Apply taxes based on profit from sales
	if (mod(TAX_INCREMENT)) applyTaxes()
	
	// Save to localStorage on a regular basis
	if (mod(SAVE_INCREMENT)) _saveProgress()

	// Print nice tables for the state of the data on this tick
	if (DEBUG === true) _debugReport()
		
	app.tick({ eventHistory, stocks, trends, portfolio, ticks })
}

function stop() { 
	clearInterval(TIMER) 
	isRunning = false
}

/********************************************************
*	INTERFACE
********************************************************/

function getPortfolioValue() {
	// Returns the sum of unallocated money plus the effective value 
	// of all shares and bonds, not counting interest from bonds
	let positions = 0
	let bonds = 0
	for (let [key, s] of Object.entries(portfolio.stocks)) {
		for (let i = 0; i < s.purchases.length; i++) {
			let p = s.purchases[i]
			positions += p.count * stocks[s.stockIndex].worth
		}
	}
	if (portfolio.bonds.length) {
		for (let i = 0; i < portfolio.bonds.length; i++) {
			bonds += money(portfolio.bonds[i].worth)
		}
	}
	return portfolio.money + portfolio.bank + positions + bonds
}

function buyShares(stockIndex, num=1) {
	// Purchase groups are added for the price that the stocks are bought
	// at. This allows the user to sell stocks at different price points,
	// for example, to sit on purchase groups with less favorable prices
	// until they become favorable, but still have the ability to sell
	// other favorable purchase groups
	// The alternative would be to calculate a cost basis that takes all
	// purchases into account, then divides by the amount of total shares
	// owned to get kind of an average. This would be easier, but I would
	// rather have the flexibility
	// sum_of_costs / sum_of_shares
	// portfolio.stocks[s.ticker].purchases := count, price
	function calcHoldings(p) {
		let shares = 0
		let costBasis = 0
		for (let i = 0; i < p.length; i++) {
			shares += p[i].count
			costBasis += money(p[i].price * p[i].count)
		}
		
		return { shares, costBasis }
	}
	
	if (!isRunning) return false
	let s = stocks[stockIndex]
	if (!s) return 0
	let totalCost = s.worth * num
	if (portfolio.money >= totalCost) {
		if (!s.minimumBuy || (s.minimumBuy && totalCost >= s.minimumBuy)) {
			let purchase = { count: num, worth: s.worth }
			if (portfolio.stocks[s.ticker]) {
				portfolio.stocks[s.ticker].purchases = portfolio.stocks[s.ticker].purchases || []
				portfolio.stocks[s.ticker].purchases.push(purchase)
			} else {
				let newStock = {
					ticker: s.ticker,
					stockIndex,
					purchases: [purchase]
				}
				portfolio.stocks[s.ticker] = newStock
			}
			
			portfolio.money -= money(totalCost)
			let holdings = calcHoldings(portfolio.stocks[s.ticker].purchases)
			portfolio.stocks[s.ticker].costBasis = money(holdings.costBasis)
			portfolio.stocks[s.ticker].totalShares = holdings.shares
			addHistory(`You purchased ${num} shares of ${s.ticker} for ${s.worth} each (${totalCost} total)`, 'action')
			return num
		} else {
			addHistory(`${s.ticker} has a minimum buy amount of ${money(s.minimumBuy)}`, 'warn')
			return 0
		}
	} else {
		// Not enough money to buy
		addHistory(`Not enough money to cover ${totalCost} for ${s.ticker}`, 'warn')
		return 0
	}
}

function buyMaxShares(stockIndex) {
	// Attempts to buy the most number of shares possible with available money
	if (!isRunning) return false
	let s = stocks[stockIndex]
	if (!s) return 0
	let maxShares = Math.floor(portfolio.money / s.worth)
	if (maxShares <= 0) {
		addHistory(`Not enough money to cover one share of ${s.ticker}`, 'warn')
		return 0
	}
	
	buyShares(stockIndex, maxShares)
	return maxShares
}

function sellShares(stockIndex, purchaseIndex, num=1) {
	// portfolio.stocks[s.ticker].purchases := count, price
	if (!isRunning) return false
	let s = stocks[stockIndex]
	if (!s) return 0
	if (!portfolio.stocks[s.ticker] || !portfolio.stocks[s.ticker].purchases[purchaseIndex]) {
		console.warn('Invalid purchase index!')
		return 0
	}
	
	let purchase = portfolio.stocks[s.ticker].purchases[purchaseIndex]
	if (purchase.count >= num) {
		let totalCost = s.worth * num
		portfolio.money += money(totalCost)
		purchase.count -= num
		// Remove the purchase group if no shares remain at that price
		if (purchase.count === 0) portfolio.stocks[s.ticker].purchases.splice(purchaseIndex, 1)
		// Remove the stock from portfolio if no more shares are owned
		if (portfolio.stocks[s.ticker].purchases.length === 0) delete portfolio.stocks[s.ticker]
		// Add 15% of profit to taxable pool
		let profit = totalCost - portfolio.stocks[s.ticker].costBasis
		if (profit > 0) portfolio.taxable += money(profit * TAX_PERCENT)
		addHistory(`You sold ${num} shares of ${s.ticker} for ${s.worth} each (${totalCost} total)`, 'action')
		return num
	} else {
		// For some reason, they are trying to sell more than they have
		return 0
	}
}

function sellMaxShares(stockIndex) {
	// Sells all shares for the given stock at the current price in one go
	if (!isRunning) return false
	let s = stocks[stockIndex]
	if (!s) return 0
	if (!portfolio.stocks[s.ticker]) {
		console.warn('Invalid stock index!')
		return 0
	}
	
	let stock = portfolio.stocks[s.ticker]
	let sold = 0
	let soldAmount = 0
	for (let i = 0; i < stock.purchases.length; i++) {
		let p = stock.purchases[i]
		let totalCost = s.worth * p.count
		// Add 15% of profit to taxable pool
		let profit = totalCost - portfolio.stocks[s.ticker].costBasis
		if (profit > 0) portfolio.taxable += money(profit * TAX_PERCENT)
		soldAmount += totalCost
		portfolio.money += money(totalCost)
		sold += p.count
	}
	
	delete portfolio.stocks[s.ticker]
	addHistory(`You sold ${sold} shares of ${s.ticker} for ${s.worth} each (${soldAmount} total)`, 'action')
	return sold 
}

function splitShares(stockIndex) {
	// Splits the shares owned by the user in 2 (default 2 for 1 split), and halves the 
	// worth of the stock. This increases the number of shares that the user has, but
	// doesn't affect the value
	let s = stocks[stockIndex]
	if (!s) return 0
	s.shares *= 2
	s.worth /= 2
	s.base_worth /= 2
	s.limit_min = s.worth
	s.limit_max = s.worth
	s.splits += 1
	let stock = portfolio.stocks[s.ticker]
	if (!stock) return 0
	for (let i = 0; i < stock.purchases.length; i++) {
		let p = stock.purchases[i]
		p.count *= 2
		p.worth /= 2
	}
}

function liquidatePortfolio() {
	// Sell all shares across all stocks at once
	if (!isRunning) return false
	for (let [key, s] of Object.entries(portfolio.stocks)) {
		sellMaxShares(s.stockIndex)
	}
	
	addHistory('You liquidated your portfolio', 'action')
}

function moveMoneyToBank(amount) {
	if (amount > portfolio.money) {
		console.warn(`Not enough money in trade account to cover ${money(amount)}`)
		return 0
	}
	
	portfolio.money -= amount
	portfolio.bank += amount
	addHistory(`You moved ${money(amount)} from your trade account to your bank account`, 'action')
	return amount
}

function moveMoneyToTrade(amount) {
	if (amount > portfolio.bank) {
		console.warn(`Not enough money in bank account to cover ${money(amount)}`)
		return 0
	}
	
	portfolio.bank -= amount
	portfolio.money += amount
	addHistory(`You moved ${money(amount)} from your bank account to your trade account`, 'action')
	return amount
}

function buyBond(rating) {
	// Bonds are purchased for a set price, return a percentage of their value
	// several times over the life of the bond, then mature and return the original
	// investment
	// In the real world you can buy and sell bonds, and the secondary market
	// prices fluctuate just like stocks; however, I feel like this is a complication
	// I don't need (yet)
	let bond = BOND_RATINGS[rating]
	if (!bond) return false
	if (bond[2] > portfolio.money) {
		addHistory(`Not enough money to cover a Class ${rating} bond!`)
		return 0
	}
	portfolio.bonds.push({
		rating,
		worth: money(bond[2]),
		percent: bond[1],
		maturity: ticks + bond[0],
		remaining: BOND_COUPON_INCREMENT
	})
	portfolio.money -= bond[2]
	addHistory(`Purchased a bond for ${money(bond[2])} that will mature in ${bond[0]} ticks, returning ${(bond[1] * 100)}% every ${BOND_COUPON_INCREMENT} ticks!`)
	return 1
}

function _debugReport() {
	// Report the current state of the market to the console for debugging
	console.warn('OVERVIEW')
	console.log('Tick',ticks,'\tMoney:',money(portfolio.money),'\tBank:',money(portfolio.bank),'\tTotal value:',money(getPortfolioValue()),'\tTaxable ('+TAX_PERCENT+'):',money(portfolio.taxable))
	// console.table(trends)
	console.warn('MARKET')
	console.table(stocks, ['ticker', 'category', 'region', 'worth', 'dividendTick', 'last_change', 'base_percent_change', 'rating'])
	console.warn('PORTFOLIO')
	if (Object.keys(portfolio.stocks).length > 0) {
		let report = []
		for (let [key, s] of Object.entries(portfolio.stocks)) {
			for (let i = 0; i < s.purchases.length; i++) {
				let p = s.purchases[i]
				report.push({
					ticker: s.ticker,
					stockIndex: s.stockIndex,
					count: p.count,
					worth: p.worth,
					costBasis: p.count * p.worth,
					current: stocks[s.stockIndex].worth * p.count,
					change: getPercentChange(p.count * p.worth, stocks[s.stockIndex].worth * p.count)
				})
			}
		}
		console.table(report)
	}
	console.table(portfolio.bonds)
	console.warn('EVENT HISTORY')
	console.table(eventHistory)
	// console.info('buyShares(stockIndex,num)\tbuyMaxShares(stockIndex)\tsellShares(stockIndex,purchaseIndex,num),\tsellMaxShares(stockIndex),\tliquidatePortfolio(),\tmoveMoneyToBank(amount),\tmoveMoneyToTrade(amount)')
}

function _loadProgress() {
	if (!STORAGE.length) return false
	portfolio = JSON.parse(STORAGE.getItem('portfolio'))
	stocks = JSON.parse(STORAGE.getItem('stocks'))
	ticks = +STORAGE.getItem('ticks')
	addHistory('Progress loaded!','system')
	return true
}

function _saveProgress() {
	STORAGE.setItem('portfolio',JSON.stringify(portfolio))
	STORAGE.setItem('stocks',JSON.stringify(stocks))
	STORAGE.setItem('ticks', ticks)
	addHistory('Progress saved!', 'system')
	return true
}

function _clearProgress() {
	localStorage.clear()
	addHistory('Progress cleared! Refresh the page to start again','system')
	return true
}

/********************************************************
*	EXECUTION
********************************************************/

// start()


/*

Funds/Trackers
Achievements
Levels
	Separate levels for buy/sell/bond?
	Artifical restrictions unlocked by leveling?
Bank interest based on balance
Lottery tickets?
Real estate?
	Renovate
	Rent
Bond secondary market
Physical commodities
	Different markets with travel time/cost?
Charity
	Tax deductions
Trophies
	Purchased with money
*/