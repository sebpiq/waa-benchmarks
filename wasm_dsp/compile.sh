mkdir -p build
rm -f build/*

if emcc wasm_dsp.cpp -O2 -s WASM=1 \
  -s "MODULARIZE=1" -s "EXPORT_NAME='WasmDspModule'" -s "BINARYEN_METHOD='native-wasm'" \
  -s "EXPORTED_FUNCTIONS=['_sum_osc_static']" \
  -o build/wasm_dsp_module.js ; 
then
  echo "compilation succeeded"
  echo "copying to js/wasm_dsp_module.js"
  cp build/wasm_dsp_module.js ../js/
  echo "copying to js/wasm_dsp_module.wasm"
  cp build/wasm_dsp_module.wasm ../js/
fi