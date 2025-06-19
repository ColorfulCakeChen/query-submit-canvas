export { tester };

import * as Base64 from "../Unpacker/Base64.js";
import * as Float12 from "../Unpacker/Float12.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

//!!! (2022/12/27 Remarked) Unused
// /**
//  */
// function array1d_compare_EQ( array1d_lhs, array1d_rhs ) {
//
//   let max_i = Math.max( array1d_lhs.length, array1d_rhs.length );
//   for ( let i = 0; i < max_i; ++i ) {
//     if ( array1d_lhs[ i ] != array1d_rhs[ i ] )
//       return false;
//   }
//
//   return true;
// }

let g_textDecoder = new TextDecoder();
let g_tempUint8Array = new Uint8Array( 2 );

/** */
class TestCase_Float12_Constant{
  constructor( constantName, constantValue ) {
    this.name = constantName;
    this.value = constantValue;
  }
}

/** */
class TestCase_Float12_EncodeDecode{
  constructor( originalValue, decodedValue ) {
    this.originalValue = originalValue;
    this.decodedValue = decodedValue;
  }
}

/** */
const Float12_Constant_Coder_Table = [
  new TestCase_Float12_Constant( "FractionBitCount", 5 ),
  new TestCase_Float12_Constant( "FractionBitmask", 31 ),
  new TestCase_Float12_Constant( "FractionUnsignedMin", 0 ),
  new TestCase_Float12_Constant( "FractionUnsignedMax", 31 ),

  new TestCase_Float12_Constant( "ImplicitBitCount", 1 ),
  new TestCase_Float12_Constant( "ImplicitBitmask", 1 ),
  new TestCase_Float12_Constant( "ImplicitBitmaskLShiftCount", 5 ),
  new TestCase_Float12_Constant( "ImplicitBitmaskLShifted", 32 ),

  new TestCase_Float12_Constant( "ExponentBitCount", 6 ),
  new TestCase_Float12_Constant( "ExponentBitmask", 63 ),
  new TestCase_Float12_Constant( "ExponentBitmaskLShiftCount", 5 ),
  new TestCase_Float12_Constant( "ExponentBitmaskLShifted", 2016 ),
  new TestCase_Float12_Constant( "ExponentOffsetToSigned", 32 ),
  new TestCase_Float12_Constant( "ExponentNegativeMin", -32 ),
  new TestCase_Float12_Constant( "ExponentPositiveMax", 31 ),

  new TestCase_Float12_Constant( "SignBitCount", 1 ),
  new TestCase_Float12_Constant( "SignBitmask", 1 ),
  new TestCase_Float12_Constant( "SignBitmaskLShiftCount", 11 ),
  new TestCase_Float12_Constant( "SignBitmaskLShifted", 2048 ),

  new TestCase_Float12_Constant( "SignificandBitCount", 6 ),
  new TestCase_Float12_Constant( "SignificandUnsignedMin", 32 ),
  new TestCase_Float12_Constant( "SignificandUnsignedMax", 63 ),

  new TestCase_Float12_Constant( "BitCount", 12 ),
];

/** */
const Float12_Constant_Table = [
  new TestCase_Float12_Constant( "StringCharCount", 2 ),
  new TestCase_Float12_Constant( "NextStringCharCount", 2 ),

  new TestCase_Float12_Constant( "NegativeMin", -4227858432 ),
  new TestCase_Float12_Constant( "NegativeMinLess", -4227858433 ),

  new TestCase_Float12_Constant( "PositiveMax", 4227858432 ),
  new TestCase_Float12_Constant( "PositiveMaxMore", 4227858433 ),

  new TestCase_Float12_Constant( "PositiveMin", 2.4010660126805305E-010 ),
  new TestCase_Float12_Constant( "PositiveMinLess", 2.3283064365386963E-010 ),
];

/** */
const Float12_EncodeDecode_Table = [
  new TestCase_Float12_EncodeDecode( 0, 0 ),
  new TestCase_Float12_EncodeDecode( -0, 0 ),


  new TestCase_Float12_EncodeDecode(
    Number.NEGATIVE_INFINITY, Float12.Constant.NegativeMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMin, Float12.Constant.NegativeMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMinLess, Float12.Constant.NegativeMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMin - 1, Float12.Constant.NegativeMin ),


  new TestCase_Float12_EncodeDecode(
    Number.POSITIVE_INFINITY, Float12.Constant.PositiveMax ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMax, Float12.Constant.PositiveMax ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMaxMore, Float12.Constant.PositiveMax ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMax + 1, Float12.Constant.PositiveMax ),


  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMin, Float12.Constant.PositiveMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMinLess, 0 ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.PositiveMin - Number.EPSILON, 0 ),


  new TestCase_Float12_EncodeDecode(
    -Float12.Constant.PositiveMin, -Float12.Constant.PositiveMin ),

  new TestCase_Float12_EncodeDecode(
    -Float12.Constant.PositiveMinLess, 0 ),

  new TestCase_Float12_EncodeDecode(
    -Float12.Constant.PositiveMin + Number.EPSILON, 0 ),


  new TestCase_Float12_EncodeDecode(
    Number.NaN, 0 ),
];

