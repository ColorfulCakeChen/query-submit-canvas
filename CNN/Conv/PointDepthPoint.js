export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as Weights from "../Weights.js";
import * as ReturnOrClone from "./ReturnOrClone.js";

/**
 * Pointwise-depthwise-pointwise convolution layer parameters.
 *
//!!! ...unfinished...
 * @member {number} outChannels
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 */
class Params extends Weights.Params {

  /**
   * @param {number} channelMultiplier
   *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
   * embedding channels. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
      [ Weights.Params.Keys.inChannels,        inChannels ],
      [ Weights.Params.Keys.channelMultiplier, channelMultiplier ],

      // The output channel count of pointwise-depthwise-pointwise convolution layer is a dynamic parameter.
      // It can not be easily determined from single parameter. It will be computed from multiple parameters.
      // So it is not defined here.
      //[ Weights.Params.Keys.outChannels,     ??? ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  /**
   * @return {string}
   *   Convert number value into zero or positive integer. Use it as array index. Return the looked up activation function name string.
   */
  static toActivationName( value ) {
    return Params.toArrayElement( value, Params.ConverterHelper.ActivationNames );
  }

  /** @return {number} Convert number value into an integer suitable for depthwise convolution filter size. */
  static toDepthwiseFilterHeight( value ) {
    // At least 1, because depthwise filter size ( 0 * 0 ) is meaningless.
    //
    // For avg pooling or max pooling, it is less meaningful if filter size is ( 1 * 1 ) because the result will be the same as input.
    // For depthwise convolution, it is meaningful if filter size is ( 1 * 1 ) because they could be used as simple channel multiplier.
    //
    // Avoid too large filter size. Otherwise, performance may be poor.
    return Params.toIntegerRange( value, 1, 9 );
  }

  /**
   * @return {(string|number)}
   *   Convert number value into integer between [ 0, 64 ] as channel multiplier, or string "Avg", or string "Max".
   */
  static toDepthwise_AvgMax_Or_ChannelMultiplier( value ) {
    return Params.toArrayElement( value, Params.ConverterHelper.Depthwise_AvgMax_Or_ChannelMultiplier_Array );
  }

  /** @return {number} Convert number value into an integer suitable for depthwise strides. */
  static toDepthwiseStrides( value ) {
    // At least, strides should be 1. But avoid too large strides. Otherwise, too many data will be skipped.
    return Params.toIntegerRange( value, 1, 2 );
  }

  /** @return {string} Convert number value into 0 or 1. Return "valid" if 0. Return "same" if 1. */
  static toDepthwisePadTypeString( value ) {
    return Params.toArrayElement( value, Params.ConverterHelper.DepthwisePadTypeStringArray );
  }

}

Params.ConverterHelper = {};
Params.ConverterHelper.ActivationNames = [ "", "relu", "relu6", "sigmoid", "tanh", "sin", "cos" ];

// "64" is possible channel multiplier kinds (1 to 64). Avoid too large channel multiplier. Otherwise, performance may be poor.
// "+1" is for channel multiplier equals 0 (means no depthwise operation).
Params.ConverterHelper.Depthwise_AvgMax_Or_ChannelMultiplier_Array = [ ... new Array( 64 + 1 ).keys(), "Avg", "Max" ];
Params.ConverterHelper.DepthwisePadTypeStringArray = [ "valid", "same" ];


//!!! ...unfinished... any modifying of Params.Keys will afftecs Weights.Params.Keys because it is shared.
/**
 * Define parameter keys.
 *
 * Define new namespace for avoiding modify Params.Keys directly (because Weights.Params.Keys is shared by all derived sub class).
 */
Params.PointDepthPoint = { Keys: {} };
Params.PointDepthPoint.Keys.pointwise1ChannelCount =        Symbol("pointwise1ChannelCount");
//Params.Keys.channelMultiplier = Symbol("channelMultiplier");
// Params.Keys.outChannels =       Symbol("outChannels");
//
// Params.Keys.dilationHeight =    Symbol("dilationHeight");
// Params.Keys.dilationWidth =     Symbol("dilationWidth");
// Params.Keys.filterHeight =      Symbol("filterHeight");
// Params.Keys.filterWidth =       Symbol("filterWidth");

