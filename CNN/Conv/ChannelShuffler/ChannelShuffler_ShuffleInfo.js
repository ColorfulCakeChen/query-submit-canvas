export { ShuffleInfo };
export { ShuffleInfoPool };

import * as Pool from "../../util/Pool.js";

/**
 * The information for channel shuffler.
 *
 *
 * @member {number[]} concatenatedShape
 *   An array of integer describes the shape of the reshapeTransposeReshape()'s concatenated input tensor (tensor3d
 * or tensor1d). For example, if reshapeTransposeReshape() will be called with an array of image (i.e. array of
 * tensor3d), concatenatedShape should be [ height, width, totalChannelCount ]. Another example, if the input will
 * be an array of tensor1d, concatenatedShape should be [ totalChannelCount ]. No matter which example, the
 * totalChannelCount should always be the total sum of the last dimension size of all tensors in the
 * concatReshapeTransposeReshape()'s input array.
 *
 * @member {number} outputGroupCount
 *   If greater than 1, the input tensor3d list (after concatenated) will be shuffled and then splitted into so
 * many group. The ( totalChannelCount / outputGroupCount ) should be an integer. If less or equal than 1 (or null),
 * the output tensor3d list will just be an array with only one tensor3d which is the concatenation of all the
 * input tensor3d list (i.e. no shuffle and split).
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from concatenatedShape and outputGroupCount. (In fact, it is the this.)
 *
 *
 * @member {number} lastAxisId
 *   The last axis id of reshapeTransposeReshape()'s input tensor. It will be ( concatenatedShape.length - 1 ).
 *
 * @member {number} totalChannelCount
 *   The total channel count when all the concatReshapeTransposeReshape()'s input tensor concatenated. It will be
 * the value of the last element of concatenatedShape (i.e. concatenatedShape[ lastAxisId ]).
 *
 * @member {number} channelCountPerGroup
 *   There will be so many channels in one (output) group.
 *
 * @member {number[]} intermediateShape
 *   Before shuffling, the reshapeTransposeReshape()'s (concatenated) input will be reshaped to this intermediateShape.
 *
 * @member {number[]} transposePermutation
 *   After reshaped to intermediateShape, the (concatenated) input will be transposed according to this
 * transposePermutation (so that they are shuffled).
 *
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 *
 * @member {function} reshapeTransposeReshape
 *   Permute the input tensor by reshape-transpose-reshape. It is a function pointer to one of this.reshapeTransposeReshape_XXX().
 *
 * @member {function} reshapeTransposeReshapeSplit
 *   Permute and split the input tensor by reshape-transpose-reshape-split. It is a function pointer to one of
 * this.reshapeTransposeReshapeSplit_XXX().
 *
 * @member {function} concatReshapeTransposeReshape
 *   Concatenate and permute the input tensor by concat-reshape-transpose-reshape. It is a function pointer to one of
 * this.concatReshapeTransposeReshape_XXX().
 *
 * @member {function} concatReshapeTransposeReshapeSplit
 *   Concatenate, permute and split the input tensor by concat-reshape-transpose-reshape-split. It is a function pointer to one of
 * this.concatReshapeTransposeReshapeSplit_XXX().
 */
class ShuffleInfo {

