window.osc_MultipleWorkersJsDsp = {
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096, 
  thresholdLow: 4,
  workerIndex: -1,

  getNodeCount: function() {
    return this.dspWorkers.reduce(function(sum, w) { return w.nodeCount + sum }, 0)
  },

  hasBlocks: function() {
    return this.dspWorkers.every(function(dspWorker) { return dspWorker.blocks.length })
  },

  addNode: function(count) {
    this.workerIndex = (this.workerIndex + 1) % this.dspWorkers.length
    this.dspWorkers[this.workerIndex].addNode('osc', count)
  },

  removeNode: function(count) {
    this.dspWorkers[this.workerIndex].removeNode('osc', count)
    this.workerIndex -= 1
    if (this.workerIndex < 0) 
      this.workerIndex = this.dspWorkers.length - 1
  },

  start: function(context) {
    UI.setTitle('Oscillator benchmark : JS DSP in several workers')
    var self = this

    var dspOpts = {
      sampleRate: context.sampleRate,
      blockSize: this.blockSize
    }
    dsp.initialize(dspOpts)

    this.context = context
    this.dspSum = new dsp.Sum()
    this.dspSink = new dsp.Gain(this.dspSum)
    this.dspWorkers = [
      new utils.DspWorker(dspOpts), 
      new utils.DspWorker(dspOpts), 
      new utils.DspWorker(dspOpts),
      new utils.DspWorker(dspOpts)
    ]

    this.dspSink.setGain(1 / this.dspWorkers.length)

    this.dspWorkers.forEach(function(dspWorker) {
      self.dspSum.pushSource(dspWorker.source)
      dspWorker.onchanged = function() { UI.updateNodeCount(self.getNodeCount()) }
      dspWorker.onstarved = function() { UI.bufferStarved() }
    })

    this.webAudioSink = new utils.WebAudioSink(context, this.dspSink, dspOpts)
    this.webAudioSink.afteraudioprocess = function() {
      // Update buffer state on UI
      document.querySelector('#bufferState .value').innerHTML = 
        self.dspWorkers[0].blocks.length * self.blockSize
      
      // Generate new blocks
      if (self.dspWorkers[0].blocks.length < self.thresholdLow)
        self.dspWorkers.forEach(function(dspWorker) { 
          dspWorker.generateBlocks(self.thresholdLow - self.dspWorkers[0].blocks.length) 
        })
    }
  }

}