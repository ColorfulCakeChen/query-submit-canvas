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
 * @member {Map} parameterMap
 *   All parameters provided by this object. Its keys are the same as init()'s parameterMap. Its values are
 * combined from init()'s parameterMap and inputFloat32Array (or fixedWeights).
 *
//!!! ...unfinished...
 * @member {number} parameterCountExtractedAtLeast
 *   How many parameters are extracted from inputFloat32Array or fixedWeights at least.
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputFloat32Array or fixedWeights in fact. Only existed if init()
 * successfully. The same as this.weightCount (i.e. length of this.weights[] and this.weightsModified[]).
//!!! ...unfinished...
 *   - = ( parameterCountExtractedAtLeast + 0 ), if both channelMultiplier and outChannels are not null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only channelMultiplier is null.
 *   - = ( parameterCountExtractedAtLeast + 1 ), if only outChannels is null.
 *   - = ( parameterCountExtractedAtLeast + 2 ), if both channelMultiplier and outChannels are null.
 *
 * @member {number} parameterCount
 *   Always ( parameterMap.size ). This is the total parameter count provided by this object
 * if init() successfully.
 *
//!!! ...unfinished...
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
   *
   * The parameterMap should have at least:
   *
   * - Params.Keys.inChannels
   *   {number} There will be how many input channels. (Input channel count)
   *
   *
   * The parameterMap could also have (and any other custom key-value pairs):
   *
   * - Params.Keys.channelMultiplier
   *   {number} Every input channel will be expanded into how many channels.
   *     - If not null, it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *     - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
   * - Params.Keys.outChannels
   *   {number} There will be how many output channels. (Output channel count)
   *     - If Number.isFinite(), it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *     - If Infinity (Number.POSITIVE_INFINITY), it will be ( inChannels * channelMultiplier ). (By channelMultiplier)
   *     - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. It should have ( parameterCountExtractedAtLeast ) or
   * ( parameterCountExtractedAtLeast + 1 ) or ( parameterCountExtractedAtLeast + 2 ) elements according to the
   * value of channelMultiplier and outChannels.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
//!!! ...unfinished...
   * @param {Map} parameterMap
   *   Describe what parameters to be extracted. The keys of parameterMap will be viewed as parameter names.
   * The values of parameterMap will be viewed as parameter values. If the value of a [ key, value ] entry is null,
   * the parameter's value will be extracted from inputFloat32Array or fixedWeights (i.e. by evolution). Otherwise,
   * the parameter's value will be the value of the [ key, value ] entry (i.e. by specifying).
   *
//!!! ...unfinished...
   * @param {Float32Array|Array} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. When not null, it should have ( parameterCountExtractedAtLeast ) or
   * ( parameterCountExtractedAtLeast + 1 ) or ( parameterCountExtractedAtLeast + 2 ) elements according to the
   * value of channelMultiplier and outChannels.
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, parameterMap, fixedWeights = null ) {

    this.weightsModified = null;     // So that distinguishable if re-initialization failed.

    if ( !parameterMap )
      return false;

    let inChannels = parameterMap.get( Params.Keys.inChannels );
    if ( !inChannels )
      return false; // It is a required parameter.

    this.parameterMap = new Map( parameterMap );
    let arrayIndexMap = new Map();
    {
      let i = 0;
      for ( let [ key, value ] of parameterMap ) {
        // A null value means it should be extracted from inputFloat32Array or fixedWeights (i.e. by evolution).
        if ( !value ) {
          arrayIndexMap.set( key, i ); // Record the index to this.weightsModified[].
          ++i;
        }
      }
    }

    let parameterCountExtracted = arrayIndexMap.size; // Determine how many parameters should be extracted from array.

    // If has fixedWeights, use it as priviledge input.
    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    // Extract from input array.
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCountExtracted ] );

    if ( !bInitOk )
      return false;

    // Copy and convert to integer.
    //
    // Do not modify the original array data. When backtracking (to try another neural network layer
    // configuration), the original data is necessary.
    this.weightsModified = new Float32Array( this.weights );
    this.weightsModified.forEach( ( element, i, array ) => array[ i ] = Base.toPositiveInteger( element ) );

    // Extract (by evolution) values from array into map.
    for ( let [ key, arrayIndex ] of arrayIndexMap ) {
      this.parameterMap.set( key, this.weightsModified[ arrayIndex ] );
    }

    let outChannelsOriginal = parameterMap.get( Params.Keys.outChannels );

    if ( !Number.isFinite( outChannelsOriginal ) ) { // outChannels by ChannelMultiplier.
      let channelMultiplier = this.channelMultiplier;
      let outChannels = inChannels * channelMultiplier;
      this.parameterMap.set( Params.Keys.outChannels, outChannels );
    }

    return bInitOk;
  }

  get parameterCountExtracted() { return this.weightCount; }
  get parameterCount()          { return this.parameterMap.size; }

  get inChannels()        { return this.parameterMap.get( Params.Keys.inChannels ); }
  get channelMultiplier() { return this.parameterMap.get( Params.Keys.channelMultiplier ); }
  get outChannels()       { return this.parameterMap.get( Params.Keys.outChannels ); }
}

/**
 * Define parameter keys.
 *
 * Although they are functions, they should not be called. They are (static function) objects used as keys of
 * Params.init()'s parameterMap. Using function object (rather than general object) so that the (function) name
 * can be seen inside Map when debugging. Using function object (rather than string or String object) so that
 * Map's key comparing is faster.
 */
Params.Keys = class {
  static inChannels()        {}
  static channelMultiplier() {}
  static outChannels()       {}
}
