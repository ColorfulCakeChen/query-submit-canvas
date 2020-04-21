//import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
//import * as tf from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.2/dist/tf.min.js"
//import * as PartTime from "../PartTime.js";
//import * as ValueMax from "../ValueMax.js";

export { NeuralNetwork };

/**
 * A three layers separable convolution neural network.
 *
 * (E_SD_S_A_BP = Embedding, Shared-Depthwise-Convolution, Sine, Avgerage, Biased-Pointwise-Convolution)
 *
 *
 * - Embedding layer (1st layer)
 *
 * Every input channel will be expanded into multiple embedding channels. This layer provides context
 * independent non-linear transformation.
 *
 *
 * - Shared Depthwise Convolution Layer (2nd layer)
 *
 * Every embedding channel (of every input channel) will be expanded into multiple depthwise
 * convolution channels. This layer provides context dependent linear transformation.
 *
 * This layer is shared. Every embedding channel uses the same depthwise convolution filters. This reduces
 * the amount of filters' parameters so that speeds up the learning phase. The sharing idea comes from
 * Google's ALBERT (A Lite BERT) neural network.
 *
 *
 * - Sine activation function
 *
 * After depthwise convolution, It uses sine as activation function. This is inspired by Fourier transform
 * which uses trigonometric functions to approximate any function. The depthwise convolutin combined with
 * this (sine) activation function provides context dependent non-linear transformation.
 *
 *
 * - Global Average
 *
 * Before pointwise convolution, doing global average. The result should be same as global average after
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

  /**
   * Return a generator for initializing this NeuralNetwork from the shape and a byte array.
   *
   * @param {Shape} shape
   *   The shape of the neural network. It affects how the sourceUint8Array will be interpreted (in
   * decoder()), and how the input image will be scaled when every time it is fed into this
   * neural network (in predict()).
   *
   * @param {Uint8Array} sourceUint8Array
   *   The input data as sourceUint8Array. It will be interpreted as Float32Array. If the last bytes
   * not enough 4 bytes (to compose a float32), they will be ignored (will not be used).
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete}  progressToAdvance
   *   Increase this when every time advanced. It will be initialized to zero when decoder starting.
   *
   * @param {Uint32} suspendWeightCount
   *   Everytime so many weights decoded, yield for releasing CPU time (and reporting progress).
   *   Default is 1024 bytes.
   *
   * @yield {ValueMax.Percentage.Aggregate or Uint8Array}
   *   Yield ( value = progressToYield ) when ( done = false ).
   *   Yield ( value = decoded data as NeuralNetwork ) when ( done = true ).
   */
  * decoder(
    shape, sourceUint8Array, progressToYield, progressToAdvance, suspendWeightCount) {

    // 0. Initialize.
    this.shape = shape;

    // If undefined or null or negative or zero or less than 1, set to default.
    // Note: Bitwising OR with zero is for converting to integer (if it is undefined or null).
    if ((suspendWeightCount | 0) <= 0)
      suspendWeightCount = 1024;

    // Interpret the source byte array as float32 array.
    //
    // floor() for ignoring the last non-4-bytes.
    let sourceWeightCount = Math.floor( sourceUint8Array.byteLength / Float32Array.BYTES_PER_ELEMENT );
    let sourceFloat32Array = new Float32Array( sourceUint8Array.buffer, sourceUint8Array.byteOffset, sourceWeightCount );

    // Initialize progress.
    progressToAdvance = progressToAdvance || {};  // If null, using a dummy object instead.
    progressToAdvance.accumulation = 0;
    progressToAdvance.total = sourceWeightCount;

    // It is important that the nextYieldAccumulation is not greater than source length, so that
    // it can be used as boundary checking to reduce checking times and increase performance.
    let nextYieldAccumulation = Math.min( sourceWeightCount, progressToAdvance.accumulation + suspendWeightCount );

    // 1. Decode.
    while (progressToAdvance.accumulation < sourceWeightCount) {

      this.embeddingLayer = tf.tensor( 
  //!!! ...unfinished...

      // Every suspendWeightCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = Math.min( sourceWeightCount, progressToAdvance.accumulation + suspendWeightCount );
        yield progressToYield;
      }
    }

    // 2. Result.
    yield progressToYield; // Report the progress has been done (100%).
    return resultNeuralNetwork;
  }


  /**
   * Process the input and produce output by using the weights of this neural network.
   *
   * @param {tf.tensor3D} input
   *   A tensor3D data (e.g. height-width-channel for color image) with shape.inputChannelCount
   * (e.g. 4 for r-g-b-a) channels.
   *
   * @return {tf.tensor1D} The output as tensor1D.
   */
  predict(input) {

    const embeddingResult = tf.tidy( "Embedding", () => {

      // Split the last axis.
      //
      // For example, a color image is a height-width-channel tensor3D. The last axis is the r-g-b-a
      // 4 color channels. Splitting along the last axis (i.e. the color channels) results in an array
      // [ r, g, b, a ] which has 4 tensor3D (in fact, they are tensor1D).
      let theLastAxisId = input.shape.length - 1;
      const splittedTensor3DArray = input.split( input.shape.length, theLastAxisId );

      const embeddTensor3DArray = splittedTensor3DArray.map( t => {
//!!! ...unfinished... should use different embedding layer
        return this.embeddingLayer.gather( t.as1D() );
      });

      const r = tf.concat( embeddTensor3DArray );
//!!! ...unfinished...
      return r.reshape(
          getExactlyOneShape(this.computeOutputShape(input.shape)));
    });

    const depthwiseResult = tidy( "Depthwise", () => {
//!!! ...unfinished...
      const r = ;
      return r;
    });

//!!! ...unfinished...
  }
}


