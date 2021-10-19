export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";

//!!! ...unfinished... (2021/10/12) pre-shuffle by ShuffleInfo (just like ChannelShuffler.ConcatPointwiseConv).
//!!! ...unfinished... (2021/10/13) ChannelShuffler.Xxx.shuffleInfo

/**
 * Handle pointwise convolution (1x1 conv2d), bias and activation.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {boolean} bHigherHalfDifferent
 *   - If false, it is just a normal poitwise convolution.
 *
 *   - If true:
 *
 *     - If ( inputChannelCount < outputChannelCount ), the filters for the output channels between ( inputChannelCount ) and
 *         ( outputChannelCount - 1 ) will just copy the input channels between 0 and ( inputChannelCount - 1 ). (i.e.
 *         bHigherHalfCopyLowerHalf, for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
 *
 *     - If ( inputChannelCount >= outputChannelCount ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
 *         to ( outputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for
 *         pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail, and pointwise2 of ShuffleNetV2_ByMopbileNetV1's head/body/tail)
 *
 * @member {ChannelShuffler.Xxx} channelShuffler
 *   If not null, the channelShuffler.shuffleInfo will be used to (pre-)shuffle the filters. The total effect will be the same as
 * applying the channel shuffler (without concatenation and splitting) after pointwise convolution. (for pointwise2 of
 * ShuffleNetV2_ByMopbileNetV1's head/body/tail)
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {boolean} bExisted
 *   If true, this pointwise convolution exists. The same as this.bPointwise.
 *
 * @member {boolean} bPointwise
 *   If true, this pointwise convolution exists. The same as this.bExisted.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnConv
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnConvBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy_or_keep(), ConvBias_and_destroy_or_keep(),
 * ConvActivation_and_destroy_or_keep(), ConvBiasActivation_and_destroy_or_keep() according to the parameters.
 */
class Base extends ReturnOrClone_Activation.Base {

  constructor( inputChannelCount, outputChannelCount, bBias, nActivationId, bHigherHalfDifferent, channelShuffler ) {
    super();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.channelShuffler = channelShuffler;
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin ) {

    // Q: Why is the inputFloat32Array not a parameter of constructor?
    // A: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.


//!!! ...unfinished... (2021/10/14)
//     this.bHigherHalfDifferent;
//     this.channelShuffler;

//  *     - If ( inputChannelCount < outputChannelCount ), the filters for the output channels between ( inputChannelCount ) and
//  *         ( outputChannelCount - 1 ) will just copy the input channels between 0 and ( inputChannelCount - 1 ). (i.e.
//  *         bHigherHalfCopyLowerHalf, for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
//  *
//  *     - If ( inputChannelCount >= outputChannelCount ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
//  *         to ( outputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for
//  *         pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail, and pointwise2 of ShuffleNetV2_ByMopbileNetV1's head/body/tail)
//  *

    let inputChannelCount_toBeExtracted;
    let outputChannelCount_toBeExtracted;
    let filtersHigherHalfTensor4d, biasesHigherHalfTensor3d;

    if ( this.bHigherHalfDifferent ) {

      if ( this.inputChannelCount < this.outputChannelCount ) { // i.e. bHigherHalfCopyLowerHalf

        inputChannelCount_toBeExtracted = this.inputChannelCount;
        outputChannelCount_toBeExtracted = this.inputChannelCount; // The lower half filters have the same output channel count as input.

//!!! ...unfinished... (2021/10/19) The high half filter shape?
        //this.filtersLowerHalfShape =  [ 1, 1, this.inputChannelCount, this.inputChannelCount ];
        let channelCountHigherHalf = ( this.outputChannelCount - this.inputChannelCount );
        let filtersHigherHalfShape = [ 1, 1, this.inputChannelCount, channelCountHigherHalf ];
        let biasesHigherHalfShape = [ 1, 1, channelCountHigherHalf ];

        // Generate pointwise filters for just copying the input (until channelCountHigherHalf).
        filtersHigherHalfTensor4d = tf.tidy( () =>
          tf.range( 0, channelCountHigherHalf, 1, "int32" ) // tf.oneHot() accepts int32. (channelIndexesInt32Tensor1d)
            .oneHot( this.inputChannelCount )               // tf.oneHot() generates int32. (channelIndexesOneHotInt32Tensor2d)
            .cast( "float32" )                              // tf.conv2d() accepts float32. (channelIndexesOneHotFloat32Tensor2d)
            .transpose()                                    // looks like tf.conv2d()'s filter. (channelIndexesOneHotFloat32TransposedTensor2d)
            .reshape( filtersHigherHalfShape )              // tf.conv2d()'s filter is tensor4d. (channelIndexesOneHotFloat32Tensor4d)
        );

        // Generate bias for just adding zero. (i.e. equals no bias).
        if ( this.bBias ) {
          biasesHigherHalfTensor3d = tf.zero( biasesHigherHalfShape );
        }

//!!! ...unfinished... (2021/10/19)
//         tf.util.assert( filtersHigherHalfShape[ 2 ] == filtersHigherHalfShape[ 3 ],
//           `Pointwise.Base.init(): filtersHigherHalfShape ( ${filtersHigherHalfShape} ) `
//             + `should be the same as params.input1ChannelCount ( ${params.input1ChannelCount} ).`
//         );

//!!! ...unfinished... (2021/10/14)
        this.filtersShape =      [ 1, 1, this.inputChannelCount, this.outputChannelCount ];
        this.biasesShape =       [ 1, 1, this.outputChannelCount ];

      } else { // ( inputChannelCount >= outputChannelCount ), i.e. bHigherHalfPassThrough

//!!! ...unfinished... (2021/10/14)

      }

    } else { // Normal pointwise convolution. Use specified input and output channel count.
      inputChannelCount_toBeExtracted = this.inputChannelCount;
      outputChannelCount_toBeExtracted = this.outputChannelCount;
    }

    this.bInitOk = Base.init_by_inputChannelCount_outputChannelCount.call( 
      inputFloat32Array, byteOffsetBegin, inputChannelCount_toBeExtracted, outputChannelCount_toBeExtracted );

//!!! ...unfinished... (2021/10/19) inferenced filters.


//!!!
    if ( !this.bInitOk ) {
      return false; // Initialization failed.
    }

    if ( !this.bPointwise ) {
      return true; // Since there is no pointwise, initialization was done successfully.
    }

//!!! ...unfinished... (2021/10/19)
// After calling init_by_inputChannelCount_outputChannelCount(), re-calculate this.tensorWeightCountTotal and this.tensorWeightCountExtracted.
// re-set this.filtersShape and this.biasesShape.


    this.bInitOk = true;
    return true;
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;

    this.filtersShape = this.biasesShape
// ???
//       = this.filtersShapeForExtracting = this.biasesShape
//!!! (2021/10/19 Remarked) So that inputFloat32Array could be released.
//      = this.filtersWeights = this.biasesWeights
      = this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation
      = null;

    this.bPointwise = false;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnConv (and this.pfnConvBiasActivation if need) so that this.pfnConv() and this.pfnConvBiasActivation() will or will not
   * dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {
      if ( bKeepInputTensor ) {
        this.pfnConv = Base.Conv_and_keep;
      } else {
        this.pfnConv = Base.Conv_and_destroy;
      }
    } else {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      if ( bKeepInputTensor ) {
        this.pfnConvBiasActivation = this.pfnConv = Base.keep_input_return_copy;
      } else {
        this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      }
    }
  }

