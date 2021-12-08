export { Base, To, Params };

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
 * @member {(number[]|number|null)} shape
 *   The weights shape (element count for every dimension). The shape could be an array, and the shape.length represents
 * dimension. The shape could also be a scalar (0-dimension shape), i.e. ( shape.length == 0 ) is legal and means
 * extracting so many elements from defaultInput or privilegeInput. If shape is too large (exceeds the defaultInput
 * (or, privilegeInput if not null) bounding) or shape is NaN, the initialization will fail (i.e. ( isValid() == false ) ).
 * The shape could be null, and means extracting zero element (i.e. extracting nothing) from defaultInput or privilegeInput.
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
 * @member {Float32Array} weights
 *  The values. It is a reference (sub-range) to the underlying defaultInput (or privilegeInput).
 */
class Base {

  /**
   * Just record the parameters without checking them. Please call extract() to finish extracting.
   */ 
  constructor( defaultInput, defaultByteOffsetBegin, shape = null, privilegeInput = null, privilegeByteOffsetBegin = 0 ) {
    this.defaultInput =             defaultInput;
    this.defaultByteOffsetBegin =   defaultByteOffsetBegin;
    this.shape =                    shape;
    this.privilegeInput =           privilegeInput;
    this.privilegeByteOffsetBegin = privilegeByteOffsetBegin;
  }

  /**
   * Create Float32Array weights[] over the defaultInput (or privilegeInput) according to the specific
   * byteOffsetBegin and shape.
   *
   * The defaultInput and privilegeInput can not both be null. If one of them is null, the non-null is used.
   * If both are non-null, the privilegeInput will be used.
   *
   * @return {boolean} Return false, if extraction failed.
   */ 
  extract() {

    this.weights = null;   // So that ( isValid() == false ) if re-extraction failed.

    //let weightCount = ( this.shape ) ? this.shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue ) : 0;
    let weightCount = ( this.shape ) ? tf.util.sizeFromShape( this.shape ) : 0; // It can handle ( 0 == shape.length ) (i.e. scalar).
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Not inclusive. It will be used as the next filter's beginning.

    if ( this.privilegeInput ) {       // privilegeInput first.

      if ( this.privilegeByteOffsetBegin < this.privilegeInput.byteOffset )
        return false;  // Failed, the privilege beginning position is illegal (less than bounding).

      input = this.privilegeInput;
      byteOffsetBegin = this.privilegeByteOffsetBegin;
      byteOffsetEnd =   this.privilegeByteOffsetEnd = this.privilegeByteOffsetBegin + weightByteCount;
      this.defaultByteOffsetEnd = this.defaultByteOffsetBegin; // Stay at beginning for not used.

    } else if ( this.defaultInput ) {  // defaultInput second.

      if ( this.defaultByteOffsetBegin < this.defaultInput.byteOffset )
        return false;  // Failed, the default beginning position is illegal (less than bounding).

      input = this.defaultInput;
      byteOffsetBegin = this.defaultByteOffsetBegin;
      byteOffsetEnd =   this.defaultByteOffsetEnd = this.defaultByteOffsetBegin + weightByteCount;
      this.privilegeByteOffsetEnd = this.privilegeByteOffsetBegin; // Stay at beginning for not used.

    } else {
      return false;  // Failed, both privilege and default input are null.
    }

    // Bounded by the input.byteLength.
    let legalByteOffsetEnd = input.byteOffset + input.byteLength;
    if ( byteOffsetEnd > legalByteOffsetEnd )
      return false;  // Failed, if shape is too large (or NaN).

//!!! ...unfinished... (2021/12/08) Restrict weight value between [ - 2^(-24), 2^24 ]. If ( Number.isNaN() == true ), let become 0.

    this.weights = new Float32Array( input.buffer, byteOffsetBegin, weightCount );  // Share the underlying array buffer.
    return true;     // Success.
  }

  /** @return Return true, if initialization is success (i.e. ( this.weights != null )). */
  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }
  
  /**
   * Confirm:
   *   - Every element is not NaN, not infinity.
   *   - The smallest non-zero Math.abs( element ) is 2^(-24).
   *   - The largest Math.abs( element ) is 2^(+24).
   *
   * The reason is for ensuring PointDepthPoint's output is legal float32:
   *   - 
   *
   *
   *
   *
   * @param {Float32Array} source
   *   The source Float32Array.
   *
   * @return {Float32Array}
   *   Return a copy of source. Every element (float32):
   *     - If ( Number.isNaN( element ) == true ), let it become 0.
   *     - If ( element != 0 ), Math.abs( element ) will be restricted between [ 2^(-24), 2^24 ].
   *     - ( Math.sign( element ) * Math.abs( element ) ) will be restricted between [ -2^(24), 2^24 ].
   */
  static Float32Array_CloneLegal( sourceArray ) {
    let positiveMax = 

    let resultArray = new Float32Array( sourceArray.length );
    for ( let i = 0; i < sourceArray.length; ++i ) {
      let element = sourceArray[ i ];
      if ( Number.isNaN( element ) ) {
        element = 0;
      } else if ( element != 0 ) {
        let sign = Math.sign( element );
        let absValue = Math.abs( element );
        absValue = Math,
      }

      resultArray[ i ];
    }
    return resultArray;
  }

}


/**
 * Provides static methods for converting weight to parameter.
 */
class To {

  /** @return {number} Return the absolute value of the trucated value (i.e. integer). */
  static IntegerZeroPositive( v ) {
    return Math.abs( Math.trunc( v ) );
  }