/** */
function *testerFloat12Constant( progressParent ) {

  let testCaseCount
    = Float12_Constant_Coder_Table.length + Float12_Constant_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

  // 1.
  for ( let i = 0; i < Float12_Constant_Coder_Table.length; ++i ) {
    let testCase = Float12_Constant_Coder_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant.Coder[ testCase.name ] == testCase.value ) {
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.Coder.${testCase.name} `
      + `( ${Float12.Constant.Coder[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  // 2.
  for ( let i = 0; i < Float12_Constant_Table.length; ++i ) {
    let testCase = Float12_Constant_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta
    //  = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant[ testCase.name ] == testCase.value ) {
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.${testCase.name} `
      + `( ${Float12.Constant[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerFloat12EncodeDecode( progressParent ) {

  let testCaseCount = Float12_EncodeDecode_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  for ( let i = 0; i < Float12_EncodeDecode_Table.length; ++i ) {
    let testCase = Float12_EncodeDecode_Table[ i ];

    let Float12_encoded_string = Float12.Encoder.to_String(
      testCase.originalValue,
      g_textDecoder, g_tempUint8Array );

    let Float12_decoded_value
      = Float12.Decoder.from_String( Float12_encoded_string );

//!!! (2022/12/22 Remarked)
    // let delta = Math.abs( Float12_decoded_value - testCase.decodedValue )
    // if ( delta <= Number.EPSILON ) {

    if ( Float12_decoded_value === testCase.decodedValue ) {
      continue;
    }

    throw Error( `testerFlot12EncodeDecode(): `
      + `( ${testCase.originalValue} ) encoded as `
      + `( \"${Float12_encoded_string}\" ), `
      + `decoded as ( ${Float12_decoded_value} ) `
      + `should be ( ${testCase.decodedValue} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerFloat12DecodeEncode( progressParent ) {

  let testCaseCount
    = Base64.Constant.EncodeTable_Uint6_to_Char.length
        * Base64.Constant.EncodeTable_Uint6_to_Char.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  for ( let i = 0;
    i < Base64.Constant.EncodeTable_Uint6_to_Char.length; ++i ) {

    for ( let j = 0;
      j < Base64.Constant.EncodeTable_Uint6_to_Char.length; ++j ) {

      let Float12_original_string =
         Base64.Constant.EncodeTable_Uint6_to_Char[ i ]
       + Base64.Constant.EncodeTable_Uint6_to_Char[ j ];

      let Float12_decoded_value
        = Float12.Decoder.from_String( Float12_original_string );

      let Float12_encoded_string
        = Float12.Encoder.to_String( Float12_decoded_value,
            g_textDecoder, g_tempUint8Array );

      if ( Float12_encoded_string === Float12_original_string ) {
        continue;
      }

      // The only allowable exception: -0 will be encoded as 0.
      if (    ( "gA" === Float12_original_string ) // -0
           && ( "AA" === Float12_encoded_string ) // 0
         ) {
          continue;
      }

      throw Error( `testerFloat12DecodeEncode(): `
        + `( \"${Float12_original_string}\" ) decoded as `
        + `( ${Float12_decoded_value} ), `
        + `encoded as ( \"${Float12_encoded_string}\" ) `
        + `should be the same as original.`
      );
    }
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerFloat12EncodeDecodeArray( progressParent ) {

  let numberCount = 100;

  let tempUint8ArrayArray = [
    null,                              // No temporary Uint8Array.
    new Uint8Array( numberCount / 2 ), // temporary Uint8Array without enough length.
    new Uint8Array( numberCount ),     // temporary Uint8Array with just enough length.
    new Uint8Array( numberCount * 2 ), // temporary Uint8Array with too enough length.
  ];

  let numberArray_original = new Array( numberCount );
  for ( let i = 0; i < numberCount; ++i ) {

    // Between
    // [ Float12.Constant.NegativeMinLess, Float12.Constant.PositiveMaxMore ].
    let randomFloat12
      = ( Math.random() * Float12.Constant.PositiveMaxMore * 2 )
          - Float12.Constant.PositiveMaxMore;

    numberArray_original[ i ] = randomFloat12;
  }

  let textDecoder = new TextDecoder();
  let textEncoder = new TextEncoder();

  let skipLineCount = 0;
  let suspendByteCount = 0;

  let suspendElementCountArray = [
    0,
    Math.ceil( numberCount / 3 ),
  ];

  // Progress group.
  let progressRoot = progressParent.root_get();

  let progressAggregateArrayLength
    = tempUint8ArrayArray.length * suspendElementCountArray.length;

  let progressAggregateArray = new Array( progressAggregateArrayLength );
  for ( let i = 0; i < progressAggregateArrayLength; ++i ) {
    let progressAggregate = progressAggregateArray[ i ]
      = progressParent.child_add(
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    // sub progress.
    let progressEncodeArray_original = progressAggregate.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressDecodeArray_original = progressAggregate.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressEncodeArray_again = progressAggregate.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressDecodeArray_again = progressAggregate.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  let progressAggregateArrayIndex = -1;

  // Test different temporary Uint8Array.
  for ( let i = 0; i < tempUint8ArrayArray.length; ++i ) {
    let tempUint8Array = tempUint8ArrayArray[ i ];

    // Test different suspendElementCount.
    for ( let j = 0; j < suspendElementCountArray.length; ++j ) {
      let suspendElementCount = suspendElementCountArray[ j ];

      ++progressAggregateArrayIndex;
      let progressAggregate
        = progressAggregateArray[ progressAggregateArrayIndex ];

      // sub progress.
      let progressEncodeArray_original = progressAggregate.children[ 0 ];
      let progressDecodeArray_original = progressAggregate.children[ 1 ];
      let progressEncodeArray_again = progressAggregate.children[ 2 ];
      let progressDecodeArray_again = progressAggregate.children[ 3 ];

      // Encode/Decode/Encode_again/Decode_again
      let Float12_encoded_string_original = yield*
        Float12.Encoder.generator_to_String_from_NumberArray(
          progressEncodeArray_original,
          numberArray_original, textDecoder,
          suspendElementCount,
          tempUint8Array );

      let Float12_decoded_value_array_original = yield*
        Float12.Decoder
          .Base64Char_StringOrStringArray_to_Float32Array_generator(
            progressDecodeArray_original,
            Float12_encoded_string_original, textEncoder,
            skipLineCount, suspendByteCount );

      let Float12_encoded_string_again = yield*
        Float12.Encoder.generator_to_String_from_NumberArray(
          progressEncodeArray_again,
          Float12_decoded_value_array_original, textDecoder,
          suspendElementCount,
          tempUint8Array );

      let Float12_decoded_value_array_again = yield*
        Float12.Decoder
          .Base64Char_StringOrStringArray_to_Float32Array_generator(
            progressDecodeArray_again,
            Float12_encoded_string_again, textEncoder,
            skipLineCount, suspendByteCount );
  
      // Compare
      for ( let k = 0; k < numberCount; ++k ) {
        if ( Float12_decoded_value_array_again[ k ]
               == Float12_decoded_value_array_original[ k ] )
          continue;

        throw Error( `testerFloat12EncodeDecodeArray(): `
          + `Float12_decoded_value_array_again[ ${k} ] ( `
          + `${Float12_decoded_value_array_again[ k ]} ) `

          + `should be the same as `

          + `Float12_decoded_value_array_original[ ${k} ] ( `
          + `${Float12_decoded_value_array_original[ k ]} ). `

          + `tempUint8ArrayArray[ ${i} ]=${tempUint8ArrayArray[ i ]}, `
          + `suspendElementCountArray[ ${j} ]=${suspendElementCountArray[ j ]}, `

          + `Float12_decoded_value_array_original=[ `
          + `${Float12_decoded_value_array_original} ], `

          + `Float12_encoded_string_again=\"${Float12_encoded_string_again}\", `

          + `Float12_decoded_value_array_again=[ `
          + `${Float12_decoded_value_array_again} ].`
        );
      }
    
    }
  }

  //yield progressRoot;
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "Float12 encode/decode testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressConstant = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressEncodeDecode = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressDecodeEncode = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressEncodeDecodeArray = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerFloat12Constant( progressConstant );

  // 2.
  yield *testerFloat12EncodeDecode( progressEncodeDecode );

  // 3.
  yield *testerFloat12DecodeEncode( progressDecodeEncode );

  // 4.
  yield *testerFloat12EncodeDecodeArray( progressEncodeDecodeArray );

  console.log( "Float12 encode/decode testing... Done." );
}
