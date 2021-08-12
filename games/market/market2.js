const DEBUG = false
const TICK_LENGTH = 3000
const STARTING_TRADE_MONEY = 100
const STARTING_BANK_MONEY = 0
const RANDOM_SIZE_MIN = 50
const RANDOM_SIZE_MAX = 10000
const COMPETENCE_MIN = 0.1
const COMPETENCE_MAX = 1.0
const SIZE_MIN = 10
const SIZE_MAX = 100000
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
const PERCENT_CHANGE_MIN = -25
const PERCENT_CHANGE_MAX = 500
const SPLIT_LIMIT = 1000
const EMA_WINDOW = 30
// const SELL_FEE = 0.01
const DIVIDEND_INCREMENT = 15
const TRADE_INTEREST_PERCENT = 0.001
const BANK_INTEREST_PERCENT = 0.006
const BANK_INTEREST_INCREMENT = DIVIDEND_INCREMENT * 4 * 4
const TAX_INCREMENT = 100
const TAX_PERCENT = 0.15
const HISTORY_LENGTH_MAX = 10
const SAVE_INCREMENT = 10
const BOND_INCREMENT = 60
const BOND_COUPON_INCREMENT = BOND_INCREMENT / 2
const BOND_RATINGS = [
	//Ticks					Percent	Cost
	[ BOND_INCREMENT, 		0.05, 	1000 ], 	// 0 rating
	[ BOND_INCREMENT * 2, 	0.025, 	10000 ],	// 1 rating
	[ BOND_INCREMENT * 3, 	0.01, 	100000 ]	// 2 rating
]
const RATINGS = [
	'⤋',
	'⇓',
	'↓',
	'|',
	'↑',
	'⇑',
	'⤊'
]

var TIMER = false
var isRunning = false

/********************************************************
*	DATA
********************************************************/

var state = {
	tick: 0,
	events: [],
	trends: {},
	portfolio: { 
		money: STARTING_TRADE_MONEY, 
		bank: STARTING_BANK_MONEY, 
		bonds: [], 
		taxable: 0
	}
}

/********************************************************
*	ENGINE
********************************************************/

function addEvent(message, target='-', type='news') {
	state.events.push({ tick: state.tick, target, type, message })
	if (state.events.length > HISTORY_LENGTH_MAX) state.events.shift()
}

function getRating(s) {
	// Returns a string representing positive or negative rating, representing the reaction
	// of a stock

	let rating = state.trends.world.weight + state.trends[s.region].weight + state.trends[s.sector].weight + s.trend.weight
	// if (rating < 0) return '↓'.repeat(Math.abs(rating))
	// if (rating > 0) return '↑'.repeat(rating)
	// return '↔'
	return rating
	
}

function setGlobalTrends() {
	// Set global trends, to include country and category trends
	// These trends operate independently, representing ups and downs to the factors
	// that make up what a stock is. World events don't necessarily affect tech stocks,
	// and tech stocks don't affect chinese stocks

	function setTrend(t) {
		let isWorld = (t === 'world')
		let isRegion = (state.regions.indexOf(t) != -1)
		
		// Set to a default if this is a new game
		if (!state.trends[t]) {
			state.trends[t] = { time: 10, weight: (t === 'world') ? 1 : 0 }
			return true
		}
		
		// Set new trend if the previous trend has run out
		if (state.trends[t].time === 0) {
			state.trends[t].time = r(
				(isWorld) ? WORLD_TREND_MIN : (isRegion) ? REGION_TREND_MIN : CATEGORY_TREND_MIN,
				(isWorld) ? WORLD_TREND_MAX : (isRegion) ? REGION_TREND_MAX : CATEGORY_TREND_MAX
			)
			state.trends[t].weight = dF()
			/*
			if (state.trends[t].weight === 2) {
				// High trend for a certain area, so we'll report it
				let string = (isWorld) ? 'The world market' : (isRegion) ? `The ${t.toUpperCase()} region` : `The ${properCase(t)} sector`
				addEvent(`${string} is experiencing a particularly high swing!`)
			}
			
			if (state.trends[t].weight === -2) {
				// Low trend for a certain area, so we'll report it
				let string = (isWorld) ? 'The world market' : (isRegion) ? `The ${t.toUpperCase()} region` : `The ${properCase(t)} sector`
				addEvent(`${string} is experiencing a particularly low swing!`)
			}
			*/
		} else {
			state.trends[t].time--
		}
	}
	
	for (let i = 0; i < state.regions.length; i++) {
		setTrend(state.regions[i])
	}
	
	for (let i = 0; i < state.sectors.length; i++) {
		setTrend(state.sectors[i])
	}
}

