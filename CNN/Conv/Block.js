export { Params, Base, PointDepthPoint };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
//import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Convolution block parameters.
 */
class Params extends Weights.Params {

  /**
   * If a parameter's value is null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} stepCountPerBlock
   *   There are how many steps inside this block.
   *   - If null, it will be extracted from inputFloat32Array (i.e. by evolution).

//!!! ...unfinished... (2021/07/28 Remarked) Old Design
//    *   - If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) to shrink
//    *       sourceHeight (i.e. to be minus ( filterHeight - 1 ) ).

//!!! ...unfinished... (2021/07/28) What if ( depthwiseFilterHeight == 1 )?

   *   - If zero (== 0), the step count will be automatically calculated so that the block's output has half
   *     ( height, width ) and double channel count (depth). It is achieved by:
   *       - step0: tf.depthwiseConv2d( strides = 1, pad = "valid" ) with channel multiplier 2 to double the channel count.
   *       - step1 to step(Last-1): tf.depthwiseConv2d( strides = 1, pad = "valid" ).
   *       - stepLast: tf.depthwiseConv2d( strides = 1, pad = "valid" ) and pointwise2.
   *       - If ( depthwiseFilterHeight == 1 ), depthwiseFilterHeight will become 2 forcibly. Otherwise, the image size
   *         could not be shrinked.
   *
   *   - If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink (i.e. to halve
   *       height x width) and use ( stepCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until
   *       the block end.
   *

//!!! ...unfinished... (2021/07/28)
// Problem: When ( stepCountPerBlock <= 0 ), the depthwiseChannelMultiplierStep0 is used for expanding channels. Perhaps, use
// abs( stepCountPerBlock ) as its depthwiseChannelMultiplier. If ( stepCountPerBlock == 0 ), depthwiseChannelMultiplier will
// be 1 forcibly.
// (However, it usually should be enough that channel multiplier is 1 or 2 (no need to be more?).)
//
//
//

   * @param {boolean} bChannelShuffler
   *   If true, this block will be similar to ShuffleNetV2 (i.e. split and concat channels). If false, this block will be similar to
   * MobileNetV1 or MobileNetV2 (i.e. add input to output). If null, it will be extracted from inputFloat32Array (i.e. by evolution). If
   * ( stepCountPerBlock <= 0 ), this flag will be ignored.
   *
   * @param {number} pointwise1ChannelCountRate
   *   The first 1x1 pointwise convolution output channel count over of the second 1x1 pointwise convolution output channel count.
   * That is, pointwise1ChannelCount = ( pointwise2ChannelCount * pointwise1ChannelCountRate ). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *   - If ( stepCountPerBlock <= 0 ), this rate will be ignored because there will be no first 1x1 pointwise.
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
   *

//!!! ...unfinished... (2021/07/27) In reality, it is almost no reason to use only avg/max pooling to compose a block because it keep
// too little information for the next block. So, it should be possible to combine ( bChannelShuffler, pointwise1ChannelCountRate,
// depthwiseChannelMultiplierStep0 ) into only one parameter.
//
//
// In my opinion, a max pooling may be used as a branch of input0. The max pooling result of input0 should be concatenated with the
// depthwise convolution result of input0. The reason is that max pooling could provide information which is difficult achieved
// by a depthwise convolution. (Thinks that for a while: how to calculate maximum value by linear combination (i.e. add-multiply).)

   * @param {number} depthwiseChannelMultiplierStep0
   *   The depthwise convolution of the first step (Step 0) will expand input channel by this factor. If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution). If non-null, it should be an integer between [ -2, 32 ]:
   *   - Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.AVG (-2): average pooling.
   *   - Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.MAX (-1): max pooling.
   *   - Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0): this will be adjusted to 1 forcibly (always needs depthwise operation).
   *   - positive integer between [ 1, 32 ]: depthwise convolution and the number indicates channel multiplier.
   *
   * @param {boolean} bBias
   *   If true, there will be a bias after every convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {string} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after every convolution. If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {string} nActivationIdAtBlockEnd
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the convolution of the last PointDepthPoint's
   * pointwise2ActivationId of this block. If null, it will be extracted from inputFloat32Array (i.e. by evolution). If the output of
   * this block needs to be any arbitrary value, it is recommended not to use activation at the end of this block
   * (i.e. nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE) so that it will not be restricted by the range
   * of the activation function.
   *
   * @return {boolean}
   *   Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    depthwiseChannelMultiplierStep0, depthwiseFilterHeight, bBias, nActivationId, nActivationIdAtBlockEnd
  ) {

    let parameterMap = new Map( [
      [ Params.stepCountPerBlock,                stepCountPerBlock ],
      [ Params.bChannelShuffler,                 bChannelShuffler ],
      [ Params.pointwise1ChannelCountRate,       pointwise1ChannelCountRate ],
      [ Params.depthwiseChannelMultiplierStep0,  depthwiseChannelMultiplierStep0 ],
      [ Params.depthwiseFilterHeight,            depthwiseFilterHeight ],
      [ Params.bBias,                            bBias ],
      [ Params.nActivationId,                    nActivationId ],
      [ Params.nActivationIdAtBlockEnd,          nActivationIdAtBlockEnd ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  get stepCountPerBlock()                   { return this.parameterMapModified.get( Params.stepCountPerBlock ); }
  get bChannelShuffler()                    { return this.parameterMapModified.get( Params.bChannelShuffler ); }
  get pointwise1ChannelCountRate()          { return this.parameterMapModified.get( Params.pointwise1ChannelCountRate ); }

  /** @return {number} The number version of the step0's depthwise opertion. */
  get depthwiseChannelMultiplierStep0()     { return this.parameterMapModified.get( Params.depthwiseChannelMultiplierStep0 ); }

