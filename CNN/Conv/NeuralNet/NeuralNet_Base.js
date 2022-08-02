export { NeuralNet_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";
import { Params } from "./NeuralNet_Params.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";

/**
 * This is the base class of NeuralNet.
 *
 *
 * NeuralNet is composed of an embedding and multiple stages.
 *
 *
 *
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
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
 *   The last computation stage of this neuralNet. It may be the same as this.stage0 when there is only one stage inside this neuralNet.
 *
 * @member {number} output_height
 *   The output image height of this neuralNet's last stage.
 *
 * @member {number} output_width
 *   The output image width of this neuralNet's last stage.
 *
 * @member {number} output_channelCount
 *   The output channel count of this neuralNet's last stage.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputWeightArray.
 *
 */
class NeuralNet_Base extends Recyclable.Root {

  /**
  * Used as default NeuralNet.Base provider for conforming to Recyclable interface.
  */
  static Pool = new Pool.Root( "NeuralNet.Base.Pool", NeuralNet_Base, NeuralNet_Base.setAsConstructor );

  /**
  */
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
  * @param {ValueMax.Percentage.Aggregate} progressParent
  *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
  * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
  *
  * @param {NeuralNet.Params} params
  *   A Params object. The params.init() will be called to extract parameters. This params will be owned and destroyed by this .initer().
  * So caller should not use it again.
  *
  * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
  *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous NeuralNet value bounds
  * set. It will be kept (not cloned) directly. So caller should not modify them.
  *
  * @yield {ValueMax.Percentage.Aggregate}
  *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
  *
  * @yield {boolean}
  *   Yield ( value = true ) when ( done = true ) successfully.
  *   Yield ( value = false ) when ( done = true ) failed.
  *
  */
  * initer( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 ) {

    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.bInitOk = false;

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputWeightArray.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) ); // For parameters extracting.
    let progressForEmbedding = progressParent.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() ); // for embedding extracting.
    let progressForStages = progressParent.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() ); // for stage0, stage1, stage2, ... 

    // 1. Extract parameters.
    if ( !params )
      return false;

    if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
      return false;  // e.g. input array does not have enough data.
    this.weightElementOffsetEnd = params.weightElementOffsetEnd;

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputWeightArray could be released.
    this.input_height = params.input_height;
    this.input_width = params.input_width;
    this.input_channelCount = params.input_channelCount;
    this.vocabularyChannelCount = params.vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = params.vocabularyCountPerInputChannel;
    this.nConvStageTypeId = params.nConvStageTypeId;
    this.nConvStageTypeName = params.nConvStageTypeName;
    this.stageCountRequested = params.stageCountRequested;
    this.blockCountRequested = params.blockCountRequested;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
      this.bEmbedVocabularyId = params.inferencedParams.bEmbedVocabularyId;
    }

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    let input_ScaleBoundsArray;

    // 2. Create embedding layer.
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
        inputWeightArray, this.weightElementOffsetEnd, embeddingParams,
        inputScaleBoundsArray0
      );

      this.bInitOk = yield* embeddingIniter;
      if ( !this.bInitOk )
        return false;
      this.weightElementOffsetEnd = this.embedding.weightElementOffsetEnd;

      this.tensorWeightCountTotal += this.embedding.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.embedding.tensorWeightCountExtracted;

      input_ScaleBoundsArray = this.embedding.boundsArraySet.output0;
    }

    // 3. Create every stages.
    let stageParamsCreator;
    try {
      let StageParamsClass = params.StageParamsClass_get();

      stageParamsCreator = InferencedParams.create_StageParamsCreator_byNeuralNetParams( params );
      stageParamsCreator.determine_stageCount();

      for ( let i = 0; i < stageParamsCreator.stageCount; ++i ) { // Progress for stage0, 1, 2, 3, ... 
        progressForStages.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }

      let stageParams, stage, stageIniter;
      let next_input_height, next_input_width, next_input_channelCount;

      this.stageArray = Recyclable.OwnerArray.Pool.get_or_create_by(); // Note: OwnerArray can not accept length as parameter.
      this.stageArray.length = stageParamsCreator.stageCount;

      for ( let i = 0; i < this.stageArray.length; ++i ) { // Stage0, 1, 2, 3, ..., StageLast.

        if ( 0 == i ) { // Stage0.
          stageParamsCreator.configTo_beforeStage0();
        } else { // (i.e. stage1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0( i, next_input_height, next_input_width, next_input_channelCount );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        if ( ( this.stageArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        stageParams = stageParamsCreator.create_StageParams( StageParamsClass ); // Create current stage parameters.

        stage = this.stageArray[ i ] = Stage.Base.Pool.get_or_create_by();
        stageIniter = stage.initer( progressForStages.children[ i ],
          inputWeightArray, this.weightElementOffsetEnd, stageParams,
          input_ScaleBoundsArray
        );

        this.bInitOk = yield* stageIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = stage.weightElementOffsetEnd;

        this.tensorWeightCountTotal += stage.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += stage.tensorWeightCountExtracted;

        input_ScaleBoundsArray = stage.output0.scaleBoundsArray;
      }

      this.stage0 = this.stageArray[ 0 ]; // Shortcut to the first stage.
      this.stageLast = this.stageArray[ this.stageArray.length - 1 ]; // Shortcut to the last stage.

      this.dispose_intermediate_ScaleBoundsArray(); // Release all intermediate stages' bounds array set for reducing memory footprint.

      this.bInitOk = true;
      return this.bInitOk;

    } finally {
      if ( stageParamsCreator ) {
        stageParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this NeuralNet object.)
        stageParamsCreator.disposeResources_and_recycleToPool();
        stageParamsCreator = null;
      }
      if ( params ) {
        params.disposeResources_and_recycleToPool();
        params = undefined;
      }
    }
  }

  /**
  * Initialize this object by calling initer() and advance the generator by loop until done.
  *
  * @return {boolean}
  *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
  *   Return false if failed (and progressParent.valuePercentage will be less than 100).
  *
  * @see Stage.Base.init()
  */
  init( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 ) {

    let initer = this.initer( progressParent, inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** @override */
  disposeResources() {
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

    this.bEmbedVocabularyId = undefined;

    this.bKeepInputTensor = undefined;
    this.blockCountRequested = undefined;
    this.stageCountRequested = undefined;
    this.nConvStageTypeName = undefined;
    this.nConvStageTypeId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.vocabularyChannelCount = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.tensorWeightCountTotal = undefined;
    this.tensorWeightCountExtracted = undefined;

    this.weightElementOffsetBegin = undefined;
    this.weightElementOffsetEnd = undefined;
    this.bInitOk = undefined;

    super.disposeResources();
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except .stage0.inputX and .stageLast.outputX
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    if ( !this.stageArray )
      return;

    { // 1. Release stageLast's inputs' ScaleBoundsArray. (Note: .stageLast.outputX are kept.)
      this.stageLast.input1?.ScaleBoundsArray_dispose();
      this.stageLast.input0.ScaleBoundsArray_dispose();
    }

    // 2. Release intermediate (i.e. except stage0 and stageLast) stages' inputs' and outputs' ScaleBoundsArray.
    for ( let i = ( this.stageArray.length - 2 ); i >= 1; --i ) {
      let stage = this.stageArray[ i ];
      stage.output1?.ScaleBoundsArray_dispose();
      stage.output0.ScaleBoundsArray_dispose();
      stage.input1?.ScaleBoundsArray_dispose();
      stage.input0.ScaleBoundsArray_dispose();
    }

    { // 3. Release stage0's outputs' ScaleBoundsArray. (Note: .stage0.inputX are kept.)
      this.stage0.output1?.ScaleBoundsArray_dispose();
      this.stage0.output0.ScaleBoundsArray_dispose();
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

    let outputTensor = this.embedding.apply( inputTensor );

    let stageArray = this.stageArray;
    for ( let i = 0; i < stageArray.length; ++i ) {
      outputTensor = stageArray[ i ].apply( outputTensor );
    }

    return outputTensor;
  }

  /** How many stages inside this neuralNet are created. (may different from this.stageCountRequested.) */
  get stageCount() {
    return this.stageArray.length;
  }

  get output_height() {
    return this.stageLast.output0.height;
  }

  get output_width() {
    return this.stageLast.output0.width;
  }

  get output_channelCount() {
    return this.stageLast.output0.channelCount;
  }

  /**
  * @return {string} The description string of all (adjusted) parameters of initer().
  *
  * @override
  */
  toString() {
    let str = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `vocabularyChannelCount=${this.vocabularyChannelCount}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `
      + `nConvStageTypeName=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `
      + `stageCountRequested=${this.stageCountRequested}, `
      + `blockCountRequested=${this.blockCountRequested}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `

      + `stageCount=${this.stageCount}, `
      + `output_height=${this.output_height}, output_width=${this.output_width}, output_channelCount=${this.output_channelCount}`
    ;
    return str;
  }

}

