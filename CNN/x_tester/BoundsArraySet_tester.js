export { tester };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as BoundsArraySet_Asserter from "../util/BoundsArraySet_Asserter.js";
//import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";

/**
 * Shuffle the number array along the (virtual) last axis.
 *
 * @param {ChannelShuffler.ShuffleInfo} channelShuffler
 *   The channel shuffler. It will be used (but not kept and destroyed) by this
 * function.
 *
 * @param {number[]} numberArray
 *   An one dimension number array with even element count.
 *
 * @param {number[]} numberArrayShape
 *   An array describe the real dimensions of the numberArray.
 *
 * @return {number[]}
 *   Return a new number array which is shuffled from the array1d.
 */
async function channelShuffler_shuffleArray_async(
  channelShuffler,
  numberArray, numberArrayShape ) {

  let tensorOriginal, tensorShuffled;
  try {
    tensorOriginal = tf.tensor( numberArray, numberArrayShape );

    tensorShuffled
      = channelShuffler.reshapeTransposeReshape( tensorOriginal );

    let resultArray = await tensorShuffled.data();
    return resultArray;

  } finally {
    if ( tensorShuffled ) {
      tensorShuffled.dispose();
      tensorShuffled = null;
    }
    if ( tensorOriginal ) {
      tensorOriginal.dispose();
      tensorOriginal = null;
    }
  }
}

