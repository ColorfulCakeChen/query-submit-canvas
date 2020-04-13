//import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
//import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";

export { NeuralNetwork };

/**
 * A three layers separable 2D convolution neural network.
 *
 * (E_SD_S_A_BP = Embedding, Shared-Depthwise-Conv, Sine, Avgerage, Biased-Pointwise-Conv)
 *
 *
 * - Embedding layer (1st layer)
 *
 * Every input channel will be expanded into multiple embedding channels.
 *
 *
 * - Shared Depthwise (2D) Convolution Layer (2nd layer)
 *
 * Every embedding channel (of every input channel) will be expanded into multiple depthwise (2D)
 * convolution channels.
 *
 * This layer is shared. Every embedding channel uses the same depthwise convolution filters. This reduces
 * the amount of filters parameters.
 *
 *
 * - Sine activation function
 *
 * After depthwise convolution, It uses sine as activation function. This is inspired by Fourier transform
 * which uses trigonometric functions to approximate any function.
 *
 *
 * - Global Average
 *
 * It does global average before pointwise convolution. The result should be same as global average after
 * pointwise convolution. The calculation performance, however, should be better because the amount of data
 * is reduced.
 *
 *
 * - Biased Pointwise Convolution Layer (3rd layer)
 *
 * All depthwise channels will be pointwise convoluted. Every output channel is composed by a biased
 * pointwise convolution. The "biased" means there is a bias term (i.e. a constant weight) when convoluting.
 * The bias term is necessary to achieve affine transform. The affine transform is important to complete
 * trigonometric series. A complete trigonometric series has ability to approximate any function.
 *
 */
class NeuralNetwork {

  constructor() {
  }

}


/**
 * Describe the shape of an E_SD_S_A_BP neural network.
 *
 */
class Shape {

  /**
   * @param {number} input_Width
   *   The horizontal size (pixel count) of input image.
   *
   * @param {number} input_Height
   *   The vertical size (pixel count) of input image.
   *
   * @param {number} inputChannel_Count
   *   The channel count of every pixel. This is the depth of a pixel.
   *
   * @param {number} inputChannel_One_EmbeddingChannel_Count
   *   The embedding channel count for every input channel.
   *
   * @param {number} inputChannel_One_EmbeddingChannel_One_DepthwiseChannel_Count
   *   The depthwise channel count for every embedding channel (of every input channel).
   *
   * @param {number} outputChannel_Count
   *   The output channel count.
   *
   * @param {number} depthwiseFilter_Width
   *   The horizontal size (weight count) of the depthwise convolution filter. Default is 3.
   *
   * @param {number} depthwiseFilter_Height
   *   The vertical size (weight count) of the depthwise convolution filter. Default is 3.
   */
  constructor(
    input_Width,
    input_Height,
    inputChannel_Count,
    inputChannel_One_EmbeddingChannel_Count,
    inputChannel_One_EmbeddingChannel_One_DepthwiseChannel_Count,
    outputChannel_Count,
    depthwiseFilter_Width = 3,
    depthwiseFilter_Height = 3
  ) {
    this.input_Width = input_Width;
    this.input_Height = input_Height;

    this.inputChannel_Count = inputChannel_Count;

    this.inputChannel_One_EmbeddingChannel_Count = inputChannel_One_EmbeddingChannel_Count;

    this.inputChannel_One_EmbeddingChannel_One_DepthwiseChannel_Count
      = inputChannel_One_EmbeddingChannel_One_DepthwiseChannel_Count;

    this.outputChannel_Count = outputChannel_Count;

    this.depthwiseFilter_Width = depthwiseFilter_Width;
    this.depthwiseFilter_Height = depthwiseFilter_Height;
  }

  /** @return {number} The embedding channel count for all input channel. */
  get inputChannel_All_EmbeddingChannel_Count() {
  }

  /** @return {number} The depthwise channel count for all embedding channel (of all input channel). */
  get inputChannel_All_EmbeddingChannel_All_DepthwiseChannel_Count() {
  }

  /** @return {number} The input pixel count (= input_Width * input_Height ). */
  get input_Pixel_Count() {
    return ( this.input_Width * this.input_Height );
  }

  /** @return {number} The depthwise filter size (= depthwiseFilter_Width * depthwiseFilter_Height ). */
  get depthwiseFilter_One_Weight_Count() {
  }

  /** @return {number} The pointwise filter size (= inputChannel_All_EmbeddingChannel_All_DepthwiseChannel_Count + 1 ). */
  get pointwiseFilter_One_Weight_Count() {
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

