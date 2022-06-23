export { ShuffleInfo, ConcatGather, SplitConcat, ConcatPointwiseConv };

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

  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

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

  /** Release tf.tensor. (In fact, no tensors needed to be disposed in ShuffleInfo. */
  disposeTensors() {
    // No tensors need to be disposed.

    this.transposePermutation = null;
    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
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
 * Implement the channel shuffler by tf.concat() and tf.gather().
 *
 * When outputGroupCount is smaller (e.g. 2), this may be faster than concat-reshape-transpose-reshape-split and
 * split-concat because the total operations (and memory access) are smaller.
 *
 * The extra cost is a pre-built channel index look up table (with tensor1d).
 *
 *
 * @member {number[]} concatenatedShape
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {number} outputGroupCount
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from concatenatedShape and outputGroupCount.
 *
 * @member {tf.tensor1d[]} shuffledChannelIndicesTensor1dArray
 *   The look up table for tf.gather()'s channel index. This table is composed of tensor1d so should be released
 * by calling disposeTensors().
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} gather
 *   Permute and split the input tensor by gather. It is a function pointer to one of this.gather_XXX().
 *
 * @member {function} concatGather
 *   Concatenate, permute and split the input tensor by concat-gather. It is a function pointer to one of
 * this.concatGather_XXX().
 */
class ConcatGather {

  /**
   *
   * @param {number[]} concatenatedShape  Used to calculate shuffleInfo.
   * @param {number}   outputGroupCount   Used to calculate shuffleInfo.
   * @return {boolean} If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ShuffleInfo
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    this.shuffleInfo = new ShuffleInfo( concatenatedShape, outputGroupCount );

    // Build shuffled channel index table (as an array of tf.tensor1d).
    //
    // It can be used by algorithm ConcatGather().
    // They should be integers so that can be used as tf.gather()'s index.
    //
    // Not like SplitConcat, the channel indexes will not be sorted here. According to testing, sorted
    // channel seems slow down memory access when using them as tf.gather()'s index list.
    {
      this.shuffledChannelIndicesTensor1dArray
        = tf.tidy( "ChannelShuffler.ConcatGather.init.shuffledChannelIndicesTensor1dArray", () => {
          let channelIndices = tf.range( 0, this.shuffleInfo.totalChannelCount, 1, "int32" );
          let channelIndicesShuffleInfo = new ShuffleInfo( channelIndices.shape, outputGroupCount );
          return channelIndicesShuffleInfo.reshapeTransposeReshapeSplit( channelIndices );
        });

      // Calculate total weight count.
      for ( let i = 0; i < this.shuffledChannelIndicesTensor1dArray.length; ++i ) {
        let shuffledChannelIndicesTensor1d = this.shuffledChannelIndicesTensor1dArray[ i ];
        if ( shuffledChannelIndicesTensor1d ) {
//!!! (2022/06/08 Remarked) Use .size instead.
//          this.tensorWeightCountTotal += tf.util.sizeFromShape( shuffledChannelIndicesTensor1d.shape );
          this.tensorWeightCountTotal += shuffledChannelIndicesTensor1d.size;
        }
      }

    // Exception if failed (e.g. out of (GPU) memory).
    }

    this.gather = this.gather_loop;
    this.concatGather = this.concatGather_dispose_finally_call_loop;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.shuffledChannelIndicesTensor1dArray ) {
      tf.dispose( this.shuffledChannelIndicesTensor1dArray );
      this.shuffledChannelIndicesTensor1dArray = null;
    }

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeTensors();
      this.shuffleInfo = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
  }

  get concatenatedShape() {
    return this.shuffleInfo.concatenatedShape;
  }

  get outputGroupCount() {
    return this.shuffleInfo.outputGroupCount;
  }

  /**
   * Permute and split the input tensor by gather.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.shuffleInfo.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  gather_loop( concatenatedTensor ) {
    let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
    }
    return shuffledSplitedTensorArray;
  }

  /**
   * Concatenate, permute and split the input tensor by concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatGather_dispose_finally_call_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_loop( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }
}


/**
 * Implement the channel shuffler by tf.split() and tf.concat().
 *
 * When outputGroupCount is larger (e.g. 8), this may be faster than concat-reshape-transpose-reshape-split and
 * concat-gather.
 *
 * The extra cost is a pre-built channel index look up table (with integers, not tensor1d).
 *
 *
 * @member {number[]} concatenatedShape
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {number} outputGroupCount
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from concatenatedShape and outputGroupCount.
 *
 * @member {number[][]} shuffledChannelIndicesArray
 *   The look up table for tf.gather()'s channel index. This table is composed of array of integers.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} splitConcat
 *   Concatenate, permute and split the input tensor by split-concat-gather. It is a function pointer to one of
 * this.splitConcat_XXX().
 */
class SplitConcat {

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @return {boolean}
   *   If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ConcatGather
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    let concatGather = new ConcatGather( concatenatedShape, outputGroupCount );

