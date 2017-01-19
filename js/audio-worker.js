importScripts('dsp.js')

var debugActivated = true
var dspSum
var dspSink

onmessage = function (event) {
  if (event.data.type === 'init') {
    dsp.SAMPLE_RATE = event.data.sampleRate
    dsp.BLOCK_SIZE = event.data.blockSize
    dspSum = new dsp.Sum()
    dspSink = new dsp.Gain(dspSum)

  } else if (event.data.type === 'operation') {
    //debug('change config, ratio : ' + event.data.ratio)

    if (event.data.operation === 'addNode') {
      for (var i = 0; i < event.data.count; i++) {
        var osc = new dsp.Osc()
        osc.setFreq(220 + Math.random() * 660)
        dspSum.pushSource(osc)
        dspSink.setGain(1 / dspSum.sources.length)
      }
      postMessage({ 
        type: 'operation', 
        operation: 'addNode', 
        totalCount: dspSum.sources.length 
      })

    } else if (event.data.operation === 'removeNode') {
      for (var i = 0; i < event.data.count; i++) {
        dspSum.popSource()
        dspSink.setGain(1 / dspSum.sources.length)
      }
      postMessage({ 
        type: 'operation', 
        operation: 'removeNode', 
        totalCount: dspSum.sources.length 
      })
    }

  } else if (event.data.type === 'pullBlocks') {
    var blocks = []
    var transferables = []
    var block
    while (blocks.length < event.data.blockCount) {
      block = new Float32Array(dsp.BLOCK_SIZE)
      block.set(dspSink.pullBlock())
      transferables.push(block.buffer)
      blocks.push([ block ])
    }
    postMessage({ type: 'pullBlocks', blocks: blocks }, transferables)
  }

}

var debug = function(msg) {
  if (debugActivated) console.log(msg)
}