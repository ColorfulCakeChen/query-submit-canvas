export { tester };

//import * as Base64 from "../Unpacker/Base64.js";
import * as Float30 from "../Unpacker/Float30.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/** */
class TestCase_Float30_Constant{
  constructor( constantName, constantValue ) {
    this.name = constantName;
    this.value = constantValue;
  }
}

/** */
const Float30_Constant_Table = [
  new TestCase_Float30_Constant( "CoderExponentDigitCount", 1 ),
  new TestCase_Float30_Constant( "CoderExponentOffsetToSign", 32 ),

  new TestCase_Float30_Constant( "CoderSignificandDigitCount", 4 ),
  new TestCase_Float30_Constant( "CoderSignificandUnsignedMax", 16777215 ),
  new TestCase_Float30_Constant( "CoderSignificandOffsetToSign", 8388608 ),
  new TestCase_Float30_Constant( "CoderSignificandOffsetToSignedExponent", 6 ),

  new TestCase_Float30_Constant( "StringSignificandCharCount", 4 ),
  new TestCase_Float30_Constant( "StringExponentCharCount", 1 ),
  new TestCase_Float30_Constant( "StringCharCount", 5 ),
  new TestCase_Float30_Constant( "NextStringCharCount", 5 ),

  new TestCase_Float30_Constant( "UseExponentPositiveMax", 31 ),
  new TestCase_Float30_Constant( "UseExponentPositiveMaxMore", 32 ),

  new TestCase_Float30_Constant( "UseSignificandDigitCount", 6 ),
  new TestCase_Float30_Constant( "UseSignificandFractionDigitCount", 5 ),
  new TestCase_Float30_Constant( "UseSignificandPositiveMax", 999999 ),
  new TestCase_Float30_Constant( "UseSignificandPositiveMaxMore", 1000000 ),

  new TestCase_Float30_Constant( "UsePositiveMax", 9.99999E+31),
  new TestCase_Float30_Constant( "UsePositiveMaxMore", 1E+32 ),
  new TestCase_Float30_Constant( "UsePositiveMin", 1E-31 ),
];

/** */
function *testerFloat30Constant( progressParent ) {

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( Float30_Constant_Table.length ) );

  for ( let i = 0; i < Float30_Constant_Table.length; ++i ) {
    let testCase = Float30_Constant_Table[ i ];

//!!! (2022/12/06)
//    if ( Float30.Constant[ testCase.name ] != testCase.value )

    let delta = Math.abs( Float30.Constant[ testCase.name ] - testCase.value )
    if ( delta <= Number.EPSILON ) {
      progressToAdvance.value_advance();
      yield progressRoot;
      continue;
    }

    throw Error( `testerFloat30Constant(): `
      + `Float30.Constant.${testCase.name} ( ${Float30.Constant[ testCase.name ]} ) `
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
  console.log( "Float30 decode testing..." );

//!!! ...unfinished... (2022/12/06)

  // 0. Prepare progressParent for every TestCase.

//!!! ...unfinished... (2022/12/06)
  // for ( let i = 0; i < testCases.length; ++i ) {
  //   progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  // }

  let progressConstant
    = progressParent.child_add( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerFloat30Constant( progressConstant );

  console.log( "Float30 decode testing... Done." );
}
