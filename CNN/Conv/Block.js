export { Base, PointDepthPoint };

import * as ValueMax from "../ValueMax.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as ReturnOrClone from "./ReturnOrClone.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Convolution block parameters.
 */
class Params extends Weights.Params {

  /**
   * If a parameter's value is null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin,

    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierStep0, bBias, nActivationId, nActivationIdAtBlockEnd,

//!!! ...unfinished...
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

//!!! ...unfinished...
//     sourceHeight, sourceWidth, sourceChannelCount,
//     stepCountPerBlock,
//     bChannelShuffler,
//     pointwise1ChannelCountRate,
//     strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierStep0, bBias, nActivationId, nActivationIdAtBlockEnd,

Params.sourceHeight =               new ParamDesc.Int(                "sourceHeight",       1, ( 10 * 1024 ) );
Params.sourceWidth =                new ParamDesc.Int(                "sourceWidth",        1, ( 10 * 1024 ) );
Params.sourceChannelCount =         new ParamDesc.Int(                "sourceChannelCount", 1, ( 10 * 1024 ) );
Params.stepCountPerBlock =          new ParamDesc.Int(                "stepCountPerBlock",  0, ( 10 * 1024 ) );
Params.bChannelShuffler =           new ParamDesc.Bool(               "bChannelShuffler" );

Params.pointwise1ChannelCountRate = new ParamDesc.Int(        "pointwise1ChannelCountRate", 1, 2 );

Params.bBias =                      new ParamDesc.Bool(               "bBias" );
Params.nActivationId =              new ParamDesc.ActivationFunction( "nActivationId" );
Params.nActivationIdAtBlockEnd =    new ParamDesc.ActivationFunction( "nActivationIdAtBlockEnd" );


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
 * Implement a block of ( depthwise convolution and pointwise convolution ) or ShuffleNetV2 (with 2 output channel groups) or MobileNetV1
 * or MobileNetV2.
 *
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has an parameter inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which
 * will be processed. It returns a new tf.tensor3d. All other tensors will be disposed. But inputTensor could be kept
 * (if ( bKeepInputTensor == true ) ) or disposed (if ( bKeepInputTensor == false ) ). In fact, this method calls one of
 * apply_and_destroy_or_keep_NotChannelShuffle_NotAddInputToOutput(), apply_and_destroy_or_keep_ChannelShuffle(),
 * apply_and_destroy_or_keep_AddInputToOutput() according to the init()'s parameters.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this block's last step.
 *
 * @member {PointDepthPoint.Base} step0
 *   The first step computation of this block.
 *
 * @member {PointDepthPoint.Base} stepLast
 *   The last step computation of this block. It may be the same as this.step0 when there is only one step inside this block.
 *
 * @see ChannelShuffler.ConcatPointwiseConv
 */
class Base {

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
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply_and_destroy_or_keep().
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply_and_destroy_or_keep().
   *
   * @param {number} sourceChannelCount
   *   The channel count of the source image. It may be the output channel count of the previous convolution block, so it could be large.
   *
   * @param {number} stepCountPerBlock
   *   If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) for shrinking sourceHeight
   * (minus ( filterHeight - 1 )). If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   * (halve height x width) and use ( stepCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until the block end.
   *
   * @param {boolean} bChannelShuffler
   *   If true, will like ShuffleNetV2 (i.e. split and concat channels). If false, will like MobileNetV1 or MobileNetV2 (i.e. add input to output).
   * If ( stepCountPerBlock <= 0 ), this flag will be ignored.
   *
   * @param {number} pointwise1ChannelCountRate
   *   The first 1x1 pointwise convolution output channel count over of the second 1x1 pointwise convolution output channel count.
   * That is, pointwise1ChannelCount = ( pointwise2ChannelCount * pointwise1ChannelCountRate ).
   *   - If ( stepCountPerBlock <= 0 ), this rate will be ignored because there will be no first 1x1 pointwise.
   *   - If ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 1 ), will like ShuffleNetV2.
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will like MobileNetV1.
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate > 1 ), will like MobileNetV2.
   *

//!!! ...unfinished...

   * @param strAvgMaxConv
   *   Depthwise operation. "Avg" or "Max" or "Conv" for average pooling, max pooling, depthwise convolution.
   *

