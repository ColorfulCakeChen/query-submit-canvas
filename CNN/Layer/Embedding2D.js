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
  init( inputFloat32Array, byteOffsetBegin, inChannels, vocabularyCountPerInputChannel, channelMultiplier = null ) {

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    disposeTensors();
    this.params = this.vocabularyTables = null; // So that distinguishable if re-initialization failed.

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

  get byteOffsetBegin() { return this.params.defaultByteOffsetBegin; }
  get byteOffsetEnd()   { return this.vocabularyTables[ this.params.inChannels - 1 ].defaultByteOffsetEnd; }

  get inChannels()                           { return this.params.inChannels; }
  get embeddingChannelCountPerInputChannel() { return this.params.channelMultiplier; }
}
