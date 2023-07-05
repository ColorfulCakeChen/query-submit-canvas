export { tester };

import * as Base64 from "../Unpacker/Base64.js";
import * as Uint12 from "../Unpacker/Uint12.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/** */
class TestCase_Uint12_Constant{
  constructor( constantName, constantValue ) {
    this.name = constantName;
    this.value = constantValue;
  }
}

/** */
const Uint12_Constant_Table = [
  new TestCase_Uint12_Constant( "CoderLeastSignificantBitCount", 6 ),
  new TestCase_Uint12_Constant( "CoderLeastSignificantBitmask", 63 ),

  new TestCase_Uint12_Constant( "CoderMostSignificantBitCount", 6 ),
  new TestCase_Uint12_Constant( "CoderMostSignificantBitmask", 63 ),
  new TestCase_Uint12_Constant( "CoderMostSignificantBitmaskLShiftCount", 6 ),
  new TestCase_Uint12_Constant( "CoderMostSignificantBitmaskLShifted", 4032 ),

  new TestCase_Uint12_Constant( "CoderBitCount", 12),
  new TestCase_Uint12_Constant( "UnsignedMin", 0 ),
  new TestCase_Uint12_Constant( "UnsignedMax", 4095 ),

  new TestCase_Uint12_Constant( "StringCharCount", 2 ),
  new TestCase_Uint12_Constant( "NextStringCharCount", 2 ),
];

/** */
function *testerUint12Constant( progressParent ) {

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  for ( let i = 0; i < Uint12_Constant_Table.length; ++i ) {
    let testCase = Uint12_Constant_Table[ i ];

    if ( Uint12.Constant[ testCase.name ] == testCase.value ) {
      continue;
    }

    throw Error( `testerUint12Constant(): `
      + `Uint12.Constant.${testCase.name} `
      + `( ${Uint12.Constant[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerUint12EncodeDecode( progressParent ) {

  let testCaseCount = ( 2 ** 12 ); // 4096

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  for ( let i = 0; i < testCaseCount; ++i ) {

    let Uint12_encoded_string = Uint12.Encoder.to_String( i );

    let Uint12_decoded_value
      = Uint12.Decoder.from_String( Uint12_encoded_string );

    if ( Uint12_decoded_value === i ) {
      continue;
    }

    throw Error( `testerUint12EncodeDecode(): `
      + `( ${i} ) encoded as ( \"${Uint12_encoded_string}\" ), `
      + `decoded as ( ${Uint12_decoded_value} ) `
      + `should be the same as original.`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerUint12DecodeEncode( progressParent ) {

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

      let Uint12_original_string =
         Base64.Constant.EncodeTable_Uint6_to_Char[ i ]
       + Base64.Constant.EncodeTable_Uint6_to_Char[ j ];

      let Uint12_decoded_value
        = Uint12.Decoder.from_String( Uint12_original_string );

      let Uint12_encoded_string
        = Uint12.Encoder.to_String( Uint12_decoded_value );

      if ( Uint12_encoded_string == Uint12_original_string ) {
        continue;
      }

      throw Error( `testerUint12DecodeEncode(): `
        + `( \"${Uint12_original_string}\" ) decoded as `
        + `( ${Uint12_decoded_value} ), `
        + `encoded as ( \"${Uint12_encoded_string}\" ) `
        + `should be the same as original.`
      );
    }
  }

  progressToAdvance.value_advance();
  yield progressRoot;
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
  console.log( "Uint12 encode/decode testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressConstant = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressEncodeDecode = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressDecodeEncode = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerUint12Constant( progressConstant );

  // 2.
  yield *testerUint12EncodeDecode( progressEncodeDecode );

  // 3.
  yield *testerUint12DecodeEncode( progressDecodeEncode );

  console.log( "Uint12 encode/decode testing... Done." );
}
