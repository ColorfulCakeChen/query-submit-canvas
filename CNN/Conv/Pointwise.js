export { PassThrough, Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";
import * as ChannelShuffler from "./ChannelShuffler.js";


/**
 * A pointwise convolution and bias which just pass the input to output.
 *
 * It is usually used in the inferenced higher half channels of the output channel (for achieving ShuffleNetV2_ByMopbileNetV1).
 *
 *
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
class PassThrough {

  /**
   * @param {number} inputChannelCount      The channel count of input.
   * @param {number} outputChannelCount     The channel count of output.
   * @param {number} inputChannelIndexStart The channel count index (included) to start to be copied to the output.
   * @param {number} inputChannelIndexStop  The channel count index (not included) to stop to be copied to the output.
   */
  constructor( inputChannelCount, outputChannelCount, inputChannelIndexStart, inputChannelIndexStop ) {
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.inputChannelIndexStart = inputChannelIndexStart;
    this.inputChannelIndexStop = inputChannelIndexStop;

    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    let biasesShape =  [ 1, 1, outputChannelCount ];

    [ this.filtersTensor4d, this.biasesTensor3d ] = tf.tidy( () => {

      // Generate pointwise filters for just copying the input (from inputChannelIndexStart to inputChannelIndexStop).
//!!! (2021/11/11/ Remarked)
//       let filtersTensor4d =
//         tf.range( inputChannelIndexStart, inputChannelIndexStop, 1, "int32" ) // tf.oneHot() accepts int32. (channelIndexesInt32Tensor1d)
//           .oneHot( inputChannelCount )  // tf.oneHot() generates int32. (channelIndexesOneHotInt32Tensor2d)
//           .cast( "float32" )            // tf.conv2d() accepts float32. (channelIndexesOneHotFloat32Tensor2d)
//           .transpose()                  // looks like tf.conv2d()'s filter. (channelIndexesOneHotFloat32TransposedTensor2d)
//           .reshape( filtersShape )      // tf.conv2d()'s filter is tensor4d. (channelIndexesOneHotFloat32Tensor4d)
//           ;

      let filtersTensor4d;
      if ( inputChannelCount <= 1 ) { // Because tf.oneHot() can not accept ( depth == 1 ), handle it separarely.
        filtersTensor4d = tf.tensor4d( [ 1 ], filtersShape );

      } else {
        let channelIndexesInt32Tensor1d =
          tf.range( inputChannelIndexStart, inputChannelIndexStop, 1, "int32" ); // tf.oneHot() accepts int32. (channelIndexesInt32Tensor1d)

        let channelIndexesOneHotInt32Tensor2d =
          channelIndexesInt32Tensor1d.oneHot( inputChannelCount );  // tf.oneHot() generates int32. (channelIndexesOneHotInt32Tensor2d)

        let channelIndexesOneHotFloat32Tensor2d =
          channelIndexesOneHotInt32Tensor2d.cast( "float32" );      // tf.conv2d() accepts float32. (channelIndexesOneHotFloat32Tensor2d)

        let channelIndexesOneHotFloat32TransposedTensor2d =
          channelIndexesOneHotFloat32Tensor2d.transpose();          // looks like tf.conv2d()'s filter. (channelIndexesOneHotFloat32TransposedTensor2d)

        let channelIndexesOneHotFloat32Tensor4d =                   // tf.conv2d()'s filter is tensor4d. (channelIndexesOneHotFloat32Tensor4d)
          channelIndexesOneHotFloat32TransposedTensor2d.reshape( filtersShape );

        filtersTensor4d = channelIndexesOneHotFloat32Tensor4d;
      }

      // Generate bias for just adding zero. (i.e. equals no bias).
      let biasesTensor3d;
      if ( this.bBias ) {
        biasesTensor3d = tf.zero( biasesShape );
      }

      this.bInitOk = true;

      return [ filtersTensor4d, biasesTensor3d ];
    });
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
  }
}


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
 * @member {number} outputChannelCount
 *   The output channel count of this pointwise convolutiuon.
 *     - Usually, if ( outputChannelCount == 0 ), it means no operation at all (i.e. bPointwise == bExisted == false ).
 *     - However, if ( outputChannelCount == 0 ) but ( ( bHigherHalfDifferent == true ) and ( inputChannelCount >= outputChannelCount )
 *         and ( channelShuffler_outputGroupCount > 0 ) ), this pointwise will exist (i.e. bPointwise == bExisted == true ) and always
 *         will not have biases (no matter how bBias is). It is all-pass-and-channel-shuffling mode.
 *
 * @member {number} outputChannelCount_Real
 *   Usually, the same as outputChannelCount. But when ( this.bAllPassThrough == true ) or ( this.bAllPassThroughShuffle == true ),
 * outputChannelCount_Real will be the same as inputChannelCount (in this case, the outputChannelCount is zero).
 *
 * @member {boolean} bHigherHalfDifferent
 *   - If false, it is just a normal poitwise convolution.
 *
 *   - If true:
 *
 *     - If ( inputChannelCount < outputChannelCount ), (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head, i.e. bHigherHalfCopyLowerHalf),
 *         the filters for the output channels between ( inputChannelCount ) and ( outputChannelCount - 1 ) will just copy
 *         the input channels between 0 and ( inputChannelCount - 1 ).
 *