  /** @return {string} The string version of the step0's depthwise opertion. */
  get depthwiseChannelMultiplierStep0Name() { return Params.depthwiseChannelMultiplierStep0.getStringOfValue( this.depthwiseChannelMultiplierStep0 ); }

  get depthwiseFilterHeight()               { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get bBias()                               { return this.parameterMapModified.get( Params.bBias ); }
  get nActivationId()                       { return this.parameterMapModified.get( Params.nActivationId ); }
  get nActivationIdName()                   { return Params.nActivationId.getStringOfValue( this.nActivationId ); }
  get nActivationIdAtBlockEndId()           { return this.parameterMapModified.get( Params.nActivationIdAtBlockEnd ); }
  get nActivationIdAtBlockEndName()         { return Params.nActivationIdAtBlockEnd.getStringOfValue( this.nActivationIdAtBlockEnd ); }
}


// Define parameter descriptions.
Params.stepCountPerBlock =               new ParamDesc.Int(                         "stepCountPerBlock",          0, ( 1 * 1024 ) );
Params.bChannelShuffler =                new ParamDesc.Bool(                        "bChannelShuffler" );
Params.pointwise1ChannelCountRate =      new ParamDesc.Int(                         "pointwise1ChannelCountRate", 0,             2 );
Params.depthwiseChannelMultiplierStep0 = new ParamDesc.AvgMax_Or_ChannelMultiplier( "depthwiseChannelMultiplierStep0" );
Params.depthwiseFilterHeight =           new ParamDesc.Int(                         "depthwiseFilterHeight",      1,             9 );
Params.bBias =                           new ParamDesc.Bool(                        "bBias" );
Params.nActivationId =                   new ParamDesc.ActivationFunction(          "nActivationId" );
Params.nActivationIdAtBlockEnd =         new ParamDesc.ActivationFunction(          "nActivationIdAtBlockEnd" );


/**
 * Implement a block of ( depthwise convolution and pointwise convolution ) or ShuffleNetV2 (with 2 output channel groups) or MobileNetV1
 * or MobileNetV2.
 *
 *
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {PointDepthPoint.Base[]} stepsArray
 *   All computation steps of this block.
 *
 * @member {PointDepthPoint.Base} step0
 *   The first computation step of this block.
 *
 * @member {PointDepthPoint.Base} stepLast
 *   The last computation step of this block. It may be the same as this.step0 when there is only one step inside this block.
 *
 * @member {number} outputHeight
 *   The output image height of this block's last step.
 *
 * @member {number} outputWidth
 *   The output image width of this block's last step.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this block's last step.
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has an parameter inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which
 * will be processed. It returns a new tf.tensor3d. All other tensors will be disposed. But inputTensor could be kept
 * (if ( bKeepInputTensor == true ) ) or disposed (if ( bKeepInputTensor == false ) ). In fact, this method calls one of
 * apply_and_destroy_or_keep_NotChannelShuffle_NotAddInputToOutput(), apply_and_destroy_or_keep_ChannelShuffle(),
 * apply_and_destroy_or_keep_AddInputToOutput() according to the init()'s parameters.
 *
 */
class Base {

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply_and_destroy_or_keep(). This should always be specified and can
   * not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply_and_destroy_or_keep().c This should always be specified and can
   * not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {number} sourceChannelCount
   *   The channel count of the source image. It may be the output channel count of the previous convolution block, so it could be large.
   * This should always be specified and can not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   *
//!!! ...unfinished...
//!!! ...unfinished... (2021/04/09) How to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1 )?
// Since pointwise2ActivationId is always NONE in MobileNetV2 (i.e. ( bChannelShuffler == false ), the nActivationIdAtBlockEnd is never used in MobileNetV2.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). If it is null, it will be viewed as falsy
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {Params} params
   *   A Params object. The params.extract() will be called to extract parameters.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   * @see PointDepthPoint.Base.initer()
   */
  * initer( progressParent, sourceHeight, sourceWidth, sourceChannelCount, bKeepInputTensor, params ) {

    // Both MobileNetV3 and ShuffleNetV2:
    //   - They all do not use (depthwise convolution) channelMultiplier.
    //   - They all use 1x1 (pointwise) convolution to expand channel count.
    //   - They all use 1x1 (pointwise) convolution before depthwise convolution.
    //   - They all use activation function after first pointwise convolution.
    //   - They all use depthwise convolution with ( pad = "same" ).
    //   - They all use depthwise convolution with ( strides = 2 ) for shrinking (halving) height x width.
    //   - They all do not use bias after pointwise and depthwise convolution.
    //
    // Inisde one of their block, three convolutions are used:
    //   A) 1x1 (pointwise) convolution, with activation.
    //   B) depthwise convolution, (ShuffleNetV2) without or (MobileNetV2) with activation.
    //   C) 1x1 (pointwise) convolution, (ShuffleNetV2) with or (MobileNetV2) without activation.
    //
    // In MobileNetV3, convolution A expands channel count (with activation), convolution C shrinks channel count (without activation).
    // It may use squeeze-and-excitation after convolution B (without activation). When there is necessary to increase output channel
    // count (usually in step 0 of a block), the convolution C is responsible for this.
    //
    // In ShuffleNetV2, convolution A (with activation), convolution B (without activation) and convolution C (with activation) never
    // change channel count. When there is necessary to increase output channel count (usually in step 0 of a block), it expands channel
    // count by concatenating two shrinked (halven) height x width.


    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputFloat32Array.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) ); // For parameters extracting.
    let progressForSteps = progressParent.addChild( new ValueMax.Percentage.Aggregate() ); // for step0, step1, 2, 3, ... 

