/********************************************************
*	DATABASE
********************************************************/

var database = {
	"version": 0.1,
	"regions": [ "world", "na", "sa", "eu", "af", "as", "oc" ],
	"sectors": [ "healthcare", "industrials", "tech", "financials", "materials", "utilities", "energy", "consumables", "comm", "realestate", "leisure" ],
	"stocks": [
		// { "ticker": "", "name": "", "desc": "", "sector": "", "region": "" },
		{ "ticker": "MBS", "name": "Mittelos Bioscience", "desc": "Lost", 				"sector": "healthcare", "region": "" },
		{ "ticker": "AI", "name": "Adipose Industries", "desc": "Dr. Who", 			"sector": "healthcare", "region": "" },
		{ "ticker": "ARK", "name": "Arkham Healthcare Services", "desc": "Batman",		"sector": "healthcare", "region": "" },
		{ "ticker": "V", "name": "Vought International", "desc": "The Boys", 		"sector": "healthcare", "region": "" },
		{ "ticker": "INGN", "name": "International Genetic Technologies, Inc", "desc": "Jurassic Park", 	"sector": "healthcare", "region": "" },
		{ "ticker": "VLC", "name": "VersaLife Corporation", "desc": "Deus Ex", 		"sector": "healthcare", "region": "" },
		{ "ticker": "U", "name": "Umbrella Corportation", "desc": "Resident Evil",	"sector": "healthcare", "region": "" },
		{ "ticker": "T", "name": "Tyrell Corporation", "desc": "Blade Runner",		"sector": "healthcare", "region": "" },
		{ "ticker": "LMC", "name": "Liandri Mining Corporation", "desc": "Unreal",		"sector": "industrials", "region": "" },
		{ "ticker": "VA", "name": "Vaillante Auto", "desc": "Michel Vaillant",		"sector": "industrials", "region": "" },
		{ "ticker": "YYD", "name": "Yoyodyne Propulsion Systems", "desc": "Star Trek",	"sector": "industrials", "region": "" },
		{ "ticker": "NMC", "name": "National Motors Corporation", "desc": "Wheels",	"sector": "industrials", "region": "" },
		{ "ticker": "OA", "name": "Oceanic Airlines", "desc": "Lost",					"sector": "industrials", "region": "" },
		{ "ticker": "SKR", "name": "Skarloey Railway", "desc": "Thomas the Tank Engine",	"sector": "industrials", "region": "" },
		{ "ticker": "SMR", "name": "Sodor & Mainland Railway", "desc": "Thomas the Tank Engine",	"sector": "industrials", "region": "" },
		{ "ticker": "TRAS", "name": "Trask Industries", "desc": "X-Men",				"sector": "industrials", "region": "" },
		{ "ticker": "ASI", "name": "Aperture Science Innovators", "desc": "Portal",	"sector": "tech", "region": "" },
		{ "ticker": "HOOL", "name": "Hooli", "desc": "Silicon Valley", 					"sector": "tech", "region": "" },
		{ "ticker": "ABI", "name": "Abstergo Industries", "desc": "Assassin's Creed",	"sector": "tech", "region": "" },
		{ "ticker": "CDI", "name": "Cyberdyne Systems", "desc": "Terminator", 			"sector": "tech", "region": "" },
		{ "ticker": "WY", "name": "Weyland-Yutani Corp", "desc": "Alien", 			"sector": "tech", "region": "" },
		{ "ticker": "CCC", "name": "Capsule Corporation", "desc": "Drabonball", 		"sector": "tech", "region": "" },
		{ "ticker": "ARA", "name": "Arasaka Corporation", "desc": "Cyberpunk 2077", 	"sector": "tech", "region": "" },
		{ "ticker": "CRSS", "name": "Cross Technologies", "desc": "Ant-Man", 			"sector": "tech", "region": "" },
		{ "ticker": "SRFI", "name": "Sarif Industries", "desc": "Deus Ex",	 			"sector": "tech", "region": "" },
		{ "ticker": "NCP", "name": "North Central Positronics", "desc": "The Dark Tower",	"sector": "tech", "region": "" },
		{ "ticker": "G", "name": "Gekko & Co.", "desc": "Wall Street", 				"sector": "financials", "region": "" },
		{ "ticker": "D", "name": "DELOS, Inc", "desc": "Westworld", 					"sector": "financials", "region": "" },
		{ "ticker": "W", "name": "Wayne Enterprises", "desc": "Batman", 				"sector": "financials", "region": "" },
		{ "ticker": "PP", "name": "Pierce & Pierce Mergers and Acquisitions", "desc": "American Psycho",	"sector": "financials", "region": "" },
		{ "ticker": "PRI", "name": "Primatech Paper Co.", "desc": "Heroes", 			"sector": "materials", "region": "" },
		{ "ticker": "SRGC", "name": "Slate Rock and Gravel Co", "desc": "The Flintstones",	"sector": "materials", "region": "" },
		{ "ticker": "VDA", "name": "Vandelay Industries", "desc": "Seinfeld", 			"sector": "materials", "region": "" },
		{ "ticker": "EMC", "name": "Ellingson Mineral Corporation", "desc": "Hackers",	"sector": "materials", "region": "" },
		{ "ticker": "DM", "name": "Dunder Mifflin", "desc": "The Office", 			"sector": "materials", "region": "" },
		{ "ticker": "ACE", "name": "Ace Chemicals", "desc": "Batman", 					"sector": "materials", "region": "" },
		{ "ticker": "GMC", "name": "Golden Moth Chemical", "desc": "Breaking Bad", 	"sector": "materials", "region": "" },
		{ "ticker": "SHIN", "name": "Shinra Electric Power Company", "desc": "Final Fantasy VII",	"sector": "utilities", "region": "" },
		{ "ticker": "HPL", "name": "Hawkins Power and Light", "desc": "Stranger Things",	"sector": "utilities", "region": "" },
		{ "ticker": "PCOM", "name": "Parrish Communications", "desc": "Meet Joe Black", "sector": "utilities", "region": "" },
		{ "ticker": "MCCC", "name": "McCandless Communications Corporation", "desc": "Freejack", "sector": "utilities", "region": "" },
		{ "ticker": "GSPL", "name": "Golden State Power and Light", "desc": "Overload",	"sector": "utilities", "region": "" },
		{ "ticker": "BEN", "name": "Benthic Petroleum", "desc": "Twister, Terminator, The Abyss",	"sector": "energy", "region": "" },
		{ "ticker": "EOIL", "name": "Ewing Oil", "desc": "Dallas", 						"sector": "energy", "region": "" },
		{ "ticker": "OO", "name": "ORINCO oil", "desc": "Pet Sematary", 				"sector": "energy", "region": "" },
		{ "ticker": "DINO", "name": "Dinoco Oil", "desc": "Toy Story, Cars", 			"sector": "energy", "region": "" },
		{ "ticker": "RGCC", "name": "Rio Grande Coal Co.", "desc": "Team Fortress 2", 	"sector": "energy", "region": "" },
		{ "ticker": "RSML", "name": "Rolling Stone Mining Logistics", "desc": "Team Fortress 2",	"sector": "energy", "region": "" },
		{ "ticker": "TANG", "name": "Tangan Industries", "desc": "Star Wars: The Clone Wars",	"sector": "energy", "region": "" },
		{ "ticker": "GP", "name": "Genco Pura Olive Oil Company", "desc": "The Godfather",	"sector": "consumables", "region": "" },
		{ "ticker": "SOY", "name": "Soylent Corporation", "desc": "Soylent Green",		"sector": "consumables", "region": "" },
		{ "ticker": "PUFT", "name": "Stay Puft Corporation", "desc": "Ghostbusters",	"sector": "consumables", "region": "" },
		{ "ticker": "BL", "name": "Buy and Large Corp", "desc": "WALL-E",				"sector": "consumables", "region": "" },
		{ "ticker": "AEFO", "name": "Arctic & European Fish Oil Company", "desc": "The Day of the Triffids", 	"sector": "consumables", "region": "" },
		{ "ticker": "WW", "name": "Willy Wonka Candy Company", "desc": "Charlie and the Chocolate Factory",	"sector": "consumables", "region": "" },
		{ "ticker": "MOR", "name": "Morley Tobacco", "desc": "Many movies, shows, and games",	"sector": "consumables", "region": "" },
		{ "ticker": "FCI", "name": "FrobozzCo International", "desc": "Zork", 			"sector": "consumables", "region": "" },
		{ "ticker": "CHCI", "name": "Chaco Chicken Corporation", "desc": "X-Files", 	"sector": "consumables", "region": "" },
		{ "ticker": "MMT", "name": "McMahon and Tate", "desc": "Bewitched", 			"sector": "comm", "region": "" },
		{ "ticker": "ENC", "name": "ENCOM", "desc": "Tron", 							"sector": "comm", "region": "" },
		{ "ticker": "PM", "name": "Parcher and Murphy", "desc": "Desperate Housewives",	"sector": "comm", "region": "" },
		{ "ticker": "SCDP", "name": "Sterling-Cooper-Draper-Price", "desc": "Mad Men",	"sector": "comm", "region": "" },
		{ "ticker": "BLUM", "name": "Blume Corporation", "desc": "Watch Dogs", 			"sector": "comm", "region": "" },
		{ "ticker": "INI", "name": "Initech", "desc": "Office Space", "sector": "comm", "region": "" },
		{ "ticker": "GOB", "name": "Golden Goblin Press", "desc": "H.P. Lovecraft",	"sector": "comm", "region": "" },
		{ "ticker": "GCOM", "name": "Galaxy Communications", "desc": "Superman", 		"sector": "comm", "region": "" },
		{ "ticker": "BWLF", "name": "Bad Wolf Corporation", "desc": "Dr. Who", 			"sector": "comm", "region": "" },
		{ "ticker": "NOOK", "name": "Nook, Inc", "desc": "Animal Crossing", 			"sector": "realestate", "region": "" },
		{ "ticker": "BLU", "name": "Bluth Company", "desc": "Arrested Development", 	"sector": "realestate", "region": "" },
		{ "ticker": "RED", "name": "Red Blazer Realty", "desc": "The Simpsons", 		"sector": "realestate", "region": "" },
		{ "ticker": "DOME", "name": "Grayson Sky Domes, Ltd.", "desc": "Honorverse", 	"sector": "realestate", "region": "" },
		{ "ticker": "CONT", "name": "Continental Hospitality", "desc": "John Wick", 	"sector": "leisure", "region": "" },
		{ "ticker": "OLH", "name": "Overlook Hotels", "desc": "The Shining", 			"sector": "leisure", "region": "" },
		{ "ticker": "MUGA", "name": "Mugatu Fashion Industries", "desc": "Zoolander", 	"sector": "leisure", "region": "" },
		{ "ticker": "JC", "name": "Jabot Cosmetics", "desc": "The Young and the Restless",	"sector": "leisure", "region": "" }
	]
}



