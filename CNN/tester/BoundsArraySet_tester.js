import * as BoundsArraySet_Asserter from "../util/BoundsArraySet_Asserter.js";
//import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";

//!!! ...unfinished... (2023/06/29) should test
// BoundsArraySet.ConvBiasActivation.set_outputs_all_byInterleave_asGrouptTwo()

/**
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 */
async function test_ConvBiasActivation_async( asserter_Equal ) {

  const inputChannelCount = 10;
  const outputChannelCount = 20;
  const channelShuffler_inputGroupCount = 2;

  const concatenatedShape = [ outputChannelCount ];
  const outputGroupCount = channelShuffler_inputGroupCount;

  let input0;
  let a_BoundsArraySet_ConvBiasActivation;

  let shuffledArrays = {
    afterFilter_lowers: null,
    afterFilter_uppers: null,

    afterBias_lowers: null,
    afterBias_uppers: null,

    output_boundsArray_lowers: null,
    output_boundsArray_uppers: null,

    output_scaleArraySet_do_scales: null,
    output_scaleArraySet_undo_scales: null,
  };

  let channelShuffler = new ChannelShuffler.ShuffleInfo(
    concatenatedShape, outputGroupCount );

  /**
   * @param {number[]} array1d
   *   An one dimension number array with even element count.
   *
   * @return {number[]}
   *   Return a new number array which is shuffled from the array1d.
   */
  function shuffleArray_byChannelShuffler( array1d ) {

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


//!!! ...unfinished... (2023/07/05)
  let afterFilterTensor;
  let afterBiasTensor;
  let outputTensor;

  let afterFilterShuffledTensor;
  let afterBiasShuffledTensor;
  let outputShuffledTensor;

  let afterFilterShuffledArray;
  let afterBiasShuffledArray;
  let outputShuffledArray;

  try {
    input0 = new ActivationEscaping.ScaleBoundsArray( inputChannelCount );

    a_BoundsArraySet_ConvBiasActivation
      = new BoundsArraySet.ConvBiasActivation(
          input0, outputChannelCount, channelShuffler_inputGroupCount );

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

      // Make testing output channel tensors.
      {
        shuffledArrays.afterFilter_lowers = 

        afterFilterTensor
          = tf.tensor1d( a_BoundsArraySet_ConvBiasActivation.afterFilter );

        afterBiasTensor
          = tf.tensor1d( a_BoundsArraySet_ConvBiasActivation.afterBias );

        outputTensor
          = tf.tensor1d( a_BoundsArraySet_ConvBiasActivation.output0 );


//!!! ...unfinished... (2023/07/05)
// boundsArray.lowers[], boundsArray.uppers[]
// scaleArraySet.do.scales[], scaleArraySet.undo.scales[]

      }

      // Shuffle channel data.
      a_BoundsArraySet_ConvBiasActivation
        .set_outputs_all_byInterleave_asGrouptTwo();

      // Shuffle tensors.
      {
        afterFilterShuffledTensor
          = channelShuffler.reshapeTransposeReshape( afterFilterTensor );

        afterBiasShuffledTensor
          = channelShuffler.reshapeTransposeReshape( afterBiasTensor );

        outputShuffledTensor
          = channelShuffler.reshapeTransposeReshape( outputTensor );
      }

      {
        afterFilterShuffledArray = await afterFilterShuffledTensor.data();
        afterBiasShuffledArray = await afterBiasShuffledTensor.data();
        outputShuffledArray = await outputShuffledTensor.data();
      }

//!!! ...unfinished... (2023/07/05)
      {
        BoundsArraySet_Asserter.assert_ScaleBoundsArray(
          asserter_Equal,
          aScaleBoundsArray, refScaleBoundsArray,
          lhsName, rhsName,
          prefixMsg, postfixMsg );

      }

//!!! ...unfinished... (2023/07/05)

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

  this.boundsArray
  = FloatValue.BoundsArray.Pool.get_or_create_by( channelCount );
this.scaleArraySet

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

    await test_ConvBiasActivation_async( asserter_Equal );

    progressToAdvance.value_advance();
    yield progressRoot;

  } finally {
    if ( asserter_Equal ) {
      asserter_Equal.disposeResources_and_recycleToPool();
      asserter_Equal = null;
    }
  }

  console.log( `BoundsArraySet testing... Done. ` );
}

