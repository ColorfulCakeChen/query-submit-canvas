export { NeuralNet_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Stage from "../Stage.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";
import { Params } from "./NeuralNet_Params.js";
 
//!!! ...unfinished... (2022/07/31)

/**
 * This is the base class of NeuralNet.
 *
 *
 * NeuralNet is composed of an embedding and multiple neuralNets.
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
* @member {Stage.Base[]} stageArray
*   All computation stages of this neuralNet.
*
* @member {Stage.Base} stage0
*   The first computation stage of this neuralNet.
*
* @member {Stage.Base} stageLast
*   The last computation stage of this neuralNet. It may be the same as this.stage0 when there is only one stage inside this neuralNet.
*
* @member {TensorPlaceholder.Base} input0
*   The TensorPlaceholder object which represents this neuralNet's input.
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
* @member {TensorPlaceholder.Base} output0
*   The TensorPlaceholder object which represents this neuralNet's output.
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
  * @param {Params} params
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
    this.stageCountRequested = params.stageCountRequested;
    this.blockCountRequested = params.blockCountRequested;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
    }

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    // Note: params will be released by StageParamsCreator.

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    let stageParamsCreator;
    try {
      // 2. Create every stages.
      stageParamsCreator = NeuralNet_Base.create_StageParamsCreator_byNeuralNetParams( params );
      stageParamsCreator.determine_stageCount_depthwiseFilterHeightWidth_Default_Last(); // Calculate the real stage count.

      for ( let i = 0; i < stageParamsCreator.stageCount; ++i ) { // Progress for stage0, 1, 2, 3, ... 
        progressForStages.addChild( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }

      let stageParams, stage, stageIniter;
      let input0_ScaleBoundsArray_or_TensorPlaceholder, input1_ScaleBoundsArray_or_TensorPlaceholder;

      this.stageArray = Recyclable.OwnerArray.Pool.get_or_create_by(); // Note: OwnerArray can not accept length as parameter.
      this.stageArray.length = stageParamsCreator.stageCount;

      for ( let i = 0; i < this.stageArray.length; ++i ) { // Stage0, 1, 2, 3, ..., StageLast.

        if ( 0 == i ) { // Stage0.
          stageParamsCreator.configTo_beforeStage0();
          input0_ScaleBoundsArray_or_TensorPlaceholder = inputScaleBoundsArray0;
        } else { // (i.e. stage1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0( i );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        //
        // If this is the last stage of this neuralNet (i.e. at-neuralNet-end)
        //   - a different depthwise filter size may be used.
        //   - a different activation function may be used after pointwise2 convolution.
        if ( ( this.stageArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        this.assert_ImageSize_BetweenStage( i, stageParamsCreator ); // Assert image size.

        stageParams = stageParamsCreator.create_StageParams(); // Create current stage.

        if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

          // If channelShuffler is not null, keep it so that its tensors could be released.
          let channelShuffler = stageParamsCreator.channelShuffler;
          if ( channelShuffler ) {

            if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
              throw Error( `NeuralNet.Base.initer(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all stages of a neuralNet).` );

            this.channelShuffler = channelShuffler;

            this.tensorWeightCountExtracted += channelShuffler.tensorWeightCountExtracted;
            this.tensorWeightCountTotal += channelShuffler.tensorWeightCountTotal;

          // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler will be cleared and could not be used
          // for releasing tensors.
          }

        // If channelShuffler has ever got, never change it.
        }

        stage = this.stageArray[ i ] = Stage.Base.Pool.get_or_create_by();
        stageIniter = stage.initer( progressForStages.children[ i ], inputWeightArray, this.weightElementOffsetEnd, stageParams,
          input0_ScaleBoundsArray_or_TensorPlaceholder, input1_ScaleBoundsArray_or_TensorPlaceholder,
          this.channelShuffler );

        this.bInitOk = yield* stageIniter;
        if ( !this.bInitOk )
          return false;
        this.weightElementOffsetEnd = stage.weightElementOffsetEnd;

        this.tensorWeightCountTotal += stage.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += stage.tensorWeightCountExtracted;

        input0_ScaleBoundsArray_or_TensorPlaceholder = stage.output0;
        input1_ScaleBoundsArray_or_TensorPlaceholder = stage.output1;
      }

      this.stage0 = this.stageArray[ 0 ]; // Shortcut to the first stage.
      this.stageLast = this.stageArray[ this.stageArray.length - 1 ]; // Shortcut to the last stage.

      this.outputChannelCount = this.stageLast.output_channelCount;

      this.dispose_intermediate_ScaleBoundsArray(); // Release all intermediate stages' bounds array set for reducing memory footprint.

      // In our NeuralNet design, no matter which configuration, the outputChannelCount always is twice as sourceChannelCount.
      if ( this.outputChannelCount != ( this.sourceChannelCount * 2 ) )
        throw Error( `NeuralNet.Base.initer(): `
          + `the outputChannelCount ( ${this.outputChannelCount} ) should always be twice of `
          + `sourceChannelCount ( ${this.sourceChannelCount} ).` );

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
    this.outputChannelCount = -1;
    this.stageLast = null; // It is just a reference into this.stageArray[].
    this.stage0 = null; // It is just a reference into this.stageArray[].

    if ( this.stageArray ) {
      this.stageArray.disposeResources_and_recycleToPool();
      this.stageArray = null;
    }

    this.channelShuffler_dispose();

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

//!!! (2022/07/15 Remarked) Now stage will use TensorPlaceholder directly.
//     if ( this.intermediateOutputTensors ) {
//       this.intermediateOutputTensors.disposeResources_and_recycleToPool();
//       this.intermediateOutputTensors = null;
//     }
//
//     if ( this.intermediateInputTensors ) {
//       this.intermediateInputTensors.disposeResources_and_recycleToPool();
//       this.intermediateInputTensors = null;
//     }

    this.weightElementOffsetBegin = this.weightElementOffsetEnd = -1;
    this.bInitOk = false;

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
    this.stage0.input0.realTensor = inputTensor; // Note: The stage0 should only input one tensor.

    let stageArray = this.stageArray;
    for ( let i = 0; i < stageArray.length; ++i ) {
      stageArray[ i ].apply();
    }

    let outputTensor = this.stageLast.output0.realTensor; // Note: The stageLast should only output one tensor.
    return outputTensor;

  }

  /** How many stages inside this neuralNet are created. (may different from this.stageCountRequested.) */
  get stageCount() {
    return this.stageArray.length;
  }

  get input0() {
    return this.stage0.input0;
  }

  get output0() {
    return this.stageLast.output0;
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

      + `output_height=${this.output_height}, output_width=${this.output_width}, output_channelCount=${this.output_channelCount}`
    ;
    return str;
  }

}

