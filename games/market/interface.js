class App extends React.Component {
	// App holds the state, and passes bits of it down through props
	constructor(props) {
		super(props)
		this.state = {
			events: this.props.state.events,
			stocks: this.props.state.stocks,
			portfolio: this.props.state.portfolio,
			tick: this.props.state.tick,
			isLoading: true
		}
		start(this)
	}
	
	tick(data) {
		let portfolio = buildPortfolio()
		this.setState({
			events: data.events,
			stocks: data.stocks,
			portfolio,
			tick: data.tick,
			isLoading: false
		})
	}

	renderContent() {
		if (this.state.isLoading) return <LoadingScreen />
		return [
			<StockTable stocks={this.state.portfolio} />,
			<Portfolio stocks={this.state.stocks} portfolio={this.state.portfolio} />,
			<EventHistory events={this.state.events} />
		]
	}

	render() {
		return (
			<main className='flex'>
				<Header />
				{ this.renderContent() }
			</main>
		)
	}
}

class Header extends React.Component {
	render() {
		return (
			<header>
				<a id='top'></a>
				<a href='https://addama.net'>addama.net</a>
			</header>
		)
	}
}

class LoadingScreen extends React.Component {
	render() {
		return (
			<div id='loadingScreen'>
				<h1>Loading...</h1>
			</div>
		)
	}
}

class EventHistory extends React.Component {
	makeRow(data) {
		return (
			<tr>
				<td className='eventHistory_Tick'>{data.tick}</td>
				<td className='eventHistory_Type'>{data.type}</td>
				<td className='eventHistory_Message'>{data.message}</td>
			</tr>
		)
	}
	
	render() {
		const rows = []
		for (let i = 0; i < this.props.events.length; i++) {
			rows.push(this.makeRow(this.props.events[i]))
		}
		
		return (
			<section id='eventHistory'>
				<table id='eventHistory_Table'>
					<thead>
						<tr>
							<th className='text_center' colspan='3'>EVENT HISTORY</th>
						</tr>
						<tr>
							<th>Tick</th>
							<th>Type</th>
							<th>Message</th>
						</tr>
					</thead>
					{ rows }
				</table>
			</section>
		)
	}
}

class StockTable extends React.Component {
	getRegion(abbr) {
		return {
			'na': 'North America',
			'as': 'Asia',
			'af': 'Africa',
			'oc': 'Oceania',
			'eu': 'Europe',
			'sa': 'South America'
		}[abbr]
	}
	
	handleBuy(stockIndex, amount='max') {
		if (amount === 'max') {
			buyMaxShares(stockIndex)
		} else {
			buyShares(stockIndex, amount)
		}
	}
	
	handleSell(stockIndex, amount='max') {
		if (amount === 'max') {
			sellMaxShares(stockIndex)
		} else {
			sellShares(stockIndex, amount)
		}
	}
	
	makeButtons(data) {
		// Need to make it so buy and sell are mutually exclusive
		return (
			<div className='stock_actions'>
				<button id={`${data.stockIndex}_buyMax`} onClick={(e) => this.handleBuy(data.stockIndex) }>+MAX</button>
				<button id={`${data.stockIndex}_buy1`} onClick={(e) => this.handleBuy(data.stockIndex, 1) }>+1</button>
				<button id={`${data.stockIndex}_buy5`} onClick={(e) => this.handleBuy(data.stockIndex, 5) }>+5</button>
			</div>
		)
	}

	makeIcon(letter='D', type='dividend') {
		return (
			<span className={`icon ${type}`}>{letter}</span>
		)
	}
	
