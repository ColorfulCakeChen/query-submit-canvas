export { assert_BoundsArray };
export { assert_ScaleBoundsArray };
export { assert_ScaleBoundsArray_output0_output1 };
export { assert_BoundsArraySet_Outputs };

/**
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 *   The object used to assert number array.
 *
 * @param {FloatValue.BoundsArray} aBoundsArray
 *   The BoundsArray to be checked.
 *
 * @param {FloatValue.BoundsArray} refBoundsArray
 *   The correct BoundsArray.
 *
 * @param {string} lhsName     The name of aBoundsArray.
 * @param {string} rhsName     The name of refBoundsArray.
 * @param {string} prefixMsg   The debug text prefix error message.
 * @param {string} postfixMsg  The debug text postfix error message.
 *
 */
function assert_BoundsArray(
  asserter_Equal,
  aBoundsArray, refBoundsArray,
  lhsName, rhsName,
  prefixMsg, postfixMsg ) {

  if ( !(   (   ( aBoundsArray == null )
             && ( refBoundsArray == null ) )
         || (   ( aBoundsArray != null )
             && ( refBoundsArray != null ) ) ) )
    throw Error( `${prefixMsg}: `
      + `BoundsArraySet_Asserter.assert_BoundsArray()( `
      + `lhsName=${lhsName}, rhsName=${rhsName} ): `
      + `aBoundsArray (${aBoundsArray}) and `
      + `refBoundsArray (${refBoundsArray}) `
      + `must be both null or both non-null. ${postfixMsg}` );

  if ( ( aBoundsArray == null ) || ( refBoundsArray == null ) )
    return;

  asserter_Equal.assert_NumberArray_NumberArray(
    aBoundsArray.lowers, refBoundsArray.lowers,
    prefixMsg, `${lhsName}.lowers`, `${rhsName}.lowers`, postfixMsg
  );

  asserter_Equal.assert_NumberArray_NumberArray(
    aBoundsArray.uppers, refBoundsArray.uppers,
    prefixMsg, `${lhsName}.uppers`, `${rhsName}.uppers`, postfixMsg
  );
}

/**
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 *   The object used to assert number array.
 *
 * @param {ActivationEscaping.ScaleArraySet} aScaleArraySet
 *   The ScaleArraySet to be checked.
 *
 * @param {ActivationEscaping.ScaleArraySet} refScaleArraySet
 *   The correct ScaleArraySet.
 *
 * @param {string} lhsName     The name of aScaleArraySet.
 * @param {string} rhsName     The name of refScaleArraySet.
 * @param {string} prefixMsg   The debug text prefix error message.
 * @param {string} postfixMsg  The debug text postfix error message.
 *
 */
function assert_ScaleArraySet(
  asserter_Equal,
  aScaleArraySet, refScaleArraySet,
  lhsName, rhsName,
  prefixMsg, postfixMsg ) {

  if ( !(   (   ( aScaleArraySet == null )
             && ( refScaleArraySet == null ) )
         || (   ( aScaleArraySet != null )
             && ( refScaleArraySet != null ) ) ) )
    throw Error( `${prefixMsg}: `
      + `BoundsArraySet_Asserter.assert_ScaleArraySet()( `
      + `lhsName=${lhsName}, rhsName=${rhsName} ): `
      + `aScaleArraySet (${aScaleArraySet}) and `
      + `refScaleArraySet (${refScaleArraySet}) `
      + `must be both null or both non-null. ${postfixMsg}` );

  if ( ( aScaleArraySet == null ) || ( refScaleArraySet == null ) )
    return;

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleArraySet.do.scales, refScaleArraySet.do.scales,
    prefixMsg, `${lhsName}.do.scales`, `${rhsName}.do.scales`, postfixMsg
  );

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleArraySet.undo.scales, refScaleArraySet.undo.scales,
    prefixMsg, `${lhsName}.undo.scales`, `${rhsName}.undo.scales`, postfixMsg
  );
}

/**
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 *   The object used to assert number array.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} aScaleBoundsArray
 *   The ScaleBoundsArray to be checked.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} refScaleBoundsArray
 *   The correct ScaleBoundsArray.
 *
 * @param {string} lhsName     The name of aScaleBoundsArray.
 * @param {string} rhsName     The name of refScaleBoundsArray.
 * @param {string} prefixMsg   The debug text prefix error message.
 * @param {string} postfixMsg  The debug text postfix error message.
 *
 */