function setStockReactions(s) {
	// The situation of the world, country, and category that the stock is in exerts pressure
	// on the stock's value, which is helped or hindered by the company's traits
	let reaction = s.trend.weight + state.trends.world.weight + state.trends[s.region].weight + state.trends[s.sector].weight
	
	// Set individual stock trend, which is analogous to profitable years, scandals, etc
	if (s.trend.time === 0 || s.base_percent_change <= PERCENT_CHANGE_MIN) {
		s.trend.time = r(STOCK_TREND_MIN, STOCK_TREND_MAX)
		s.trend.weight = dF()
		// Bad/good luck protection
		if (s.base_percent_change <= PERCENT_CHANGE_MIN) {
			s.trend.weight = 6
			s.trend.time = 10
		}
		
		if (s.base_percent_change > PERCENT_CHANGE_MAX) {
			s.trend.weight = -4
			s.trend.time = 10
			if (s.base_percent_change >= SPLIT_LIMIT && r(1,100) <= 50) {
				splitShares(s.stockIndex)
				addEvent(`${s.name} (${s.ticker}) has split shares!`, s.ticker)
			}
		}
		// Recalculate the reaction
		reaction = s.trend.weight + state.trends.world.weight + state.trends[s.region].weight + state.trends[s.sector].weight
		if (reaction === 8)	addEvent(`${s.name} (${s.ticker}) is having a blockbuster period!`, s.ticker)
		if (reaction === -8) addEvent(`${s.name} (${s.ticker}) is having the worst luck ever!`, s.ticker)
	} else {
		s.trend.time -= 1
	}
	

	s.rating = getRating(s)
	
	// The most you can change in a single update is your competency skill converted to a percent
	let valueUnit = Math.max(s.cost * (s.competence / 100), VALUE_UNIT_MIN)
	let change = money(valueUnit * reaction)
	// Protect the cost from hitting 0 if we can
	if (s.cost + change <= 0) change /= 2
	if (s.cost + change <= 0) {
		// If this goes on too long, it's basically impossible to rise above the minimum, so we'll manually prevent this
		addEvent(`${s.name} (${s.ticker}) has hit rock bottom!`, s.ticker)
		change = 0.00
		s.trend.weight = 6
		s.trend.time = 20
	}
	// If our protections didn't work, the minimum is VALUE_UNIT_MIN
	if (s.cost <= VALUE_UNIT_MIN) s.cost = VALUE_UNIT_MIN
	s.cost = money(s.cost + change)
	
	// Update the min and max historical stats
	if (s.cost < s.limit_min) s.limit_min = s.cost
	if (s.cost > s.limit_max) s.limit_max = s.cost
	s.last_change = change
	s.base_percent_change = money(getPercentChange(s.base_cost, s.cost))
}

function applyDividend(s) {
	// If the stock pays dividends, it will have dividendTick. Any tick that mods
	// for that dividendTick will see a payment per share of valueUnit, the same base amount
	// that the stock can fluctuate by in any given tick
	if (!s.dividendTick) return 0
	if (!state.portfolio.stocks[s.ticker]) return 0
	if (mod(s.dividendTick)) {
		let valueUnit = Math.max(s.cost * (s.competence / 100), VALUE_UNIT_MIN)
		let count = 0
		for (let i = 0; i < state.portfolio.stocks[s.ticker].purchases.length; i++) {
			let p = state.portfolio.stocks[s.ticker].purchases[i]
			count += p.count
		}
		state.portfolio.money += money(valueUnit * count) 
		addEvent(`${s.name} (${s.ticker}) paid ${toMoney(valueUnit)} dividend per each of your ${count} shares (${toMoney(valueUnit * count)} total)!`, s.ticker)
		return count
	}
}

function applyTaxes() {
	if (state.portfolio.taxable > 0) {
		state.portfolio.money -= state.portfolio.taxable
		if (state.portfolio.money < 0) state.portfolio.money = 0
		addEvent(`You were charged taxes on your profit at a rate of 15% (${toMoney(state.portfolio.taxable)} total)`)
		state.portfolio.taxable = 0
	}
}

