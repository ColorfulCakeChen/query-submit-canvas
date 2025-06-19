export { tester };

import * as FloatValue from "../Unpacker/FloatValue.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as Weights from "../Unpacker/Weights.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as BatchIdCalculator from "./Ref/BatchIdCalculator.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
//import * as NumberImage from "./Ref/NumberImage.js"; 
import * as Block from "../Conv/Block.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";

/** */
function *testerCases( progressParent ) {
  const funcNameInMessage = "testerCases";


!!! ...unfinished... (2025/06/19)

  let testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

!!! ...unfinished... (2025/06/19)
// Moved to itself's xxx_tester

  {
    // Test memory leakage of imageSourceBag and channelShufflerBag.
    let memoryInfo_testCorrectness_before = tf.memory();

    {
      // Note: imageSourceBag and channelShufflerBag should not be created
      //       outside tidy() because tidy() will dispose tensors
      //       dynamically created in them.
      let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by();
      let channelShufflerBag
        = ChannelShuffler.Bag.Pool.get_or_create_by(
            ChannelShuffler.ConcatPointwiseConv.Pool );

      let testParams = Block_TestParams.Base.Pool.get_or_create_by();
      let testParamsGenerator = testParams.ParamsGenerator();
      let testReference = Block_Reference.Base.Pool.get_or_create_by(
        null, "Block_Reference" );

      let batchIdCalculator = new BatchIdCalculator.Base( 100 * 1000 );

      try {
        for ( let testParams of testParamsGenerator ) {
          let bDisplayed = batchIdCalculator.checkAndDisplay( testParams.id );

          // Since just entering a new batch section, take a break so that
          // memory garbage collector could be activated to work.
          if ( bDisplayed )
            yield;

          testReference.testCorrectness(
            imageSourceBag, testParams, channelShufflerBag );
        }

      // Q: Why not catch exception inside Block_Reference.testCorrectness()?
      // A: To catch testParamsGenerator's exception.
      } catch ( e ) {
        let backendName = tf.getBackend();
        let msg = `jsPerf_Block.js: testCorrectness(): `
          + `backendName=${backendName}, `
          + `Block, (yieldCount == ${testParams.yieldCount}), `
          + `testParams.id == ${testParams.id}`;

        console.log( msg );
        alert( `${msg}\n${e}` );

        //debugger;
        throw e;
      }

      batchIdCalculator.checkAndDisplay( testParams.id );

      testReference.disposeResources_and_recycleToPool();
      testReference = null;

      testParams.disposeResources_and_recycleToPool();
      testParams = null;

      channelShufflerBag.disposeResources_and_recycleToPool();
      channelShufflerBag = null;

      imageSourceBag.disposeResources_and_recycleToPool();
      imageSourceBag = null;
    }

    let memoryInfo_testCorrectness_after = tf.memory();

    if ( memoryInfo_testCorrectness_after.numTensors
            != memoryInfo_testCorrectness_before.numTensors )
      throw Error( `testCorrectness() memory leak. `
        + `result tensor count `
        + `( ${memoryInfo_testCorrectness_after.numTensors} ) `
        + `should be `
        + `( ${memoryInfo_testCorrectness_before.numTensors} ) `
      );
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
  console.log( "CNN_Block testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressCases = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerCases( progressCases );

  console.log( "CNN_Block testing... Done." );
}
