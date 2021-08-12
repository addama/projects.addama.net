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
			currentStock: false
		}
		start(this)
	}
	
	tick(data) {
		let newState = { state: data }
		if (this.state.startup) {
			newState['startup'] = false
			newState['page'] = 'portfolio'
		}
		this.setState(newState)
	}

	setCurrentStock(stockIndex) {
		this.setState({
			currentStock: stockIndex
		})
	}
	
	changePage(page) {
		this.setState({
			page
		})
	}

	renderContent() {
		switch (this.state.page) {
			case 'portfolio':
				return <PortfolioPage state={this.state.state} />
				break
			case 'stock':
				return <StockPage stock={this.state.currentStock} />
				break
			case 'directory':
				return <DirectoryPage state={this.state.state} />
				break
			case 'loading':
			default:
				return <LoadingScreen />
				break
		}
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

class LimitMeter extends React.Component {
	getPercent(min, max, cur) {
		return ((cur - min) * 100) / (max - min)
	}
	
	render() {
		let value_percent = this.getPercent(this.props.min, this.props.max, this.props.value)
		let ema_percent = this.getPercent(this.props.min, this.props.max, this.props.ema10)
		return (
			<div className='meter' title={`Min: ${money(this.props.min)}; Max: ${money(this.props.max)}; EMA10: ${money(this.props.ema10)}`}>
				<div className='bar' style={{width: `${value_percent}%`}}></div>
				<div className='line' style={{left: `${ema_percent}%`}}></div>
				<span className='meter_text text_mono'>{money(this.props.value)}</span>
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
		return (
			<div id='loadingScreen'>
				<h1>Loading...</h1>
			</div>
		)
	}
}

class SellButton extends React.Component {
	// <SellButton count=<n,max> stockIndex=<n> />
	handleSell() {
		if (this.props.count === 'max') {
			sellMaxShares(this.props.stockIndex)
		} else {
			sellShares(this.props.stockIndex, this.props.amount)
		}
	}
	
	render() {
		let text = '-'+this.props.count
		return <input 
			className={'button sellButton'}
			type={'button'} 
			onClick={this.handleSell()} 
			value={text} 
			title={`Sell ${this.props.count} shares`}
		/>
	}
}

class BuyButton extends React.Component {
	// <BuyButton count=<n,max> stockIndex=<n> />
	handleBuy() {
		if (this.props.count === 'max') {
			buyMaxShares(this.props.stockIndex)
		} else {
			buyShares(this.props.stockIndex, this.props.count)
		}
	}
	
	render() {
		let text = '+'+this.props.count
		return <input 
			className={'button buyButton'}
			type='button' 
			onClick={this.handleSell()} 
			value={text} 
			title={`Buy ${this.props.count} shares`}
		/>
	}
}

/********************************************************
*	PORTFOLIO
********************************************************/

class PortfolioPage extends React.Component {
	render() {
		console.log('PORTFOLIO',this.props.state)
		return (
			<section id='portfolioPage' className='grid'>
				<AccountPanel money={this.props.state.portfolio.money} bank={this.props.state.portfolio.bank} taxable={this.props.state.portfolio.taxable} />
				<PortfolioTable portfolio={this.props.state.portfolio} stocks={this.props.state.stocks} />
				<EventPanel events={this.props.state.events} />
			</section>
		)
	}
}

class PortfolioTable extends React.Component {
	renderLastChange(lc) {
		let cls = (lc < 0) ? 'negative_change' : 'positive_change'
		cls += ' text_right text_mono'
		return <span className={cls}>{money(lc)}</span>
	}
	
	render() {
		return (
			<table id='portfolioTable'>
				<thead>
					<tr>
						<th className='text_center'>Ticker</th>
						<th className='text_left'>Name</th>
						<th className='text_left'>Region</th>
						<th className='text_left'>Sector</th>
						<th className='text_right'>Last Change</th>
						<th>Value</th>
					</tr>
				</thead>
				<tbody>{
					this.props.stocks.map(p => (
						<tr>
							<td className='text_center'>
								<span className='portfolioTable_Ticker'>{p.ticker}</span>
							</td>
							<td>
								<span className='portfolioTable_Name'>{p.name}</span>
								<br />
								<span className='portfolioTable_Desc'>{p.desc}</span>
							</td>
							<td className='portfolioTable_Region'>{p.region.toUpperCase()}</td>
							<td className='portfolioTable_Sector'>{properCase(p.sector)}</td>
							<td className='text_right text_mono'>{this.renderLastChange(p.last_change)}</td>
							<td>
								<LimitMeter min={p.limit_min} max={p.limit_max} value={p.cost} ema10={p.ema10} />
							</td>
						</tr>
					))
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
	makeRows(events) {
		let rows = []
		for (let i = 0; i < events.length; i++) {
			rows.push(
				<tr>
					<td className='eventTable_Tick text_center'>{events[i].tick}</td>
					<td className='eventTable_Type text_center'>{events[i].type}</td>
					<td className='eventTable_Message'>{events[i].message}</td>
				</tr>
			)
		}
		return rows
	}
	
	render() {
		let rows = this.makeRows(this.props.events)
		
		return (
			<div id='eventPanel'>
				<table id='eventTable'>
					<thead id='eventTable_Header'>
						<tr>
							<th>Tick</th>
							<th>Type</th>
							<th>Message</th>
						</tr>
					</thead>
					<tbody id='eventTable_Body'>
						{ rows }
					</tbody>
				</table>
			</div>
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
							<td id='accountPanel_TradeLabel'>TRADE</td>
							<td id='accountPanel_TradeAmount' className='text_center'>{this.props.money}</td>
						</tr>
						<tr>
							<td id='accountPanel_BankLabel'>BANK</td>
							<td id='accountPanel_BankAmount' className='text_center'>{this.props.bank}</td>
						</tr>
						<tr>
							<td id='accountPanel_TaxableLabel'>TAXABLE</td>
							<td id='accountPanel_TaxableAmount' className='text_center'>{this.props.taxable}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}

/********************************************************
*	STOCK
********************************************************/

class StockPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = this.props.state
	}
	
	render() {
		console.log('PORTFOLIO',this.state)
		return <div>STOCK</div>
	}
}

class StockGraph extends React.Component {
	render() {
		return []
	}
}

class StockStatPanel extends React.Component {
	render() {
		return []
	}
}

/********************************************************
*	DIRECTORY
********************************************************/

class DirectoryPage extends React.Component {
	render() {
		return <div>DIRECTORY</div>
	}
}

class DirectorySearchPanel extends React.Component {
	render() {
		return []
	}
}

class DirectorySearchTable extends React.Component {
	render() {
		return []
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
DirectoryPage
	SearchPanel
	SearchTable
		(link to StockPage)
		ActionButton
EventPanel
	Table of events
*/