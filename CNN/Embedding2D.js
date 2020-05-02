import * as Weights from "./Weights.js";

export { Params, Layer };

/**
 * Embedding (2D) layer parameters.
 */
class Params extends Weights.Params {

  /**
   * @param {number} channelMultiplier
   *   Every input channel will be expanded into so many embedding channels. This is also vocabulary count
   * per input channel (or, vocabulary count per vocabulary table). Every input channel will have a
   * vocabulary table. If channelMultiplier is null, it will be extracted from inputFloat32Array
   * (i.e. by evolution). The outChannels (output channel count) is always depending on channelMultiplier
   * and equal to ( inChannels * channelMultiplier ).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null ) {

    // Except channelMultiplier, no parameter needs to be extract and convert (to positive integer).
    let parameterCountAtLeast = 0;

    // For an embedding layer, its output channel count is always depeding on channelMultiplier.
    let outChannels = Number.POSITIVE_INFINITY;

    return super.init( inputFloat32Array, byteOffsetBegin, parameterCountAtLeast, inChannels, channelMultiplier, outChannels );
  }

}


/**
 * An embedding layer contains one params (this.params) and inChannels embedding vocabulary tables.
 * Every input channel uses one embedding vocabulary table. Every embedding vocabulary table has
 * vocabularyCountPerInputChannel vocabularies. Every vocabulary has outChannels embedding channels.
 */
class Layer {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number}       byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number}       inChannels
   *   The input channel count.
   *
   * @param {number} outChannels
   *   If not null, this is the output channel count. Otherwise (i.e. null), the last element of this.weightsModified[]
   * which are extracted from inputFloat32Array (or fixedWeights) will be the output channel count. 
   *
   * @param {number} vocabularyCountPerInputChannel
   *   
   *
   *
   * @param {number} channelMultiplier
   *   
   *
   *
   * @param {Array} fixedParams
   *   If null, extract 1 parameter from inputFloat32Array. If not null, extract 1 parameter from it instead of
   * inputFloat32Array. If not null, it should have 1 elements: [ channelMultiplier ].
   */ 
  init( inputFloat32Array, byteOffsetBegin, inChannels, vocabularyCountPerInputChannel, channelMultiplier = null ) {

    let outChannels = null;
    let fixedParams = null;
    if ( channelMultiplier ) {
      outChannels = inChannels * channelMultiplier;
      fixedParams = [ channelMultiplier ];
    }

    this.params = new Params( inputFloat32Array, byteOffsetBegin, inChannels, outChannels, fixedParams );
    if ( !this.params.isValid() )
      return;

//!!!
//  get vocabularyCountPerInputChannel()   { return this.weightsModified[ 0 ]; }

    this.depthwise = new Weights.Base(
      inputFloat32Array, this.params.defaultByteOffsetEnd, null, 0,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwise.isValid() )
      return;

    this.depthwiseBias = new Weights.Base(
      inputFloat32Array, this.depthwise.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwiseBias.isValid() )
      return;

    this.pointwise = new Weights.Base(
      inputFloat32Array, this.depthwiseBias.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] );

    if ( !this.pointwise.isValid() )
      return;

    this.pointwiseBias = new Weights.Base(
      inputFloat32Array, this.pointwise.defaultByteOffsetEnd, null, 0,
      [1, 1, this.params.outChannels] );
  }

  isValid() {
    if ( this.pointwiseBias )
      if ( this.pointwiseBias.isValid() )
        return true;
    return false;
  }

  get byteOffsetBegin() { return this.params.byteOffsetBegin; }
  get byteOffsetEnd()   { return this.pointwiseBias.byteOffsetEnd; }
}
