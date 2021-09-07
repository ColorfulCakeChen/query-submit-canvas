export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as BlockParams_to_PointDepthPointParams from "./BlockParams_to_PointDepthPointParams.js";
import * as PointDepthPoint from "./PointDepthPoint.js";

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
   * That is, pointwise1ChannelCount = ( pointwise21ChannelCount * pointwise1ChannelCountRate ).
   *   - If ( stepCountPerBlock == 0 ), this rate will be ignored. There will be no first 1x1 pointwise.
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
   *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
   *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
   *   - If ( pointwise1ChannelCountRate == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
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
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. will be kept). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean}
   *   Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin,
    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd,
    bKeepInputTensor
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
      [ Params.sourceHeight,               sourceHeight ],
      [ Params.sourceWidth,                sourceWidth ],
      [ Params.sourceChannelCount,         sourceChannelCount ],
      [ Params.stepCountPerBlock,          stepCountPerBlock ],
      [ Params.bChannelShuffler,           bChannelShuffler ],
      [ Params.pointwise1ChannelCountRate, pointwise1ChannelCountRate ],
      [ Params.depthwiseFilterHeight,      depthwiseFilterHeight ],
      [ Params.nActivationId,              nActivationId ],
      [ Params.nActivationIdAtBlockEnd,    nActivationIdAtBlockEnd ],
      [ Params.bKeepInputTensor,           bKeepInputTensor ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
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

    Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth( this, this.sourceHeight, this.sourceWidth );

    return bExtractOk;
  }

