Web Audio API benchmarks
=========================

[GO GO](https://sebpiq.github.io/waa-benchmarks/)

A series of (not)automated benchmarks for testing the performance of different options of doing sound synthesis in the browser :

- Using native Web Audio API nodes
- ScriptProcessorNode and JavaScript DSP in the main thread
- ScriptProcessorNode and JavaScript DSP in one web worker
- ScriptProcessorNode and JavaScript DSP in several web workers
- ScriptProcessorNode and WebAssembly DSP in the main thread


To build the web assembly code, install the compiler and run:

```
cd wasm_dsp
./compile.sh
```