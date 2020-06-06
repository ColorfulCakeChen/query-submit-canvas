//import * as Weights from "../Weights.js";

export { ShuffleInfo, ConcatGather, SplitConcat, Layer };

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
 *   The total channel count when all the apply()'s input tensor concatenated. It will be the value of the last
 * element of concatenatedShape (i.e. concatenatedShape[ lastAxisId ]).
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
    return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshape", () => {
      return concatenatedTensor
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape );
    });
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
    return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshapeSplit", () => {
      return concatenatedTensor
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape )
        .split( this.outputGroupCount, this.lastAxisId );
    });
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
    return tf.tidy( "ChannelShuffler.ShuffleInfo.concatReshapeTransposeReshape", () => {
      return tf.concat( tensorArray, this.lastAxisId )
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape );
    });
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
    return tf.tidy( "ChannelShuffler.ShuffleInfo.concatReshapeTransposeReshapeSplit", () => {
      return tf.concat( tensorArray, this.lastAxisId )
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape )
        .split( this.outputGroupCount, this.lastAxisId );
    });
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
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
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
          let channelIndices = tf.range(0, this.shuffleInfo.totalChannelCount, 1, "int32");
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
    return tf.tidy( "ChannelShuffler.ConcatGather.gather", () => {
      // shuffle and split by gather (one operation achieves two operations).
      let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
        shuffledChannelIndicesTensor1d =>
          concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
      );
      return shuffledSplitedTensorArray;
    });
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
    return tf.tidy( "ChannelShuffler.ConcatGather.concatGather", () => {
      let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

      // shuffle and split by gather (one operation achieves two operations).
      let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
        shuffledChannelIndicesTensor1d =>
          concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
      );
      return shuffledSplitedTensorArray;
    });
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

    let concatGather = new ConcatGather();
    let initOk = concatGather.init( concatenatedShape, outputGroupCount );

    try {
      if ( initOk ) {
        // Shuffled channel indices (one dimension integers) for SplitConcat()
        this.shuffledChannelIndicesArray = new Array( concatGather.shuffledChannelIndicesTensor1dArray.length );
        concatGather.shuffledChannelIndicesTensor1dArray.forEach( ( shuffledChannelIndicesTensor1d, i ) => {
          let shuffledChannelIndices = shuffledChannelIndicesTensor1d.dataSync(); // Download from GPU memory.
          shuffledChannelIndices.sort( ( n1, n2 ) => ( n1 - n2 ) );               // Sorting from small to large.
          this.shuffledChannelIndicesArray[ i ] = shuffledChannelIndices;
        });

        this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

        // Shared pre-allocate memory could speed up the process of splitting.
        this.singleChannelTensorArray = new Array( this.shuffleInfo.totalChannelCount );
        this.tensorArrayForOneGroup = new Array( this.shuffleInfo.channelCountPerGroup );
      }

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (with tensor1d).
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
    return tf.tidy( "ChannelShuffler.SplitConcat.splitConcat", () => {

      // Become local variables for reducing access time.
      let lastAxisId = this.shuffleInfo.lastAxisId;
      let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;

      // Every element will be a single channel tensor3d.
      let singleChannelTensorArray = this.singleChannelTensorArray; // Use shared pre-allocate memory for speeding up.
      singleChannelTensorArray.length = 0; // Empty the array.

      // Split every group (a multiple channels tensor3d) into many single channel tensor3d.
      for ( let tensor of tensorArray ) {
        singleChannelTensorArray.push( ...tensor.split( channelCountPerGroup, lastAxisId ) );
      }

      // An array for many single channel tensor3d of one group.
      //
      // Shared and re-used multiple times to reduce memory re-allocation.
      let tensorArrayForOneGroup = this.tensorArrayForOneGroup;

      // shuffle and split by concat (one operation achieves two operations).
      return this.shuffledChannelIndicesArray.map( ( shuffledChannelIndices ) => {
        shuffledChannelIndices.forEach( ( channelIndex, i ) => {
          tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ channelIndex ];
        });
        return tf.concat( tensorArrayForOneGroup, lastAxisId );
      });
    });
  }

}


/**
 * Implement the channel shuffler by 1x1 tf.Conv2D() (i.e. pointwise convolution).
 *
 *
 */
class Pointwise {
}


//!!!
// named as Pipe.ChannelShuffler ?


/**
 * An channel shuffler accepts a list of tensor3d with same size (height, width, channel) and outputs a shuffled
 * (re-grouped) list tensor3d.
 *
 * Usually, the output tensor3d list length will be the same as input tensor3d list. Even more, the size of 
 * every output tensor3d will also be the same as input tensor3d. However, the order of the tensor3d's channels
 * (the 3rd dimension) are different.
 *
 * This is the Channel-Shuffle operation of the ShuffleNetV2 neural network.
 *
 *
 *
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from init()'s concatenatedShape and outputGroupCount.
 */
class Layer {

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @see Info
   */
  init( concatenatedShape, outputGroupCount ) {

//!!! ...unfinished...

    disposeTensors();

    this.concatGather = new ConcatGather();
    let initOk = this.concatGather.init( concatenatedShape, outputGroupCount );

    return initOk;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.concatGather ) {
      this.concatGather.disposeTensors();
      this.concatGather = null;
    }
  }

  /**
   * Process the input and produce output by this neural network layer.
   *
   * The group count (i.e. element count) of input tensor3d list can be different from the group count
   * (i.e. element count) of output tensor3d list
   *
   * If there are more than one tensor3d in the input tensor3d array, they will be concatenated.
   *
   * If need split, then need shuffle before split. 
   *
   * @param {Array of tf.tensor3d} inputTensor3DArray
   *   A list of tensor3D (e.g. height-width-color for color image, or 1-width-1 for text) data. The sum of all the
   * 3rd dimension (i.e. the channel dimension) of every input tensor3d should be the same as this.totalChannelCount.
   *
   * @return {Array of tf.tensor3d} outputTensor3DArray
   *   The output as a list of tensor3D. Return null, if failed (e.g. out of GPU memory).
   */
//  apply( inputTensor3DArray, outputTensor3DArray ) {
  apply( inputTensor3DArray ) {

    const outputTensor3DArray = tf.tidy( "ChannelShuffler.Layer.apply", () => {
      try {

        // Concatenate all into one tensor3d.
        let dataTensor3d;
        if ( inputTensor3DArray.length > 1 )
          dataTensor3d = tf.concat( inputTensor3DArray );
        else
          dataTensor3d = inputTensor3DArray[ 0 ]; // There is only one tensor3d, use it directly instead of concatenating.

        // If there is only one output group, there is not necessary to shuffle (and split).
        if ( this.outputGroupCount == 1 )
          return [ dataTensor3d ];

//!!! ...unfinished...
        

        return

      } catch ( e ) {
      }
    });

    return outputTensor3DArray;
  }

  /** @return Return true, if two array of tensor are equal by value. */
  static isTensorArrayEqual( tensorArray1, tensorArray2 ) {

    if ( tensorArray1 === tensorArray2 )
      return true;

    if ( tensorArray1 == null || tensorArray2 == null )
      return false;

    if ( tensorArray1.length !== tensorArray2.length )
      return false;

    for ( let i = 0; i < tensorArray1.length; ++i ) {
      if ( !tensorArray1[ i ].equal( tensorArray2[ i ] ) )
        return false;
    }

    return true;
  }

}
