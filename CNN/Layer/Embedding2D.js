import * as Weights from "../Weights.js";

export { Params, Layer };

/**
 * Embedding (2D) layer parameters.
 */
class Params extends Weights.Params {

  /**
   * @param {number} channelMultiplier
   *   Every input channel will be expanded into so many embedding channels. The outChannels (output channel count)
   * is always depending on channelMultiplier and equal to ( inChannels * channelMultiplier ). If null, it will be
   * extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null ) {

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    let parameterMap = new Map( [
      [ Weights.Params.Keys.inChannels,        inChannels ],
      [ Weights.Params.Keys.channelMultiplier, channelMultiplier ],

      // For an embedding layer, its output channel count always depends on channelMultiplier.
      [ Weights.Params.Keys.outChannels,       Infinity ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

}


/**
 * An embedding layer contains one params (this.params) and inChannels embedding vocabulary tables.
 * Every input channel has one embedding vocabulary table. Every embedding vocabulary table has
 * vocabularyCountPerInputChannel vocabularies. Every vocabulary has channelMultiplier embedding channels.
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
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} inChannels
   *   The input channel count.
   *
   * @param {number} channelMultiplier
   *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
   * embedding channels. The outChannels (output channel count) is always depending on channelMultiplier and equal
   * to ( inChannels * channelMultiplier ). If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init(
    inputFloat32Array, byteOffsetBegin,
    inputScaleToSize, inChannels, vocabularyCountPerInputChannel, channelMultiplier = null ) {

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    disposeTensors();
    this.params = this.vocabularyTables = null; // So that distinguishable if re-initialization failed.

    this.inputScaleToSize = inputScaleToSize;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;

    this.params = new Params();
    if ( !this.params.init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier ) )
      return false;

    let embeddingChannelCountPerInputChannel = this.embeddingChannelCountPerInputChannel; // The real channelMultiplier.
    let vocabularyTableShape = [ vocabularyCountPerInputChannel, embeddingChannelCountPerInputChannel ];

    // Extract data of vocabulary tables.
    this.vocabularyTables = new Array( inChannels );
    {
      let nextByteOffsetBegin = this.params.defaultByteOffsetEnd;
      for ( let i = 0; i < inChannels; ++i ) {
        this.vocabularyTables[ i ] = new Weights.Base();
        if ( !this.vocabularyTables[ i ].init( inputFloat32Array, nextByteOffsetBegin, null, 0, vocabularyTableShape ) )
          return false;  // e.g. input array do not have enough data.
        nextByteOffsetBegin = this.vocabularyTables[ i ].defaultByteOffsetEnd;
      }
    }

    // Build tf.tensor of vocabulary tables.
    try {
      this.vocabularyTablesTensor2DArray = tf.tidy( "Embedding2D.Layer.init.vocabularyTablesTensor2DArray", () => {

        let theLastAxisId = ( vocabularyTableShape.length - 1 ); // e.g. will be 1 for tensor2d.

        // Create vocabulary id list. (tensor1d)
        const vocabularyIdsTensor1d
          = tf.linspace( 0, ( vocabularyCountPerInputChannel - 1 ), vocabularyCountPerInputChannel );

        // Convert vocabulary id list to tensor2d. (for concatenating with vocabulary table)
        const vocabularyIdsTensor2d = vocabularyIdsTensor1d.expandDims( theLastAxisId );

        return this.vocabularyTables.map( ( vocabularyTable, i ) => {
          return tf.tidy( "Embedding2D.Layer.init.vocabularyTableWithId", () => {

            // Create an embedding vocabulary table (without vocabulary id).
            const vocabularyTable = tf.tensor2d( vocabularyTable, vocabularyTableShape );

            // Concatenate vocabulary id prefix vocabulary table.
            //
            // This is a residual connection for embedding layer. This concatenating uses some GPU memory space.
            // It, however, reduces some calculation time when predict() because the residual connection is already
            // created in advance (here).
            const vocabularyTableWithId = vocabularyIdsTensor2d.concat( vocabularyTable );
            retrun vocabularyTableWithId;
          });
        });
      });
    } catch ( e ) {
      return false; // e.g. out of (GPU) memory.
    }

    return true;
  }

  isValid() {
    if ( this.vocabularyTablesTensor2DArray )
      if ( this.vocabularyTablesTensor2DArray[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
        if ( this.vocabularyTablesTensor2DArray[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
          
          this.vocabularyTablesTensors
          return true;
    return false;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.vocabularyTablesTensor2DArray ) {
      tf.dispose( this.vocabularyTablesTensor2DArray );
      this.vocabularyTablesTensor2DArray = null;
    }
  }

  /**
   * Process the input and produce output by using the weights of this neural network layer.
   *
   * @param {tf.tensor3D} inputTensor3D
   *   A tensor3D data (e.g. height-width-color for color image, or 1-width-1 for text) with
   * this.inChannels (e.g. 4 for r-g-b-a, or 1 for text) channels.
   *
   * @return {tf.tensor3D} The predicted output as tensor3D. Return null, if failed (e.g. out of GPU memory).
   */
  predict( inputTensor3D ) {
    const predictResult = tf.tidy( "Embedding2D.Layer.predict", () => {
      try {

        // Scale input into specific size.
        let scaledInput;
        if (   ( !this.inputScaleToSize )                                       // No scaling information.
            || (   ( this.inputScaleToSize[ 0 ] == inputTensor3D.shape[ 0 ] )   // Or, already same size.
                && ( this.inputScaleToSize[ 1 ] == inputTensor3D.shape[ 1 ] ) )
           ) {
          scaledInput = inputTensor3D;
        } else {
          // Otherwise, scaling by using ( alignCorners == true ) for better looking when visualizing.
          scaledInput = inputTensor3D.resizeBilinear( inputTensor3D, this.inputScaleToSize, true );
        }

        // For example, suppose input is a color image (i.e. height-width-color tensor3D). The last
        // axis is a 4 color (r-g-b-a) channel. Splitting along the last axis (the color channel)
        // results in an array [ r, g, b, a ] which has 4 tensor3D (in fact, they should be
        // viewed as tensor1D).
        let theLastAxisId = ( scaledInput.shape.length - 1 );  // Or, ( scaledInput.rank - 1 )

        // For a 4 color (r-g-b-a) channel image, splitCount will be 4.
        //
        // This should be the same as this.inChannels.
        let splitCount = scaledInput.shape[ theLastAxisId ];

        // Extract vocabulary indices from input. (In fact, the result is still tensor3D but has only one channel.)
        const vocabularyIndicesOneChannelTensor3DArray = tf.tidy( "VocabularyIndicesArray", () => {

          // Split the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2D).
          // And then convert to integer, so that they can be used as tf.gather()'s indices.
          return scaledInput.split( splitCount, theLastAxisId ).map( t => t.toInt() );
        });

        // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
        // Every tensor3D (one channel) will be expanded to tensor3D (multiple channels).
        //
        // Note: this.vocabularyTablesTensor2DArray[] already be prefixed vocabulary id (when init()). So it
        // has residual connection in advance.
        const embeddedTensor3DArray = vocabularyIndicesOneChannelTensor3DArray.map(
          ( oneChannelTensor3D, channelIndex ) => {
            return this.vocabularyTablesTensor2DArray[ channelIndex ].gather( oneChannelTensor3D );
        });

//!!! (2020/05/16 Remarked) ...Old... Already residual connection when init().
//         // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
//         let embeddedTensor3DArray = [];
//         for ( let i = 0; i < splitCount; ++i ) {
//           // Include the original input channel as residual connection.        
//           let oneChannelTensor3D = vocabularyIndicesOneChannelTensor3DArray[ i ];
//           embeddedTensor3DArray.push( oneChannelTensor3D );
//
//           // Every tensor2D (i.e. one channel) will be expanded to tensor3D (i.e. multiple channels).
//           const multipleChannelTensor3D = this.vocabularyTablesTensor2DArray[ i ].gather( oneChannelTensor3D );
//           embeddedTensor3DArray.push( multipleChannelTensor3D );
//         }

//!!! ...unfinished... squeeze-and-excitation.

        // Concatenate along the last axis, so that it is still tensor3D but with embedded (more) channels in the last axis.
        return tf.concat( embeddedTensor3DArray, theLastAxisId );

      } catch ( e ) {
      }
    });

    return predictResult;
  }

  get byteOffsetBegin() { return this.params.defaultByteOffsetBegin; }
  get byteOffsetEnd()   { return this.vocabularyTables[ this.params.inChannels - 1 ].defaultByteOffsetEnd; }

  get inChannels()                           { return this.params.inChannels; }
  get embeddingChannelCountPerInputChannel() { return this.params.channelMultiplier; }
}
