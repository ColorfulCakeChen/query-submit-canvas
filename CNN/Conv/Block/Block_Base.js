export { Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";
import * as Params_to_PointDepthPointParams from "./Block_Params_to_PointDepthPointParams.js";
import { Params } from "./Block_Params.js";

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
    this.depthwiseFilterHeight = params.depthwiseFilterHeight;
    this.depthwiseFilterWidth = params.depthwiseFilterWidth;
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
    stepParamsMaker.determine_stepCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real step count.

    for ( let i = 0; i < stepParamsMaker.stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
      progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
    }

    let stepParams, step, stepIniter;

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

      // Assert image size.
      {
        let previousStep;
        if ( 0 < i ) { // Except Step0.
          previousStep = this.stepsArray[ i - 1 ];
        }

        this.assert_ImageSize_BetweenStep( stepParamsMaker, previousStep );
      }

      // Create current step.
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

    progressParent = progressParent ?? ( new ValueMax.Percentage.Aggregate() );

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
   * Assert image size.
   *
   * @param {Params_to_PointDepthPointParams.Base} stepParamsMaker
   *   The maker which will produce current step (PointDepthPoint.Base) object.
   *
   * @param {PointDepthPoint.Base} previousStep
   *   The previous step (PointDepthPoint.Base) object.
   */
  assert_ImageSize_BetweenStep( stepParamsMaker, previousStep ) {

    if ( 0 == i ) { // Step0.
      tf.util.assert( ( stepParamsMaker.inputHeight == this.sourceHeight ),
        `Block.initer(): `
          + `step${i}'s input image height ( ${stepParamsMaker.inputHeight} ) should be the same as `
          + `block's source image height ( ${this.sourceHeight} ).`
      );

      tf.util.assert( ( stepParamsMaker.inputWidth == this.sourceWidth ),
        `Block.initer(): `
          + `step${i}'s input image width ( ${stepParamsMaker.inputWidth} ) should be the same as `
          + `block's source image width ( ${this.sourceWidth} ).`
      );

    } else { // After Step0.
      tf.util.assert( ( stepParamsMaker.inputHeight == previousStep.outputHeight ),
        `Block.initer(): `
          + `step${i}'s input image height ( ${stepParamsMaker.inputHeight} ) should be the same as `
          + `step${ i - 1 }'s output image height ( ${previousStep.outputHeight} ).`
      );

      tf.util.assert( ( stepParamsMaker.inputWidth == previousStep.outputWidth ),
        `Block.initer(): `
          + `step${i}'s input image width ( ${stepParamsMaker.inputWidth} ) should be the same as `
          + `step${ i - 1 }'s output image width ( ${previousStep.outputWidth} ).`
      );
    }
  }

  /**
   * @param {Params} blockParams
   *   The Block.Params object to be reference.
   */
  static create_Params_to_PointDepthPointParams( blockParams ) {

    tf.util.assert( ( blockParams.stepCountRequested >= 2 ),
      `Block.create_Params_to_PointDepthPointParams(): `
        + `blockParams.stepCountRequested ( ${blockParams.stepCountRequested} ) must be >= 2.` );

    switch ( blockParams.nWhetherShuffleChannel ) {
      case ValueDesc.WhetherShuffleChannel.Singleton.Ids.NONE: // (0) 2. MobileNetV2 or MobileNetV1
        // ( pointwise1ChannelCountRate == 0 ), will be similar to MobileNetV1.
        // ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV2 without expanding.
        // ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.
        return new Params_to_PointDepthPointParams.MobileNetV2( blockParams );
        break;

      case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER: // (1) 3. ShuffleNetV2
        return new Params_to_PointDepthPointParams.ShuffleNetV2( blockParams );
        break;

      case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22: // (2) 4. ShuffleNetV2_ByPointwise22
        return new Params_to_PointDepthPointParams.ShuffleNetV2_ByPointwise22( blockParams );
        break;

      case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_MOBILE_NET_V1: // (3) 4. ShuffleNetV2_ByMobileNetV1
        return new Params_to_PointDepthPointParams.ShuffleNetV2_ByPointwise22( blockParams );
        break;

      default:
        tf.util.assert( false,
          `Block.create_Params_to_PointDepthPointParams(): `
            + `unknown this.nWhetherShuffleChannel ( ${blockParams.nWhetherShuffleChannel} ) value.` );
        break;
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
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `nActivationIdName=${this.nActivationIdName}(${this.nActivationId}), `
      + `nActivationIdAtBlockEndName=${this.nActivationIdAtBlockEndName}(${this.nActivationIdAtBlockEnd}), `
      + `nWhetherShuffleChannel=${this.nWhetherShuffleChannelName}(${this.nWhetherShuffleChannel}), `
      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, outputChannelCount=${this.outputChannelCount}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}