  /**
   * @param {any[]} lookUpArray
   *   The value will be converted into an integer between [ 0, lookUpArray.length ). Use it as array index.
   * Return lookUpArray[ index ].
   *
   * @return {any}
   *   Convert number value into an integer between [ 0, lookUpArray.length ). Use it as array index. Return
   * the looked up element value.
   */
  static ArrayElement( value, lookUpArray ) {
    let i = To.IntegerZeroPositive( value ) % lookUpArray.length;
    return lookUpArray[ i ];
  }

}


/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {Map} parameterMapModified
 *   All parameters provided by this object. Its entry is [ key, value ]. The key of the entry [ key, value ] is a ParamDesc.Xxx object
 * (the same as the key of the init()'s parameterMap). The value of the entry [ key, value ] is adjusted parameter value
 * which is combined from the value of the init()'s parameterMap and inputFloat32Array (or fixedWeights).
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputFloat32Array or fixedWeights in fact. Only existed if init()
 * successfully. The same as this.weightCount (i.e. length of this.weights[] and this.weightsModified[]).
 *
 * @member {number} parameterCount
 *   Always ( parameterMap.size ). This is the total parameter count provided by this object
 * if init() successfully.
 *
 * @member {Float32Array} weightsModified
 *  The copied extracted values. They are copied from inputFloat32Array or fixedWeights, and then adjusted by
 * ParamDesc.valueDesc.range.adjust(). Its length will be the same as parameterCountExtracted.
 */
class Params extends Base {

  /**
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
   *   Describe what parameters to be used or extracted.
   *   - The key of this parameterMap's entry [ key, value ] should be a ParamDesc.Xxx object (one of ParamDesc.Base,
   *       ParamDesc.Same, ParamDesc.Bool) describing the parameter.
   *
   *     - The key.valueDesc should be a ValueDesc.Xxx object (one of ValueDesc.Same, ValueDesc.Bool, ValueDesc.Int).
   *       The key.valueDesc.range should be a ValueRange.Xxx object (one of ValueRange.Same, ValueRange.Bool, ValueRange.Int).
   *       The key.valueDesc.range.adjust() is a function for adjusting the parameter value.
   *
   *   - The value of this parameterMap's entry [ key, value ]:
   *
   *     - If ( null != value ), the returned value of key.range.adjust( value ) will be used as the parameter's
   *       value. (i.e. by specifying)
   *
   *     - If ( null == value ), the parameter will be extracted from inputFloat32Array (or fixedWeights).The
   *       returned value of key.valueDesc.range.adjust( extractedValue ) will be used as the parameter's value. (i.e. by evolution)
   *
   * @param {(Float32Array|number[])} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. When not null, it should have parameterCountExtracted elements (i.e. the count of non-null values
   * of parameterMap).
   */
  constructor( inputFloat32Array, byteOffsetBegin, parameterMap, fixedWeights = null ) {

    // If has fixedWeights, use it as priviledge input.
    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    let privilegeByteOffsetBegin = 0; // fixedWeights always be extracted at the beginning.

    let parameterMapModified, arrayIndexMap, parameterCountExtracted;
    if ( parameterMap ) {

      parameterMapModified = new Map; // Collect all parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the parameterMap).
      // At the same time, its array index will also be recorded for extracting its value from array.
      arrayIndexMap = new Map();
      {
        let i = 0;

        for ( let [ paramDesc, value ] of parameterMap ) {

          // A null value means it should be extracted from inputFloat32Array (or fixedWeights). (i.e. by evolution)
          //
          // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
          if ( null == value ) {
            // Record the index (into this.weightsModified[]) and the adjuster.
            arrayIndexMap.set( paramDesc, i );
            ++i;
          } else {
            // A non-null value means it is the parameter's value (which should also be adjusted).
            let adjustedValue = paramDesc.valueDesc.range.adjust( value );
            parameterMapModified.set( paramDesc, adjustedValue );
          }
        }

      }

      parameterCountExtracted = arrayIndexMap.size; // Determine how many parameters should be extracted from array.
    }

    super( inputFloat32Array, byteOffsetBegin, [ parameterCountExtracted ], privilegeInput, privilegeByteOffsetBegin );

    this.parameterMap = parameterMap;
    this.parameterMapModified = parameterMapModified;
    this.arrayIndexMap = arrayIndexMap;
  }

  /**
   * Extract parameters from inputFloat32Array.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  extract() {

    this.weightsModified = null; // So that distinguishable if re-initialization failed.

    if ( !this.parameterMap )
      return false;  // Do not know what parameters to be used or extracted.

    let bExtractOk = super.extract(); // Extract a block of input array.
    if ( !bExtractOk )
      return false;

    // Copy the adjusted extracted weights.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration.
    this.weightsModified = new Float32Array( this.weights.length );

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let [ paramDesc, arrayIndex ] of this.arrayIndexMap ) {
      let extractedValue = this.weights[ arrayIndex ];
      let adjustedValue = paramDesc.valueDesc.range.adjust( extractedValue );
      this.weightsModified[ arrayIndex ] = adjustedValue;  // Record in array.
      this.parameterMapModified.set( paramDesc, adjustedValue ); // Record in map, too.
    }

    return bExtractOk;
  }

  /** @return {number} The count of the parameters extracted from inputFloat32Array. (i.e. by evolution) */
  get parameterCountExtracted() { return this.weightCount; }

  /**
   * @return {number}
   *   The count of the all parameters (both directly given (i.e. by specifying) and extracted from inputFloat32Array (i.e. by evolution) ).
   */
  get parameterCount()          { return this.parameterMapModified.size; }

}
