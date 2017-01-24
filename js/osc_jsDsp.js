window.osc_jsDsp = {
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096,

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
    var dspOpts = {
      blockSize: this.blockSize,
      sampleRate: context.sampleRate
    }

    dsp.initialize(dspOpts)
    this.context = context
    this.dspSum = new dsp.Sum()
    this.dspSink = new dsp.Gain(this.dspSum)

    // Make a source with expected interface for WebAudioSink
    var source = {
      pullBlock: function() {
        if (this.blocks.length)
          return this.blocks.shift()
        else {
          setTimeout(UI.bufferStarved, 0)
          return this.zeros.pullBlock()
        }
      },

      generateBlock: function () {
        this.blocks.push(self.dspSink.pullBlock())
      },

      blocks: [],
      zeros: new dsp.Zeros(),
    }
    
    this.webAudioSink = new dsp.WebAudioSink(context, source)
    this.webAudioSink.afteraudioprocess = function() { source.generateBlock() }
  }

}