//!!! ...unfinished... (2021/11/14) What if ( outputChannelCount <= 0 )?

 *
 *
 *     - If ( inputChannelCount >= outputChannelCount ):
 *
 *       - If ( channelShuffler_outputGroupCount < 0 ), (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's head, i.e. bHigherHalfPointwise22),
 *           the filters for the input channels between 0 and ( Math.ceil( inputChannelCount / 2 ) - 1 ) are pointwise21,
 *           between Math.ceil( inputChannelCount / 2 ) and ( inputChannelCount - 1 ) are pointwise22. These two filters (and biases)
 *           will be extracted in sequence, but they will be combined into one larger filters (and biases). This makes these filters'
 *           (and biases') weights are arranged the same as pointwise2 of ShuffleNetV2_ByPointwise22's head. So that the same filters
 *           weights could be used in these two architectures for comparing performance and correctness.
 *          
 *

//!!! ...unfinished... (2021/11/14) What if ( outputChannelCount <= 0 )?

 *
 *       - If ( channelShuffler_outputGroupCount == 0 ), (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail),
 *
 *           - If ( outputChannelCount > 0 ), (i.e. bHigherHalfPassThrough), the filters for the output channels between
 *               Math.ceil( outputChannelCount / 2 ) and ( outputChannelCount - 1 ) will just pass through the input to output. 
 *

//!!! ...unfinished... (2021/11/15)

 *           - If ( outputChannelCount <= 0 ), (i.e. bAllPassThrough, i.e. no pointwise2 and no channel shuffler),
 *               the filters will just pass through all input channels to output. In this case, the bPointwise (and bExisted)
 *               will be true (not false), although the specified outputChannelCount is zero. And, it always will not have
 *               biases (no matter how bBias is).
 *
 *
 *       - If ( channelShuffler_outputGroupCount > 0 ): (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 *           - If ( outputChannelCount > 0 ), (i.e. bHigherHalfPassThroughShuffle), the filters for the output channels between
 *               Math.ceil( outputChannelCount / 2 ) and ( outputChannelCount - 1 ) will just pass through the input to output.
 *               But they will be arranged just like applying channel shuffler on the output.
 *
 *           - If ( outputChannelCount <= 0 ), (i.e. bAllPassThroughShuffle, i.e. no pointwise2; i.e. pure channel shuffler),
 *               the filters will pass through all input channels to output. But they will be arranged just like applying channel
 *               shuffler on the output. In this case, the bPointwise (and bExisted) will be true (not false), although the
 *               specified outputChannelCount is zero. And, it always will not have biases (no matter how bBias is).
 *
 * @member {number} channelShuffler_outputGroupCount
 *   Only if ( bHigherHalfDifferent == true ) and ( inputChannelCount >= outputChannelCount ), it is meaningful. If positive, it will
 * be used to (pre-)shuffle the filters and biases. The total effect will be the same as applying a channel shuffler (without
 * concatenation and splitting) after pointwise convolution. (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 * @member {boolean} bHigherHalfCopyLowerHalf
 *   If ( bHigherHalfDifferent == true ) and ( inputChannelCount < outputChannelCount ), this will be true.
 *
 * @member {boolean} bHigherHalfPassThrough
 *   If ( bHigherHalfDifferent == true ) and ( inputChannelCount >= outputChannelCount ), this will be true.
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

  constructor( inputChannelCount, outputChannelCount, bBias, nActivationId, bHigherHalfDifferent, channelShuffler_outputGroupCount ) {
    super();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why not keep filtersWeights and biasesWeights in data members of this?
    // A2: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //     the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    Base.Setup_bPointwise_pfn.call( this );

    if ( !this.bPointwise ) {
      this.bInitOk = true;
      return true; // no operation at all.
    }

    if ( !this.bHigherHalfDifferent ) { // 1. Normal pointwise convolution and bias.
      this.bInitOk = Base.extractAs_NormalPointwise.call( this, inputFloat32Array );
      return this.bInitOk;
    }

    if ( this.inputChannelCount < this.outputChannelCount ) { // 2. bHigherHalfCopyLowerHalf
      this.bInitOk = Base.extractAs_HigherHalfCopyLowerHalf.call( this, inputFloat32Array );

    } else { // ( inputChannelCount >= outputChannelCount )

      if ( this.channelShuffler_outputGroupCount < 0 ) { // 3. bHigherHalfPointwise22
        this.bInitOk = Base.extractAs_HigherHalfPointwise22.call( this, inputFloat32Array );

      } else if ( this.channelShuffler_outputGroupCount == 0 ) {
        
        if ( this.outputChannelCount > 0 ) { // 4. bHigherHalfPassThrough
          this.bInitOk = Base.extractAs_HigherHalfPassThrough.call( this, inputFloat32Array );
          
        } else { // 5. ( outputChannelCount <= 0 ), bAllPassThrough
          this.bInitOk = Base.extractAs_AllPassThrough.call( this, inputFloat32Array );
        }

      } else { // ( channelShuffler_outputGroupCount > 0 ), shuffling.

        if ( this.outputChannelCount > 0 ) { // 6. bHigherHalfPassThroughShuffle
          this.bInitOk = Base.extractAs_HigherHalfPassThroughShuffle.call( this, inputFloat32Array );

        } else { // 7. ( outputChannelCount <= 0 ), bAllPassThroughShuffle
          this.bInitOk = Base.extractAs_AllPassThroughShuffle.call( this, inputFloat32Array );
        }
      }
    }

    return this.bInitOk;
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

    // (2021/10/27 Remarked) If these properties does not exist, assigning value (even undefined) to them will create them. This is un-wanted.
    //this.bHigherHalfCopyLowerHalf = this.bHigherHalfPointwise22 = this.bHigherHalfPassThrough = this.bHigherHalfPassThroughShuffle
    //  = this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
    //  = this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf
    //  = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = undefined;

    this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation = null;

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

  /** Determine this.bPointwise and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static Setup_bPointwise_pfn() {

    let bBias = this.bBias;

    // Determine whether pointwise operation should exist.
    if ( this.outputChannelCount > 0 ) {
      this.bPointwise = true;
    } else {  // ( outputChannelCount <= 0 )
      if (   ( this.bHigherHalfDifferent == true )
          && ( this.inputChannelCount >= this.outputChannelCount )
          && ( this.channelShuffler_outputGroupCount > 0 )
         ) {
        this.bPointwise = true; // all-pass-and-channel-shuffling mode.
        bBias = false; // In this case, there is always no biases (no matter how bBias is). The 

      } else {
        this.bPointwise = false;
      }
    }

    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

    if ( !this.bPointwise ) {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      return true;
    }

    this.pfnConv = Base.Conv_and_destroy; // will dispose inputTensor.

    if ( bBias ) {
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
  }

  /**
   * Extract pointwise convolution filters from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   * @param {number} inputChannelCount        The input channel count of the pointwise convolution filters.
   * @param {number} outputChannelCount       The output channel count of the pointwise convolution filters.
   *
   * @return {tf.tensor4d}                    The extracted depthwise filters. Return null, if failed.
   */
  static extractFilters( inputFloat32Array, inputChannelCount, outputChannelCount ) {
    let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
    return Base.extractTensor.call( this, inputFloat32Array, filtersShape );
  }

  /**
   * Extract filters and biases of normal pointwise convolution from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_NormalPointwise( inputFloat32Array ) {

    this.outputChannelCount_Real = this.outputChannelCount;

    // Extract all weights as specified input/output channels.
    this.inputChannelCount_toBeExtracted = this.inputChannelCount;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount;

    this.filtersTensor4d = Base.extractFilters.call( this, inputFloat32Array, this.inputChannelCount, this.outputChannelCount );
    if ( !this.filtersTensor4d )
      return false;

    if ( this.bBias ) {
      this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount );
      if ( !this.biasesTensor3d )
        return false;
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfCopyLowerHalf from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfCopyLowerHalf( inputFloat32Array ) {

    this.bHigherHalfCopyLowerHalf = true;

    let higherHalfPassThrough;
    try {

      this.outputChannelCount_Real = this.outputChannelCount;

      this.outputChannelCount_lowerHalf
        = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
        = this.inputChannelCount; // The lower half filters have the same output channel count as input.

      this.outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_lowerHalf;

      tf.util.assert( this.outputChannelCount_higherHalf > 0,
        `Pointwise.Base.extractAs_HigherHalfCopyLowerHalf(): `
          + `outputChannelCount_higherHalf ( ${this.outputChannelCount_higherHalf} ) should be greater than zero.`
      );

      higherHalfPassThrough = new PassThrough(
        this.inputChannelCount, this.outputChannelCount_higherHalf,
        0, this.outputChannelCount_higherHalf // Pass through the lower channels to higher channels (i.e. copy them to higher channels).
      );
      
      if ( !higherHalfPassThrough.bInitOk )
        return false;

      let filtersTensor4d_lowerHalf;
      try {
        filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
          inputFloat32Array, this.inputChannelCount, this.outputChannelCount_lowerHalf );

        if ( !filtersTensor4d_lowerHalf )
          return false;

        let allFiltersArray = [ filtersTensor4d_lowerHalf, higherHalfPassThrough.filtersTensor4d ];
        this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).

      } finally {
        if ( filtersTensor4d_lowerHalf )
          filtersTensor4d_lowerHalf.dispose();
      }

      if ( this.bBias ) {
        let biasesTensor3d_lowerHalf;
        try {
          biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );

          if ( !biasesTensor3d_lowerHalf )
            return false;

          let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
          this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

        } finally {
          if ( biasesTensor3d_lowerHalf )
            biasesTensor3d_lowerHalf.dispose();
        }
      }

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {

      if ( higherHalfPassThrough ) {

        // Include the weights count of the higher-half-pass-through filters and biases.
        this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.filtersTensor4d.shape );
        if ( higherHalfPassThrough.biasesTensor3d ) {
          this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.biasesTensor3d.shape );
        }

        higherHalfPassThrough.disposeTensors();
      }
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfPointwise22 from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfPointwise22( inputFloat32Array ) {

    this.bHigherHalfPointwise22 = true;

    this.outputChannelCount_Real = this.outputChannelCount;

    // Extract all weights as specified input/output channels (just like a normal pointwise convolution, but with a different arrangement).
    this.inputChannelCount_toBeExtracted = this.inputChannelCount;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount;

    this.inputChannelCount_lowerHalf = Math.ceil( this.inputChannelCount / 2 );
    this.outputChannelCount_lowerHalf = Math.ceil( this.outputChannelCount / 2 );

    this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
    this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

    // If the channel count can not be halved (e.g. ( inputChannelCount == 1 ) or ( outputChannelCount == 1 ) ), treated as normal pointwise.
    if ( ( 0 == this.inputChannelCount_higherHalf ) || ( 0 == this.outputChannelCount_higherHalf ) ) {
      return Base.extractAs_NormalPointwise.call( this, inputFloat32Array );
    }

    let filtersTensor4d_lowerHalf, biasesTensor3d_lowerHalf, filtersTensor4d_higherHalf, biasesTensor3d_higherHalf;
    try {
      // The extracting order is important: lowerHalfFilter, lowerHalfBias, higherHalfFilter, higherHalfBias.
      {
        filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
          inputFloat32Array, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

        if ( !filtersTensor4d_lowerHalf )
          return false;

        if ( this.bBias ) {
          biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
          if ( !biasesTensor3d_lowerHalf )
            return false;
        }

        filtersTensor4d_higherHalf = Base.extractFilters.call( this,
          inputFloat32Array, this.inputChannelCount_higherHalf, this.outputChannelCount_higherHalf );

        if ( !filtersTensor4d_higherHalf )
          return false;

        if ( this.bBias ) {
          biasesTensor3d_higherHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_higherHalf );
          if ( !biasesTensor3d_higherHalf )
            return false;
        }
      }

      // Combine lower and higher into one larger filters and biases.
      let allFiltersArray = [ filtersTensor4d_lowerHalf, filtersTensor4d_higherHalf ];
      this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).

      if ( this.bBias ) {
        let allBiasesArray = [ biasesTensor3d_lowerHalf, biasesTensor3d_higherHalf ];
        this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
      }

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {
      if ( biasesTensor3d_higherHalf )
        biasesTensor3d_higherHalf.dispose();

      if ( filtersTensor4d_higherHalf )
        filtersTensor4d_higherHalf.dispose();

      if ( biasesTensor3d_lowerHalf )
        biasesTensor3d_lowerHalf.dispose();

      if ( filtersTensor4d_lowerHalf )
        filtersTensor4d_lowerHalf.dispose();
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfPassThrough from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfPassThrough( inputFloat32Array ) {

    this.bHigherHalfPassThrough = true;

    let higherHalfPassThrough;
    try {

      this.outputChannelCount_Real = this.outputChannelCount;

      // 1. In order to "pass-through" the higher half, the channel count of input's higher half must be the same as output's higher half.
      this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf = Math.floor( this.outputChannelCount / 2 );

      // 2.

      // 2.1 If the channel count can not be halved, extracted as normal pointwise (i.e. nothing to be past-through).
      // e.g. ( outputChannelCount == 1 ). The lower-half will be 1. The higher-half will be 0.
      if ( this.outputChannelCount_higherHalf <= 0 ) {

        if ( !Base.extractAs_NormalPointwise.call( this, inputFloat32Array ) )
          return false;

      } else { // 2.2 The higher half can be past-through.

        // Note: The channel count of input's lower half might be different from output's lower half. The reason is inputChannelCount
        // might be different from outputChannelCount.
        this.inputChannelCount_lowerHalf =  this.inputChannelCount_toBeExtracted =  this.inputChannelCount  - this.inputChannelCount_higherHalf;
        this.outputChannelCount_lowerHalf = this.outputChannelCount_toBeExtracted = this.outputChannelCount - this.outputChannelCount_higherHalf;

        higherHalfPassThrough = new PassThrough(
          this.inputChannelCount, this.outputChannelCount_higherHalf,
          this.outputChannelCount_higherHalf, this.outputChannelCount // Pass through the higher channels.
        );

        if ( !higherHalfPassThrough.bInitOk )
          return false;

        { // The extracted filters should be expanded to accept a larger input channel count (i.e. this.inputChannelCount,
          // not Math.ceil( this.outputChannelCount / 2 ) ). The extra channel's filters are just zero.
          let filtersTensor4d_lowerHalf_expanded;
          try {
            let filtersTensor4d_lowerHalf, filtersTensor4d_zeros;
            try {
              filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
                inputFloat32Array, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

              if ( !filtersTensor4d_lowerHalf )
                return false;

              {
                let zeroShape = filtersTensor4d_lowerHalf.shape.slice(); // Clone filters' shape array.

                // The second last axis (i.e. inDepth axis; axis id 2) should be just fill the difference between real inputChanneCount
                // and the extracted filters.
                zeroShape[ 2 ] = this.inputChannelCount - filtersTensor4d_lowerHalf.shape[ 2 ];

                filtersTensor4d_zeros = tf.zeros( zeroShape );
              }

              let expandedFiltersArray = [ filtersTensor4d_lowerHalf, filtersTensor4d_zeros ];
              filtersTensor4d_lowerHalf_expanded = tf.concat( expandedFiltersArray, 2 ); // Along the second last axis (i.e. inDepth axis; axis id 2).

            } finally {
              if ( filtersTensor4d_zeros )
                filtersTensor4d_zeros.dispose();

              if ( filtersTensor4d_lowerHalf )
                filtersTensor4d_lowerHalf.dispose();
            }

            let allFiltersArray = [ filtersTensor4d_lowerHalf_expanded, higherHalfPassThrough.filtersTensor4d ];
            this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).

          } finally {
            if ( filtersTensor4d_lowerHalf_expanded )
              filtersTensor4d_lowerHalf_expanded.dispose();
          }
        }

        if ( this.bBias ) {
          let biasesTensor3d_lowerHalf;
          try {
            biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );

            if ( !biasesTensor3d_lowerHalf )
              return false;

            let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
            this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

          } finally {
            if ( biasesTensor3d_lowerHalf )
              biasesTensor3d_lowerHalf.dispose();
          }
        }

      }

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {

      if ( higherHalfPassThrough ) {

        // Include the weights count of the higher-half-pass-through filters and biases.
        this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.filtersTensor4d.shape );
        if ( higherHalfPassThrough.biasesTensor3d ) {
          this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.biasesTensor3d.shape );
        }

        higherHalfPassThrough.disposeTensors();
      }
    }

    return true;
  }

  /**
   * Extract filters and biases of AllPassThrough from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_AllPassThrough( inputFloat32Array ) {

    this.bAllPassThrough = true;

    let higherHalfPassThrough;
    try {

      this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = 0; // Does not extract any weights.

      // The real outputChannelCount is the same as inputChannelCount. (Note: this.outputChannelCount is zero here.)
      this.outputChannelCount_Real = this.inputChannelCount;

      higherHalfPassThrough = new PassThrough(
        this.inputChannelCount, this.outputChannelCount_Real,
        0, this.outputChannelCount_Real // Pass through all the input channels.
      );

      if ( !higherHalfPassThrough.bInitOk )
        return false;

      this.filtersTensor4d = higherHalfPassThrough.filtersTensor4d; // all pass through.
      this.biasesTensor3d = null; // always does not have biases (no matter how bBias is).

      this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.filtersTensor4d.shape );
      higherHalfPassThrough.filtersTensor4d = null; // So that it will not be disposed. (It has been used as this.filtersTensor4d.)

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {

      if ( higherHalfPassThrough ) {
        higherHalfPassThrough.disposeTensors();
      }
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfPassThroughShuffle from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfPassThroughShuffle( inputFloat32Array ) {
    
    try {
      let bInitOk = Base.extractAs_HigherHalfPassThrough.call( this, inputFloat32Array );
      if ( !bInitOk )
        return false;

      this.bHigherHalfPassThrough = undefined; // Cancel the flag of extractAs_HigherHalfPassThrough().
      this.bHigherHalfPassThroughShuffle = true;
      Base.shuffle_filters_biases.call( this ); // Pre-shuffle channels by shuffling the filters and biases.

    } catch ( e ) {
      return false; // e.g. memory not enough.
    }

    return true;
  }

  /**
   * Extract filters and biases of AllPassThroughShuffle from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.inputChannelCount
   *   - this.outputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount_Real
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_AllPassThroughShuffle( inputFloat32Array ) {

    try {
      let bInitOk = Base.extractAs_AllPassThrough.call( this, inputFloat32Array );
      if ( !bInitOk )
        return false;

      this.bAllPassThrough = undefined; // Cancel the flag of extractAs_AllPassThrough().
      this.bAllPassThroughShuffle = true;
      Base.shuffle_filters_biases.call( this ); // Pre-shuffle channels by shuffling the filters and biases.

    } catch ( e ) {
      return false; // e.g. memory not enough.
    }

    return true;
  }

  /**
   * Pre-shuffle channels by shuffling the filters and biases.
   *
   * The following data members will be modified:
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   */
  static shuffle_filters_biases() {

    if ( this.filtersTensor4d ) { // Shuffle the filters along the last (i.e. channel) axis.
      let filtersChannelShuffler = new ChannelShuffler.ShuffleInfo( this.filtersTensor4d.shape, this.channelShuffler_outputGroupCount );
      let filtersTensor4d_shuffled = filtersChannelShuffler.reshapeTransposeReshape( this.filtersTensor4d );

      this.filtersTensor4d.dispose();
      this.filtersTensor4d = filtersTensor4d_shuffled;
    }

    if ( this.biasesTensor3d ) { // Shuffle the biases along the last (i.e. channel) axis.
      let biasesChannelShuffler = new ChannelShuffler.ShuffleInfo( this.biasesTensor3d.shape, this.channelShuffler_outputGroupCount );
      let biasesTensor3d_shuffled = biasesChannelShuffler.reshapeTransposeReshape( this.biasesTensor3d );

      this.biasesTensor3d.dispose();
      this.biasesTensor3d = biasesTensor3d_shuffled;
    }
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
