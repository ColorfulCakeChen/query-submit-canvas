export { Params, Base };

import * as ValueMax from "../ValueMax.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone from "./ReturnOrClone.js";

/**
 * Pointwise-depthwise-pointwise convolution layer parameters.
 */
class Params extends Weights.Params {

  /**
   * If parameter's value is null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
    bAddInputToOutput,
  ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
      [ Params.pointwise1ChannelCount,                pointwise1ChannelCount ],
      [ Params.bPointwise1Bias,                       bPointwise1Bias ],
      [ Params.pointwise1ActivationId,                pointwise1ActivationId ],
      [ Params.depthwise_AvgMax_Or_ChannelMultiplier, depthwise_AvgMax_Or_ChannelMultiplier ],
      [ Params.depthwiseFilterHeight,                 depthwiseFilterHeight ],
      [ Params.depthwiseStridesPad,                   depthwiseStridesPad ],
      [ Params.bDepthwiseBias,                        bDepthwiseBias ],
      [ Params.depthwiseActivationId,                 depthwiseActivationId ],
      [ Params.pointwise2ChannelCount,                pointwise2ChannelCount ],
      [ Params.bPointwise2Bias,                       bPointwise2Bias ],
      [ Params.pointwise2ActivationId,                pointwise2ActivationId ],
      [ Params.bAddInputToOutput,                     bAddInputToOutput ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  get pointwise1ChannelCount()                { return this.parameterMapModified.get( Params.pointwise1ChannelCount ); }
  get bPointwise1Bias()                       { return this.parameterMapModified.get( Params.bPointwise1Bias ); }
  get pointwise1ActivationId()                { return this.parameterMapModified.get( Params.pointwise1ActivationId ); }
  get pointwise1ActivationName() {
    return Params.pointwise1ActivationId.valueDesc.integerToNameMap.get( this.pointwise1ActivationId );
  }

  /** @return {number} The number version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier() { return this.parameterMapModified.get( Params.depthwise_AvgMax_Or_ChannelMultiplier ); }

  /** @return {string} The string version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier_Name() {
    let integerValue = this.depthwise_AvgMax_Or_ChannelMultiplier;

    // Look up whether has name (e.g. "AVG", "MAX", "NONE").
    let name = Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.integerToNameMap.get( integerValue );
    if ( null == name ) { // No name means it represents channel multiplier number.
      name = integerValue.toString(); // e.g. "1", "2", ..., "64"
    }

    return name;
  }

  get depthwiseFilterHeight()                 { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get depthwiseStridesPad()                   { return this.parameterMapModified.get( Params.depthwiseStridesPad ); }
  get bDepthwiseBias()                        { return this.parameterMapModified.get( Params.bDepthwiseBias ); }
  get depthwiseActivationId()                 { return this.parameterMapModified.get( Params.depthwiseActivationId ); }
  get depthwiseActivationName() {
    return Params.depthwiseActivationId.valueDesc.integerToNameMap.get( this.depthwiseActivationId );
  }

  get pointwise2ChannelCount()                { return this.parameterMapModified.get( Params.pointwise2ChannelCount ); }
  get bPointwise2Bias()                       { return this.parameterMapModified.get( Params.bPointwise2Bias ); }
  get pointwise2ActivationId()                { return this.parameterMapModified.get( Params.pointwise2ActivationId ); }
  get pointwise2ActivationName() {
    return Params.pointwise2ActivationId.valueDesc.integerToNameMap.get( this.pointwise2ActivationId );
  }

  get bAddInputToOutput()                     { return this.parameterMapModified.get( Params.bAddInputToOutput ); }
}


// Define parameter descriptions.

Params.pointwise1ChannelCount = new ParamDesc.Int(                "pointwise1ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise1Bias =        new ParamDesc.Bool(               "bPointwise1Bias" );
Params.pointwise1ActivationId = new ParamDesc.ActivationFunction( "pointwise1ActivationId" );

/** Define depthwise operation's id, range, name.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -1: average pooling. (AVG)
 *   - -2: maximum pooling. (MAX)
 *   -  0: no depthwise operation. (NONE)
 *   - [ 1, 32 ]: depthwise convolution with channel multiplier between 1 and 32 (inclusive).
 */
Params.depthwise_AvgMax_Or_ChannelMultiplier
  = new ParamDesc.Base( "depthwise_AvgMax_Or_ChannelMultiplier", new ValueDesc.Int( -2, 32, [ "AVG", "MAX", "NONE" ] ) );

/** Define suitable value for depthwise convolution filter size.
 *
 * At least 1, because depthwise filter size ( 0 * 0 ) is meaningless.
 *
 * For avg pooling or max pooling, it is less meaningful if filter size is ( 1 * 1 ) because the result will be the same as input.
 * For depthwise convolution, it is meaningful if filter size is ( 1 * 1 ) because they could be used as simple channel multiplier.
 *
 * Avoid too large filter size. Otherwise, performance may be poor.
 */
Params.depthwiseFilterHeight =  new ParamDesc.Int( "depthwiseFilterHeight", 1, 9 );

/** Define suitable value for depthwise convolution strides and pad. Integer between [ 0, 2 ]. */
Params.depthwiseStridesPad =    new ParamDesc.Int( "depthwiseStridesPad",   0, 2 );

Params.bDepthwiseBias =         new ParamDesc.Bool(               "bDepthwiseBias" );
Params.depthwiseActivationId =  new ParamDesc.ActivationFunction( "depthwiseActivationId" );

Params.pointwise2ChannelCount = new ParamDesc.Int(                "pointwise2ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise2Bias =        new ParamDesc.Bool(               "bPointwise2Bias" );
Params.pointwise2ActivationId = new ParamDesc.ActivationFunction( "pointwise2ActivationId" );

Params.bAddInputToOutput =      new ParamDesc.Bool("bAddInputToOutput");


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
 * @member {boolean} bPointwise1
 *   If true, the first pointwise convolution exist.
 *
 * @member {boolean} bDepthwise
 *   If true, the depthwise convolution (or average pooling, or maximum pooling) exist.
 *
 * @member {boolean} bDepthwiseAvg
 *   If true, the depthwise average pooling exist.
 *
 * @member {boolean} bDepthwiseMax
 *   If true, the depthwise maximum pooling exist.
 *
 * @member {boolean} bDepthwiseConv
 *   If true, the depthwise convolution exist.
 *
 * @member {boolean} bPointwise2
 *   If true, the second pointwise convolution exist.
 *
 * @member {number} inChannels
 *   Input channel count. This is the same as this.channelCount_pointwise1Before (from initer()).
 *
 * @member {number} outChannels
 *   The output channel count after these three convolutions. It is the same as this.channelCount_pointwise2After (from initer()).
 *
 * @member {number} channelCount_pointwise1After_depthwiseBefore
 *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals pointwise1ChannelCount.
 * If ( pointwise1ChannelCount <= 0 ), it equals inChannels.
 *
 * @member {number} channelCount_depthwiseAfter_pointwise2Before
 *   The channel count after the NxN depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 * ( channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier ). If
 * Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG (-2) or Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX (-1)
 * or Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE (0), it equals channelCount_pointwise1After_depthwiseBefore.
 *
 * @member {number} channelCount_pointwise2After
 *   The channel count after the second 1x1 pointwise convolution. If ( pointwise2ChannelCount > 0 ), it equals pointwise2ChannelCount.
 * If ( pointwise2ChannelCount <= 0 ), it equals channelCount_depthwiseAfter_pointwise2Before.
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has a parameter inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which will be processed.
 * It returns a new tf.tensor3d. All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method
 * calls one of apply_and_destroy_AddInputToOutput(), apply_and_keep_AddInputToOutput(), apply_and_destroy_or_keep_NoSkipConnection(),
 * return_input_directly(), keep_input_return_copy() according to the initer()'s parameters.
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
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} channelCount_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s input image. This should always be specified and can not be null
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *

//!!! ...unfinished... If negative, the channel count will be the same as input channel count (i.e. equal to channelCount_pointwise1Before).
// And will be added with the input if it is the last layer of this PointDepthPoint.
//
//!!! ...unfinished... What if ( depthwiseStrides != 1 ) or ( depthwisePad != "same" ) ?

