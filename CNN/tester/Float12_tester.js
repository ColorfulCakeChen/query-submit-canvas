export { tester };

import * as Base64 from "../Unpacker/Base64.js";
import * as Float12 from "../Unpacker/Float12.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

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

  new TestCase_Float12_Constant( "ImplicitLShiftCount", 5 ),
  new TestCase_Float12_Constant( "ImplicitLShifted", 32 ),

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

  new TestCase_Float12_Constant( "SignificandBitCount", 5 ),
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

  new TestCase_Float12_Constant( "PositiveMin", 2.4010660126805300E-010 ),
  new TestCase_Float12_Constant( "PositiveMinLess", 2.3283064365387000E-010 ),
];

/** */
const Float12_EncodeDecode_Table = [
  new TestCase_Float12_EncodeDecode( 0, 0 ),
  new TestCase_Float12_EncodeDecode( -0, 0 ),


  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMin, Float12.Constant.NegativeMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMinLess, Float12.Constant.NegativeMin ),

  new TestCase_Float12_EncodeDecode(
    Float12.Constant.NegativeMin - 1, Float12.Constant.NegativeMin ),


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
];

/** */
function *testerFloat12Constant( progressParent ) {

  let testCaseCount
    = Float12_Constant_Coder_Table.length + Float12_Constant_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  // 1.
  for ( let i = 0; i < Float12_Constant_Coder_Table.length; ++i ) {
    let testCase = Float12_Constant_Coder_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant.Coder[ testCase.name ] == testCase.value ) {
      progressToAdvance.value_advance();
      yield progressRoot;
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.Coder.${testCase.name} `
      + `( ${Float12.Constant.Coder[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  // 2.
  for ( let i = 0; i < Float12_Constant_Table.length; ++i ) {
    let testCase = Float12_Constant_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant[ testCase.name ] == testCase.value ) {
      progressToAdvance.value_advance();
      yield progressRoot;
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.${testCase.name} ( ${Float12.Constant[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }
}

/** */
function *testerFloat12EncodeDecode( progressParent ) {

  let testCaseCount = Float12_EncodeDecode_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  for ( let i = 0; i < Float12_EncodeDecode_Table.length; ++i ) {
    let testCase = Float12_EncodeDecode_Table[ i ];

    let Float12_encoded_string = Float12.Encoder.ToString( testCase.originalValue );
    let Float12_decoded_value = Float12.Decoder.FromString( Float12_encoded_string );

    if ( Float12_decoded_value === testCase.decodedValue ) {
      progressToAdvance.value_advance();
      yield progressRoot;
      continue;
    }

    throw Error( `testerFlot12EncodeDecode(): `
      + `( ${testCase.originalValue} ) encoded as ( \"${Float12_encoded_string}\" ), `
      + `decoded as ( ${Float12_decoded_value} ) `
      + `should be ( ${testCase.decodedValue} ).`
    );
  }
}

/** */
function *testerFloat12DecodeEncode( progressParent ) {

  let testCaseCount
    = Base64.Constant.EncodeTable_Uint6_to_Char.length
        * Base64.Constant.EncodeTable_Uint6_to_Char.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  for ( let i = 0; i < Base64.Constant.EncodeTable_Uint6_to_Char.length; ++i ) {
    for ( let j = 0; j < Base64.Constant.EncodeTable_Uint6_to_Char.length; ++j ) {

      let Float12_original_string =
         Base64.Constant.EncodeTable_Uint6_to_Char[ i ]
       + Base64.Constant.EncodeTable_Uint6_to_Char[ j ];

      let Float12_decoded_value = Float12.Decoder.FromString( Float12_original_string );
      let Float12_encoded_string = Float12.Encoder.ToString( Float12_decoded_value );

      if ( Float12_encoded_string == Float12_original_string ) {
        progressToAdvance.value_advance();
        yield progressRoot;
        continue;
      }

      throw Error( `testerFloat12DecodeEncode(): `
        + `( \"${Float12_original_string}\" ) decoded as ( ${Float12_decoded_value} ), `
        + `encoded as ( \"${Float12_encoded_string}\" ) `
        + `should be the same as original.`
      );
    }
  }
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "Float12 encode/decode testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressConstant
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressEncodeDecode
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressDecodeEncode
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerFloat12Constant( progressConstant );

  // 2.
  yield *testerFloat12DecodeEncode( progressEncodeDecode );

  // 3.
  yield *testerFloat12DecodeEncode( progressDecodeEncode );

  console.log( "Float12 encode/decode testing... Done." );
}