  /**
   *
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeResources(); // So that distinguishable if re-initialization failed.

    outputGroupCount = Math.trunc( outputGroupCount || 1 );
    if ( outputGroupCount < 1 )
      outputGroupCount = 1; // At least one (means: no shuffle and split (i.e. just concatenate only)).

    this.concatenatedShape = Array.from( concatenatedShape ); // Clone it (by shallow-copy) because the outside may modify it.
    this.outputGroupCount = outputGroupCount;

    this.shuffleInfo = this; // So that all ChannelShuffler.Xxx have property "shuffleInfo".

    let lastAxisId = this.lastAxisId = concatenatedShape.length - 1;
    let totalChannelCount = this.totalChannelCount = concatenatedShape[ lastAxisId ];

    // The channel count of every output group. (It should be an integer.)
    let channelCountPerGroup = this.channelCountPerGroup = totalChannelCount / outputGroupCount;

    // The shape before transpose. For example, if concatenatedShape is [ h, w, c ], the intermediateShape will be
    // [ h, w, outputGroupCount, channelCountPerGroup ]. The last dimension is splitted into two dimensions.
    let intermediateShape = this.intermediateShape = concatenatedShape.slice( 0, lastAxisId );
    intermediateShape.push( outputGroupCount, channelCountPerGroup );

    // The axis permutation of transpose.
    //
    // For example, if the intermediateShape is [ h, w, outputGroupCount, channelCountPerGroup ]. Its
    // axis permutation will be [ 0, 1, 3, 2 ] so that the last two dimensions will be swapped.
    let transposePermutation = this.transposePermutation = new Array( ...intermediateShape.keys() );
    {
      let last1 = transposePermutation.pop();
      let last2 = transposePermutation.pop();
      transposePermutation.push( last1, last2 );
    }

    this.reshapeTransposeReshape = this.reshapeTransposeReshape_dispose_finally_calls;
    this.reshapeTransposeReshapeSplit = this.reshapeTransposeReshapeSplit_dispose_finally_calls;
    this.concatReshapeTransposeReshape = this.concatReshapeTransposeReshape_dispose_finally_calls;
    this.concatReshapeTransposeReshapeSplit = this.concatReshapeTransposeReshapeSplit_dispose_finally_calls;
  }

//!!!
  /**
   *
   * @return {ShuffleInfo}
   *   Return the this object.
   */
  setAsConstructor( concatenatedShape, outputGroupCount ) {

    outputGroupCount = Math.trunc( outputGroupCount || 1 );
    if ( outputGroupCount < 1 )
      outputGroupCount = 1; // At least one (means: no shuffle and split (i.e. just concatenate only)).

    // Clone it (by shallow-copy) because the outside may modify it.
    {
      this.concatenatedShape = Pool.Array.Singleton.get_or_create_by( concatenatedShape.length );
      for ( let i = 0; i < concatenatedShape.length; ++i ) {
        this.concatenatedShape[ i ] = concatenatedShape[ i ];
      }
    }

    this.outputGroupCount = outputGroupCount;

    this.shuffleInfo = this; // So that all ChannelShuffler.Xxx have property "shuffleInfo".

    let lastAxisId = this.lastAxisId = concatenatedShape.length - 1;
    let totalChannelCount = this.totalChannelCount = concatenatedShape[ lastAxisId ];

    // The channel count of every output group. (It should be an integer.)
    let channelCountPerGroup = this.channelCountPerGroup = totalChannelCount / outputGroupCount;

    // The shape before transpose. For example, if concatenatedShape is [ h, w, c ], the intermediateShape will be
    // [ h, w, outputGroupCount, channelCountPerGroup ]. The last dimension is splitted into two dimensions.
    //
    let intermediateShape;
    {
      
//!!! (2022/06/24 Remarke) Old Codes
//     let intermediateShape = this.intermediateShape = concatenatedShape.slice( 0, lastAxisId );
//     intermediateShape.push( outputGroupCount, channelCountPerGroup );

      intermediateShape = this.intermediateShape = Pool.Array.Singleton.get_or_create_by( concatenatedShape.length + 1 );
      for ( let i = 0; i < lastAxisId; ++i ) {
        intermediateShape[ i ] = concatenatedShape[ i ];
      }
      intermediateShape[ lastAxisId     ] = outputGroupCount;
      intermediateShape[ lastAxisId + 1 ] = channelCountPerGroup;
    }

    // The axis permutation of transpose.
    //
    // For example, if the intermediateShape is [ h, w, outputGroupCount, channelCountPerGroup ]. Its
    // axis permutation will be [ 0, 1, 3, 2 ] so that the last two dimensions will be swapped.
    //
    let transposePermutation;
    {

//!!! (2022/06/24 Remarke) Old Codes
//    let transposePermutation = this.transposePermutation = new Array( ...intermediateShape.keys() );

      transposePermutation = this.transposePermutation = Pool.Array.Singleton.get_or_create_by( intermediateShape.length );
      for ( let i = 0; i < transposePermutation.length; ++i ) {
        transposePermutation[ i ] = i;
      }

      let last1 = transposePermutation.pop();
      let last2 = transposePermutation.pop();
      transposePermutation.push( last1, last2 );
    }

    this.reshapeTransposeReshape = this.reshapeTransposeReshape_dispose_finally_calls;
    this.reshapeTransposeReshapeSplit = this.reshapeTransposeReshapeSplit_dispose_finally_calls;
    this.concatReshapeTransposeReshape = this.concatReshapeTransposeReshape_dispose_finally_calls;
    this.concatReshapeTransposeReshapeSplit = this.concatReshapeTransposeReshapeSplit_dispose_finally_calls;

    return this;
  }

//!!! ...unfinished... (2022/06/24)