//!!! ...unfinished... 
//    * @param {number} pointwise1ChannelCount
//    *   The output channel count of the first pointwise convolution. If 0, there will be no pointwise convolution before depthwise convolution.
//    *
//    * @param {boolean} bPointwise1Bias
//    *   If true, there will be a bias after pointwise convolution. If ( pointwise1ChannelCount == 0 ), this bias will also be ignored.
//    *
//    * @param {string} pointwise1ActivationName
//    *   The activation function name after the first pointwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid",
//    * "tanh", "sin", "cos". If ( pointwise1ChannelCount == 0 ), this activation function will also be ignored.
//    *
//    * @param {number} depthwiseFilterHeight
//    *   The height (and width) of depthwise convolution's filter. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will also be ignored.
//    *
//    * @param {(string|number)} depthwise_AvgMax_Or_ChannelMultiplier
//    *   Depthwise operation. If "Avg", average pooling. If "Max", max pooling. If positive integer number, depthwise convolution and the number
//    * indicates channel multiplier of depthwise convolution. If 0, there will be no depthwise operation.
//    *
//    * @param {number} depthwiseStrides
//    *   The strides of depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this strides will also be ignored.
//    *
//    * @param {string} depthwisePad
//    *   The padding of depthwise convolution. "valid" or "same". If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this pad will also be ignored.
//    *
//    * @param {boolean} bDepthwiseBias
//    *   If true, there will be a bias after depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this bias will also be
//    * ignored.
//    *
//    * @param {string} depthwiseActivationName
//    *   The activation function name after depthwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid", "tanh", "sin",
//    * "cos". If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this activation will also be ignored.
//    *
//    * @param {number} pointwise2ChannelCount
//    *   The output channel count of the second pointwise convolution. If 0, there will be no pointwise convolution after depthwise convolution.
//    *
//    * @param {boolean} bPointwise2Bias
//    *   If true, there will be a bias after the second pointwise convolution. If ( pointwise2ChannelCount == 0 ), this bias will also be ignored.
//    *
//    * @param {string} pointwise2ActivationName
//    *   The activation function name after the second pointwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid",
//    * "tanh", "sin", "cos". If ( pointwise2ChannelCount == 0 ), this activation function will also be ignored.
//    *
//    * @param {boolean} bAddInputToOutput
//    *   If true and ( depthwiseStrides == 1 ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ), the inputTensor will be
//    * added to output in apply_and_destroy(). This could achieve the residual connection of MobileNetV2.


/**
 * One step of one block of convolution neural network. There are at most three convolutions inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * Every convolution (no matter pointwise or depthwise) could exist or not exist. If exists, it could have or have no bias and
 * activation function.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} inChannels
 *   Input channel count. This is the same as this.channelCount_pointwise1Before (from initer()).
 *
//!!! ...unfinished...
 * @member {number} channelMultiplier
 *   ??? Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. It could be viewed as embeddingChannelCountPerInputChannel.
 *
 * @member {number} outChannels
 *   The output channel count after these three convolutions. It is the same as this.channelCount_pointwise2After.
 *
 *
 * @member {number} channelCount_pointwise1After_depthwiseBefore
 *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals expansionChannelCount.
 * If ( pointwise1ChannelCount <= 0 ), it equals channelCount_expansionBefore.
 *
 * @member {number} channelCount_depthwiseAfter_pointwise2Before
 *   The channel count after the NxN depthwise convolution.  If ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 * ( channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier ). If "Avg" or "Max" or ( <= 0 ), it equals
 * channelCount_pointwise1After_depthwiseBefore.
 *
 * @member {number} channelCount_pointwise2After
 *   The channel count after the second 1x1 pointwise convolution. If ( pointwise2ChannelCount > 0 ), it equals pointwiseChannelCount.
 * If ( pointwise2ChannelCount <= 0 ), it equals channelCount_depthwiseAfter_pointwise2Before.
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has a parameter inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which will be processed.
 * It returns a new tf.tensor3d. All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method
 * calls one of apply_and_destroy_AddInputToOutput(), apply_and_keep_AddInputToOutput(), apply_and_destroy_or_keep_NoSkipConnection() according
 * to the init()'s parameters.
 */
