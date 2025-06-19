export { tester };

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

  assert_PropertyProperty_Value(
    strThisPropertyName, strThisPropertyPropertyName, rhsValue ) {
    let thisValue = this[ strThisPropertyName ][ strThisPropertyPropertyName ];

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
        // Force to non-zero. (Note: undoScaleTranslate does not work for zero
        // scale.)
        scale = 0.05;
      }

      // Random scale-translate.
      let aScaleTranslate = new FloatValue.ScaleTranslate(
        scale, RandTools.getRandomIntInclusive( -10, +10 ) );

      let undoScaleTranslate = new FloatValue.ScaleTranslate();
      undoScaleTranslate.set_byUndo_ScaleTranslate( aScaleTranslate );

      if (   ( Number.isNaN( undoScaleTranslate.scale ) )
          || ( Number.isNaN( undoScaleTranslate.translate ) ) ) {
        debugger;
      }

      let originalValue = RandTools.getRandomIntInclusive( -10, +10 );

      let changedValue
        = ( originalValue * aScaleTranslate.scale )
            + aScaleTranslate.translate;

      this.undoTest = {
        undoChangedValue:
          ( changedValue * undoScaleTranslate.scale )
            + undoScaleTranslate.translate
      };

      this.assert_PropertyProperty_Value(
        "undoTest", "undoChangedValue", originalValue );
    }

    { // Test ScaleArray.set_one_byUndo_N().
      let arrayLength = RandTools.getRandomIntInclusive( 1, 5 );

      // Set up random scales.
      let aScaleArray
        = FloatValue.ScaleArray.Pool.get_or_create_by( arrayLength );
      {
        for ( let i = 0; i < arrayLength; ++i ) {
          let scale = RandTools.getRandomIntInclusive( -10, +10 );
          if ( 0 == scale ) {
            // Force to non-zero. (Note: undoScaleTranslate does not work for
            // zero scale.)
            scale = 0.05;
          }

          aScaleArray.set_one_byN( i, scale );
        }
      }

      let undoScaleArray
        = FloatValue.ScaleArray.Pool.get_or_create_by( arrayLength );

      { // Test .set_all_byUndo_ScaleArray() and .set_one_byUndo_N()

        // Test .set_all_byUndo_ScaleArray()
        undoScaleArray.set_all_byUndo_ScaleArray( aScaleArray );

        // Test .set_one_byUndo_N()
        let indexRand
          = RandTools.getRandomIntInclusive( 0, ( arrayLength - 1 ) );

        undoScaleArray.set_one_byUndo_N(
          indexRand, aScaleArray.scales[ indexRand ] );

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
          this.undoTest.undoChangedValue
            = ( changedValue * undoScaleArray.scales[ i ] );

          this.assert_PropertyProperty_Value(
            "undoTest", "undoChangedValue", originalValue );
        }
      }

      undoScaleArray.disposeResources_and_recycleToPool();
      undoScaleArray = null;

      aScaleArray.disposeResources_and_recycleToPool();
      aScaleArray = null;
    }

    this.disposeResources();
  }

  /** @override */
  disposeResources() {
//     ??this.asserter_Equal.disposeResources_and_recycleToPool();
//     this.asserter_Equal = null;

    super.disposeResources();
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

}
