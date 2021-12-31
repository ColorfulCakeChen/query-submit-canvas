export { testCorrectness };

import * as RandTools from "../util/RandTools.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 * Test ScaleTranslate.
 */
class Base {

  assert_PropertyProperty_Value( strThisPropertyName, strThisPropertyPropertyName, rhsValue ) {
    let thisValue = this[ strThisPropertyName ][ strThisPropertyPropertyName ];
    tf.util.assert( thisValue == rhsValue, `jsPerf_FloatValue_ScaleTranslate.testCorrectness(): `
      + `this.${strThisPropertyName}.${strThisPropertyPropertyName} ( ${thisValue} ) should be ( ${rhsValue} ).` );
  }

}

/**
 * Test ScaleTranslate.
 */
class Case extends Base {

  constructor() {

    { // Test setBy_undoScaleTranslate().
      let aScaleTranslate = new FloatValue.ScaleTranslate(
        RandTools.getRandomIntInclusive( -10, +10 ), RandTools.getRandomIntInclusive( -10, +10 ) ); // Random scale-translate.

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