    try {
      // Shuffled channel indices (one dimension integers) for SplitConcat()
      this.shuffledChannelIndicesArray = new Array( concatGather.shuffledChannelIndicesTensor1dArray.length );
      concatGather.shuffledChannelIndicesTensor1dArray.forEach( ( shuffledChannelIndicesTensor1d, i ) => {
        let shuffledChannelIndices = shuffledChannelIndicesTensor1d.arraySync(); // Download from GPU memory.

        // Sorting from small to large for improving memory locality (and memory access performance).
        this.shuffledChannelIndicesArray[ i ] = shuffledChannelIndices.sort( ( n1, n2 ) => ( n1 - n2 ) );
      });

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

      // Shared pre-allocate memory could speed up the process of splitting.
      this.singleChannelTensorArray = new Array( this.shuffleInfo.totalChannelCount );
      this.tensorArrayForOneGroup = new Array( this.shuffleInfo.channelCountPerGroup );

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    this.splitConcat = this.splitConcat_loop;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeTensors();
      this.shuffleInfo = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
  }

  get concatenatedShape() {
    return this.shuffleInfo.concatenatedShape;
  }

  get outputGroupCount() {
    return this.shuffleInfo.outputGroupCount;
  }

  /**
   * Concatenate, permute and split the input tensor by split-concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  splitConcat_loop( tensorArray ) {

    // Become local variables for reducing access time.
    let lastAxisId = this.shuffleInfo.lastAxisId;
    let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;

    // Every element will be a single channel tensor3d.
    let singleChannelTensorArray = this.singleChannelTensorArray; // Use shared pre-allocate memory for speeding up.
    singleChannelTensorArray.length = 0; // Empty the array.

    // Split every group (a multiple channels tensor3d) into many single channel tensor3d.
    for ( let i = 0; i < tensorArray.length; ++i ) {
      let tensor = tensorArray[ i ];
      singleChannelTensorArray.push( ...tensor.split( channelCountPerGroup, lastAxisId ) );
    }

    // An array for many single channel tensor3d of one group.
    //
    // Shared and re-used multiple times to reduce memory re-allocation.
    let tensorArrayForOneGroup = this.tensorArrayForOneGroup;

    // Shuffle (by re-arrange) and concat.
    let resultArray = new Array( this.shuffledChannelIndicesArray.length );
    for ( let i = 0; i < this.shuffledChannelIndicesArray.length; ++i ) {
      let shuffledChannelIndices = this.shuffledChannelIndicesArray[ i ];

      for ( let j = 0; j < shuffledChannelIndices.length; ++j ) {
        tensorArrayForOneGroup[ j ] = singleChannelTensorArray[ shuffledChannelIndices[ j ] ]; // The shuffledChannelIndices[ j ] is channelIndex.
      }

      resultArray[ i ] = tf.concat( tensorArrayForOneGroup, lastAxisId );
    }

    // Release temporary single channel tensors.
    for ( let i = 0; i < singleChannelTensorArray.length; ++i ) {
      singleChannelTensorArray[ i ].dispose();
    }

    // Although singleChannelTensorArray[] and tensorArrayForOneGroup[] still have tensors, they are disposed tensors and should not be used.

    return resultArray;
  }

}


/**
 * Implement the channel shuffler by 1x1 tf.Conv2D() (i.e. pointwise convolution).
 *
 * Interestingly, although it looks like the most computing intensively (because many multiplications),
 * it is usually the fastest method (faster than concat-reshape-transpose-reshape-split, concat-gather,
 * split-concat) no matter in WebGL backend or CPU backend.
 *
 * Only when output group is one (i.e. no group; all one group), this pointwise-convolution method
 * may become second fastest.
 *
 * In both WebGL and CPU backend, the less the output group count is, the faster the shuffling is. That is,
 * one output group is faster than two (and four, eight, ...) output group. This behavior is the same as the
 * other shuffling method.
 *
 *
 * Concat-PointwiseConv-Split
 *
 * Another style of this implementation is PointwiseConv-Split (i.e. pointwise convolution by only one 1x1
 * filter and then split). Its performance, however, is slower than pointwise convolution of multiple 1x1
 * filters. The reason seems that the tf.split() is a slow operation (especially in mobile).
 *
 *
 *
 * @member {number[]} concatenatedShape
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {number} outputGroupCount
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from concatenatedShape and outputGroupCount.
 *
 * @member {tf.tensor4d[]} filtersTensor4dArray
 *   The pointwise convolution filters. They are used to achieve shuffle-split, and will be released by calling disposeTensors().
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} gather
 *   Permute and split the input tensor by gather. It is a function pointer to one of this.gather_XXX().
 *
 * @member {function} concatGather
 *   Concatenate, permute and split the input tensor by concat-gather. It is a function pointer to one of
 * this.concatGather_XXX().
 */
class ConcatPointwiseConv {

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @return {boolean}
   *   If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ConcatGather
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    let concatGather = new ConcatGather( concatenatedShape, outputGroupCount );

