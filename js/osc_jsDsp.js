window.osc_jsDsp = {

  context: null,
  audioNode: null,
  numberOfChannels: 1,
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096,
  dspSum: null,
  dspSink: null,
  blocksOut: [],

  addNode: function(count) {
    for (var i = 0; i < count; i++) {
      var osc = new dsp.Osc()
      osc.setFreq(220 + Math.random() * 660)
      this.dspSum.pushSource(osc)
      this.dspSink.setGain(1 / this.dspSum.sources.length)
    }
    UI.updateNodeCount(this.dspSum.sources.length)
  },

  removeNode: function(count) {
    for (var i = 0; i < count; i++) {
      this.dspSum.popSource()
      this.dspSink.setGain(1 / this.dspSum.sources.length)
    }
    UI.updateNodeCount(this.dspSum.sources.length)
  },


  start: function(context) {
    UI.setTitle('Oscillator benchmark : JS DSP in main thread')
    var self = this
    dsp.SAMPLE_RATE = context.sampleRate
    dsp.BLOCK_SIZE = this.blockSize
    this.dspSum = new dsp.Sum()
    this.dspSink = new dsp.Gain(this.dspSum)
    this.context = context
    this.audioNode = context.createScriptProcessor(
      this.blockSize, this.numberOfChannels, this.numberOfChannels)

    this.audioNode.connect(context.destination)
  
    this.audioNode.onaudioprocess = function(event) {
      var ch, block = []
      
      // If there is any processed block, play it back ...
      if (self.blocksOut.length) {
        block = self.blocksOut.shift()
        for (ch = 0; ch < self.numberOfChannels; ch++)
          event.outputBuffer.getChannelData(ch).set(block[ch])
      } else setTimeout(UI.bufferStarved, 0)

      // Generate next block on next tick
      setTimeout(function() {
        self.blocksOut.push([self.dspSink.pullBlock()])
      }, 0)
    }

  }

}