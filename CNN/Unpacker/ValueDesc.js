//!!! (2021/12/09 Remarked)
//export { Same, Bool, Int };
export { Same, Bool, Int } from "ValueDesc_Base.js";
export { channelCount1_pointwise1Before };
export { Pointwise_HigherHalfDifferent };
export { AvgMax_Or_ChannelMultiplier };
//!!! (2021/12/09 Remarked)
//export { ActivationFunction };
export { ActivationFunction } from "ValueDesc_ActivationFunction.js";
export { WhetherShuffleChannel };

//!!! (2021/12/09 Remarked)
// import * as ValueRange from "./ValueRange.js";
// import * as ActivationFunction from "./ActivationFunction.js";
// import * as Weights from "./Weights.js";


//!!! (2021/12/09 Remarked)
// /**
//  * Describe some properties of a non-converting parameter.
//  *
//  * @member {ValueRange.Same} range
//  *   The range of the parameter's all possible values. It is a ValueRange.Same object.
//  *
//  */
// class Same {
//
//   constructor() {
//     this.range = ValueRange.Same.Singleton;
//   }
//
//   /** @return {string} Return the string value. */
//   getStringOf( value ) {
//     return value.toString();
//   }
// }
//
// /** The only one ValueDesc.Same instance. */
// Same.Singleton = new Same;
//
//
// /**
//  * Describe some properties of a boolean parameter.
//  *
//  * @member {ValueRange.Bool} range
//  *   The boolean range of the parameter's all possible values. It is a ValueRange.Bool object.
//  *
//  */
// class Bool {
//
//   constructor() {
//     this.range = ValueRange.Bool.Singleton;
//   }
//
//   /** @return {string} Return the string value. */
//   getStringOf( value ) {
//     return value.toString();
//   }
// }
//
// /** The only one ValueDesc.Bool instance. */
// Bool.Singleton = new Bool;
//
//
// /**
//  * Describe some properties of an integer parameter.
//  *
//  * @member {ValueRange.Int} range
//  *   The integer range of the parameter's all possible values. It is an ValueRange.Int object with ( min = valueIntegerMin )
//  * and ( max = valueIntegerMax ).
//  *
//  * @member {string[]} valueNames
//  *   The string names of the parameter's all named values. It is an array of strings. They should be all legal identifers too (i.e. A-Z,
//  * a-z, 0-9 (not at first character), and "_"). They will become the properties' names of this.Ids. Note that
//  * ( valueNames.length <= range.kinds ). This means that only first valueNames.length values have names. So, it is possible
//  * that all values do not have names (when valueNames[] is empty).
//  *
//  * @member {object[]} valueObjects
//  *   The extra objects of the parameter values. It is an array of objects. They will become the properties' names of this.extraObjects.
//  * Note that ( valueObjects.length <= range.kinds ). This means that only first valueObjects.length values have names. So, it is possible
//  * that all values do not have extra objects (when valueObjects[] is empty).
//  *
//  * @member {Object} Ids
//  *   An object contains the parameter's all named values. It is just like a name-to-integer Map (this.nameToIntegerMap), but
//  * could be accessed by dot (.) operator (not by .get() method). This could be used as a constant enumeration. The
//  * this.Ids.valueName will be valueInteger. Or, the this.Ids[ valueName ] will be valueInteger. That is:
//  *   - this.Ids[ valueNames[ 0 ] ] = valueIntegers[ 0 ] = ( valueIntegerMin + 0 )
//  *   - this.Ids[ valueNames[ 1 ] ] = valueIntegers[ 1 ] = ( valueIntegerMin + 1 )
//  *   - ...
//  *   - this.Ids[ valueNames[ ( valueNames.length - 1 ) ] ] = valueIntegers[ valueNames.length - 1 ] = ( valueIntegerMin + ( valueNames.length - 1 ) )
//  *
//  * @member {Map} nameToIntegerMap
//  *   A map object contains the parameter's all named values. Using this.nameToIntegerMap.get( name ) could get the integer value of
//  * the name.
//  *
//  * @member {Map} integerToNameMap
//  *   A map object contains the parameter's all named values. Using this.integerToNameMap.get( integerValue ) could get the name of
//  * the integer value.
//  *
//  * @member {Map} integerToObjectMap
//  *   A map object contains the parameter's all object values. Using this.integerToObjectMap.get( integerValue ) could get the extra
//  * object of the integer value.
//  *
//  */
// class Int {
//
//   /**
//    *
//    * @param {number} valueIntegerMin
//    *   The first (i.e. minimum) integer of the parameter's all possible values.
//    *
//    * @param {number} valueIntegerMax
//    *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
//    */
//   constructor( valueIntegerMin, valueIntegerMax, valueNames = [], valueObjects = [] ) {
//
//     this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );
//     this.valueNames = valueNames;
//     this.valueObjects = valueObjects;
//
//     this.Ids = {};
//     this.integerToNameMap = new Map;
//     this.nameToIntegerMap = new Map;
//     for ( let i = 0; i < valueNames.length; ++i ) {
//       let integerId = ( valueIntegerMin + i );
//       let name = valueNames[ i ];
//       this.Ids[ name ] = integerId;
//       this.integerToNameMap.set( integerId, name );
//       this.nameToIntegerMap.set( name, integerId );
//     }
//
//     this.integerToObjectMap = new Map;
//     for ( let i = 0; i < valueObjects.length; ++i ) {
//       let integerId = ( valueIntegerMin + i );
//       let object = valueObjects[ i ];
//       this.integerToObjectMap.set( integerId, object );
//     }
//   }
//
//   /**
//    * @return {string}
//    *   Return the name of the integerValue. If no name, return the string of the integer value (e.g. "1", "2", ..., "64").
//    */
//   getStringOf( integerValue ) {
//     let name = this.integerToNameMap.get( integerValue ); // Look up whether has name (e.g. "AVG", "MAX", "NONE").
//     if ( null == name ) {
//       name = integerValue.toString();
//     }
//     return name;
//   }
//
// }