  get bExisted() {
    return this.bPointwise;
  }

  /**
   * This method uses almost all properties of Pointwise.Base (i.e. this) except inputChannelCount and outputChannelCount.
   * They should be specified by method parameters explicitly. This method will record the result inside this object directly.
   *
   * @param {Base} this
   *   It should be an object of class Pointwise.Base.
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by this method.
   *
   * @param {number} inputChannelCount
   *   The channel count of the pointwise convolution's input.
   *
   * @param {number} outputChannelCount
   *   The channel count of the pointwise convolution's output.
   *
   * @return {boolean} Return true, if succeeded.
   */
  static init_by_inputChannelCount_outputChannelCount( inputFloat32Array, byteOffsetBegin, inputChannelCount, outputChannelCount ) {

    // Q: Why not keep filtersWeights and biasesWeights in data members of this?
    // A: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //    the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;
    this.bPointwise = ( outputChannelCount > 0 );
    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

    if ( !this.bPointwise ) {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      this.bInitOk = true;
      return true;
    }

    //let filterHeightWidth = [ 1, 1 ];
    let filtersShape =      [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =       [ 1, 1, outputChannelCount ];

    let filtersWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, filtersShape );
    if ( !filtersWeights.extract() )
      return false;  // e.g. input array does not have enough data.

    this.byteOffsetEnd = filtersWeights.defaultByteOffsetEnd;

    this.filtersTensor4d = tf.tensor4d( filtersWeights.weights, filtersShape );

// !!! ...unfinished... (2021/10/12) Currently, all weights are extracted (not inferenced) for pointwise convolution.
    this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.filtersTensor4d.shape );
    this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersTensor4d.shape );

    this.pfnConv = Base.Conv_and_destroy; // will dispose inputTensor.

    if ( this.bBias ) {
      let biasesWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, biasesShape );
      if ( !biasesWeights.extract() )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = biasesWeights.defaultByteOffsetEnd;

      this.biasesTensor3d = tf.tensor3d( biasesWeights.weights, biasesShape );

// !!! ...unfinished... (2021/10/12) Currently, all weights are extracted (not inferenced) for pointwise convolution.
      this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.biasesTensor3d.shape );
      this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesTensor3d.shape );

      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvBiasActivation_and_destroy_or_keep;
      else
        this.pfnConvBiasActivation = Base.ConvBias_and_destroy_or_keep;

    } else {

      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvActivation_and_destroy_or_keep;
       else
        this.pfnConvBiasActivation = Base.Conv_and_destroy_or_keep;

    }

    this.bInitOk = true;
    return true;
  }

  /** Pointwise Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep( inputTensor ) {
    return this.pfnConv( inputTensor );
  }

  static ConvBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static ConvActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
