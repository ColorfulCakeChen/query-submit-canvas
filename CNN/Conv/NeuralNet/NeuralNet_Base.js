export { NeuralNet_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as Block from "../Block.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";
import { Params } from "./NeuralNet_Params.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";
import { ScaleFiller as NeuralNet_ScaleFiller } from "./NeuralNet_ScaleFiller.js";

//!!! ...unfinished... (2022/08/05)
// For neural network with recurrent (i.e. with feedback), perhaps, concatenate
// the previous NeuralNet output (which is float32) with the current embedding
// output (which is float32 too).
//
// The reason is that NeuralNet input should be int32 (for embedding layer needs)
// while (previous) NeuralNet output is float32.
//
//

/**
 * This is the base class of NeuralNet.
 *
 * NeuralNet is composed of:
 *   - an embedding
 *   - multiple stages
 *   - final block for squish result shape to [ 1, 1, output_channelCount ]
 *
 *
 *
 *
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray
 * by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray
 * by initer(). Where to extract next weights. Only meaningful when
 * ( this.bInitOk == true ).
 *
 * @member {number[]} input_height_width_array
 *   An array records [ this.input_height, this.input_width ]. It is mainly used when
 * scale input image to correct size.
 *
 * @member {number[]} input_shape
 *   An array records [ this.input_height, this.input_width, this.input_channelCount ].
 * It is mainly used when create input image tensor to be applied.
 *
 * @member {Embedding.Base} embedding
 *   The embedding layer before all stages of this neuralNet.
 *
 * @member {Stage.Base[]} stageArray
 *   All computation stages of this neuralNet.
 *
 * @member {Stage.Base} stage0
 *   The first computation stage of this neuralNet.
 *
 * @member {Stage.Base} stageLast
 *   The last computation stage of this neuralNet. It may be the same as this.stage0
 * when there is only one stage inside this neuralNet.
 *
 * @member {Block.Base} blockFinal
 *   The final block of this neuralNet. It is responsible for squishing output shape
 * to [ 1, 1, output_channelCount ].
 *
 * @member {number} stageCount
 *   How many stages inside this neuralNet are created. It is related to
 * ( output_channelCount / ( input_channelCount * vocabularyChannelCount ) ).
 *
 * @member {number} blockCountPerStage
 *   How many blocks inside this neuralNet's stageLast are created. It is related to
 * ( blockCountTotalRequested / stageCount ).
 *
 * @member {number} stageLast_output_height
 *   The output image height of this neuralNet's last stage.
 *
 * @member {number} stageLast_output_width
 *   The output image width of this neuralNet's last stage.
 *
 * @member {number} stageLast_output_channelCount
 *   The output channel count of this neuralNet's last stage.
 *
 * @member {number} output_height
 *   The output image height of this neuralNet's final block.
 *
 * @member {number} output_width
 *   The output image width of this neuralNet's final block.
 *
 * @member {number} output_channelCount
 *   The output channel count of this neuralNet's final block.
 *
 * @member {boolean} output_asInputValueRange
 *   Whether output value is restricted to the (neural network) input value
 * range (i.e. non-negative integer which can be used in embedding looking up).
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are
 * not used in tensors. Including inferenced weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not
 * including Params, because they are not used in tensors. Not including inferenced
 * weights (even if they are used in tensors), because they are not extracted
 * from inputWeightArray.
 *
 * @member {ValueMax.Percentage.Concrete} progressApply
 *   The progressToAdvance when .applier().
 *
 */
class NeuralNet_Base extends Recyclable.Root {

  /**
   * Used as default NeuralNet.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.Base.Pool",
    NeuralNet_Base, NeuralNet_Base.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralNet_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralNet_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Nothing to do here (for NeuralNet.Base).
  }

  /**
   * Generator for initializing this object.
   *
   * Note: NeuralNet.initer() does not have argument inputScaleBoundsArray0.
   *       The reason is it has an embedding layer which is does not have
   *       inputScaleBoundsArray0 too. So, it also assumes input's value bounds
   *       is [ 0, vocabularyCountPerInputChannel ].
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The weights source array to be extracted from. It will not be kept by this object.
   *
   * @param {number} weightElementOffsetBegin
   *   The beginning position (i.e. array index) to extract from inputWeightArray.
   *
   * @param {NeuralNet.Params} params
   *   A Params object. The params.init() will be called to extract parameters.
   * This params will be owned and destroyed by this .initer(). So caller should
   * not use it again.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   */
  * initer( progressParent, inputWeightArray, weightElementOffsetBegin, params ) {

    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.bInitOk = false;

    // 0.1 Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputWeightArray.
      ;

    let progressRoot = progressParent.root_get();

    // For parameters extracting.
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

    // For embedding extracting.
    let progressForEmbedding = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    // For stage0, stage1, stage2, ... 
    let progressForStages = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressForBlockFinal = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() ); // for blockFinal.

    let stageParamsCreator;
    try {
      // 0.2 Extract parameters.
      if ( !params )
        return false;

      if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
        return false;  // e.g. input array does not have enough data.
      this.weightElementOffsetEnd = params.weightElementOffsetEnd;

      // Get parameters' real (adjusted) values.
      //
      // Do not keep params in this.params for reducing memory usage.
      this.explicit_input_height = params.explicit_input_height;
      this.explicit_input_width = params.explicit_input_width;
      this.explicit_input_channelCount = params.explicit_input_channelCount;
      this.has_implicit_input = params.has_implicit_input;
      this.vocabularyChannelCount = params.vocabularyChannelCount;
      this.vocabularyCountPerInputChannel = params.vocabularyCountPerInputChannel;
      this.nConvStageTypeId = params.nConvStageTypeId;
      this.nConvStageTypeName = params.nConvStageTypeName;
      this.blockCountTotalRequested = params.blockCountTotalRequested;
      this.output_asInputValueRange = params.output_asInputValueRange;
      this.bKeepInputTensor = params.bKeepInputTensor;

      // The parameters which are determined (inferenced) from the above parameters.
      {
        this.implicit_input_height = params.inferencedParams.implicit_input_height;
        this.implicit_input_width = params.inferencedParams.implicit_input_width;
        this.implicit_input_channelCount = params.inferencedParams.implicit_input_channelCount;

        this.input_height = params.inferencedParams.input_height;
        this.input_width = params.inferencedParams.input_width;
        this.input_channelCount = params.inferencedParams.input_channelCount;

        this.feedbackShape = params.inferencedParams.feedbackShape;

        this.bEmbedVocabularyId = params.inferencedParams.bEmbedVocabularyId;

        if ( this.input_height_width_array ) {
          this.input_height_width_array.length = 2;
          this.input_height_width_array[ 0 ] = this.input_height;
          this.input_height_width_array[ 1 ] = this.input_width;
        } else {
          this.input_height_width_array
            = new Array( this.input_height, this.input_width );
        }

        if ( this.input_shape ) {
          this.input_shape.length = 3;
          this.input_shape[ 0 ] = this.input_height;
          this.input_shape[ 1 ] = this.input_width;
          this.input_shape[ 2 ] = this.input_channelCount;
        } else {
          this.input_shape = new Array(
            this.input_height, this.input_width, this.input_channelCount );
        }
      }

      this.tensorWeightCountExtracted = 0;
      this.tensorWeightCountTotal = 0;

      progressToAdvance.value_advance();
      yield progressRoot;  // Parameters extracted. Report progress.

      let next_input_ScaleBoundsArray_or_TensorPlaceholder;

      // 1. Create embedding layer.
      {
        let EmbeddingParamsClass = params.EmbeddingParamsClass_get();
        let embeddingParams = EmbeddingParamsClass.Pool.get_or_create_by(
          this.input_height, this.input_width, this.input_channelCount,
          this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
          this.bEmbedVocabularyId,
          this.bKeepInputTensor
        );
    
        this.embedding = Embedding.AddGatherReshape.Pool.get_or_create_by();
        let embeddingIniter = this.embedding.initer( progressForEmbedding,
          inputWeightArray, this.weightElementOffsetEnd, embeddingParams
        );

        this.bInitOk = yield* embeddingIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = this.embedding.weightElementOffsetEnd;

        this.tensorWeightCountTotal += this.embedding.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += this.embedding.tensorWeightCountExtracted;

        next_input_ScaleBoundsArray_or_TensorPlaceholder
          = this.embedding.output_scaleBoundsArray; // (This is a ScaleBoundsArray.)
      }

      // 2. Create every stages.
      let StageParamsClass = params.StageParamsClass_get();

      stageParamsCreator = InferencedParams
        .create_StageParamsCreator_byNeuralNetParams( params );
      stageParamsCreator.determine_stageCount_blockCountPerStage();

      // Progress for stage0, 1, 2, 3, ... 
      for ( let i = 0; i < stageParamsCreator.stageCount; ++i ) {
        progressForStages.child_add(
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }

      let stageParams, stage, stageIniter;
      let next_input_height, next_input_width, next_input_channelCount;

      // Note: OwnerArray can not accept length as parameter.
      this.stageArray = Recyclable.OwnerArray.Pool.get_or_create_by();
      this.stageArray.length = stageParamsCreator.stageCount;

      // Stage0, 1, 2, 3, ..., StageLast.
      for ( let i = 0; i < this.stageArray.length; ++i ) {

        if ( 0 == i ) { // Stage0.
          stageParamsCreator.configTo_beforeStage0();
        } else { // (i.e. stage1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0(
            i, next_input_height, next_input_width, next_input_channelCount );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        if ( ( this.stageArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        // Create current stage parameters.
        stageParams = stageParamsCreator.create_StageParams( StageParamsClass );

        stage = this.stageArray[ i ] = Stage.Base.Pool.get_or_create_by();
        stageIniter = stage.initer( progressForStages.children[ i ],
          inputWeightArray, this.weightElementOffsetEnd, stageParams,
          next_input_ScaleBoundsArray_or_TensorPlaceholder
        );

        this.bInitOk = yield* stageIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = stage.weightElementOffsetEnd;

        this.tensorWeightCountTotal += stage.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += stage.tensorWeightCountExtracted;

        {
          // (This is a TensorPlaceholder.)
          next_input_ScaleBoundsArray_or_TensorPlaceholder = stage.output0;

          // For ShuffleNetV2_ByMobileNetV1, the previous stage's output
          // channel count will have lowerHalf and higherHalf. However, the
          // next stage's input needs lowerHalf equal whole channel count and
          // no higherHalf. Modify it for that.
          if ( ValueDesc.ConvStageType.isShuffleNetV2_ByMobileNetV1(
                 this.nConvStageTypeId ) ) {
            next_input_ScaleBoundsArray_or_TensorPlaceholder
              .channelCount_lowerHalf
                = next_input_ScaleBoundsArray_or_TensorPlaceholder.channelCount;

            next_input_ScaleBoundsArray_or_TensorPlaceholder
              .channelCount_higherHalf = 0;
          }
        }

        next_input_height = stage.output_height;
        next_input_width = stage.output_width;
        next_input_channelCount = stage.output_channelCount;
      }

      this.stage0 = this.stageArray[ 0 ]; // Shortcut to the first stage.

      // Shortcut to the last stage.
      this.stageLast = this.stageArray[ this.stageArray.length - 1 ];

      // 3. Create final block.
      {
        let BlockParamsClass = params.BlockParamsClass_get();

        stageParamsCreator.configTo_beforeBlockFinal(
          BlockParamsClass,
          this.stageLast_output_height,
          this.stageLast_output_width,
          this.stageLast_output_channelCount
        );

        let blockFinalParams = stageParamsCreator.blockFinalParams;

        // (Because ownship has transferrred.)
        stageParamsCreator.blockFinalParams = null;

        // No matter stageLast uses what kinds of block, there is always no
        // higher and lower half in the final block. So nullify them.
        // (Otherwise, Block.Base creation will be failed.)
        next_input_ScaleBoundsArray_or_TensorPlaceholder
          .channelCount_lowerHalf = undefined;
        next_input_ScaleBoundsArray_or_TensorPlaceholder
          .channelCount_higherHalf = undefined;

        let blockFinal = this.blockFinal = Block.Base.Pool.get_or_create_by();
        let blockIniter = blockFinal.initer( progressForBlockFinal,
          inputWeightArray, this.weightElementOffsetEnd, blockFinalParams,
          next_input_ScaleBoundsArray_or_TensorPlaceholder
        );

        this.bInitOk = yield* blockIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = blockFinal.weightElementOffsetEnd;

        this.tensorWeightCountTotal += blockFinal.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += blockFinal.tensorWeightCountExtracted;

        next_input_ScaleBoundsArray_or_TensorPlaceholder
          = blockFinal.output0_scaleBoundsArray;
      }

      // Release all intermediate stages' bounds array set for reducing memory
      // footprint.
      this.dispose_intermediate_ScaleBoundsArray();

      {
        // Estimate the maximum value of progress for .applier().
        let progressApplyMax =
            1                    // for embedding.
          + this.blockCountTotal // for all block of all stages.
          + 1                    // for blockFinal.
          ;

        this.progressApply
          = ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressApplyMax );
      }

      this.bInitOk = true;
      return this.bInitOk;

    } finally {
      if ( stageParamsCreator ) {
        // (Because ownership has been transferred to this NeuralNet object.)
        stageParamsCreator.channelShuffler = null;
        stageParamsCreator.disposeResources_and_recycleToPool();
        stageParamsCreator = null;
      }
      if ( params ) {
        params.disposeResources_and_recycleToPool();
        params = null;
      }
    }
  }

  /**
   * Initialize this object by calling initer() and advance the generator by
   * looping until done.
   *
   * @return {boolean}
   *   - Return true, if succeeded (and progressParent.valuePercentage will be
   *       equal to 100).
   *   - Return false, if failed (and progressParent.valuePercentage will be
   *       less than 100).
   */
  init( progressParent, inputWeightArray, weightElementOffsetBegin, params ) {

    let initer = this.initer( progressParent,
      inputWeightArray, weightElementOffsetBegin, params );

    let initerNext;
    do {
      initerNext = initer.next();

    // When ( false == initerNext.done ), the ( initerNext.value ) will be
    // progressParent.root_get().
    } while ( ! initerNext.done );

    // When ( true == initerNext.done ), the ( initerNext.value ) will be
    // initialization successfully or failed.
    let bInitOk = initerNext.value;
    return bInitOk;
  }

  /** @override */
  disposeResources() {

    if ( this.progressApply ) {
      this.progressApply.disposeResources_and_recycleToPool();
      this.progressApply = null;
    }

    if ( this.blockFinal ) {
      this.blockFinal.disposeResources_and_recycleToPool();
      this.blockFinal = null;
    }

    this.stageLast = null; // It is just a reference into this.stageArray[].
    this.stage0 = null; // It is just a reference into this.stageArray[].

    if ( this.stageArray ) {
      this.stageArray.disposeResources_and_recycleToPool();
      this.stageArray = null;
    }

    if ( this.embedding ) {
      this.embedding.disposeResources_and_recycleToPool();
      this.embedding = null;
    }

    this.input_shape.length = 0; // (Keep and re-use array.)
    this.input_height_width_array.length = 0; // (Keep and re-use array.)
    this.bEmbedVocabularyId = undefined;

    this.feedbackShape = undefined;

    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.implicit_input_channelCount = undefined;
    this.implicit_input_width = undefined;
    this.implicit_input_height = undefined;

    this.bKeepInputTensor = undefined;
    this.blockCountTotalRequested = undefined;
    this.nConvStageTypeName = undefined;
    this.nConvStageTypeId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.vocabularyChannelCount = undefined;
    this.has_implicit_input = undefined;
    this.explicit_input_channelCount = undefined;
    this.explicit_input_width = undefined;
    this.explicit_input_height = undefined;

    this.tensorWeightCountTotal = undefined;
    this.tensorWeightCountExtracted = undefined;

    this.weightElementOffsetBegin = undefined;
    this.weightElementOffsetEnd = undefined;
    this.bInitOk = undefined;

    super.disposeResources();
  }

  /**
   * Release all stages' ScaleBoundsArray (inside tensor placeholder) except:
   * .stage0.inputX and .stageLast.outputX.
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   *
   * Note:
   *   - .embedding.output_scaleBoundsArray still exists, too.
   *   - .blockFinal.inputX and .blockFinal.outputX still exist, too.
   *       (.blockFinal's other ScaleBoundsArray are released by Block itself.)
   *
   */
  dispose_intermediate_ScaleBoundsArray() {
    if ( !this.stageArray )
      return;

    // Note: In this case, stage0 and stageLast are the same one.
    if ( this.stageCount <= 1 )
      return; // No intermediate stage exists.

    { // 1. Release stageLast's inputs' ScaleBoundsArray. (Note:
      //    .stageLast.outputX are kept.)
      this.stageLast.input1?.ScaleBoundsArray_dispose();
      this.stageLast.input0.ScaleBoundsArray_dispose();
    }

    // 2. Release intermediate (i.e. except stage0 and stageLast) stages'
    //    inputs' and outputs' ScaleBoundsArray.
    for ( let i = ( this.stageArray.length - 2 ); i >= 1; --i ) {
      let stage = this.stageArray[ i ];
      stage.output1?.ScaleBoundsArray_dispose();
      stage.output0.ScaleBoundsArray_dispose();
      stage.input1?.ScaleBoundsArray_dispose();
      stage.input0.ScaleBoundsArray_dispose();
    }

    { // 3. Release stage0's outputs' ScaleBoundsArray.
      //    (Note: .stage0.inputX are kept.)
      this.stage0.output1?.ScaleBoundsArray_dispose();
      this.stage0.output0.ScaleBoundsArray_dispose();
    }
  }

  /**
   * Generator for processing input, destroying or keeping input, returning result.
   *
   * @param {tf.tensor3d} inputTensor
   *   The source input image (which size should be [ this.input_height,
   * this.input_width, this.input_channelCount ] ) which will be processed.
   * This inputTensor may or may not be disposed according to init()'s
   * NeuralNet.Params.bKeepInputTensor.
   *
   * @yield {ValueMax.Percentage.Base}
   *   Yield ( value = this.progressApply.root_get() ) when ( done = false ).
   *
   * @yield {tf.tensor3d}
   *   Yield ( value = outputTensor ) when ( done = true ).
   */
  * applier( inputTensor ) {

    // 0.

    // 0.1 Reset progress.
    let progressToAdvance = this.progressApply;
    let progressRoot = progressToAdvance.root_get();

    progressToAdvance.value = 0;
    yield progressRoot;  // progress reset to zero. Report progress.

    // 0.2 Ensure input tensor shape.
    if (   ( inputTensor.shape.length != this.input_shape.length )
        || ( inputTensor.shape[ 0 ] != this.input_shape[ 0 ] )
        || ( inputTensor.shape[ 1 ] != this.input_shape[ 1 ]  )
        || ( inputTensor.shape[ 2 ] != this.input_shape[ 2 ]  ) )
      throw Error( `NeuralNet_Base.applier(): `
        + `inputTensor.shape=[ ${inputTensor.shape} ] `
        + `should be the same as `
        + `.input_shape=[ ${this.input_shape} ].`
      );

    // 1. Embedding
    let outputTensor = this.embedding.apply( inputTensor );

    progressToAdvance.value_advance();
    yield progressRoot;  // Embedding done. Report progress.

    // 2. Stages
    let stageArray = this.stageArray;
    for ( let i = 0; i < stageArray.length; ++i ) {
      outputTensor = yield* stageArray[ i ].applier( progressToAdvance, outputTensor );
    }

    // 3. BlockFinal
    {
      this.blockFinal.input0.realTensor = outputTensor;
      this.blockFinal.apply();

      // Restricting final output to the same value range as input (i.e.
      // non-negative integer which can be used in embedding looking up).
      //
      // This is useful if the output should become recurrent feedback of the
      // next time input.
      if ( this.output_asInputValueRange ) {
        this.blockFinal.output0.realTensor
          = this.Tensor_restrict_to_InputValueRange_and_dispose(
              this.blockFinal.output0.realTensor,
              this.blockFinal.output0_scaleBoundsArray );
      }

      outputTensor = this.blockFinal.output0.realTensor;

      progressToAdvance.value_advance();
      yield progressRoot;  // BlockFinal done. Report progress.
    }

    return outputTensor;
  }

  /**
   * Process input, destroy or keep input, return result by calling applier()
   * and advance the generator by loop until done.
   *
   * @param {tf.tensor3d} inputTensor
   *   The source input image (whose size should be [ this.input_height,
   * this.input_width, this.input_channelCount ] ) which will be processed.
   * This inputTensor may or may not be disposed according to init()'s
   * NeuralNet.Params.bKeepInputTensor.
   *
   * @return {tf.tensor3d}
   *   Return a new tensor. All other intermediate tensors were disposed.
   *
   * @see this.applier()
   */
  apply( inputTensor ) {

    let applier = this.applier( inputTensor );
    let applierNext;
    do {
      applierNext = applier.next();

    // When ( false == applierNext.done ), the ( applierNext.value ) will
    // be this.progressApply.root_get().
    } while ( !applierNext.done );

    // When ( true == applierNext.done ), the ( applierNext.value ) will
    // be outputTensor.
    let outputTensor = applierNext.value;
    return outputTensor;
  }

  /**
   * Create a tensor3d from source (e.g. canvas). Its size will be confirmed
   * (by scaling) to this neural network's acceptable input [ height, width ].
   *
   *
   * Note: It is more recommended to use Canvas Context drawImage() to scale
   *       image than this method. The reason is:
   * 
   *         - drawImage() operates on GPU directly.
   * 
   *         - This method downloads data from GPU to CPU for creating tensor.
   *             And then, uploads data from CPU to GPU to scale tensor.
   *
   *
   * @param {ImageData|ImageBitmap|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} source_PixelData
   *   The image or canvas which provides image (as RGBA 4-channels Uint8 data).
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will be guaranteed as
   * int32. Otherwise, the dtype of the returned tf.tensor3d may be int32 or
   * float32 (if resized). This is useful if the result will be used by an
   * embedding layer (which only accepts integer input). Default is true.
   *
   * @return {tf.tensor3d}
   *   Return the tensor3d which is the scaled image from canvas. Its size will
   * be [ this.input_height, this.input_width, this.input_channelCount ].
   */
  createTensor_by_scale_PixelData( source_PixelData, bForceInt32 = true ) {
    return NeuralNet_ScaleFiller.createTensor_by_scale_PixelData(
        source_PixelData,
        this.input_channelCount,
        this.input_height_width_array,
        bForceInt32 );
  }

  /**
   * @param {tf.tensor3d} inputTensor
   *   The tensor to be restricted. It will always be disposed, no matter
   * converting is successful or failed.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} io_scaleBoundsArray
   *   The ScaleBoundsArray of inputTensor. Its .boundsArray will be modified
   * to new lower and upper bounds.
   * 
   * @return {tf.tensor3d}
   *   Return a new tensor whose values are restricted to integers between
   * [ 0, ( vocabularyCountPerInputChannel - 1 ) ]. The inputTensor and all
   * other intermediate tensors were disposed.
   */
  Tensor_restrict_to_InputValueRange_and_dispose(
    inputTensor, io_scaleBoundsArray ) {

    // Embedding can only accept integer values between
    // [ 0, ( vocabularyCountPerInputChannel - 1 ) ] because they are used as
    // array indexes.
    const valueMin = 0;
    const valueMax = this.embedding.vocabularyIdMax;

    io_scaleBoundsArray.boundsArray.set_all_byLowerUpper( valueMin, valueMax );

    // Note: This can not be implemented by Block's pointwise20ActivationId
    //       (e.g. CLIP_BY_VALUE_N0_P255, CLIP_BY_VALUE_N0_P65535,
    //       CLIP_BY_VALUE_N0_P2POW20, CLIP_BY_VALUE_N0_P2POW24, ...)
    //
    // The reasons are:
    //   - MobileNetV2_Xxx has add-input-to-output behind pointwise2.
    //   - non-MobileNetV2_Xxx has squeeze-and-excitation behind pointwise2.
    // They will destroy the activation function result.
    //

    // 1. Let value be in range.
    //
    // Note: tf.clipByValue() is cheaper than tf.mod()
    let valueClippedTensor;
    try {
      valueClippedTensor = inputTensor.clipByValue( valueMin, valueMax );
    } catch ( e ) {
      throw e; // e.g. out of (GPU) memory.
    } finally {
      // No matter successful or failed, always release input tensor.
      inputTensor.dispose();
    }

    // 2. Let value be integer.
    try {
      let intTensor = valueClippedTensor.cast( "int32" );
      return intTensor;
    } catch ( e ) {
      throw e; // e.g. out of (GPU) memory.
    } finally {
      valueClippedTensor.dispose();
    }
  }


  get stageCount()         { return this.stageArray?.length; }
  get blockCountPerStage() { return this.stageLast?.blockCount; }
  get blockCountTotal()    { return ( this.stageCount * this.blockCountPerStage ); }

  get stageLast_output_height()           { return this.stageLast?.output0.height; }
  get stageLast_output_width()            { return this.stageLast?.output0.width; }
  get stageLast_output_channelCount()     { return this.stageLast?.output0.channelCount; }
  get stageLast_output_scaleBoundsArray() { return this.stageLast?.output0.scaleBoundsArray; }

  get output_height()           { return this.blockFinal?.output_height; }
  get output_width()            { return this.blockFinal?.output_width; }
  get output_channelCount()     { return this.blockFinal?.output0_channelCount; }
  get output_scaleBoundsArray() { return this.blockFinal?.output0_scaleBoundsArray; }

  /**
   * @return {string} The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let str =

        `explicit_input_height=${this.explicit_input_height}, `
      + `explicit_input_width=${this.explicit_input_width}, `
      + `explicit_input_channelCount=${this.explicit_input_channelCount}, `

      + `has_implicit_input=${this.has_implicit_input}, `

      + `vocabularyChannelCount=${this.vocabularyChannelCount}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `
      + `nConvStageTypeName=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `
      + `blockCountTotalRequested=${this.blockCountTotalRequested}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `

      + `implicit_input_height=${this.implicit_input_height}, `
      + `implicit_input_width=${this.implicit_input_width}, `
      + `implicit_input_channelCount=${this.implicit_input_channelCount}, `

      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `

      + `feedbackShape={ ${this.feedbackShape} }, `

      + `stageCount=${this.stageCount}, `
      + `blockCountPerStage=${this.blockCountPerStage}, `
      + `blockCountTotal=${this.blockCountTotal}, `

      + `stageLast_output_height=${this.stageLast_output_height}, `
      + `stageLast_output_width=${this.stageLast_output_width}, `
      + `stageLast_output_channelCount=${this.stageLast_output_channelCount}, `

      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
      + `output_asInputValueRange=${this.output_asInputValueRange}`
    ;
    return str;
  }

  /**
   * @return {string} The description string of the weight count.
   */
  toString_WeightCount() {
    let str =

        `input_shape=( `
        + `${this.input_height}, `
        + `${this.input_width}, `
        + `${this.input_channelCount} ), `

      + `tensorWeightCount = { `
      + `Extracted: ${this.tensorWeightCountExtracted}, `
      + `Total: ${this.tensorWeightCountTotal} }, `
      + `stageCount=${this.stageCount}, `
      + `blockCountTotal=${this.blockCountTotal}, `
      + `stageLast_shape=( `
        + `${this.stageLast_output_height}, `
        + `${this.stageLast_output_width}, `
        + `${this.stageLast_output_channelCount} ), `
      + `output_shape=( `
        + `${this.output_height}, ${this.output_width}, `
        + `${this.output_channelCount}`
        + `${this.output_asInputValueRange ? ", asInputValueRange" : "" }`
        + ` )`
        ;
    return str;
  }

}

