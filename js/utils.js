DspWorkerSource = function(dspWorker) {
  this.dspWorker = dspWorker
  this.zeros = new dsp.Zeros()  
}

DspWorkerSource.prototype.pullBlock = function() {
  if (this.dspWorker.blocks.length)
    return this.dspWorker.blocks.shift()[0]
  else {
    this.dspWorker.onstarved()
    return this.zeros.pullBlock()
  }
}


function DspWorker(opts) {
  this.id = DspWorker._idCounter++
  opts = opts || {}
  opts.blockSize = opts.blockSize || 4096
  opts.sampleRate = opts.sampleRate || 44100
  this.opts = opts

  var self = this
  this.worker = new Worker('js/dsp-worker.js')

  this.source = new DspWorkerSource(this)

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