//!!! ...unfinished...

   * @param {number} depthwiseChannelMultiplierStep0
   *   The depthwise convolution of the first step (Step 0) will expand input channel by this factor.
   *
   * @param {boolean} bBias
   *   If true, there will be a bias after every convolution.
   *
   * @param {string} nActivationId
   *   The activation function id (PointDepthPoint.Params.Activation.Ids.Xxx) after the convolution. If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {string} nActivationIdAtBlockEnd
   *   The activation function id (PointDepthPoint.Params.Activation.Ids.Xxx) after the convolution of the last PointDepthPoint's
   * pointwise2ActivationId of this block. If the output of this block needs to be any arbitrary value, it is recommended
   * not to use activation at the end of this block (i.e. nActivationIdAtBlockEnd == PointDepthPoint.Params.Activation.Ids.NONE) so that
   * it will not be restricted by the range of the activation function.
   *
//!!! ...unfinished...
//!!! ...unfinished... (2021/04/09) How to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1)?
          // Since pointwise2ActivationId is always NONE in MobileNetV2 (i.e. ( bChannelShuffler == false ), the nActivationIdAtBlockEnd is never used in MobileNetV2.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). If it is null, it will be viewed as falsy
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   * @see PointDepthPoint.Base.init()
   */
  * initer(
    progressParent,
    inputFloat32Array, byteOffsetBegin,

//!!! ...unfinished...
    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierStep0, bBias, nActivationId, nActivationIdAtBlockEnd,
    bKeepInputTensor
  ) {

    // 0. Prepare

//!!! ...unfinished...
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


    this.disposeTensors();

    // Both MobileNetV3 and ShuffleNetV2:
    //   - They all do not use (depthwise convolution) channelMultiplier.
    //   - They all use 1x1 (pointwise) convolution to expand channel count.
    //   - They all use 1x1 (pointwise) convolution before depthwise convolution.
    //   - They all do not use activation function after depthwise convolution.
    //   - They all use depthwise convolution with ( pad = "same").
    //   - They all use depthwise convolution with ( strides = 2 ) for shrinking (halving) height x weight.
    //   - They all do not use bias after pointwise and depthwise convolution.
    //
    // Inisde one of their block, three convolutions are used:
    //   A) 1x1 (pointwise) convolution, with activation.
    //   B) depthwise convolution, without activation.
    //   C) 1x1 (pointwise) convolution, (ShuffleNetV2) with or (MobileNetV2) without activation.
    //
    // In MobileNetV3, convolution A expands channel count (with activation), convolution C shrinks channel count (without activation).
    // It may use squeeze-and-excitation after convolution B (without activation). When there is necessary to increase output channel
    // count (usually in step 0 of a block), the convolution C is responsible for this.
    //
    // In ShuffleNetV2, convolution A (with activation), convolution B (without activation) and convolution C (with activation) never
    // change channel count. When there is necessary to increase output channel count (usually in step 0 of a block), it expands channel
    // count by concatenating two shrinked (halven) height x weight.
    //

    this.stepCountPerBlock = stepCountPerBlock;
    this.bChannelShuffler = bChannelShuffler;
    this.pointwise1ChannelCountRate = pointwise1ChannelCountRate;
    this.bKeepInputTensor = bKeepInputTensor;

    this.bAddInputToOutput = !bChannelShuffler; // ChannelShuffler or AddInputToOutput, but not both. They are all for achieving skip connection.

    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;

    this.strAvgMaxConv = strAvgMaxConv;

    let depthwiseFilterWidth =   depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth =  depthwiseFilterWidth;

    this.depthwiseChannelMultiplierStep0 = depthwiseChannelMultiplierStep0;

    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nActivationIdAtBlockEnd = nActivationIdAtBlockEnd;

    let pointwise1Bias = bBias;
    let pointwise1ActivationId = nActivationId;
    let depthwiseBias = bBias;
    let depthwiseActivationId = nActivationId;
    let pointwise2Bias = bBias;
    let pointwise2ActivationId = nActivationId;

    if ( stepCountPerBlock <= 0 ) {  // Not ShuffleNetV2, Not MobileNetV2.

      // Only one step (i.e. step 0 ) for depthwise operation with ( strides = 1, pad = "valid" )
      // for shrinking sourceHeight (minus ( filterHeight - 1 )).

      let pointwise1ChannelCount = 0; // no pointwise convolution before depthwise convolution.
      let pointwise2ChannelCount;

//!!! ...unfinished... (2021/04/09) What if ( depthwiseChannelMultiplierStep0 == 0 )? The image will not be halven.
      let depthwise_AvgMax_Or_ChannelMultiplier;
      if ( strAvgMaxConv == "Conv" ) { // Depthwise convolution.
        depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        pointwise2ChannelCount = sourceChannelCount * depthwiseChannelMultiplierStep0;
      } else {
//!!! ...unfinished... (2021/03/10) should become all number?
        depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".
        pointwise2ChannelCount = sourceChannelCount;           // The output channel count of average (or max) pooling is the same as input channel count.
      }

      let depthwiseStridesPad = 0; // ( depthwiseStrides == 1 ) and ( depthwisePad == "valid" ) so that shrinking sourceHeight a little.

      // This is the last step of this block (i.e. at-block-end) because ( stepCountPerBlock <= 0 ) means there is only one step inside this block.
      // And a different activation function may be used after pointwise2 convolution.
      pointwise2ActivationId = nActivationIdAtBlockEnd;

      let step0 = this.step0 = new PointDepthPoint.Base();
      step0.init(
        sourceChannelCount,
        pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
        pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
        false, // It is not possible to add-input-to-output, because ( depthwisePad == "valid" ).
        bKeepInputTensor  // Step 0 may or may not keep input tensor according to caller's necessary. 
      );

      this.stepLast = step0;
      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_NotChannelShuffle_NotAddInputToOutput;
      this.outputChannelCount = step0.outputChannelCount;

    } else {  // ShuffleNetV2, or MobileNetV2.

      // Step 0.
      //
      // The special points of a block's step 0 are:
      //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
      //   - Double channels. (By concat if ShuffleNetV2. By second pointwise if MobileNetV2.)
      //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us.)
      let step0, step0Branch;
      {
//!!! ...unfinished... (2021/04/09) What if ( depthwiseChannelMultiplierStep0 == 0 )? The image will not be halven.
        let depthwise_AvgMax_Or_ChannelMultiplier;
        if ( strAvgMaxConv == "Conv" )
          depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        else
//!!! ...unfinished... (2021/03/10) should become all number?
          depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

        // Step 0 is responsibile for halving input's height (and width).
        let depthwiseStridesPad = 2; // ( depthwiseStrides == 2 ) and ( depthwisePad == "same" )

        let pointwise1ChannelCount, pointwise2ChannelCount;
        if ( bChannelShuffler ) {                            // ShuffleNetV2.
          pointwise2ChannelCount = sourceChannelCount * 1;   // In ShuffleNetV2, all convolutions do not change channel count

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          depthwiseBias = false;

          // In ShuffleNetV2, depthwise convolution does not have activation function.
          depthwiseActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

          // If there is only one step, this is the last step of this block (i.e. at-block-end) and a different activation function may be
          // used after pointwise2 convolution.
          if ( 1 == stepCountPerBlock ) {
            pointwise2ActivationId = nActivationIdAtBlockEnd;
          }

        } else {                                             // MobileNetV1, or MobileNetV2.
          pointwise2ChannelCount = sourceChannelCount * 2;   // The output channel count of step 0 of MobileNetV2 is twice as input.

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          pointwise2Bias = false;

//!!! ...unfinished... (2021/04/09) How to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1)?

          // In MobileNetV2, the second 1x1 pointwise convolution does not have activation function.          
          pointwise2ActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

          // Since pointwise2ActivationId is always NONE in MobileNetV2, the nActivationIdAtBlockEnd is never used in MobileNetV2.
        }

        // If ( pointwise1ChannelCount < pointwise2ChannelCount ), similiar to ResNet.
        // If ( pointwise1ChannelCount == pointwise2ChannelCount ), similiar to MobileNetV1 or ShufffleNetV2.
        // If ( pointwise1ChannelCount > pointwise2ChannelCount ), similiar to MobileNetV2.
        pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

        step0 = this.step0 = new PointDepthPoint.Base();
        step0.init(
          sourceChannelCount,
          pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
          pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
          false, // In MobileNet2, step 0 is not possible, because output channel count is tiwce as input. In ShuffleNetV2, it is not necessary. So, false.
          bKeepInputTensor  // Step 0 may or may not keep input tensor according to caller's necessary. 
        );

        // Step0's branch (ShuffleNetV2)
        //
        // The step 0 of ShuffleNetV2 has a branch for halving height and width by depthwise convolution without 1x1 (pointwise) convolution in front of it.
        if ( bChannelShuffler ) {
          this.step0Branch = step0Branch = new PointDepthPoint.Base();
          step0Branch.init(
            sourceChannelCount,
            0, false, "", // ShuffleNetV2 Step0's branch does not have the first 1x1 pointwise convolution before depthwise convolution ( strides = 2 ).
            depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
            pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
            false, // Since there is channel shuffler, there is not necessary to add input to output.
            true   // This is the only case that must keep input tensor, because the input tensor need be re-used by the main path of setp 0.
          );

          // Pre-allocated array (with only two elements) for improving performance by reducing memory re-allocation.
          this.concatTensorArray = new Array( 2 );

          // Bind in step 0's logic, because step 1 (2, 3, ...) may not existed.
          this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_ChannelShuffle;
          this.outputChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;

        } else {
          // Bind in step 0's logic, because step 1 (2, 3, ...) may not existed.
          this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_AddInputToOutput;
          this.outputChannelCount = step0.outputChannelCount;
        }
      }

      // Step 1, 2, 3, ...
      if ( stepCountPerBlock > 0 ) {

//!!! ...unfinished... (2021/04/09) What if ( depthwiseChannelMultiplierStep0 == 0 )? It seems ok here (i.e. it is ok in non-step0).

        let depthwise_AvgMax_Or_ChannelMultiplier;
        if ( strAvgMaxConv == "Conv" )
          depthwise_AvgMax_Or_ChannelMultiplier = 1; // Force to 1, because only step 0 can have ( channelMultiplier > 1 ).
        else
//!!! ...unfinished... (2021/03/10) should become all number?
          depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

        // Force to ( depthwiseStrides == 1 ), because only step 0 (i.e. not here) should halve input's height (and width).
        let depthwiseStridesPad = 1; // ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )

        // In ShuffleNetV2, the input channel count of step 1 (2, 3, ...) is the concatenated output channel count of the
        // main and branch of step 0. However, they will be splitted (by channel shuffler) into two channel groups. So every
        // channel group has just only half of canatenated channel count of step 0 (i.e. not including the step0Branch).
        //
        // In MobileNetV2, the input channel count of step 1 (2, 3, ...) is the output channel count of the step 0.
        //
        // In a word, they are all the same as step0.outputChannelCount.
        let channelCount_pointwise1Before = step0.outputChannelCount;
        let pointwise2ChannelCount = channelCount_pointwise1Before;  // Every step will output the same channel count as input.

        // The first 1x1 pointwise convolution can change channel count.
        let pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

//!!! (2021/04/08) ...unfinished... Using ChannelShuffler.ConcatPointwiseConv instead.

        // In ShuffleNetV2, there is a channel shuffler in every step (except setp 0). It is shared by these steps in the same block.
        if ( bChannelShuffler ) {
          let concatenatedChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;
          let sourceConcatenatedShape = this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, concatenatedChannelCount ];
          let outputGroupCount = 2; // ShuffleNetV2 always uses two (depthwise convolution) groups.
          this.concatGather = new ChannelShuffler.ConcatGather();
          this.concatGather.init( sourceConcatenatedShape, outputGroupCount );
        }

        this.steps1After = new Array( stepCountPerBlock - 1 );  // "- 1" because this array does not include step0.

        for ( let i = 0; i < this.steps1After.length; ++i ) {

          // If this is the last step of this block (i.e. at-block-end), a different activation function may be used after pointwise2 convolution.
          if ( i == ( this.steps1After.length - 1 ) ) {

//!!! ...unfinished... (2021/04/09) In MobileNetV2, the second 1x1 pointwise convolution does not have activation function.
// Since pointwise2ActivationId is always NONE in MobileNetV2, the nActivationIdAtBlockEnd is never used in MobileNetV2.
// But how to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1)?
//
//             // In MobileNetV2, the second 1x1 pointwise convolution does not have activation function.
//             pointwise2ActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

            pointwise2ActivationId = nActivationIdAtBlockEnd;
          }

          let step = new PointDepthPoint.Base();
          step.init(
            channelCount_pointwise1Before,
            pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
            depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
            pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
            this.bAddInputToOutput,
            false // No matter bKeepInputTensor, all steps (except step 0) should not keep input tensor.
          );

          this.steps1After[ i ] = step;
        }

        if ( 1 == stepCountPerBlock ) {
          this.stepLast = this.step0; // If there is only one step, it is also the last step.
        } else {
          this.stepLast = this.steps1After[ this.steps1After.length - 1 ]; // Shortcut to the last step.
        }
      }
    }
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
//!!! ...unfinished...
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

  disposeTensors() {
    if ( this.concatGather ) {
      this.concatGather.disposeTensors();
      this.concatGather = null;
    }

    if ( this.concatTensorArray ) {
      this.concatTensorArray = null;
    }

    if ( this.step0 ) {
      this.step0.disposeTensors();
      this.step0 = null;
    }

    if ( this.step0Branch ) {
      this.step0Branch.disposeTensors();
      this.step0Branch = null;
    }

    if ( this.steps1After ) {
      for ( let step of this.steps1After ) {
        step.disposeTensors();
      }
      this.steps1After = null;
    }

    this.stepLast = null; // It has already de disposed by this.step0 or this.steps1After.
  }

  /** Process input, destroy input, return result. (For Not ShuffleNetV2 and Not MobileNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor
   *   The image which will be processed. This inputTensor may or may not be disposed according to init()'s bKeepInputTensor.
   *
   * @return {tf.tensor3d} Return a new tensor. All other intermediate tensors were disposed.
   */
  static apply_and_destroy_or_keep_NotChannelShuffle_NotAddInputToOutput( inputTensor ) {
    return this.step0.apply_and_destroy_or_keep( inputTensor );
  }

  /** Process input, destroy input, return result. (For ShuffleNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor
   *   The image which will be processed. This inputTensor may or may not be disposed according to init()'s bKeepInputTensor.
   *
   * @return {tf.tensor3d} Return a new tensor. All other intermediate tensors were disposed.
   */
  static apply_and_destroy_or_keep_ChannelShuffle( inputTensor ) {

    // Keep data as local variables for improving performance.

//!!! ...unfinished... Compare performance to call concatGather.concatGather() directly.

//!!! (2021/04/08) ...unfinished... Using ChannelShuffler.ConcatPointwiseConv instead.

    let lastAxisId = this.concatGather.shuffleInfo.lastAxisId;

    // There are exactly two output channel groups, take them out from array. (for reducing array access cost.)
    let group0_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 0 ];
    let group1_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 1 ];

    let concatTensorArray = this.concatTensorArray; // Keep pre-allocated array (with two elements) as local variables for improving performance.

    // tensor of convolution group 0, tensor of convolution group 1, new tensor of convolution group 1, tensor of concatenation of group 0 and 1. 
    let t0, t1, t1New, concatenatedTensor;

    // Step 0.
    concatTensorArray[ 0 ] = t0 = this.step0Branch.apply_and_destroy_or_keep( inputTensor );  // Branch (will NOT destroy input tensor).
    concatTensorArray[ 1 ] = t1 = this.step0      .apply_and_destroy_or_keep( inputTensor );  // Main Path (may or may not destroy input tensor).

    concatenatedTensor = tf.concat( concatTensorArray, lastAxisId );
    t0.dispose();                   // Dispose all intermediate (temporary) data.
    t1.dispose();                   // Dispose all intermediate (temporary) data.

    // Step 1, 2, 3, ...
    let step;
    for ( let i = 0; i < this.steps1After.length; ++i ) {
      step = this.steps1After[ i ];

      // shuffle and split by gather (one operation achieves two operations).
      t0 = concatenatedTensor.gather( group0_channelIndicesTensor1d, lastAxisId );
      t1 = concatenatedTensor.gather( group1_channelIndicesTensor1d, lastAxisId );
      concatenatedTensor.dispose(); // Dispose all intermediate (temporary) data.

      concatTensorArray[ 0 ] = t0;                                            // Branch do nothing (as a shortcut).
      concatTensorArray[ 1 ] = t1New = step.apply_and_destroy_or_keep( t1 );  // Main path is processed.

      concatenatedTensor = tf.concat( concatTensorArray, lastAxisId );
      t0.dispose();                 // Dispose all intermediate (temporary) data.
      t1New.dispose();              // Dispose all intermediate (temporary) data.
    }

    return concatenatedTensor;
  }

  /** Process input, destroy input, return result. (For MobileNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor
   *   The image which will be processed. This inputTensor may or may not be disposed according to init()'s bKeepInputTensor.
   *
   * @return {tf.tensor3d} Return a new tensor. All other intermediate tensors were disposed.
   */
  static apply_and_destroy_or_keep_AddInputToOutput( inputTensor ) {
    let t, tNew;

    // Step 0.
    t = this.step0.apply_and_destroy_or_keep( inputTensor );

    // Step 1, 2, 3, ...
    let step;
    for ( let i = 0; i < this.steps1After.length; ++i ) {
      step = this.steps1After[ i ];
      t = step.apply_and_destroy_or_keep( t );
    }

    return t;
  }

}
