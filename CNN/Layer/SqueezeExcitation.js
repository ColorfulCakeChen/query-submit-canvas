import * as Weights from "../Weights.js";

export { Params, Layer };

/**
 * Squeeze-and-Excitation layer parameters.
 */
class Params extends Weights.Params {

  /**
   * The outChannels (output channel count) will always be the same as inChannels (input channel count).
   *
   * @param {number} channelMultiplier
   *   Every input channel will be expanded into so many depthwise channels. If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null, fixedWeights = null ) {

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    // Except channelMultiplier, no parameter needs to be extract and convert (to positive integer).
    let parameterCountAtLeast = 0;

    // For a squeeze-and-excitation layer, its output channel count is always the same as input channel count. (By specifying)
    let outChannels = inChannels;

    return super.init( inputFloat32Array, byteOffsetBegin, parameterCountAtLeast, inChannels, channelMultiplier, outChannels );
  }

  get filterHeight()      { return 1; }
  get filterWidth()       { return 1; }
}


/**
!!! ...unfinished... should be 2 x (biased depthwise convolution, sine, biased pointwise convolution)

 * A squeeze-and-excitation layer contains one params (this.params), 1x1 depthwise convolution filters and bias,
 * pointwise convolution filters and bias.
 *
 */
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
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, fixedParams = null ) {

    this.params = new Params();
    if ( !this.params.init( inputFloat32Array, byteOffsetBegin, fixedParams ) )
      return false;

    this.depthwise = new Weights.Base();
    if ( !this.depthwise.init(
           inputFloat32Array, this.params.defaultByteOffsetEnd, null, 0,
           [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] ) )
      return false;

    this.depthwiseBias = new Weights.Base();
    if ( !this.depthwiseBias.init(
          inputFloat32Array, this.depthwise.defaultByteOffsetEnd, null, 0,
          [1, 1, inChannels, this.params.channelMultiplier] ) )
      return false;

    this.pointwise = new Weights.Base();
    if ( !this.pointwise.init(
          inputFloat32Array, this.depthwiseBias.defaultByteOffsetEnd, null, 0,
          [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] ) )
      return false;

    this.pointwiseBias = new Weights.Base();
    if ( !this.pointwiseBias.init(
          inputFloat32Array, this.pointwise.defaultByteOffsetEnd, null, 0,
          [1, 1, this.params.outChannels] );
      return false;

    return true;
  }

  isValid() {
    if ( this.pointwiseBias )
      if ( this.pointwiseBias.isValid() )
        return true;
    return false;
  }

  get byteOffsetBegin() { return this.params.defaultByteOffsetBegin; }
  get byteOffsetEnd()   { return this.pointwiseBias.defaultByteOffsetEnd; }
}
