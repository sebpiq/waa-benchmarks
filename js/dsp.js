// A series of functions for computing DSP in JavaScript

;(function() {

var BLOCK_SIZE = null
var SAMPLE_RATE = null


function initialize(opts) {
  if (!opts.blockSize || !opts.sampleRate)
    throw new Error('missing initialization parameters')
  BLOCK_SIZE = opts.blockSize
  SAMPLE_RATE = opts.sampleRate
}


var Zeros = function() {
  this.zeros = new Float32Array(BLOCK_SIZE)
  this.outBlock = new Float32Array(BLOCK_SIZE)
}

Zeros.prototype.pullBlock = function() {
  this.outBlock.set(this.zeros)
  return this.outBlock
}


var Osc = function() {
  this.phase = 0
  this.J = 2 * Math.PI / SAMPLE_RATE
  this.setFreq(0)
  this.outBlock = new Float32Array(BLOCK_SIZE)
}

Osc.prototype.pullBlock = function() {
  var outBlock = this.outBlock
  var K = this.K
  var phase = this.phase
  var i, length

  for (i = 0, length = outBlock.length; i < length; i++) {
    phase += K
    outBlock[i] = Math.cos(phase)
  }

  this.phase = phase
  return outBlock
}

Osc.prototype.setFreq = function(freq) {
  this.K = this.J * freq
}


var Sum = function() {
  this.sources = []
  this.outBlock = new Float32Array(BLOCK_SIZE)
  this.zeros = new Float32Array(BLOCK_SIZE)
}

Sum.prototype.pullBlock = function() {
  var i, j, sourcesCount
  var inBlock
  var outBlock = this.outBlock
  outBlock.set(this.zeros)
  for (i = 0, sourcesCount = this.sources.length; i < sourcesCount; i++) {
    inBlock = this.sources[i].pullBlock()
    for (j = 0; j < BLOCK_SIZE; j++)
      outBlock[j] += inBlock[j]
  }
  return outBlock
}

Sum.prototype.pushSource = function(source) {
  this.sources.push(source)
}

Sum.prototype.popSource = function() {
  this.sources.pop()
}


var Gain = function(source) {
  this.source = source
  this.gain = 1
  this.outBlock = new Float32Array(BLOCK_SIZE)
}

Gain.prototype.pullBlock = function() {
  var outBlock = this.outBlock
  outBlock.set(this.source.pullBlock())
  var i, length
  for (i = 0; i < BLOCK_SIZE; i++)
    outBlock[i] *= this.gain
  return outBlock
}

Gain.prototype.setGain = function(gain) {
  this.gain = gain
}


this.dsp = {
  initialize: initialize,
  Zeros: Zeros,
  Osc: Osc,
  Sum: Sum,
  Gain: Gain
}

}).apply(this)