export { assert_ScaleBoundsArray };
export { assert_ScaleBoundsArray_output0_output1 };
export { assert_BoundsArraySet_Outputs };

/**
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal                The object used to assert number array.
 * @param {ActivationEscaping.ScaleBoundsArray} aScaleBoundsArray    The ScaleBoundsArray to be checked.
 * @param {ActivationEscaping.ScaleBoundsArray} refScaleBoundsArray  The correct ScaleBoundsArray.
 *
 * @param {string} lhsName     The name of aScaleBoundsArray.
 * @param {string} rhsName     The name of refScaleBoundsArray.
 * @param {string} prefixMsg   The debug text prefix error message.
 * @param {string} postfixMsg  The debug text postfix error message.
 *
 */
function assert_ScaleBoundsArray( asserter_Equal, aScaleBoundsArray, refScaleBoundsArray, lhsName, rhsName, prefixMsg, postfixMsg ) {

  if ( !(   ( ( aScaleBoundsArray == null ) && ( refScaleBoundsArray == null ) )
         || ( ( aScaleBoundsArray != null ) && ( refScaleBoundsArray != null ) ) ) )
    throw Error( `${prefixMsg}: BoundsArraySet_Asserter.assert_ScaleBoundsArray()( `
      + `lhsName=${lhsName}, rhsName=${rhsName} ): `
      + `aScaleBoundsArray (${aScaleBoundsArray}) and refScaleBoundsArray (${refScaleBoundsArray}) `
      + `must both null or both non-null. ${postfixMsg}` );

  if ( ( aScaleBoundsArray == null ) || ( refScaleBoundsArray == null ) )
    return;

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleBoundsArray.boundsArray.lowers, refScaleBoundsArray.boundsArray.lowers,
    prefixMsg, `${lhsName}.boundsArray.lowers`, `${rhsName}.boundsArray.lowers`, postfixMsg
  );

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleBoundsArray.boundsArray.uppers, refScaleBoundsArray.boundsArray.uppers,
    prefixMsg, `${lhsName}.boundsArray.uppers`, `${rhsName}.boundsArray.uppers`, postfixMsg
  );

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleBoundsArray.scaleArraySet.do.scales, refScaleBoundsArray.scaleArraySet.do.scales,
    prefixMsg, `${lhsName}.scaleArraySet.do.scales`, `${rhsName}.scaleArraySet.do.scales`, postfixMsg
  );

  asserter_Equal.assert_NumberArray_NumberArray(
    aScaleBoundsArray.scaleArraySet.undo.scales, refScaleBoundsArray.scaleArraySet.undo.scales,
    prefixMsg, `${lhsName}.scaleArraySet.undo.scales`, `${rhsName}.scaleArraySet.undo.scales`, postfixMsg
  );
}

/**
 * Check (boundsArray and scaleArraySet):
 *   - aBoundsArraySet.output0 == imageOutReferenceArray[ 0 ].boundsArraySet.output0
 *   - aBoundsArraySet.output1 == imageOutReferenceArray[ 1 ].boundsArraySet.output0 (if imageOutReferenceArray[ 1 ] exists)
 *
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal     The object used to assert number array.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} output0_scaleBoundsArray  The output0's ScaleBoundsArray to be checked.
 * @param {ActivationEscaping.ScaleBoundsArray} output1_scaleBoundsArray  The output1's ScaleBoundsArray to be checked. It could be null.
 *
 * @param {NumberImage.Base[]} imageOutReferenceArray     Refernece output Image data.
 *
 * @param {string} prefixMsg
 *   The text to be displayed at the beginning when comparison failed.
 *
 * @param {string} postfixMsg
 *   The text to be displayed at the tail when comparison failed.
 */
function assert_ScaleBoundsArray_output0_output1( asserter_Equal,
  output0_scaleBoundsArray, output1_scaleBoundsArray, imageOutReferenceArray, prefixMsg, postfixMsg ) {

  assert_ScaleBoundsArray( asserter_Equal, output0_scaleBoundsArray, imageOutReferenceArray[ 0 ].boundsArraySet.output0,
    "output0", "output0_Ref", prefixMsg, postfixMsg );

  if ( output1_scaleBoundsArray ) {
    assert_ScaleBoundsArray( asserter_Equal, output1_scaleBoundsArray, imageOutReferenceArray[ 1 ].boundsArraySet.output0,
      "output1", "output1_ref", prefixMsg, postfixMsg );
  }
}

/**
 * Check (boundsArray and scaleArraySet):
 *   - aBoundsArraySet.output0 == imageOutReferenceArray[ 0 ].boundsArraySet.output0
 *   - aBoundsArraySet.output1 == imageOutReferenceArray[ 1 ].boundsArraySet.output0 (if imageOutReferenceArray[ 1 ] exists)
 *
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal     The object used to assert number array.
 * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet  The bounds array set to be asserted.
 * @param {NumberImage.Base[]} imageOutReferenceArray     Refernece output Image data.
 *
 * @param {string} prefixMsg
 *   The text to be displayed at the beginning when comparison failed.
 *
 * @param {string} postfixMsg
 *   The text to be displayed at the tail when comparison failed.
 */
function assert_BoundsArraySet_Outputs( asserter_Equal, aBoundsArraySet, imageOutReferenceArray, prefixMsg, postfixMsg ) {
  assert_ScaleBoundsArray_ScaleBoundsArray(
    aBoundsArraySet.output0, aBoundsArraySet.output1, imageOutReferenceArray, prefixMsg, postfixMsg );
}
