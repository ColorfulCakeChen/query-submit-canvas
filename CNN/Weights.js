export { Base, Params };

/**
 * A base class for extracting and keeping weights. It composes of a Float32Array and a shape. It can
 * be used as CNN (depthwise, pointwise and bias) filter weights.
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
 *   The filter shape (element count for every dimension). The shape.length is dimension. The
 * initialization will fail (i.e. ( isValid() == false ) ) if shape is too large (or NaN)
 * (exceeds the defaultInput (or, privilegeInput if not null) bounding).
 *
 * @member {Float32Array} weights
 *  The values. It is a reference (sub-range) to the underlying defaultInput (or privilegeInput).
 */
class Base {

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

//    let weightCount =     ( shape ) ? shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue ) : 0;
    let weightCount =     ( shape ) ? tf.sizeFromShape( shape ) : 0; // tf.sizeFromShape() can handle zero length (i.e. scalar).
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Exclusive. As the next filter's begin.

    if ( privilegeInput ) {       // privilegeInput first.

      if ( privilegeByteOffsetBegin < privilegeInput.byteOffset )
        return false;  // Failed, the privilege beginning position is illegal (less than bounding).

      input = privilegeInput;
      byteOffsetBegin = this.privilegeByteOffsetBegin = privilegeByteOffsetBegin;
      byteOffsetEnd =   this.privilegeByteOffsetEnd =   privilegeByteOffsetBegin + weightByteCount;
      this.defaultByteOffsetBegin = this.defaultByteOffsetEnd = defaultByteOffsetBegin; // Stay at beginning for not used.

    } else if ( defaultInput ) {  // defaultInput second.

      if ( defaultByteOffsetBegin < defaultInput.byteOffset )
        return false;  // Failed, the default beginning position is illegal (less than bounding).

      input = defaultInput;
      byteOffsetBegin = this.defaultByteOffsetBegin = defaultByteOffsetBegin;
      byteOffsetEnd =   this.defaultByteOffsetEnd =   defaultByteOffsetBegin + weightByteCount;
      this.privilegeByteOffsetBegin = this.privilegeByteOffsetEnd = privilegeByteOffsetBegin; // Stay at beginning for not used.

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

  /** @return {number} Return the absolute value of the trucated value. */
  static toPositiveInteger( v ) {
    return Math.abs( Math.trunc( v ) );
  }

  /** @return Return true, if initialization is success (i.e. ( this.weights != null )). */
  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }
}


/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {number} parameterCountExtractedAtLeast
 *   How many parameters are extracted from inputFloat32Array or fixedWeights at least.
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputFloat32Array or fixedWeights. This will be the length
 * of this.weights[] and this.weightsModified[].
 *   - = ( parameterCountExtractedAtLeast + 0 ), if both channelMultiplier and outChannels are not null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only channelMultiplier is null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only outChannels is null.
 *   - = ( parameterCountExtractedAtLeast + 2 ), if both channelMultiplier and outChannels are null.
 *
 * @member {number} inChannels
 *   The input channel count of this neural network layer.
 *
 * @member {number} channelMultiplier
 *   Every input channel will be expanded into how many channels.
 *
 * @member {number} outChannels
 *   The output channel count of this neural network layer.
 *
 * @member {Float32Array} weightsModified
 *  The copied extracted values. They are copied from inputFloat32Array or fixedWeights, and then converted
 * to positive integer. Its length maybe ( parameterCountMax ) or ( parameterCountMax - 1 ) according to
 * whether init()'s outChannels is null or not.
 */
class Params extends Base {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. It should have ( parameterCountMax ) or
   * ( parameterCountMax - 1 ) or ( parameterCountMax - 2 ) elements according to the combination of
   * channelMultiplier and outChannels.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} inChannels
   *   There will be how many input channels. (Input channel count)
   *
???
   * @param {number} parameterCountExtractedAtLeast
   *   There will be at least how many parameters extracted from inputFloat32Array or fixedWeights.
   *
   * @param {number} channelMultiplier
   *   Every input channel will be expanded into how many channels.
   *   - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *   - If not null, it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *
   * @param {number} outChannels
   *   There will be how many output channels. (Output channel count)
   *   - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *   - If not Number.isFinite(), it will be ( inChannels * channelMultiplier ). (By channelMultiplier)
   *   - If Number.isFinite(), it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *
   * @param {Float32Array|Array} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. If not null, it should have ( parameterCountMax ) or ( parameterCountMax - 1 )
   * or ( parameterCountMax - 2 ) elements according to the combination of channelMultiplier and outChannels.
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init(
    inputFloat32Array, byteOffsetBegin, parameterCountExtractedAtLeast, inChannels,

    channelMultiplierByEvolution
    channelMultiplierBySpecify
     
    outChannelsByChannelMultiplier  (Number.isNaN() == true)
    outChannelsByEvolution
    outChannelsBySpecify

    outChannels = null, fixedWeights = null ) {

    this.parameterCountExtractedAtLeast = this.parameterCountExtracted = parameterCountExtractedAtLeast;
    this.inChannels = inChannels;

    this.outChannels = outChannels;
    this.weightsModified = null;     // So that distinguishable if re-initialization failed.

    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    // Extract how many weights.
    let parameterCount;
    {
      if ( outChannels )
        parameterCount = parameterCountMax - 1;  // Since there is outChannels, extract fewer weights.
      else
        parameterCount = parameterCountMax;

      parameterCount = Math.max( parameterCount, 0 ); // Prevent from negative. At least, should be zero.
    }

    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCount ] );

    // Copy and convert to integer.
    //
    // Do not modify the original array data. When backtracking (to try another neural network layer
    // configuration), the original data is necessary.
    if ( bInitOk ) {
      this.weightsModified = new Float32Array( this.weights );
      this.weightsModified.forEach( ( element, i, array ) => array[ i ] = Base.toPositiveInteger( element ) );

      // If not specified, use the last weight as output channel count. 
      if ( !outChannels )
        this.outChannels = this.weightsModified[ parameterCount - 1 ];
    }

    return bInitOk;
  }

}
