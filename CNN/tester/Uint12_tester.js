export { tester };

//import * as Base64 from "../Unpacker/Base64.js";
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
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( Uint12_Constant_Table.length ) );

  for ( let i = 0; i < Uint12_Constant_Table.length; ++i ) {
    let testCase = Uint12_Constant_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta = Math.abs( Uint12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Uint12.Constant[ testCase.name ] == testCase.value ) {
      progressToAdvance.value_advance();
      yield progressRoot;
      continue;
    }

    throw Error( `testerUint12Constant(): `
      + `Uint12.Constant.${testCase.name} ( ${Uint12.Constant[ testCase.name ]} ) `
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
  console.log( "Uint12 decode testing..." );

//!!! ...unfinished... (2022/12/06)

  // 0. Prepare progressParent for every TestCase.

//!!! ...unfinished... (2022/12/06)
  // for ( let i = 0; i < testCases.length; ++i ) {
  //   progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  // }

  let progressConstant
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerUint12Constant( progressConstant );

  console.log( "Uint12 decode testing... Done." );
}
