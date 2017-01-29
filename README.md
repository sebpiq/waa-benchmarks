Web Audio API benchmarks
=========================

[GO GO](https://sebpiq.github.io/waa-benchmarks/)

A series of (not)automated benchmarks for testing the performance of different options of doing sound synthesis in the browser :

- Using native Web Audio API nodes
- ScriptProcessorNode and JavaScript DSP in the main thread
- ScriptProcessorNode and JavaScript DSP in one web worker
- ScriptProcessorNode and JavaScript DSP in several web workers
- ScriptProcessorNode and WebAssembly DSP in the main thread

At the moment there are only tests with oscillators, and it would be interesting to try different operations, such as interpolated buffer playback, etc ...

To build the web assembly code, install the compiler and run:

```
cd wasm_dsp
./compile.sh
```
