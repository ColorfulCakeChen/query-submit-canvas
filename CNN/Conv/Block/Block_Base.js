export { Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";
import * as StepParamsCreator from "./Block_StepParamsCreator.js";
import { Params } from "./Block_Params.js";

/**
 * Implement a block of ( depthwise convolution and pointwise convolution ) or ShuffleNetV2 (with 2 output channel groups) or MobileNetV1
 * or MobileNetV2.
 *
 *
 * 1. Halve Height, Halve Width
 *
 * All types of block will output an image whose height and width are only half of the input image's height and width.
 *
 * They all do it at step0 and by the same method: depthwise convolution with ( strides = 2 ). Most will do it with ( pad = "same" ). 
 * But some will do it with ( pad = "valid" ).
 *
 *
 * 2. Double channels
 *
 * All types of block will output an image whose channel count is twice of the input image's channel count. But they all do
 * it at step0 but with different ways:
 *
 *   - MobileNetV1 (0)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( bPointwise1 == true ), pointwise1 double of input0.
 *
 *   - MobileNetV2 (1)
 *     - ( bPointwise1 == false ), depthwise1 quadruple ( channelMultiplier == 4 ) of input0. pointwis21 double of input0.
 *     - ( bPointwise1 == true ), pointwise1 quadruple of input0. pointwis21 double of input0.
 *
 *   - MobileNetV2_Thin (2)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0. pointwis21 double of input0.
 *     - ( bPointwise1 == true ), pointwise1 double of input0. pointwis21 double of input0.
 *
 *   - ShuffleNetV2 (3), ShuffleNetV2_ByPointwise22 (4)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( bPointwise1 == true ), concatenate depthwise1 and depthwise2.
 *
 *   - ShuffleNetV2_ByMobileNetV1 (5), ShuffleNetV2_ByMobileNetV1_padValid (6)
 *     - ( bPointwise1 == false ), pointwise1 (lower half pass through, higher half copy input0) double of input0.
 *     - ( bPointwise1 == true ), pointwise1 (higher half copy input0) double of input0.
 *

//!!! ...unfinished... (2022/05/05)
// For MobileNetV1 and MobileNetV2_Thin:
//
// Only step0's pointwise1 is meaningful. All non-step0's pointwise1 is meaningless.
// The reason is that the previous step's pointwise21 (which always has no activation function) and the next step's pointwise1
// could be combined into one pointwise convolution.
//
// It is better to let the pointwise21 always has bias (and still no activation function). And:
//
//   - All non-step0's pointwise1 only needs activation function (without pointwise convolution, without bias). Or,
//
//   - All step's (including step0 and non-step0) pointwise1 could be dropped totally (without pointwise convolution,
//       without bias, without activation function).
//
// 
// 
// For MobileNetV2:
//   - pointwise1 convolution can not be omitted because it is responsible for channel expanding (to quadruple of step0's input0).
//
//
// For ShuffleNetV2:
//   - pointwise1 could be omitted. Although it is suggested to have pointwise1 to alleviate the issue of
//     the first and last channel (i.e. the channel 0 and channel ( N - 1 )) stationary at the same place.
//
// For ShuffleNetV2_ByPointwise22:
//   - pointwise1 could be omitted. And, it does not have ShuffleNetV2's of first and last channel (i.e. the channel 0
//     and channel ( N - 1 )) stationary issue.
//
// For ShuffleNetV2_ByMobileNetV1:
// For ShuffleNetV2_ByMobileNetV1_padValid:
//   - step0 always has pointwise1 (even if ( blockParams.bPointwise1 == false )) because it is responsible for channel expanding
//     (to double of step0's input0).
//   - all non-step0 could has no pointwise1.
//
//
//

 *
 * 3. Bias and Activation
 *
 * In original MobileNetV2: (note: tf.batchNorm() has bias intrinsically.)
 *   - pointwise1: bias, activation.
 *   - depthwise1: bias, activation.
 *   - pointwise2: bias, no activation.
 *
 * In original ShuffleNetV2:
 *   - pointwise1: bias, activation.
 *   - depthwise1: bias, no activation.
 *   - pointwise2: bias, activation.
 *
 * We use the former configuration (i.e. original MobileNetV2) in all classes Block.Params_to_PointDepthPointParams.Xxx.
 *
 *
 * 3.1 Reason
 *
 * The reason is for ShuffleNetV2_ByMobileNetV1 to undo activation escaping scales.
 *
 * In ShuffleNetV2_ByMobileNetV1, if an operation has activation function, it will scale its convolution filters for escaping
 * the activation function's non-linear parts. This results in its output is wrong (i.e. different from ShuffleNetV2). In order
 * to resolve this issue, the last operation (i.e. pointwise2) should have no activation (so it will not scale its convolution
 * filters for escaping the activation function's non-linear parts).
 *
 *
 * 3.2 Advantage
 *
 * Although this choice is mainly for solving ShuffleNetV2_ByMobileNetV1's issue, it does have practical advantage in fact. The
 * output could have any value (i.e. the whole number line). If the last operation (i.e. pointwise2) has activation function,
 * the output value will be restricted by the activation function (e.g. [ -1, +1 ] for tanh()).
 *
 *
 * 3.3 Improvement
 *
 * In some cases, the pointwise2's bias could sometimes be dropped and remedied by the bias of the next step's pointwise1 or
 * depthwise1. This could improve performance.
 *
 *
 * 3.3.1 Precondition of Improvement
 *
 * For affine transformation:
 *
 *   "If an operation has no activation function, it can also have no bias too because the next operation's bias can
 *    achieve the same result. (Multiple affine transformations can be combined into one affine transformation.)"
 *
 * Here, those involved operations should be:
 *   - pointwise convolution. or,
 *   - depthwise convolution with ( pad = "valid" ).
 *
 *
 * 3.3.2 Not workable for depthwise convolution with ( pad = "same" )?
 *
 * The reason is that the depthwise convolution with ( pad = "same" ) will pad zero. The count of these padded zero is
 * different according to the input pixel position. The varying zero count results in that varying bias is required.
 * Varying bias is impossible to be achieved since data in the same channel could only have the same bias.
 *
 * On the other hand, the depthwise convolution with ( pad = "valid" ) does not pad any value. The per channel (fixed)
 * bias is sufficient to remedy the previous affine transformation's no-bias.
 *
 *
 * 3.3.3 Not workable for ( bPointwise1 == false ), usually.
 *
 * It means that the next step will be no pointwise1. The remedy must be done by the next step's depthwise. Only in
 * ShuffleNetV2_ByMobileNetV1_padValid, the depthwise is ( pad = "valid" ) and workable. In other ConvBlockType, 
 * the depthwise is ( pad = "same" ) and not workable.
 *
 *
 * 3.3.4 Not workable for ShuffleNetV2_Xxx
 *
 * The non-step0 of ShuffleNetV2_Xxx does not have any pointwise or depthwise convolution for the input1. It means
 * that there is no chance to remedy the previous step's pointwise21's no-bias before concat-shuffle-split.
 *
 * Although ShuffleNetV2_ByMobileNetV1_Xxx always has pointwise1 intrinsically no matter ( bPointwise1 == false )
 * or ( bPointwise1 == true ), however, ShuffleNetV2_ByMobileNetV1_Xxx's pointwise1's higher half just pass-through
 * input0's higher half. It is the same as no-bias and can not remedy the previous step's pointwise21's no-bias.
 *
 *
 * 3.3.5 Not workable for stepLast
 *
 * Since stepLast does not have the next step (i.e. itself is the last step), there is no next step's pointwise1 to
 * remedy stepLast's pointwise21's no-bias.
 *
 *
 * 3.3.6 Workable for MobileNet with ( bPointwise1 == true )
 *
 * In summary, when ( bPointwise1 == true ), it is workable for MobileNetV1, MobileNetV2 and MobileNetV2_Thin. All
 * non-stepLast's pointwise21 need not bias. Only the stepLast's pointwise21 needs bias for final output.
 *
 * (Note: All steps' pointwise1 and depthwise1 also need bias because they have activation function (i.e. not affine
 * transformation).)
 *
 * In fact, if multiple convolution blocks are used:
 *   - All non-last other block's every step's pointwise21 needs not bias (i.e. ( bPointwise2BiasAtBlockEnd == false ) ).
 *   - Only the last block's stepLast's pointwise21 needs bias (i.e. ( bPointwise2BiasAtBlockEnd == true ) ).
 *
 *
 * 4.
 *
 * Note: In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
 * has bias internally. We do not have batch normalization in architecture so an explicit bias will be used before every activation
 * function.
 *
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
    this.bPointwise1 = params.bPointwise1;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight;
    this.depthwiseFilterWidth = params.depthwiseFilterWidth;
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.nConvBlockType = params.nConvBlockType;
    this.nConvBlockTypeName = params.nConvBlockTypeName;
    this.bLastBlock = params.bLastBlock;
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
    let stepParamsCreator = StepParamsCreator.Base.create_byBlockParams( params );
    stepParamsCreator.determine_stepCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real step count.

    for ( let i = 0; i < stepParamsCreator.stepCount; ++i ) { // Progress for step0, 1, 2, 3, ... 
      progressForSteps.addChild( new ValueMax.Percentage.Aggregate() );
    }

    let stepParams, step, stepIniter;

    this.stepsArray = new Array( stepParamsCreator.stepCount );
    for ( let i = 0; i < this.stepsArray.length; ++i ) { // Step0, 1, 2, 3, ..., StepLast.

      if ( 0 == i ) { // Step0.
        stepParamsCreator.configTo_beforeStep0();
      }

      // StepLast. (Note: Step0 may also be StepLast.) 
      //
      // If this is the last step of this block (i.e. at-block-end)
      //   - a different depthwise filter size may be used.
      //   - a different activation function may be used after pointwise2 convolution.
      if ( ( this.stepsArray.length - 1 ) == i ) {
        stepParamsCreator.configTo_beforeStepLast();
      }

      // Assert image size.
      {
        let previousStep;
        if ( 0 < i ) { // Except Step0.
          previousStep = this.stepsArray[ i - 1 ];
        }

        this.assert_ImageSize_BetweenStep( stepParamsCreator, previousStep );
      }

      // Create current step.
      stepParams = stepParamsCreator.create_PointDepthPointParams( params.defaultInput, this.byteOffsetEnd );

      if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

        // If channelShuffler is not null, keep it so that its tensors could be released.
        let channelShuffler = stepParamsCreator.channelShuffler;
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
        stepParamsCreator.configTo_afterStep0();
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
   * @param {Params_to_PointDepthPointParams.Base} stepParamsCreator
   *   The maker which will produce current step (PointDepthPoint.Base) object.
   *
   * @param {PointDepthPoint.Base} previousStep
   *   The previous step (PointDepthPoint.Base) object.
   */
  assert_ImageSize_BetweenStep( stepParamsCreator, previousStep ) {

    if ( 0 == i ) { // Step0.
      tf.util.assert( ( stepParamsCreator.inputHeight == this.sourceHeight ),
        `Block.initer(): `
          + `step${i}'s input image height ( ${stepParamsCreator.inputHeight} ) should be the same as `
          + `block's source image height ( ${this.sourceHeight} ).`
      );

      tf.util.assert( ( stepParamsCreator.inputWidth == this.sourceWidth ),
        `Block.initer(): `
          + `step${i}'s input image width ( ${stepParamsCreator.inputWidth} ) should be the same as `
          + `block's source image width ( ${this.sourceWidth} ).`
      );

    } else { // After Step0.
      tf.util.assert( ( stepParamsCreator.inputHeight == previousStep.outputHeight ),
        `Block.initer(): `
          + `step${i}'s input image height ( ${stepParamsCreator.inputHeight} ) should be the same as `
          + `step${ i - 1 }'s output image height ( ${previousStep.outputHeight} ).`
      );

      tf.util.assert( ( stepParamsCreator.inputWidth == previousStep.outputWidth ),
        `Block.initer(): `
          + `step${i}'s input image width ( ${stepParamsCreator.inputWidth} ) should be the same as `
          + `step${ i - 1 }'s output image width ( ${previousStep.outputWidth} ).`
      );
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
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `nActivationIdName=${this.nActivationIdName}(${this.nActivationId}), `
      + `nConvBlockType=${this.nConvBlockTypeName}(${this.nConvBlockType}), `
      + `bLastBlock=${this.bLastBlock}, `
      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, outputChannelCount=${this.outputChannelCount}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}