  /**
   * Release tf.tensor. (In fact, no tensors needed to be disposed in this ShuffleInfo.)
   *
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {

    // No tensors need to be disposed.

    this.transposePermutation = null;
    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;

    //super.disposeResources();
  }

  /** Not dispose the input. */
  reshape_to_intermediateShape_keep_input( t ) {
    return t.reshape( this.intermediateShape );
  }

  reshape_to_intermediateShape_dispose_input( t ) {
    try {
      return t.reshape( this.intermediateShape );
    } finally {
      t.dispose();
    }
  }

  transpose_accordingTo_transposePermutation_dispose_input( t ) {
    try {
      return t.transpose( this.transposePermutation );
    } finally {
      t.dispose();
    }
  }

  reshape_to_concatenatedShape_dispose_input( t ) {
    try {
      return t.reshape( this.concatenatedShape );
    } finally {
      t.dispose();
    }
  }

  split_to_outputGroupCount_along_lastAxisId_dispose_input( t ) {
    try {
      return t.split( this.outputGroupCount, this.lastAxisId );
    } finally {
      t.dispose();
    }
  }

  /**
   * Permute the input tensor by reshape-transpose-reshape.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor}
   *   A shuffled tensor. Its size is the same as concatenatedTensor but its last dimension is shuffled.
   */
  reshapeTransposeReshape_dispose_finally_calls( concatenatedTensor ) {
    let t1 = this.reshape_to_intermediateShape_keep_input( concatenatedTensor );
    let t2 = this.transpose_accordingTo_transposePermutation_dispose_input( t1 );
    let t3 = this.reshape_to_concatenatedShape_dispose_input( t2 );
    return t3;
  }

  /**
   * Permute and split the input tensor by reshape-transpose-reshape-split.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenatedTensor, but their
   * last dimensions are shuffled.
   */
  reshapeTransposeReshapeSplit_dispose_finally_calls( concatenatedTensor ) {
    let t1 = this.reshape_to_intermediateShape_keep_input( concatenatedTensor );
    let t2 = this.transpose_accordingTo_transposePermutation_dispose_input( t1 );
    let t3 = this.reshape_to_concatenatedShape_dispose_input( t2 );
    let t4 = this.split_to_outputGroupCount_along_lastAxisId_dispose_input( t3 );
    return t4;
  }

  /**
   * Concatenate and permute the input tensor by concat-reshape-transpose-reshape.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor}
   *   A shuffled tensor. Its total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatReshapeTransposeReshape_dispose_finally_calls( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let t1 = this.reshape_to_intermediateShape_dispose_input( concatenatedTensor );
    let t2 = this.transpose_accordingTo_transposePermutation_dispose_input( t1 );
    let t3 = this.reshape_to_concatenatedShape_dispose_input( t2 );
    return t3;
  }

  /**
   * Concatenate and permute the input tensor by concat-reshape-transpose-reshape.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor}
   *   A shuffled tensor. Its total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatReshapeTransposeReshapeSplit_dispose_finally_calls( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let t1 = this.reshape_to_intermediateShape_dispose_input( concatenatedTensor );
    let t2 = this.transpose_accordingTo_transposePermutation_dispose_input( t1 );
    let t3 = this.reshape_to_concatenatedShape_dispose_input( t2 );
    let t4 = this.split_to_outputGroupCount_along_lastAxisId_dispose_input( t3 );
    return t4;

    // Because every single function try-finally to release tensor, the memory footprint could be reduced.
    // If using nested try-finally in one function to release tensors, the memory footprint will be larger.
  }

}


/**
 * Providing ChannelShuffler.ShuffleInfo
 *
 */
class ShuffleInfoPool extends Pool.Root {

  constructor() {
    super( "ChannelShuffler.ShuffleInfoPool", ShuffleInfo, ShuffleInfo.setAsConstructor );
  }

}

/**
 * Used as default ChannelShuffler.ShuffleInfo provider.
 */
ShuffleInfoPool.Singleton = new ShuffleInfoPool();