	makeRow(data) {
		const classColor = (isPositive) ? 'positive_change' : 'negative_change'
		const isPositive = (data.last_change >= 0)
		const hasDividend = (data.dividendTick > 0) ? true : false
		let owned, costBasis, ownedChange, current = '-'
		if (data.purchases) {
			owned = data.purchases.totalShares
			costBasis = toMoney(data.purchases.costBasis)
			ownedChange = getPercentChange(costBasis, data.cost * owned) + '%'
			current = toMoney(data.cost * owned)
		}
		
		return (
			<tr id={`stock${data.stockIndex}`}>
				<td className='stockTable_Ticker'>{data.ticker} {(hasDividend)?this.makeIcon():''}</td>
				<td className='stockTable_Rating'>{data.rating}</td>
				<td className='stockTable_MinMax text_center'>
					<LimitMeter min={data.limit_min} max={data.limit_max} value={data.cost} ema10={data.ema10} />
				</td>
				<td className={`stockTable_LastChange text_right ${classColor}`}>{toMoney(data.last_change, true)}</td>
				<td className='stockTable_Owned text_center'>{owned}</td>
				<td className='stockTable_CostBasis text_right'>{costBasis}</td>
				<td className='stockTable_OwnedChange text_right'>{current} {ownedChange}</td>
				<td className='stockTable_Actions text_center'>
					{this.makeButtons(data)}
				</td>
			</tr>
		)
	}
	
	render() {
		const rows = []
		if (this.props.stocks) {
			for (let i = 0; i < this.props.stocks.length; i++) {
				rows.push(this.makeRow(this.props.stocks[i]))
			}
		}
		
		return (
			<section id='stockTable'>
				<table id='stockTable_Table'>
					<thead>
						<tr>
							<th className='text_center' colspan='5'>STOCKS</th>
						</tr>
						<tr>
							<th className='text_left'>Ticker</th>
							<th className='text_left'>Health</th>
							<th className='text_right'>Min/Max/EMA/Value</th>
							<th className='text_right'>Last Change</th>
							<th className='text_center'>Owned</th>
							<th className='text_right'>Cost Basis</th>
							<th className='text_right'>Change</th>
							<th className='text_center'>Actions</th>
						</tr>
					</thead>
					<tbody>
						{ rows }
					</tbody>
				</table>
			</section>
		)
	}
}

class LimitMeter extends React.Component {
	getPercent(min, max, cur) {
		return ((cur - min) * 100) / (max - min)
	}
	
	render() {
		let value_percent = this.getPercent(this.props.min, this.props.max, this.props.value)
		let ema_percent = this.getPercent(this.props.min, this.props.max, this.props.ema10)
		return (
			<div class='meter' title={`Min: ${toMoney(this.props.min)}; Max: ${toMoney(this.props.max)}; EMA10: ${toMoney(this.props.ema10)}`}>
				<div class='bar' style={{width: `${value_percent}%`}}></div>
				<div class='line' style={{left: `${ema_percent}%`}}></div>
				<span class='meter_text'>{toMoney(this.props.value)}</span>
			</div>
		)
	}
}

class Portfolio extends React.Component {
	
	makeIcon(letter='D', type='dividend') {
		return (
			<span className={`icon ${type}`}>{letter}</span>
		)
	}
	
	makeRow(p, s, i) {
		let costBasis = p.count * p.worth
		//let current = stocks[s.stockIndex].worth * p.count
		// change: getPercentChange(p.count * p.worth, stocks[s.stockIndex].worth * p.count)
		return (
			<tr>
				<td className='portfolioTable_Ticker'>{s.ticker}</td>
				<td className='portfolioTable_Count'>{p.count || 0}</td>
				<td className='portfolioTable_Cost'>{p.cost}</td>
			</tr>
		)
	}
	
	render() {
		const rows = []
		if (this.props.portfolio.stocks) {
			for (let [key, s] of Object.entries(this.props.portfolio.stocks)) {
				for (let i = 0; i < s.purchases.length; i++) {
					let p = s.purchases[i]
					// console.log(key, s, p)
					// report.push({
						// ticker: s.ticker,
						// stockIndex: s.stockIndex,
						// count: p.count,
						// worth: p.worth,
						// costBasis: p.count * p.worth,
						// current: stocks[s.stockIndex].worth * p.count,
						// change: getPercentChange(p.count * p.worth, stocks[s.stockIndex].worth * p.count)
					// })
					rows.push(this.makeRow(p, s, i))
				}
			}
		}
		
		return (
			<section id='portfolio'>
				<table id='portfolioTable_Table'>
					<thead>
						<tr>
							<th className='text_center' colspan='1'>PORTFOLIO</th>
						</tr>
						<tr>
							<th className='text_left'>Ticker</th>
							<th className='text_left'>Count</th>
						</tr>
					</thead>
					<tbody>
						{ rows }
					</tbody>
				</table>
			</section>
		)
	}
}

ReactDOM.render(<App state={state} />, document.body)