    this.disposeTensors();

    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;
    this.bKeepInputTensor = bKeepInputTensor;

    // 1. Extract parameters.
    if ( !params )
      return false;

    this.byteOffsetEnd = this.byteOffsetBegin = params.defaultByteOffsetBegin;

    if ( !params.extract() )
      return false;  // e.g. input array does not have enough data.

    this.byteOffsetEnd = params.defaultByteOffsetEnd; // Record where to extract next weights. Only meaningful when ( this.bInitOk == true ).

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputFloat32Array could be released.
    this.stepCountPerBlock = params.stepCountPerBlock;
    this.bChannelShuffler = params.bChannelShuffler
    this.pointwise1ChannelCountRate = params.pointwise1ChannelCountRate;
//!!! ...unfinished... (2021/07/28) If depthwiseChannelMultiplierStep0 is removed, this codes should also be removed.
    this.depthwiseChannelMultiplierStep0 = params.depthwiseChannelMultiplierStep0;
    this.depthwiseFilterHeight = this.depthwiseFilterWidth = params.depthwiseFilterHeight; // Assume depthwise filter's width equals its height.
    this.bBias = params.bBias;
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.nActivationIdAtBlockEnd = params.nActivationIdAtBlockEnd;
    this.nActivationIdAtBlockEndName = params.nActivationIdAtBlockEndName;


//!!! ...unfinished... (2021/07/28) If depthwiseChannelMultiplierStep0 is removed, this codes should also be removed.

