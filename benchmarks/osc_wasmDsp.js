window.osc_wasmDsp = {
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096,

  addNode: function(count) {
    for (var i = 0; i < count; i++) {
      var freq = 220 + Math.random() * 660
      this.wasmDsp.pushOsc(freq)
    }
    UI.updateNodeCount(this.wasmDsp.getOscCount())
  },

  removeNode: function(count) {
    for (var i = 0; i < count; i++) {
      this.wasmDsp.popOsc()
    }
    UI.updateNodeCount(this.wasmDsp.getOscCount())
  },


  start: function(context) {
    this.context = context
    UI.setTitle('Oscillator benchmark : WebAssembly dsp in main thread')
    var self = this
    var dspOpts = {
      blockSize: this.blockSize,
      sampleRate: context.sampleRate
    }

    wasmDsp.load(dspOpts, function(err, wasmDsp) {
      self.wasmDsp = wasmDsp
      self.webAudioSink = new utils.WebAudioSink(context, source, dspOpts)
      self.webAudioSink.afteraudioprocess = function() { source.generateBlock() }
    })


    // Make a source with expected interface for WebAudioSink
    var source = {
      pullBlock: function() {
        if (this.nextBlock) {
          var block = this.nextBlock
          this.nextBlock = null
          return block
        } else {
          setTimeout(UI.bufferStarved, 0)
          return new Float32Array(self.blockSize)
        }
      },

      generateBlock: function () {
        this.nextBlock = self.wasmDsp.computeNext()
      },

      nextBlock: null
    }

  }

}