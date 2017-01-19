window.osc_MultipleWorkersJsDsp = {

  context: null,
  audioWorkers: [],
  workerIndex: -1,
  audioNode: null,
  numberOfChannels: 1,
  // Android sound is all choppy with buffer size less than 4096
  // https://bugs.chromium.org/p/chromium/issues/detail?id=650425
  blockSize: 4096, 
  workerOutQueues: [],
  nodeCounts: [],
  thresholdLow: 4,

  addNode: function(count) {
    this.workerIndex = (this.workerIndex + 1) % this.audioWorkers.length
    var audioWorker = this.audioWorkers[this.workerIndex]
    
    audioWorker.postMessage({
      type: 'operation',
      operation: 'addNode',
      count: count
    })
  },

  removeNode: function(count) {
    var audioWorker = this.audioWorkers[this.workerIndex]
    audioWorker.postMessage({
      type: 'operation',
      operation: 'removeNode',
      count: count
    })

    this.workerIndex -= 1
    if (this.workerIndex < 0) 
      this.workerIndex = this.audioWorkers.length
  },

  start: function(context) {
    UI.setTitle('Oscillator benchmark : JS DSP in several workers')
    var self = this
    this.context = context
    this.audioWorkers = [
      new Worker('js/audio-worker.js'), 
      new Worker('js/audio-worker.js'), 
      new Worker('js/audio-worker.js'),
      new Worker('js/audio-worker.js')
    ]
    this.audioNode = context.createScriptProcessor(
      this.blockSize, this.numberOfChannels, this.numberOfChannels)
    
    this.audioWorkers.forEach(function(audioWorker, i) {
      var blocksOut = []
      self.workerOutQueues.push(blocksOut)

      audioWorker.postMessage({
        type: 'init',
        sampleRate: context.sampleRate,
        blockSize: self.blockSize
      })

      audioWorker.onmessage = function (event) {
        // Add all the blocks to the `blocksOut` queue.
        if (event.data.type === 'pullBlocks') {

          while (event.data.blocks.length) 
            blocksOut.push(event.data.blocks.shift())
        
        } else if (event.data.type === 'operation') {
          if (event.data.operation === 'addNode' || event.data.operation === 'removeNode') {
            self.nodeCounts[i] = event.data.totalCount
            UI.updateNodeCount(self.nodeCounts.reduce(function(num, sum) { return sum + num }, 0))
          }
        }
      }
    })

    this.audioNode.connect(context.destination)

    var zeros = new Float32Array(self.blockSize)
    this.audioNode.onaudioprocess = function(event) {
      var i, ch, chArrayOut, chArrayIn, block = []
      for (ch = 0; ch < self.numberOfChannels; ch++)
        event.outputBuffer.getChannelData(ch).set(zeros)
      
      // If there is any processed block, play it back ...
      if (self.workerOutQueues.every(function(blocksOut) { return blocksOut.length })) {
        self.workerOutQueues.forEach(function(blocksOut) {
          block = blocksOut.shift()
          for (ch = 0; ch < self.numberOfChannels; ch++) {
            chArrayOut = event.outputBuffer.getChannelData(ch)
            chArrayIn = block[ch]
            for (i = 0; i < self.blockSize; i++)
              chArrayOut[i] += chArrayIn[i]
          }
        })
      } else setTimeout(UI.bufferStarved, 0)

      // Handle the `blockOut` queue.
      setTimeout(function() {
        document.querySelector('#bufferState .value').innerHTML = self.workerOutQueues[0].length * self.blockSize
        if (self.workerOutQueues[0].length < self.thresholdLow)
          self.audioWorkers.forEach(function(audioWorker) {
            audioWorker.postMessage({ 
              type: 'pullBlocks', 
              blockCount: self.thresholdLow - self.workerOutQueues[0].length 
            })
          })
      }, 0)
    }

  }

}