/********************************************************
*	GENERAL COMPONENTS
********************************************************/

class App extends React.Component {
	// App holds the state, and passes bits of it down through props
	constructor(props) {
		super(props)
		this.state = {
			state: this.props.state,
			page: 'loading',
			startup: true,
			highlighted: false,
			points: []
		}
		start(this)
	}
	
	tick(data) {
		let newState = { state: data }
		if (this.state.startup) {
			newState['startup'] = false
			newState['page'] = 'stocks'
		}
		this.setState(newState)
	}

	setCurrentStock = (ticker) => {
		this.setState({
			highlighted: ticker
		})
	}
	
	changePage(page) {
		this.setState({
			page
		})
	}

	render() {
		// console.log(this.state)
		if (this.state.page === 'loading') return <LoadingScreen startup={this.state.startup} />
		return (
			<main>
				<Header />
				<section id='accountPanel' className='flex'>
					<div className='wide_panel'>
						<EventPanel events={this.state.state.events} highlighter={this.setCurrentStock} />
					</div>
					<div className='wide_panel'>
						<AccountTable money={this.state.state.portfolio.money} bank={this.state.state.portfolio.bank} taxable={this.state.state.portfolio.taxable} tick={this.state.state.tick} />
					</div>
				</section>
				<section id='tablePanel' className='flex'>
					<div id='stocksPanel' className='scroll_panel'>
						<StocksTable stocks={this.state.state.stocks} highlighted={this.state.highlighted} highlighter={this.setCurrentStock} />
					</div>
					<div id='portfolioPanel' className='scroll_panel'>
						<PortfolioTable stocks={this.state.state.stocks} highlighted={this.state.highlighted} highlighter={this.setCurrentStock} />
					</div>
				</section>
			</main>
		)
	}
}

class LimitMeter extends React.Component {
	getPercent(min, max, cur) {
		return clamp(((cur - min) * 100) / (max - min),0,100)
	}
	
	renderLastChange(lc) {
		let cls = (lc < 0) ? 'negative_change' : 'positive_change'
		cls += ' portfolioTable_Value_LastChange text_right'
		return <span className={cls}>{toMoney(lc, true)}</span>
	}

	render() {
		let value_percent = this.getPercent(this.props.min, this.props.max, this.props.value)
		let ema_percent = this.getPercent(this.props.min, this.props.max, this.props.ema)
		return (
			<div className='meter' title={`Value: ${toMoney(this.props.value)} \nMin: ${toMoney(this.props.min)} \nMax: ${toMoney(this.props.max)} \nEMA${EMA_WINDOW}: ${toMoney(this.props.ema)}`}>
				<Sparkline points={this.props.points} />
				<div className='bar' style={{width: `${value_percent}%`}}></div>
				<div className={'line ' + ((value_percent >= ema_percent)?'better':'')} style={{left: `${ema_percent}%`}}></div>
			</div>
		)
	}
}

class Header extends React.Component {
	render() {
		return (
			<header>
				<a id='top'></a>
				<h1>THE ETERNAL MARKET</h1>
			</header>
		)
	}
}

class LoadingScreen extends React.Component {
	render() {
		let message = 'Loading...'
		if (this.props.startup) message = 'If this is your first time starting up, it will take time for the EMA values to be accurate!'
		return (
			<div id='loadingScreen'>
				<h1>{message}</h1>
			</div>
		)
	}
}

class SellButton extends React.Component {
	// <SellButton count=<n,max> stockIndex=<n> />
	handleSell = () => {
		if (this.props.count === 'max') {
			sellMaxShares(this.props.stockIndex, this.props.purchaseIndex)
		} else if (this.props.count === 'all') {
			sellMaxShares(this.props.stockIndex)
		} else {
			sellShares(this.props.stockIndex, this.props.purchaseIndex, this.props.count)
		}
	}
	
	render() {
		let text = '-'+this.props.count
		let isDisabled = (this.props.disabled) ? 'disabled' : ''
		return <input 
			className='button sellButton'
			type='button' 
			onClick={this.handleSell} 
			value={text} 
			title={`Sell ${this.props.count} shares`}
			disabled={isDisabled}
		/>
	}
}

