window.osc_webAudio = {

  context: null,
  mainGain: null,
  oscNodes: [],

  addNode: function(count) {
    for (var i = 0; i < count; i++) {
      var osc = this.context.createOscillator()
      osc.frequency.value = 220 + Math.random() * 660
      osc.connect(this.mainGain)
      this.oscNodes.push(osc)
      this.mainGain.gain.value = 1 / this.oscNodes.length
      osc.start(0)
    }
    UI.updateNodeCount(this.oscNodes.length)
  },

  removeNode: function(count) {
    for (var i = 0; i < count; i++) {
      var osc = this.oscNodes.pop()
      osc.stop(0)
      osc.disconnect()
      this.mainGain.gain.value = 1 / this.oscNodes.length
    }
    UI.updateNodeCount(this.oscNodes.length)
  },

  start: function(context) {
    UI.setTitle('Oscillator benchmark : Web Audio native nodes')
    this.context = context
    this.mainGain = context.createGain()
    this.mainGain.connect(this.context.destination)
  }
}