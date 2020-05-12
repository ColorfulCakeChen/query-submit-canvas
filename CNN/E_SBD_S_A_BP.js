//import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
//import * as tf from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.2/dist/tf.min.js"
//import * as PartTime from "../PartTime.js";
//import * as ValueMax from "../ValueMax.js";

export { NeuralNetwork, Architecture };

/**
 * A three layers separable convolution neural network.
 *
 * (E_SD_S_A_BP = Embedding, Shared-Biased-Depthwise-Convolution, Sine, Avgerage, Biased-Pointwise-Convolution)
 *
 *
 * - Embedding layer (1st layer)
 *
 * Every input channel will be expanded into multiple embedding channels. This layer provides context
 * independent non-linear transformation.
 *
 *
 * - Shared Biased Depthwise Convolution Layer (2nd layer)
 *
 * Every embedding channel (of every input channel) will be expanded into multiple depthwise convolution
 * channels. This provides context dependent linear transformation.
 *
 * The expanded multiple depthwise convolution channels will be expanded again into more channels by adding
 * different bias values. This completes context dependent affine transformation.
 *
 * The bias item is important although it is does not exist in most convolution neural network and fourier
 * series. The fourier series does not have bias item because it uses both SIN and COS function simultaneously
 * (according to trigonometric angle addition and subtraction theorems). This neural network, however, uses
 * only SIN (no COS) function as activation function so the angle bias becomes necessary.
 *
 * This layer is shared. Every embedding channel uses the same depthwise convolution filters. This reduces
 * the amount of filters' parameters so that speeds up the learning phase. The sharing idea comes from
 * Google's ALBERT (A Lite BERT) neural network.
 *
 *
 * - Sine activation function
 *
 * After biased depthwise convolution, It uses sine as activation function. This is inspired by Fourier
 * transform which uses trigonometric functions to approximate any function. The biased depthwise convolutin
 * combined with this (sine) activation function provides context dependent non-linear transformation.
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
   * @param {Architecture} architecture
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
    architecture, sourceUint8Array, progressToYield, progressToAdvance, suspendWeightCount) {

    // 0. Initialize.
    disposeTensors();
    this.architecture = architecture;
//    this.embeddingVocabularyTables = new Array( architecture.inputChannelCount );

    // If undefined or null or negative or zero or less than 1, set to default.
    // Note: Bitwising OR with zero is for converting to integer (if it is undefined or null).
    if ((suspendWeightCount | 0) <= 0)
      suspendWeightCount = 1024;

    // Interpret the source byte array as float32 array.
    //
    // floor() for ignoring the last non-4-bytes.
    let sourceWeightCount = Math.floor( sourceUint8Array.byteLength / Float32Array.BYTES_PER_ELEMENT );
//!!!
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

      this.embeddingVocabularyTables = tf.tidy( "E_SD_S_A_BP.NeuralNetwork.decoder.embeddingVocabularyTables", () => {
        let embeddingVocabularyTables = new Array( architecture.inputChannelCount );
        for ( let i = 0; i < architecture.inputChannelCount; ++i ) {
          embeddingVocabularyTables[ i ] = tf.tensor2d(
            ,
            [ architecture.embeddingVocabularyCount_PerInputChannel, architecture.embeddingChannelCount_PerInputChannel ] );
          tf.keep(??);
//!!! ...unfinished...
        }
//!!! ...unfinished...
        return embeddingVocabularyTables;
      });

      // Every suspendWeightCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = Math.min( sourceWeightCount, progressToAdvance.accumulation + suspendWeightCount );
        yield progressToYield;
      }
    }

    // 2. Result.
    yield progressToYield; // Report the progress has been done (100%).
    return this;
  }


  /**
   * Release tensors.
   */
  disposeTensors() {

    tf.dispose( this.embeddingVocabularyTables );
    this.embeddingVocabularyTables = null;
//!!! ...unfinished...
  }


  /**
   * Process the canvas and produce output by using the weights of this neural network.
   *
   * @param {tf.tensor3D} theHTMLCanvasElement The canvas to be processed.
   * @return {tf.tensor1D} The predicted output as tensor1D.
   */
  predict_Tensor1D_From_HTMLCanvasElement( theHTMLCanvasElement ) {
    const predictResult = tf.tidy( "E_SD_S_A_BP.NeuralNetwork.predict_Tensor1D_From_HTMLCanvasElement", () => {
      const canvasTensor3D = tf.browser.fromPixels( theHTMLCanvasElement, 4 ); // Includes alpha channel.
      return predict_Tensor1D_From_Tensor3D( canvasTensor3D );
    });
    return predictResult;
  }

  /**
   * Process the input and produce output by using the weights of this neural network.
   *
   * @param {tf.tensor3D} inputTensor3D
   *   A tensor3D data (e.g. height-width-color for color image, or 1-width-1 for text) with
   * shape.inputChannelCount (e.g. 4 for r-g-b-a, or 1 for text) channels.
   *
   * @return {tf.tensor1D} The predicted output as tensor1D.
   */
  predict_Tensor1D_From_Tensor3D( inputTensor3D ) {
    const predictResult = tf.tidy( "E_SD_S_A_BP.NeuralNetwork.predict_Tensor1D_From_Tensor3D", () => {

      const embeddingResult = tf.tidy( "Embedding", () => {

        // Scale input into specific size.
        //
        // Use ( alignCorners == true ) for better looking when visualizing.
        //const scaledInput = tf.image.resizeBilinear( inputTensor3D, this.architecture.inputScaleToSize, true );
        const scaledInput = inputTensor3D.resizeBilinear( inputTensor3D, this.architecture.inputScaleToSize, true );

        // For example, suppose input is a color image (i.e. height-width-color tensor3D). The last
        // axis is a 4 color (r-g-b-a) channel. Splitting along the last axis (the color channel)
        // results in an array [ r, g, b, a ] which has 4 tensor3D (in fact, they should be
        // viewed as tensor1D).
        let theLastAxisId = ( scaledInput.shape.length - 1 );  // Or, ( scaledInput.rank - 1 )

        // Extract vocabulary indices from input.
        const vocabularyIndicesTensor2DArray = tf.tidy( "VocabularyIndicesArray", () => {

          // For a 4 color (r-g-b-a) channel image, splitCount will be 4.
          //
          // This should be the same as this.architecture.inputChannelCount.
          let splitCount = scaledInput.shape[ theLastAxisId ];

          // Split the last axis (of input) as many as the shape size (of the last axis).
          // And then convert to integer (tensor2D), so that they can be used as tf.gather()'s indices.
          return scaledInput.split( splitCount, theLastAxisId ).map( t => t.toInt() );
        });

        // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
        const embeddedTensor3DArray = vocabularyIndicesTensor2DArray.map( ( vocabularyIndicesTensor2D, channelIndex ) => {
          this.embeddingVocabularyTables[ channelIndex ].gather( vocabularyIndicesTensor2D );
        });

//!!! ...unfinished... (inverted) residual connection

        // Concatenate along the last axis, so that it is still tensor3D but with embedded (more) channels in the last axis.
        return tf.concat( embeddedTensor3DArray, theLastAxisId );
      });

      const depthwiseResult = tidy( "DepthwiseConv", () => {
//!!! ...unfinished... 
        // Because depthwise filter is small, it is still memory space friendly to repeat (copy) filters
        // to share them with all embedded channels.
        const r = ;
        
//!!! ...unfinished... depthwise bias
//!!! ...unfinished... sine
//!!! ...unfinished... (with or without) global average

        return r;
      });


      const pointwiseResult = tidy( "PointwiseConv", () => {
//!!! ...unfinished... Pointwise should be achieved by Con2D (not by Conv1D) with 1 x 1 filters.
        const r = ;

//!!! ...unfinished... pointwise bias
        return r;
      });

//!!! ...unfinished... (inverted) residual connection

//!!! ...unfinished...
    });
    return predictResult;
  }
}