class BuyButton extends React.Component {
	// <BuyButton count=<n,max> stockIndex=<n> />
	handleBuy = () => {
		if (this.props.count === 'max') {
			buyMaxShares(this.props.stockIndex)
		} else {
			buyShares(this.props.stockIndex, this.props.count)
		}
	}
	
	render() {
		let text = '+'+this.props.count
		let isDisabled = (this.props.disabled) ? 'disabled' : ''
		return <input 
			className='button buyButton'
			type='button' 
			onClick={this.handleBuy} 
			value={text} 
			title={`Buy ${this.props.count} shares`}
			disabled={isDisabled}
		/>
	}
}

class Sparkline extends React.Component {
	findLargestX = () => {
		return Math.max(...this.props.points.map((p) => p.tick))
	}
	
	findLargestY = () => {
		return Math.max(...this.props.points.map((p) => p.value))
	}

	plotPoints = (w, h, increment) => {
		//let largestX = this.findLargestX()
		let largestY = this.findLargestY()
		let points = []
		for (let i = 0; i < this.props.points.length; i++) {
			let p = this.props.points[i]
			let x = 5+i * increment
			let y = (getPercentChange(p.value, largestY)) * h/25 + 10
			points.push(`${x},${y}`)
		}
		return points.join(' ')
	}
	
	render() {
		let width = 300
		let height = 50
		let padding = 5
		let stepIncrement = 10
		let points = this.plotPoints(width - padding, height - padding, width / EMA_WINDOW)
		return (
			<svg className='sparkline' viewBox={`0 0 ${width} ${height}`}>
				<polyline stroke='#000' fill='none' strokeWidth='1' points={points} />
			</svg>
		)
	}
}

class SpeedSelector extends React.Component {
	changeSpeed = (el) => {
		setTickSpeed(el.target.value)
	}
	
	render() {
		return (
			<select id='speedSelector' onChange={(e)=>this.changeSpeed(e)}>
				<option value='0'>1 Sec</option>
				<option value='1' selected>3 Sec</option>
				<option value='2'>5 Sec</option>
				<option value='3'>10 Sec</option>
				<option value='-1'>Pause</option>
			</select>
		)
	}
}

/********************************************************
*	PORTFOLIO
********************************************************/

class StocksTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isSorted: false,
			sortedCol: false,
			isSortedAsc: true
		}
	}
	
	renderLastChange(lc) {
		let cls = stylePercentChange(lc)
		cls += ' portfolioTable_Value_LastChange text_right'
		return <span className={cls}>{toMoney(lc, true)}</span>
	}
	
	renderRating(rating) {
		let graphic = RATINGS[clamp(rating, -3, 3) + 3]
		let ratingClass = stylePercentChange(rating)
		if (rating === -8 || rating === 8) ratingClass += ' text_bold'
		return <span className={ratingClass}>{graphic}</span>
	}
	
	highlightRow = (ticker) => {
		if (this.props.highlighted === ticker) {
			this.props.highlighter('')
		} else {
			this.props.highlighter(ticker)
			let el2 = document.getElementById('portfolioTable_Row_' + ticker)
			if (el2) document.getElementById('portfolioPanel').scrollTop = el2.offsetTio - 25
		}
	}		
	
	makeRows() {
		let rows = []
		let data = JSON.parse(JSON.stringify(this.props.stocks))
		if (this.state.isSorted && !this.state.alreadySorted) {
			if (['ticker', 'name'].includes(this.state.sortedCol)) {
				data = alphaSort(data, this.state.sortedCol, this.state.isSortedAsc)
			} else {
				data = numSort(data, this.state.sortedCol, this.state.isSortedAsc)
			}
		}
		
		data.map(p => {
			let subRows = false
			let isParentRow = false
			let rowspan = 1
			let ratingClass = stylePercentChange(p.rating)
			let isHighlighted = (this.props.highlighted === p.ticker)
			let purchasedClass = (p.purchases && p.purchases.length) ? ' purchased' : ''
			rows.push(
				<tr className={'stocksTable_Row' + ((isHighlighted) ? ' highlighted' : '')} id={'stocksTable_Row_'+p.ticker} onClick={() => this.highlightRow(p.ticker)}>
					<td rowspan={rowspan} className={'stocksTable_Ticker text_center text_bold' + purchasedClass}>
						{p.ticker}
					</td>
					<td rowspan={rowspan} title={`Name: ${p.name} \nRegion: ${p.region.toUpperCase()} \nSector: ${properCase(p.sector)} \nOrigin: ${p.desc}`}>
						<span className='stocksTable_Name'>{p.name}</span>
						<br />
						<span className='stocksTable_Desc'>{p.region.toUpperCase()} &#183; {properCase(p.sector)} &#183; {p.desc} </span>
					</td>
					<td className={`stocksTable_Rating text_center`}>
						{this.renderRating(p.rating)}
					</td>
					<td className='text_right'>
						{toMoney(p.cost)}
					</td>
					<td className='text_right'>
						{this.renderLastChange(p.last_change)}
					</td>
					<td className='text_right'>
						{toMoney(p.ema)}
					</td>
					<td className='stocksTable_Value'>
						<LimitMeter min={p.limit_min} max={p.limit_max} value={p.cost} ema={p.ema} lc={p.last_change} points={p.history} />
					</td>
					<td className='text_center'>
						<BuyButton count='1' stockIndex={p.stockIndex} />
						<BuyButton count='5' stockIndex={p.stockIndex} />
						<BuyButton count='max' stockIndex={p.stockIndex} />
					</td>
				</tr>
			)
		})
		return rows
	}
	
	sortTable = (col) => {
		this.setState({
			isSorted: true,
			sortedCol: col,
			isSortedAsc: (this.state.sortedCol === col) ? !this.state.isSortedAsc : this.state.isSortedAsc,
			alreadySorted: false
		})
	}
	
	isSortedBy = (col) => {
		if (this.state.sortedCol === col) return true
		return false
	}
	
	render() {
		let emaTitle = 'EMA' + EMA_WINDOW
		let sortedClass = (this.state.isSortedAsc) ? ' sorted_asc' : ' sorted_desc'
		return (
			<table id='stocksTable'>
				<thead>
					<tr>
						<th className='superHeader' colspan='10'>STOCKS</th>
					</tr>
					<tr>
						<th onClick={()=>this.sortTable('ticker')} className={'text_center cursor_pointer sortable' + (this.isSortedBy('ticker') ? sortedClass : '')}>Ticker</th>
						<th onClick={()=>this.sortTable('name')} className={'text_left cursor_pointer sortable' + (this.isSortedBy('name') ? sortedClass : '')}>Name</th>
						<th className='text_center' title='A graphical rating based on the current performance, which could change at any time'>Rating</th>
						<th onClick={()=>this.sortTable('cost')} className={'text_right cursor_pointer sortable' + (this.isSortedBy('cost') ? sortedClass : '')}>Value</th>
						<th className='text_right'>Change</th>
						<th onClick={()=>this.sortTable('ema')} className={'text_right cursor_pointer sortable' + (this.isSortedBy('ema') ? sortedClass : '')} title={`Estimated Moving Average across last ${EMA_WINDOW} ticks`}>{emaTitle}</th>
						<th className='text_center' title={`Chart showing the current and ${emaTitle} values against the range of historical min and max value`}>Chart</th>
						<th className='text_center'>Actions</th>
					</tr>
				</thead>
				<tbody>{this.makeRows()}</tbody>
			</table>
		)
	}
}

