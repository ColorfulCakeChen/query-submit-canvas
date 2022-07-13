export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";

//!!! (2022/06/07 Remarked) seems not necessary because already has TensorPlaceholder.
//import * as BoundsArraySet from "../BoundsArraySet.js";

import * as Block from "../Block.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import * as BlockParamsCreator from "./Stage_BlockParamsCreator.js";
import { Params } from "./Stage_Params.js";

/**
 * Implement a stage of  or MobileNetV1 or MobileNetV2 or ShuffleNetV2 (with 2 output channel groups). It is a sequence of
 * depthwise convolution and pointwise convolution.
 *
 *
 * 1. Halve Height, Halve Width
 *
 * All types of stage will output an image whose height and width are only half of the input image's height and width.
 *
 * They all do it at block0 and by the same method: depthwise convolution with ( strides = 2 ). Most will do it with ( pad = "same" ). 
 * But some will do it with ( pad = "valid" ).
 *
 *
 * 2. Double channels
 *
 * All types of stage will output an image whose channel count is twice of the input image's channel count. They all do
 * it at block0 but by different ways:
 *
 *   - MobileNetV1 (0), MobileNetV1_padValid (1)
 *     - ( pointwise1ChannelCount == 0 ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( pointwise1ChannelCount >  0 ), pointwise1 double of input0.
 *
 *   - MobileNetV2_Thin (2)
 *     - ( pointwise1ChannelCount == 0 ), depthwise1 double ( channelMultiplier == 2 ) of input0. pointwis21 double of input0.
 *     - ( pointwise1ChannelCount >  0 ), pointwise1 double of input0. pointwis21 double of input0.
 *
 *   - MobileNetV2 (3)
 *     - ( pointwise1ChannelCount == 0 ), depthwise1 quadruple ( channelMultiplier == 4 ) of input0. pointwis21 double of input0.
 *     - ( pointwise1ChannelCount >  0 ), pointwise1 quadruple of input0. pointwis21 double of input0.
 *
 *   - ShuffleNetV2 (4), ShuffleNetV2_ByPointwise21 (5)
 *     - ( pointwise1ChannelCount == 0 ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( pointwise1ChannelCount >  0 ), concatenate depthwise1 and depthwise2.
 *
 *   - ShuffleNetV2_ByMobileNetV1 (6), ShuffleNetV2_ByMobileNetV1_padValid (7)
 *     - ( pointwise1ChannelCount == 0 ), pointwise1 (lower half pass through, higher half copy input0) double of input0.
 *     - ( pointwise1ChannelCount >  0 ), pointwise1 (higher half copy input0) double of input0.
 *
 *
 * 3. Bias and Activation
 *
 * MobileNetV2_Xxx uses the following (which is MobileNetV2's original design):
 *   - pointwise1: bias, activation.
 *   - depthwise:  bias, activation.
 *   - prefix squeeze-and-excitation.
 *   - pointwise2: bias, NO activation.
 *
 * All non-MobileNetV2_Xxx ConvStageType use the following (which is ShuffleNetV2's original design):
 *   - pointwise1: bias, activation.
 *
 *   - depthwise:  NO bias, NO activation.
 *     - In ShuffleNetV2's original design, depthwise always has bias.
 *     - We drop depthwise's bias because it could be achieved by pointwise2's bias.
 *         (Note: The squeeze-and-excitation is behind pointwise2 in these ConvStageTypes.)
 *
 *   - pointwise2:
 *     - non-blockLast: bias, activation.
 *     - blockLast:     bias, activation or no activation (according to stageParams.bPointwise2ActivatedAtStageEnd).
 *       - In ShuffleNetV2's original design, pointwise2 always has bias and activation. We adjust it according to
 *           stageParams.bPointwise2ActivatedAtStageEnd for ShuffleNetV2_ByMobileNetV1 to undo activation escaping
 *           scales.
 *
 *   - postfix squeeze-and-excitation.
 *
 *
 * 3.1 MobileNetV2_Xxx's pointwise2: no activation
 *
 * The reason why MobileNetV2_Xxx's pointwise2 could always have no activation function is that MobileNetV2_Xxx's pointwise2
 * has add-input-to-output so its block's output is not affine transformation (even if no activation function). It and the next
 * block's pointwise1 do not form continuous multiple affine transformation and will not become just one affine transformation.
 *
 *
 * 3.2 non-MobileNetV2_Xxx's pointwise2: activation or no activation
 *
 *
 * 3.2.1 Default: activation
 *
 * By default, for all non-MobileNetV2_Xxx ConvStageType, all non-blockLast's pointwise2 should have activation function (to
 * become non-affine transformation). The reason is to avoid the previous block's pointwise2 and the next block's pointwis1 become
 * just one (i.e. not two) affine transformation (i.e. do twice computation but just have same effect of one computation).
 *
 *
 * 3.2.2 blockLast: activation or no activation
 *
 * The reason why non-MobileNetV2_Xxx's blockLast's pointwise2 may or may not have activation function is for
 * ShuffleNetV2_ByMobileNetV1 to undo activation escaping scales.
 *
 * In ShuffleNetV2_ByMobileNetV1, if an operation has activation function, its pass-through part will scale its convolution filters
 * for escaping the activation function's non-linear parts (in order to keep linear). This results in its output is wrong (i.e.
 * different from original ShuffleNetV2). In order to resolve this issue, the last stage's last operation (i.e. last stage's
 * blockLast's pointwise2) should have no activation (so it will not scale its convolution filters for escaping the activation
 * function's non-linear parts).
 *
 * This is achieved by caller specifying ( stageParams.bPointwise2ActivatedAtStageEnd == false ) for the last stage.
 *
 * Although this design is mainly for solving ShuffleNetV2_ByMobileNetV1's issue, it does have practical advantage in fact. The
 * output could have any value (i.e. the whole number line). If the last operation (i.e. pointwise2) always has activation function,
 * the output value will always be restricted by the activation function (e.g. [ -1, +1 ] if tanh()).
 *
 *
 * 3.3 non-MobileNetV2_Xxx's depthwise
 *
 * The reason why non-MobileNetV2_Xxx's depthwise does not have bias is the following characteristic of affine transformation:
 *
 *   "If an operation has no activation function (i.e. it is affine transformation), it can also have no bias because the next
 *    operation's bias can achieve the same result. (Multiple affine transformations can be combined into one affine transformation.)"
 *
 *
 * 3.3.1 Combined affine transformation
 *
 * In non-MobileNetV2_Xxx, the depthwise does not have activation function (and does not have squeeze-and-excitation following it) so
 * it is affine transformation. Since the depthwise's next operation (i.e. pointwise2) always has bias, it is not necessary to have
 * bias in the depthwise.
 *
 *
 * 3.3.2 Note the assumption's detail
 *
 * To accomplish the above affine transformation combination assumption, the "next operation" should be:
 *   - pointwise convolution. or,
 *   - depthwise convolution with ( pad = "valid" ).
 *
 * Why not workable if the next operation is depthwise convolution with ( pad = "same" )?
 *
 * The reason is that the depthwise convolution with ( pad = "same" ) will pad zero. The count of these padded zero is
 * different according to the input pixel position. The varying zero count results in that varying bias is required.
 * Varying bias is impossible to be achieved since data in the same channel could only have the same bias.
 *
 * On the other hand, the depthwise convolution with ( pad = "valid" ) does not pad any value. The per channel (fixed)
 * bias is sufficient to remedy the previous affine transformation's no-bias.
 *
 * Note: The squeeze (of squeeze-and-excitation) is depthwise (globale average) convolution with ( pad = "valid" ). The
 * excitation (of squeeze-and-excitation) is pointwise convolution. So they also meet these criterion.
 *
 *
 * 3.3.3 squeeze-and-excitation
 *
 * Because squeeze-and-excitation has activation function internally and will be multiplied to its input, it should be viewed
 * as a non-linear operation (just like activation function is a non-linear operation).
 *
 * If squeeze-and-excitation is prefix the pointwise2 convolution (i.e. just after the depthwise convolution), the depthwise
 * convolution should have bias (and even activation). Since squeeze-and-excitation is non-linear, if it is applied, a bias
 * should be applied (to achieve affine transformation) before the non-linearity operation.
 *
 * For this reason, in non-MobileNetV2_Xxx, let squeeze-and-excitation is postfix (not prefix) the pointwise2 convolution. Then,
 * the depthwise could still has no bias and no activation because it is still linear between depthwise and pointwise2.
 *
 *
 * 3.4 Note: tf.batchNorm()
 *
 * tf.batchNorm() has bias intrinsically.
 *
 * In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
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
 * @member {Block.Base[]} blocksArray
 *   All computation blocks of this stage.
 *
 * @member {Block.Base} block0
 *   The first computation block of this stage.
 *
 * @member {Block.Base} blockLast
 *   The last computation block of this stage. It may be the same as this.block0 when there is only one block inside this stage.
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this stage's input.
 *
 * @member {number} outputHeight
 *   The output image height of this stage's last block.
 *
 * @member {number} outputWidth
 *   The output image width of this stage's last block.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this stage's last block.
 *
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this stage's output.
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
class Base extends Recyclable.Root {

  /**
   * Used as default Stage.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.Base.Pool", Base, Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Nothing to do here (for Stage.Base).
  }

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters. This params will be owned and destroyed by this .initer().
   * So caller should not use it again.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   * @see Block.Base.initer()
   */
  * initer( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 ) {

    // Both MobileNetV3 and ShuffleNetV2:
    //   - They all do not use (depthwise convolution) channelMultiplier.
    //   - They all use 1x1 (pointwise) convolution to expand channel count.
    //   - They all use 1x1 (pointwise) convolution before depthwise convolution.
    //   - They all use activation function after first pointwise convolution.
    //   - They all use depthwise convolution with ( pad = "same" ).
    //   - They all use depthwise convolution with ( strides = 2 ) for shrinking (halving) height x width.
    //   - They all do use batch normalization (include bias) after pointwise and depthwise convolution.
    //
    // Inisde one of their stage, three convolutions are used:
    //   A) 1x1 (pointwise) convolution, with activation.
    //   B) depthwise convolution, (ShuffleNetV2) without or (MobileNetV2) with activation.
    //   C) 1x1 (pointwise) convolution, (ShuffleNetV2) with or (MobileNetV2) without activation.
    //
    // In MobileNetV3, convolution A expands channel count (with activation), convolution C shrinks channel count (without activation).
    // It may use squeeze-and-excitation after convolution B (without activation). When there is necessary to increase output channel
    // count (usually in block 0 of a stage), the convolution C is responsible for this.
    //
    // In ShuffleNetV2, convolution A (with activation), convolution B (without activation) and convolution C (with activation) never
    // change channel count. When there is necessary to increase output channel count (usually in block 0 of a stage), it expands channel
    // count by concatenating two shrinked (halven) height x width.


    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.bInitOk = false;

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputFloat32Array.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) ); // For parameters extracting.
    let progressForBlocks = progressParent.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() ); // for block0, block1, 2, 3, ... 

    this.disposeTensors();

    // 1. Extract parameters.
    if ( !params )
      return false;

    this.byteOffsetEnd = this.byteOffsetBegin = params.defaultByteOffsetBegin;

    if ( !params.extract() )
      return false;  // e.g. input array does not have enough data.
    this.weightElementOffsetEnd = params.weightElementOffsetEnd;

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputFloat32Array could be released.
    this.sourceHeight = params.sourceHeight;
    this.sourceWidth = params.sourceWidth;
    this.sourceChannelCount = params.sourceChannelCount;
    this.nConvStageTypeId = params.nConvStageTypeId;
    this.nConvStageTypeName = params.nConvStageTypeName;
    this.blockCountRequested = params.blockCountRequested;
    this.bPointwise1 = params.bPointwise1;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight;
    this.depthwiseFilterWidth = params.depthwiseFilterWidth;
    this.bPointwise2ActivatedAtStageEnd = params.bPointwise2ActivatedAtStageEnd;
    this.nSqueezeExcitationChannelCountDivisor = params.nSqueezeExcitationChannelCountDivisor;
    this.nSqueezeExcitationChannelCountDivisorName = params.nSqueezeExcitationChannelCountDivisorName;
    this.bSqueezeExcitationPrefix = params.bSqueezeExcitationPrefix;
    this.nActivationId = params.nActivationId;
    this.nActivationIdName = params.nActivationIdName;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
      this.outputHeight = params.outputHeight;
      this.outputWidth = params.outputWidth;
    }

    // Pre-allocate array to place intermediate 2 input tensors and 2 output tensors. This could reduce memory re-allocation.
    this.intermediateInputTensors = Recyclable.Array.get_or_create_by( 2 );
    this.intermediateOutputTensors = Recyclable.Array.get_or_create_by( 2 );

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    params.disposeResources_and_recycleToPool();
    params = null;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. Create every blocks.
    let blockParamsCreator = Base.create_BlockParamsCreator_byStageParams( params );
    blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real block count.

    for ( let i = 0; i < blockParamsCreator.blockCount; ++i ) { // Progress for block0, 1, 2, 3, ... 
      progressForBlocks.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let blockParams, block, blockIniter;
    let inputScaleBoundsArray;

    this.blocksArray = Recyclable.OwnerArray.Pool.get_or_create_by( blockParamsCreator.blockCount );
    for ( let i = 0; i < this.blocksArray.length; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

      if ( 0 == i ) { // Block0.
        blockParamsCreator.configTo_beforeBlock0();
        inputScaleBoundsArray = inputScaleBoundsArray0;
      }

      // BlockLast. (Note: Block0 may also be BlockLast.) 
      //
      // If this is the last block of this stage (i.e. at-stage-end)
      //   - a different depthwise filter size may be used.
      //   - a different activation function may be used after pointwise2 convolution.
      if ( ( this.blocksArray.length - 1 ) == i ) {
        blockParamsCreator.configTo_beforeBlockLast();
      }

      // Assert image size.
      {
        let previousBlock;
        if ( 0 < i ) { // Except Block0.
          previousBlock = this.blocksArray[ i - 1 ];
        }

        this.assert_ImageSize_BetweenBlock( blockParamsCreator, previousBlock );
      }

      // Create current block.
      blockParams = blockParamsCreator.create_BlockParams( params.defaultInput, this.byteOffsetEnd );

      if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

        // If channelShuffler is not null, keep it so that its tensors could be released.
        let channelShuffler = blockParamsCreator.channelShuffler;
        if ( channelShuffler ) {

          if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
            throw Error( `Stage.initer(): `
              + `At most, only one (and same) channel shuffler could be used (and shared by all blocks of a stage).` );

          this.channelShuffler = channelShuffler;

          this.tensorWeightCountExtracted += channelShuffler.tensorWeightCountExtracted;
          this.tensorWeightCountTotal += channelShuffler.tensorWeightCountTotal;

        // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler will be cleared and could not be used
        // for releasing tensors.
        }

      // If channelShuffler has ever got, never change it.
      }

      block = this.blocksArray[ i ] = new Block.Base();
      blockIniter = block.initer( progressForBlocks.children[ i ], blockParams,
        inputScaleBoundsArray, null,
        this.channelShuffler );

      this.bInitOk = yield* blockIniter;
      if ( !this.bInitOk )
        return false;
      this.byteOffsetEnd = block.byteOffsetEnd;

      this.tensorWeightCountTotal += block.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += block.tensorWeightCountExtracted;

      if ( 0 == i ) { // After block0 (i.e. for block1, 2, 3, ...)
        blockParamsCreator.configTo_afterBlock0();
        inputScaleBoundsArray = block.output0.scaleBoundsArray;
      }
    }

    this.block0 = this.blocksArray[ 0 ]; // Shortcut to the first block.
    this.blockLast = this.blocksArray[ this.blocksArray.length - 1 ]; // Shortcut to the last block.

    this.outputChannelCount = this.blockLast.outChannelsAll;

