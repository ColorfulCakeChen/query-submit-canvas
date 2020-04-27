export { Filter, Params };

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

    this.depthwise = new Layer.Filter(
      inputFloat32Array, this.params.defaultByteOffsetEnd, null, 0,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwise.isValid() )
      return;

    this.depthwiseBias = new Layer.Filter(
      inputFloat32Array, this.depthwise.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwiseBias.isValid() )
      return;

    this.pointwise = new Layer.Filter(
      inputFloat32Array, this.depthwiseBias.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] );

    if ( !this.pointwise.isValid() )
      return;

    this.pointwiseBias = new Layer.Filter(
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

/**
 * A Float32Array and its shape. It can be used as CNN (depthwise, pointwise and bias) filter
 * weights.
 *
 * @member {Float32Array} defaultInput
 *   The default input Float32Array. Its byteOffset will be checked against defaultByteOffsetBegin.
 * Its content will be interpret as weights if privilegeInput is null. Otherwise, its content
 * will be ignored if privilegeInput is not null.
 *
 * @member {number} defaultByteOffsetBegin
 *   The weights[] begins at defaultInput's defaultByteOffsetBegin (relative to defaultInput.buffer,
 * not to defaultInput.byteOffset). If this value less than defaultInput.byteOffset, the
 * initialization will fail (i.e. ( isValid() == false ) ).
 *
 * @member {number} defaultByteOffsetEnd
 *   The weights[] ends at defaultInput's defaultByteOffsetEnd (relative to defaultInput.buffer,
 * not to defaultInput.byteOffset) exclusively.
 *
 * @member {Float32Array} privilegeInput
 *   The privilege input Float32Array. If not null, its content will be interpret as weights and
 * the content of defaultInput will be ignored.
 *
 * @member {number} privilegeByteOffsetBegin
 *   The weights[] begins at privilegeInput's privilegeByteOffsetBegin (relative to privilegeInput.buffer,
 * not to privilegeInput.byteOffset). If this value less than privilegeInput.byteOffset, the
 * initialization will fail (i.e. ( isValid() == false ) ).
 *
 * @member {number} privilegeByteOffsetEnd
 *   The weights[] ends at privilegeInput's privilegeByteOffsetEnd (relative to privilegeInput.buffer,
 * not to privilegeInput.byteOffset) exclusively.
 *
 * @member {number[]} shape
 *   The filter shape (element count for every dimension). The shape.length is dimension. The initialization will
 * fail (i.e. ( isValid() == false ) ) if shape is too large (or NaN) (exceeds the defaultInput (or, privilegeInput
 * if not null) bounding).
 *
 * @member {Float32Array} weights
 *  The values. It is a reference (sub-range) to the underlying defaultInput (or privilegeInput).
 */
class Filter {

  constructor() {
  }

  /**
   * Create Float32Array weights[] over the defaultInput (or privilegeInput) according to the specific
   * byteOffsetBegin, shape, and weightConverter.
   *
   * The defaultInput and privilegeInput can not both be null. If one of them is null, the non-null is used.
   * If both are non-null, the privilegeInput will be used.
   *
   * @return {boolean} Return false, if initialization failed.
   */ 
  init( defaultInput, defaultByteOffsetBegin, privilegeInput, privilegeByteOffsetBegin, shape ) {

    this.defaultInput =   defaultInput;
    this.privilegeInput = privilegeInput;
    this.shape =          shape;
    this.weights =        null;   // So that ( isValid() == false ) if re-initialization failed.

    let weightCount =     ( shape ) ? shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue ) : 0;
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Exclusive. As the next filter's begin.

    if ( privilegeInput ) {       // privilegeInput first.

      if ( privilegeByteOffsetBegin < privilegeInput.byteOffset )
        return false;  // Failed, the privilege beginning position is illegal (less than bounding).

//!!! ...unfinished... It is ok to create Float32Array( null, byteOffset, length ). this.defaultWeights, this.privilegeWeights
      input = privilegeInput;
      byteOffsetBegin = this.privilegeByteOffsetBegin = privilegeByteOffsetBegin;
      byteOffsetEnd =   this.privilegeByteOffsetEnd =   privilegeByteOffsetBegin + weightByteCount;
      this.defaultByteOffsetBegin = this.defaultByteOffsetEnd = defaultByteOffsetBegin; // Not used, stay at beginning.

    } else if ( defaultInput ) {  // defaultInput second.

      if ( defaultByteOffsetBegin < defaultInput.byteOffset )
        return false;  // Failed, the default beginning position is illegal (less than bounding).

      input = defaultInput;
      byteOffsetBegin = this.defaultByteOffsetBegin = defaultByteOffsetBegin;
      byteOffsetEnd =   this.defaultByteOffsetEnd =   defaultByteOffsetBegin + weightByteCount;
      this.privilegeByteOffsetBegin = this.privilegeByteOffsetEnd = privilegeByteOffsetBegin; // Not used, stay at beginning.

    } else {
      return false;  // Failed, both privilege and default input are null.
    }

    // Bounded by the input.byteLength.
    let legalByteOffsetEnd = input.byteOffset + input.byteLength;
    if ( byteOffsetEnd > legalByteOffsetEnd )
      return false;  // Failed, if shape is too large (or NaN).

    this.weights = new Float32Array( input.buffer, byteOffsetBegin, weightCount );  // Share the underlying array buffer.
    return true;     // Success.
  }

  /** @return Return true, if initialization is success (i.e. ( this.weights != null )). */
  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }
}

/**
 * A class for the CNN separable convolution (2D) layer parameters.
 */
class Params extends Filter {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. The weights will be convert to positive integer.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {Float32Array|Array} fixedWeights
   *   If null, extract 6 parameters from inputFloat32Array. If not null, extract 6 parameters from it instead of
   * inputFloat32Array. If not null, it should have 6 elements: [ filterHeight, filterWidth, channelMultiplier,
   * dilationHeight, dilationWidth, outChannels ].
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init( inputFloat32Array, byteOffsetBegin, fixedWeights = null ) {

    function toPositiveInteger( v ) {
      return Math.abs( Math.trunc( v ) );
    }

    this.weightsModified = null;     // So that distinguishable if re-initialization failed.

    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    // Extract 6 weights from inputFloat32Array or fixedWeights, and convert the values to positive integer.
    let parameterCount = 6;
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCount ] );

    // Copy and convert to integer.
    //
    // Do not modify the original array data. When backtracking (to try another neural network layer
    // configuration), it is necessary to use the original data.
    if ( bInitOk ) {
      this.weightsModified = new Float32Array( this.weights );
      this.weightsModified.forEach( ( element, i, array ) => array[ i ] = toPositiveInteger( element ) );
    }

    return bInitOk;
  }

  get filterHeight()      { return this.weightsModified[ 0 ]; }
  get filterWidth()       { return this.weightsModified[ 1 ]; }
  get channelMultiplier() { return this.weightsModified[ 2 ]; }
  get dilationHeight()    { return this.weightsModified[ 3 ]; }
  get dilationWidth()     { return this.weightsModified[ 4 ]; }
  get outChannels()       { return this.weightsModified[ 5 ]; }
}
