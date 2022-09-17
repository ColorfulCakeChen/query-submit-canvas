export { Stage_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Block from "../Block.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import * as BlockParamsCreator from "./Stage_BlockParamsCreator.js";
import { Params } from "./Stage_Params.js";
import { InferencedParams } from "./Stage_InferencedParams.js";

/**
 * Implement a stage of  or MobileNetV1 or MobileNetV2 or ShuffleNetV2 (with 2
 * output channel groups). It is a sequence of depthwise convolution and pointwise
 * convolution.
 *
 *
 * 1. Halve Height, Halve Width
 *
 * All types of stage will output an image whose height and width are only half of
 * the input image's height and width.
 *
 * They all do it at block0 and by the same method: depthwise convolution with
 * ( strides = 2 ). Most will do it with ( pad = "same" ).  But some will do it with
 * ( pad = "valid" ).
 *
 *
 * 2. Double channels
 *
 * All types of stage will output an image whose channel count is twice of the input
 * image's channel count. They all do it at block0 but by different ways:
 *
 *   - MobileNetV1 (0), MobileNetV1_padValid (1)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( bPointwise1 ==  true ), pointwise1 double of input0.
 *
 *   - MobileNetV2_Thin (2)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0. pointwis21 double of input0.
 *     - ( bPointwise1 ==  true ), pointwise1 double of input0. pointwis21 double of input0.
 *
 *   - MobileNetV2 (3)
 *     - ( bPointwise1 == false ), depthwise1 quadruple ( channelMultiplier == 4 ) of input0. pointwis21 double of input0.
 *     - ( bPointwise1 ==  true ), pointwise1 quadruple of input0. pointwis21 double of input0.
 *
 *   - ShuffleNetV2 (4), ShuffleNetV2_ByPointwise21 (5)
 *     - ( bPointwise1 == false ), depthwise1 double ( channelMultiplier == 2 ) of input0.
 *     - ( bPointwise1 ==  true ), concatenate depthwise1 and depthwise2.
 *
 *   - ShuffleNetV2_ByMobileNetV1 (6), ShuffleNetV2_ByMobileNetV1_padValid (7)
 *     - ( bPointwise1 == false ), pointwise1 (lower half pass through, higher half copy input0) double of input0.
 *     - ( bPointwise1 ==  true ), pointwise1 (higher half copy input0) double of input0.
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
 * All non-MobileNetV2_Xxx ConvStageType use the following:
 *   - pointwise1: bias, activation.
 *
 *   - depthwise:  bias, activation.
 *     - In ShuffleNetV2's original design, depthwise has bias but has no activation.
 *     - We let depthwise also has activation (just like MobileNetV2_Xxx).
 *
 *   - pointwise2: bias, NO activation.
 *     - In ShuffleNetV2's original design, pointwise2 always has bias and activation.
 *     - We let pointwise2 has no activation (just like MobileNetV2_Xxx).
 *
 *   - postfix squeeze-and-excitation.
 *     - In non-MobileNetV2_Xxx, the squeeze-and-excitation is behind pointwise2.
 *     - This is the main different from MobileNetV2_Xxx.
 *     - This prevents pointwise2 and the next stage's pointwise1 from becoming one
 *         affine transformation.
 *
 * 
 * 3.1 MobileNetV2_Xxx's pointwise2: no activation
 *
 * The reason why MobileNetV2_Xxx's pointwise2 could always have no activation
 * function is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its
 * block's output is not affine transformation (even if no activation function).
 * It and the next block's pointwise1 do not form continuous multiple affine
 * transformation and will not become just one affine transformation.
 *
 *
 * 3.2 non-MobileNetV2_Xxx's pointwise2:
 *
 *
 * 3.2.1 Original Design
 * 
 * In ShuffleNetV2's original design, depthwise has bias but has no activation,
 * pointwise2 always has bias and activation. This also avoids the previous
 * block's pointwise2 and the next block's pointwis1 become just one (i.e. not
 * two) affine transformation (i.e. do twice computation but just have same
 * effect of one computation).
 *
 *
 * Problem1
 *
 * In ShuffleNetV2_ByMobileNetV1, if an operation has activation function, its
 * pass-through part will scale its convolution filters for escaping the activation
 * function's non-linear parts (in order to keep linear). This results in its
 * output is wrong (i.e. different from original ShuffleNetV2). In order to resolve
 * this issue, the last stage's last operation (i.e. last stage's blockLast's
 * pointwise2) should have no activation (so it will not scale its convolution
 * filters for escaping the activation function's non-linear parts).
 *
 * 
 * Problem2
 * 
 * In ShuffleNetV2_Xxx, even if the staeLast's pointwise2 has no activation (i.e.
 * ( bPointwise2ActivatedAtStageEnd == true ) ), the stageLast's output's higher
 * half are still activated (and not usable by caller) because the they come from
 * stageLast's previous stage directly.
 *
 *
 * 3.2 Current Design
 *
 * Use MobileNetV2's configuration (i.e. depthwise has activation and pointwise2
 * does not have activation). However, in order to prevent pointwise2 from becoming
 * linear transformation, a squeeze-and-excitation postfix pointwise2 is necessary.
 *
 * Although this design is mainly for solving ShuffleNetV2_ByMobileNetV1's issue,
 * it does have practical advantage in fact. The output could have any value (i.e.
 * the whole number line). If the last operation (i.e. pointwise2) always has
 * activation function, the output value will always be restricted by the activation
 * function (e.g. [ -1, +1 ] if tanh()).
 *
 * 
 * 3.3 Appendix: Combined affine transformation
 *
 * 
 * 3.3.1 The characteristic of affine transformation:
 *
 *   "If an operation has no activation function (i.e. it is affine transformation),
 *    it can also have no bias because the next operation's bias can achieve the
 *    same result. (Multiple affine transformations can be combined into one affine
 *    transformation.)"
 *
 * In non-MobileNetV2_Xxx's original design, the depthwise does not have activation
 * function (and does not have squeeze-and-excitation following it) so it is affine
 * transformation. Since the depthwise's next operation (i.e. pointwise2) always
 * has bias, it is not necessary to have bias in the depthwise.
 *
 *
 * 3.3.2 Note the assumption's detail
 *
 * To accomplish the above affine transformation combination assumption, the "next
 * operation" should be:
 *   - pointwise convolution. or,
 *   - depthwise convolution with ( pad = "valid" ).
 *
 * Why not workable if the next operation is depthwise convolution with ( pad = "same" )?
 *
 * The reason is that the depthwise convolution with ( pad = "same" ) will pad zero.
 * The count of these padded zero is different according to the input pixel position.
 * The varying zero count results in that varying bias is required. Varying bias is
 * impossible to be achieved since data in the same channel could only have the same
 * bias.
 *
 * On the other hand, the depthwise convolution with ( pad = "valid" ) does not
 * pad any value. The per channel (fixed) bias is sufficient to remedy the previous
 * affine transformation's no-bias.
 *
 * Note: The squeeze (of squeeze-and-excitation) is depthwise (globale average)
 * convolution with ( pad = "valid" ). The excitation (of squeeze-and-excitation)
 * is pointwise convolution. So they also meet these criterion.
 *
 * 
 * 4. squeeze-and-excitation
 *
 * Because squeeze-and-excitation has activation function internally and will be
 * multiplied to its input, it should be viewed as a non-linear operation (just
 * like activation function is a non-linear operation).
 *
 * If squeeze-and-excitation is prefix the pointwise2 convolution (i.e. just after
 * the depthwise convolution), the depthwise convolution should have bias (and even
 * activation). Since squeeze-and-excitation is non-linear, if it is applied, a bias
 * should be applied (to achieve affine transformation) before the non-linearity
 * operation.
 *
 * In MobileNetV2_Xxx (whose squeeze-and-excitation is prefix), its depthwise has
 * bias (and activation) for this reason.
 *
 * In non-MobileNetV2_Xxx, the squeeze-and-excitation is postfix (not prefix) the
 * pointwise2 convolution to prevent pointwise2 and the next stage's pointwise1
 * from becoming one affine transformation.
 *
 *
 * 5. Note: tf.batchNorm()
 *
 * tf.batchNorm() has bias intrinsically.
 *
 * In modern deep learning CNN, there is batch normalization after convolution and
 * before activation. The batch normalization has bias internally. We do not have
 * batch normalization in architecture so an explicit bias will be used before every
 * activation function.
 *
 *
 * 6. Activation Escaping
 *
 * Activation function achieve non-linear transformation, but also destroy linear
 * information. In order to escape the activation function's non-linearity two possible
 * solutions are provided.
 *
 *
 * 6.1 Special activation function
 *
 * For neural network without special mechanism (e.g. MobileNetV1,
 * ShuffleNetv2_ByMobileNetV1), it is better to use
 * a activation function which:
 *   - has both negative and possible value near origin point.
 *   - is linear between these negative and possible value near origin point.
 *
 * For example, CLIP_BY_VALUE_N2_P2 or TANH or SIN.
 *
 * Advantage:
 *   - When neural network want information to keep linear, it could just scale value
 *       (by convolution filter weights) into the linear part.
 *
 * Disadvantage:
 *   - These activation escaping scaling might increase the floating-point accumulated
 *       error.
 *
 *
 * 6.2 Special connection
 *
 * Some neural networks has special mechanism to escape activation function's
 * non-linearity:
 *   - MobileNetV2 has residual connection. (add-input-to-output)
 *   - ShuffleNetV2 has pass-through channel group. (split-concat)
 *
 * Advantage:
 *   - Because these mechanism, it seems no problem to use any activation function. Even
 *       the activation function will destroy all negative input (e.g. RELU6 or SIGMOID
 *       or COS).
 *
 *   - They could achieve activation escaping without increase floating-point
 *       accumulated error.
 *
 * Disadvantage:
 *   - These mechanism increase opertions and computation time.
 *
 *
 *
 *
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray by
 * initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray by
 * initer(). Where to extract next weights. Only meaningful when ( this.bInitOk == true ).
 *
 * @member {Block.Base[]} blockArray
 *   All computation blocks of this stage.
 *
 * @member {Block.Base} block0
 *   The first computation block of this stage.
 *
 * @member {Block.Base} blockLast
 *   The last computation block of this stage. It may be the same as this.block0 when
 * there is only one block inside this stage.
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this stage's input.
 *
 * @member {number} output_height
 *   The output image height of this stage's last block.
 *
 * @member {number} output_width
 *   The output image width of this stage's last block.
 *
 * @member {number} output_channelCount
 *   The output channel count of this stage's last block.
 *
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this stage's output.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are
 * not used in tensors. Including inferenced weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not
 * including Params, because they are not used in tensors. Not including inferenced
 * weights (even if they are used in tensors), because they are not extracted from
 * inputWeightArray.
 *
 */
class Stage_Base extends Recyclable.Root {

  /**
   * Used as default Stage.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.Base.Pool", Stage_Base, Stage_Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Stage_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Stage_Base.setAsConstructor_self.call( this );
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
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The weights source array to be extracted from. It will not be kept by this object.
   *
   * @param {number} weightElementOffsetBegin
   *   The beginning position (i.e. array index) to extract from inputWeightArray.
   *
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters. This
   * params will be owned and destroyed by this .initer(). So caller should not use
   * it again.
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input_ScaleBoundsArray_or_TensorPlaceholder
   *   The element value bounds (per channel) or TensorPlaceholder of this stage's input.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   */
  * initer( progressParent, inputWeightArray, weightElementOffsetBegin, params,
    input_ScaleBoundsArray_or_TensorPlaceholder ) {

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
      1    // for extracting parameters from inputWeightArray.
      ;

    let progressRoot = progressParent.root_get();

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) ); // For parameters extracting.

    let progressForBlocks = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() ); // for block0, block1, block2, ... 

    let blockParamsCreator;
    try {
      // 1. Extract parameters.
      if ( !params )
        return false;

      if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
        return false;  // e.g. input array does not have enough data.
      this.weightElementOffsetEnd = params.weightElementOffsetEnd;

      // Get parameters' real (adjusted) values.
      //
      // Do not keep params in this.params for reducing memory usage.
      this.input_height = params.input_height;
      this.input_width = params.input_width;
      this.input_channelCount = params.input_channelCount;
      this.nConvStageTypeId = params.nConvStageTypeId;
      this.nConvStageTypeName = params.nConvStageTypeName;
      this.blockCountRequested = params.blockCountRequested;
      this.bPointwise1 = params.bPointwise1;
      this.depthwiseFilterHeight = params.depthwiseFilterHeight;
      this.depthwiseFilterWidth = params.depthwiseFilterWidth;
      this.nSqueezeExcitationChannelCountDivisor = params.nSqueezeExcitationChannelCountDivisor;
      this.nSqueezeExcitationChannelCountDivisorName = params.nSqueezeExcitationChannelCountDivisorName;
      this.nActivationId = params.nActivationId;
      this.nActivationName = params.nActivationName;
      this.bKeepInputTensor = params.bKeepInputTensor;

      // The parameters which are determined (inferenced) from the above parameters.
      {
      }

      this.tensorWeightCountExtracted = 0;
      this.tensorWeightCountTotal = 0;

      progressToAdvance.value_advance();
      yield progressRoot;  // Parameters extracted. Report progress.

      let BlockParamsClass = params.BlockParamsClass_get();

      // 2. Create every blocks.
      blockParamsCreator = InferencedParams.create_BlockParamsCreator_byStageParams( params );
      blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real block count.

      for ( let i = 0; i < blockParamsCreator.blockCount; ++i ) { // Progress for block0, 1, 2, 3, ... 
        progressForBlocks.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }

      let blockParams, block, blockIniter;
      let input0_ScaleBoundsArray_or_TensorPlaceholder, input1_ScaleBoundsArray_or_TensorPlaceholder;
      let next_input_height, next_input_width;

      this.blockArray = Recyclable.OwnerArray.Pool.get_or_create_by(); // Note: OwnerArray can not accept length as parameter.
      this.blockArray.length = blockParamsCreator.blockCount;

      for ( let i = 0; i < this.blockArray.length; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

        if ( 0 == i ) { // Block0.
          blockParamsCreator.configTo_beforeBlock0();
          input0_ScaleBoundsArray_or_TensorPlaceholder = input_ScaleBoundsArray_or_TensorPlaceholder;
        } else { // (i.e. block1, 2, 3, ...)
          blockParamsCreator.configTo_beforeBlockN_exceptBlock0( i, next_input_height, next_input_width );
        }

        // BlockLast. (Note: Block0 may also be BlockLast.) 
        //
        // If this is the last block of this stage (i.e. at-stage-end)
        //   - a different depthwise filter size may be used.
        //   - a different activation function may be used after pointwise2 convolution.
        if ( ( this.blockArray.length - 1 ) == i ) {
          blockParamsCreator.configTo_beforeBlockLast();
        }

        blockParams = blockParamsCreator.create_BlockParams( BlockParamsClass ); // Create current block parameters.

        if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

          // If channelShuffler is not null, keep it so that its tensors could be released.
          let channelShuffler = blockParamsCreator.channelShuffler;
          if ( channelShuffler ) {

            if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
              throw Error( `Stage.Base.initer(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all blocks of a stage).` );

            this.channelShuffler = channelShuffler;
            blockParamsCreator.channelShuffler = null; // (Ownership transferred.)

            this.tensorWeightCountExtracted += channelShuffler.tensorWeightCountExtracted;
            this.tensorWeightCountTotal += channelShuffler.tensorWeightCountTotal;

          // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler will be cleared and could not be used
          // for releasing tensors.
          }

        // If channelShuffler has ever got, never change it.
        }

        blockParams.channelShuffler = this.channelShuffler; // Block.Params needs channel shuffler info (but does not own it).

        block = this.blockArray[ i ] = Block.Base.Pool.get_or_create_by();
        blockIniter = block.initer( progressForBlocks.children[ i ], inputWeightArray, this.weightElementOffsetEnd, blockParams,
          input0_ScaleBoundsArray_or_TensorPlaceholder, input1_ScaleBoundsArray_or_TensorPlaceholder
        );

        this.bInitOk = yield* blockIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = block.weightElementOffsetEnd;

        this.tensorWeightCountTotal += block.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += block.tensorWeightCountExtracted;

        input0_ScaleBoundsArray_or_TensorPlaceholder = block.output0;
        input1_ScaleBoundsArray_or_TensorPlaceholder = block.output1;

        next_input_height = block.output_height;
        next_input_width = block.output_width;
      }

      this.block0 = this.blockArray[ 0 ]; // Shortcut to the first block.
      this.blockLast = this.blockArray[ this.blockArray.length - 1 ]; // Shortcut to the last block.