class Base extends ReturnOrClone.Base {

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} channelCount_pointwise1Before
   *   The channel count of input image.
   *

//!!! ...unfinished... If negative, the channel count will be the same as input channel count (i.e. equal to channelCount_pointwise1Before).
// And will be added with the input if it is the last layer of this PointDepthPoint.
//
//!!! ...unfinished... What if ( depthwiseStrides != 1 ) or ( depthwisePad != "same" ) ?

   * @param {number} pointwise1ChannelCount
   *   The output channel count of the first pointwise convolution. If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bPointwise1Bias
   *   If true, there will be a bias after pointwise convolution. If ( pointwise1ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise1ActivationName
   *   The activation function name after the first pointwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid",
   * "tanh", "sin", "cos". If ( pointwise1ChannelCount == 0 ), this activation function will also be ignored.
   *
   * @param {number} depthwiseFilterHeight
   *   The height (and width) of depthwise convolution's filter. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will also be ignored.
   *
   * @param {(string|number)} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If "Avg", average pooling. If "Max", max pooling. If positive integer number, depthwise convolution and the number
   * indicates channel multiplier of depthwise convolution. If 0, there will be no depthwise operation.
   *
   * @param {number} depthwiseStrides
   *   The strides of depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this strides will also be ignored.
   *
   * @param {string} depthwisePad
   *   The padding of depthwise convolution. "valid" or "same". If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this pad will also be ignored.
   *
   * @param {boolean} bDepthwiseBias
   *   If true, there will be a bias after depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this bias will also be
   * ignored.
   *
   * @param {string} depthwiseActivationName
   *   The activation function name after depthwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid", "tanh", "sin",
   * "cos". If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this activation will also be ignored.
   *
   * @param {number} pointwise2ChannelCount
   *   The output channel count of the second pointwise convolution. If 0, there will be no pointwise convolution after depthwise convolution.
   *
   * @param {boolean} bPointwise2Bias
   *   If true, there will be a bias after the second pointwise convolution. If ( pointwise2ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise2ActivationName
   *   The activation function name after the second pointwise convolution. One of the following: "" (or null), "relu", "relu6", "sigmoid",
   * "tanh", "sin", "cos". If ( pointwise2ChannelCount == 0 ), this activation function will also be ignored.
   *
   * @param {boolean} bAddInputToOutput
   *   If true and ( depthwiseStrides == 1 ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ), the inputTensor will be
   * added to output in apply_and_destroy(). This could achieve the residual connection of MobileNetV2.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer(
    progressParent,
    inputFloat32Array, byteOffsetBegin,
    channelCount_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    bAddInputToOutput,
    bKeepInputTensor
  ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
//!!! ...unfinished...
      1             // for extracting parameters from inputFloat32Array.
      + inChannels  // for extracting vocabulary table of every input channel from inputFloat32Array.
      + inChannels  // for building vocabulary table tensor3d of every input channel.
      + 1           // for building one merged vocabulary table tensor3d for all input channels.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

    this.disposeTensors();  // Also initialize some member function pointers to no_operation().

    // 1. Extract parameters.
    this.params = new Params();
//!!! ...unfinished...
    if ( !this.params.init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier ) )
      return false;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. ???

    let bShouldAddInputToOutput = false;
    if (   ( bAddInputToOutput )          // MobileNetV2 should add input to output, so should not destroy input tensor (otherwise can not add it).
        && ( depthwiseStrides == 1 ) ) {  // However, even if MobileNetV2, only if not setp 0 (whose strides == 2) of a block can add input to output.
      bShouldAddInputToOutput = true;
    }

    // Record whether already keep input tensor.
    // Only first operation could or not dispose input according to bKeepInputTensor.
    let bAlreadyKeepInputTensor = false;

    this.channelCount_pointwise1Before = channelCount_pointwise1Before;

    // The first 1x1 pointwise convolution.
    this.pointwise1ChannelCount = pointwise1ChannelCount;
    this.bPointwise1 = ( pointwise1ChannelCount > 0 );
    this.bPointwise1Bias = bPointwise1Bias;
    this.pointwise1ActivationName = pointwise1ActivationName;
    this.pointwise1ActivationFunction = Base.getActivationFunction( pointwise1ActivationName );

    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = pointwise1ChannelCount;

      //this.pointwise1FilterHeightWidth = [ 1, 1 ];
      this.pointwise1FiltersShape =      [ 1, 1, this.channelCount_pointwise1Before, this.channelCount_pointwise1After_depthwiseBefore ];
      this.pointwise1BiasesShape =       [ 1, 1, this.channelCount_pointwise1After_depthwiseBefore ];

      this.pointwise1FiltersTensor4d = Base.generateTensor( this.pointwise1FiltersShape );

      if ( bShouldAddInputToOutput ) { // If MobileNetV2 and not step 0, should not destroy input tensor so that can add input to output.
//!!! ...unfinished...
// What if can not add-input-to-output because ( channelCount_pointwise1Before != this.channelCount_pointwise2After )
// or ( depthwiseStrides != 1 ) or ( depthwisePad != "same" ) finally?
// The input will not be disposed even if it should be.
//
// Which one should keep input if ( bPointwise1 == false ) or ( bDepthwise == false ) or ( bPointwise2 == false )
// when ( bShouldAddInputToOutput == true )?
//
// Usually, only the following combination is used (and legal):
//   ( bAddInputToOutput ==  true ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "same" ) && ( channelCount_pointwise1Before == this.channelCount_pointwise2After )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "same" )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "valid" )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 2 ) && ( depthwisePad == "same" )
//
//

        this.pfn_pointwise1Conv = Base.pointwise1Conv_and_keep;    // will NOT dispose inputTensor.
        bAlreadyKeepInputTensor = true;
      } else {
        if ( ( bKeepInputTensor ) && ( bAlreadyKeepInputTensor == false ) ) { // will NOT dispose inputTensor.
          this.pfn_pointwise1Conv = Base.pointwise1Conv_and_keep;
          bAlreadyKeepInputTensor = true;
        } else {                                                              // will dispose inputTensor.
          this.pfn_pointwise1Conv = Base.pointwise1Conv_and_destroy;
        }
      }

      if ( bPointwise1Bias ) {
        this.pointwise1BiasesTensor3d = Base.generateTensor( this.pointwise1BiasesShape );
        this.pfn_pointwise1Bias = Base.pointwise1Bias_and_destroy;
      }

      if ( this.pointwise1ActivationFunction )
        this.pfn_pointwise1Activation = Base.pointwise1Activation_and_destroy;

    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount_pointwise1Before;  // No first 1x1 pointwise convolution.
    }

    // The depthwise operation.

    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false;               // Assume no depthwise.
    this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // So no channel multiplier.

    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.
    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;

    if ( Number.isNaN( depthwise_AvgMax_Or_ChannelMultiplier ) ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).
       this.bDepthwise = true;

      if ( ( bKeepInputTensor ) && ( bAlreadyKeepInputTensor == false ) ) { // will NOT dispose inputTensor.
        this.pfn_depthwiseOperation = Base.keep_input_return_copy; // Just clone input if 1x1 or illegal pooling type (i.e. not AVG, not MAX).

        if ( ( 1 == this.depthwiseFilterHeight ) && ( 1 == this.depthwiseFilterWidth ) ) {
          // Do nothing, because the result of 1x1 AVG or MAX pooling is just the same as input.
        } else {
          switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
            case "Avg": this.bDepthwiseAvg = true; this.pfn_depthwiseOperation = Base.depthwiseAvg_and_keep; break;
            case "Max": this.bDepthwiseMax = true; this.pfn_depthwiseOperation = Base.depthwiseMax_and_keep; break;
          }
        }
        bAlreadyKeepInputTensor = true;

      } else {                                                              // will dispose inputTensor.
        this.pfn_depthwiseOperation = Base.return_input_directly; // Just return input if 1x1 or illegal pooling type (i.e. not AVG, not MAX).

        if ( ( 1 == this.depthwiseFilterHeight ) && ( 1 == this.depthwiseFilterWidth ) ) {
          // Do nothing, because the result of 1x1 AVG or MAX pooling is just the same as input.
        } else {
          switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
            case "Avg": this.bDepthwiseAvg = true; this.pfn_depthwiseOperation = Base.depthwiseAvg_and_destroy; break;
            case "Max": this.bDepthwiseMax = true; this.pfn_depthwiseOperation = Base.depthwiseMax_and_destroy; break;
          }
        }
      }

    } else {
      if ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
        this.bDepthwise = this.bDepthwiseConv = true;

        this.channelCount_depthwiseAfter_pointwise2Before
          = this.channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ depthwiseFilterHeight, this.depthwiseFilterWidth,
              this.channelCount_pointwise1After_depthwiseBefore, depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersTensor4d = Base.generateTensor( this.depthwiseFiltersShape );

        if ( ( bKeepInputTensor ) && ( bAlreadyKeepInputTensor == false ) ) { // will NOT dispose inputTensor.
          this.pfn_depthwiseOperation = Base.depthwiseConv_and_keep;
          bAlreadyKeepInputTensor = true;
        } else {                                                              // will dispose inputTensor.
          this.pfn_depthwiseOperation = Base.depthwiseConv_and_destroy;
        }

      } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      }
    }

    this.depthwiseStrides = depthwiseStrides;
    this.depthwisePad = depthwisePad;
    this.bDepthwiseBias = bDepthwiseBias;
    this.depthwiseActivationName = depthwiseActivationName;
    this.depthwiseActivationFunction = Base.getActivationFunction( depthwiseActivationName );

    this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, this.depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before ];

    if ( this.bDepthwise ) {
      if ( bDepthwiseBias ) {
        this.depthwiseBiasesTensor3d = Base.generateTensor( this.depthwiseBiasesShape );
        this.pfn_depthwiseBias = Base.depthwiseBias_and_destroy;
      }

      if ( this.depthwiseActivationFunction )
        this.pfn_depthwiseActivation = Base.depthwiseActivation_and_destroy;
    }

    // The second 1x1 pointwise convolution.
    this.pointwise2ChannelCount = pointwise2ChannelCount;
    this.bPointwise2 = ( pointwise2ChannelCount > 0 );
    this.bPointwise2Bias = bPointwise2Bias;
    this.pointwise2ActivationName = pointwise2ActivationName;
    this.pointwise2ActivationFunction = Base.getActivationFunction( pointwise2ActivationName );

    if ( this.bPointwise2 ) {
      this.channelCount_pointwise2After = this.pointwise2ChannelCount;

      //this.pointwise2FilterHeightWidth = [ 1, 1 ];
      this.pointwise2FiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before, this.channelCount_pointwise2After ];
      this.pointwise2BiasesShape =       [ 1, 1, this.channelCount_pointwise2After ];

      this.pointwise2FiltersTensor4d = Base.generateTensor( this.pointwise2FiltersShape );

      if ( ( bKeepInputTensor ) && ( bAlreadyKeepInputTensor == false ) ) { // will NOT dispose inputTensor.
        this.pfn_pointwise2Conv = Base.pointwise2Conv_and_keep;
        bAlreadyKeepInputTensor = true;
      } else {                                                              // will dispose inputTensor.
        this.pfn_pointwise2Conv = Base.pointwise2Conv_and_destroy;
      }

      if ( bPointwise2Bias ) {
        this.pointwise2BiasesTensor3d = Base.generateTensor( this.pointwise2BiasesShape );
        this.pfn_pointwise2Bias = Base.pointwise2Bias_and_destroy;
      }

      if ( this.pointwise2ActivationFunction )
        this.pfn_pointwise2Activation = Base.pointwise2Activation_and_destroy;

    } else {
      this.channelCount_pointwise2After = this.channelCount_depthwiseAfter_pointwise2Before;
    }

    this.bAddInputToOutput = bAddInputToOutput;
    this.bShouldAddInputToOutput = bShouldAddInputToOutput;

    this.bKeepInputTensor = bKeepInputTensor;

