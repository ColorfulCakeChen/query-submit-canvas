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
 * (in pixels) before convoluting. For text input, the inputScaleToHeight should be 1. 
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

    {
      this.vocabularyTables = new Array( inChannels );

      let channelMultiplierInFact = this.params.channelMultiplier;
      let nextByteOffsetBegin = this.params.defaultByteOffsetEnd;
      for ( let i = 0; i < inChannels; ++i ) {

        this.vocabularyTables[ i ] = new Weights.Base();
        if ( !this.vocabularyTables[ i ].init(
               inputFloat32Array, nextByteOffsetBegin, null, 0, [vocabularyCountPerInputChannel, channelMultiplierInFact] ) )
          return false;

        nextByteOffsetBegin = this.vocabularyTables[ i ].defaultByteOffsetEnd;
      });
    }

    return true;
  }

  isValid() {
    if ( this.vocabularyTables )
      if ( this.vocabularyTables[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
        if ( this.vocabularyTables[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
          return true;
    return false;
  }

  /** Build tf.tensor according to this.vocabularyTables[]. */
  buildTensors() {
    disposeTensor();

    if ( !isValid() )
      return;

    this.vocabularyTablesTensors = tf.tidy( "Embedding2D.Layer.buildTensors", () => {
      let inChannels =                           this.inChannels;
      let vocabularyCountPerInputChannel =       this.vocabularyCountPerInputChannel;
      let embeddingChannelCountPerInputChannel = this.embeddingChannelCountPerInputChannel;

      let vocabularyTablesTensors = new Array( inChannels );

      for ( let i = 0; i < inChannels; ++i ) {

        let vocabularyTable = this.vocabularyTables[ i ];
        if ( !vocabularyTable )
          continue;

        vocabularyTablesTensors[ i ] = tf.tensor2d(
          vocabularyTable,
          [ vocabularyCountPerInputChannel, embeddingChannelCountPerInputChannel ] );
      }

      return vocabularyTablesTensors;
    });
  }

  /** Release tf.tensor. */
  disposeTensors() {
    tf.dispose( this.vocabularyTablesTensors );
    this.vocabularyTablesTensors = null;
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
        //
        // Use ( alignCorners == true ) for better looking when visualizing.
        //const scaledInput = tf.image.resizeBilinear( inputTensor3D, this.architecture.inputScaleToSize, true );
        const scaledInput = inputTensor3D.resizeBilinear( inputTensor3D, this.inputScaleToSize, true );

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

  //!!! (2020/05/16 Remarked) ...Old... Needs (inverted) residual connection
  //       // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
  //       // Every tensor2D (i,e, one channel) will be expanded to tensor3D (i.e. multiple channels).
  //       const embeddedTensor3DArray = vocabularyIndicesTensor2DArray.map( ( vocabularyIndicesTensor2D, channelIndex ) => {
  //         this.vocabularyTablesTensors[ channelIndex ].gather( vocabularyIndicesTensor2D );
  //       });

        // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
        let embeddedTensor3DArray = [];
        for ( let i = 0; i < splitCount; ++i ) {
          // Include the original input channel as residual connection.        
          let oneChannelTensor3D = vocabularyIndicesOneChannelTensor3DArray[ i ];
          embeddedTensor3DArray.push( oneChannelTensor3D );

          // Every tensor2D (i.e. one channel) will be expanded to tensor3D (i.e. multiple channels).
          const multipleChannelTensor3D = this.vocabularyTablesTensors[ i ].gather( oneChannelTensor3D );
          embeddedTensor3DArray.push( multipleChannelTensor3D );
        }

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
