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
 *   The weights shape (element count for every dimension). The shape.length is dimension. If ( shape.length == 0 ),
 * it is 0-dimension (i.e. scalar). Theinitialization will fail (i.e. ( isValid() == false ) ) if shape is too large
 * (or NaN) (exceeds the defaultInput (or, privilegeInput if not null) bounding).
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
 *   How many parameters are extracted from inputFloat32Array or fixedWeights in fact. This will be the length
 * of this.weights[] and this.weightsModified[].
 *   - = ( parameterCountExtractedAtLeast + 0 ), if both channelMultiplier and outChannels are not null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only channelMultiplier is null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only outChannels is null.
 *   - = ( parameterCountExtractedAtLeast + 2 ), if both channelMultiplier and outChannels are null.
 *
 * @member {number} parameterCount
 *   Always ( parameterCountExtractedAtLeast + 2 )。 This is the total parameter count provided by this object
 * if init() successfully.
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
 * to positive integer. Its length will be the same as parameterCountExtracted.
 */
class Params extends Base {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. It should have ( parameterCountExtractedAtLeast ) or
   * ( parameterCountExtractedAtLeast + 1 ) or ( parameterCountExtractedAtLeast + 2 ) elements according to the
   * value of channelMultiplier and outChannels.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} inChannels
   *   There will be how many input channels. (Input channel count)
   *
   * @param {number} parameterCountExtractedAtLeast
   *   There will be at least how many parameters extracted from inputFloat32Array or fixedWeights.
   *
   * @param {number} channelMultiplier
   *   Every input channel will be expanded into how many channels.
   *   - If not null, it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *   - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
   * @param {number} outChannels
   *   There will be how many output channels. (Output channel count)
   *   - If Number.isFinite(), it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *   - If Number.POSITIVE_INFINITY, it will be ( inChannels * channelMultiplier ). (By channelMultiplier)
   *   - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
   * @param {Float32Array|Array} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. If not null, it should have ( parameterCountExtractedAtLeast ) or
   * ( parameterCountExtractedAtLeast + 1 ) or ( parameterCountExtractedAtLeast + 2 ) elements according to the
   * value of channelMultiplier and outChannels.
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init(
    inputFloat32Array, byteOffsetBegin, parameterCountExtractedAtLeast, inChannels,
    channelMultiplier = null, outChannels = null, fixedWeights = null ) {

    // Prevent from negative. At least, should be zero.
    let parameterCountExtracted = this.parameterCountExtractedAtLeast = Math.max( parameterCountExtractedAtLeast, 0 );
    this.parameterCount = parameterCountExtracted + 2;  // +2 for channelMultiplier and outChannels.
    this.inChannels = inChannels;

    this.weightsModified = null;     // So that distinguishable if re-initialization failed.

    // Determine how many parameters should be extracted from array.
    {
      if ( !channelMultiplier ) // channelMultiplier by evolution.
        ++parameterCountExtracted;

      if ( !outChannels )       // outChannels by evolution.
        ++parameterCountExtracted;
    }

    // If has fixedWeights, use it as priviledge input.
    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    // Extract from array.
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCountExtracted ] );

    // Copy and convert to integer.
    //
    // Do not modify the original array data. When backtracking (to try another neural network layer
    // configuration), the original data is necessary.
    if ( bInitOk ) {
      this.weightsModified = new Float32Array( this.weights );
      this.weightsModified.forEach( ( element, i, array ) => array[ i ] = Base.toPositiveInteger( element ) );

      // Determine this.channelMultiplier and this.outChannels.
      if ( channelMultiplier ) { // 1. channelMultiplier by specifying.
        if ( outChannels ) {
          if ( Number.isFinite( outChannels ) ) { // 1.1 outChannels by specifying.
            this.channelMultiplier = channelMultiplier;
            this.outChannels =       outChannels;
          } else {                                // 1.2 outChannels by channelMultiplier.
            this.channelMultiplier = channelMultiplier;
            this.outChannels =       inChannels * channelMultiplier;
          }
        } else {                                  // 1.3 outChannels by evolution.
          this.channelMultiplier =   channelMultiplier;
          this.outChannels =         this.weightsModified[ parameterCountExtracted - 1 ];
        }
      } else {                   // 2. channelMultiplier by evolution.
        if ( outChannels ) {
          if ( Number.isFinite( outChannels ) ) { // 2.1 outChannels by specifying.
            this.channelMultiplier = this.weightsModified[ parameterCountExtracted - 1 ];
            this.outChannels =       outChannels;
          } else {                                // 2.2 outChannels by channelMultiplier.
            this.channelMultiplier = this.weightsModified[ parameterCountExtracted - 1 ];
            this.outChannels =       inChannels * this.channelMultiplier;
          }
        } else {                                  // 2.3 outChannels by evolution.
          this.channelMultiplier = this.weightsModified[ parameterCountExtracted - 2 ];
          this.outChannels =       this.weightsModified[ parameterCountExtracted - 1 ];
        }
      }

    }

    return bInitOk;
  }

  get parameterCountExtracted() { return this.shape.length; }
}
