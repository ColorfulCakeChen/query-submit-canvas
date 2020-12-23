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
 */
class ShuffleInfo {

  constructor( concatenatedShape, outputGroupCount ) {

    outputGroupCount = Math.trunc( outputGroupCount || 1 );
    if ( outputGroupCount < 1 )
      outputGroupCount = 1; // At least one (means: no shuffle and split (i.e. just concatenate only)).

    this.concatenatedShape = concatenatedShape;
    this.outputGroupCount = outputGroupCount;

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
  reshapeTransposeReshape( concatenatedTensor ) {
    let t1 = concatenatedTensor.reshape( this.intermediateShape );

    let t2 = t1.transpose( this.transposePermutation );
    t1.dispose();

    let t3 = t2.reshape( this.concatenatedShape );
    t2.dispose();

    return t3;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshape", () => {
//       return concatenatedTensor
//         .reshape( this.intermediateShape )
//         .transpose( this.transposePermutation )
//         .reshape( this.concatenatedShape );
//     });
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
  reshapeTransposeReshapeSplit( concatenatedTensor ) {
    let t = this.reshapeTransposeReshape( concatenatedTensor );

    let tArray = t.split( this.outputGroupCount, this.lastAxisId );
    t.dispose();

    return tArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshapeSplit", () => {
//       return concatenatedTensor
//         .reshape( this.intermediateShape )
//         .transpose( this.transposePermutation )
//         .reshape( this.concatenatedShape )
//         .split( this.outputGroupCount, this.lastAxisId );
//     });
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
  concatReshapeTransposeReshape( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let t = this.reshapeTransposeReshape( concatenatedTensor );
    concatenatedTensor.dispose();

    return t;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ShuffleInfo.concatReshapeTransposeReshape", () => {
//       return tf.concat( tensorArray, this.lastAxisId )
//         .reshape( this.intermediateShape )
//         .transpose( this.transposePermutation )
//         .reshape( this.concatenatedShape );
//     });
  }

  /**
   * Concatenate, permute and split the input tensor by concat-reshape-transpose-reshape-split.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatReshapeTransposeReshapeSplit( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ShuffleInfo.concatReshapeTransposeReshapeSplit", () => {
//       return tf.concat( tensorArray, this.lastAxisId )
//         .reshape( this.intermediateShape )
//         .transpose( this.transposePermutation )
//         .reshape( this.concatenatedShape )
//         .split( this.outputGroupCount, this.lastAxisId );
//     });
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
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from init()'s concatenatedShape and outputGroupCount.
 *
 * @member {tf.tensor1d[]} shuffledChannelIndicesTensor1dArray
 *   The look up table for tf.gather()'s channel index. This table is composed of tensor1d so should be released
 * by calling disposeTensors().
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
  init( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    this.shuffleInfo = new ShuffleInfo( concatenatedShape, outputGroupCount );

    // Build shuffled channel index table (as an array of tf.tensor1d).
    //
    // It can be used by algorithm ConcatGather().
    // They should be integers so that can be used as tf.gather()'s index.
    //
    // Not like SplitConcat, the channel indixes will not be sorted here. According to testing, sorted
    // channel seems slow down memory access when using them as tf.gather()'s index list.
    try {
      this.shuffledChannelIndicesTensor1dArray
        = tf.tidy( "ChannelShuffler.ConcatGather.init.shuffledChannelIndicesTensor1dArray", () => {
          let channelIndices = tf.range( 0, this.shuffleInfo.totalChannelCount, 1, "int32" );
          let channelIndicesShuffleInfo = new ShuffleInfo( channelIndices.shape, outputGroupCount );
          return channelIndicesShuffleInfo.reshapeTransposeReshapeSplit( channelIndices );
        });
    } catch ( e ) {
      return false; // e.g. out of (GPU) memory.
    }

    return true;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.shuffledChannelIndicesTensor1dArray ) {
      tf.dispose( this.shuffledChannelIndicesTensor1dArray );
      this.shuffledChannelIndicesTensor1dArray = null;
    }
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
  gather( concatenatedTensor ) {
    let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
    }
    return shuffledSplitedTensorArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ConcatGather.gather", () => {
//       // shuffle and split by gather (one operation achieves two operations).
//       let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
//         shuffledChannelIndicesTensor1d =>
//           concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
//       );
//       return shuffledSplitedTensorArray;
//     });
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
  concatGather( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
    }
    return shuffledSplitedTensorArray;

    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;

//!!! (2020/12/23 Remarked) Remove function call for improving performance.
//     let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );
//
//     let tArray = this.gather( concatenatedTensor );
//     concatenatedTensor.dispose();
/
//     return tArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.ConcatGather.concatGather", () => {
//       let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );
//
//       // shuffle and split by gather (one operation achieves two operations).
//       let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
//         shuffledChannelIndicesTensor1d =>
//           concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
//       );
//       return shuffledSplitedTensorArray;
//     });
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
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from init()'s concatenatedShape and outputGroupCount.
 *
 * @member {number[][]} shuffledChannelIndicesArray
 *   The look up table for tf.gather()'s channel index. This table is composed of array of integers.
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
   * @see ConcatGather
   */
  init( concatenatedShape, outputGroupCount ) {

    this.shuffleInfo = null; // So that distinguishable if re-initialization failed.

    let concatGather = new ConcatGather();
    let initOk = concatGather.init( concatenatedShape, outputGroupCount );

    try {
      if ( initOk ) {
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
      }

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    return initOk;
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
  splitConcat( tensorArray ) {

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

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.SplitConcat.splitConcat", () => {
//
//       // Become local variables for reducing access time.
//       let lastAxisId = this.shuffleInfo.lastAxisId;
//       let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;
//
//       // Every element will be a single channel tensor3d.
//       let singleChannelTensorArray = this.singleChannelTensorArray; // Use shared pre-allocate memory for speeding up.
//       singleChannelTensorArray.length = 0; // Empty the array.
//
//       // Split every group (a multiple channels tensor3d) into many single channel tensor3d.
//       for ( let tensor of tensorArray ) {
//         singleChannelTensorArray.push( ...tensor.split( channelCountPerGroup, lastAxisId ) );
//       }
//
//       // An array for many single channel tensor3d of one group.
//       //
//       // Shared and re-used multiple times to reduce memory re-allocation.
//       let tensorArrayForOneGroup = this.tensorArrayForOneGroup;
//
//       // shuffle and split by concat (one operation achieves two operations).
//       return this.shuffledChannelIndicesArray.map( ( shuffledChannelIndices ) => {
// //!!! Using a loop instead. (to reduce function call overhead)
// //         shuffledChannelIndices.forEach( ( channelIndex, i ) => {
// //           tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ channelIndex ];
// //         });
//
// //!!! Use for-of instead. (to reduce array member access overhead)
// //         let arrayLength = tensorArrayForOneGroup.length;
// //         for ( let i = 0; i < arrayLength; ++i ) {
// //           // The shuffledChannelIndices[ i ] is channelIndex.
// //           tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ shuffledChannelIndices[ i ] ];
// //         }
//
//         // Using for-of could be a better method.
//         //
//         // If using shuffledChannelIndices.forEach(), there is a function call overhead.
//         // If using for ( i = 0; ... ) and shuffledChannelIndices[ i ], there is a array member access overhead.
//         let i = 0;
//         for ( let channelIndex of shuffledChannelIndices ) {
//           tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ channelIndex ];
//           ++i;
//         }
//
//         return tf.concat( tensorArrayForOneGroup, lastAxisId );
//       });
//     });
  }

}


/**
 * Implement the channel shuffler by 1x1 tf.Conv2D() (i.e. pointwise convolution).
 *
 * Interestingly, although it looks like the most computing intensively (because many multiplications),
 * it is usually the fastest method (faster than concat-reshape-transpose-reshape-split, concat-gather,
 * split-concat) in WebGL backend. Even in CPU backend, it is still the second fatest method (just slower
 * than concat-gather).
 *
 * In WebGL backend, the concat-gather method usually is the second fastest method (slower than this
 * pointwise-convolution method). Only when output group is one (i.e. no group; all one group), the
 * concat-gather method beats (i.e. is fatser than) this pointwise-convolution method.
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
   * @see ConcatGather
   */
  init( concatenatedShape, outputGroupCount ) {

    this.disposeTensors();
    this.shuffleInfo = null; // So that distinguishable if re-initialization failed.

    let concatGather = new ConcatGather();
    let initOk = concatGather.init( concatenatedShape, outputGroupCount );

    // Build 1x1 convolution filters for channel shuffling. (as an array of tf.tensor4d).
    try {
      if ( initOk ) {
        let filterHeight = 1; // Pointwise convolution is convolution 2d with 1 x 1 filter.
        let filterWidth = 1;
        let inDepth = concatGather.shuffleInfo.totalChannelCount;
        let outDepth = concatGather.shuffleInfo.channelCountPerGroup;

        // Every filter is a tensor3d [ filterHeight, filterWidth, inDepth ].
        // All filters composes a tensor4d.
        let filtersShape = [ filterHeight, filterWidth, inDepth, outDepth ];

        this.filtersTensor4dArray = tf.tidy( "ChannelShuffler.PointwiseConv.init.filtersTensor4dArray", () => {
          return concatGather.shuffledChannelIndicesTensor1dArray.map( ( shuffledChannelIndicesTensor1d ) => {

            // Generate oneHotIndices (tensor2d) by shuffledChannelIndices (tensor1d).
            let filtersOfOneGroupTensor2d = tf.oneHot( shuffledChannelIndicesTensor1d, inDepth );

            // Transpose it so that the last axis is the outDepth (not inDepth) which conforms to the requirement
            // of tf.conv2d()'s filters.
            filtersOfOneGroupTensor2d = filtersOfOneGroupTensor2d.transpose();

            // Reinterpret the tensor2d to tensor4d so that it can be used as tf.conv2d()'s filters.
            let filtersOfOneGroupTensor4d = filtersOfOneGroupTensor2d.reshape( filtersShape );
            return filtersOfOneGroupTensor4d;
          });
        });

        this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.
      }

    } catch ( e ) {
      initOk = false; // e.g. out of (GPU) memory.

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    return initOk; 
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.filtersTensor4dArray ) {
      tf.dispose( this.filtersTensor4dArray );
      this.filtersTensor4dArray = null;
    }
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
  gather( concatenatedTensor ) {
    let shuffledSplitedTensorArray = new Array( this.filtersTensor4dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by pointwise convolution (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d( this.filtersTensor4dArray[ i ], 1, "valid" );
    }
    return shuffledSplitedTensorArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.PointwiseConv.gather", () => {
//       // shuffle and split by pointwise convolution (one operation achieves two operations).
//       let shuffledSplitedTensorArray = this.filtersTensor4dArray.map(
//         filtersTensor4d =>
//           concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
//       );
//       return shuffledSplitedTensorArray;
//     });
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
  concatGather( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = this.gather( concatenatedTensor );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;

//!!! (2020/12/23 Remarked) Remove tidy() for improving performance.
//     return tf.tidy( "ChannelShuffler.PointwiseConv.concatGather", () => {
//       let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );
//
//       // shuffle and split by pointwise convolution (one operation achieves two operations).
//       let shuffledSplitedTensorArray = this.filtersTensor4dArray.map(
//         filtersTensor4d =>
//           concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
//       );
//       return shuffledSplitedTensorArray;
//     });
  }

}

//!!!
// named as Pipe.ChannelShuffler ?
