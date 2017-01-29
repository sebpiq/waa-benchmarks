// A few helpers
(function() {


// A helper for sending the results of JavaScript DSP to a ScriptProcessorNode.
// `source` only need a method `pullBlock` to return the next generated block.
WebAudioSink = function(context, source, opts) {
  if (!opts || !opts.blockSize) 
    throw new Error('missing blockSize')
  var self = this
  var channelCount = 1
  this.context = context

  this.audioNode = context.createScriptProcessor(
    opts.blockSize, channelCount, channelCount)
  
  this.audioNode.connect(context.destination)

  this.audioNode.onaudioprocess = function(event) {
    var ch, chArrayOut, chArrayIn, block
    block = [source.pullBlock()]
    for (ch = 0; ch < channelCount; ch++)
      event.outputBuffer.getChannelData(ch).set(block[ch])

    // Handle the `blockOut` queue.
    setTimeout(function() { self.afteraudioprocess() }, 0)
  }
}

// Ran right after the `onaudioprocess` of the `ScriptProcessorNode` as ran
WebAudioSink.prototype.afteraudioprocess = function() {}


// A source for `WebAudioSink` to be attached to a `DspWorker` instance
_DspWorkerSource = function(dspWorker) {
  this.dspWorker = dspWorker
  this.zeros = new dsp.Zeros()  
}

_DspWorkerSource.prototype.pullBlock = function() {
  if (this.dspWorker.blocks.length)
    return this.dspWorker.blocks.shift()[0]
  else {
    this.dspWorker.onstarved()
    return this.zeros.pullBlock()
  }
}

// Interface for worker defined in "dsp_worker.js".
// Handles all messaging.
function DspWorker(opts) {
  this.id = DspWorker._idCounter++
  opts = opts || {}
  opts.blockSize = opts.blockSize || 4096
  opts.sampleRate = opts.sampleRate || 44100
  this.opts = opts

  var self = this
  this.worker = new Worker('js/dsp_worker.js')

  this.source = new _DspWorkerSource(this)

  this.blocks = []

  this.nodeCount = 0

  this.worker.onmessage = function(event) {

    if (event.data.type === 'generateBlocks') {
      while (event.data.blocks.length) 
        self.blocks.push(event.data.blocks.shift())
    
    } else if (event.data.type === 'operation') {
      if (event.data.operation === 'addNode' || event.data.operation === 'removeNode') {
        self.nodeCount = event.data.totalCount
        self.onchanged()
      }
    }

  }

  this.worker.postMessage({
    type: 'init',
    sampleRate: opts.sampleRate,
    blockSize: opts.blockSize,
    id: this.id
  })
}

DspWorker.prototype.addNode = function(nodeType, count) {
  this.worker.postMessage({
    type: 'operation',
    operation: 'addNode',
    nodeType: nodeType,
    count: count
  })
}

DspWorker.prototype.removeNode = function(nodeType, count) {
  this.worker.postMessage({
    type: 'operation',
    operation: 'removeNode',
    nodeType: nodeType,
    count: count
  })
}

DspWorker.prototype.generateBlocks = function(count) {
  this.worker.postMessage({ 
    type: 'generateBlocks',
    blockCount: count 
  })
}

DspWorker.prototype.onchanged = function() {}

DspWorker.prototype.onstarved = function() {}

DspWorker._idCounter = 0



this.utils = {
  WebAudioSink: WebAudioSink,
  DspWorker: DspWorker
}

}).apply(this)