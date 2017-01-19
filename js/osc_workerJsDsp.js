window.osc_workerJsDsp = {

  context: null,
  audioWorker: null,
  audioNode: null,
  numberOfChannels: 1,
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096, 
  blocksOut: [],
  thresholdLow: 4,

  addNode: function(count) {
    this.audioWorker.postMessage({
      type: 'operation',
      operation: 'addNode',
      count: count
    })
  },

  removeNode: function(count) {
    this.audioWorker.postMessage({
      type: 'operation',
      operation: 'removeNode',
      count: count
    })
  },

  start: function(context) {
    UI.setTitle('Oscillator benchmark : JS DSP in worker')
    var self = this
    this.context = context
    this.audioWorker = new Worker('js/audio-worker.js')
    this.audioNode = context.createScriptProcessor(
      this.blockSize, this.numberOfChannels, this.numberOfChannels)
    
    this.audioWorker.postMessage({
      type: 'init',
      sampleRate: context.sampleRate,
      blockSize: this.blockSize
    })

    this.audioNode.connect(context.destination)

    this.audioWorker.onmessage = function (event) {
      // Add all the blocks to the `blocksOut` queue.
      if (event.data.type === 'pullBlocks') {
        while (event.data.blocks.length) 
          self.blocksOut.push(event.data.blocks.shift())
      
      } else if (event.data.type === 'operation') {
        if (event.data.operation === 'addNode' || event.data.operation === 'removeNode')
          UI.updateNodeCount(event.data.totalCount)
      }
    }
  
    this.audioNode.onaudioprocess = function(event) {
      var ch, block = []
      
      // If there is any processed block, play it back ...
      if (self.blocksOut.length) {
        block = self.blocksOut.shift()
        for (ch = 0; ch < self.numberOfChannels; ch++)
          event.outputBuffer.getChannelData(ch).set(block[ch])
      } else setTimeout(UI.bufferStarved, 0)

      // Handle the `blockOut` queue.
      setTimeout(function() {
        document.querySelector('#bufferState .value').innerHTML = self.blocksOut.length * self.blockSize
        if (self.blocksOut.length < self.thresholdLow)
          self.audioWorker.postMessage({ 
            type: 'pullBlocks', 
            blockCount: self.thresholdLow - self.blocksOut.length 
          })
      }, 0)
    }

  }

}