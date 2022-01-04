export { testCorrectness };

import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 * Test ScaleTranslate.
 */
class Base {

  constructor() {
    this.asserter_Equal = new TensorTools.Asserter_Equal();
  }

  assert_PropertyProperty_Value( strThisPropertyName, strThisPropertyPropertyName, rhsValue ) {
    let thisValue = this[ strThisPropertyName ][ strThisPropertyPropertyName ];

//!!! (2021/12/31 Remarked)
//     tf.util.assert( thisValue == rhsValue, `jsPerf_FloatValue_ScaleTranslate.testCorrectness(): `
//       + `this.${strThisPropertyName}.${strThisPropertyPropertyName} ( ${thisValue} ) should be ( ${rhsValue} ).` );

    this.assert_Number_Number( thisValue, rhsValue,
      `jsPerf_FloatValue_ScaleTranslate.testCorrectness(): this.`, // prefixMsg,
      `${strThisPropertyName}.${strThisPropertyPropertyName}`, // lhsNumberName,
      ``, // rhsNumberName,
      ``  // postfixMsg
    );
  }

}

/**
 * Test ScaleTranslate.
 */
class Case extends Base {

  constructor() {
    super();

    { // Test setBy_undoScaleTranslate().
      let scale = RandTools.getRandomIntInclusive( -10, +10 ); // 
      scale = Math.sign( scale ) * ( Math.abs( scale ) + 0.05 );  // Force to non-zero. (Note: undoScaleTranslate does not work for zero.)

      let aScaleTranslate = new FloatValue.ScaleTranslate( scale, RandTools.getRandomIntInclusive( -10, +10 ) ); // Random scale-translate.

      let undoScaleTranslate = new FloatValue.ScaleTranslate();
      undoScaleTranslate.setBy_undoScaleTranslate( aScaleTranslate );

      let originalValue = RandTools.getRandomIntInclusive( -10, +10 );
      let changedValue = ( originalValue * aScaleTranslate.scale ) + aScaleTranslate.translate;
      this.undoTest = {
        undoChangedValue: ( changedValue * undoScaleTranslate.scale ) + undoScaleTranslate.translate
      };

      this.assert_PropertyProperty_Value( "undoTest", "undoChangedValue", originalValue );
    }
  }

}

/**
 * Test ScaleTranslateArray.
 */
class Cases extends Base {

  constructor() {
    super();

  }

}

function testCorrectness() {
  let casesArray = [
    new Cases( [
      new Case(),
    ] ),
  ];

//!!! ...unfinished... (2021/12/31)

//   let casesArray = [
//     new Cases( [
//       new Case( [  1,  2 ], [  3,  4 ],  5, [  4,  6 ], [  3,  8 ], [   5,  10 ] ),
//       new Case( [ -1,  2 ], [  3,  4 ],  5, [  2,  6 ], [ -4,  8 ], [  -5,  10 ] ),
//       new Case( [  1, -2 ], [  3,  4 ],  5, [  1,  5 ], [ -8,  4 ], [ -10,   5 ] ),
//       new Case( [ -1, -2 ], [  3,  4 ],  5, [  1,  3 ], [ -8, -3 ], [ -10,  -5 ] ),
//     ] ),

//     new Cases( [
//       new Case( [  1,  2 ], [ -3,  4 ], -5, [ -2,  6 ], [ -6,  8 ], [ -10,  -5 ] ),
//       new Case( [ -1,  2 ], [ -3,  4 ], -5, [ -4,  6 ], [ -6,  8 ], [ -10,   5 ] ),
//       new Case( [  1, -2 ], [ -3,  4 ], -5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
//       new Case( [ -1, -2 ], [ -3,  4 ], -5, [ -5,  3 ], [ -8,  6 ], [   5,  10 ] ),
//     ] ),

//     new Cases( [
//       new Case( [  1,  2 ], [  3, -4 ],  5, [ -3,  5 ], [ -8,  6 ], [   5,  10 ] ),
//       new Case( [ -1,  2 ], [  3, -4 ],  5, [ -5,  5 ], [ -8,  6 ], [  -5,  10 ] ),
//       new Case( [  1, -2 ], [  3, -4 ],  5, [ -6,  4 ], [ -6,  8 ], [ -10,   5 ] ),
//       new Case( [ -1, -2 ], [  3, -4 ],  5, [ -6,  2 ], [ -6,  8 ], [ -10,  -5 ] ),
//     ] ),

//     new Cases( [
//       new Case( [  1,  2 ], [ -3, -4 ], -5, [ -3, -1 ], [ -8, -3 ], [ -10,  -5 ] ),
//       new Case( [ -1,  2 ], [ -3, -4 ], -5, [ -5, -1 ], [ -8,  4 ], [ -10,   5 ] ),
//       new Case( [  1, -2 ], [ -3, -4 ], -5, [ -6, -2 ], [ -4,  8 ], [  -5,  10 ] ),
//       new Case( [ -1, -2 ], [ -3, -4 ], -5, [ -6, -4 ], [  3,  8 ], [   5,  10 ] ),
//     ] ),
//   ];

}
