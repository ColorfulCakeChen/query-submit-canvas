import * as Weights from "./Weights.js";

export { Params, Layer };

/**
 * Embedding (2D) layer parameters.
 */
class Params extends Weights.Params {

  /**
   * If outChannels is null, extract 2 parameters [ channelMultiplier, outChannels ] from inputFloat32Array
   * or fixedWeights.
   *
   * If outChannels is not null, extract 1 parameters [ channelMultiplier ] from inputFloat32Array or
   * fixedWeights.
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, outChannels = null, fixedWeights = null ) {
    let parameterCount = 2;  // Extract at most 2 weights and convert the values to positive integer.
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, parameterCount, inChannels, outChannels, fixedWeights );
    return bInitOk;
  }

  get channelMultiplier() { return this.weightsModified[ 0 ]; }
}


/**
 * A CNN layer contains one params (this.params) and three filters: depthwise, pointwise and bias.
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
   * @param {Array} fixedParams
   *   If null, extract 6 parameters from inputFloat32Array. If not null, extract 6 parameters from it instead of
   * inputFloat32Array. If not null, it should have 6 elements: [ filterHeight, filterWidth, channelMultiplier,
   * dilationHeight, dilationWidth, outChannels ].
   */ 
  constructor( inputFloat32Array, byteOffsetBegin, inChannels, fixedParams = null ) {

    this.params = new Layer.Params( inputFloat32Array, byteOffsetBegin, fixedParams );
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
