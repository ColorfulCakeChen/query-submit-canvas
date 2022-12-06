export { tester };

//import * as Base64 from "../Unpacker/Base64.js";
import * as Float30 from "../Unpacker/Float30.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";


/** */
function testerConstant( progressParent ) {

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

//!!! ...unfinished... (2022/12/06)


  progressToAdvance.value_advance();
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
  yield *testerConstant( progressConstant );

  console.log( "Float30 decode testing... Done." );
}