//!!! ...unfinished... (2021/09/06) How about outputChannelCount?

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

  get stepCountPerBlock()           { return this.parameterMapModified.get( Params.stepCountPerBlock ); }
  get bChannelShuffler()            { return this.parameterMapModified.get( Params.bChannelShuffler ); }
  get pointwise1ChannelCountRate()  { return this.parameterMapModified.get( Params.pointwise1ChannelCountRate ); }

  get depthwiseFilterHeight()       { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get nActivationId()               { return this.parameterMapModified.get( Params.nActivationId ); }
  get nActivationIdName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }
  get nActivationIdAtBlockEndId()   { return this.parameterMapModified.get( Params.nActivationIdAtBlockEnd ); }
  get nActivationIdAtBlockEndName() { return Params.nActivationIdAtBlockEnd.getStringOfValue( this.nActivationIdAtBlockEnd ); }

  get bKeepInputTensor()            { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =               new ParamDesc.Int(                "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                new ParamDesc.Int(                "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =         new ParamDesc.Int(                "sourceChannelCount",         1, ( 10 * 1024 ) );
Params.stepCountPerBlock =          new ParamDesc.Int(                "stepCountPerBlock",          0, (  1 * 1024 ) );
Params.bChannelShuffler =           new ParamDesc.Bool(               "bChannelShuffler" );
Params.pointwise1ChannelCountRate = new ParamDesc.Int(                "pointwise1ChannelCountRate", 0,             2 );
Params.depthwiseFilterHeight =      new ParamDesc.Int(                "depthwiseFilterHeight",      1,             9 );
Params.nActivationId =              new ParamDesc.ActivationFunction( "nActivationId" );
Params.nActivationIdAtBlockEnd =    new ParamDesc.ActivationFunction( "nActivationIdAtBlockEnd" );
Params.bKeepInputTensor =           new ParamDesc.Bool(               "bKeepInputTensor" );


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
  * initer( progressParent, params ) {

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
    this.stepCountPerBlock = params.stepCountPerBlock;
    this.bChannelShuffler = params.bChannelShuffler
    this.pointwise1ChannelCountRate = params.pointwise1ChannelCountRate;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight; // Assume depthwise filter's width equals its height.
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.nActivationIdAtBlockEnd = params.nActivationIdAtBlockEnd;
    this.nActivationIdAtBlockEndName = params.nActivationIdAtBlockEndName;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // Pre-allocate array to place intermediate 2 input tensors and 2 output tensors. This could reduce memory re-allocation.
    this.intermediateInputTensors = new Array( 2 );
    this.intermediateOutputTensors = new Array( 2 );

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.



//!!! ...unfinished... (2021/09/06)
// Determine ( height, width, depth ) of concatenatedShape of channel shuffler by input1 (not input0) of PointDepthPoint.


    let stepParamsMaker = Base.create_Params_to_PointDepthPointParams( params );
    stepParamsMaker.determine_stepCount_depthwiseFilterHeight_Default_Last(); // Calculate the real step count.

    for ( let i = 0; i < stepParamsMaker.stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
      progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
    }

    let stepParams, step, stepIniter;

    this.stepsArray = new Array( stepParamsMaker.stepCount );
    for ( let i = 0; i < this.stepsArray.length; ++i ) { // Step1, 2, 3, ...

      if ( 0 == i ) { // Step0.
        stepParamsMaker.configTo_beforeStep0();
      }

      // If this is the last step of this block (i.e. at-block-end)
      //   - a different depthwise filter size may be used.
      //   - a different activation function may be used after pointwise2 convolution.
      if ( ( this.stepsArray.length - 1 ) == i ) {
        stepParamsMaker.configTo_beforeStepLast();
      }

      stepParams = stepParamsMaker.create_PointDepthPointParams( params.defaultInput, this.byteOffsetEnd );

      step = this.stepsArray[ i ] = new PointDepthPoint.Base();
      stepIniter = step.initer( progressForSteps.children[ i ], stepParams );

      this.bInitOk = yield* stepIniter;
      if ( !this.bInitOk )
        return false;
      this.byteOffsetEnd = this.step.byteOffsetEnd;

      if ( 0 == i ) { // After step0 (i.e. for step1, 2, 3, ...)
        stepParamsMaker.configTo_afterStep0( step );
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
  init( progressParent, params ) {

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
      for ( let i = 0; i < this.stepsArray.length ) {
        let step = this.stepsArray[ i ];
        step.disposeTensors();
      }
      this.stepsArray.length = 0;
    }

    this.step0 = this.stepLast = null; // It has already de disposed by this.step0 or this.steps1After.

    this.outputChannelCount = -1;

    this.intermediateInputTensors = this.intermediateOutputTensors = null;
    
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /**
   * @param {Params} blockParams
   *   The Block.Params object to be reference.
   */
  static create_Params_to_PointDepthPointParams( blockParams ) {

    if ( this.stepCountPerBlock == 0 ) {  // 1. Not ShuffleNetV2, Not MobileNetV2.
      return new Params_to_PointDepthPointParams.NotShuffleNet_NotMobileNet( blockParams );

    } else {
      if ( this.bChannelShuffler == true ) { // 2. ShuffleNetV2
        if ( this.pointwise1ChannelCountRate == 0 ) { // 2.1 will be simplified ShuffleNetV2 (expanding by once depthwise).
          return new Params_to_PointDepthPointParams.ShuffleNetV2_Simplified( blockParams );

        } else { // 2.2 ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
          return new Params_to_PointDepthPointParams.ShuffleNetV2( blockParams );

        }
      } else { // ( bChannelShuffler == false )
        // 3. MobileNetV2
        //
        // ( pointwise1ChannelCountRate == 0 ), will be similar to MobileNetV1.
        // ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV2 without expanding.
        // ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
        return new Params_to_PointDepthPointParams.MobileNetV2( blockParams );
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
    outputTensors[ 1 ] = null;

    for ( let i = 0; i < this.stepsArray.length ) {
      inputTensors[ 0 ] = outputTensors[ 0 ]; // Previous step's output becomes next step's input.
      inputTensors[ 1 ] = outputTensors[ 1 ];

      let step = this.stepsArray[ i ];
      step.apply( inputTensors, outputTensors );
    }

    return outputTensors[ 0 ]; // Note: The last step should only output one tensor.
  }
}
