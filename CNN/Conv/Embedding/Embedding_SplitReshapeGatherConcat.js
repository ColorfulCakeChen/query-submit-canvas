export { Embedding_SplitReshapeGatherConcat as SplitReshapeGatherConcat };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import { FiltersArray_Multi } from "./Embedding_FiltersArray_Multi.js";
import { Base } from "./Embedding_Base.js";

/**
 * @member {boolean} bKeepInputTensor
 *   If true, .apply() will not dispose inputTensor (i.e. keep). For another example, the input image
 * needs be shared across many neural networks.
 * 
 * @member {function} apply
 *   Process the input and produce output by looking up the weights of this embedding layer. The function
 * inputs a tensor3d data (e.g. height-width-color for color image, or 1-width-1 for text) with
 * this.input_channelCount (e.g. 4 for r-g-b-a, or 1 for text) channels. The inputTensor3d.dtype must be
 * int32 (i.e. can not be float32) so that they can be used as tf.gather()'s indices. If
 * ( this.bKeepInputTensor == false ), the inputTensor3d will be disposed. If
 * ( this.bKeepInputTensor == true ), the inputTensor3d will be kept.

// !!! (2022/07/27 Remarked) Use .apply() directly.
//
//  * It is one of keep_input_return_copy(),
//  * return_input_directly(), apply_gather_reshape_and_keep(), apply_gather_reshape_and_destroy(),
//  * apply_add_gather_reshape_and_keep(), apply_add_gather_reshape_and_destroy().

 */
class Embedding_SplitReshapeGatherConcat extends Base {

  /**
   * Used as default Embedding.SplitReshapeGatherConcat provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.SplitReshapeGatherConcat.Pool",
    Embedding_SplitReshapeGatherConcat, Embedding_SplitReshapeGatherConcat.setAsConstructor );

  /**
   *
   */
   constructor() {
    super();
    Embedding_SplitReshapeGatherConcat.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Embedding_SplitReshapeGatherConcat.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    if ( this.vocabularyTablesTensorArray ) {
      tf.dispose( this.vocabularyTablesTensorArray ); // Release tensors.
      this.vocabularyTablesTensorArray.disposeResources_and_recycleToPool();
      this.vocabularyTablesTensorArray = null;
    }

    if ( this.vocabularyTableShape ) {
      this.vocabularyTableShape.disposeResources_and_recycleToPool();
      this.vocabularyTableShape = null;
    }

    if ( this.embeddedTensor3dArray ) {
      this.embeddedTensor3dArray.disposeResources_and_recycleToPool();
      this.embeddedTensor3dArray = null;
    }

    if ( this.inputTensor2dShape ) {
      this.inputTensor2dShape.disposeResources_and_recycleToPool();
      this.inputTensor2dShape = null;
    }

    if ( this.vocabularyIndicesOneChannelTensor2dArray ) {
      this.vocabularyIndicesOneChannelTensor2dArray.disposeResources_and_recycleToPool();
      this.vocabularyIndicesOneChannelTensor2dArray = null;
    }

    this.splitCount = undefined;

    super.disposeResources();
  }

