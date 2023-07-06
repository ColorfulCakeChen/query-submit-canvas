export { tester };

import * as BoundsArraySet_Asserter from "../util/BoundsArraySet_Asserter.js";
//import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";

/**
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 */
async function
  test_ConvBiasActivation_set_outputs_all_byInterleave_asGrouptTwo_async(
    asserter_Equal ) {

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

  /**
   * @param {number[]} array1d
   *   An one dimension number array with even element count.
   *
   * @return {number[]}
   *   Return a new number array which is shuffled from the array1d.
   */
  async function shuffleArray_byChannelShuffler( array1d ) {

    let tensorOriginal, tensorShuffled;
    try {
      tensorOriginal = tf.tensor1d( array1d );
  
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

  try {
    input0 = new ActivationEscaping.ScaleBoundsArray( inputChannelCount );

    a_BoundsArraySet_ConvBiasActivation
      = new BoundsArraySet.ConvBiasActivation(
          input0, outputChannelCount, channelShuffler_inputGroupCount );

    channelShuffler = new ChannelShuffler.ShuffleInfo(
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

      // Shuffle channel data.
      a_BoundsArraySet_ConvBiasActivation
        .set_outputs_all_byInterleave_asGrouptTwo();

      // Shuffle by tensors.
      {
        const afterFilter = a_BoundsArraySet_ConvBiasActivation.afterFilter;
        shuffledArrays.afterFilter.lowers
          = shuffleArray_byChannelShuffler( afterFilter.lowers );
        shuffledArrays.afterFilter.uppers
          = shuffleArray_byChannelShuffler( afterFilter.uppers );

        const afterBias = a_BoundsArraySet_ConvBiasActivation.afterBias;
        shuffledArrays.afterBias.lowers
          = shuffleArray_byChannelShuffler( afterBias.lowers );
        shuffledArrays.afterBias.uppers
          = shuffleArray_byChannelShuffler( afterBias.uppers );

        const output_boundsArray
          = a_BoundsArraySet_ConvBiasActivation.output0.boundsArray;
        shuffledArrays.output.boundsArray.lowers
          = shuffleArray_byChannelShuffler( output_boundsArray.lowers );
        shuffledArrays.output.boundsArray.uppers
          = shuffleArray_byChannelShuffler( output_boundsArray.uppers );

        const output_scaleArraySet
          = a_BoundsArraySet_ConvBiasActivation.output0.scaleArraySet;
        shuffledArrays.output.scaleArraySet.do.scales
          = shuffleArray_byChannelShuffler( output_scaleArraySet.do.scales );
        shuffledArrays.output.scaleArraySet.undo.scales
          = shuffleArray_byChannelShuffler( output_scaleArraySet.undo.scales );
      }

      // Check.
      {
        const prefixMsg
          = "BoundsArraySet_tester.test_ConvBiasActivation_async(): ";
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

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let asserter_Equal
    = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.001 );

  try {

    await
      test_ConvBiasActivation_set_outputs_all_byInterleave_asGrouptTwo_async(
        asserter_Equal );

    progressToAdvance.value_advance();
    yield progressRoot;

//!!! ...unfinished... (2023/07/06)
// should also test 1d, 2d, 3d:
//    FloatValue.ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to(

  } finally {
    if ( asserter_Equal ) {
      asserter_Equal.disposeResources_and_recycleToPool();
      asserter_Equal = null;
    }
  }

  console.log( `BoundsArraySet testing... Done. ` );
}