//!!! (2022/06/07 Remarked) seems not necessary because already has TensorPlaceholder.
//     {
//       this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, null,
//         this.blockLast.boundsArraySet.output0.channelCount, 0 );
//
//       this.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.blockLast.boundsArraySet );
//
//       this.dispose_all_sub_BoundsArraySet(); // Release all blocks' bounds array set for reducing memory footprint.
//     }

    this.dispose_intermediate_ScaleBoundsArray(); // Release all intermediate blocks' bounds array set for reducing memory footprint.

    // In our Stage design, no matter which configuration, the outputChannelCount always is twice as sourceChannelCount.
    if ( this.outputChannelCount != ( this.sourceChannelCount * 2 ) )
      throw Error( `Stage.initer(): `
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
   * @see Block.Base.init()
   */
  init( progressParent, inputWeightArray, weightElementOffsetBegin, params ) {

    progressParent = progressParent ?? ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, params );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** @override */
  disposeResources() {
    this.outputChannelCount = -1;
    this.block0 = this.blockLast = null; // It has already de disposed by this.block0 or this.blocks1After.

    if ( this.blocksArray ) {
      this.blocksArray.disposeResources_and_recycleToPool();
      this.blocksArray = null;
    }

    if ( this.channelShuffler ) { // Stage is responsible for releasing the channel shuffler shared by all blocks of the stage.
      this.channelShuffler.disposeResources_and_recycleToPool();
      this.channelShuffler = false;
    }

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

    if ( this.intermediateOutputTensors ) {
      this.intermediateOutputTensors.disposeResources_and_recycleToPool();
      this.intermediateOutputTensors = null;
    }

    if ( this.intermediateInputTensors ) {
      this.intermediateInputTensors.disposeResources_and_recycleToPool();
      this.intermediateInputTensors = null;
    }

    this.weightElementOffsetBegin = this.weightElementOffsetEnd = -1;
    this.bInitOk = false;

    super.disposeResources();
  }

  /**
   * Call .TensorPlaceholder_dispose_inputs_dispose_outputs() of all sub blocks.
   */
  TensorPlaceholder_dispose_inputs_dispose_outputs() {
    if ( this.blocksArray ) {
      for ( let i = 0; i < this.blocksArray.length; ++i ) {
        let block = this.blocksArray[ i ];
        block.TensorPlaceholder_dispose_inputs_dispose_outputs();
      }
    }
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except .block0.input0 and .blockLast.output0
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {

    if ( !this.blocksArray )
      return;

    { // 1. Release blockLast's inputs' ScaleBoundsArray.
      this.blockLast.input1?.ScaleBoundsArray_dispose();
      this.blockLast.input0.ScaleBoundsArray_dispose();
    }

    // 2. Release intermediate (i.e. except block0 and blockLast) blocks' inputs' and outputs' ScaleBoundsArray.
    for ( let i = ( this.blocksArray.length - 2 ); i >= 1; --i ) {
      let block = this.blocksArray[ i ];
      block.output1?.ScaleBoundsArray_dispose();
      block.output0.ScaleBoundsArray_dispose();
      block.input1?.ScaleBoundsArray_dispose();
      block.input0.ScaleBoundsArray_dispose();
    }

    { // 1. Release block0's outputs' ScaleBoundsArray.
      this.block0.output1?.ScaleBoundsArray_dispose();
      this.block0.output0.ScaleBoundsArray_dispose();
    }
  }

  /**
   * Assert image size.
   *
   * @param {Params_to_BlockParams.Base} blockParamsCreator
   *   The maker which will produce current block (Block.Base) object.
   *
   * @param {Block.Base} previousBlock
   *   The previous block (Block.Base) object.
   */
  assert_ImageSize_BetweenBlock( blockParamsCreator, previousBlock ) {

    if ( 0 == i ) { // Block0.
      if ( blockParamsCreator.inputHeight != this.sourceHeight )
        throw Error( `Stage.initer(): `
          + `block${i}'s input image height ( ${blockParamsCreator.inputHeight} ) should be the same as `
          + `stage's source image height ( ${this.sourceHeight} ).`
        );

      if ( blockParamsCreator.inputWidth != this.sourceWidth )
        throw Error( `Stage.initer(): `
          + `block${i}'s input image width ( ${blockParamsCreator.inputWidth} ) should be the same as `
          + `stage's source image width ( ${this.sourceWidth} ).`
        );

    } else { // After Block0.
      if ( blockParamsCreator.inputHeight != previousBlock.outputHeight )
        throw Error( `Stage.initer(): `
          + `block${i}'s input image height ( ${blockParamsCreator.inputHeight} ) should be the same as `
          + `block${ i - 1 }'s output image height ( ${previousBlock.outputHeight} ).`
       );

      if ( blockParamsCreator.inputWidth != previousBlock.outputWidth )
        throw Error( `Stage.initer(): `
          + `block${i}'s input image width ( ${blockParamsCreator.inputWidth} ) should be the same as `
          + `block${ i - 1 }'s output image width ( ${previousBlock.outputWidth} ).`
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
    outputTensors[ 1 ] = null; // Note: The block0 should only input one tensor.

    let blocksArray = this.blocksArray;
    let block;
    for ( let i = 0; i < blocksArray.length; ++i ) {
      inputTensors[ 0 ] = outputTensors[ 0 ]; // Previous block's output becomes next block's input.
      inputTensors[ 1 ] = outputTensors[ 1 ];

      block = blocksArray[ i ];
      block.apply( inputTensors, outputTensors );
    }

    let outputTensor = outputTensors[ 0 ]; // Note: The blockLast should only output one tensor.

    // Avoid dangling tensors.
    inputTensors[ 0 ] = null;
    inputTensors[ 1 ] = null;
    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = null;

    return outputTensor;
  }

  /** How many blocks inside this stage are created. (may different from this.blockCountRequested.) */
  get blockCount() {
    return this.blocksArray.length;
  }

  get input0() {
    return this.block0.input0;
  }

  get output0() {
    return this.blockLast.output0;
  }

  /**
   * @return {string} The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let str =
        `sourceHeight=${this.sourceHeight}, sourceWidth=${this.sourceWidth}, sourceChannelCount=${this.sourceChannelCount}, `
      + `nConvStageTypeName=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `
      + `blockCountRequested=${this.blockCountRequested}, blockCount=${this.blockCount}, `
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `bPointwise2ActivatedAtStageEnd=${this.bPointwise2ActivatedAtStageEnd}, `

      + `nSqueezeExcitationChannelCountDivisorName=${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `
      + `bSqueezeExcitationPrefix=${this.bSqueezeExcitationPrefix}, `

      + `nActivationIdName=${this.nActivationIdName}(${this.nActivationId}), `
      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, outputChannelCount=${this.outputChannelCount}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

  /**
   * @param {Params} stageParams
   *   The Stage.Params object to be reference.
   *
   * @return {Base}
   *   Return newly created Stage.BlockParamsCreator.Xxx object according to stageParams.nConvStageTypeId.
   */
  static create_BlockParamsCreator_byStageParams( stageParams ) {

    if ( stageParams.blockCountRequested < 2 )
      throw Error( `Stage.BlockParamsCreator.Base.create_byStageParams(): `
        + `stageParams.blockCountRequested ( ${stageParams.blockCountRequested} ) must be >= 2.` );

    if ( !(   ( stageParams.nConvStageType >= 0 )
           && ( stageParams.nConvStageType < Base.nConvStageType_to_BlockParamsCreator_ClassArray.length )
          ) 
       )
      throw Error( `Stage.Base.create_BlockParamsCreator_byStageParams(): `
        + `unknown stageParams.nConvStageType ( ${stageParams.nConvStageType} ) value.`
      );

    let classBlockParamsCreator = Base.nConvStageType_to_BlockParamsCreator_ClassArray[ stageParams.nConvStageTypeId ];
    let aBlockParamsCreator = new classBlockParamsCreator( stageParams );

    return aBlockParamsCreator;
  }

}


/**
 * Mapping nConvStageType (number as array index) to BlockParamsCreator class object.
 */
Base.nConvStageType_to_BlockParamsCreator_ClassArray = [
  BlockParamsCreator.MobileNetV1,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1 (0)
  BlockParamsCreator.MobileNetV1_padValid,                // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID (1)
  BlockParamsCreator.MobileNetV2_Thin,                    // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN (2)
  BlockParamsCreator.MobileNetV2,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2 (3)
  BlockParamsCreator.ShuffleNetV2,                        // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2 (4)
  BlockParamsCreator.ShuffleNetV2_ByPointwise21,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21 (5)
  BlockParamsCreator.ShuffleNetV2_ByMobileNetV1,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (6)
  BlockParamsCreator.ShuffleNetV2_ByMobileNetV1_padValid, // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (7)
];
