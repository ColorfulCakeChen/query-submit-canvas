//import * as Weights from "../Weights.js";

export { Layer };

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
   * @param {number} totalChannelCount
   *   The total channel count of all channels of the input tensor3d list. The output tensor3d list will also
   * have so many channels.
   *
   * @param {number} outputGroupCount
   *   If greater than 1, the input tensor3d list (after concatenated) will be shuffled and then splitted into so
   * many group. The ( totalChannelCount / outputGroupCount ) should be an integer. If less or equal than 1 (or null),
   * the output tensor3d list will just be concatenated input tensor3d list (i.e. no shuffle and split).
   */
  init( totalChannelCount, outputGroupCount ) {

    if ( ( !outputGroupCount ) || ( outputGroupCount < 1 ) )
      outputGroupCount = 1; // At least one (means: no shuffle and split (concatenate only)).

//!!! ...unfinished...

    disposeTensors();
//    this.totalChannelCount = this.outputGroupCount = null; // So that distinguishable if re-initialization failed.

    this.totalChannelCount = totalChannelCount;
    this.outputGroupCount = outputGroupCount;

    // Build of channel index table (as array of tf.tensor1d).
    try {

      // Shuffled channel indices tensor1d (One dimension) for ConcatGather()
      this.shuffledChannelIndicesTensor1dArray = tf.tidy( "ChannelShuffler.Layer.init.channelIndicesArray", () => {

        // should be integer so that can be used as tf.gather()'s index.
        let channelIndices = tf.linspace( 0, totalChannelCount - 1, totalChannelCount ).toInt();
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

}
