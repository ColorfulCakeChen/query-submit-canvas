//import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
//import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";

export { NeuralNetwork };

/**
 * A three layers separable 2D convolution neural network.
 *
 * It uses sine as activation function. This is inspired by Fourier transform.
 *
 * It does global average before pointwise convolution. The result should be same as global average after
 * pointwise convolution. The calculation performance, however, should be better because data quantity are
 * reduced.
 *
 * (EDSAP = Embedding_DepthwiseConv_Sine_Avg_PointwiseConv)
 *
 */
class NeuralNetwork {

  constructor() {
  }

}

/**
 * Create a NeuralNetwork from a byte array.
 *
 * @param {Uint8Array} sourceUint8Array
 *   The input data as sourceUint8Array. It will be interpreted as Float32Array. If the last bytes not enough
 *  4 bytes (to compose a float32), they will be ignored (will not be used).
 *
 * @param {ValueMax.Percentage.Aggregate} progressToYield
 *   Return this when every time yield. Usually, this is the container of the progressToAdvance.
 *
 * @param {ValueMax.Percentage.Concrete}  progressToAdvance
 *   Increase this when every time advanced. It will be initialized to zero when decoder starting.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and reporting progress).
 *   Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate or Uint8Array}
 *   Yield ( value = progressToYield ) when ( done = false ).
 *   Yield ( value = decoded data as NeuralNetwork ) when ( done = true ).
 */
NeuralNetwork.decoder = function* (
  sourceUint8Array, progressToYield, progressToAdvance, suspendByteCount) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  // Note: Bitwising OR with zero is for converting to integer (if it is undefined or null).
  if ((suspendByteCount | 0) <= 0)
    suspendByteCount = 1024;

  let sourceFloat32Array;
  {
    let sourceByteOffset = sourceUint8Array.byteOffset;
    let sourceByteLength = sourceUint8Array.byteLength;
    sourceByteLength = Math.floor( sourceByteLength / Float32Array.BYTES_PER_ELEMENT ); // Ignore the last non-4-bytes.
    sourceFloat32Array = new Float32Array( sourceUint8Array.buffer, sourceByteOffset, sourceByteLength );
  }

  // Initialize progress.
  progressToAdvance = progressToAdvance || {};  // If null, using a dummy object instead.
  progressToAdvance.accumulation = 0;
  progressToAdvance.total = sourceByteLength;

//!!! ...unfinished...
}

