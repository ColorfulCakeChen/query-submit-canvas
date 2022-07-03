export { testCorrectness };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 * Test ScaleTranslate.
 */
class Base {

  constructor() {
    this.asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by();
  }

  assert_PropertyProperty_Value( strThisPropertyName, strThisPropertyPropertyName, rhsValue ) {
    let thisValue = this[ strThisPropertyName ][ strThisPropertyPropertyName ];

//!!! (2021/12/31 Remarked)
//     if ( thisValue != rhsValue )
//       throw Error( `jsPerf_FloatValue_ScaleTranslate.testCorrectness(): `
//       + `this.${strThisPropertyName}.${strThisPropertyPropertyName} ( ${thisValue} ) should be ( ${rhsValue} ).` );

    this.asserter_Equal.assert_Number_Number( thisValue, rhsValue,
      `jsPerf_FloatValue_ScaleTranslate.testCorrectness(): this.`, // prefixMsg,
      `${strThisPropertyName}.${strThisPropertyPropertyName}`, // lhsNumberName,
      ``, // rhsNumberName,
      ``  // postfixMsg
    );
  }

  /**  */
  disposeResources() {
    this.asserter_Equal.disposeResources_and_recycleToPool();
    this.asserter_Equal = null;
  }

}


/**
 * Test ScaleTranslate.
 */
class Case extends Base {

  constructor() {
    super();

    { // Test ScaleTranslate.setBy_undoScaleTranslate().
      let scale = RandTools.getRandomIntInclusive( -10, +10 );
      if ( 0 == scale ) {
        scale = 0.05;  // Force to non-zero. (Note: undoScaleTranslate does not work for zero scale.)
      }

      let aScaleTranslate = new FloatValue.ScaleTranslate( scale, RandTools.getRandomIntInclusive( -10, +10 ) ); // Random scale-translate.

      let undoScaleTranslate = new FloatValue.ScaleTranslate();
      undoScaleTranslate.set_byUndo_ScaleTranslate( aScaleTranslate );

      if ( Number.isNaN( undoScaleTranslate.scale ) || Number.isNaN( undoScaleTranslate.translate ) ) {
        debugger;
      }

      let originalValue = RandTools.getRandomIntInclusive( -10, +10 );
      let changedValue = ( originalValue * aScaleTranslate.scale ) + aScaleTranslate.translate;
      this.undoTest = {
        undoChangedValue: ( changedValue * undoScaleTranslate.scale ) + undoScaleTranslate.translate
      };

      this.assert_PropertyProperty_Value( "undoTest", "undoChangedValue", originalValue );
    }

    { // Test ScaleArray.set_one_byUndo_N().
      let arrayLength = RandTools.getRandomIntInclusive( 1, 5 );

      let aScaleArray = new FloatValue.ScaleArray( arrayLength ); // Set up random scales.
      {
        for ( let i = 0; i < arrayLength; ++i ) {
          let scale = RandTools.getRandomIntInclusive( -10, +10 );
          if ( 0 == scale ) {
            scale = 0.05;  // Force to non-zero. (Note: undoScaleTranslate does not work for zero scale.)
          }

          aScaleArray.set_one_byN( i, scale );
        }
      }

      let undoScaleArray = new FloatValue.ScaleArray( arrayLength );

      { // Test .set_all_byUndo_ScaleArray() and .set_one_byUndo_N()

        // Test .set_all_byUndo_ScaleArray()
        undoScaleArray.set_all_byUndo_ScaleArray( aScaleArray );

        // Test .set_one_byUndo_N()
        let indexRand = RandTools.getRandomIntInclusive( 0, ( arrayLength - 1 ) );
        undoScaleArray.set_one_byUndo_N( indexRand, aScaleArray.scales[ indexRand ] );

        // Verify
        this.undoTest = {
          undoChangedValue: undefined
        };

        for ( let i = 0; i < arrayLength; ++i ) {

          if ( Number.isNaN( undoScaleArray.scales[ i ] ) ) {
            debugger;
          }

          let originalValue = RandTools.getRandomIntInclusive( -10, +10 );
          let changedValue = ( originalValue * aScaleArray.scales[ i ] );
          this.undoTest.undoChangedValue = ( changedValue * undoScaleArray.scales[ i ] );

          this.assert_PropertyProperty_Value( "undoTest", "undoChangedValue", originalValue );
        }
      }
    }

    this.disposeResources();
  }

}


/**
 * Test ScaleTranslateArray.
 */
class Cases extends Base {

  constructor() {
    super();

    this.disposeResources();
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
