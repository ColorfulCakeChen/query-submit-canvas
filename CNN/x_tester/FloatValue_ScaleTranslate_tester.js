export { tester };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as FloatValue from "../Unpacker/FloatValue.js";
import * as Weights from "../Unpacker/Weights.js";
import * as Block from "../Conv/Block.js";

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


/** */
function *testerCases( progressParent ) {
  const funcNameInMessage = "testerCases";

  let testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  let casesArray = [
    new Cases( [
      new Case(),
    ] ),
  ];

  progressToAdvance.value_advance();
  yield progressRoot;
}


/** */
function *tester_Weights_Float32Array_RestrictedClone( progressParent ) {
  const funcNameInMessage = "tester_Weights_Float32Array_RestrictedClone";

  let testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );


  let inputArray = new Float32Array( [
    undefined, null, "", "A", "2", Number.NaN,
    Number.NEGATIVE_INFINITY,
          -Math.pow( 2, +25 ), -Math.pow( 2, +24 ), -Math.pow( 2, +23 ),
          -Math.pow( 2, -23 ), -Math.pow( 2, -24 ), -Math.pow( 2, -25 ),
                            0,
          +Math.pow( 2, -25 ), +Math.pow( 2, -24 ), +Math.pow( 2, -23 ),
          +Math.pow( 2, +23 ), +Math.pow( 2, +24 ), +Math.pow( 2, +25 ),
    Number.POSITIVE_INFINITY,
  ] );

  const POSITIVE_MAX = Weights.Base.ValueBounds.upper;
  const NEGATIVE_MIN = Weights.Base.ValueBounds.lower;

  let verifyArray = new Float32Array( [
    0, 0, 0, 0, 2, 0,
      NEGATIVE_MIN,
      NEGATIVE_MIN,  NEGATIVE_MIN, -( 2 ** +23 ),
    -( 2 ** -23 ), -( 2 ** -24 ), -( 2 ** -25 ),
                0,
    +( 2 ** -25 ), +( 2 ** -24 ), +( 2 ** -23 ),
    +( 2 ** +23 ),  POSITIVE_MAX,  POSITIVE_MAX,
      POSITIVE_MAX,
  ] );

  let outputArray
    = Weights.Base.ValueBounds.Float32Array_RestrictedClone( inputArray );

  if ( inputArray.length != outputArray.length )
    throw Error( `${funcNameInMessage}(): `
      + `inputArray.length ( ${inputArray.length} ) `
      + `should be the same as outputArray.length ( ${outputArray.length} ).`
    );

  for ( let i = 0; i < inputArray.length; ++i ) {
    let inputElement = inputArray[ i ];
    let verifyElement = verifyArray[ i ];
    let outputElement = outputArray[ i ];

    if ( outputElement !== verifyElement )
      throw Error( `${funcNameInMessage}(): `
        + `Weights.Base.ValueBounds.Float32Array_RestrictedClone( `
        + `inputArray[ ${i} ] = ${inputElement} ) `
        + `should be ( ${verifyElement} ) but got `
        + `( ${outputElement} ).`
      );

    let outputElementSingle
      = Weights.Base.ValueBounds.clamp_or_zeroIfNaN( inputElement );

    if ( outputElementSingle !== verifyElement )
      throw Error( `${funcNameInMessage}(): `
        + `Weights.Base.ValueBounds.clamp_or_zeroIfNaN( `
        + `inputArray[ ${i} ] = ${inputElement} ) `
        + `should be ( ${verifyElement} ) but got `
        + `( ${outputElementSingle} ).`
      );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *tester_ValueRange_valueInputOutputGenerator( progressParent ) {
  const funcNameInMessage = "tester_ValueRange_valueInputOutputGenerator";

  let testCaseCount = 2;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );


  let valuePair = {};

  // Test ValueRange.Bool().valueInputOutputGenerator().
  {
    let paramDesc = Block.Params.bKeepInputTensor;

    for ( let offsetMultiplier = -100;
      offsetMultiplier <= +100; ++offsetMultiplier ) {

      for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator(
        valuePair, offsetMultiplier ) ) {

        let adjustedInput
          = paramDesc.valueDesc.range.adjust( pair.valueInput );

        if ( adjustedInput != pair.valueOutput )
          throw Error( `${funcNameInMessage}(): `
            + `ValueRange.Bool()`
            + `.valueInputOutputGenerator( ${offsetMultiplier} ): `
            + `this.adjust( ${pair.valueInput} ) return `
            + `( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
      }
    }
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  // Test ValueRange.Int().valueInputOutputGenerator().
  {
    let paramDesc = Block.Params.pointwise20ChannelCount;

    for ( let offsetMultiplier = -10;
      offsetMultiplier <= +10; ++offsetMultiplier ) {
      
      let valueOutMinMax;
      {
        let dice = Math.random();
        if ( dice < 0.5 ) {
          valueOutMinMax = [
            RandTools.getRandomIntInclusive(
              paramDesc.valueDesc.range.min,
              paramDesc.valueDesc.range.max ),
            RandTools.getRandomIntInclusive(
              paramDesc.valueDesc.range.min,
              paramDesc.valueDesc.range.max ),
          ];
        }
      }

      for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator(
        valuePair, offsetMultiplier, valueOutMinMax ) ) {

        let adjustedInput
          = paramDesc.valueDesc.range.adjust( pair.valueInput );

        if ( adjustedInput != pair.valueOutput )
          throw Error( `${funcNameInMessage}(): `
            + `ValueRange.Int( `
            + `${paramDesc.min}, ${paramDesc.max} )`
            + `.valueInputOutputGenerator( ${offsetMultiplier} ): `
            + `this.adjust( ${pair.valueInput} ) return `
            + `( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
      }
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
  console.log( "FloatValue_ScaleTranslate testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressCases = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_Weights_Float32Array_RestrictedClone = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_ValueRange_valueInputOutputGenerator = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerCases( progressCases );

  // 2.
  yield *tester_Weights_Float32Array_RestrictedClone(
    progress_Weights_Float32Array_RestrictedClone );

  // 3.
  yield *tester_ValueRange_valueInputOutputGenerator(
    progress_ValueRange_valueInputOutputGenerator );

  console.log( "FloatValue_ScaleTranslate testing... Done." );
}