/** Describe id, range, name of channelCount1_pointwise1Before.
 *
 * Convert number value into integer between [ -5, ( 10 * 1024 ) ] representing operation:
 *   - -5: ONE_INPUT_HALF_THROUGH
 *   - -4: ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1
 *   - -3: TWO_INPUTS_CONCAT_POINTWISE21_INPUT1
 *   - -2: ONE_INPUT_TWO_DEPTHWISE
 *   - -1: ONE_INPUT_ADD_TO_OUTPUT
 *   -  0: ONE_INPUT
 *   - [ 1, ( 10 * 1024 ) ]: TWO_INPUTS with the second input channel count between 1 and 10240 (inclusive). (without names defined.)
 */
class channelCount1_pointwise1Before extends Int {

  constructor() {
    super( -5, ( 10 * 1024 ), [
      "ONE_INPUT_HALF_THROUGH",                   // (-5) ShuffleNetV2_ByMobileNetV1's body/tail
      "ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1", // (-4) ShuffleNetV2_ByMobileNetV1's head
      "TWO_INPUTS_CONCAT_POINTWISE21_INPUT1",     // (-3) ShuffleNetV2's body/tail
      "ONE_INPUT_TWO_DEPTHWISE",                  // (-2) ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified)
      "ONE_INPUT_ADD_TO_OUTPUT",                  // (-1) MobileNetV2
      "ONE_INPUT",                                // ( 0) MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2)

      // "TWO_INPUTS_1", "TWO_INPUTS_2", ..., "TWO_INPUTS_10240".
      //
      // ShuffleNetV2_ByPointwise22's body/tail
      //
      // (2021/07/13 Remarked) Do not define these names because they will occupy too many memory.
      //
      //... [ ... new Array( 10 * 1024 ).keys() ].map( x => "TWO_INPUTS_" + ( x + 1 ) )
    ] );
  }

}

/** The only one ValueDesc.channelCount1_pointwise1Before instance. */
channelCount1_pointwise1Before.Singleton = new channelCount1_pointwise1Before;


/** Describe id, range, name of the processing mode of pointwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 4 ] representing:
 *   - 0: NONE
 *   - 1: HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH
 *   - 2: HIGHER_HALF_COPY_LOWER_HALF
 *   - 3: HIGHER_HALF_POINTWISE22
 *   - 4: HIGHER_HALF_PASS_THROUGH
 */
class Pointwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 4, [
      "NONE",                                                 // (0) (for normal poitwise convolution. no higher half different.)
      "HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH", // (1) (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_COPY_LOWER_HALF",                          // (2) (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_POINTWISE22",                              // (3) (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_PASS_THROUGH",                             // (4) (for pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
    ] );
  }

}

/** The only one ValueDesc.Pointwise_HigherHalfDifferent instance. */
Pointwise_HigherHalfDifferent.Singleton = new Pointwise_HigherHalfDifferent;


/** Describe depthwise operation's id, range, name.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -2: average pooling. (AVG)
 *   - -1: maximum pooling. (MAX)
 *   -  0: no depthwise operation. (NONE)
 *   - [ 1, 32 ]: depthwise convolution with channel multiplier between 1 and 32 (inclusive).
 */
class AvgMax_Or_ChannelMultiplier extends Int {

  constructor() {
    super( -2, 32, [ "AVG", "MAX", "NONE" ] );
  }

}

