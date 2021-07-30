export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as PointDepthPoint from "./PointDepthPoint.js";

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
   *
   *   - If zero (== 0), the step count will be automatically calculated so that the block's output has half of source's
   *     ( height, width ) and double channel count (depth).
   *       - Every step will use depthwise convolution ( strides = 1, pad = "valid" ) and pointwise21. So every step will
   *         shrink the input a little.
   *       - The step0's depthwise convolution will also use channel multiplier 2 to double the channel count.
   *       - The stepLast may use a smaller depthwise filter so that it could just make half source size as output size.
   *       - If ( depthwiseFilterHeight == 1 ), the depthwiseFilterHeight will become 2 forcibly. Otherwise, the source size
   *         could not be shrinked.
   *
   *   - If positive (>= 1), this block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink (i.e. to halve
   *       height x width) and use ( stepCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until
   *       the block end.
   *
   * @param {boolean} bChannelShuffler
   *   Whether a (concatenator and) channel shuffler will be used.
   *   - If ( stepCountPerBlock == 0 ), this flag will be ignored. There will be no channel shuffler.
   *   - If ( bChannelShuffler == true ), this block will be similar to ShuffleNetV2 (i.e. split and concat channels).
   *   - If ( bChannelShuffler == false ), this block will be similar to MobileNetV1 or MobileNetV2 (i.e. with add-input-to-output).
   *   - If ( bChannelShuffler == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} pointwise1ChannelCountRate
   *   The first 1x1 pointwise convolution output channel count over of the second 1x1 pointwise convolution output channel count.
   * That is, pointwise1ChannelCount = ( pointwise2ChannelCount * pointwise1ChannelCountRate ).
   *   - If ( stepCountPerBlock == 0 ), this rate will be ignored. There will be no first 1x1 pointwise.
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
   *   - If ( pointwise1ChannelCountRate == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
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

    // Q: Why the depthwiseChannelMultiplierStep0 is not listed as a parameter?
    // A: After considering the following reasons, it is worth to drop this parameter.
    //
    //   - In reality, it is almost no reason to use only avg/max pooling to compose a block because it keep too little information
    //     for the next block.
    //
    //   - If depthwiseChannelMultiplierStep0 is specified as Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0), the input
    //     image will not be shrinked a little (for ( stepCountPerBlock <= 0 )) or will not be halven (for ( stepCountPerBlock >= 1 ).
    //     If it is still a parameter it should be forced to 1 at least (always needs depthwise operation) in this case.
    //

    let parameterMap = new Map( [
      [ Params.stepCountPerBlock,                stepCountPerBlock ],
      [ Params.bChannelShuffler,                 bChannelShuffler ],
      [ Params.pointwise1ChannelCountRate,       pointwise1ChannelCountRate ],
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
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. will be kept). If it is null, it will be viewed as falsy
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

//!!! ...unfinished... (2021/07/30) should be moved into Params. Then ParamsConfig constructor accept Params (instead of Base).
// So that ParamsConfig could be tested individually.
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
    this.depthwiseFilterHeight = params.depthwiseFilterHeight; // Assume depthwise filter's width equals its height.
    this.bBias = params.bBias;
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.nActivationIdAtBlockEnd = params.nActivationIdAtBlockEnd;
    this.nActivationIdAtBlockEndName = params.nActivationIdAtBlockEndName;

    // Pre-allocate array to place intermediate 2 input tensors and 2 output tensors. This could reduce memory re-allocation.
    this.intermediateInputTensors = new Array( 2 );
    this.intermediateOutputTensors = new Array( 2 );

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.


//!!! ...unfinished... (2021/07/30) Perhaps, moved to Params.outputHeight() as a standalone function.

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

    
    let paramsConfig = Base.createParamsConfig.call( this );
    paramsConfig.determine_stepCount_depthwiseFilterHeightLast(); // Calculate the real step count.

    for ( let i = 0; i < paramsConfig.stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
      progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
    }

    let params, step, stepIniter;

    this.stepsArray = new Array( paramsConfig.stepCount );
    for ( let i = 0; i < this.stepsArray.length; ++i ) { // Step1, 2, 3, ...

      if ( 0 == i ) { // Step0.
        paramsConfig.configTo_beforeStep0();
      }

      // If this is the last step of this block (i.e. at-block-end)
      //   - a different depthwise filter size may be used.
      //   - a different activation function may be used after pointwise2 convolution.
      if ( ( this.stepsArray.length - 1 ) == i ) {
        paramsConfig.configTo_beforeStepLast();
      }

      params = new PointDepthPoint.Params(
        params.defaultInput, this.byteOffsetEnd,
        paramsConfig.channelCount1_pointwise1Before,
        paramsConfig.pointwise1ChannelCount, paramsConfig.pointwise1Bias, paramsConfig.pointwise1ActivationId,
        paramsConfig.depthwise_AvgMax_Or_ChannelMultiplier, paramsConfig.depthwiseFilterHeight,
        paramsConfig.depthwiseStridesPad, paramsConfig.depthwiseBias, paramsConfig.depthwiseActivationId,
        paramsConfig.pointwise21ChannelCount, paramsConfig.pointwise21Bias, paramsConfig.pointwise21ActivationId,
        paramsConfig.pointwise22ChannelCount, paramsConfig.pointwise22Bias, paramsConfig.pointwise22ActivationId,
      )

      step = this.stepsArray[ i ] = new PointDepthPoint.Base();
      stepIniter = step.initer( progressForSteps.children[ i ],
        paramsConfig.channelCount0_pointwise1Before, paramsConfig.bShouldKeepInputTensor, params );

      this.bInitOk = yield* stepIniter;
      if ( !this.bInitOk )
        return false;
      this.byteOffsetEnd = this.step.byteOffsetEnd;

      if ( 0 == i ) { // After step0 (i.e. for step1, 2, 3, ...)
        paramsConfig.configTo_afterStep0( step );
      }
    }

    this.step0 = this.stepsArray[ 0 ]; // Shortcut to the first step.
    this.stepLast = this.stepsArray[ this.stepsArray.length - 1 ]; // Shortcut to the last step.

    this.outputChannelCount = this.stepLast.outChannelsAll;

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
    if ( this.stepsArray ) {
      for ( let i = 0; i < this.stepsArray.length ) {
        let step = this.stepsArray[ i ];
        step.disposeTensors();
      }
      this.stepsArray.length = 0;
    }

    this.step0 = this.stepLast = null; // It has already de disposed by this.step0 or this.steps1After.

    this.apply_and_destroy_or_keep = null;
    this.outputChannelCount = -1;

    this.intermediateInputTensors = this.intermediateOutputTensors = null;
    
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /**
   * @param {Base} this
   *   The Block object to be reference.
   */
  static createParamsConfig() {
//!!! ...unfinished... (2021/07/30) Why not use a single parameter?
//    *   - If ( stepCountPerBlock == 0 ), this rate will be ignored. There will be no first 1x1 pointwise.
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.

    if ( this.stepCountPerBlock == 0 ) {  // Not ShuffleNetV2, Not MobileNetV2.
      return new ParamsConfig_NotShuffleNet_NotMobileNet( this );

    } else {
      if ( this.bChannelShuffler == true ) {
        if ( this.pointwise1ChannelCountRate == 0 ) { // will be simplified ShuffleNetV2 (expanding by once depthwise).
          return new ParamsConfig_ShuffleNetV2_Simplified( this );

        } else { // ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
          return new ParamsConfig_ShuffleNetV2( this );

        }
      } else { // ( bChannelShuffler == false )
        // ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
        // ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
        return new ParamsConfig_MobileNet( this );
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
  apply_and_destroy_or_keep( inputTensor ) {
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
}


/**
 * Basic class for all ParamsConfig_Xxx classes.
 */
class ParamsConfig {
  /**
   * @param {Base} block
   *   The Block object which provides basic parameters.
   */
  constructor( block ) {
    this.block = block;

    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.pointwise21ChannelCount = this.pointwise22ChannelCount =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight = this.depthwiseStridesPad = 0;

    // By default, all convolution use the same bias flag and activation function.
    this.pointwise1Bias = this.depthwiseBias = this.pointwise21Bias = this.pointwise22Bias = block.bBias;
    this.pointwise1ActivationId = this.depthwiseActivationId = this.pointwise21ActivationId = this.pointwise22ActivationId = block.nActivationId;

    this.bShouldKeepInputTensor = false;

    this.stepCount = -1; // How many step should be in the block.
    this.depthwiseFilterHeightLast = -1; // The last step's depthwise filter size.
  }

  /** Called to determine stepCount and depthwiseFilterHeightLast. Sub-class could override this method to adjust data members. */
  determine_stepCount_depthwiseFilterHeightLast() {
    let block = this.block;
    this.stepCount = block.stepCountPerBlock; // By default, the step count is just the original step count.
    this.depthwiseFilterHeightLast = block.depthwiseFilterHeight; // By default, the last step still uses the original depthwise filter size.
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
   *
   * @param {PointDepthPoint.Base} step0
   *   The just created step0 object.
   */
  configTo_afterStep0( step0 ) {}

  /** Called before stepLast is about to be created. Sub-class could override this method to adjust data members. */
  configTo_beforeStepLast() {
    // By default, the stepLast of this block (i.e. at-block-end) may use a different activation function after pointwise2 convolution.
    //
    // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
    this.pointwise21ActivationId = this.pointwise22ActivationId = block.nActivationIdAtBlockEnd;

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeightLast;
  }
}


/** Privode parameters for pure depthwise-pointwise convolutions. */
class ParamsConfig_NotShuffleNet_NotMobileNet extends ParamsConfig {
  /**
   * Compute how many step shoud be used and what is the last step's depthwise filter size, when shrink sourceHeight to outputHeight
   * by depthwise convolution with ( strides = 1, pad = "valid" ).
   *
   * The this.stepCount will be at least 1 (never 0).
   * The this.depthwiseFilterHeightLast will be at least 1 (at most this.block.depthwiseFilterHeight).
   *
   * The this.block.depthwiseFilterHeight might be modified.
   * 
   * @override
   */
  determine_stepCount_depthwiseFilterHeightLast() {
    let block = this.block;

    let differenceHeight = block.sourceHeight - block.outputHeight;
    //let differenceWidth =  block.sourceWidth  - block.outputWidth;

    if ( 0 == differenceHeight ) { // 1. No difference between source and output size.
      this.stepCount = 1;                 // Only one step is needed. (Avoid no steps. At least, there should be one step.)
      this.depthwiseFilterHeightLast = 1; // The last (and only one) ste should use filter size 1x1 so that the input size could be kept.
    }

    // Since difference between source and output exists, the filter size should be larger than 1x1.
    if ( block.depthwiseFilterHeight <= 1 )
      block.depthwiseFilterHeight = 2; // Otherwise, the image size could not be shrinked.

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = block.depthwiseFilterHeight - 1;

    // The possible step count for reducing sourceHeight to outputHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
    //
    // This value may be less than real step count because the filter size of the last step may be larger than its input.
    let stepCountCandidate = Math.floor( differenceHeight / heightReducedPerStep );

    let differenceHeightLast = differenceHeight - ( stepCountCandidate * heightReducedPerStep ); // The last step should reduce so many height.
    if ( 0 == differenceHeightLast ) {
      // 2. The original depthwiseFilterHeight could achieve the output size at the last step. 
      this.stepCount = stepCountCandidate; // It is the real step count.
      this.depthwiseFilterHeightLast = block.depthwiseFilterHeight; // The last step uses the original depthwise filter size is enough.
    }

    // 3. The original depthwiseFilterHeight could not achieve the output size at the last step.
    //    It is larger than the last step's input size. An extra step with a smaller filter size is needed.
    this.stepCount = stepCountCandidate + 1; // Needs one more step.

    // The extra last step's depthwise filter size should just eliminate the last diffference.
    this.depthwiseFilterHeightLast = differenceHeightLast + 1;
  }

  /** @override */
  configTo_beforeStep0() {
    let block = this.block;
    this.channelCount0_pointwise1Before = block.sourceChannelCount; // Step0 uses the original input channel count.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
    this.pointwise1ChannelCount = 0;  // In this mode, always no pointwise convolution before depthwise convolution.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                 // Step0 double the channel count by depthwise channel multiplier.
    this.depthwiseFilterHeight = block.depthwiseFilterHeight;       // All steps (except stepLast) uses default depthwise filter size.
    this.depthwiseStridesPad = 0;                                   // In this mode, always ( strides = 1, pad = "valid" ).
    this.pointwise21ChannelCount = block.sourceChannelCount * block.depthwise_AvgMax_Or_ChannelMultiplier; // Step0 will double channel count.
    this.pointwise22ChannelCount = 0;                               // In this mode, always no second output.
    this.bShouldKeepInputTensor = block.bKeepInputTensor;           // Step0 may or may not keep input tensor according to caller's necessary.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    let block = this.block;
    this.channelCount0_pointwise1Before = step0.outChannelsAll; // Step0's output channel count is all the other steps' input channel count.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;             // Except step0, all other steps will not double the channel count.
    this.pointwise21ChannelCount = step0.outChannelsAll;        // Step0's output channel count is all the other steps' output channel count.
    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }
}


/** Privode parameters for simplified ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * Q: How to specify this configuration?
 * A: By ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 0 ) in the parameters of Block.Base.
 *
 * (Our) Adjusted ShuffleNetV2:
 *  
 * Since channel shuffler could achieved efficiently by pointwise convolution, it may be possible to combine the pointwise2
 * convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
 *   - Concatenate the output of depthwise convolution and the other output group.
 *   - Pointwise convolution to generate output group 1.
 *   - Pointwise convolution to generate output group 2.
 *
 * Although the channel shuffler is achieved by pointwise convolution without bias and activation function, however,
 * the second pointwise convolution (before channel shuffler) indeed has bias and activation function. After combining
 * these two pointwise convolutions (the original second and the channel shuffler), the total result is twice pointwise
 * convolution with bias and activation function.
 *
 * If the poitwise1 convolution (of every step (include step 0 too)) could be discarded, the step 0 and step 0's branch could
 * be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
 *   - No need to concatenate because the above operation already double channel count.
 *   - twice pointwise2 convolution (every has same as block's input channel count).
 *
 * And, the step 1 (, 2, 3, ..., ( n - 2 ) ) could be achieved by:
 *   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
 *   - concatenate.
 *   - twice pointwise2 convolution (every has same as block's input channel count).
 *
 * And, the last step (i.e. step ( n - 1 ) ) of the block could be achieved by:
 *   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
 *   - concatenate.
 *   - once pointwise2 convolution (has double of block's input channel count).
 *
 * Note that:
 *   - The depthwise convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step 0 and step 0's branch. So, it is one less depthwise
 *     convolution, and one less concatenating.
 *
 *   - The twice pointwise2 convolution (every has same as block's input channel count) achieves not only pointwise
 *     convolution but also channel shuffling. So, it is one less pointwise convolution.
 *
 *   - The once pointwise2 convolution (has double of block's input channel count) of last step achieves simultaneously
 *     pointwise convolution, channel shuffling, and concatenating. So, it is not only one less pointwise convolution,
 *     but also one less concatenating.
 *
 *   - Even if the pointwise1 convolution is discarded and the pointwise2 convolution does not have bias and activation
 *     function, the depthwise convolution (with bias and COS as activation function) and pointwise2 convolution together
 *     compose an effective Fourier series which should have enough expressive power for approximating any function.
 *
 */
class ParamsConfig_ShuffleNetV2_Simplified extends ParamsConfig_ShuffleNetV2 {
  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0();                    // Almost the same as ParamsConfig_ShuffleNetV2. Except the followings.

    // In this case, ( pointwise1ChannelCountRate == 0 ) so that ( this.pointwise1ChannelCount == 0 ) must true.
    //
    // In other words, step0 does not have pointwise1 convolution before depthwise convolution. So the second
    // depthwise convolution (in original ShuffleNetV2) is not needed. Then, a simpler configuration could be
    // used.
    //
    // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.

    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    super.configTo_afterStep0( step0 );               // Almost the same as ParamsConfig_ShuffleNetV2. Except the following.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;   // All steps (except step0) will not double the channel count.

    // Note: ( this.pointwise1ChannelCount == 0 ) still true here. All steps do not have pointwise1 convolution before depthwise convolution.
  }
}


/** Privode parameters for ShuffleNetV2 (i.e. with pointwise1, with concatenator). */
class ParamsConfig_ShuffleNetV2 extends ParamsConfig {
  /** @override */
  configTo_beforeStep0() {
    let block = this.block;
    this.channelCount0_pointwise1Before = block.sourceChannelCount; // Step0 uses the original input channel count (as input0).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                 // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.block.depthwiseFilterHeight;  // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                   // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.depthwiseBias = false;
    this.depthwiseActivationId = PointDepthPoint.Params.Activation.Ids.NONE; // In ShuffleNetV2, depthwise convolution doesn't have activation.

    this.pointwise21ChannelCount = block.sourceChannelCount; // All steps' (except stepLast) output0 is the same depth as source input0.
    this.pointwise22ChannelCount = block.sourceChannelCount; // All steps' (except stepLast) output1 is the same depth as source input1.

    // In ShuffleNetV2, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * block.pointwise1ChannelCountRate; // In ShuffleNetV2, the rate is usually 1.

    this.bShouldKeepInputTensor = block.bKeepInputTensor;    // Step0 may or may not keep input tensor according to caller's necessary.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    let block = this.block;
    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = step0.outChannels0;
    this.channelCount1_pointwise1Before = step0.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).
    this.depthwiseStridesPad = 1;        // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2, the stepLast only has output0 (no output1). And the output0 has double channel count of source input0.
    //
    // Note: Although pointwise21 channel count changed, however, the pointwise1ChannelCount is not changed because the final
    // output0 is viewed as concatenation of pointwise21 and pointwise22. In pointwise1's point of view, its pointwise2 does
    // not changed.
    this.pointwise21ChannelCount = block.sourceChannelCount * 2;
    this.pointwise22ChannelCount = 0;
  }
}

/** Privode parameters for MobileNetV1 or MobileNetV2 (i.e. with pointwise1, with add-input-to-output). */
class ParamsConfig_MobileNet extends ParamsConfig {
  /** @override */
  configTo_beforeStep0() {
    let block = this.block;
    this.channelCount0_pointwise1Before = block.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNet, all steps (include step0) do not use input1 and do add-input-to-output (without concatenation).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                 // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.block.depthwiseFilterHeight;  // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                   // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).

    this.pointwise21ChannelCount = block.sourceChannelCount * 2; // In MobileNetV2, all steps (include step0) output0 is twice depth of source input0.
    this.pointwise22ChannelCount = 0;                            // In MobileNetV2, all steps (include step0) do not have output1.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.pointwise2Bias = false;

    // In MobileNetV2, the second 1x1 pointwise convolution doesn't have activation function in default.
    //
    // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
    this.pointwise2ActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

    // In MobileNet, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    //
    // Q: How to know whether it is MobileNetV2 or MobileNetV1?
    // A: By pointwise1ChannelCountRate.
    //   - If ( pointwise1ChannelCount < pointwise2ChannelCount ), similar to ResNet.
    //   - If ( pointwise1ChannelCount == pointwise2ChannelCount ), similar to MobileNetV1 or ShufffleNetV2.
    //   - If ( pointwise1ChannelCount > pointwise2ChannelCount ), similar to MobileNetV2.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * block.pointwise1ChannelCountRate; // In MobileNetV2, the rate is usually 2.

    this.bShouldKeepInputTensor = block.bKeepInputTensor;    // Step0 may or may not keep input tensor according to caller's necessary.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    let block = this.block;

    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = step0.outChannels0;

    this.depthwiseStridesPad = 1;        // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }
}
