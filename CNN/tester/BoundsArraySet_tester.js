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
function test_ConvBiasActivation( asserter_Equal ) {

  const inputChannelCount = 10;
  const outputChannelCount = 20;
  const channelShuffler_inputGroupCount = 2;

  const concatenatedShape = [ outputChannelCount ];
  const outputGroupCount = channelShuffler_inputGroupCount;

  let input0;
  let a_BoundsArraySet_ConvBiasActivation;
  let channelShuffler;

  let afterFilterTensor;
  let afterBiasTensor;
  let outputTensor;

  try {
    input0 = new ActivationEscaping.ScaleBoundsArray( inputChannelCount );

    a_BoundsArraySet_ConvBiasActivation
      = new BoundsArraySet.ConvBiasActivation(
          input0, outputChannelCount, channelShuffler_inputGroupCount );

    channelShuffler = new ChannelShuffler.ShuffleInfo(
      concatenatedShape, outputGroupCount );

    // Test: shuffle output
    {
      // Make testing output channel data.
      for ( let c = 0; c < outputChannelCount; ++c ) {
        a_BoundsArraySet_ConvBiasActivation.afterFilter[ c ]
          = c;
        a_BoundsArraySet_ConvBiasActivation.afterBias[ c ]
          = outputChannelCount + c;
        a_BoundsArraySet_ConvBiasActivation.output0[ c ]
          = outputChannelCount + outputChannelCount + c;
      }

      tf.tensor1d( a_BoundsArraySet_ConvBiasActivation.afterFilter );
      channelShuffler.reshapeTransposeReshape( )

      a_BoundsArraySet_ConvBiasActivation
        .set_outputs_all_byInterleave_asGrouptTwo();

//!!! ...unfinished... (2023/07/05)
    }
  
  } finally {
    if ( outputTensor ) {
      outputTensor.dispose();
      outputTensor = null;
    }
    if ( afterBiasTensor ) {
      afterBiasTensor.dispose();
      afterBiasTensor = null;
    }
    if ( afterFilterTensor ) {
      afterFilterTensor.dispose();
      afterFilterTensor = null;
    }
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

    test_ConvBiasActivation( asserter_Equal );

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