//!!! ...unfinished...
// If ( channelCount_pointwise1Before != this.channelCount_pointwise2After ), should not add-input-to-output.

    if ( bShouldAddInputToOutput ) { // If MobileNetV2 and not step 0, should not destroy input tensor so that can add input to output.
      // Should also ( channelCount_pointwise1Before == this.channelCount_pointwise2After ). Otherwise, the result will be wrong.

      if ( bKeepInputTensor )
        this.apply_and_destroy_or_keep = Base.apply_and_keep_AddInputToOutput;    // will NOT dispose inputTensor.
      else
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_AddInputToOutput; // will dispose inputTensor.

    } else {
      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_NoSkipConnection; // will or will NOT dispose inputTensor.
    }


//!!! ...unfinished... (2021/01/11 New Method)

    // Although caller could request add-input-to-output, it may or may not doable.
    this.bAddInputToOutput = bAddInputToOutput;
    if ( bAddInputToOutput ) {

      // Only if the dimension of output is the same as the dimension of input, it is possible to add-input-to-output.
      //
      // Only if stride is "1" and pad is "same", the dimension 0 (height) and 1 (width) of the output will be the same as input.
      // Only if output channel is equals to input channel, the dimension 2 (channel) of the output will be the same as input.
      if (   ( depthwiseStrides == 1 )
          && ( depthwisePad == "same" )
          && ( channelCount_pointwise1Before == this.channelCount_pointwise2After ) ) {

        this.bShouldAddInputToOutput = true;

//!!! ...unfinished...
      } else {
        // Since it is not possible to add-input-to-output, it should not be done.
        this.bShouldAddInputToOutput = false;
      }
    }
