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

/**
 * @param {string} backendName
 *   The backend name string of tensorflow.js
 */
async function *testerBackend( progressParent, backendName ) {
  const funcNameInMessage = "testerBackend";

  let testCaseCount = 1; // Temporary value because it is unknown here.

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  // Ensure backend of tensorflow.js
  {
    await tf.ready(); // Ensure tf.getBackend() workable.

    let currentBackendName = tf.getBackend();
    if ( currentBackendName != backendName ) {
      let setBackendOkPromise = tf.setBackend( backendName );
      let setBackendOk = await setBackendOkPromise;
    }
  }

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


!!! ...unfinished... (2025/06/19)
// Perhaps, get testCaseCount from ParamDescConfigAll
// .calcPermutationCombinationCount()

      // Set up correct test case count.
      testCaseCount = testParams.config.???;
      progressToAdvance.max = testCaseCount;

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
        let msg = `CNN_Block_tester.${funcNameInMessage}(): `
          + `backendName=${backendName}, `
          + `Block, ( yieldCount == ${testParams.yieldCount} ), `
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
            != memoryInfo_testCorrectness_before.numTensors ) {

      const backendName = tf.getBackend();
      const msg = `CNN_Block_tester.${funcNameInMessage}(): `
        + `backendName=${backendName}, `
        + ` memory leak. `
        + `result tensor count `
        + `( ${memoryInfo_testCorrectness_after.numTensors} ) `
        + `should be `
        + `( ${memoryInfo_testCorrectness_before.numTensors} ) `
      throw Error( msg );
    }
  }

!!! ...unfinished... (2025/06/19)


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
async function* tester( progressParent ) {
  console.log( "CNN_Block testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressCPU = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressWebGL = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // (2025/06/19 Remarked)
  // let progressWASM = progressParent.child_add(
  //   ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerBackend( progressCPU, "cpu" );

  // 2.
  yield *testerBackend( progressWebGL, "webgl" );

  // (2025/06/19 Remarked)
  // // 3.
  // yield *testerBackend( progressWASM, "wasm" );

  console.log( "CNN_Block testing... Done." );
}