function applyInterest() {
	// Unallocated money is subject to a small interest payment
	let bank_interest = state.portfolio.bank * BANK_INTEREST_PERCENT
	state.portfolio.bank += bank_interest
	if (bank_interest > 0) addEvent(`You earned ${money(bank_interest)} in interest from your bank account balance!`)
}

function calcEMA(s, w=EMA_WINDOW) {
	// Keeps track of the worth value for the last 10 ticks, then calculates
	// the Exponential Moving Average across those 10 values, which is stored
	// in ema10
	s.last10.push(s.cost)
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

function calcHoldings(p) {
	let shares = 0
	let costBasis = 0
	for (let i = 0; i < p.length; i++) {
		shares += p[i].count
		costBasis += money(p[i].cost * p[i].count)
	}
	return { shares, costBasis }
}

function specialEvents() {
	// Random events may rarely affect stocks, based on ticks and a d100 roll
	let roll = r(0,99)
	let s = state.stocks[r(0,state.stocks.length-1)]
	if (roll === 47) {
		s.competence = r(COMPETENCE_MIN,COMPETENCE_MAX)
		addEvent(`${s.name} (${s.ticker}) hired a new financial advisor!`, s.ticker)
	}
	
	if (roll === 48) {
		s.trend.weight = 8
		s.trend.time = 2
		addEvent(`${s.name} (${s.ticker}) is enjoying positive media exposure!`, s.ticker)
	}
	
	if (roll === 49) {
		s.trend.weight = -8
		s.trend.time = 2
		addEvent(`${s.name} (${s.ticker}) is suffering negative media exposure!`, s.ticker)
	}
	
	// if (roll === 50) {
		// s.size += 100
		// if (s.size > SIZE_MAX) s.size = SIZE_MAX
		// addEvent(`${s.name} (${s.ticker}) has expanded their operations!`)
	// }
	
	// if (roll === 51) {
		// s.size -= 100
		// if (s.size < SIZE_MIN) s.size = SIZE_MIN
		// addEvent(`${s.name} (${s.ticker}) has had to downsize!`)
	// }
}

function applyBondCoupons() {
	// Bonds pay a percentage of the amount lent twice per standard period
	for (let i = 0; i < state.portfolio.bonds.length; i++) {
		let bond = state.portfolio.bonds[i]
		
		if (bond.remaining === 0) {
			// Pay the interest, then reset remaining to BOND_COUPON_INCREMENT
			let interest = money(bond.worth * bond.percent)
			state.portfolio.money += interest
			bond.remaining = BOND_COUPON_INCREMENT
			addEvent(`A bond paid its interest of ${toMoney(interest)}!`)
		} else {
			bond.remaining--
		}
		
		if (ticks >= bond.maturity) {
			// Bond has fully matured, so the original purchase price is returned
			state.portfolio.money += money(bond.worth)
			state.portfolio.bonds.splice(i, 1)
			addEvent(`A bond came to maturity, returning ${toMoney(bond.worth)} to your trade account!`)
			continue
		}
	}
}

function start(app) {
	// Initialize stock values
	function prepass(s, i) {
		// Do standard data massaging to fill in gaps
		if (!s.size) s.size = r(RANDOM_SIZE_MIN,RANDOM_SIZE_MAX)
		if (!s.ticker) s.ticker = id(4).toUpperCase()
		if (!s.competence) s.competence = r(COMPETENCE_MIN,COMPETENCE_MAX)
		if (!s.region) s.region = database.regions[r(0,database.regions.length-1)]
		if (!s.sector) s.sector = database.sectors[r(0,database.sectors.length-1)]
		if (!s.shares) s.shares = Math.floor(s.size * 100 * (s.competence * 10))
		if (!s.trend) s.trend = { time: 10, weight: 0 }
		if (!s.splits) s.splits = 0
		s.cost = money((s.shares / 10000) * (1 + s.competence))
		s.base_cost = s.cost 
		s.limit_min = s.base_cost
		s.limit_max = s.base_cost
		s.ema10 = s.base_cost
		s.last10 = []
		//s.rating = getRating(s)
		s.stockIndex = i
		return s
	}
	
	let local = loadGame()
	state = (local) ? local : state
	
	if (!local) {
		Object.assign(state, state, database)
		for (let i = 0; i < state.stocks.length; i++) {
			state.stocks[i] = prepass(state.stocks[i], i)
		}
		setGlobalTrends()
	}
	console.log('start',state)
	// Start the timer
	tick(app)
	TIMER = setInterval(() => tick(app), TICK_LENGTH)
	isRunning = true
}

function tick(app) {
	// The heartbeat of the script, updating all applicable trends and values
	// console.clear()
	if (DEBUG) console.time('tick')
	state.tick++

	// Update trends as necessary
	setGlobalTrends()
	
	// Apply rare special events
	if (state.tick > 10) specialEvents()

	// Adjust stock reactions to trends
	for (let i = 0; i < state.stocks.length; i++) {
		setStockReactions(state.stocks[i])
		calcEMA(state.stocks[i])
		applyDividend(state.stocks[i])
	}

	// Apply interest
	if (mod(BANK_INTEREST_INCREMENT)) applyInterest()
	
	// Apply bond coupons
	if (state.portfolio.bonds.length) applyBondCoupons()
	
	// Apply taxes based on profit from sales
	if (mod(TAX_INCREMENT)) applyTaxes()
	
	// Save to localStorage on a regular basis
	if (state.tick === 1 || mod(SAVE_INCREMENT)) saveGame(state)

	// Print nice tables for the state of the data on this tick
	if (DEBUG === true) _debugReport()
		
	app.tick(state)
	let t1 = performance.now()
	if (DEBUG) console.timeEnd('tick')
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

	// Sum of all stock purchases
	for (let i = 0; i < state.stocks.length; i++) {
		let s = state.stocks[i]
		if (s.purchases && s.purchases.length) {
			let holdings = calcHoldings(s.purchases)
			positions += holdings.shares * s.cost
		}
	}
	
	// Sum of all bond purchases
	if (state.portfolio.bonds.length) {
		for (let i = 0; i < state.portfolio.bonds.length; i++) {
			bonds += money(state.portfolio.bonds[i].cost)
		}
	}
	
	return state.portfolio.money + state.portfolio.bank + positions + bonds
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

	if (!isRunning) return false
	let s = state.stocks[stockIndex]
	if (!s) return 0
	let totalCost = s.cost * num
	
	if (state.portfolio.money >= totalCost) {
		if (!s.minimumBuy || (s.minimumBuy && totalCost >= s.minimumBuy)) {
			// Remove the money first, just in case
			state.portfolio.money -= money(totalCost)
			
			// Add purchase object to purchase list in the stock
			let purchase = { count: parseInt(num), cost: s.cost }
			s.purchases = s.purchases || []
			s.purchases.push(purchase)
			
			addEvent(`You purchased ${num} shares of ${s.ticker} for ${toMoney(s.cost)} each (${toMoney(totalCost)} total)`, s.ticker, 'action')
			return num
		} else {
			// Didn't meet minimum buy amount requirement
			addEvent(`${s.ticker} has a minimum buy amount of ${toMoney(s.minimumBuy)}`, s.ticker, 'warning')
			return 0
		}
	} else {
		// Not enough money to buy
		addEvent(`Not enough money to cover ${toMoney(totalCost)} for ${s.ticker}`, s.ticker, 'warning')
		return 0
	}
}

function buyMaxShares(stockIndex) {
	// Attempts to buy the most number of shares possible with available money
	if (!isRunning) return false
	let s = state.stocks[stockIndex]
	if (!s) return 0
	let maxShares = Math.floor(state.portfolio.money / s.cost)
	if (maxShares <= 0) {
		addEvent(`Not enough money to cover one share of ${s.ticker}`, s.ticker, 'warning')
		return 0
	}
	
	buyShares(stockIndex, maxShares)
	return maxShares
}

function sellShares(stockIndex, purchaseIndex, num=1) {
	// portfolio.stocks[s.ticker].purchases := count, price
	if (!isRunning) return false
	let s = state.stocks[stockIndex]
	if (!s) return 0
	if (!s.purchases.length || !s.purchases[purchaseIndex]) {
		console.warn('Invalid purchase index!')
		return 0
	}
	
	let p = s.purchases[purchaseIndex]
	if (p.count >= num) {
		let totalCost = s.cost * num
		state.portfolio.money += money(totalCost)
		p.count -= num
		// Remove the purchase group if no shares remain at that price
		if (p.count === 0) s.purchases.splice(purchaseIndex, 1)
		// Add 15% of profit to taxable pool
		let holdings = calcHoldings(s.purchases)
		let profit = totalCost - holdings.costBasis
		if (profit > 0) state.portfolio.taxable += money(profit * TAX_PERCENT)
		addEvent(`You sold ${num} shares of ${s.ticker} for ${s.cost} each (${totalCost} total)`, s.ticker, 'action')
		return num
	} else {
		// For some reason, they are trying to sell more than they have
		return 0
	}
}

function sellMaxShares(stockIndex, purchaseIndex=-1) {
	// Sells all shares for the given stock at the current price in one go
	if (!isRunning) return false
	let s = state.stocks[stockIndex]
	if (!s || !s.purchases || !s.purchases.length) return 0
	
	let sold = 0
	let soldAmount = 0
	
	if (purchaseIndex !== -1) {
		let p = s.purchases[purchaseIndex]
		sold = p.count
		soldAmount = s.cost * p.count
		s.purchases.splice(purchaseIndex,1)
		state.portfolio.money += money(soldAmount)
	} else {
		for (let i = 0; i < s.purchases.length; i++) {
			let p = s.purchases[i]
			let totalCost = s.cost * p.count
			// Add 15% of profit to taxable pool
			let holdings = calcHoldings(s.purchases)
			let profit = totalCost - holdings.costBasis
			if (profit > 0) state.portfolio.taxable += money(profit * TAX_PERCENT)
			soldAmount += totalCost
			state.portfolio.money += money(totalCost)
			sold += p.count
		}
		s.purchases = []
	}
	
	addEvent(`You sold ${sold} shares of ${s.ticker} for ${toMoney(s.cost)} each (${toMoney(soldAmount)} total)`, s.ticker, 'action')
	return sold 
}

function splitShares(stockIndex) {
	// Splits the shares owned by the user in 2 (default 2 for 1 split), and halves the 
	// cost of the stock. This increases the number of shares that the user has, but
	// doesn't affect the value
	let s = state.stocks[stockIndex]
	if (!s) return 0
	s.shares *= 2
	s.cost /= 2
	s.base_cost /= 2
	s.limit_min = s.cost
	s.limit_max = s.cost
	s.splits += 1
	let p = s.purchases || false
	if (!p || !p.length) return 0
	for (let i = 0; i < p.length; i++) {
		p[i].count *= 2
		p[i].cost /= 2
	}
}

function liquidatePortfolio() {
	// Sell all shares across all stocks at once
	if (!isRunning) return false
	for (let i = 0; i < state.stocks.length; i++) {
		sellMaxShares(i)
	}
	
	addEvent('You liquidated your portfolio', 'action')
}

function liquidatePortfolio_old() {
	// Sell all shares across all stocks at once
	if (!isRunning) return false
	for (let [key, s] of Object.entries(state.portfolio.stocks)) {
		sellMaxShares(s.stockIndex)
	}
	
	addEvent('You liquidated your portfolio', 'action')
}

function moveMoneyToBank(amount) {
	if (amount > state.portfolio.money) {
		console.warn(`Not enough money in trade account to cover a bank transfer of ${toMoney(amount)}`)
		return 0
	}
	
	state.portfolio.money -= amount
	state.portfolio.bank += amount
	addEvent(`You moved ${toMoney(amount)} from your trade account to your bank account`, 'action')
	return amount
}

function moveMoneyToTrade(amount) {
	if (amount > state.portfolio.bank) {
		console.warn(`Not enough money in bank account to cover a trade account transfer of ${toMoney(amount)}`)
		return 0
	}
	
	state.portfolio.bank -= amount
	state.portfolio.money += amount
	addEvent(`You moved ${toMoney(amount)} from your bank account to your trade account`, 'action')
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
	if (bond[2] > state.portfolio.money) {
		addEvent(`Not enough money to cover a Class ${rating} bond!`)
		return 0
	}
	state.portfolio.bonds.push({
		rating,
		worth: money(bond[2]),
		percent: bond[1],
		maturity: ticks + bond[0],
		remaining: BOND_COUPON_INCREMENT
	})
	state.portfolio.money -= bond[2]
	addEvent(`Purchased a bond for ${toMoney(bond[2])} that will mature in ${bond[0]} ticks, returning ${(bond[1] * 100)}% every ${BOND_COUPON_INCREMENT} ticks!`)
	return 1
}

/********************************************************
*	NOTES
*********************************************************

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