/**
 * Describe the shape of an E_SD_S_A_BP neural network.
 *
 */
class Shape {

  /**
   * @param {number} inputScaleToWidth
   *   Scale the width of the input image to this horizontal size (pixel count) before convoluting.
   *
   * @param {number} inputScaleToHeight
   *   Scale the height of the input image to this vertical size (pixel count) before convoluting.
   *
   * @param {number} inputChannelCount
   *   The channel count of every input pixel. This is the depth of a pixel.
   *
   * @param {number} embeddingVocabularyCount_PerInputChannel
   *   The possible value count for one input channel. For example, this should be 256 for a color image's
   * red (or green, or blue, or alpha) channel.
   *
   * @param {number} embeddingChannelCount_PerInputChannel
   *   The embedding channel count for every input channel.
   *
   * @param {number} depthwiseChannelCount_PerEmbeddingChannel
   *   The depthwise channel count for every embedding channel (of every input channel).
   *
   * @param {number} outputChannelCount
   *   The output channel count. This is also the count of the pointwise convolution filters.
   *
   * @param {number} depthwiseFilterWidth
   *   The horizontal size (weight count) of the depthwise convolution filter. Default is 3.
   *
   * @param {number} depthwiseFilterHeight
   *   The vertical size (weight count) of the depthwise convolution filter. Default is 3.
   */
  constructor(
    inputScaleToWidth,
    inputScaleToHeight,
    inputChannelCount,
    embeddingVocabularyCount_PerInputChannel,
    embeddingChannelCount_PerInputChannel,
    depthwiseChannelCount_PerEmbeddingChannel,
    outputChannelCount,
    depthwiseFilterWidth = 3,
    depthwiseFilterHeight = 3
  ) {
    this.inputScaleToWidth = inputScaleToWidth;
    this.inputScaleToHeight = inputScaleToHeight;

    this.inputChannelCount =                         inputChannelCount;
    this.embeddingVocabularyCount_PerInputChannel =  embeddingVocabularyCount_PerInputChannel;
    this.embeddingChannelCount_PerInputChannel =     embeddingChannelCount_PerInputChannel;
    this.depthwiseChannelCount_PerEmbeddingChannel = depthwiseChannelCount_PerEmbeddingChannel;
    this.outputChannelCount =                        outputChannelCount;

    this.depthwiseFilterWidth = depthwiseFilterWidth;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
  }


  /** @return {number} The embedding vocabulary count for all input channel
   * (= embeddingVocabularyCount_PerInputChannel * inputChannelCount ).
   */
  get embeddingVocabularyCount_AllInputChannel() {
    return ( this.embeddingVocabularyCount_PerInputChannel * this.inputChannelCount );
  }

  /** @return {number} The embedding channel count for all input channel
   * (= embeddingChannelCount_PerInputChannel * inputChannelCount ).
   */
  get embeddingChannelCount_AllInputChannel() {
    return ( this.embeddingChannelCount_PerInputChannel * this.inputChannelCount );
  }

