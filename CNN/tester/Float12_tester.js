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

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "Float12 decode testing..." );

//!!! ...unfinished... (2022/12/06)

  // 0. Prepare progressParent for every TestCase.

//!!! ...unfinished... (2022/12/06)
  // for ( let i = 0; i < testCases.length; ++i ) {
  //   progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  // }

  let progressConstant
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerFloat12Constant( progressConstant );

  console.log( "Float12 decode testing... Done." );
}