class PortfolioTable extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			isSorted: false,
			sortedCol: false,
			isSortedAsc: true
		}
	}
	
	renderLastChange(lc) {
		let cls = stylePercentChange(lc)
		cls += ' portfolioTable_Value_LastChange text_right'
		return <span className={cls}>{toMoney(lc, true)}</span>
	}
	
	renderRating(rating) {
		let graphic = RATINGS[clamp(rating, -3, 3) + 3]
		let ratingClass = stylePercentChange(rating)
		if (rating === -8 || rating === 8) ratingClass += ' text_bold'
		return <span className={ratingClass}>{graphic}</span>
	}
	
	highlightRow = (ticker) => {
		if (this.props.highlighted === ticker) {
			this.props.highlighter('')
		} else {
			this.props.highlighter(ticker)
			let el1 = document.getElementById('stocksTable_Row_' + ticker)
			if (el1) document.getElementById('stocksPanel').scrollTop = el1.offsetTop - 40
		}
	}		
	
	makeRows() {
		let rows = []
		let data = JSON.parse(JSON.stringify(this.props.stocks))
		if (this.state.isSorted && !this.state.alreadySorted) {
			if (['ticker', 'name'].includes(this.state.sortedCol)) {
				data = alphaSort(data, this.state.sortedCol, this.state.isSortedAsc)
			} else {
				data = numSort(data, this.state.sortedCol, this.state.isSortedAsc)
			}
		}
		
		data.map(p => {
			let subRows = false
			let isParentRow = false
			let rowspan = 1
			let ratingClass = stylePercentChange(p.rating)
			if (p.purchases && p.purchases.length) {
				isParentRow = true
				rowspan = 2
				subRows = subRows || []
				subRows.push(this.makeSubRow(p))
			}
			
			let cls = (isParentRow === true) ? ' parent_row' : ''
			let isHighlighted = (this.props.highlighted === p.ticker)
			rows.push(
				<tr className={'portfolioTable_Row' + cls + ((isHighlighted) ? ' highlighted' : '')} id={'portfolioTable_Row_'+p.ticker} onClick={() => this.highlightRow(p.ticker)}>
					<td rowspan={rowspan} className='portfolioTable_Ticker text_center text_bold'>
						{p.ticker}
					</td>
					<td rowspan={rowspan} title={`Name: ${p.name} \nRegion: ${p.region.toUpperCase()} \nSector: ${properCase(p.sector)} \nOrigin: ${p.desc}`}>
						<span className='portfolioTable_Name'>{p.name}</span>
						<br />
						<span className='portfolioTable_Desc'>{p.region.toUpperCase()} &#183; {properCase(p.sector)} &#183; {p.desc} </span>
					</td>
					<td className={`portfolioTable_Rating text_center`}>
						{this.renderRating(p.rating)}
					</td>
					<td className='text_right'>
						{toMoney(p.cost)}
					</td>
					<td className='text_right'>
						{this.renderLastChange(p.last_change)}
					</td>
					<td className='text_right'>
						{toMoney(p.ema)}
					</td>
					<td className='portfolioTable_Value'>
						<LimitMeter min={p.limit_min} max={p.limit_max} value={p.cost} ema={p.ema} lc={p.last_change} points={p.history} />
					</td>
					<td className='text_center'>
						<BuyButton count='1' stockIndex={p.stockIndex} />
						<BuyButton count='5' stockIndex={p.stockIndex} />
						<BuyButton count='max' stockIndex={p.stockIndex} />
					</td>
				</tr>
			)
			
			if (isParentRow) rows.push(subRows)
		})
		return rows
	}
	
	sortTable = (col) => {
		this.setState({
			isSorted: true,
			sortedCol: col,
			isSortedAsc: (this.state.sortedCol === col) ? !this.state.isSortedAsc : this.state.isSortedAsc,
			alreadySorted: false
		})
	}
	
	isSortedBy = (col) => {
		if (this.state.sortedCol === col) return true
		return false
	}
	
	render() {
		let rows = []
		this.props.stocks.map((r) => {
			if (r.purchases && r.purchases.length) {
				for (let i = 0; i < r.purchases.length; i++) {
					let p = r.purchases[i]
					let change = getPercentChange(p.count * p.cost, r.cost * p.count)
					let cls = stylePercentChange(change)
					let value = p.count * r.cost
					let diff = value - (p.count * p.cost)
					let isHighlighted = (this.props.highlighted === r.ticker)
					rows.push(
						<tr className={'portfolioTable_Row' + ((isHighlighted) ? ' highlighted': '')} id={'portfolioTable_Row_'+r.ticker} onClick={() => this.highlightRow(r.ticker)}>
							<td className='text_center text_bold'>{r.ticker}</td>
							<td className='text_center'>{p.count}</td>
							<td className='text_right'>{toMoney(p.cost)}</td>
							<td className='text_right'>{`${toMoney(value)}`}</td>
							<td className='text_right'>{`${toMoney(diff, true)}`}</td>
							<td className={cls + ' text_right'}>{money(change) + '%'}</td>
							<td className='text_center'>
								<SellButton count='1' stockIndex={r.stockIndex} purchaseIndex={i} />
								<SellButton count='5' stockIndex={r.stockIndex} purchaseIndex={i} disabled={(p.count < 5)} />
								<SellButton count='max' stockIndex={r.stockIndex} purchaseIndex={i} />
							</td>
						</tr>
					)
				}
			}
		})
		
		return (
			<table id='portfolioTable'>
				<thead>
					<tr>
						<th className='superHeader' colspan='10'>PORTFOLIO</th>
					</tr>
					<tr>
						<th onClick={()=>this.sortTable('ticker')} className='text_center'>Ticker</th>
						<th onClick={()=>this.sortTable('count')} className='text_center'>Count</th>
						<th onClick={()=>this.sortTable('cost')} className='text_right'>Orig.</th>
						<th onClick={()=>this.sortTable('value')} className='text_right'>Curr.</th>
						<th className='text_right'>Diff</th>
						<th className='text_right'>Change</th>
						<th className='text_center'>Actions</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</table>
		)
	}
}