//   ( bAddInputToOutput ==  true ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "same" ) && ( channelCount_pointwise1Before == this.channelCount_pointwise2After )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "same" )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 1 ) && ( depthwisePad == "valid" )
//   ( bAddInputToOutput == false ) && ( depthwiseStrides == 2 ) && ( depthwisePad == "same" )

  }

// !!! (2021/01/07) ...unfinished...
//   /**
//    * Initialize this object by calling initer() and advance the generator by loop until done.
//    *
//    * @param {ValueMax.Percentage.Aggregate} progressParent
//    *   If null, a temporary progress object will be created.
//    *
//    * @return {boolean}
//    *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
//    *   Return false if failed (and progressParent.valuePercentage will be less than 100).
//    */
//   init(
//     progressParent,
//     inputFloat32Array, byteOffsetBegin,
//     inChannels, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
//     bKeepInputTensor,
//     bSplitReshapeGatherConcat
//   ) {
//
//     progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );
//
//     let initer = this.initer(
//       progressParent,
//       inputFloat32Array, byteOffsetBegin,
//       inChannels, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
//       bKeepInputTensor,
//       bSplitReshapeGatherConcat
//     );
//
//     let initerNext;
//     do {
//       initerNext = initer.next();
//     } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().
//
//     let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
//     return bInitOk;
//   }

  /** Convert activation function name to function object. */
  static getActivationFunction( strActivationName ) {
    switch ( strActivationName ) {
      case "relu":    return tf.relu;    break;
      case "relu6":   return tf.relu6;   break;
      case "sigmoid": return tf.sigmoid; break;
      case "tanh":    return tf.tanh;    break;
      case "sin":     return tf.sin;     break;
      case "cos":     return tf.cos;     break;
      //default:
    }
    return null;
  }

  /**
   * @param {number[]} newTensorShape
   *   The returned tensor's shape. If null, same as zero size.
   *
   * @return {tf.tensor4d|tf.tensor3d}
   *   Return a tensor4d or tensor3d acccording to newTensorShape. If size of newTensorShape is zero, return null.
   */
  static generateTensor( newTensorShape ) {
    return tf.tidy( () => {

      let valueCount = 0;
      if ( newTensorShape )
        valueCount = tf.util.sizeFromShape( newTensorShape );

      let tensor1d, tensorNew = null;
      if ( valueCount ) {
        tensor1d = tf.range( 0, valueCount, 1 );
        tensorNew = tensor1d.reshape( newTensorShape );
      }

      return tensorNew;
    });
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.pointwise1FiltersTensor4d ) {
      tf.dispose( this.pointwise1FiltersTensor4d );
      this.pointwise1FiltersTensor4d = null;
    }

    if ( this.pointwise1BiasesTensor3d ) {
      tf.dispose( this.pointwise1BiasesTensor3d );
      this.pointwise1BiasesTensor3d = null;
    }

    if ( this.depthwiseFiltersTensor4d ) {
      tf.dispose( this.depthwiseFiltersTensor4d );
      this.depthwiseFiltersTensor4d = null;
    }

    if ( this.depthwiseBiasesTensor3d ) {
      tf.dispose( this.depthwiseBiasesTensor3d );
      this.depthwiseBiasesTensor3d = null;
    }

    if ( this.pointwise2FiltersTensor4d ) {
      tf.dispose( this.pointwise2FiltersTensor4d );
      this.pointwise2FiltersTensor4d = null;
    }

    if ( this.pointwise2BiasesTensor3d ) {
      tf.dispose( this.pointwise2BiasesTensor3d );
      this.pointwise2BiasesTensor3d = null;
    }

    this.pfn_pointwise1Conv =     this.pfn_pointwise1Bias = this.pfn_pointwise1Activation =
    this.pfn_depthwiseOperation = this.pfn_depthwiseBias =  this.pfn_depthwiseActivation =
    this.pfn_pointwise2Conv =     this.pfn_pointwise2Bias = this.pfn_pointwise2Activation = Base.no_operation;

    this.params
