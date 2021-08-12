const Simple1DNoise = function(amp=1, wavelength=0.5) {
    const MAX_VERTICES = 256
    const MAX_VERTICES_MASK = MAX_VERTICES -1

    var r = []

	function rand() {
		// a - 1 should be divisible by m's prime factors
		// c and m should be co-prime
		let M = 4294967296, A = 1664525, C = 1
		let Z = Math.floor(Math.random() * M)
		Z = (A * Z + C) % M
		return Z / M
	}

    for (var i = 0; i < MAX_VERTICES; ++i) {
        r.push(rand())
    }

    const getVal = function(x) {
        var scaledX = x * wavelength
        var xFloor = Math.floor(scaledX)
        var t = scaledX - xFloor
        var tRemapSmoothstep = t * t * ( 3 - 2 * t )

        // Modulo using %
        var xMin = xFloor % MAX_VERTICES_MASK
        var xMax = (xMin + 1) % MAX_VERTICES_MASK
        var y = lerp( r[ xMin ], r[ xMax ], tRemapSmoothstep )
        // var y = interpolate(r[xMin], r[xMax], tRemapSmoothstep)

        return y * amp
    }

    function lerp(a, b, t) {
        return a * (1 - t) + b * t
    }
	
    // return the API
    return {
        getVal,
        setAmplitude: function(newAmp) {
            amp = newAmp
        },
        setScale: function(newWavelength) {
            wavelength = newWaveLength
        }
    };
}

const Chorus = function(octaves=8, amp=1, wavelength=0.5) {
	let chorus = []
	for (let i = 0; i < octaves; i++) {
		chorus.push(new Simple1DNoise(amp, wavelength))
		amp /= 2
		wavelength /= 2
	}
	
	return {
		getVal: function(tick) {
			let result = 0
			for (let i = 0; i < octaves; i++) {
				result += chorus[i].getVal(tick)
			}
			return result
		}
	}
}

function getData(tick) {

	function rand() {
		// a - 1 should be divisible by m's prime factors
		// c and m should be co-prime
		let M = 4294967296, A = 1664525, C = 1
		let Z = Math.floor(Math.random() * M)
		Z = (A * Z + C) % M
		return Z / M
	}
	
	function interpolate(pa, pb, px=0.5) {
		// [a, b] are coords
		// x is a decimal for where between the two points the new point should be
		let ft = px * Math.PI
		let f = (1 - Math.cos(ft)) * 0.5
		return pa * (1 - f) + pb * f
	}
	
	// let x = 0
    let amp = 10 //amplitude, top to bottom
    let wl = 0.5 //wavelength, peak to peak
    let y = wl / 2	// assumes drawing to a canvas of h height
    // let fq = 1 / wl //frequency, waves per unit time
    let a = rand()
    let b = rand()
	
	let result = []
	
	if(tick % wl === 0) {
		a = b;
		b = rand();
		y = wl / 2 + a * amp;
	} else {
		y = wl / 2 + interpolate(a, b, (tick % wl) / wl) * amp
	}
	
	return y
}


let noise1 = new Chorus(8,1,0.1)
let noise2 = new Chorus(8,1,0.5)
for (let i = 0; i < 100; i++) {
	let point1 = noise1.getVal(i)
	let point2 = noise2.getVal(i)
	console.log(i, point1*10, point2*10)
}