    // The depthwise channel multipler of the step 0 can not be Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0).
    // Otherwise, the input image will not be shrinked a little (for ( stepCountPerBlock <= 0 )) or will not be halven
    // (for ( stepCountPerBlock >= 1 ). So force to 1 at least (always needs depthwise operation).
    //
    // This adjustment should be after Params.init().
    if ( this.depthwiseChannelMultiplierStep0 == 0 )
      this.depthwiseChannelMultiplierStep0 = 1;

    // Pre-allocate array to place intermediate 2 input tensors and 2 output tensors. This could reduce memory re-allocation.
    this.intermediateInputTensors = new Array( 2 );
    this.intermediateOutputTensors = new Array( 2 );

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

//!!! ...unfinished... (2021/04/10)
// Perhaps, Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0) (no depthwise operation) could be viewed as ( bChannelShuffler == true ).
// Because it is not possible to change depthwiseChannelMultiplier in ShuffleNetV2 (it is always ( depthwiseChannelMultiplier == 1 )).
// (WRONG! it is possible to change depthwiseChannelMultiplier in ShuffleNetV2.)
// This could also reduce one parameter (drop the bChannelShuffler parameter).


//!!! ...unfinished... (2021/07/27)
//    this.channelCount1_pointwise1Before;
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_XXX (> 0)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT: // ( 0)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT: // (-1)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE: // (-2)
//
//     let flags = {};
//     PointDepthPoint.Params.setFlags_by_channelCount1_pointwise1Before.call( flags, this.channelCount1_pointwise1Before );


//!!! ...unfinished... (2021/07/28)
//    this.bAddInputToOutput = !bChannelShuffler; // ChannelShuffler or AddInputToOutput, but not both. They are all for achieving skip connection.

    // By default, the output ( height, width ) is half of the input (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
    //
    // Note: This calculation copied from the getPadAndOutInfo() of
    // (https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts).
    //
    {
      let stridesHeight = 2, stridesWidth = 2;
      this.outputHeight = Math.ceil( sourceHeight / stridesHeight );
      this.outputWidth =  Math.ceil( sourceWidth  / stridesWidth );
    }

    let channelCount0_pointwise1Before, channelCount1_pointwise1Before;
    let pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId;
    let depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, depthwiseBias, depthwiseActivationId;
    let pointwise21ChannelCount, pointwise21Bias, pointwise21ActivationId;
    let pointwise22ChannelCount, pointwise22Bias, pointwise22ActivationId;
    let bShouldKeepInputTensor;
    let params;

    // By default, all convolution use the same bias flag and activation function.
    pointwise1Bias = depthwiseBias = pointwise21Bias = pointwise22Bias = this.bBias;
    pointwise1ActivationId = depthwiseActivationId = pointwise21ActivationId = pointwise22ActivationId = this.nActivationId;

