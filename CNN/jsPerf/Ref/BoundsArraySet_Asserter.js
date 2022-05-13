export { assert_BoundsArraySet };

/**
 * Check:
 *   - aBoundsArraySet.output0 == imageOutReferenceArray[ 0 ].boundsArraySet.output0
 *   - aBoundsArraySet.output1 == imageOutReferenceArray[ 1 ].boundsArraySet.output0 (if imageOutReferenceArray[ 1 ] exists)
 *
 *
 * @param {TensorTools.Asserter_Equal} asserter_Equal  The object used to assert number array.
 * @param {BoundsArraySet} aBoundsArraySet             The bounds array set to be asserted.
 * @param {NumberImage.Base[]} imageOutReferenceArray  Refernece output Image data.
 *
 * @param {string} postfixMsg
 *   The text to be displayed at the tail when comparison failed.
 */
function assert_BoundsArraySet_Outputs( asserter_Equal, aBoundsArraySet, imageOutReferenceArray, postfixMsg ) {

  // Note: For using "this", defined as an arrow function.
  let assert_byIndex = ( indexName, index, aScaleBoundsArray, refScaleBoundsArray ) => {

    tf.util.assert(
      (   ( ( aScaleBoundsArray == null ) && ( refScaleBoundsArray == null ) )
       || ( ( aScaleBoundsArray != null ) && ( refScaleBoundsArray != null ) ) ),
      `PointDepthPoint_Reference.Base.assert_imageOut_BoundsArraySet().assert_byIndex( `
        + `indexName=${indexName}, index=${index} ): `
        + `aScaleBoundsArray (${aScaleBoundsArray}) and refScaleBoundsArray (${refScaleBoundsArray}) `
        + `must both null or both non-null. ${postfixMsg}`);

    if ( ( aScaleBoundsArray == null ) || ( refScaleBoundsArray == null ) )
      return;

    this.asserter_Equal.assert_NumberArray_NumberArray(
      aScaleBoundsArray.boundsArray.lowers, refScaleBoundsArray.boundsArray.lowers,
      `PointDepthPoint`, `${indexName}${index}.boundsArray.lowers`, `${indexName}Ref${index}.boundsArray.lowers`, postfixMsg
    );

    this.asserter_Equal.assert_NumberArray_NumberArray(
      aScaleBoundsArray.boundsArray.uppers, refScaleBoundsArray.boundsArray.uppers,
      `PointDepthPoint`, `${indexName}${index}.boundsArray.uppers`, `${indexName}Ref${index}.boundsArray.uppers`, postfixMsg
    );

    this.asserter_Equal.assert_NumberArray_NumberArray(
      aScaleBoundsArray.scaleArraySet.do.scales, refScaleBoundsArray.scaleArraySet.do.scales,
      `PointDepthPoint`, `${indexName}${index}.scaleArraySet.do.scales`, `${indexName}Ref${index}.scaleArraySet.do.scales`, postfixMsg
    );

    this.asserter_Equal.assert_NumberArray_NumberArray(
      aScaleBoundsArray.scaleArraySet.undo.scales, refScaleBoundsArray.scaleArraySet.undo.scales,
      `PointDepthPoint`, `${indexName}${index}.scaleArraySet.undo.scales`, `${indexName}Ref${index}.scaleArraySet.undo.scales`, postfixMsg
    );
  }

  //!!! (2022/04/27 Remarked) input tensor count may be different.
  //assert_byIndex( "input", 0, aBoundsArraySet.input0, imageOutReferenceArray[ 0 ].boundsArraySet.input0 );
  //assert_byIndex( "input", 1, aBoundsArraySet.input1, imageOutReferenceArray[ 0 ].boundsArraySet.input1 );
  assert_byIndex( "output", 0, aBoundsArraySet.output0, imageOutReferenceArray[ 0 ].boundsArraySet.output0 );

  if ( imageOutReferenceArray[ 1 ] ) {
    //!!! (2022/04/27 Remarked) input tensor count may be different.
    //assert_byIndex( "input", 0, aBoundsArraySet.input0, imageOutReferenceArray[ 1 ].boundsArraySet.input0 );
    //assert_byIndex( "input", 1, aBoundsArraySet.input1, imageOutReferenceArray[ 1 ].boundsArraySet.input1 );
    assert_byIndex( "output", 1, aBoundsArraySet.output1, imageOutReferenceArray[ 1 ].boundsArraySet.output0 );
  }
}
