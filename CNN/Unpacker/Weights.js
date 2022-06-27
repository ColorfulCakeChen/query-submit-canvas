export { Base, To, Params };

import * as FloatValue from "./FloatValue.js";

//!!! ...unfinished... (2022/06/27)
// Changed to using elementOffsetBegin, elementOffsetEnd instead of byteOffsetBegin and byteOffsetEnd.
// No longer rectricted to Float32Array. number[] should be acceptable.
// No longer create more Float32Array object.
//

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
 *   The weights shape (element count for every dimension).
 *
 *     - It could be an array, and the shape.length represents dimension.
 *
 *       - If it is a non-empty array (i.e. ( shape.length > 0 )), it means tf.util.sizeFromShape( this.shape ) elements will be extracted
 *           from defaultInput or privilegeInput.
 *
 *       - If it is an empty array (i.e. []) (i.e. ( shape.length == 0 )), it means only one element will be extracted from defaultInput
 *           or privilegeInput.
 *
 *     - It could also be a scalar number, it means extracting so many elements from defaultInput or privilegeInput.
 *
 *     - It could be null, it means extracting zero element (i.e. extracting nothing) from defaultInput or privilegeInput.
 *
 *     - If too many elements need to be extracted (exceeds the defaultInput (or, privilegeInput if not null) bounding) or shape is NaN or
 *         shape is negative, the initialization will fail (i.e. ( isValid() == false ) ).
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

    let weightCount;
    {
      if ( this.shape ) {
        if ( Array.isArray( this.shape ) )
          weightCount = tf.util.sizeFromShape( this.shape );
        else
          weightCount = this.shape;
      } else {
        weightCount = 0;
      }

      if ( Number.isNaN( weightCount ) )
        return false;  // Failed, if NaN.

      if ( weightCount < 0 )
        return false;  // Failed, if negative.
    }

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

    this.weights = new Float32Array( input.buffer, byteOffsetBegin, weightCount );  // Share the underlying array buffer.
    return true;     // Success.
  }

  /** @return Return true, if initialization is success (i.e. ( this.weights != null )). */
  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }

//!!! (2021/12/98 Remarked) Using bounds [ -2^24, +2^24 ] seems enough.
//   /**
//    * Confirm:
//    *   - Every element is not NaN. (If it is, become 0.)
//    *   - The smallest non-zero Math.abs( element ) is 2^(-24). (i.e. If ( -2^(-24) < element < +2^(-24) ), become 0.)
//    *   - The largest Math.abs( element ) is 2^(+24).
//    *
//    * This is mainly for ensuring PointDepthPoint's output is legal float32:
//    *   - PointDepthPoint is composed of 3 convolutions: pointwise1-depthwise-pointwise2.
//    *   - Suppose every convolution has 4096 (= 2^12) input channels. (The bias is viewed as the last (i.e. 4095th) channels.)
//    *   - Suppose depthwise uses 4x4 (= 2^4) filter for every channel.
//    *   - Suppose every convolution does not have activation function (so that its result is unbounded).
//    *   - If every Math.abs( pointwise1Input ) is restected to 0 or between [ 2^(-24), 2^24 ].
//    *   - If every Math.abs( weight ) of pointwise1, depthwise, pointwise2 is restected to 0 or between [ 2^(-24), 2^24 ].
//    *   - The Math.abs( pointwise1Result ) will be restriced to 0 or between [ 2^(-(24+24)), 2^(24+24+12) ] = [ 2^(-48), 2^60 ].
//    *   - The Math.abs( depthwiseResult  ) will be restriced to 0 or between [ 2^(-(48+24)), 2^(60+24+4)  ] = [ 2^(-72), 2^88 ].
//    *   - The Math.abs( pointwise2Result ) will be restriced to 0 or between [ 2^(-(72+24)), 2^(88+24+12) ] = [ 2^(-96), 2^124 ].
//    *   - So the result is still legal float32 because Math.abs( float32 ) could be either 0 or between [ 2^(-126), 2^126 ].
//    *
//    * The 2^24 as input element should be enough for most situation:
//    *   - Color image: The R, G, B, A channels are 8 bits (2^8) individually.
//    *   - Sound track: 8 bits (2^8), or 16 bits (2^16), or 20 bits (2^20), or 24 bits (2^24). But not 32 bits (2^32)
//    *   - Unicode character code point: 21 bits (2^21).
//    *
//    *
//    * <pre>
//    *              -2^(+24)       -2^(-24)                      +2^(-24)       +2^(+24)
//    *            NEGATIVE_MIN   NEGATIVE_MAX        0         POSITIVE_MIN   POSITIVE_MAX
//    *   --------------|--------------|--------------|--------------|--------------|--------------
//    *
//    * Restricted to:
//    *                 |--------------|00000000000000000000000000000|--------------|
//    * </pre>
//    *
//    *
//    * @param {Float32Array} source
//    *   The source Float32Array.
//    *
//    * @return {Float32Array}
//    *   Return a copy of source. Every element (float32):
//    *     - If ( Number.isNaN( element ) == true ), let it become 0.
//    *     - If ( element != 0 ), Math.abs( element ) will be restricted between [ 2^(-24), 2^24 ].
//    *     - ( Math.sign( element ) * Math.abs( element ) ) will be restricted between [ -2^(24), 2^24 ].
//    */
//   static Float32Array_CloneLegal( sourceArray ) {
//     const POSITIVE_MIN = Math.pow( 2, -24 );
//     const POSITIVE_MAX = Math.pow( 2, +24 );
//     const NEGATIVE_MIN = - POSITIVE_MAX; // - Math.pow( 2, +24 )
//     const NEGATIVE_MAX = - POSITIVE_MIN; // - Math.pow( 2, -24 )
//
//     let resultArray = new Float32Array( sourceArray.length );
//     for ( let i = 0; i < sourceArray.length; ++i ) {
//       let element = sourceArray[ i ];
//
//       let restricted;
//       if ( Number.isNaN( element ) ) {
//         restricted = 0;
//
//       } else if ( element >= POSITIVE_MIN ) {
//         if ( element > POSITIVE_MAX )
//           restricted = POSITIVE_MAX;
//         else
//           restricted = element;
//
//       } else if ( element <= NEGATIVE_MAX ) {
//         if ( element < NEGATIVE_MIN )
//           restricted = NEGATIVE_MIN;
//         else
//           restricted = element;
//
//       } else { // ( NEGATIVE_MAX < element < POSITIVE_MIN ) (Note: Zero is inside.)
//         restricted = 0;
//       }
//
//       resultArray[ i ] = restricted;
//     }
//     return resultArray;
//   }

}

