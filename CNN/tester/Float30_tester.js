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
  new TestCase_Float30_Constant( "CoderExponentDigitCount", ),
  new TestCase_Float30_Constant( "CoderExponentOffsetToSign", ),
  new TestCase_Float30_Constant( "CoderSignificandDigitCount", ),
  new TestCase_Float30_Constant( "CoderSignificandUnsignedMax", ),
  new TestCase_Float30_Constant( "CoderSignificandOffsetToSign", ),
  new TestCase_Float30_Constant( "CoderSignificandOffsetToSignedExponent", ),

  new TestCase_Float30_Constant( "StringSignificandCharCount", ),
  new TestCase_Float30_Constant( "StringExponentCharCount", ),
  new TestCase_Float30_Constant( "StringCharCount", ),
  new TestCase_Float30_Constant( "NextStringCharCount", ),

  new TestCase_Float30_Constant( "UseExponentPositiveMax", ),
  new TestCase_Float30_Constant( "UseExponentPositiveMaxMore", ),

  new TestCase_Float30_Constant( "UseSignificandDigitCount", ),
  new TestCase_Float30_Constant( "UseSignificandFractionDigitCount", ),
  new TestCase_Float30_Constant( "UseSignificandPositiveMax", ),
  new TestCase_Float30_Constant( "UseSignificandPositiveMaxMore", ),

  new TestCase_Float30_Constant( "UsePositiveMax", ),
  new TestCase_Float30_Constant( "UsePositiveMaxMore", ),
  new TestCase_Float30_Constant( "UsePositiveMin", ),
];

/** */
function *testerFloat30Constant( progressParent ) {

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( Float30_Constant_Table.length ) );

  for ( let i = 0; i < Float30_Constant_Table.length; ++i ) {
    let testCase = Float30_Constant_Table[ i ];
    if ( Float30.Constant[ testCase.name ] != testCase.value )
      throw Error( `testerFloat30Constant(): `
        + `Float30.Constant${testCase.name} ( ${Float30.Constant[ testCase.name ]} ) `
        + `should be ( ${testCase.value} ).`
      );

    progressToAdvance.value_advance();
    yield progressRoot;
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