  /** @return {number} The size of one embedding table (all embedding channel of one input channel) 
   * (= embeddingVocabularyCount_PerInputChannel * embeddingChannelCount_PerInputChannel ).
   */
  get weightCount_AllEmbeddingChannel_PerInputChannel() {
    return ( this.embeddingVocabularyCount_PerInputChannel * this.embeddingChannelCount_PerInputChannel )
  }

  /** @return {number} The size of all embedding table (all embedding channel of all input channel) 
   * (= weightCount_AllEmbeddingChannel_PerInputChannel * inputChannelCount ).
   */
  get weightCount_AllEmbeddingChannel_AllInputChannel() {
    return ( this.weightCount_AllEmbeddingChannel_PerInputChannel * this.inputChannelCount )
  }


  /** @return {number} The depthwise channel count for all embedding channel (of one input channel)
   * (= depthwiseChannelCount_PerEmbeddingChannel * embeddingChannelCount_PerInputChannel ).
   */
  get depthwiseChannelCount_AllEmbeddingChannel_PerInputChannel() {
    return ( this.depthwiseChannelCount_PerEmbeddingChannel * this.embeddingChannelCount_PerInputChannel );
  }

  /** @return {number} The depthwise channel count for all embedding channel (of all input channel)
   * (= depthwiseChannelCount_AllEmbeddingChannel_PerInputChannel * inputChannelCount ).
   */
  get depthwiseChannelCount_AllEmbeddingChannel_AllInputChannel() {
    return ( this.depthwiseChannelCount_AllEmbeddingChannel_PerInputChannel * this.inputChannelCount );
  }

  /** @return {number} The weight count of one depthwise filter (= depthwiseFilterWidth * depthwiseFilterHeight ). */
  get weightCount_PerDepthwiseFilter() {
    return ( this.depthwiseFilterWidth * this.depthwiseFilterHeight )
  }

  /** @return {number} The weight count of all depthwise filter of one embedding channel
   * (= weightCount_PerDepthwiseFilter * depthwiseChannelCount_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilter_PerEmbeddingChannel() {
    return ( this.weightCount_PerDepthwiseFilter * this.depthwiseChannelCount_PerEmbeddingChannel )
  }

  /**
   * This is the same as weightCount_AllDepthwiseFilter_PerEmbeddingChannel, because all depthwise filter
   * are shared by all embedding channel of all input channel.
   *
   * @return {number} The weight count of all depthwise filter of all embedding channel of one input channel
   * (= weightCount_AllDepthwiseFilter_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilter_AllEmbeddingChannel_PerInputChannel() {
    return ( this.weightCount_AllDepthwiseFilter_PerEmbeddingChannel )
  }

  /**
   * This is the same as weightCount_AllDepthwiseFilter_PerEmbeddingChannel, because all depthwise filter
   * are shared by all embedding channel of all input channel.
   *
   * @return {number} The weight count of all depthwise filter of all embedding channel of all input channel
   * (= weightCount_AllDepthwiseFilter_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilter_AllEmbeddingChannel_AllInputChannel() {
    return ( this.weightCount_AllDepthwiseFilter_PerEmbeddingChannel )
  }


  /** @return {number} The pointwise filter count (= outputChannelCount ). */
  get pointwiseFilterCount() {
    return this.outputChannelCount;
  }

  /** @return {number} The weight count of one pointwise filter
   * (= depthwiseChannelCount_AllEmbeddingChannel_AllInputChannel + 1 ).
   */
  get weightCount_PerPointwiseFilter() {
    return ( this.depthwiseChannelCount_AllEmbeddingChannel_AllInputChannel + 1 );  // The "+ 1" is for the bias term.
  }

  /** @return {number} The weight count of all pointwise filter (= weightCount_PerPointwiseFilter * outputChannelCount ). */
  get weightCount_AllPointwiseFilter() {
    return ( this.weightCount_PerPointwiseFilter * this.outputChannelCount );
  }


  /** @return {number} The weight count of the whole neural network
   * (= weightCount_AllEmbeddingChannel_AllInputChannel
   *  + weightCount_AllDepthwiseFilter_AllEmbeddingChannel_AllInputChannel
   *  + weightCount_AllPointwiseFilter ).
   */
  get weightCount_AllPointwiseFilter() {
    return ( this.weightCount_AllEmbeddingChannel_AllInputChannel
            + this.weightCount_AllDepthwiseFilter_AllEmbeddingChannel_AllInputChannel
            + this.weightCount_AllPointwiseFilter );
  }
}