class BondPanel extends React.Component {
	render() {
		return []
	}
}

class EventPanel extends React.Component {
	highlightRow = (ticker) => {
		if (this.props.highlighted === ticker) {
			this.props.highlighter('')
		} else {
			this.props.highlighter(ticker)
			this.scroller(ticker)
		}
	}
	
	scroller = (ticker) => {
		let el1 = document.getElementById('stocksTable_Row_' + ticker)
		let el2 = document.getElementById('portfolioTable_Row_' + ticker)
		if (el1) document.getElementById('stocksPanel').scrollTop = el1.offsetTop - 40
		if (el2) document.getElementById('portfolioPanel').scrollTop = el2.offsetTio - 25
	}
	
	makeRows(events) {
		let rows = []
		for (let i = 0; i < events.length; i++) {
			rows.push(
				<tr onClick={() => { if (events[i].target && events[i].target !== '-') this.highlightRow(events[i].target) }}>
					<td className='eventTable_Tick text_center'>{events[i].tick}</td>
					<td className='eventTable_Type text_center'>{events[i].type}</td>
					<td className='eventTable_Type text_center cursor_pointer' title={`Click to highlight and scroll to ${events[i].target}`}>{events[i].target}</td>
					<td className='eventTable_Message'>{events[i].message}</td>
				</tr>
			)
		}
		return rows
	}
	
	render() {
		let rows = this.makeRows(this.props.events)
		return (
			<table id='eventTable' className='vertical_scroll'>
				<thead id='eventTable_Header'>
					<tr>
						<th className='superHeader' colspan='4'>EVENTS</th>
					</tr>
					<tr>
						<th>Tick</th>
						<th>Type</th>
						<th>Target</th>
						<th className='text_left'>Message</th>
					</tr>
				</thead>
				<tbody id='eventTable_Body'>
					{ rows }
				</tbody>
			</table>
		)
	}
}

class AccountTable extends React.Component {
	render() {
		return (
			<table id='accountTable'>
				<thead>
					<tr>
						<th className='superHeader' colspan='6'>ACCOUNT</th>
					</tr>
					<tr>
						<th className='text_center'>TICK</th>
						<th className='text_right'>TRADE</th>
						<th className='text_right'>BANK</th>
						<th className='text_right'>TAXABLE</th>
						<th className='text_right'>TOTAL</th>
						<th className='text_center'>SPEED</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td className='text_center'>{this.props.tick}</td>
						<td className='text_right'>{toMoney(this.props.money)}</td>
						<td className='text_right'>{toMoney(this.props.bank)}</td>
						<td className='text_right'>{toMoney(this.props.taxable)}</td>
						<td className='text_right'>{toMoney(getPortfolioValue())}</td>
						<td className='text_center'>
							<SpeedSelector />
						</td>
					</tr>
				</tbody>
			</table>
		)
	}
}

ReactDOM.render(<App state={state} />, document.body)




/*
PortfolioPage
	PortfolioTable
		ActionButton
		(link to StockPage)
	BondPanel
	AccountPanel
	(link to Directory)
	EventPanel
StockPage
	StockGraph
	StockStatBlock
	ActionButton
BondPanel
	Selector for size
	Buy button
EventPanel
	Table of events
*/