//!!! ...unfinished...
//      = this.???
      = null;
  }

  /**
   * This method returns nothing. This is different from ReturnOrClone.return_input_directly() which will return input.
   * This method is used for distinguishing from whether an operation does or does not exist.
   *
   * @return {unefined} Just return nothing without doing anything.
   */
  static no_operation( inputTensor ) {}

  /** First 1x1 pointwise convolution. (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static pointwise1Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static pointwise1Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  static pointwise1Bias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.pointwise1BiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static pointwise1Activation_and_destroy( inputTensor ) {
    let t = this.pointwise1ActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Average Pooling. */
  static depthwiseAvg_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
  }

  static depthwiseAvg_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Max Pooling. */
  static depthwiseMax_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
  }

  static depthwiseMax_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Convolution. */
  static depthwiseConv_and_keep( inputTensor ) {
    return tf.depthwiseConv2d( inputTensor, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
  }

  static depthwiseConv_and_destroy( inputTensor ) {
    let t = tf.depthwiseConv2d( inputTensor, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
    inputTensor.dispose();
    return t;
  }

  static depthwiseBias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.depthwiseBiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static depthwiseActivation_and_destroy( inputTensor ) {
    let t = this.depthwiseActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** Second 1x1 pointwise convolution. */
  static pointwise2Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.pointwise2FiltersTensor4d, 1, "valid" );
  }

  static pointwise2Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.pointwise2FiltersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  static pointwise2Bias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.pointwise2BiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static pointwise2Activation_and_destroy( inputTensor ) {
    let t = this.pointwise2ActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** The input will be added to output for achieving skip connection. The inputTensor will be kept (not disposed).*/
  static apply_and_keep_AddInputToOutput( inputTensor ) {
    let t0, t1;

    // The first 1x1 pointwise convolution.
    t0 = this.pfn_pointwise1Conv( inputTensor ); // inputTensor should NOT be disposed here. It should be disposed later (after residual connection).
    t1 = this.pfn_pointwise1Bias( t0 );
    t0 = this.pfn_pointwise1Activation( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperation( t0 );
    t0 = this.pfn_depthwiseBias( t1 );
    t1 = this.pfn_depthwiseActivation( t0 );

    // The second 1x1 pointwise convolution.
    t0 = this.pfn_pointwise2Conv( t1 );
    t1 = this.pfn_pointwise2Bias( t0 );
    t0 = this.pfn_pointwise2Activation( t1 );

    // Skip connection.
    t1 = tf.add( inputTensor, t0 );
    t0.dispose();

    // The inputTensor is kept (not disposed).

    return t1;
  }

  /** The input will be added to output for achieving skip connection. The inputTensor will be disposed. */
  static apply_and_destroy_AddInputToOutput( inputTensor ) {
//!!! (2021/01/08 Remarked) Use this.XXX() should be enough.
//    let t = Base.apply_and_keep_AddInputToOutput.call( this, inputTensor );
    let t = this.apply_and_keep_AddInputToOutput( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** The input will not be added to output (i.e. no residual connection). */
  static apply_and_destroy_or_keep_NoSkipConnection( inputTensor ) {
    let t0, t1;

    // The first 1x1 pointwise convolution.
    t0 = this.pfn_pointwise1Conv( inputTensor );
    t1 = this.pfn_pointwise1Bias( t0 );
    t0 = this.pfn_pointwise1Activation( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperation( t0 );
    t0 = this.pfn_depthwiseBias( t1 );
    t1 = this.pfn_depthwiseActivation( t0 );

    // The second 1x1 pointwise convolution.
    t0 = this.pfn_pointwise2Conv( t1 );
    t1 = this.pfn_pointwise2Bias( t0 );
    t0 = this.pfn_pointwise2Activation( t1 );

    return t0;
  }

//!!! ...unfinished...

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {

//     // If vocabulary table tensor does not exist (so that apply_and_destroy_or_keep() will just return output as input).
//     //
//     // (e.g. channelMultiplier is zero or negative, or ( ( channelMultiplier == 1 ) && ( bEmbedVocabularyId ) ) )
//     if ( null == this.vocabularyTableShape_toExtract ) {

//       // The vocabulary tables (from initer()'s inputFloat32Array) should always exist.
//       if ( this.vocabularyTables )
//         if ( this.vocabularyTables[ this.params.inChannels - 1 ] )
//           if ( this.vocabularyTables[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table should be valid.
//             return true;

//     // If vocabulary table tensor exists. (e.g. channelMultiplier is positive and ( bEmbedVocabularyId == false )).
//     } else {

//       // The tensor2d (or tensor3d) of vocabulary tables should exists.
//       if ( this.vocabularyTablesTensorArray )
//         if ( this.vocabularyTablesTensorArray[ this.params.inChannels - 1 ] )  // the last vocabulary table should be valid.
//             return true;

//       // Or, the one merged longer tensor2d of vocabulary table (and channel value offset tensor3d) should exists.
//       if ( ( this.vocabularyTableTensor2d ) && ( this.channelValueOffsetTensor3d ) )
//         return true;
//     }

    return false;
  }

  get byteOffsetBegin()   { return this.params.defaultByteOffsetBegin; }

//!!! ...unfinished...
  get byteOffsetEnd()     { return this.vocabularyTables[ this.params.inChannels - 1 ].defaultByteOffsetEnd; }

//!!! ...unfinished...
  get inChannels()        { return this.params.inChannels; }
  get channelMultiplier() { return this.params.channelMultiplier; }
//  get outChannels()       { return this.params.outChannels; }
  get outChannels() { return this.channelCount_pointwise2After; }
}
