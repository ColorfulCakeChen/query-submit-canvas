//import * as Weights from "../Weights.js";

export { Info, Layer };

//!!!
// named as Pipe.ChannelShuffler ?

/**
 * The information for channel shuffler.
 *
 *
 * @member {number[]} concatenatedShape
 *   An array of integer describes the shape of the concatenated apply()'s input tensor (tensor3d or tensor1d).
 * For example, if apply() will be called with an array of image (i.e. array of tensor3d), concatenatedShape
 * should be [ height, width, totalChannelCount ]. Another example, if the input will be an array of tensor1d,
 * concatenatedShape should be [ totalChannelCount ]. No matter which example, the totalChannelCount should
 * always be the total sum of the last dimension size of all tensors in the apply()'s input array.
 *
 * @member {number} outputGroupCount
 *   If greater than 1, the input tensor3d list (after concatenated) will be shuffled and then splitted into so
 * many group. The ( totalChannelCount / outputGroupCount ) should be an integer. If less or equal than 1 (or null),
 * the output tensor3d list will just be an array with only one tensor3d which is the concatenation of all the
 * input tensor3d list (i.e. no shuffle and split).
 *
 *
 * @member {number} lastAxisId
 *   The last axis id of apply()'s input tensor. It will be ( concatenatedShape.length - 1 ).
 *
 * @member {number} totalChannelCount
 *   The total channel count when all the apply()'s input tensor concatenated. It will be the value of the last
 * element of concatenatedShape (i.e. concatenatedShape[ lastAxisId ]).
 *
 * @member {number} channelCountPerGroup
 *   There will be so many channels in one (output) group.
 *
 * @member {number[]} intermediateShape
 *   Before shuffling, the apply()'s (concatenated) input wiil be reshaped to this intermediateShape.
 *
 * @member {number[]} transposePermutation
 *   After reshaped to intermediateShape, the (concatenated) input will be transposed according to this
 * transposePermutation (i.e. shuffle them).
 */
class Info {

  constructor( concatenatedShape, outputGroupCount ) {

    outputGroupCount = Math.trunc( outputGroupCount || 1 );
    if ( outputGroupCount < 1 )
      outputGroupCount = 1; // At least one (means: no shuffle and split (concatenate only)).

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
    let transposePermutation = this.transposePermutation = new Array( intermediateShape.keys() );
    {
      let last1 = transposePermutation.pop();
      let last2 = transposePermutation.pop();
      transposePermutation.push( last1, last2 );
    }
  }
}

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
 * @member {Array of number} inputScaleToSize
 *   Scale the height and width of the input image to size [ inputScaleToHeight, inputScaleToWidth ]
 * (in pixels) before convoluting. For text input, the inputScaleToHeight should be 1. If null, there will be
 * no scaling when predict().
 *
 * @member {number} vocabularyCountPerInputChannel
 *   Every input channel will have how many vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A four channels), there will be 256
 * vocabularies per input channel because every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 *
 * @member {number} embeddingChannelCountPerInputChannel
 *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. This is same as the this.params.channelMultiplier.
 */
class Layer {

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffle Info.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffle Info.
   *
   * @see Info
   */
  init( concatenatedShape, outputGroupCount ) {

    this.shuffleInfo = new Info( concatenatedShape, outputGroupCount );

//!!! ...unfinished...

    disposeTensors();
//    this.totalChannelCount = this.outputGroupCount = null; // So that distinguishable if re-initialization failed.

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
    let transposePermutation = this.transposePermutation = new Array( intermediateShape.keys() );
    {
      let last1 = transposePermutation.pop();
      let last2 = transposePermutation.pop();
      transposePermutation.push( last1, last2 );
    }

    let x = dataTensor3d.reshape( [ h, w, groupCount, channelCountPerGroup ] );
    x = x.transpose( [ 0, 1, 3, 2 ] );
    x = x.reshape( [ h, w, c ] );

    // Build of channel index table (as array of tf.tensor1d).
    try {

      // Shuffled channel indices tensor1d (One dimension) for ConcatGather()
      this.shuffledChannelIndicesTensor1dArray = tf.tidy( "ChannelShuffler.Layer.init.channelIndicesArray", () => {

        // should be integer so that can be used as tf.gather()'s index.
        //let channelIndices = tf.linspace( 0, totalChannelCount - 1, totalChannelCount ).toInt();
        let channelIndices = tf.range(0, totalChannelCount, 1, "int32");
        let lastAxisId = channelIndices.rank - 1;

        let intermediateChannelCount = totalChannelCount / outputGroupCount;

        let x = channelIndices.reshape( [ outputGroupCount, intermediateChannelCount ] );
        x = x.transpose( [ 1, 0 ] );
        x = x.reshape( [ totalChannelCount ] );

        return x.split( outputGroupCount, lastAxisId );
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
  apply( inputTensor3DArray, outputTensor3DArray ) {

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

  /**
   *
   *
   */
  static ???() {

      // Shuffled channel indices tensor1d (One dimension) for ConcatGather()
      this.shuffledChannelIndicesTensor1dArray = tf.tidy( "ChannelShuffler.Layer.init.channelIndicesArray", () => {

        // should be integer so that can be used as tf.gather()'s index.
        //let channelIndices = tf.linspace( 0, totalChannelCount - 1, totalChannelCount ).toInt();
        let channelIndices = tf.range(0, totalChannelCount, 1, "int32");
        let lastAxisId = channelIndices.rank - 1;

        let intermediateChannelCount = totalChannelCount / outputGroupCount;

        let x = channelIndices.reshape( [ outputGroupCount, intermediateChannelCount ] );
        x = x.transpose( [ 1, 0 ] );
        x = x.reshape( [ totalChannelCount ] );

        return x.split( outputGroupCount, lastAxisId );
      });
  }

}
