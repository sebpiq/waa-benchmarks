importScripts('dsp.js')

var debugActivated = true
var dspSum
var dspSink
var id = null

onmessage = function (event) {
  if (event.data.type === 'init') {
    dsp.initialize(event.data)
    id = event.data.id
    debug('worker ' + id, 'init', event.data.sampleRate, event.data.blockSize)
    dspSum = new dsp.Sum()
    dspSink = new dsp.Gain(dspSum)

  } else if (event.data.type === 'operation') {

    if (event.data.operation === 'addNode') {
      debug('worker ' + id, 'addNode', event.data.count)
      for (var i = 0; i < event.data.count; i++) {
        var osc = new dsp.Osc()
        osc.setFreq(220 + Math.random() * 660)
        dspSum.pushSource(osc)
        dspSink.setGain(1 / Math.max(dspSum.sources.length, 1))
      }
      postMessage({ 
        type: 'operation', 
        operation: 'addNode', 
        totalCount: dspSum.sources.length 
      })

    } else if (event.data.operation === 'removeNode') {
      debug('worker ' + id, 'removeNode', event.data.count)
      for (var i = 0; i < event.data.count; i++) {
        dspSum.popSource()
        dspSink.setGain(1 / Math.max(dspSum.sources.length, 1))
      }
      postMessage({ 
        type: 'operation', 
        operation: 'removeNode', 
        totalCount: dspSum.sources.length 
      })
    }

  } else if (event.data.type === 'generateBlocks') {
    var blocks = []
    var transferables = []
    var block
    var generated
    while (blocks.length < event.data.blockCount) {
      generated = dspSink.pullBlock()
      block = new Float32Array(generated.length)
      block.set(generated)
      transferables.push(block.buffer)
      blocks.push([ block ])
    }
    postMessage({ type: 'generateBlocks', blocks: blocks }, transferables)
  }

}

var debug = function() {
  if (debugActivated) console.log.apply(console, arguments)
}