    if ( this.stepCountPerBlock == 0 ) {  // Not ShuffleNetV2, Not MobileNetV2.

      // Calculate the real step count for depthwise convolution with ( strides = 1, pad = "valid" ).
      let stepCount;
      let depthwiseFilterHeightLast; // The last step's depthwise filter size.
      {
        let differenceHeight = sourceHeight - this.outputHeight;
        //let differenceWidth =  sourceWidth  - this.outputWidth;

//!!! ...unfinished... (2021/07/29) if ( differenceHeight == 0 ), should use depthwise filter 1x1 so that there is at least one step. 

        if ( this.depthwiseFilterHeight == 1 )
          this.depthwiseFilterHeight = 2; // Otherwise, the image size could not be shrinked.

        // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
        let heightReducedPerStep = this.depthwiseFilterHeight - 1;

        // The step count for reducing sourceHeight to outputHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
        //
        // This value may be less than real step count because the filter size of the last step may be larger than its input.
        let stepCountLess = Math.floor( differenceHeight / heightReducedPerStep );

        let differenceHeightLast = this.outputHeight - ( stepCountLess * heightReducedPerStep );
        if ( 0 == differenceHeightLast ) { // The depthwiseFilterHeight could achieve the output size. 
          stepCount = stepCountLess; // It is the real step count.
          depthwiseFilterHeightLast = this.depthwiseFilterHeight; // Using original depthwise filter size is good enough.

        } else { // The depthwiseFilterHeight could not achieve the output size. It is larger than the last step's input size.
          stepCount = stepCountLess + 1; // Needs one more step.
          depthwiseFilterHeightLast = differenceHeightLast + 1; // The last step's depthwise filter size should just eliminate the last diffference.
        }

//!!! ...unfinished... (2021/07/29) What if can not achieve the output size?

//!!! ...unfinished... (2021/07/28) What if ( stepCount == 0 )?
      }

      for ( let i = 0; i < stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
        progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
      }

      channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no add-input-to-output, no concatenate.
      pointwise1ChannelCount = 0;  // In this mode, always no pointwise convolution before depthwise convolution.
      depthwiseStridesPad = 0;     // In this mode, always ( strides = 1, pad = "valid" ).
      pointwise22ChannelCount = 0; // In this mode, always no second output.

      this.stepsArray = new Array( stepCount );
      for ( let i = 0; i < this.stepsArray.length; ++i ) { // Step1, 2, 3, ...

        if ( 0 == i ) { // Step0.
          channelCount0_pointwise1Before = sourceChannelCount; // Step0 uses the original input channel count.
          depthwise_AvgMax_Or_ChannelMultiplier = 2;           // Step0 double the channel count by depthwise channel multiplier.
          pointwise21ChannelCount = sourceChannelCount * depthwise_AvgMax_Or_ChannelMultiplier; // Step0 will double channel count.
          bShouldKeepInputTensor = bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.
        }

        // If this is the last step of this block (i.e. at-block-end), a different activation function may be used after
        // pointwise2 convolution.
        if ( ( this.stepsArray.length - 1 ) == i ) {
          pointwise21ActivationId = this.nActivationIdAtBlockEnd;
        }

        params = new PointDepthPoint.Params(
          params.defaultInput, this.byteOffsetEnd,
          channelCount1_pointwise1Before,
          pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
          depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, depthwiseStridesPad,depthwiseBias, depthwiseActivationId,
          pointwise21ChannelCount, pointwise21Bias, pointwise21ActivationId,
          pointwise22ChannelCount, pointwise22Bias, pointwise22ActivationId,
        )

        let step = this.stepsArray[ i ] = new PointDepthPoint.Base();
        let stepIniter = step.initer( progressForSteps.children[ i ], channelCount0_pointwise1Before, bShouldKeepInputTensor, params );

        this.bInitOk = yield* stepIniter;
        if ( !this.bInitOk )
          return false;
        this.byteOffsetEnd = this.step.byteOffsetEnd;

        if ( 0 == i ) { // After step0 (i.e. for step1, 2, 3, ...)
          channelCount0_pointwise1Before = step.outChannelsAll; // Step0's output channel count is all the other steps' input channel count.
          depthwise_AvgMax_Or_ChannelMultiplier = 1;            // Except step0, all other steps will not double the channel count.
          pointwise21ChannelCount = step.outChannelsAll;        // Step0's output channel count is all the other steps' output channel count.
          bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step 0) should not keep input tensor.
        }
      }

