export { tester };

//import * as FloatValue from "../Unpacker/FloatValue.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
//import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as Weights from "../Unpacker/Weights.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
//import * as TensorTools from "../util/TensorTools.js";
import { HeightWidthDepth } from "../x_jsPerf/jsPerf_ImageScaling.js"; 

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

  const TestCaseNameArray = [
    "testImageScaling_by_OffscreenCanvas_from_Canvas",
    "testImageScaling_by_OffscreenCanvas_from_Canvas_ImageData",
    "testImageScaling_by_Tensor_from_Canvas",
    "testImageScaling_by_Tensor_from_Canvas_ImageData",
    "testImageScaling_by_Tensor_from_Canvas_TypedArray",

    "testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas",
    "testImageScaling_by_OffscreenCanvas_from_OffscreenCanvas_ImageData",
    "testImageScaling_by_Tensor_from_OffscreenCanvas",
    "testImageScaling_by_Tensor_from_OffscreenCanvas_ImageData",
    "testImageScaling_by_Tensor_from_OffscreenCanvas_TypedArray",
  ];

  let testCaseId, testCaseName;
  try {
    let pool_all_issuedCount_before = Pool.All.issuedCount;

    // Set up correct test case count (all permuattion combination count).
    testCaseCount = TestCaseNameArray.length;
    progressToAdvance.max = testCaseCount;

    let asserter_Equal;
    let testData;
    try {
      // Test memory leakage of imageSourceBag.
      let memoryInfo_testCorrectness_before = tf.memory();

      // (Also for pre-compiling WebGL shaders.)
      {
        {
          // const acceptableDifferenceRate = 0.05;
          // const acceptableDifferenceRate = 0.001;
          const acceptableDifferenceRate = 2 ** (-70);

          // const acceptableDifference = 3;
          // const acceptableDifference = 0.00001;
          const acceptableDifference = 2 ** (-70);

          asserter_Equal = TensorTools.Asserter_Equal.Pool.get_or_create_by(
            acceptableDifferenceRate, acceptableDifference );
        }

        // Correctness testing uses smaller shape.
        {
          const output_height = 2;
          const output_width = 3;
          const output_channelCount = 4;
          const largerFactor = 3;

          testData = new HeightWidthDepth(
            output_height, output_width, output_channelCount, largerFactor );

          testData.ImageScaling_PerformanceTest_init();
        }

        let output_TypedArray_previous;
        let output_TypedArray;
        for ( testCaseId = 0; testCaseId < testCaseCount; ++testCaseId ) {
          testCaseName = TestCaseNameArray[ testCaseId ];

          // Every test case should have the same result.
          const bDownloadFromGPU = true;
          output_TypedArray = this[ testCaseName ]( bDownloadFromGPU );
          if ( output_TypedArray_previous ) {
            let lhsNumberArray = output_TypedArray_previous;
            let rhsNumberArray = output_TypedArray;
            let lhsNumberArrayName
              = `output_of_${TestCaseNameArray[ testCaseId - 1 ]}`;
            let rhsNumberArrayName
              = `output_of_${TestCaseNameArray[ testCaseId ]}`;

            let prefixMsg = `testCaseId=${testCaseId},`;
            let postfixMsg = "";

            asserter_Equal.assert_NumberArray_NumberArray(
              lhsNumberArray, rhsNumberArray,
              prefixMsg,
              lhsNumberArrayName, rhsNumberArrayName,
              postfixMsg );
          }

          output_TypedArray_previous = output_TypedArray;

          progressToAdvance.value_advance();
          yield progressRoot;
        }
      }

      let memoryInfo_testCorrectness_after = tf.memory();

      if ( memoryInfo_testCorrectness_after.numTensors
              != memoryInfo_testCorrectness_before.numTensors ) {

        const backendName = tf.getBackend();
        const msg = `CNN_NeuralNet_tester.${funcNameInMessage}(): `
          + `backendName=${backendName}, memory leak. `
          + `result tensor count `
          + `( ${memoryInfo_testCorrectness_after.numTensors} ) `
          + `should be `
          + `( ${memoryInfo_testCorrectness_before.numTensors} ) `
        throw Error( msg );
      }

    } finally {
      if ( testData ) {
        testData.disposeResources();
        testData = null;
      }
      if ( asserter_Equal ) {
        asserter_Equal.disposeResources_and_recycleToPool();
        asserter_Equal = null;
      }
    }

    Pool.Asserter.assert_Pool_issuedCount(
      `CNN_ImageScaling_tester.${funcNameInMessage}()`,
      pool_all_issuedCount_before );

    yield progressRoot;

  } catch ( e ) {
    let backendName = tf.getBackend();
    let msg = `CNN_ImageScaling_tester.${funcNameInMessage}(): `
      + `backendName=${backendName}, `
      + `testCaseId=${testCaseId}, `
      + `testCaseName=${testCaseName}. `
      + `${e}`;

    console.log( msg );
    alert( `${msg}\n${e}` );

    debugger;
    throw Error( e );
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
  console.log( "CNN_ImageScaling testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressCPU = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressWebGL = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressWASM = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerBackend( progressCPU, "cpu" );
  // yield *testerBackend( progressWebGL, "webgl" );

  // 2.
  yield *testerBackend( progressWebGL, "webgl" );
  // yield *testerBackend( progressCPU, "cpu" );

  // 3.
  yield *testerBackend( progressWASM, "wasm" );

  console.log( "CNN_ImageScaling testing... Done." );
}