//!!! (2022/08/03 Temp Remarked) For debug.
      this.dispose_intermediate_ScaleBoundsArray(); // Release all intermediate blocks' bounds array set for reducing memory footprint.

      this.bInitOk = true;
      return this.bInitOk;

    } finally {
      if ( blockParamsCreator ) {
        blockParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        blockParamsCreator.disposeResources_and_recycleToPool();
        blockParamsCreator = null;
      }
      if ( params ) {
        params.disposeResources_and_recycleToPool();
        params = null;
      }
    }
  }

  /**
   * Initialize this object by calling initer() and advance the generator by loop
   * until done.
   *
   * @return {boolean}
   *   - Return true if successfully (and progressParent.valuePercentage will be equal
   *       to 100).
   *   - Return false if failed (and progressParent.valuePercentage will be less than
   *       100).
   *
   * @see Block.Base.init()
   */
  init( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 ) {

    let initer = this.initer( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.root_get().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** @override */
  disposeResources() {
    this.blockLast = null; // It is just a reference into this.blockArray[].
    this.block0 = null; // It is just a reference into this.blockArray[].

    if ( this.blockArray ) {
      this.blockArray.disposeResources_and_recycleToPool();
      this.blockArray = null;
    }

    this.channelShuffler_dispose();

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

    this.weightElementOffsetBegin = this.weightElementOffsetEnd = -1;
    this.bInitOk = false;

    super.disposeResources();
  }

  /**
   *
   */
  channelShuffler_dispose() {
    if ( this.channelShuffler ) {
      this.channelShuffler.disposeResources_and_recycleToPool();
      this.channelShuffler = null;
    }
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except .block0.inputX and .blockLast.outputX
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    if ( !this.blockArray )
      return;

    { // 1. Release blockLast's inputs' ScaleBoundsArray. (Note: .blockLast.outputX are kept.)
      this.blockLast.input1?.ScaleBoundsArray_dispose();
      this.blockLast.input0.ScaleBoundsArray_dispose();
    }

    // 2. Release intermediate (i.e. except block0 and blockLast) blocks' inputs' and outputs' ScaleBoundsArray.
    for ( let i = ( this.blockArray.length - 2 ); i >= 1; --i ) {
      let block = this.blockArray[ i ];
      block.output1?.ScaleBoundsArray_dispose();
      block.output0.ScaleBoundsArray_dispose();
      block.input1?.ScaleBoundsArray_dispose();
      block.input0.ScaleBoundsArray_dispose();
    }

    { // 3. Release block0's outputs' ScaleBoundsArray. (Note: .block0.inputX are kept.)
      this.block0.output1?.ScaleBoundsArray_dispose();
      this.block0.output0.ScaleBoundsArray_dispose();
    }
  }

  /**
   * Generator for processing input, destroying or keeping input, returning result.
   *
   * @param {tf.tensor3d} inputTensor
   *   The source input image ( height x width x channel ) which will be processed.
   * This inputTensor may or may not be disposed according to init()'s bKeepInputTensor.
   *
   * @param {ValueMax.Percentage.Concrete} progressToAdvance
   *   This progressToAdvance will be increased when every time advanced. The
   * progressToAdvance.root_get() will be returned when every time yield.
   *
   * @yield {ValueMax.Percentage.Base}
   *   Yield ( value = progressToAdvance.root_get() ) when ( done = false ).
   *
   * @yield {tf.tensor3d}
   *   Yield ( value = outputTensor ) when ( done = true ).
   */
  * applier( progressToAdvance, inputTensor ) {
    let progressRoot = progressToAdvance.root_get();

    this.block0.input0.realTensor = inputTensor; // Note: The block0 should only input one tensor.

    let blockArray = this.blockArray;
    for ( let i = 0; i < blockArray.length; ++i ) {
      blockArray[ i ].apply();

      progressToAdvance.value_advance();
      yield progressRoot;  // One block executed. Report progress.
    }

    let outputTensor = this.blockLast.output0.realTensor; // Note: The blockLast should only output one tensor.
    return outputTensor;
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
    this.block0.input0.realTensor = inputTensor; // Note: The block0 should only input one tensor.

    let blockArray = this.blockArray;
    for ( let i = 0; i < blockArray.length; ++i ) {
      blockArray[ i ].apply();
    }

    let outputTensor = this.blockLast.output0.realTensor; // Note: The blockLast should only output one tensor.
    return outputTensor;
  }

  /** How many blocks inside this stage are created. (may different from this.blockCountRequested.) */
  get blockCount() {
    return this.blockArray.length;
  }

  get input0() {
    return this.block0.input0;
  }

  get output0() {
    return this.blockLast.output0;
  }

  get output_height() {
    return this.blockLast.output_height;
  }

  get output_width() {
    return this.blockLast.output_width;
  }

  get output_channelCount() {
    return this.blockLast.output_channelCount;
  }

  /**
   * @return {string} The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let str =
        `input_height=${this.input_height}, input_width=${this.input_width}, input_channelCount=${this.input_channelCount}, `
      + `nConvStageTypeName=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `
      + `blockCountRequested=${this.blockCountRequested}, blockCount=${this.blockCount}, `
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `

      + `nSqueezeExcitationChannelCountDivisorName=${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `nActivationName=${this.nActivationName}(${this.nActivationId}), `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `

      + `blockCount=${this.blockCount}, `
      + `output_height=${this.output_height}, output_width=${this.output_width}, output_channelCount=${this.output_channelCount}`
    ;
    return str;
  }

}
