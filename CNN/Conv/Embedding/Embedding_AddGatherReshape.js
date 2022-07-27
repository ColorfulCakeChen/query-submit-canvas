export { Embedding_AddGatherReshape as AddGatherReshape };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import { FiltersArray_One } from "./Embedding_FiltersArray_One.js";

/**
 *
 *
 * @member {boolean} bKeepInputTensor
 *   If true, .apply() will not dispose inputTensor (i.e. keep). For another example, the input image
 * needs be shared across many neural networks.
 * 
 * @member {function} apply
 *   Process the input and produce output by looking up the weights of this embedding layer. This is a
 * data member to a function. The function inputs a tensor3d data (e.g. height-width-color for color image,
 * or 1-width-1 for text) with this.inChannels (e.g. 4 for r-g-b-a, or 1 for text) channels. The
 * inputTensor3d.dtype must be int32 (i.e. can not be float32) so that they can be used as tf.gather()'s
 * indices. If ( this.bKeepInputTensor == false ), the inputTensor3d will be disposed. If
 * ( this.bKeepInputTensor == true ), the inputTensor3d will be kept.It is one of keep_input_return_copy(),
 * return_input_directly(), apply_gather_reshape_and_keep(), apply_gather_reshape_and_destroy(),
 * apply_add_gather_reshape_and_keep(), apply_add_gather_reshape_and_destroy().
 *
 * @see Embedding.FiltersArray_One
 *
 */
class Embedding_AddGatherReshape extends ReturnOrClone.Base( FiltersArray_One ) {

  /**
   * Used as default Embedding.AddGatherReshape provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.AddGatherReshape.Pool",
    Embedding_AddGatherReshape, Embedding_AddGatherReshape.setAsConstructor );

  /**
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_AddGatherReshape.setAsConstructor_self.call( this,
      bKeepInputTensor,
      this.output_height, this.output_width, this.output_channelCount
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_AddGatherReshape.setAsConstructor_self.call( this,
      bKeepInputTensor,
      this.output_height, this.output_width, this.output_channelCount
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    bKeepInputTensor,
    output_height, output_width, output_channelCount
  ) {
    this.bKeepInputTensor = bKeepInputTensor;

    // The 3 dimension of apply()'s outputTensor3d. When the input is splitted to
    // tensor3d and the vocabulary tables are tensor3d, the result of tf.gather()
    // will be tensor5d. This shape is used for reshape the output from tensor5d
    // to tensor3d.
    //
    // (Used when vocabulary tables are tensor3d.)
    this.outputTensor3dShape = Recyclable.Array.Pool.get_or_create_by( output_height, output_width, output_channelCount );

    return this;
  }

  /** @override */
  disposeResources() {
    this.bKeepInputTensor = undefined;

    if ( this.outputTensor3dShape ) {
      this.outputTensor3dShape.disposeResources_and_recycleToPool();
      this.outputTensor3dShape = null;
    }

    if ( this.vocabularyTableTensor2d ) {
      this.vocabularyTableTensor2d.dispose();
      this.vocabularyTableTensor2d = null;
    }

    if ( this.vocabularyTableShape ) {
      this.vocabularyTableShape.disposeResources_and_recycleToPool();
      this.vocabularyTableShape = null;
    }

    if ( this.channelValueOffsetTensor3d ) {
      this.channelValueOffsetTensor3d.dispose();
      this.channelValueOffsetTensor3d = null;
    }

    if ( this.channelValueOffsetShape ) {
      this.channelValueOffsetShape.disposeResources_and_recycleToPool();
      this.channelValueOffsetShape = null;
    }

    super.disposeResources();
  }