/** The only one ValueDesc.AvgMax_Or_ChannelMultiplier instance. */
AvgMax_Or_ChannelMultiplier.Singleton = new AvgMax_Or_ChannelMultiplier;


//!!! (2021/12/09 Remarked)
// /**
//  * Describe activation function parameter's id, range, name.
//  *
//  * For inputDomainLinear,
//  *   - RELU6 is linear between[ 0, 6 ].
//  *   - SIGMOID is alomost linear between[ -0.125, +0.125 ].
//  *   - TANH is almost linear between[ -0.125, +0.125 ].
//  *   - COS is almost linear between[ -( ( PI / 2 ) + 0.025 ), -( ( PI / 2 ) - 0.025 ) ].
//  *   - SIN is almost linear between[ -0.025, +0.025 ].
//  *   - RELU is linear between[ 0, 6 ].
//  */
// class ActivationFunction extends Int {
//
//   constructor() {
//     // Note:
//     //   - NONE: Beware. It easily results in infinity value because it does not have upper bound.
//     //   - RELU: Beware. It easily results in infinity value because it does not have upper bound.
//     //   - SOFTPLUS: Avoid. Backend WASM does not support it.
//
// //!!! (2021/12/09 Remarked) Use ActivationFunction.Info
// //     super( 0, 6,
// //       [ "NONE",  "RELU6",  "SIGMOID",  "TANH",  "COS",  "SIN",  "RELU" ], //  "SOFTPLUS" ],
// //       [   null, tf.relu6, tf.sigmoid, tf.tanh, tf.cos, tf.sin, tf.relu ]  // tf.softplus ]
// //     );
//
//     super( 0, 6,
//       [ "NONE",  "RELU6",  "SIGMOID",  "TANH",  "COS",  "SIN",  "RELU" ], //  "SOFTPLUS" ],
//
//       [
//         new ActivationFunction.Info( 0, null, null, null ),
//
//         new ActivationFunction.Info( 1, tf.relu6,
//           new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ) ),
//
//         new ActivationFunction.Info( 2, tf.sigmoid,
//           new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( 0, 1 ) ),
//
//         new ActivationFunction.Info( 3, tf.tanh,
//           new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( -1, +1 ) ),
//
//         new ActivationFunction.Info( 4, tf.cos,
//           new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.025 ), -( ( Math.PI / 2 ) - 0.025 ) ), new FloatValue.Bounds( -1, +1 ) ),
//
//         new ActivationFunction.Info( 5, tf.sin,
//           new FloatValue.Bounds( -0.025, +0.025 ), new FloatValue.Bounds( -1, +1 ) ),
//
//         // Note: The input linear domain and output range of RELU are [ 0, +INF ].
//         //       However, for PointDepthPoint, using Weights.Base.ValueBounds.upper as upper bound should be sufficient.
//         new ActivationFunction.Info( 6, tf.relu,
//           new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ), new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ) ),
//
//         //new ActivationFunction.Info( 7, tf.softplus,
//         //  new Base( 0, 6 ), Weights.Base.ValueBounds ),
//
//       ]
//     );
//
//   }
//
//   /**
//    * Convert activation function id to information object.
//    *
//    * @param {number} nActivationId
//    *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx. (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
//    * ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
//    *
//    * @return {ActivationFunction.Info}
//    *   It should be one of ValueDesc.ActivationFunction.Singleton.integerToObjectMap according to the nActivationId.
//    */
//   getInfoById( nActivationId ) {
//     let info = this.integerToObjectMap.get( nActivationId );
//     return info;
//   }
//
// }
//
// /** The only one ValueDesc.ActivationFunction instance. */
// ActivationFunction.Singleton = new ActivationFunction;


/** Describe id, range, name of WhetherShuffleChannel.
 *
 * Convert number value into integer between [ 0, 3 ] representing operation:
 *   - 0: NONE (i.e. NotShuffleNet_NotMobileNet, or MobileNetV2)
 *   - 1: BY_POINTWISE22      (i.e. ShuffleNetV2_ByPointwise22)
 *   - 2: BY_CHANNEL_SHUFFLER (i.e. ShuffleNetV2)
     - 3: BY_MOBILE_NET_V1    (i.e. ShuffleNetV2_ByMobileNetV1)
 */
class WhetherShuffleChannel extends Int {

  constructor() {
    super( 0, 2, [
      "NONE",                // (0)
      "BY_CHANNEL_SHUFFLER", // (1)
      "BY_POINTWISE22",      // (2)
      "BY_MOBILE_NET_V1",    // (3)
    ] );
  }

}

/** The only one ValueDesc.WhetherShuffleChannel instance. */
WhetherShuffleChannel.Singleton = new WhetherShuffleChannel;