   * @param {number} pointwise1ChannelCount
   *   The output channel count of the first pointwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If 0 or negative, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bPointwise1Bias
   *   If true, there will be a bias after pointwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( pointwise1ChannelCount <= 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise1ActivationId
   *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution. If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution). If ( pointwise1ChannelCount <= 0 ), this activation function will also be ignored.
   *
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If null, it will be extracted from inputFloat32Array (i.e. by evolution). If non-null, it should be
   * integer between [ -2, 64 ]:
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG (-2): average pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX (-1): max pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE (0): there will be no depthwise operation.
   *   - positive integer between [ 1, 64 ]: depthwise convolution and the number indicates channel multiplier.
   *
   * @param {number} depthwiseFilterHeight
   *   The height (and width) of depthwise convolution's filter. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( depthwise_AvgMax_Or_ChannelMultiplier <= 0 ), this will also be ignored.
   *
   * @param {number} depthwiseStridesPad
   *   The strides and padding of depthwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( depthwise_AvgMax_Or_ChannelMultiplier <= 0 ), this depthwiseStridesPad will also be ignored. It has three possible value:
   *   - 0: means ( depthwiseStrides == 1 ) and ( depthwisePad == "valid" )
   *   - 1: means ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )
   *   - 2: means ( depthwiseStrides == 2 ) and ( depthwisePad == "same" )
   * Default is 1 because ( depthwiseStrides == 1 ) and ( depthwisePad == "same" ) is a pre-condition for ( bAddInputToOutput == true ).
   *
   * @param {boolean} bDepthwiseBias
   *   If null, it will be extracted from inputFloat32Array (i.e. by evolution). If true, there will be a bias after depthwise convolution.
   * If ( depthwise_AvgMax_Or_ChannelMultiplier <= 0 ), this bias will also be ignored.
   *
   * @param {string} depthwiseActivationId
   *   The activation function id (Params.depthwiseActivationId.Ids.Xxx) after depthwise convolution. If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier <= 0 ), this activation function will also be ignored.
   *
   * @param {number} pointwise2ChannelCount
   *   The output channel count of the second pointwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If 0 or negative, there will be no pointwise convolution after depthwise convolution.
   *
   * @param {boolean} bPointwise2Bias
   *   If true, there will be a bias after the second pointwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by
   * evolution). If ( pointwise2ChannelCount <= 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise2ActivationId
   *   The activation function id (Params.pointwise2ActivationId.Ids.Xxx) after the second pointwise convolution. If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution). If ( pointwise2ChannelCount <= 0 ), this activation function will also be ignored.
   *
   * @param {boolean} bAddInputToOutput
   *   If null, it will be extracted from inputFloat32Array (i.e. by evolution). If true and ( depthwiseStridesPad == 1 ) ( i.e.
   * ( depthwiseStrides == 1 ) and ( depthwisePad == "same" ) ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ),
   * the inputTensor will be added to the output in apply_and_destroy(). This could achieve the residual connection of MobileNetV2.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be viewed as falsy
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
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
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
    bAddInputToOutput,
    bKeepInputTensor
  ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputFloat32Array.
      + 1  // for extracting pointwise1 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting depthwise filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting pointwise2 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for all pointwise1-depthwise-pointwise2 filters (and biases) ready.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

    this.disposeTensors();  // Also initialize some member function pointers to no_operation().

    this.nextByteOffsetBegin = byteOffsetBegin;
    this.channelCount_pointwise1Before = channelCount_pointwise1Before;

    // 1. Extract parameters.
    this.params = new Params();
    let bParamsInitOk
      = this.params.init( inputFloat32Array, byteOffsetBegin,
          pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
          pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
          bAddInputToOutput );

    if ( !bParamsInitOk )
      return false;  // e.g. input array does not have enough data.

    this.nextByteOffsetBegin = this.params.defaultByteOffsetEnd;

    // Get parameters' real (adjusted) values.
    {
      pointwise1ChannelCount = this.pointwise1ChannelCount;
      bPointwise1Bias = this.bPointwise1Bias;
      pointwise1ActivationId = this.pointwise1ActivationId;

      depthwise_AvgMax_Or_ChannelMultiplier = this.depthwise_AvgMax_Or_ChannelMultiplier;
      depthwiseFilterHeight = this.depthwiseFilterHeight;
      depthwiseStridesPad = this.depthwiseStridesPad;
      bDepthwiseBias = this.bDepthwiseBias;
      depthwiseActivationId = this.depthwiseActivationId;

      pointwise2ChannelCount = this.pointwise2ChannelCount;
      bPointwise2Bias = this.bPointwise2Bias;
      pointwise2ActivationId = this.pointwise2ActivationId;

      bAddInputToOutput = this.bAddInputToOutput;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. The first 1x1 pointwise convolution.
    this.bPointwise1 = ( pointwise1ChannelCount > 0 );
    this.pointwise1ActivationFunction = Base.getActivationFunction( pointwise1ActivationId );

    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = pointwise1ChannelCount;

      //this.pointwise1FilterHeightWidth = [ 1, 1 ];
      this.pointwise1FiltersShape =      [ 1, 1, this.channelCount_pointwise1Before, this.channelCount_pointwise1After_depthwiseBefore ];
      this.pointwise1BiasesShape =       [ 1, 1, this.channelCount_pointwise1After_depthwiseBefore ];

      this.pointwise1FiltersWeights = new Weights.Base();
      if ( !this.pointwise1FiltersWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.pointwise1FiltersShape ) )
        return false;  // e.g. input array does not have enough data.

      this.nextByteOffsetBegin = this.pointwise1FiltersWeights.defaultByteOffsetEnd;

      this.pointwise1FiltersTensor4d = tf.tensor4d( this.pointwise1FiltersWeights.weights, this.pointwise1FiltersShape );
      this.pfn_pointwise1Conv = Base.pointwise1Conv_and_destroy; // will dispose inputTensor.

      if ( bPointwise1Bias ) {
        this.pointwise1BiasesWeights = new Weights.Base();
        if ( !this.pointwise1BiasesWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.pointwise1BiasesShape ) )
          return false;  // e.g. input array does not have enough data.

        this.nextByteOffsetBegin = this.pointwise1BiasesWeights.defaultByteOffsetEnd;

        this.pointwise1BiasesTensor3d = tf.tensor3d( this.pointwise1BiasesWeights.weights, this.pointwise1BiasesShape );
        this.pfn_pointwise1Bias = Base.pointwise1Bias_and_destroy;
      }

      if ( this.pointwise1ActivationFunction )
        this.pfn_pointwise1Activation = Base.pointwise1Activation_and_destroy;

    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount_pointwise1Before;  // No first 1x1 pointwise convolution.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.

    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false;               // Assume no depthwise.
    this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // So no channel multiplier.

    let depthwiseFilterWidth = this.depthwiseFilterWidth = depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.

    if ( depthwise_AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling, or 1x1 MAX pooling, or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == true ) )
      //   - Just return input (i.e. ( this.pfn_depthwiseOperation == Base.return_input_directly ) )

      if ( ( 1 == depthwiseFilterHeight ) && ( 1 == depthwiseFilterWidth ) ) {
        // Do nothing, because the result of 1x1 AVG or MAX pooling is just the same as input.
      } else {
        switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
          case Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG:
            this.bDepthwise = this.bDepthwiseAvg = true;
            this.pfn_depthwiseOperation = Base.depthwiseAvg_and_destroy;
            break;

          case Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX:
            this.bDepthwise = this.bDepthwiseMax = true;
            this.pfn_depthwiseOperation = Base.depthwiseMax_and_destroy;
            break;
        }
      }

    } else {
      if ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
        this.bDepthwise = this.bDepthwiseConv = true;

        this.channelCount_depthwiseAfter_pointwise2Before
          = this.channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ depthwiseFilterHeight, depthwiseFilterWidth,
              this.channelCount_pointwise1After_depthwiseBefore, depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersWeights = new Weights.Base();
        if ( !this.depthwiseFiltersWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.depthwiseFiltersShape ) )
          return false;  // e.g. input array does not have enough data.

        this.nextByteOffsetBegin = this.depthwiseFiltersWeights.defaultByteOffsetEnd;

        this.depthwiseFiltersTensor4d = tf.tensor4d( this.depthwiseFiltersWeights.weights, this.depthwiseFiltersShape );
        this.pfn_depthwiseOperation = Base.depthwiseConv_and_destroy; // will dispose inputTensor.

      } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      }
    }

    switch ( depthwiseStridesPad ) {
      case 0:  this.depthwiseStrides = 1; this.depthwisePad = "valid"; break;
      default:
      case 1:  this.depthwiseStrides = 1; this.depthwisePad = "same";  break;
      case 2:  this.depthwiseStrides = 2; this.depthwisePad = "same";  break;
    }

    this.depthwiseActivationFunction = Base.getActivationFunction( depthwiseActivationId );

    this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before ];

    if ( this.bDepthwise ) {

      if ( bDepthwiseBias ) {
        this.depthwiseBiasesWeights = new Weights.Base();
        if ( !this.depthwiseBiasesWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.depthwiseBiasesShape ) )
          return false;  // e.g. input array does not have enough data.

        this.nextByteOffsetBegin = this.depthwiseBiasesWeights.defaultByteOffsetEnd;

        this.depthwiseBiasesTensor3d = tf.tensor3d( this.depthwiseBiasesWeights.weights, this.depthwiseBiasesShape );
        this.pfn_depthwiseBias = Base.depthwiseBias_and_destroy;
      }

      if ( this.depthwiseActivationFunction )
        this.pfn_depthwiseActivation = Base.depthwiseActivation_and_destroy;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. The second 1x1 pointwise convolution.
    this.bPointwise2 = ( pointwise2ChannelCount > 0 );
    this.pointwise2ActivationFunction = Base.getActivationFunction( pointwise2ActivationId );

    if ( this.bPointwise2 ) {
      this.channelCount_pointwise2After = pointwise2ChannelCount;

      //this.pointwise2FilterHeightWidth = [ 1, 1 ];
      this.pointwise2FiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before, this.channelCount_pointwise2After ];
      this.pointwise2BiasesShape =       [ 1, 1, this.channelCount_pointwise2After ];

      this.pointwise2FiltersWeights = new Weights.Base();
      if ( !this.pointwise2FiltersWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.pointwise2FiltersShape ) )
        return false;  // e.g. input array does not have enough data.

      this.nextByteOffsetBegin = this.pointwise2FiltersWeights.defaultByteOffsetEnd;

      this.pointwise2FiltersTensor4d = tf.tensor4d( this.pointwise2FiltersWeights.weights, this.pointwise2FiltersShape );
      this.pfn_pointwise2Conv = Base.pointwise2Conv_and_destroy; // will dispose inputTensor.

      if ( bPointwise2Bias ) {
        this.pointwise2BiasesWeights = new Weights.Base();
        if ( !this.pointwise2BiasesWeights.init( inputFloat32Array, this.nextByteOffsetBegin, null, 0, this.pointwise2BiasesShape ) )
          return false;  // e.g. input array does not have enough data.

        this.nextByteOffsetBegin = this.pointwise2BiasesWeights.defaultByteOffsetEnd;

        this.pointwise2BiasesTensor3d = tf.tensor3d( this.pointwise2BiasesWeights.weights, this.pointwise2BiasesShape );
        this.pfn_pointwise2Bias = Base.pointwise2Bias_and_destroy;
      }

      if ( this.pointwise2ActivationFunction )
        this.pfn_pointwise2Activation = Base.pointwise2Activation_and_destroy;

    } else {
      this.channelCount_pointwise2After = this.channelCount_depthwiseAfter_pointwise2Before;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 5. Configure correct function pointers according to whether keeping or destroying input tensor.
    this.bKeepInputTensor = bKeepInputTensor;

    // Although caller could request add-input-to-output, it may or may not doable.
    // Only if the dimension of output is the same as the dimension of input, it is possible to add-input-to-output.
    //
    // Only if stride is "1" and pad is "same", the dimension 0 (height) and 1 (width) of the output will be the same as input.
    // Only if output channel is equals to input channel, the dimension 2 (channel) of the output will be the same as input.
    //
    // For example:
    //   - if MobileNetV2 and not step 0, should not destroy input tensor so that can add input to output.
    //   - However, even if MobileNetV2, only if not setp 0 (whose strides == 2) of a block can add input to output.
    let bShouldAddInputToOutput = this.bShouldAddInputToOutput
     = (   ( bAddInputToOutput )
        && (   ( this.depthwiseStrides == 1 )
            && ( this.depthwisePad == "same" )
            && ( channelCount_pointwise1Before == this.channelCount_pointwise2After )
           )
       );

    // Determine which apply_Xxx() function should be used.
    //
    // This should be done before adjusting the first operation from "Xxx_destroy" to "Xxx_keep",
    // because the adjustment might also need to select different apply_Xxx() function.
    if ( bShouldAddInputToOutput ) {

      if ( bKeepInputTensor )
        this.apply_and_destroy_or_keep = Base.apply_and_keep_AddInputToOutput;    // will NOT dispose inputTensor.
      else
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_AddInputToOutput; // will dispose inputTensor.

    } else {
      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_NoSkipConnection; // will or will NOT dispose inputTensor.
    }

    // If:
    //   - caller request keep-input, or
    //   - caller request add-input-to-output, and some criteria matched.
    // Then:
    //   - change the first operation from "Xxx_destroy" to "Xxx_keep".
    //   - change the total operation if no first operation exists.
    //
    if ( ( bKeepInputTensor ) || ( bShouldAddInputToOutput ) ) {

      // Find out the first existed operation. Change it to "Xxx_keep" version. So that the
      // apply_and_destroy_or_keep()'s input tensor will not be destroy and can be added to output.
      if ( this.bPointwise1 ) {
        this.pfn_pointwise1Conv = Base.pointwise1Conv_and_keep; // will NOT dispose inputTensor.

      } else if ( this.bDepthwise ) {
        switch ( this.pfn_depthwiseOperation ) {

//!!! ...unfinished... if there are Base.depthwiseBias_and_keep and Base.depthwiseActivation_and_keep,
//              could keep ( this.pfn_depthwiseOperation == Base.return_input_directly )
//
//               this.pfn_depthwiseBias = Base.depthwiseBias_and_???destroy;
//               this.pfn_depthwiseActivation = Base.depthwiseActivation_and_???destroy;
//
          // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
          case Base.return_input_directly:     this.pfn_depthwiseOperation = Base.keep_input_return_copy; break;

          case Base.depthwiseAvg_and_destroy:  this.pfn_depthwiseOperation = Base.depthwiseAvg_and_keep;  break;
          case Base.depthwiseMax_and_destroy:  this.pfn_depthwiseOperation = Base.depthwiseMax_and_keep;  break;
          case Base.depthwiseConv_and_destroy: this.pfn_depthwiseOperation = Base.depthwiseConv_and_keep; break;

          // Just clone input if unknown depthwise operation.
          default:                             this.pfn_depthwiseOperation = Base.keep_input_return_copy;
            tf.util.assert( false, `Unknown depthwise operation. (${this.pfn_depthwiseOperation})` );
            break;
        }

      } else if ( this.bPointwise2 ) {
        this.pfn_pointwise2Conv = Base.pointwise2Conv_and_keep; // will NOT dispose inputTensor.

      } else {

        // Since there is no operation at all (i.e. no pointwise1, no depthwise, no pointwise2), let's forget
        // add-input-to-output (because it is not meaningful in this case). Just according to whether needs
        // keep-input, change the total operation to return input directly or return clone of input directly.
        if ( bKeepInputTensor ) {
          this.apply_and_destroy_or_keep = Base.keep_input_return_copy;
        } else {
          this.apply_and_destroy_or_keep = Base.return_input_directly;
        }

      }

    } else {
      // Since it is not required to keep-input and not possible to add-input-to-output, it is not necessary to
      // use "Xxx_keep" operation. Using "Xxx_destroy" operation is sufficient.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // All pointwise1-depthwise-pointwise2 filters was ready. Report progress.

    this.bInitOk = true;
    return true;
  }

  /**
   * Initialize this object by calling initer() and advance the generator by loop until done.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   If null, a temporary progress object will be created.
   *
   * @return {boolean}
   *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
   *   Return false if failed (and progressParent.valuePercentage will be less than 100).
   */
  init(
    progressParent,
    inputFloat32Array, byteOffsetBegin,
    channelCount_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
    bAddInputToOutput,
    bKeepInputTensor
  ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer(
      progressParent,
      inputFloat32Array, byteOffsetBegin,
      channelCount_pointwise1Before,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
      bAddInputToOutput,
      bKeepInputTensor
    );

    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
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
    this.pfn_pointwise2Conv =     this.pfn_pointwise2Bias = this.pfn_pointwise2Activation = Base.return_input_directly;

    this.params
      = this.pointwise1FiltersWeights = this.pointwise1BiasesWeights
      = this.depthwiseFiltersWeights = this.depthwiseBiasesWeights
      = this.pointwise2FiltersWeights = this.pointwise2BiasesWeights
      = null;

    this.bInitOk = false;
    this.nextByteOffsetBegin = -1; // Record where to extract next weights. Only meaningful when ( this.bInitOk == true ).
  }

  /** Convert activation function id to function object. */
  static getActivationFunction( nActivationId ) {
    let pfn = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    return pfn;
  }

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
    let t = Base.apply_and_keep_AddInputToOutput.call( this, inputTensor );
//!!! (2021/03/07 Remarked) static method can not be called by this.XXX().
//    let t = this.apply_and_keep_AddInputToOutput( inputTensor );
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

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {
    return this.bInitOk;
  }

  get byteOffsetBegin()                       { return this.params.defaultByteOffsetBegin; }

  /** Where to extract next weights. Only meaningful when ( this.isValid() == true ). */
  get byteOffsetEnd()                         { return this.nextByteOffsetBegin; }

  get pointwise1ChannelCount()                { return this.params.pointwise1ChannelCount; }
  get bPointwise1Bias()                       { return this.params.bPointwise1Bias; }
  get pointwise1ActivationId()                { return this.params.pointwise1ActivationId; }
  get pointwise1ActivationName()              { return this.params.pointwise1ActivationName; }

  /** @return {number} The number version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier() { return this.params.depthwise_AvgMax_Or_ChannelMultiplier; }

  /** @return {string} The string version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier_Name() { return this.params.depthwise_AvgMax_Or_ChannelMultiplier_Name; }
  
  get depthwiseFilterHeight()                 { return this.params.depthwiseFilterHeight; }
  get depthwiseStridesPad()                   { return this.params.depthwiseStridesPad; }
  get bDepthwiseBias()                        { return this.params.bDepthwiseBias; }
  get depthwiseActivationId()                 { return this.params.depthwiseActivationId; }
  get depthwiseActivationName()               { return this.params.depthwiseActivationName; }

  get pointwise2ChannelCount()                { return this.params.pointwise2ChannelCount; }
  get bPointwise2Bias()                       { return this.params.bPointwise2Bias; }
  get pointwise2ActivationId()                { return this.params.pointwise2ActivationId; }
  get pointwise2ActivationName()              { return this.params.pointwise2ActivationName; }

  get bAddInputToOutput()                     { return this.params.bAddInputToOutput; }

  get inChannels()                            { return this.channelCount_pointwise1Before; }
  get outChannels()                           { return this.channelCount_pointwise2After; }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${this.bPointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPad}, `
      + `bDepthwiseBias=${this.bDepthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}, `

      + `pointwise2ChannelCount=${this.pointwise2ChannelCount}, `
      + `bPointwise2Bias=${this.bPointwise2Bias}, `
      + `pointwise2ActivationName=${this.pointwise2ActivationName}, `

      + `bAddInputToOutput=${this.bAddInputToOutput}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}