/**
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 */
async function*
  test_ConvBiasActivation_set_outputs_all_byInterleave_asGrouptTwo_asyncGenerator(
    progressParent, asserter_Equal ) {

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );
    
  const inputChannelCount = 10;
  const outputChannelCount = 20;
  const channelShuffler_inputGroupCount = 2;

  const concatenatedShape = [ outputChannelCount ];
  const outputGroupCount = channelShuffler_inputGroupCount;

  let input0;
  let a_BoundsArraySet_ConvBiasActivation;
  let channelShuffler;

  let shuffledArrays = {
    afterFilter: { lowers: null, uppers: null },
    afterBias: { lowers: null, uppers: null },

    output: {
      boundsArray: { lowers: null, uppers: null },
      scaleArraySet: {
        do: { scales: null },
        undo: { scales: null }
      },
    },
  };

  /** */
  async function shuffleArray_byChannelShuffler( array1d ) {
    return channelShuffler_shuffleArray_async(
      channelShuffler, array1d, concatenatedShape );
  }

  try {
    input0 = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by(
      inputChannelCount );

    a_BoundsArraySet_ConvBiasActivation
      = BoundsArraySet.ConvBiasActivation.Pool.get_or_create_by(
          input0, outputChannelCount, channelShuffler_inputGroupCount );

    channelShuffler = ChannelShuffler.ShuffleInfo.Pool.get_or_create_by(
      concatenatedShape, outputGroupCount );

    // Test: shuffle output
    {
      const value_stride = outputChannelCount;
      let base;

      // Make testing output channel data.
      for ( let c = 0; c < outputChannelCount; ++c ) {
        const afterFilter = a_BoundsArraySet_ConvBiasActivation.afterFilter;
        {
          base = 0;
          afterFilter.lowers[ c ] = base + c;

          base += value_stride;
          afterFilter.uppers[ c ] = base + c;
        }

        const afterBias = a_BoundsArraySet_ConvBiasActivation.afterBias;
        {
          base += value_stride;
          afterBias.lowers[ c ] = base + c;

          base += value_stride;
          afterBias.uppers[ c ] = base + c;
        }

        const output0_boundsArray
          = a_BoundsArraySet_ConvBiasActivation.output0.boundsArray;
        {
          base += value_stride;
          output0_boundsArray.lowers[ c ] = base + c;

          base += value_stride;
          output0_boundsArray.uppers[ c ] = base + c;
        }

        const output0_scaleArraySet
          = a_BoundsArraySet_ConvBiasActivation.output0.scaleArraySet;
        {
          base += value_stride;
          output0_scaleArraySet.do.scales[ c ] = base + c;

          base += value_stride;
          output0_scaleArraySet.undo.scales[ c ] = base + c;
        }
      }

      // Shuffle by tensors.
      //
      // Note: This should be done before
      //       .set_outputs_all_byInterleave_asGrouptTwo() is called.
      {
        const afterFilter = a_BoundsArraySet_ConvBiasActivation.afterFilter;
        shuffledArrays.afterFilter.lowers = await
          shuffleArray_byChannelShuffler( afterFilter.lowers );
        shuffledArrays.afterFilter.uppers = await
          shuffleArray_byChannelShuffler( afterFilter.uppers );

        const afterBias = a_BoundsArraySet_ConvBiasActivation.afterBias;
        shuffledArrays.afterBias.lowers = await
          shuffleArray_byChannelShuffler( afterBias.lowers );
        shuffledArrays.afterBias.uppers = await
          shuffleArray_byChannelShuffler( afterBias.uppers );

        const output_boundsArray
          = a_BoundsArraySet_ConvBiasActivation.output0.boundsArray;
        shuffledArrays.output.boundsArray.lowers = await
          shuffleArray_byChannelShuffler( output_boundsArray.lowers );
        shuffledArrays.output.boundsArray.uppers = await
          shuffleArray_byChannelShuffler( output_boundsArray.uppers );

        const output_scaleArraySet
          = a_BoundsArraySet_ConvBiasActivation.output0.scaleArraySet;
        shuffledArrays.output.scaleArraySet.do.scales = await
          shuffleArray_byChannelShuffler( output_scaleArraySet.do.scales );
        shuffledArrays.output.scaleArraySet.undo.scales = await
          shuffleArray_byChannelShuffler( output_scaleArraySet.undo.scales );
      }

      // Shuffle channel data.
      a_BoundsArraySet_ConvBiasActivation
        .set_outputs_all_byInterleave_asGrouptTwo();

      // Check.
      {
        const prefixMsg = "BoundsArraySet_tester"
          + ".test_ConvBiasActivation_set_outputs_all_byInterleave_asGrouptTwo_async(): ";
        const postfixMsg = "";

        const lhsName = "a_BoundsArraySet_ConvBiasActivation";
        const rhsName = "shuffledArrays";

        const afterFilter = a_BoundsArraySet_ConvBiasActivation.afterFilter;
        BoundsArraySet_Asserter.assert_BoundsArray( asserter_Equal,
          afterFilter,
          shuffledArrays.afterFilter,
          prefixMsg,
          `${lhsName}.afterFilter`, `${rhsName}.afterFilter`,
          postfixMsg
        );

        const afterBias = a_BoundsArraySet_ConvBiasActivation.afterBias;
        BoundsArraySet_Asserter.assert_BoundsArray( asserter_Equal,
          afterBias,
          shuffledArrays.afterBias,
          prefixMsg,
          `${lhsName}.afterBias`, `${rhsName}.afterBias`,
          postfixMsg
        );

        const output_ScaleBoundsArray
          = a_BoundsArraySet_ConvBiasActivation.output0;
        BoundsArraySet_Asserter.assert_ScaleBoundsArray( asserter_Equal,
          output_ScaleBoundsArray,
          shuffledArrays.output,
          prefixMsg,
          `${lhsName}.output`, `${rhsName}.output`,
          postfixMsg
        );
      }
    }
  
  } finally {
    if ( channelShuffler ) {
      channelShuffler.disposeResources_and_recycleToPool();
      channelShuffler = null;
    }
    if ( a_BoundsArraySet_ConvBiasActivation ) {
      a_BoundsArraySet_ConvBiasActivation.disposeResources_and_recycleToPool();
      a_BoundsArraySet_ConvBiasActivation = null;
    }
    if ( input0 ) {
      input0.disposeResources_and_recycleToPool();
      input0 = null;
    }
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/**
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 */
async function*
  test_ArrayInterleaver_interleave_asGrouptTwo_alongLastAxis_asyncGenerator(
    progressParent,
    asserter_Equal ) {

  const heightMin = 1, heightMax = 5;
  const widthMin = 1, widthMax = 5;
  const channelCountMin = 2, channelCountMax = 20;

  const channelShuffler_outputGroupCount = 2;

  const prefixMsg = "BoundsArraySet_tester"
    + ".test_ArrayInterleaver_interleave_asGrouptTwo_alongLastAxis_async(): ";
  const postfixMsg = "";

  const lhsName = "shuffledArray_by_ArrayInterleaver";
  const rhsName = "shuffledArray_by_ChannelShuffler";

  /**
   * @param {number[]} shape
   *   The virtual N-dimension array's shape (e.g. [ channelCount ] or
   * [ width, channelCount ] or [ height, width, channelCount ].
   */
  async function test_by_shape( ...shape ) {

    // 0.
    let concatenatedShape;

    if ( shape.length == 1 ) { // test 1d
      const channelCount = shape[ 0 ];
      concatenatedShape = [ channelCount ];
  
    } else if ( shape.length == 2 ) { // test 2d
      const width = shape[ 0 ];
      const channelCount = shape[ 1 ];
      concatenatedShape = [ width, channelCount ];

    } else if ( shape.length == 3 ) { // test 3d
      const height = shape[ 0 ];
      const width = shape[ 1 ];
      const channelCount = shape[ 2 ];
      concatenatedShape = [ height, width, channelCount ];

    } else {
      throw Error( `BoundsArraySet_tester.test_by_shape(): `
        + `shape.length ( ${shape.length} ) `
        + `should be 1 or 2 or 3.`
      );
    }

    let elementCount = tf.util.sizeFromShape( concatenatedShape );

    // 1.
    const originalArray = [ ... ( new Array( elementCount ).keys() ) ];

    // 2.
    let shuffledArray_by_ArrayInterleaver;
    {
      shuffledArray_by_ArrayInterleaver = new Array( elementCount );
      FloatValue.ArrayInterleaver
        .interleave_asGrouptTwo_alongLastAxis_from_to(
          originalArray, shuffledArray_by_ArrayInterleaver,
          ...concatenatedShape
        );
    }

    // 3.
    let shuffledArray_by_ChannelShuffler;
    let channelShuffler;
    try {
      channelShuffler = ChannelShuffler.ShuffleInfo.Pool.get_or_create_by(
        concatenatedShape, channelShuffler_outputGroupCount );

      shuffledArray_by_ChannelShuffler
        = await channelShuffler_shuffleArray_async(
            channelShuffler, originalArray, concatenatedShape );

    } finally {
      if ( channelShuffler ) {
        channelShuffler.disposeResources_and_recycleToPool();
        channelShuffler = null;
      }
    }

    // 4. Check
    asserter_Equal.assert_NumberArray_NumberArray(
      shuffledArray_by_ArrayInterleaver,
      shuffledArray_by_ChannelShuffler,
      prefixMsg, `${lhsName}`, `${rhsName}`, postfixMsg
    );
  }

  let progressRoot = progressParent.root_get();

  const testCaseCount
    = ( heightMax - heightMin + 1 ) * ( widthMax - widthMin + 1 )
        * ( ( ( channelCountMax - channelCountMin ) / 2 ) + 1 )

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  for ( let height = heightMin; height <= heightMax; ++height ) {
    for ( let width = widthMin; width <= widthMax; ++width ) {

      // channelCount must be even number.
      for ( let channelCount = channelCountMin;
        channelCount <= channelCountMax; channelCount+=2 ) {

        test_by_shape( height, width, channelCount ); // test 3d.

        if ( 1 == height ) {
          if ( 1 == width ) {
            test_by_shape( channelCount ); // test 1d, too.
          } else {
            test_by_shape( width, channelCount ); // test 2d, too.
          }
        }

        progressToAdvance.value_advance();
        yield progressRoot;
      }
    }
  }
}  

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( `BoundsArraySet testing...` );

  let progressRoot = progressParent.root_get();

  let progressConvBiasActivation = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressArrayInterleaver = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  
  let asserter_Equal
    = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.001 );

  try {

    // 1.
    yield*
      test_ConvBiasActivation_set_outputs_all_byInterleave_asGrouptTwo_asyncGenerator(
        progressConvBiasActivation, asserter_Equal );

    // 2.
    yield*
      test_ArrayInterleaver_interleave_asGrouptTwo_alongLastAxis_asyncGenerator(
        progressArrayInterleaver, asserter_Equal );

  } finally {
    if ( asserter_Equal ) {
      asserter_Equal.disposeResources_and_recycleToPool();
      asserter_Equal = null;
    }
  }

  console.log( `BoundsArraySet testing... Done. ` );
}