    // Build 1x1 convolution filters for channel shuffling. (as an array of tf.tensor4d).
    try {
      let filterHeight = 1; // Pointwise convolution is convolution 2d with 1 x 1 filter.
      let filterWidth = 1;
      let inDepth = concatGather.shuffleInfo.totalChannelCount;
      let outDepth = concatGather.shuffleInfo.channelCountPerGroup;

      // Every filter is a tensor3d [ filterHeight, filterWidth, inDepth ].
      // All filters composes a tensor4d.
      let filtersShape = [ filterHeight, filterWidth, inDepth, outDepth ];

      this.filtersTensor4dArray = tf.tidy( "ChannelShuffler.PointwiseConv.init.filtersTensor4dArray", () => {
        return concatGather.shuffledChannelIndicesTensor1dArray.map( ( shuffledChannelIndicesTensor1d ) => {
          return tf.tidy( "ChannelShuffler.PointwiseConv.init.filtersTensor4dArray.shuffledChannelIndicesTensor1d", () => {

            // Generate oneHotIndices (tensor2d, int32) by shuffledChannelIndices (tensor1d).
            let filtersOfOneGroupTensor2d_int32 = tf.oneHot( shuffledChannelIndicesTensor1d, inDepth );

            // Generate oneHotIndices (tensor2d, float32).
            //
            // The tf.oneHot() genetates tensor with ( dtype == "int32" ). However, in backend WASM, if tf.conv2d()
            // input tensor ( dtype == "float32" ) and filter tensor ( dtype == "int32" ), the result will be wrong.
            // This issue does not exist in backend CPU and WEBGL. For avoiding this problem, convert the filter
            // tensor from ( dtype == "int32" ) into ( dtype == "float32" ).
            //
            let filtersOfOneGroupTensor2d = tf.cast( filtersOfOneGroupTensor2d_int32, "float32" );

            // Transpose it so that the last axis is the outDepth (not inDepth) which conforms to the requirement
            // of tf.conv2d()'s filters.
            let filtersOfOneGroupTensor2d_transposed = filtersOfOneGroupTensor2d.transpose();

            // Reinterpret the tensor2d to tensor4d so that it can be used as tf.conv2d()'s filters.
            let filtersOfOneGroupTensor4d = filtersOfOneGroupTensor2d_transposed.reshape( filtersShape );
            return filtersOfOneGroupTensor4d;
          });
        });
      });

      if ( this.filtersTensor4dArray ) {
        for ( let i = 0; i < this.filtersTensor4dArray.length; ++i ) {
          let filtersTensor4d = this.filtersTensor4dArray[ i ];
          if ( filtersTensor4d ) {
//!!! (2022/06/08 Remarked) Use .size instead.
//            this.tensorWeightCountTotal += tf.util.sizeFromShape( filtersTensor4d.shape );
            this.tensorWeightCountTotal += filtersTensor4d.size;
          }
        }
      }

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    this.gather = this.gather_loop;
    this.concatGather = this.concatGather_dispose_finally_call_loop;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.filtersTensor4dArray ) {
      tf.dispose( this.filtersTensor4dArray );
      this.filtersTensor4dArray = null;
    }

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeTensors();
      this.shuffleInfo = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
  }

  get concatenatedShape() {
    return this.shuffleInfo.concatenatedShape;
  }

  get outputGroupCount() {
    return this.shuffleInfo.outputGroupCount;
  }

  /**
   * Permute and split the input tensor by gather.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.shuffleInfo.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  gather_loop( concatenatedTensor ) {
    let shuffledSplitedTensorArray = new Array( this.filtersTensor4dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by pointwise convolution (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d( this.filtersTensor4dArray[ i ], 1, "valid" );
    }
    return shuffledSplitedTensorArray;
  }

  /**
   * Concatenate, permute and split the input tensor by concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatGather_dispose_finally_call_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_loop( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

}