//!!! ...unfinished... (2022/01/10)
/*
 * When ( x < 0.0000001 ), the tf.tanh( x ) will be 0.
 * That is, the precision of tf.tanh() may be 0.0000001 (= 1e-7 ).
 *
 * Consider the ActivationEscaping inputDomainLinear of tanh() is [ -0.005, +0.005 ] simultaneously. The value bounds of result
 * after filter-bias (no matter pointwise or depthwise) should be compatible with [ -0.005, +0.005 ] with precision 0.0000001 (= 1e-7 ).
 *
 * For example,
 *   - [ -0.005, +0.005 ] with precision 0.0000001 (= 1e-7 ).
 *   - [ -0.5, +0.5 ] with precision 0.00001 (= 1e-5 ).
 *   - [ -5, +5 ] with precision 0.0001 (= 1e-4 ).
 *   - [ -50, +50 ] with precision 0.001 (= 1e-3 ).
 *   - [ -500, +500 ] with precision 0.01 (= 1e-2 ).
 *   - [ -5000, +5000 ] with precision 0.1 (= 1e-1 ).
 *   - [ -50000, +50000 ] with precision 1 (= 1e+0 ).
 *   - [ -5e+4, +5e+4 ] with precision 1 (= 1e+0 ).
 *   - [ 0, +100000 ] with precision 1 (= 1e+0 ).
 *   - [ 0, +1e+5 ] with precision 1 (= 1e+0 ).
 *
 *
 *
 *
 *
 * For this reason, the Weights.Base.ValueBounds may be more less than [ -( 2 ** 24 ), +( 2 ** 24 ) ].
 * Perhaps, [ -1, +1 ] is better.?
 *
 */

/**
 * This is mainly for ensuring Block's output is legal float32:
 *   - Block is composed of 3 convolutions: pointwise1-depthwise-pointwise2.
 *   - Suppose every convolution has 4096 (= 2^12) input channels. (The bias is viewed as the last (i.e. 4095th) channels.)
 *   - Suppose depthwise uses 4x4 (= 2^4) filter for every channel.
 *   - Suppose every convolution does not have activation function (so that its result is unbounded).
 *   - If every element of pointwise1Input is bounds to [ -2^24, +2^24 ].
 *   - If every element of weights of pointwise1, depthwise, pointwise2 is bounds to [ -2^24, +2^24 ].
 *   - Every element of pointwise1Result will be bounds to [ -2^(24+24+12), +2^(24+24+12) ] = [ -2^60,  +2^60  ].
 *   - Every element of depthwiseResult  will be bounds to [ -2^(60+24+4),  +2^(60+24+4)  ] = [ -2^88,  +2^88  ].
 *   - Every element of pointwise2Result will be bounds to [ -2^(88+24+12), +2^(88+24+12) ] = [ -2^124, +2^124 ].
 *   - So the result is still legal float32 (which could represent floating-point value between [ -2^126, +2^126 ]).
 *
 * The 2^24 as input element should be enough for most situation:
 *   - Color image: The R, G, B, A channels are 8 bits (2^8) individually.
 *   - Sound track: 8 bits (2^8), or 16 bits (2^16), or 20 bits (2^20), or 24 bits (2^24). But not 32 bits (2^32)
 *   - Unicode character code point: 21 bits (2^21).
 */
Base.ValueBounds = new FloatValue.Bounds( -( 2 ** 24 ), +( 2 ** 24 ) );


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

//!!! ...unfinished... (2022/06/27)
// Whether possible use array and static ParamDesc_to_SequenceId_Map? (avoid dynamic Map for reducing memory re-allocation)
//
//
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