/**
 * Describe the shape of an E_SBD_S_A_BP neural network.
 *
 */
class Architecture {

  /**
   * @param {Array of number} inputScaleToSize
   *   Scale the height and width of the input image to size [ inputScaleToHeight, inputScaleToWidth ]
   * (in pixels) before convoluting. For text input, the inputScaleToHeight will be 1.
   *
   * @param {number} inputChannelCount
   *   The channel count of every input pixel. This is the depth of a pixel. For a RGBA color image, this
   * will be 4. For a text, this will be 1.
   *
   * @param {number} embeddingVocabularyCount_PerInputChannel
   *   The possible value count for one input channel. For example, this should be 256 for a color image's
   * red (or green, or blue, or alpha) channel.
   *
   * @param {number} embeddingChannelCount_PerInputChannel
   *   The embedding channel count for every input channel. This is the channelMultiplier from input
   * to embedding.
   *
   * @param {number} depthwiseChannelCount_PerEmbeddingChannel
   *   The depthwise channel count for every embedding channel (of every input channel). This is the
   * channelMultiplier from embedding to depthwise.
   *
   * @param {number} outputChannelCount
   *   The output channel count. This is also the count of the pointwise convolution filters.
   *
   * @param {number} depthwiseFilterHeight
   *   The vertical size (weight count) of the depthwise convolution filter. Default is 3. For text input,
   * this could be 1 because text is a 1D input.
   *
   * @param {number} depthwiseFilterWidth
   *   The horizontal size (weight count) of the depthwise convolution filter. Default is 3.
   */
  constructor(
    inputScaleToSize,
    inputChannelCount,
    embeddingVocabularyCount_PerInputChannel,
    embeddingChannelCount_PerInputChannel,
    depthwiseChannelCount_PerEmbeddingChannel,
    outputChannelCount,
    depthwiseFilterHeight = 3,
    depthwiseFilterWidth = 3
  ) {
    this.inputScaleToSize = inputScaleToSize;

    this.inputChannelCount =                         inputChannelCount;
    this.embeddingVocabularyCount_PerInputChannel =  embeddingVocabularyCount_PerInputChannel;
    this.embeddingChannelCount_PerInputChannel =     embeddingChannelCount_PerInputChannel;
    this.depthwiseChannelCount_PerEmbeddingChannel = depthwiseChannelCount_PerEmbeddingChannel;
    this.outputChannelCount =                        outputChannelCount;

    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterWidth;
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

  /** @return {number} The weight count of one depthwise filter (= depthwiseFilterHeight * depthwiseFilterWidth ). */
  get weightCount_PerDepthwiseFilter() {
    return ( this.depthwiseFilterHeight * this.depthwiseFilterWidth );
  }

  /** @return {number} The weight count of one biased depthwise filter (= weightCount_PerDepthwiseFilter + 1 ). */
  get weightCount_PerDepthwiseFilterBiased() {
    return ( this.weightCount_PerDepthwiseFilter + 1 );  // The "+ 1" is for the bias term.
  }

  /** @return {number} The weight count of all biased depthwise filter of one embedding channel
   * (= weightCount_PerDepthwiseFilterBiased * depthwiseChannelCount_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilterBiased_PerEmbeddingChannel() {
    return ( this.weightCount_PerDepthwiseFilterBiased * this.depthwiseChannelCount_PerEmbeddingChannel )
  }

  /**
   * This is the same as weightCount_AllDepthwiseFilterBiased_PerEmbeddingChannel, because all depthwise filter
   * are shared by all embedding channel of all input channel.
   *
   * @return {number} The weight count of all biased depthwise filter of all embedding channel of one input channel
   * (= weightCount_AllDepthwiseFilter_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilterBiased_AllEmbeddingChannel_PerInputChannel() {
    return ( this.weightCount_AllDepthwiseFilterBiased_PerEmbeddingChannel )
  }

  /**
   * This is the same as weightCount_AllDepthwiseFilterBiased_PerEmbeddingChannel, because all depthwise filter
   * are shared by all embedding channel of all input channel.
   *
   * @return {number} The weight count of all biased depthwise filter of all embedding channel of all input channel
   * (= weightCount_AllDepthwiseFilter_PerEmbeddingChannel ).
   */
  get weightCount_AllDepthwiseFilterBiased_AllEmbeddingChannel_AllInputChannel() {
    return ( this.weightCount_AllDepthwiseFilterBiased_PerEmbeddingChannel )
  }


  /** @return {number} The pointwise filter count (= outputChannelCount ). */
  get pointwiseFilterCount() {
    return this.outputChannelCount;
  }

  /** @return {number} The weight count of one pointwise filter
   * (= depthwiseChannelCountBiased_AllEmbeddingChannel_AllInputChannel + 1 ).
   */
  get weightCount_PerPointwiseFilter() {
    // The "+ 1" is for the bias term of pointwise filter.
    return ( this.depthwiseChannelCountBiased_AllEmbeddingChannel_AllInputChannel + 1 );
  }

  /** @return {number} The weight count of all pointwise filter (= weightCount_PerPointwiseFilter * outputChannelCount ). */
  get weightCount_AllPointwiseFilter() {
    return ( this.weightCount_PerPointwiseFilter * this.outputChannelCount );
  }


  /** @return {number} The weight count of the whole neural network
   * (= weightCount_AllEmbeddingChannel_AllInputChannel
   *  + weightCount_AllDepthwiseFilterBiased_AllEmbeddingChannel_AllInputChannel
   *  + weightCount_AllPointwiseFilter ).
   */
  get weightCount_AllPointwiseFilter() {
    return ( this.weightCount_AllEmbeddingChannel_AllInputChannel
            + this.weightCount_AllDepthwiseFilterBiased_AllEmbeddingChannel_AllInputChannel
            + this.weightCount_AllPointwiseFilter );
  }
}