function assert_ScaleBoundsArray(
  asserter_Equal,
  aScaleBoundsArray, refScaleBoundsArray,
  lhsName, rhsName,
  prefixMsg, postfixMsg ) {

  if ( !(   (   ( aScaleBoundsArray == null )
             && ( refScaleBoundsArray == null ) )
         || (   ( aScaleBoundsArray != null )
             && ( refScaleBoundsArray != null ) ) ) )
    throw Error( `${prefixMsg}: `
      + `BoundsArraySet_Asserter.assert_ScaleBoundsArray()( `
      + `lhsName=${lhsName}, rhsName=${rhsName} ): `
      + `aScaleBoundsArray (${aScaleBoundsArray}) and `
      + `refScaleBoundsArray (${refScaleBoundsArray}) `
      + `must be both null or both non-null. ${postfixMsg}` );

  if ( ( aScaleBoundsArray == null ) || ( refScaleBoundsArray == null ) )
    return;

//!!! (2023/07/05 Remarked) Use assert_BoundsArray() instead.
//   asserter_Equal.assert_NumberArray_NumberArray(
//     aScaleBoundsArray.boundsArray.lowers,
//     refScaleBoundsArray.boundsArray.lowers,
//     prefixMsg,
//     `${lhsName}.boundsArray.lowers`, `${rhsName}.boundsArray.lowers`,
//     postfixMsg
//   );
//
//   asserter_Equal.assert_NumberArray_NumberArray(
//     aScaleBoundsArray.boundsArray.uppers,
//     refScaleBoundsArray.boundsArray.uppers,
//     prefixMsg,
//     `${lhsName}.boundsArray.uppers`, `${rhsName}.boundsArray.uppers`,
//     postfixMsg
//   );

  assert_BoundsArray( asserter_Equal,
    aScaleBoundsArray.boundsArray, refScaleBoundsArray.boundsArray,
    prefixMsg,
    `${lhsName}.boundsArray`, `${rhsName}.boundsArray`,
    postfixMsg
  );

//!!! (2023/07/06 Remarked) Use assert_ScaleArraySet() instead.
//   asserter_Equal.assert_NumberArray_NumberArray(
//     aScaleBoundsArray.scaleArraySet.do.scales,
//     refScaleBoundsArray.scaleArraySet.do.scales,
//     prefixMsg,
//     `${lhsName}.scaleArraySet.do.scales`,
//     `${rhsName}.scaleArraySet.do.scales`,
//     postfixMsg
//   );
//
//   asserter_Equal.assert_NumberArray_NumberArray(
//     aScaleBoundsArray.scaleArraySet.undo.scales,
//     refScaleBoundsArray.scaleArraySet.undo.scales,
//     prefixMsg,
//     `${lhsName}.scaleArraySet.undo.scales`,
//     `${rhsName}.scaleArraySet.undo.scales`,
//     postfixMsg
//   );

    assert_ScaleArraySet( asserter_Equal,
      aScaleBoundsArray.scaleArraySet,
      refScaleBoundsArray.scaleArraySet,
      prefixMsg,
      `${lhsName}.scaleArraySet`, `${rhsName}.scaleArraySet`,
      postfixMsg
    );
}

/**
 * Check (boundsArray and scaleArraySet):
 *   - aBoundsArraySet.output0
 *       == imageOutReferenceArray[ 0 ].boundsArraySet.output0
 *   - aBoundsArraySet.output1
 *       == imageOutReferenceArray[ 1 ].boundsArraySet.output0
 *       (if imageOutReferenceArray[ 1 ] exists)
 *
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 *   The object used to assert number array.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} output0_scaleBoundsArray
 *   The output0's ScaleBoundsArray to be checked.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} output1_scaleBoundsArray
 *   The output1's ScaleBoundsArray to be checked. It could be null.
 *
 * @param {NumberImage.Base[]} imageOutReferenceArray
 *   Reference output Image data.
 *
 * @param {string} prefixMsg
 *   The text to be displayed at the beginning when comparison failed.
 *
 * @param {string} postfixMsg
 *   The text to be displayed at the tail when comparison failed.
 */
function assert_ScaleBoundsArray_output0_output1( asserter_Equal,
  output0_scaleBoundsArray, output1_scaleBoundsArray,
  imageOutReferenceArray, prefixMsg, postfixMsg ) {

  assert_ScaleBoundsArray( asserter_Equal,
    output0_scaleBoundsArray,
    imageOutReferenceArray[ 0 ].boundsArraySet.output0,
    "output0", "output0_Ref", prefixMsg, postfixMsg );

  if ( output1_scaleBoundsArray ) {
    assert_ScaleBoundsArray( asserter_Equal,
      output1_scaleBoundsArray,
      imageOutReferenceArray[ 1 ].boundsArraySet.output0,
      "output1", "output1_ref", prefixMsg, postfixMsg );
  }
}

/**
 * Check (boundsArray and scaleArraySet):
 *   - aBoundsArraySet.output0
 *       == imageOutReferenceArray[ 0 ].boundsArraySet.output0
 *   - aBoundsArraySet.output1
 *       == imageOutReferenceArray[ 1 ].boundsArraySet.output0
 *       (if imageOutReferenceArray[ 1 ] exists)
 *
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 *   The object used to assert number array.
 *
 * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet
 *   The bounds array set to be asserted.
 *
 * @param {NumberImage.Base[]} imageOutReferenceArray
 *   Reference output Image data.
 *
 * @param {string} prefixMsg
 *   The text to be displayed at the beginning when comparison failed.
 *
 * @param {string} postfixMsg
 *   The text to be displayed at the tail when comparison failed.
 */
function assert_BoundsArraySet_Outputs( asserter_Equal,
  aBoundsArraySet, imageOutReferenceArray,
  prefixMsg, postfixMsg ) {
  assert_ScaleBoundsArray_ScaleBoundsArray(
    aBoundsArraySet.output0, aBoundsArraySet.output1,
    imageOutReferenceArray, prefixMsg, postfixMsg );
}