      this.step0 = this.stepsArray[ 0 ]; // Shortcut to the first step.
      this.stepLast = this.stepsArray[ this.stepsArray.length - 1 ]; // Shortcut to the last step.

      this.outputChannelCount = this.stepLast.outChannelsAll;
      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_NotChannelShuffle_NotAddInputToOutput;

    } else {  // ShuffleNetV2, or MobileNetV2.

//!!! ...unfinished... (2021/07/28) should detect every step's initer successful or failed.

//!!! ...unfinished... (2021/07/27)
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.

      // Step 0.
      //
      // The special points of a block's step 0 are:
      //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
      //   - Double channels. (By concat if ShuffleNetV2. By second pointwise if MobileNetV2.)
      //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us.)
      let step0, step0Branch;
      {
        let depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0; // (Can not be zero.)

        // Step 0 is responsibile for halving input's height (and width).
        let depthwiseStridesPad = 2; // ( depthwiseStrides == 2 ) and ( depthwisePad == "same" )

        let pointwise1ChannelCount, pointwise2ChannelCount;
        if ( bChannelShuffler ) {                            // ShuffleNetV2.
          pointwise2ChannelCount = sourceChannelCount * 1;   // In ShuffleNetV2, all convolutions do not change channel count

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          depthwiseBias = false;

          // In ShuffleNetV2, depthwise convolution does not have activation function.
          depthwiseActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

        } else {                                             // MobileNetV1, or MobileNetV2.
          pointwise2ChannelCount = sourceChannelCount * 2;   // The output channel count of step 0 of MobileNetV2 is twice as input.

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          pointwise2Bias = false;

//!!! ...unfinished... (2021/04/09) How to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1 )?

          // In MobileNetV2, the second 1x1 pointwise convolution does not have activation function in default.
          //
          // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
          pointwise2ActivationId = PointDepthPoint.Params.Activation.Ids.NONE;
        }

        // If there is only one step, this (step 0) is also the last step of this block (i.e. at-block-end) and a different activation
        // function may be used after pointwise2 convolution.
        //
        // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
        if ( 1 == stepCountPerBlock ) {
          pointwise2ActivationId = nActivationIdAtBlockEnd;
        }

        // If ( pointwise1ChannelCount < pointwise2ChannelCount ), similar to ResNet.
        // If ( pointwise1ChannelCount == pointwise2ChannelCount ), similar to MobileNetV1 or ShufffleNetV2.
        // If ( pointwise1ChannelCount > pointwise2ChannelCount ), similar to MobileNetV2.
        pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

        step0 = this.step0 = new PointDepthPoint.Base();
        step0.init(
          sourceChannelCount,
          pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
          pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,

          // In MobileNet2, step 0 is not possible, because output channel count is tiwce as input.
          // In ShuffleNetV2, the skipping connection is achieved by concatenating.
          // So, it is not necessary to add input to output.
          false,
          bKeepInputTensor  // Step 0 may or may not keep input tensor according to caller's necessary. 
        );

        // Step0's branch (ShuffleNetV2)
        //
        // The step 0 of ShuffleNetV2 has a branch which also halves the height and width by depthwise convolution. And it does not have
        // the first 1x1 (pointwise) convolution. But it has the second 1x1 (pointwise) convolution.
        if ( bChannelShuffler ) {
          this.step0Branch = step0Branch = new PointDepthPoint.Base();
          step0Branch.init(
            sourceChannelCount,

            // ShuffleNetV2 Step0's branch does not have the first 1x1 pointwise convolution before depthwise convolution ( strides = 2 ).
            0, false, ValueDesc.ActivationFunction.Singleton.Ids.NONE,

            depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
            pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
            false, // In ShuffleNetV2, the skipping connection is achieved by concatenating. So, it is not necessary to add input to output.
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

        let depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        if ( depthwise_AvgMax_Or_ChannelMultiplier >= 0 ) { // Depthwise convolution.
          // In non-step0, it should not expand channel. Only step 0 can have ( channelMultiplier > 1 ). So, force to 1.
          depthwise_AvgMax_Or_ChannelMultiplier = 1;
        } else { // Avg pooling, or Max pooling.
          // Do nothing. Keep going.
        }

        // Force to ( depthwiseStrides == 1 ), because only step 0 (i.e. not here) should halve input's height (and width).
        let depthwiseStridesPad = 1; // ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )

        // In ShuffleNetV2, the input channel count of step 1 (2, 3, ...) is the concatenated output channel count of the
        // main and branch of step 0. However, they will be splitted (by channel shuffler) into two channel groups. So every
        // channel group has just only half of concatenated channel count of step 0 (i.e. not including the step0Branch).
        //
        // In MobileNetV2, the input channel count of step 1 (2, 3, ...) is the output channel count of the step 0.
        //
        // In a word, they are all the same as step0.outputChannelCount.
        let channelCount_pointwise1Before = step0.outputChannelCount;
        let pointwise2ChannelCount = channelCount_pointwise1Before;  // Every step will output the same channel count as input.

        // The first 1x1 pointwise convolution can change channel count.
        let pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

        // In ShuffleNetV2, there is a channel shuffler in every step (except setp 0). It is shared by these steps in the same block.
        if ( bChannelShuffler ) {
          let concatenatedChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;
          let sourceConcatenatedShape = this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, concatenatedChannelCount ];
          let outputGroupCount = 2; // ShuffleNetV2 always uses two (depthwise convolution) groups.

//!!! (2021/04/10) ...unfinished... Using ChannelShuffler.ConcatPointwiseConv instead.
          this.concatGather = new ChannelShuffler.ConcatGather();
          this.concatGather.init( sourceConcatenatedShape, outputGroupCount );

          this.concatPointwiseConv = new ChannelShuffler.ConcatPointwiseConv();
          this.concatPointwiseConv.init( sourceConcatenatedShape, outputGroupCount );
        }

        this.steps1After = new Array( stepCountPerBlock - 1 );  // "- 1" because this array does not include step0.

        for ( let i = 0; i < this.steps1After.length; ++i ) {

          // If this is the last step of this block (i.e. at-block-end), a different activation function may be used after
          // pointwise2 convolution.
          //
          // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
          if ( i == ( this.steps1After.length - 1 ) ) {
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
//!!! ...unfinished... (2021/07/28)
      this.bInitOk = true;
    }

    return this.bInitOk;
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
   *
   * @see PointDepthPoint.Base.init()
   */
  init( progressParent, sourceHeight, sourceWidth, sourceChannelCount, bKeepInputTensor, params ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, sourceHeight, sourceWidth, sourceChannelCount, bKeepInputTensor, params );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {
//!!! (2021/07/28 Remarked) Old Codes.
// //!!! (2021/04/10) ...unfinished... Using ChannelShuffler.ConcatPointwiseConv instead.
//     if ( this.concatGather ) {
//       this.concatGather.disposeTensors();
//       this.concatGather = null;
//     }
//
//     if ( this.concatPointwiseConv ) {
//       this.concatPointwiseConv.disposeTensors();
//       this.concatPointwiseConv = null;
//     }
//
//     if ( this.concatTensorArray ) {
//       this.concatTensorArray = null;
//     }
//
//     if ( this.step0 ) {
//       this.step0.disposeTensors();
//       this.step0 = null;
//     }
//
//     if ( this.step0Branch ) {
//       this.step0Branch.disposeTensors();
//       this.step0Branch = null;
//     }
//
//     if ( this.steps1After ) {
//       for ( let step of this.steps1After ) {
//         step.disposeTensors();
//       }
//       this.steps1After = null;
//     }

    if ( this.stepsArray ) {
      for ( let i = 0; i < this.stepsArray.length ) {
        let step = this.stepsArray[ i ];
        step.disposeTensors();
      }
      this.stepsArray.length = 0;
    }

    this.stepLast = null; // It has already de disposed by this.step0 or this.steps1After.

    this.apply_and_destroy_or_keep = null;
    this.outputChannelCount = -1;

    this.intermediateInputTensors = this.intermediateOutputTensors = null;
    
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Process input, destroy or keep input, return result. (For Not ShuffleNetV2 and Not MobileNetV2.)
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
    let inputTensors = this.intermediateInputTensors;
    let outputTensors = this.intermediateOutputTensors;

    outputTensors[ 0 ] = inputTensor;
    outputTensors[ 1 ] = null;

    for ( let i = 0; i < this.stepsArray.length ) {
      inputTensors[ 0 ] = outputTensors[ 0 ]; // Previous step's output becomes next step's input.
      inputTensors[ 1 ] = outputTensors[ 1 ];

      let step = this.stepsArray[ i ];
      step.apply_and_destroy_or_keep( inputTensors, outputTensors );
    }

    return outputTensors[ 0 ]; // Note: The last step should only output one tensor.
  }

//!!! ...unfinished... (2021/07/27) How to specify this configuration? ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 0 )
//
//!!! ...unfinished... (2021/04/13) (Our) Adjusted ShuffleNetV2:
//  
// Since channel shuffler could achieved efficiently by pointwise convolution, it may be possible to combine the pointwise2
// convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
//   - Concatenate the output of depthwise convolution and the other output group.
//   - Pointwise convolution to generate output group 1.
//   - Pointwise convolution to generate output group 2.
//
// Although the channel shuffler is achieved by pointwise convolution without bias and activation function, however,
// the second pointwise convolution (before channel shuffler) indeed has bias and activation function. After combining
// these two pointwise convolutions (the original second and the channel shuffler), the total result is twice pointwise
// convolution with bias and activation function.
//
// If the poitwise1 convolution (of every step (include step 0 too)) could be discarded, the step 0 and step 0's branch could
// be achieved simultaneously by:
//   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
//   - No need to concatenate because the above operation already double channel count.
//   - twice pointwise2 convolution (every has same as block's input channel count).
//
// And, the step 1 (, 2, 3, ..., ( n - 2 ) ) could be achieved by:
//   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
//   - concatenate.
//   - twice pointwise2 convolution (every has same as block's input channel count).
//
// And, the last step (i.e. step ( n - 1 ) ) of the block could be achieved by:
//   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
//   - concatenate.
//   - once pointwise2 convolution (has double of block's input channel count).
//
// Note that:
//   - The depthwise convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
//     convolution (channelMultipler = 1, strides = 2) of step 0 and step 0's branch. So, it is one less depthwise
//     convolution, and one less concatenating.
//
//   - The twice pointwise2 convolution (every has same as block's input channel count) achieves not only pointwise
//     convolution but also channel shuffling. So, it is one less pointwise convolution.
//
//   - The once pointwise2 convolution (has double of block's input channel count) of last step achieves simultaneously
//     pointwise convolution, channel shuffling, and concatenating. So, it is not only one less pointwise convolution,
//     but also one less concatenating.
//
//   - Even if the pointwise1 convolution is discarded and the pointwise2 convolution does not have bias and activation
//     function, the depthwise convolution (with bias and COS as activation function) and pointwise2 convolution together
//     compose an effective Fourier series which should have enough expressive power for approximating any function.
//
//

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