/* 		Acme Corp								*
		Massive Dynamic							*
		Nakatomi Corporation					*
		Volition, Inc							*
		Veidt
		Izon (military weaponry)
		Hanso Foundation (Lost)
		Praxis Multinational
		Subarashi Multinational
		Brawndo Multinational Beverage products
		Omni Consumer Products (robocop)
		Graystone Industries (caprica)
		Ajax Corporation (mickey)
		Momcorp */


/********************************************************
*	LOCALSTORAGE
********************************************************/

const STORAGE = window.localStorage
const STATE_KEY = 'state'

function _clearStorage() {
	STORAGE.clear()
	return true
}

function _setStorageItem(key, data, overwrite=true) {
	if (!overwrite) {
		if (_getStorageItem(key)) return false
	}
	STORAGE.setItem(key, JSON.stringify(data))
	return true
}

function _getStorageItem(key) {
	if (!STORAGE.length) return false
	let item = false
	try {
		item = JSON.parse(STORAGE.getItem(key))
	} catch(e) {
		console.error(e)
	}
	return item
}

function _getStorageSize() {
	let total = 0
	let size = 0
	for (key in localStorage) {
		if (!localStorage.hasOwnProperty(key)) continue
		size = ((localStorage[key].length + key.length) * 2)
		total += size
		console.log(key.substr(0, 50) + " = " + (size / 1024).toFixed(2) + " KB")
	}
	console.log("Total = " + (total / 1024).toFixed(2) + " KB")
}

/********************************************************
*	GAME DATA
********************************************************/

function loadGame() {
	return _getStorageItem(STATE_KEY)
}

function saveGame(item) {
	return _setStorageItem(STATE_KEY, item)
}