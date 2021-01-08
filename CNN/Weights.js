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
 *   The weights[] ends at defaultInput's defaultByteOffsetEnd (not inclusive) (relative to
 * defaultInput.buffer, not to defaultInput.byteOffset).
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
 *   The weights[] ends at privilegeInput's privilegeByteOffsetEnd (not inclusive) (relative
 * to privilegeInput.buffer, not to privilegeInput.byteOffset).
 *
 * @member {number[]} shape
 *   The weights shape (element count for every dimension). The shape.length is dimension. If ( shape.length == 0 ),
 * it is 0-dimension (i.e. scalar). The initialization will fail (i.e. ( isValid() == false ) ) if shape is too large
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

    //let weightCount =     ( shape ) ? shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue ) : 0;
    let weightCount =     ( shape ) ? tf.util.sizeFromShape( shape ) : 0; // It can handle ( 0 == shape.length ) (i.e. scalar).
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Not inclusive. It will be used as the next filter's beginning.

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

  /** @return {number} Return the absolute value of the trucated value (i.e. integer). */
  static toIntegerZeroPositive( v ) {
    return Math.abs( Math.trunc( v ) );
  }

  /**
   * @return {number} Return the trucated value (i.e. integer). The returned value is forcibly between min and max (as integer too).
   */
  static toIntegerRange( value, min, max ) {
    let valueMin = Math.trunc( Math.min( min, max ) ); // Confirm the minimum. Convert to an integer.
    let valueMax = Math.trunc( Math.max( min, max ) ); // Confirm the maximum. Convert to an integer.
    let valueKinds = ( valueMax - valueMin ) + 1; // How many possible integer between them.

    // Because remainder always has the same sign as dividend, force the dividend to zeor or positive for processing easily.
    let result = valueMin + ( Base.toIntegerZeroPositive( value ) % valueKinds );
    return result;
  }

  /** @return {boolean} Convert number value into false or true. */
  static toBoolean( value ) {
    // If value is not integer, the remainder will always not zero. So convert it to integer first.
    //
    // According to negative or positive, the remainder could be one of [ -1, 0, +1 ].
    // So simply check it whether is 0 (instead of check both -1 and +1), could result in false or true.
    return ( ( Math.trunc( value ) % 2 ) != 0 );
  }

  /**
   * @param {(number[]|string[])} lookUpArray
   *   The value will be converted into zero or positive integer. Use it as array index. Return lookUpArray[ index ].
   *
   * @return {string}
   *   Convert number value into zero or positive integer. Use it as array index. Return the looked up activation function name string.
   */
  static toArrayElement( value, lookUpArray ) {
    let i = Base.toIntegerZeroPositive( value ) % lookUpArray.length;
    return lookUpArray[ i ];
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
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputFloat32Array or fixedWeights in fact. Only existed if init()
 * successfully. The same as this.weightCount (i.e. length of this.weights[] and this.weightsModified[]).
 *
 * @member {number} parameterCount
 *   Always ( parameterMap.size ). This is the total parameter count provided by this object
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
   *
   * The parameterMap should have at least:
   *
   * - Params.Keys.inChannels
   *   {number} There will be how many input channels. (Input channel count) (By specifying)
   *
   *
   * The parameterMap could also have (and any other custom key-value pairs):
   *
   * - Params.Keys.channelMultiplier
   *   {number} Every input channel will be expanded into how many channels. (No matter how it is determined, it will
   *   always be forcibly adjusted to positive integer.)
   *     - If not null, it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *     - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
   * - Params.Keys.outChannels
   *   {number} There will be how many output channels. (Output channel count)
   *     - If Number.isFinite(), it will be used instead of extracting from inputFloat32Array or fixedWeights. (By specifying)
   *     - If Infinity (Number.POSITIVE_INFINITY), it will be ( inChannels * channelMultiplier ). (By channelMultiplier)
   *     - If null, extracted from inputFloat32Array or fixedWeights. (By evolution)
   *
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
   * @param {Map} parameterMap
   *   Describe what parameters to be used or extracted. The keys of parameterMap will be viewed as parameter names.
   * The values of parameterMap will be viewed as parameter values or converter. If the value of a [ key, value ] entry is:
   *   - function: a value will be extracted from inputFloat32Array (or fixedWeights), and past into the function. The
   *               returned value of the function will become the parameter's value. (i.e. by evolution)
   *   - null: the same as using Base.toIntegerZeroPositive() as function. (i.e. by evolution)
   *   - Otherwise: the value will be used as the parameter's value directly. (i.e. by specifying)
   *
   * @param {(Float32Array|number[])} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. When not null, it should have parameterCountExtracted elements (i.e. the count of non-null values
   * of parameterMap).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, parameterMap, fixedWeights = null ) {

    this.weightsModified = this.parameterMapModified = null; // So that distinguishable if re-initialization failed.

    if ( !parameterMap )
      return false;  // Do not know what parameters to be used or extracted.

    let inChannels = parameterMap.get( Params.Keys.inChannels );
    if ( !inChannels )
      return false;  // At least, there should be a (required) parameter (i.e. input channel count).

    this.parameterMapModified = new Map( parameterMap );  // Copy so that the original map will not be modified.

    // Collect what parameters should be extracted from input array (rather than use values in the parameterMap).
    // At the same time, its array index will also be recorded for extracting its value from array.
    let arrayIndexMap = new Map();
    {
      let i = 0;
      for ( let [ key, value ] of parameterMap ) {
        // A null (or undefined) value means it should be extracted from inputFloat32Array or fixedWeights, and
        // using Base.toIntegerZeroPositive() as converter function. (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        if ( null == value ) {
          value = Base.toIntegerZeroPositive;
        }

        // A function value means it should be extracted from inputFloat32Array (or fixedWeights), and
        // using the function as converter. (i.e. by evolution)
        if ( ( typeof value ) === "function" ) {
          // Record the index (into this.weightsModified[]) and the converter.
          arrayIndexMap.set( key, { arrayIndex: i, converterFunction: value } );
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

    // Extract a block of input array.
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCountExtracted ] );

    if ( !bInitOk )
      return false;

    // Copy and convert to integer.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration)
    this.weightsModified = new Float32Array( this.weights.length );

//!!! (2021/01/07 Modified) Using custom converter function.
//     for ( let i = 0; i < this.weightsModified.length; ++i ) {
//       this.weightsModified[ i ] = Base.toIntegerZeroPositive( this.weights[ i ] );
//     }

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let [ key, { arrayIndex, converterFunction } ] of arrayIndexMap ) {
      let extractedValue = this.weights[ arrayIndex ];
      let convertedValue = converterFunction( extractedValue );
      this.weightsModified[ arrayIndex ] = convertedValue; // Record in array.
      this.parameterMapModified.set( key, convertedValue ); // Record in map, too.
    }

    // Restrict channelMultiplier to positive integer.
    //
    // If it is zero or negative, the outChannels (= inChannels * channelMultiplier ) will be strange value.
    // Strange outChannels value will affect the parameters extraction of the next neural network layer.
    let channelMultiplier = this.channelMultiplier;   // May be specified or extracted.
    if ( channelMultiplier < 1 ) {
      channelMultiplier = 1;
      this.parameterMapModified.set( Params.Keys.channelMultiplier, channelMultiplier );
    }

    // If original parameterMap has output channel count and its value is infinity, its value will depend
    // on channelMultiplier (i.e. by channelMultiplier).
    //
    // Usually, the embedding layer uses this behavior.
    let outChannelsOriginal = parameterMap.get( Params.Keys.outChannels );
    if ( outChannelsOriginal ) {
      if ( !Number.isFinite( outChannelsOriginal ) ) {
        let outChannels = inChannels * channelMultiplier;
        this.parameterMapModified.set( Params.Keys.outChannels, outChannels );
      } else {
        // Use the original value in parameterMap as output channel count (i.e. by specifying).
      }
    } else {
      // Either use the extracted value as output channel count (i.e. by evolution),
      // or there is no output channel count in fact.
    }

    return bInitOk;
  }

  get parameterCountExtracted() { return this.weightCount; }
  get parameterCount()          { return this.parameterMapModified.size; }

  // Most kinds of layers have these parameters.

  get inChannels()        { return this.parameterMapModified.get( Params.Keys.inChannels ); }
  get channelMultiplier() { return this.parameterMapModified.get( Params.Keys.channelMultiplier ); }
  get outChannels()       { return this.parameterMapModified.get( Params.Keys.outChannels ); }
}

/**
 * Define parameter keys.
 *
 * They are (static) symbol objects used as keys of Params.init()'s parameterMap. They can be seen inside Map when
 * debugging, and are faster than string (or String object) when Map's key comparing.
 */
Params.Keys = class {
//   // Although they are functions, they should not be called. They are (static function) objects used as keys of
//   // Params.init()'s parameterMap. Using function object (rather than general object) so that the (function) name
//   // can be seen inside Map when debugging. Using function object (rather than string or String object) so that
//   // Map's key comparing is faster.
//   static inChannels()        {}
//   static channelMultiplier() {}
//   static outChannels()       {}
}

Params.Keys.inChannels =        Symbol("inChannels");
Params.Keys.channelMultiplier = Symbol("channelMultiplier");
Params.Keys.outChannels =       Symbol("outChannels");

Params.Keys.dilationHeight =    Symbol("dilationHeight");
Params.Keys.dilationWidth =     Symbol("dilationWidth");
Params.Keys.filterHeight =      Symbol("filterHeight");
Params.Keys.filterWidth =       Symbol("filterWidth");