  /**
   * Initialize this object.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   */
   init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) {

    // 1. Extract weights.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) ) {
      return false;  // e.g. input array does not have enough data.
    }

    // 2. channelValueOffsetTensor3d
    if ( this.input_channelCount == 1 ) {
      // No need to shift input channel value because there is only one vocabulary table.

    } else { // ( input_channelCount > 1 )

      // Build a tensor3d for shifting every value of every input channels of inputTensor3d. So that they can be used for
      // indexing the one merged longer vocabulary table tensor2d.
      //
      // Channel                  0: ( channelValue + (                  0 * vocabularyCountPerInputChannel ) )
      // Channel                  1: ( channelValue + (                  1 * vocabularyCountPerInputChannel ) )
      // Channel                  2: ( channelValue + (                  2 * vocabularyCountPerInputChannel ) )
      //   :
      // Channel ( inChannels - 1 ): ( channelValue + ( ( inChannels - 1 ) * vocabularyCountPerInputChannel ) )
      {
        let channelValueOffsetArray = Recyclable.Array.Pool.get_or_create( this.input_channelCount );
        for ( let i = 0; i < channelValueOffsetArray.length; ++i )
          channelValueOffsetArray[ i ] = i * this.vocabularyCountPerInputChannel;

        this.channelValueOffsetShape = Recyclable.Array.Pool.get_or_create( 1, 1, this.input_channelCount );
        this.channelValueOffsetTensor3d
          = tf.tensor3d( channelValueOffsetArray, this.channelValueOffsetShape , "int32" ); // For one pixel's all input channels.

        channelValueOffsetArray.disposeResources_and_recycleToPool();
        channelValueOffsetArray = null;

        // Note: Because .channelValueOffsetShape will be kept by .channelValueOffsetTensor3d internally,
        //       it can not be released here.
      }

      // Because channelValueOffsetTensor3d is not included in .filtersArray, append it.
      this.tensorWeightCountTotal += this.channelValueOffsetTensor3d.size;
    }

    // 3. vocabularyTableTensor2d
    {
      let vocabularyCountTotal = this.vocabularyCountPerInputChannel * this.input_channelCount;

      this.vocabularyTableShape
        = Recyclable.Array.Pool.get_or_create( vocabularyCountTotal, this.channelMultiplier );

      this.vocabularyTableTensor2d = tf.tensor2d( this.filtersArray, this.vocabularyTableShape );

      { // Release filtersArray for reducing memory footprint.
        this.filtersArray.disposeResources_and_recycleToPool();
        this.filtersArray = null;
      }

      // Note: Because .vocabularyTableShape will be kept by .vocabularyTableTensor2d internally,
      //       it can not be released here.
    }

    Embedding_AddGatherReshape.setup_apply_embedding.call( this );
    return true;
  }

  /** Determine this.apply data members.
   *
   * @param {Embedding_AddGatherReshape} this
   *   The Embedding_AddGatherReshape object to be determined and modified.
   */
  static setup_apply_embedding() {

    // 1. Shortcut operation.
    if ( // If channelMultiplier is illegal (i.e. zero or negative). (may happen by evolution.)
           ( this.channelMultiplier < 1 )

        // Or, if there is only one output channel per input channel and the only one output channel is just vocabulary id.
        || ( ( this.channelMultiplier == 1 ) && ( this.bEmbedVocabularyId ) )
       ) {

      if ( this.bKeepInputTensor )
        // 1.1 For ( channelMultiplier <= 1 ) and ( bKeepInputTensor == true  ), return a copy of input (as output) immediately.
        this.apply = Embedding_AddGatherReshape.keep_input_return_copy;
      else
        // 1.2 For ( channelMultiplier <= 1 ) and ( bKeepInputTensor == false ), return input (as output) immediately.
        this.apply = Embedding_AddGatherReshape.return_input_directly;

    } else { // 2. channelMultiplier is positive.

      if ( this.input_channelCount == 1 ) { // 2.1 No need shift input vhannel value.
        if ( this.bKeepInputTensor )
          this.apply = Embedding_AddGatherReshape.apply_gather_reshape_and_keep;
        else
          this.apply = Embedding_AddGatherReshape.apply_gather_reshape_and_destroy;

      } else { // 2.2 ( input_channelCount > 1 ), Need shift input vhannel value.
        if ( this.bKeepInputTensor )
          this.apply = Embedding_AddGatherReshape.apply_add_gather_reshape_and_keep;
        else
          this.apply = Embedding_AddGatherReshape.apply_add_gather_reshape_and_destroy;
      }
    }
  }

  /** */
  static apply_gather_reshape_and_keep( inputTensor ) {

    // 0. No needs Shift vocabulary indices by input channel.

    // 1. Gather along the first axis (i.e. axis id 0). tensor2d.gather( tensor3d ) results to tensor4d.
    let gatherTensor4d = this.vocabularyTableTensor2d.gather( inputTensor3d, 0 );
    vocabularyIndicesTensor3d.dispose();

    // 1.2 Keep input tensor. (i.e. Not release input tensor.)

    // 2. Reshape tensor4d to tensor3d.
    let outputTensor3d = gatherTensor4d.reshape( this.outputTensor3dShape );
    gatherTensor4d.dispose();

    return outputTensor3d;
  }

  /** */
  static apply_gather_reshape_and_destroy( inputTensor ) {

    // 0. No needs Shift vocabulary indices by input channel.

    // 1. Gather along the first axis (i.e. axis id 0). tensor2d.gather( tensor3d ) results to tensor4d.
    let gatherTensor4d = this.vocabularyTableTensor2d.gather( inputTensor3d, 0 );
    vocabularyIndicesTensor3d.dispose();

    // 1.2 Release input tensor.
    inputTensor3d.dispose();
    //inputTensor3d = null;

    // 2. Reshape tensor4d to tensor3d.
    let outputTensor3d = gatherTensor4d.reshape( this.outputTensor3dShape );
    gatherTensor4d.dispose();

    return outputTensor3d;
  }

  /** */
  static apply_add_gather_reshape_and_keep( inputTensor ) {

    // 0.

    // 0.1 Shifting vocabulary indices by input channel. (Broadcasting is used.)
    let vocabularyIndicesTensor3d = inputTensor3d.add( this.channelValueOffsetTensor3d );

    // 0.2 Keep input tensor. (i.e. Not release input tensor.)

    // 1. Gather along the first axis (i.e. axis id 0). tensor2d.gather( tensor3d ) results to tensor4d.
    let gatherTensor4d = this.vocabularyTableTensor2d.gather( vocabularyIndicesTensor3d, 0 );
    vocabularyIndicesTensor3d.dispose();

    // 2. Reshape tensor4d to tensor3d.
    let outputTensor3d = gatherTensor4d.reshape( this.outputTensor3dShape );
    gatherTensor4d.dispose();

    return outputTensor3d;
  }
    
  /** */
  static apply_add_gather_reshape_and_destroy( inputTensor ) {

    // 0.

    // 0.1 Shifting vocabulary indices by input channel. (Broadcasting is used.)
    //     So that a large merged table could be used to improve performance.
    let vocabularyIndicesTensor3d = inputTensor3d.add( this.channelValueOffsetTensor3d );

    // 0.2 Release input tensor.
    inputTensor3d.dispose();
    //inputTensor3d = null;

    // 1. Gather along the first axis (i.e. axis id 0).
    //
    // tensor2d.gather( tensor3d ) results to tensor4d.
    let gatherTensor4d = this.vocabularyTableTensor2d.gather( vocabularyIndicesTensor3d, 0 );
    vocabularyIndicesTensor3d.dispose();

    // 2. Reshape tensor4d to tensor3d.
    //
    // Note: Use pre-calculated array (i.e. outputTensor3dShape) for improving performance.
    //       Its ( outputTensor3dShape[ 0 ], outputTensor3dShape[ 1 ] ) should be the same
    //       as ( inputTensor3d.shape[ 0 ], inputTensor3d.shape[ 1 ] ).
    //
    let outputTensor3d = gatherTensor4d.reshape( this.outputTensor3dShape );
    gatherTensor4d.dispose();

    return outputTensor3d;
  }

}
