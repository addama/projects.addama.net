// https://www.investopedia.com/terms/a/averagecostbasismethod.asp

const D4 = 4
const D6 = 6
const D8 = 8
const D10 = 10
const D12 = 12
const D20 = 20
const D100 = 100

const V1 = 1
const V2 = 2
const V3 = 3
const V4 = 4
const V5 = 5

const LARGE_CAP = 1000
const MEDIUM_CAP = 500
const TICK_LENGTH = 800

var TIMER

var stocks = [
/* 	{
		ticker: '',
		name: '',
		competence: 0,
		category: '',
		country: '',
		volatility: 0,
		shares: 0
	}, */
	{
		ticker: 'AAA',
		name: 'AAA',
		competence: 0.03,	// Competence adjusts the clamp min and max
		category: 'A',
		country: 'Z',
		volatility: 12,
		shares: 10000,
		value: 0.0,
		last_change: 0.0,
		trend: 0
	},
]

var funds = [
	{
		ticker: 'AZ',
		name: 'A',
		// competence: 5,
		volatility: D6,
		index: 'A',
		shares: 10000,
		value: 0
	}
]

var indexes = {
	'A': {
		name: 'A',
		value: 0,
		last_change: 0
	},
	'Z': {
		name: 'Z',
		value: 0,
		last_change: 0
	},
	'AZ': {
		name: 'AZ',
		value: 0,
		last_change: 0
	},
	'large': {
		name: 'large cap',
		value: 0,
		last_change: 0
	},
	'medium': {
		name: 'medium cap',
		value: 0,
		last_change: 0
	},
	'small': {
		name: 'small cap',
		value: 0,
		last_change: 0
	},
}

var portfolio = [
	{
		id: 0,
		type: '',	// stock, fund
		basis: 0,	// total purchase price (additive) divided by shares
		purchase_time: 0,
		value: 0,
		shares: 0
	}
]

/* function r(min=1.0,max=100.0,isInteger=false) { 
	let roll = (Math.random() * (max - min + 1.0)) + min
	if (!isInteger) console.log('roll', roll, Math.floor(roll))
	if (isInteger) return Math.floor(roll)
	return roll
}
 */
 
function r(min, max, isInteger=false) {
	let roll = parseFloat(Math.min(min + (Math.random() * (max - min)),max).toFixed(2));
	if (isInteger) return Math.floor(roll)
	return roll
}
 
function getTrend(vol) {
	let trend = r(-vol-1, vol, true)
	return trend	
}

function getRoll(vol, comp, trend) {
	if (trend == 0) return 0
	let roll = r(0,vol)
	if (trend < 0) return -roll
	return roll
}

function clamp(num, a, b) {
	let clamped = Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b))
	// console.log('clamp', 'min:', a, 'max:', b, 'num:', num, '=====', clamped)
	return clamped
}

function start() {
	for (let i in stocks) {
		// Set initial value
		let sec = stocks[i]
		sec.value = sec.shares / (sec.volatility * sec.competence * 10)
		sec.trend = getTrend(sec.volatility)
		indexes[sec.category].value += sec.value
		indexes[sec.country].value += sec.value
		indexes[sec.category + sec.country].value += sec.value
		if (sec.value >= LARGE_CAP) {
			indexes['large'].value += sec.value
		} else if (sec.value >= MEDIUM_CAP) {
			indexes['medium'].value += sec.value
		} else {
			indexes['small'].value += sec.value
		}
	}
	tick()
	TIMER = setInterval(tick, TICK_LENGTH)
}

function tick() {
	// Run every minute
	for (let i in indexes) {
		let index = indexes[i]
		index.last_change = 0
		index.value = 0
	}
	
	for (let i in stocks) {
		let sec = stocks[i]
		let change_amount = 0
		
		if (sec.trend == 0) {
			console.log('tick', sec.value, '\t\t\ttrend:', sec.trend, '\tchange:', change_amount)
			sec.trend = getTrend(sec.volatility)
		} else {
			let roll = parseFloat(getRoll(sec.volatility, sec.competence, sec.trend)).toFixed(2)
			let max = sec.value * ((sec.volatility / 2) / 100)
			change_amount = clamp(sec.value * (roll / 100), -max, max)
			sec.value += change_amount	
			console.log('tick', sec.value, '\t\t\ttrend:', sec.trend, '\tchange:', change_amount, '\troll:', roll)
			if (sec.trend > 0) sec.trend -= 1
			if (sec.trend < 0) sec.trend += 1
		}

		sec.last_change = change_amount
		
		// Update the indexes
		indexes[sec.category].value += sec.value
		indexes[sec.category].last_change += change_amount
		indexes[sec.country].value += sec.value
		indexes[sec.country].last_change += change_amount
		indexes[sec.category + sec.country].value += sec.value
		indexes[sec.category + sec.country].change_amount += change_amount
		if (sec.value >= LARGE_CAP) {
			indexes['large'].value += sec.value
			indexes['large'].change_amount += change_amount
		} else if (sec.value >= MEDIUM_CAP) {
			indexes['medium'].value += sec.value
			indexes['medium'].change_amount += change_amount
		} else {
			indexes['small'].value += sec.value
			indexes['small'].change_amount += change_amount
		}
	}
	
	for (let i in funds) {
		let fund = funds[i]
		let target_change = indexes[fund.index].last_change
		let competence = fund.volatility / 2
		fund.last_change = target_change * (competence / 100)
		fund.value += fund.last_change
	}
	// console.log('tick', stocks[0].value, stocks[0].trend, stocks[0].last_change)
}

function stop() { clearInterval(TIMER) }

start()