  /**
   * Generator for initializing this object.
   *
   * @override
   */
  * initer( progressParent,
    inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
        1  // for extracting filters array from inputWeightArray.
      + 1  // for creating vocabulary tables.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

    // 1. Extract weights.
    let bParamInitOk = yield* super.initer( progressParent,
      inputWeightArray, weightElementOffsetBegin, params, inputScaleBoundsArray0 );

    if ( !bParamInitOk )
      return false;  // e.g. input array does not have enough data.

    let theFiltersArray_Multi;
    try {

      // 2. Extract filters array
      theFiltersArray_Multi = FiltersArray_Multi.Pool.get_or_create_by(
        this.input_height, this.input_width, this.input_channelCount,
        this.channelMultiplier, this.vocabularyCountPerInputChannel, this.bEmbedVocabularyId
      );

      if ( !theFiltersArray_Multi.init( inputWeightArray, this.weightElementOffsetEnd, inputScaleBoundsArray0 ) ) {
        this.bInitOk = false;
        return false;  // e.g. input array does not have enough data.
      }
      this.weightElementOffsetEnd = theFiltersArray_Multi.weightElementOffsetEnd;
  
      this.boundsArraySet = theFiltersArray_Multi.boundsArraySet;
      theFiltersArray_Multi.boundsArraySet = null; // (Because ownership transferred.)

      ++progressToAdvance.value;
      yield progressRoot;  // filters array extracted. Report progress.

      // 3. For reducing memory re-allocation.
      //
      // The followings are intermediate temporary arrays. Pre-allocate these array shells (instead of re-allocating every
      // time apply_and_destroy_or_keep()) for improving performance.
      {
        // For a 4 color (r-g-b-a) channel image, splitCount will be 4.
        //
        // For example, suppose input is a color image (i.e. height-width-color tensor3d).
        // The last axis is a 4 color (r-g-b-a) channel. Splitting along the last axis
        // (the color channel) results in an array [ r, g, b, a ] which has 4 tensor3d
        // (in fact, they should be viewed as tensor1d).
        //
        // This is pre-calculated for improving performance of apply().
        this.splitCount = this.input_channelCount;

        // For collecting the rank reduced tensor2d (from the splitted inputTensor3d). They
        // will be used to look up vocabulary table.
        this.vocabularyIndicesOneChannelTensor2dArray
          = Recyclable.Array.Pool.get_or_create_by( this.splitCount );

        // The first 2 dimension of apply()'s inputTensor3d. When the input is splitted and
        // reduce to tensor2d, their shape should be this. It is used for reshape from
        // tensor3d to tensor2d.
        //
        // (Used when vocabulary tables are tensor2d.)
        this.inputTensor2dShape
          = Recyclable.Array.Pool.get_or_create_by( this.input_height, this.input_width );

        // For collecting the results of every looking (vocabulary table) up. They will be
        // concatenated into one tensor3d as apply()'s result.
        this.embeddedTensor3dArray = Recyclable.Array.Pool.get_or_create_by( this.splitCount );
      }

      // 4. vocabularyTablesTensorArray
      {
        this.vocabularyTableShape
          = Recyclable.Array.Pool.get_or_create_by( this.vocabularyCountPerInputChannel, this.channelMultiplier );

        this.vocabularyTablesTensorArray = Recyclable.Array.Pool.get_or_create_by(
          theFiltersArray_Multi.filtersArrayArray.length ); // could be tensor3d or tensor2d.

        for ( let inChannel = 0; inChannel < this.input_channelCount; ++inChannel ) {
          let filtersArray = theFiltersArray_Multi.filtersArrayArray[ inChannel ];
          this.vocabularyTablesTensorArray[ inChannel ] = tf.tensor2d( filtersArray, this.vocabularyTableShape );
        }

        // Note: Because .vocabularyTableShape will be kept by .vocabularyTableTensor2d internally,
        //       it can not be released here.
      }

// !!! (2022/07/27 Remarked) Use .apply() directly.
//     Embedding_SplitReshapeGatherConcat.setup_apply_embedding.call( this );

      ++progressToAdvance.value;
      yield progressRoot;  // Embedding initialization done. Report progress.

      this.bInitOk = true;
      return true;

    } finally {
      if ( theFiltersArray_Multi ) { // Release filtersArray for reducing memory footprint.
        theFiltersArray_Multi.disposeResources_and_recycleToPool();
        theFiltersArray_Multi = null;
      }
    }
  }

// !!! (2022/07/27 Remarked) Use .apply() directly.
//   /** Determine this.apply data members.
//    *
//    * @param {Embedding_SplitReshapeGatherConcat} this
//    *   The Embedding_SplitReshapeGatherConcat object to be determined and modified.
//    */
//   static setup_apply_embedding() {
//
// !!! ...unfinished... (2022/07/27)
//
//   }
//
//   /** */
//   static apply_Xxx_and_keep( inputTensor ) {
//
// !!! ...unfinished... (2022/07/27)
//
//   }
//
//   /** */
//   static apply_Xxx_and_destroy( inputTensor ) {
//
// !!! ...unfinished... (2022/07/27)
//
//   }

