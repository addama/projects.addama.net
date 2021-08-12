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
			highlighted: false
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
				<section id='accountPanel'>
					<AccountPanel money={this.state.state.portfolio.money} bank={this.state.state.portfolio.bank} taxable={this.state.state.portfolio.taxable} tick={this.state.state.tick} />
					<EventPanel events={this.state.state.events} highlighter={this.setCurrentStock} />
				</section>
				<section id='portfolioPanel' className='vertical_scroll'>
					<PortfolioTable portfolio={this.state.state.portfolio} stocks={this.state.state.stocks} highlighted={this.state.highlighted} highlighter={this.setCurrentStock} />
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
	
	render2() {
		let value_percent = this.getPercent(this.props.min, this.props.max, this.props.value)
		let ema_percent = this.getPercent(this.props.min, this.props.max, this.props.ema10)
		return (
			<div className='meter' title={`Value: ${toMoney(this.props.value)};\nMin: ${toMoney(this.props.min)};\nMax: ${toMoney(this.props.max)};\nEMA10: ${toMoney(this.props.ema10)}`}>
				<div className='bar' style={{width: `${value_percent}%`}}></div>
				<div className={'line ' + ((value_percent >= ema_percent)?'better':'')} style={{left: `${ema_percent}%`}}></div>
				<div className='meter_text'>
					<span className='meter_lastChange'>{this.renderLastChange(this.props.lc)}</span>
					<br />
					<span className='meter_value'>{toMoney(this.props.value)}</span>
				</div>
			</div>
		)
	}	
	
	render() {
		let value_percent = this.getPercent(this.props.min, this.props.max, this.props.value)
		let ema_percent = this.getPercent(this.props.min, this.props.max, this.props.ema10)
		return (
			<div className='meter' title={`Value: ${toMoney(this.props.value)} \nMin: ${toMoney(this.props.min)} \nMax: ${toMoney(this.props.max)} \nEMA30: ${toMoney(this.props.ema10)}`}>
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
				<a href='https://addama.net'>addama.net</a>
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

/********************************************************
*	PORTFOLIO
********************************************************/

class PortfolioTable extends React.Component {
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
		}
	}		
	
	makeSubRow(row) {
		//console.log('makeSubRow', row)
		let purchases = []
		for (let i = 0; i < row.purchases.length; i++) {
			let p = row.purchases[i]
			let change = getPercentChange(p.count * p.cost, row.cost * p.count)
			let cls = stylePercentChange(change)
			let value = p.count * row.cost
			let diff = value - (p.count * p.cost)
			purchases.push(
				<tr className='portfolioTable_Row'>
					<td className='text_center'>{p.count}</td>
					<td className='text_right'>{toMoney(p.cost)}</td>
					<td className='text_right'>{`${toMoney(value)} (${toMoney(diff, true)})`}</td>
					<td className={cls + ' text_center'}>{money(change) + '%'}</td>
					<td className='text_center'>
						<SellButton count='1' stockIndex={row.stockIndex} purchaseIndex={i} />
						<SellButton count='5' stockIndex={row.stockIndex} purchaseIndex={i} disabled={(p.count < 5)} />
						<SellButton count='max' stockIndex={row.stockIndex} purchaseIndex={i} />
					</td>
				</tr>
			)
		}
		
		return (
			<tr>
				<td colspan='5' className='portfolioTable_SubRow text_center'>
					<table className='portfolioTable_SubTable'>
						<thead>
							<tr>
								<th className='text_center'>Count</th>
								<th className='text_right'>Price</th>
								<th className='text_right'>Value</th>
								<th className='text_center'>Change</th>
								<th className='text_center'>
									<span>Actions</span>
									<SellButton count='all' stockIndex={row.stockIndex} />
								</th>
							</tr>
						</thead>
						<tbody>{purchases}</tbody>
					</table>
				</td>
			</tr>
		)
	}
	
	makeRows() {
		let rows = []
		this.props.stocks.map(p => {
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
						{toMoney(p.ema10)}
					</td>
					<td className='portfolioTable_Value'>
						<LimitMeter min={p.limit_min} max={p.limit_max} value={p.cost} ema10={p.ema10} lc={p.last_change} />
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
	
	render() {
		let emaTitle = 'EMA' + EMA_WINDOW
		return (
			<table id='portfolioTable'>
				<thead>
					<tr>
						<th className='superHeader' colspan='10'>STOCKS</th>
					</tr>
					<tr>
						<th className='text_center'>Ticker</th>
						<th className='text_left'>Name</th>
						<th className='text_center' title='A graphical rating based on the current performance, which could change at any time'>Rating</th>
						<th className='text_right'>Value</th>
						<th className='text_right'>Change</th>
						<th className='text_right' title={`Estimated Moving Average across last ${EMA_WINDOW} ticks`}>{emaTitle}</th>
						<th className='text_center' title={`Chart showing the current and ${emaTitle} values against the range of historical min and max value`}>Chart</th>
						<th className='text_center'>Actions</th>
					</tr>
				</thead>
				<tbody>{
					this.makeRows()
				}</tbody>
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
		let top = document.getElementById('portfolioTable_Row_' + ticker).offsetTop
		document.getElementById('portfolioPanel').scrollTop = top - 25
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

class AccountPanel extends React.Component {
	render() {
		return (
			<div id='accountPanel'>
				<table id='accountPanel_Table'>
					<tbody>
						<tr>
							<td id='accountPanel_TradeLabel' className='text_right text_bold' title={`Each game tick takes ${TICK_LENGTH / 1000} real world seconds`}>TICK</td>
							<td id='accountPanel_TradeAmount' className='text_right'>{this.props.tick}</td>
							
							<td id='accountPanel_TradeLabel' className='text_right text_bold' title='The money you have available to trade'>TRADE</td>
							<td id='accountPanel_TradeAmount' className='text_right'>{toMoney(this.props.money)}</td>
						
							<td id='accountPanel_BankLabel' className='text_right text_bold' title='The money you have in an interest-bearing bank account'>BANK</td>
							<td id='accountPanel_BankAmount' className='text_right'>{toMoney(this.props.bank)}</td>
					
							<td id='accountPanel_TaxableLabel' className='text_right text_bold' title={`Profit made from selling stock is taxable at a rate of ${TAX_PERCENT * 100}% every ${TAX_INCREMENT} ticks`}>TAXABLE</td>
							<td id='accountPanel_TaxableAmount' className='text_right'>{toMoney(this.props.taxable)}</td>
							
							<td id='accountPanel_TaxableLabel' className='text_right text_bold' title='The total value of all of your accounts and holdings'>TOTAL</td>
							<td id='accountPanel_TaxableAmount' className='text_right'>{toMoney(getPortfolioValue())}</td>
						</tr>
					</tbody>
				</table>
			</div>
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