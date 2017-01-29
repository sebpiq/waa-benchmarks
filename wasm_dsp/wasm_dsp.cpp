#include <math.h>
#include <stdio.h>

#define PI 3.141592653589793
#define BLOCK_SIZE 4096

// We need 2 floats to store 1 oscillator [ phase, K ].
// K = 2 * PI / sample_rate * freq
int OSC_LEN = 2;

extern "C" {

void sum_osc_static(float* out_block, double* oscillators, int osc_count) {
  double phase, K;
  double gain = 1.0 / osc_count;

  // Reset `out_block` with zeros
  for (int j=0; j<BLOCK_SIZE; j++) {
    out_block[j] = 0;
  }

  if (osc_count == 0) {
    return;
  }

  for (int i=0; i<osc_count; i++) {
    phase = oscillators[i * OSC_LEN];
    K = oscillators[i * OSC_LEN + 1];

    // !!! Testing drift of the phase (rounding errors)
    //double phMem = phase;

    // Add to previous
    for (int j=0; j<BLOCK_SIZE; j++) {
      phase += K;
      out_block[j] += cos(phase);
    }

    // Storing phase for next block
    oscillators[i * OSC_LEN] = phase;
    // !!! Testing drift of the phase (rounding errors)
    //printf("%.20f \n", phase - (K * 4096.0) - phMem);

  }

  // Apply gain
  for (int j=0; j<BLOCK_SIZE; j++) {
    out_block[j] *= gain;
  }
}

}