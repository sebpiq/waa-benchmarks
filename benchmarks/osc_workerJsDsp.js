window.osc_workerJsDsp = {
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096, 
  thresholdLow: 4,

  addNode: function(count) {
    this.dspWorker.addNode('osc', count)
  },

  removeNode: function(count) {
    this.dspWorker.removeNode('osc', count)
  },

  start: function(context) {
    UI.setTitle('Oscillator benchmark : JS DSP in worker')
    var self = this
    var dspOpts = {
      blockSize: this.blockSize,
      sampleRate: context.sampleRate
    }

    dsp.initialize(dspOpts)
    this.context = context
    this.dspWorker = new utils.DspWorker(dspOpts)

    this.dspWorker.onchanged = function() { UI.updateNodeCount(this.nodeCount) }
    this.dspWorker.onstarved = function() { UI.bufferStarved() }

    this.webAudioSink = new utils.WebAudioSink(context, this.dspWorker.source, dspOpts)
    this.webAudioSink.afteraudioprocess = function() {
      // Update buffer state on UI
      document.querySelector('#bufferState .value').innerHTML 
        = self.dspWorker.blocks.length * self.blockSize

      // Generate new blocks
      if (self.dspWorker.blocks.length < self.thresholdLow)
        self.dspWorker.generateBlocks(self.thresholdLow - self.dspWorker.blocks.length)
    }

  }

}