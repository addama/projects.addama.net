/********************************************************
*	UTILITY
********************************************************/

const POSITIVE_CHANGE_CLASS = 'positive_change'
const NEGATIVE_CHANGE_CLASS = 'negative_change'

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
	let money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', signDisplay: (isSigned)? 'always' : 'auto' }).format(num)
	return money
}

function clamp(num, min, max) {
	return Math.min(Math.max(num, min), max)
}

function mod(against) {
	// Compares the current tick incrementer to a comparison value
	// Used for checking if a tick lines up with an increment (e.g. every 15 ticks)
	return (state.tick % against === 0)
}

function properCase(s) {
	return s[0].toUpperCase() + s.slice(1)
}

function stylePercentChange(lc) {
	if (lc < 0) return NEGATIVE_CHANGE_CLASS
	if (lc > 0) return POSITIVE_CHANGE_CLASS
	return ''
}

function alphaSort(sortable, key, isAsc=true) {
	sortable.sort((a,b) => {
		if (!a[key] || !b[key]) return 0
		if (isAsc) return (a[key] > b[key]) ? 1 : -1
		return (a[key] < b[key]) ? 1 : -1
	})
	return sortable
}

function numSort(sortable, key, isAsc=true) {
	sortable.sort((a,b) => {
		if (!a[key] || !b[key]) return 0
		if (isAsc) return a[key] - b[key]
		return b[key] - a[key]
	})
	return sortable
}

function _debugReport() {
	// Report the current state of the market to the console for debugging
	console.warn('OVERVIEW')
	console.log('Tick',state.tick,'\tMoney:',money(state.portfolio.money),'\tBank:',money(state.portfolio.bank),'\tTotal value:',money(getPortfolioValue()),'\tTaxable ('+TAX_PERCENT+'):',money(state.portfolio.taxable))
	// console.table(trends)
	console.warn('MARKET')
	console.table(state.stocks, ['ticker', 'sector', 'region', 'cost', 'dividendTick', 'last_change', 'base_percent_change', 'rating'])
	/* console.warn('PORTFOLIO')
	if (Object.keys(portfolio.stocks).length > 0) {
		let report = []
		for (let [key, s] of Object.entries(state.portfolio.stocks)) {
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
	} */
	// console.table(portfolio.bonds)
	console.warn('EVENT HISTORY')
	console.table(state.history)
	// console.info('buyShares(stockIndex,num)\tbuyMaxShares(stockIndex)\tsellShares(stockIndex,purchaseIndex,num),\tsellMaxShares(stockIndex),\tliquidatePortfolio(),\tmoveMoneyToBank(amount),\tmoveMoneyToTrade(amount)')
}









