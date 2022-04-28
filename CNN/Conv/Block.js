export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Convolution block parameters.
 *
 * @member {number} outputHeight
 *   The height of output image. It is half of the input height (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. It is half of the input width (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
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
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply_and_destroy_or_keep(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply_and_destroy_or_keep(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceChannelCount
   *   The depth (channel count) of the source image. It may be the output channel count of the previous convolution block, so
   * it could be large. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} stepCountRequested
   *   How many steps inside this block are wanted.
   *   - If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - If one (== 1), the step count will be automatically calculated so that the block's output has half of source's
   *     ( height, width ) and double channel count (depth).
   *       - Every step will use depthwise convolution ( strides = 1, pad = "valid" ) and pointwise21. So every step will
   *         shrink the input a little.
   *       - The step0's depthwise convolution will also use channel multiplier 2 to double the channel count.
   *       - The stepLast may use a smaller depthwise filter so that it could just make ( output height, width ) as half of source.
   *       - If ( depthwiseFilterHeight == 1 ), the depthwiseFilterHeight will become 2 forcibly. Otherwise, the source size
   *         could not be shrinked.
   *
   *   - If ( stepCountRequested >= 2 ), this block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   *       (i.e. to halve height x width) and use ( stepCountRequested - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" )
   *       until the block end. (This can not be achieved by only one step. So there is at least two steps.)
   *
   * @param {number} pointwise1ChannelCountRate
   *   The first 1x1 pointwise convolution output channel count over of the second 1x1 pointwise convolution output channel count.
   * That is, pointwise1ChannelCount = ( pointwise21ChannelCount * pointwise1ChannelCountRate ).
   *   - If ( pointwise1ChannelCountRate == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *   - If ( pointwise1ChannelCountRate == 0 ), there will be no pointwise1.
   *   - If ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1 (no expanding) or ShuffleNetV2 (expanding by twice depthwise).
   *   - If ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2 (expanding by twice pointhwise1).
   *
   * @param {string} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after every convolution. If null, it will be
   * extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {string} nActivationIdAtBlockEnd
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the convolution of the last PointDepthPoint's
   * pointwise2ActivationId of this block. If null, it will be extracted from inputFloat32Array (i.e. by evolution). If the output of
   * this block needs to be any arbitrary value, it is recommended not to use activation at the end of this block
   * (i.e. nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE) so that it will not be restricted by the range
   * of the activation function.
   *
   * @param {boolean} nWhetherShuffleChannel
   *   Whether a (concatenator and) channel shuffler will be used.
   *
   *   - If ( nWhetherShuffleChannel == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - If ( stepCountRequested <= 1 ), this flag will be ignored.
   *       This block will be NotShuffleNet_NotMobileNet. There will be no channel shuffler.
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.NONE ), (0),
   *       this block will be MobileNetV1 or MobileNetV2 (i.e. with add-input-to-output, no channel shuffler).
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER ), (1),
   *       this block will be ShuffleNetV2. There is a channel shuffler by concat-shuffle-split.
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ), (2),
   *       this block will be ShuffleNetV2_ByPointwise22. There is a channel shuffler by pointwise22.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. will be kept). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean}
   *   Return false, if initialization failed.
   *
   * @override
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountRequested,
    pointwise1ChannelCountRate,
    depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd,
    nWhetherShuffleChannel,
    bKeepInputTensor
  ) {

    // Q: Why the depthwiseChannelMultiplierStep0 is not listed as a parameter?
    // A: After considering the following reasons, it is worth to drop this parameter.
    //
    //   - In reality, it is almost no reason to use only avg/max pooling to compose a block because it keep too little information
    //     for the next block.
    //
    //   - If depthwiseChannelMultiplierStep0 is specified as Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0), the input
    //     image will not be shrinked a little (for ( stepCountRequested <= 1 )) or will not be halven (for ( stepCountRequested >= 2 ).
    //     If it is still a parameter it should be forced to 1 at least (always needs depthwise operation) in this case.
    //

    let parameterMap = new Map( [
      [ Params.sourceHeight,               sourceHeight ],
      [ Params.sourceWidth,                sourceWidth ],
      [ Params.sourceChannelCount,         sourceChannelCount ],
      [ Params.stepCountRequested,         stepCountRequested ],
      [ Params.pointwise1ChannelCountRate, pointwise1ChannelCountRate ],
      [ Params.depthwiseFilterHeight,      depthwiseFilterHeight ],
      [ Params.nActivationId,              nActivationId ],
      [ Params.nActivationIdAtBlockEnd,    nActivationIdAtBlockEnd ],
      [ Params.nWhetherShuffleChannel,     nWhetherShuffleChannel ],
      [ Params.bKeepInputTensor,           bKeepInputTensor ],
    ] );

    super( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  /**
   * Extract parameters from inputFloat32Array.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  extract() {
    let bExtractOk = super.extract();
    if ( !bExtractOk )
      return false;

    Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( this, this.sourceHeight, this.sourceWidth );

    return bExtractOk;
  }

  /**
   * Determine the following properties:
   *   - this.outputHeight
   *   - this.outputWidth
   *
   * @param {number} sourceHeight  The height of source image.
   * @param {number} sourceWidth   The width of source image.
   */
  static set_outputHeight_outputWidth_by_sourceHeight_sourceWidth( sourceHeight, sourceWidth ) {

    // By default, the output ( height, width ) is half of the input (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
    //
    // Note: This calculation copied from the getPadAndOutInfo() of
    // (https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts).
    //

    let stridesHeight = 2, stridesWidth = 2;
    this.outputHeight = Math.ceil( sourceHeight / stridesHeight );
    this.outputWidth =  Math.ceil( sourceWidth  / stridesWidth );
  }
  
  get sourceHeight()                { return this.parameterMapModified.get( Params.sourceHeight ); }
  get sourceWidth()                 { return this.parameterMapModified.get( Params.sourceWidth ); }
  get sourceChannelCount()          { return this.parameterMapModified.get( Params.sourceChannelCount ); }

  get stepCountRequested()          { return this.parameterMapModified.get( Params.stepCountRequested ); }
  get pointwise1ChannelCountRate()  { return this.parameterMapModified.get( Params.pointwise1ChannelCountRate ); }

  get depthwiseFilterHeight()       { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get nActivationId()               { return this.parameterMapModified.get( Params.nActivationId ); }
  get nActivationIdName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }
  get nActivationIdAtBlockEnd()     { return this.parameterMapModified.get( Params.nActivationIdAtBlockEnd ); }
  get nActivationIdAtBlockEndName() { return Params.nActivationIdAtBlockEnd.getStringOfValue( this.nActivationIdAtBlockEnd ); }

  get nWhetherShuffleChannel()      { return this.parameterMapModified.get( Params.nWhetherShuffleChannel ); }
  get nWhetherShuffleChannelName()  { return Params.nWhetherShuffleChannel.getStringOfValue( this.nWhetherShuffleChannel ); }

  get bKeepInputTensor()            { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =               new ParamDesc.Int(                   "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                new ParamDesc.Int(                   "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =         new ParamDesc.Int(                   "sourceChannelCount",         1, ( 10 * 1024 ) );
Params.stepCountRequested =         new ParamDesc.Int(                   "stepCountRequested",         1, (  1 * 1024 ) );
Params.pointwise1ChannelCountRate = new ParamDesc.Int(                   "pointwise1ChannelCountRate", 0,             2 );
Params.depthwiseFilterHeight =      new ParamDesc.Int(                   "depthwiseFilterHeight",      1,             9 );
Params.nActivationId =              new ParamDesc.ActivationFunction(    "nActivationId" );
Params.nActivationIdAtBlockEnd =    new ParamDesc.ActivationFunction(    "nActivationIdAtBlockEnd" );
Params.nWhetherShuffleChannel =     new ParamDesc.WhetherShuffleChannel( "nWhetherShuffleChannel" );
Params.bKeepInputTensor =           new ParamDesc.Bool(                  "bKeepInputTensor" );


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
!!! ...unfinished... (2021/10/12)
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
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
   * @param {Params} params
   *   A Params object. The params.extract() will be called to extract parameters.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
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
  * initer( progressParent, params, arrayTemp_forInterleave_asGrouptTwo ) {

    // Both MobileNetV3 and ShuffleNetV2:
    //   - They all do not use (depthwise convolution) channelMultiplier.
    //   - They all use 1x1 (pointwise) convolution to expand channel count.
    //   - They all use 1x1 (pointwise) convolution before depthwise convolution.
    //   - They all use activation function after first pointwise convolution.
    //   - They all use depthwise convolution with ( pad = "same" ).
    //   - They all use depthwise convolution with ( strides = 2 ) for shrinking (halving) height x width.
    //   - They all do use batch normalization (include bias) after pointwise and depthwise convolution.
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
    this.sourceHeight = params.sourceHeight;
    this.sourceWidth = params.sourceWidth;
    this.sourceChannelCount = params.sourceChannelCount;
    this.stepCountRequested = params.stepCountRequested;
    this.pointwise1ChannelCountRate = params.pointwise1ChannelCountRate;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight; // Assume depthwise filter's width equals its height.
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.nActivationIdAtBlockEnd = params.nActivationIdAtBlockEnd;
    this.nActivationIdAtBlockEndName = params.nActivationIdAtBlockEndName;
    this.nWhetherShuffleChannel = params.nWhetherShuffleChannel;
    this.nWhetherShuffleChannelName = params.nWhetherShuffleChannelName;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
      this.outputHeight = params.outputHeight;
      this.outputWidth = params.outputWidth;
    }

    // Pre-allocate array to place intermediate 2 input tensors and 2 output tensors. This could reduce memory re-allocation.
    this.intermediateInputTensors = new Array( 2 );
    this.intermediateOutputTensors = new Array( 2 );

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. Create every steps.
    let stepParamsMaker = Base.create_Params_to_PointDepthPointParams( params );
    stepParamsMaker.determine_stepCount_depthwiseFilterHeight_Default_Last(); // Calculate the real step count.

    for ( let i = 0; i < stepParamsMaker.stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
      progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
    }

    let stepParams, step, stepIniter;

//!!! ...unfinished... (2021/11/10) should check whether channel shuffler is created successfully.
// bInitOk. seems not necessary. because channel shuffler constructor will throw exception when failed.

    this.stepsArray = new Array( stepParamsMaker.stepCount );
    for ( let i = 0; i < this.stepsArray.length; ++i ) { // Step0, 1, 2, 3, ..., StepLast.

      if ( 0 == i ) { // Step0.
        stepParamsMaker.configTo_beforeStep0();
      }

      // StepLast. (Note: Step0 may also be StepLast.) 
      //
      // If this is the last step of this block (i.e. at-block-end)
      //   - a different depthwise filter size may be used.
      //   - a different activation function may be used after pointwise2 convolution.
      if ( ( this.stepsArray.length - 1 ) == i ) {
        stepParamsMaker.configTo_beforeStepLast();
      }

      stepParams = stepParamsMaker.create_PointDepthPointParams( params.defaultInput, this.byteOffsetEnd );

      if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

        // If channelShuffler is not null, keep it so that its tensors could be released.
        let channelShuffler = stepParamsMaker.channelShuffler;
        if ( channelShuffler ) {

          tf.util.assert( ( !this.channelShuffler ) || ( this.channelShuffler == channelShuffler ),
              `Block.initer(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all steps of a block).` );

          this.channelShuffler = channelShuffler;

          this.tensorWeightCountTotal += channelShuffler.tensorWeightCountTotal;
          this.tensorWeightCountExtracted += channelShuffler.tensorWeightCountExtracted;

        // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler will be cleared and could not be used
        // for releasing tensors.
        }

      // If channelShuffler has ever got, never change it.
      }

      step = this.stepsArray[ i ] = new PointDepthPoint.Base();
      stepIniter = step.initer( progressForSteps.children[ i ], stepParams, this.channelShuffler, arrayTemp_forInterleave_asGrouptTwo );

      this.bInitOk = yield* stepIniter;
      if ( !this.bInitOk )
        return false;
      this.byteOffsetEnd = step.byteOffsetEnd;

      this.tensorWeightCountTotal += step.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += step.tensorWeightCountExtracted;

//!!! ...unfinished... (2022/04/28)
      step.dispose_all_sub_BoundsArraySet(); // Reduce memory footprint by release unused bounds array set.

      if ( 0 == i ) { // After step0 (i.e. for step1, 2, 3, ...)
        stepParamsMaker.configTo_afterStep0();
      }
    }

    this.step0 = this.stepsArray[ 0 ]; // Shortcut to the first step.
    this.stepLast = this.stepsArray[ this.stepsArray.length - 1 ]; // Shortcut to the last step.

    this.outputChannelCount = this.stepLast.outChannelsAll;

    {
//!!! ...unfinished... (2022/04/28)
// Create Block self BoundsArraySet.InputsOutputs.

      this.dispose_all_sub_BoundsArraySet(); // Release all steps' bounds array set for reducing memory footprint.
    }

    // In our Block design, no matter which configuration, the outputChannelCount always is twice as sourceChannelCount.
    tf.util.assert( ( this.outputChannelCount == ( this.sourceChannelCount * 2 ) ),
        `Block.initer(): `
          + `the outputChannelCount ( ${this.outputChannelCount} ) should always be twice as `
          + `sourceChannelCount ( ${this.sourceChannelCount} ).` );

    this.bInitOk = true;
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
  init( progressParent, params, arrayTemp_forInterleave_asGrouptTwo ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, params );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.stepsArray ) {
      for ( let i = 0; i < this.stepsArray.length; ++i ) {
        let step = this.stepsArray[ i ];
        step.disposeTensors();
      }
      this.stepsArray = null;
    }

    if ( this.channelShuffler ) {
      this.channelShuffler.disposeTensors(); // Block is responsible for releasing the channel shuffler shared by all steps of the block.
      this.channelShuffler = false;
    }

    this.step0 = this.stepLast = null; // It has already de disposed by this.step0 or this.steps1After.

    this.outputChannelCount = -1;

    this.intermediateInputTensors = this.intermediateOutputTensors = null;

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /**
   * Release all steps' BoundsArraySet. This could reduce memory footprint.
   */
  dispose_all_sub_BoundsArraySet() {
    if ( !this.stepsArray )
      return;

    for ( let i = 0; i < this.stepsArray.length; ++i ) {
      let step = this.stepsArray[ i ];
      delete step.boundsArraySet;
    }
  }

  /**
   * @param {Params} blockParams
   *   The Block.Params object to be reference.
   */
  static create_Params_to_PointDepthPointParams( blockParams ) {

    if ( blockParams.stepCountRequested <= 1 ) {  // 1. Not ShuffleNetV2, Not MobileNetV2.
      return new Params.to_PointDepthPointParams.NotShuffleNet_NotMobileNet( blockParams );

    } else { // ( this.stepCountRequested >= 2 )
      switch ( blockParams.nWhetherShuffleChannel ) {
        case ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE: // (0) 2. MobileNetV2 or MobileNetV1
          // ( pointwise1ChannelCountRate == 0 ), will be similar to MobileNetV1.
          // ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV2 without expanding.
          // ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
          return new Params.to_PointDepthPointParams.MobileNetV2( blockParams );
          break;

        case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER: // (1) 3. ShuffleNetV2
          return new Params.to_PointDepthPointParams.ShuffleNetV2( blockParams );
          break;

        case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22: // (2) 4. ShuffleNetV2_ByPointwise22
          return new Params.to_PointDepthPointParams.ShuffleNetV2_ByPointwise22( blockParams );
          break;

        default:
          tf.util.assert( false,
            `Block.create_Params_to_PointDepthPointParams(): `
              + `unknown this.nWhetherShuffleChannel ( ${blockParams.nWhetherShuffleChannel} ) value.` );
          break;
      }
    }
  }

  /** Process input, destroy or keep input, return result.
   *
   * @param {tf.tensor3d} inputTensor
   *   The source input image ( height x width x channel ) which will be processed. This inputTensor may or may not be disposed
   * according to init()'s bKeepInputTensor.
   *
   * @return {tf.tensor3d}
   *   Return a new tensor. All other intermediate tensors were disposed.
   */
  apply( inputTensor ) {
    let inputTensors = this.intermediateInputTensors;
    let outputTensors = this.intermediateOutputTensors;

    outputTensors[ 0 ] = inputTensor;
    outputTensors[ 1 ] = null; // Note: The step0 should only input one tensor.

    let stepsArray = this.stepsArray;
    let step;
    for ( let i = 0; i < stepsArray.length; ++i ) {
      inputTensors[ 0 ] = outputTensors[ 0 ]; // Previous step's output becomes next step's input.
      inputTensors[ 1 ] = outputTensors[ 1 ];

      step = stepsArray[ i ];
      step.apply( inputTensors, outputTensors );
    }

    return outputTensors[ 0 ]; // Note: The stepLast should only output one tensor.
  }

  /** How many steps inside this blocked are created. (may different from this.stepCountRequested.) */
  get stepCount() {
    return this.stepsArray.length;
  }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `sourceHeight=${this.sourceHeight}, sourceWidth=${this.sourceWidth}, sourceChannelCount=${this.sourceChannelCount}, `
      + `stepCountRequested=${this.stepCountRequested}, stepCount=${this.stepCount}, `
      + `pointwise1ChannelCountRate=${this.pointwise1ChannelCountRate}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `nActivationIdName=${this.nActivationIdName}(${this.nActivationId}), `
      + `nActivationIdAtBlockEndName=${this.nActivationIdAtBlockEndName}(${this.nActivationIdAtBlockEnd}), `
      + `nWhetherShuffleChannel=${this.nWhetherShuffleChannelName}(${this.nWhetherShuffleChannel}), `
      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, outputChannelCount=${this.outputChannelCount}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}


/**
 * Basic class for all Params.to_PointDepthPointParams.Xxx classes.
 *
 * Note: In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
 * has bias internally. We do not have batch normalization in architecture so an explicit bias will be used before every activation
 * function.
 *
 * @member {number} outChannels0
 *   The output0's channel count in current configuration.
 *
 * @member {number} outChannels1
 *   The output1's channel count in current configuration.
 *
 */
Params.to_PointDepthPointParams = class {
  /**
   * @param {Params} blockParams
   *   The Block.Params object which provides basic parameters.
   */
  constructor( blockParams ) {
    this.blockParams = blockParams;

    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.bPointwise1Bias = this.pointwise1ActivationId =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight =
    this.depthwiseStridesPad = this.bDepthwiseBias = this.depthwiseActivationId =
    this.pointwise21ChannelCount = this.bPointwise21Bias = this.pointwise21ActivationId =
    this.bOutput1Requested = this.bKeepInputTensor = undefined;

    this.stepCount = // How many step should be in the block.
    this.depthwiseFilterHeight_Default = // The default depthwise filter size.
    this.depthwiseFilterHeight_Last =    // The last step's depthwise filter size.
    this.outChannels0 = this.outChannels1 = -1;

    this.channelShuffler = undefined;
  }

  /** Called to determine stepCount, depthwiseFilterHeight_Default and depthwiseFilterHeight_Last.
    * Sub-class could override this method to adjust data members.
    */
  determine_stepCount_depthwiseFilterHeight_Default_Last() {
    let blockParams = this.blockParams;
    this.stepCount = blockParams.stepCountRequested; // By default, the step count is just the original step count.

    // By default, all steps uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = blockParams.depthwiseFilterHeight;
  }

  /** Called before step0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Step 0.
   *
   * The special points of a block's step 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels. (By concat if ShuffleNetV2. By second pointwise if MobileNetV2.)
   *   - Expand channels by channelMultiplier of depthwise convolution. (Our ShuffleNetV2_Simplified.)
   */
  configTo_beforeStep0() {}

  /** Called after step0 is created (i.e. before step1, 2, 3, ...). Sub-class should override this method to adjust data members.
   */
  configTo_afterStep0() {}

  /** Called before stepLast is about to be created. Sub-class could override this method to adjust data members. */
  configTo_beforeStepLast() {
    // By default, the stepLast of this block (i.e. at-block-end) may use a different activation function after pointwise2 convolution.
    //
    // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
    this.pointwise21ActivationId = this.blockParams.nActivationIdAtBlockEnd;

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
  }

  /**
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @return {PointDepthPoint.Params}
   *   Create and return a PointDepthPoint.Params according to this object's current state.
   */
  create_PointDepthPointParams( inputFloat32Array, byteOffsetBegin ) {
    let params = new PointDepthPoint.Params(
      inputFloat32Array, byteOffsetBegin,
      this.channelCount0_pointwise1Before,
      this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
      this.bOutput1Requested,
      this.bKeepInputTensor
    );
    return params;
  }
}


/** Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Be ware of ( pointwise1ChannelCountRate == 2 )
 *
 * ShuffleNetV2 always double the channel count. It is achieved by concatenation. This is different from MobileNetV2 which achieves
 * channel count doubling by pointwise1.
 *
 * That is, if ( pointwise1ChannelCountRate == 2 ), there will be 4 times (not 2 times) channels to be processed in fact. It could be
 * expected that the performance will be slower than ( pointwise1ChannelCountRate == 2 ) in MobileNetV2 unfairly.
 *
 * So, the original ShuffleNetV2 should be ( pointwise1ChannelCountRate == 1 ).
 *
 *
 * 2. A special case: NoPointwise1 ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * Q: How to specify this configuration?
 * A: By  (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *         or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ) )
 *    and ( pointwise1ChannelCountRate == 0 )
 *    in the parameters of Block.Params.
 *
 * What is the different of this configuration?
 *
 * When the poitwise1 convolution (of every step (including step 0)) is discarded (i.e. ( pointwise1ChannelCountRate == 0 ) ),
 * the step 0 and step 0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step0 and step0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 *   - Even if the pointwise1 convolution is discarded, just two steps of this simplied ShuffleNetV2 still compose an
 *     effective Fourier series which should have enough expressive power for approximating any function. By given
 *     the following configuration in the Block.Params:
 *       - (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *          or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ) )
 *       - ( pointwise1ChannelCountRate == 0 )
 *       - ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.COS) 
 *       - ( nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE)
 *
 *
 * 3. Drawback when ( pointwise1ChannelCountRate == 0 )
 *
 * Channel shuffler has a characteristic that it always does not shuffle the first and last channel (i.e. the channel 0
 * and channel ( N - 1 ) will always be at the same place). In ShuffleNetV2, the pointwise1 could alleviate this issue
 * a little.
 *   - At the step0's branch of a block, the pointwise1 has a chance (the only one chance) to shuffle the last channel.
 *   - Through step1 to stepLast, the the last channel will always stay stationary.
 *     - It is never shuffled by channel shuffler.
 *     - It is never manipulated by any pointwise2 (because there is no pointwise22 in this ShuffleNetV2 configuration).
 *
 * It is hard to say this characteristic is good or bad.
 *   - In good side, it is easy to keep and pass information to the next block.
 *   - In bad side, it wastes a channel (i.e. the last channel) if there is no information needed to be kept and passed
 *       to the next block.
 *
 * If ( pointwise1ChannelCountRate == 0 ), there will be no pointwise1 (i.e. no chance) to shuffle the (first and) last
 * channel's position.
 *
 * So, it is NOT suggested to use ShuffleNetV2 with ( pointwise1ChannelCountRate == 0 ).
 *
 */
Params.to_PointDepthPointParams.ShuffleNetV2 = class extends Params.to_PointDepthPointParams {

  /** @override */
  determine_stepCount_depthwiseFilterHeight_Default_Last() {
    super.determine_stepCount_depthwiseFilterHeight_Default_Last();

    let blockParams = this.blockParams;

    // Currently, ShuffleNetV2 (and ShuffleNetV2_ByPointwise22) must have at least 2 steps because PointDepthPoint
    // can not achieve the head/body/tail of ShuffleNetV2 at the same time.
    tf.util.assert( this.stepCount >= 2,
      `Block.Params.to_PointDepthPointParams.ShuffleNetV2(): `
        + `stepCount ( ${this.stepCount} ) must be at least 2 in ShuffleNetV2 (and ShuffleNetV2_ByPointwise22).` );
  }

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).

//!!! ...unfinished... (2021/12/23) should be changed to like MobileNetV2:
//   - depthwise always has bias and activation.
//   - pointwise2 always has no bias and no activation.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.bDepthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE; // In ShuffleNetV2, depthwise convolution doesn't have activation.

    // In ShuffleNetV2, all steps' pointwise21 always has bias and activation.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount; // All steps' (except stepLast) output0 is the same depth as source input0.
    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;

    this.bOutput1Requested = true; // In ShuffleNetV2, all steps (except stepLast) have output1 with same depth as source input0.

    // In ShuffleNetV2, all steps usually have pointwise1 convolution before depthwise convolution (i.e. ( pointwise1ChannelCountRate > 0 ) ).
    // Its channel count is adjustable by user's request. Usually, ( pointwise1ChannelCountRate == 1 ). If ( pointwise1ChannelCountRate == 0 ),
    // it is the same as no pointwise1.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate;

    // NoPointwise1 ShuffleNetV2 (expanding by once depthwise).
    //
    // If step0 does not have pointwise1 convolution before depthwise convolution, the depthwise2
    // convolution (in original ShuffleNetV2) is not needed. Then, a simpler configuration could be used.
    //
    // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
    if ( this.pointwise1ChannelCount == 0 ) {
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
    }

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    // In ShuffleNetV2, all steps (except stepLast) have both output0 and output1 with same depth as pointwise21 result.
    this.outChannels0 = this.outChannels1 = this.pointwise21ChannelCount;
  }

  /** @override */
  configTo_afterStep0() {
    let step0_outChannelsAll = this.outChannels0 + this.outChannels1;

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise21's result. The result of pointwise21 (which operates on input0)
    // will be concatenated with input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    this.depthwiseStridesPad = 1;  // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.

    // In ShuffleNetV2, all steps (except step0) uses channel shuffler (with two convolution groups).
    {
      let outputGroupCount = 2; // Always with two convolution groups.
      let concatenatedDepth = step0_outChannelsAll; // All steps always have the same total output channel count as step0.
      let concatenatedShape = [ this.blockParams.sourceHeight, this.blockParams.sourceWidth, concatenatedDepth ];
      this.channelShuffler = new ChannelShuffler.ConcatPointwiseConv( concatenatedShape, outputGroupCount );
    }
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2, the stepLast only has output0 (no output1).
    //
    // The output0:
    //   - It will have double channel count of source input0.
    //   - It is the concatenation of pointwise21's result and input1.
    this.bOutput1Requested = false;

    this.outChannels0 = this.outChannels0 + this.outChannels1;
    this.outChannels1 = 0;
  }
}


/** Provide parameters for ShuffleNetV2_ByPointwise22 (i.e. shuffle channel by pointwise22).
 *
 * 1. ShuffleNetV2_ByPointwise22:
 *
 * Since channel shuffler could achieved efficiently by pointwise convolution, it is possible to combine the pointwise2
 * convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
 *   - Concatenate the output of depthwise convolution and the other output group.
 *   - Pointwise convolution to generate output group 1.
 *   - Pointwise convolution to generate output group 2.
 *
 * Although the channel shuffler is achieved by pointwise convolution without bias and activation function, however,
 * the pointwise21 convolution (before channel shuffler) indeed has bias and activation function. After combining
 * these two pointwise convolutions (the original pointwise2 and the channel shuffler), the total result is twice
 * pointwise convolution: pointwise21 and pointwise22. They should all have bias and activation function to achieve
 * both pointwise convolution and channel-shuffling.
 *
 * The pointwise21 and pointwise22 convolution achieves not only pointwise convolution but also channel shuffling.
 * Suppose the input channel count is M. Compare ours to the original ShuffleNetV2:
 *
 * <pre>
 *                            +-------------------------------------------------------------------------------+------------+------------+----------+
 *                            |                       pointwise2 convolution                                  |    bias    | activation | function |
 *                            |-----------------------------------------------------------------+-------------|            |            |   calls  |
 *                            |                             weights                             | computation |            |            |          |
 *                            |--------------------------------+--------------------------------|             |            |            |          |
 *                            |          independent           | shared (for channel shuffling) |             |            |            |          |
 * +----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step0    | Original      | ( M *  M ) + ( M *  M ) = 2M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        6M^2 | M + M = 2M | M + M = 2M |        8 |
 * |          | Simplified    | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |          | Compare       |                     worse 2M^2 |                    better 4M^2 | better 2M^2 |       same |       same | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step1    | Original      |              ( M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * | Step2    | ByPointwise22 | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |   :      | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M |  worse 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | ByPointwise22 |             ( 2M * 2M ) = 4M^2 |                              0 |        4M^2 |         2M |         2M |        3 |
 * |          | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | Simplified    |             (  M *  M ) =  M^2 |                              0 |         M^2 |          M |          M |        3 |
 * |          | Compare       |                           same |                    better 4M^2 | better 4M^2 |       same |       same | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * </pre>
 *
 * Step0:
 *   - Two less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights.
 *   - Better.
 *
 * Step1, Step2, ..., Step(N - 1):
 *   - One less pointwise convolution computation.
 *   - But more independent pointwise weights, more bias, more activation function, two more function calls.
 *   - Worse.
 *
 * StepLast:
 *   - One less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights, more bias and more activation function.
 *   - May be better or worse.
 *
 * In summary, this method may result in a slower ShuffleNetV2.
 *
 *
 * 2. Better when ( pointwise1ChannelCountRate == 0 )
 *
 * Different from ShufflerNetV2, the issue of the first and last channel fixed at stationary place does not exist in this
 * ShuffleNetV2_ByPointwise22. The reason is that it uses non-shared pointwise2 instead of channel shuffler. This lets
 * ( pointwise1ChannelCountRate == 0 ) become feasible because it no longer relies on pointwise1 to change the first and
 * last channel position.
 *
 * In addition, the redued computation (because of no pointwise1) could compansate the extra computation (because of
 * non-shared pointwise2).
 *
 * It is suggested to use ShuffleNetV2_ByPointwise22 with ( pointwise1ChannelCountRate == 0 ).
 *
 *
 */
Params.to_PointDepthPointParams.ShuffleNetV2_ByPointwise22 = class extends Params.to_PointDepthPointParams.ShuffleNetV2 {

  /** @override */
  configTo_afterStep0() {
    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;
    this.channelCount1_pointwise1Before = this.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1; // All steps (except step0 if NoPointwise1 ShuffleNetV2) will not double the channel count.
    this.depthwiseStridesPad = 1;  // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2_ByPointwise22, the stepLast only has output0 (no output1). And the output0 has double channel count of
    // source input0.
    //
    // Note: Although pointwise21 channel count changed, however, the pointwise1ChannelCount is not changed because the final
    // output0 is viewed as concatenation of pointwise21 and pointwise22. In pointwise1's point of view, its pointwise2 does
    // not changed.
    this.pointwise21ChannelCount = this.blockParams.sourceChannelCount * 2;
    this.bOutput1Requested = false;
  }
}


//!!! ...unfinished... (2021/10/14)
/*
 * Accodring to testing, the original ShuffleNetV2 is faster than MobileNetV2 in backend CPU. This may result from lesser
 * computation. However, in backend WASM and WEBGL, MobileNetV2 is faster than the original ShuffleNetV2. The possible
 * reason may be that the concatenation-shuffle-split (even achieved by pointwise convolution) operation is not friendly
 * for WASM and WEBGL.
 *
 * This results in an idea that:
 *   - Use MobileNetV2 structure but with ( pointwise1ChannelCountRate == 1 ) and without add-input-to-output. (So, it is more
 *       like MobileNetV1.)
 *   - Manipulate the filter weights of pointwise1, depthwise1, pointwise21 so that they achieve the same effect of shuffling
 *       but without concatenation and splitting.
 *
 * This may become a faster ShuffleNetV2 in backend WASM and WEBGL (but a slower ShuffleNetV2 in backend CPU).
 *
 *
 * Q1: Why not just use MobileNet instead of ShuffleNetV2, since its structure is MobileNet?
 * A1: The filter weights count is different. MobileNet has more (a lot) filter weights needed to be learned than ShuffleNetV2.
 *     The learning (or say, evolving) performance should be faster by using ShuffleNetV2 (rather than MobileNet).
 *

//!!! ...unfinished... (2021/12/23)

 * Q2: Why pointwise21 has bias but has no activation?
 * A2: So that the activation escaping scale-translate of pointwise1 and depthwise1 can be undone.
 *
 * Otherwise, when channelCount1_pointwise1Before == ONE_INPUT_HALF_THROUGH (-5) (ShuffleNetV2_ByMobileNetV1's body/tail),
 * the pointwise1's pass-through can not undo the previous PointDepthPoint's pointwise21 activation escaping scale-translate.
 * The reason is:
 *  - The previous PointDepthPoint's pointwise21 has shuffled the channels.
 *  - The channels tweaked by activation escaping scale-translate are interleaved with other normal channels.
 *  - They are not all in the higher-half channels of this PointDepthPoint's pointwise1.
 *
 * So, force pointwise21 (which is always exists) always with bias and without activation.
 *   - So the pointwise21 could undo all previous activation escaping scale-translate (because it has bias).
 *   - And itself will not tweak its result by activation escaping scale-translate (because it does not have activation).
 *
 */
Params.to_PointDepthPointParams.ShuffleNetV2_ByMobileNetV1 = class extends Params.to_PointDepthPointParams.ShuffleNetV2 {

//!!! ...unfinished... (2021/10/14)

//!!! ...unfinished... (2021/11/12)
// When ( pointwise1ChannelCount == 0 ) (i.e. depthwise channel multiplier is 2 ), the depthwise should be just
// the same as Params.to_PointDepthPointParams.ShuffleNetV2_ByPointwise22 and Params.to_PointDepthPointParams.ShuffleNetV2.
//
//     if ( this.pointwise1ChannelCount == 0 ) {
//       this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
//       this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
//     }
//
// That is the depthwise needs use ( bHigherHalfDifferent == false ) in this case.

}


/** Provide parameters for MobileNetV2 (i.e. with pointwise1, with add-input-to-output).
 *
 *
 * 1. Be ware of ( pointwise1ChannelCountRate == 1 )
 *
 * MobileNetV2 double the channel count by pointwise1. This is different from ShuffleNetV2 which achieves channel count doubling
 * by concatenation.
 *
 * That is, if ( pointwise1ChannelCountRate <= 1 ), there will be only 1 times (not 2 times) channels to be processed in fact.
 * It could be expected that the performance will be faser than ( pointwise1ChannelCountRate == 1 ) in ShuffleNetV2 unfairly.
 *
 * So, the original MobileNetV2 should be ( pointwise1ChannelCountRate == 2 ).
 *
 *
 */
Params.to_PointDepthPointParams.MobileNetV2 = class extends Params.to_PointDepthPointParams {

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;

//!!! (2021/10/11 Remarked) Unfortunately, the sub-class (i.e. NotShuffleNet_NotMobileNet) also call this method.
//     // Currently, MobileNetV2 must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail
//     // of MobileNetV2 at the same time.
//     //
//     // Ideally, this assertion should be placed in determine_stepCount_depthwiseFilterHeight_Default_Last(). However,
//     // the sub-class (i.e. NotShuffleNet_NotMobileNet) could accept step count less than 2. So, assert here.
//     tf.util.assert( this.stepCount >= 2,
//       `Block.Params.to_PointDepthPointParams.MobileNetV2(): `
//         + `stepCount ( ${this.stepCount} ) must be at least 2 in MobileNetV2.` );

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV2:
    //   - Step0 can not do add-input-to-output because the input0's ( height, width ) has been halven.
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                  // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.bDepthwiseBias = true;
    this.depthwiseActivationId = blockParams.nActivationId;

    // In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2; // In MobileNetV2, all steps' output0 is twice depth of source input0.

    // In MobileNetV2, since there is no activation function after pointwise21, it needs not bias after pointwise21. The reason
    // is the pointwise1 of the next step has bias before activation to complete affine transformation.
    this.bPointwise21Bias = false;

    // In MobileNetV2, the second 1x1 pointwise convolution doesn't have activation function in default.
    //
    // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
    this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    this.bOutput1Requested = false;                                  // In MobileNetV2, all steps do not have output1.

    // In MobileNet, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    // If ( pointwise1ChannelCountRate == 0 ), it is the same as no pointwise1.
    //
    // Q: How to know whether it is MobileNetV2 or MobileNetV1?
    // A: By pointwise1ChannelCountRate.
    //   - If ( pointwise1ChannelCount == 0 ), similar to MobileNetV1. ( pointwise1ChannelCountRate == 0 )
    //   - If ( pointwise1ChannelCount <  pointwise21ChannelCount ), similar to ResNet. (can not be expressed by Block.Params)
    //   - If ( pointwise1ChannelCount == pointwise21ChannelCount ), similar to MobileNetV2 without expanding. ( pointwise1ChannelCountRate == 1 )
    //   - If ( pointwise1ChannelCount >  pointwise21ChannelCount ), similar to MobileNetV2. ( pointwise1ChannelCountRate == 2 )
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate; // In MobileNetV2, the rate is usually 2.

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

    this.depthwiseStridesPad = 1;  // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }
  
  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In MobileNetV2, although there is no activation function after pointwise21, it should have bias after pointwise21 for
    // the stepLast. The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
    // transformation. It must do it by itself.
    this.bPointwise21Bias = true;
  }

}


/** Provide parameters for pure depthwise-pointwise convolutions.
 *
 * This configuration is similar to MobileNetV2 but with ( depthwiseStridesPad == 0 ), automatic step count, varing
 * depthwiseFilterHeight, bias-activation at pointwise2 (not at depthwise), and withput add-input-to-output.
 *
 * Since it is similar to MobileNetV2, its performance could be compared to MobileNetV2 more eaily. Interestingly,
 * it is usually slower than MobileNetV2. The reason might be MobileNetV2's step0 uses ( depthwiseStridesPad == 2 ).
 * This shrinks ( height, width ) quickly so that data are reduced a lot.
 *
 */
Params.to_PointDepthPointParams.NotShuffleNet_NotMobileNet = class extends Params.to_PointDepthPointParams.MobileNetV2 {

  /**
   * Compute how many step shoud be used and what is the last step's depthwise filter size, when shrink sourceHeight to outputHeight
   * by depthwise convolution with ( strides = 1, pad = "valid" ).
   *
   * The this.stepCount will be at least 1 (never 0).
   * The this.depthwiseFilterHeight_Last will be at least 1 (at most this.blockParams.depthwiseFilterHeight).
   * 
   * @override
   */
  determine_stepCount_depthwiseFilterHeight_Default_Last() {
    super.determine_stepCount_depthwiseFilterHeight_Default_Last(); // Got default value.

    let blockParams = this.blockParams;

    let differenceHeight = blockParams.sourceHeight - blockParams.outputHeight;
    //let differenceWidth =  blockParams.sourceWidth  - blockParams.outputWidth;

    if ( 0 == differenceHeight ) { // 1. No difference between source and output size.
      this.stepCount = 1; // Only one step is needed. (Avoid no steps. At least, there should be one step.)

      // The only one step (also the first and last step) should use filter size 1x1 so that the input size could be kept.
      this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = 1;

    } else {

      // Since difference between source and output exists, the filter size should be larger than 1x1.
      if ( this.depthwiseFilterHeight_Default <= 1 )
        this.depthwiseFilterHeight_Default = 2; // Otherwise, the image size could not be shrinked.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerStep = this.depthwiseFilterHeight_Default - 1;

      // The possible step count for reducing sourceHeight to outputHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      //
      // This value may be less than real step count because the filter size of the last step may be larger than its input.
      let stepCountCandidate = Math.floor( differenceHeight / heightReducedPerStep );

      let differenceHeightLast = differenceHeight - ( stepCountCandidate * heightReducedPerStep ); // The last step should reduce so many height.
      if ( 0 == differenceHeightLast ) {
        // 2. The original depthwiseFilterHeight could achieve the output size at the last step. 
        this.stepCount = stepCountCandidate; // It is the real step count.
        this.depthwiseFilterHeight_Last = this.depthwiseFilterHeight_Default; // The last step uses the default depthwise filter size is enough.

      } else {

        // 3. The original depthwiseFilterHeight could not achieve the output size at the last step.
        //    It is larger than the last step's input size. An extra step with a smaller filter size is needed.
        this.stepCount = stepCountCandidate + 1; // Needs one more step.

        // The extra last step's depthwise filter size should just eliminate the last diffference.
        this.depthwiseFilterHeight_Last = differenceHeightLast + 1;
      }
    }
  }

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // Almost the same as MobileNetV2.

    let blockParams = this.blockParams;
    this.depthwiseStridesPad = 0; // In NotShuffleNet_NotMobileNet, always ( strides = 1, pad = "valid" ).

    // In NotShuffleNet_NotMobileNet, depthwise convolution doesn't have activation.
    //
    // Because NotShuffleNet_NotMobileNet does not have add-input-to-output (different from MobileNetV2), its pointwise2 should
    // have bias and activation. Otherwise, the pointwise2 and the pointwise1 of the next step will become one (not two) affine
    // transformation.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.bDepthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    // In NotShuffleNet_NotMobileNet, all steps' pointwise21 always has bias and activation.
    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // Almost the same as MobileNetV2.

    // In NotShuffleNet_NotMobileNet:
    //   - All steps (include step0) without add-input-to-output (and without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.depthwiseStridesPad = 0; // In NotShuffleNet_NotMobileNet, always ( strides = 1, pad = "valid" ).
  }

}