  /**
   * (Used when vocabulary tables are tensor3d.)
   *
   * This is slower than AddGatherReshape. It may due to the splitting and concatenating operation.
   */
  apply( inputTensor3d ) {

//!!! ...unfinished... could use gahter, gather, concat instead of split, gather, concat?
//!!! ...unfinished... could use unstack, gather, stack instead of split, gather, concat?
//!!! ...unfinished... could use oneHot, pointwise convolution instead of split, gather, concat?

//!!! ...unfinished... (2022/07/27)
// if ( input_channelCount == 1 ), no need split and concat.

    // Using pre-allocated array as local variable to improving performance.
    let vocabularyIndicesOneChannelTensor2dArray = this.vocabularyIndicesOneChannelTensor2dArray;

    // Extract vocabulary indices from input.
    {
      // The input is tensor3d, the last axis id (for splitting) is 2 (= 3 - 1).
      //
      // Split along the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
      // In fact, the result is still tensor3d but has only one channel.
      //
      // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ inputTensor3d.shape.length - 1 ] ).
      const oneChannelTensor3dArray = inputTensor3d.split( this.splitCount, 2 );

      if ( !this.bKeepInputTensor ) {
        inputTensor3d.dispose();
        //inputTensor3d = null;
      }

      // Use pre-calculated array (i.e. inputTensor2dShape) for improving performance.
      let inputTensor2dShape = this.inputTensor2dShape;

      // The splitted of input is still tensor3d but has only one channel. Reshape it to tensor2d so that the
      // resule of tf.gather() will be tensor3d.
      for ( let i = 0; i < oneChannelTensor3dArray.length; ++i ) {
        vocabularyIndicesOneChannelTensor2dArray[ i ] = oneChannelTensor3dArray[ i ].reshape( inputTensor2dShape );
        oneChannelTensor3dArray[ i ].dispose();
      }
    }

    let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.

    // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
    // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
    for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor2dArray.length; ++channelIndex ) {
      let vocabularyTablesTensor2d = this.vocabularyTablesTensorArray[ channelIndex ];
      let oneChannelTensor2d = vocabularyIndicesOneChannelTensor2dArray[ channelIndex ];

      // tensor2d.gather( tensor2d ) results to tensor3d.
//!!! (2022/07/29 Remarked) use vocabularyTablesTensor2d instead.
//      embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensorArray[ channelIndex ].gather( oneChannelTensor2d, 0 );
      embeddedTensor3dArray[ channelIndex ] = vocabularyTablesTensor2d.gather( oneChannelTensor2d, 0 );

      oneChannelTensor2d.dispose(); // Release intermediate temporary tensor as soon as possible for reducing memory footprint.
      vocabularyIndicesOneChannelTensor2dArray[ channelIndex ] = null; // So that it is cleared when next time re-used.
    }

    // Concatenate along the last axis, so that it becomes tensor3d and with embedded (more) channels in the last axis.
    //
    // The result of tensor2d.gather( tensor2d ) are tensor3d, so their last axis is 2 (= 3 - 1).
    let outputTensor3d = tf.concat( embeddedTensor3dArray, 2 );

    for ( let i = 0; i < embeddedTensor3dArray.length; ++i ) { // Release intermediate temporary tensors.
      embeddedTensor3dArray[ i ].dispose();
      embeddedTensor3dArray[ i ] = null; // So that it is cleared when next time re-used.
    }

    return outputTensor3d;
  }

}
