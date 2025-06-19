import * as ScriptLoader from "../util/ScriptLoader.js";
import * as ValueMax from "../util/ValueMax.js";
import * as PartTime from "../util/PartTime.js";
import * as Pool from "../util/Pool.js";
import * as NeuralWorker from "../NeuralDEvolution/NeuralWorker.js";
import * as AsyncWorker_tester from "./AsyncWorker_tester.js";
import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as BoundsArraySet_tester from "./BoundsArraySet_tester.js";
import * as DEvolution_tester from "./DEvolution_tester.js";
import * as FeedbackShape_tester from "./FeedbackShape_tester.js";
import * as Float12_tester from "./Float12_tester.js";
import * as GSheets_tester from "./GSheets_tester.js";
import * as HierarchicalNameable_tester from "./HierarchicalNameable_tester.js";
import * as NeuralOrchestra_tester from "./NeuralOrchestra_tester.js";
import * as Operation_tester from "./Operation_tester.js";
import * as Percentage_tester from "./Percentage_tester.js";
import * as Uint12_tester from "./Uint12_tester.js";

window.addEventListener( "load", event => {

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader
    .createPromise( NeuralWorker.Common.tensorflowJsURL ).then( test );

});

/**
 * Map from test generator function to boolean or ValueMax.Percentage.Aggregate
 */
const gTestGeneratorFuncMap = new Map( [

  // [ Percentage_tester.tester, true ],
  // [ Base64ToUint8Array_tester.tester, true ],

  // [ Float12_tester.tester, true ],
  // [ Uint12_tester.tester, true ],

  // [ HierarchicalNameable_tester.tester, true ],

  // [ BoundsArraySet_tester.tester, true ],
  // [ FeedbackShape_tester.tester, true ],

  // [ GSheets_tester.tester, true ],

  // [ AsyncWorker_tester.tester, true ],
  // [ DEvolution_tester.tester, true ],

  // [ NeuralOrchestra_tester.tester, true ],

  [ Operation_tester.tester, true ],

] );


function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  let tensorflow_memoryInfo_before = tf.memory();

  let pool_all_issuedCount_before = Pool.All.issuedCount;

  // Aggregate all progress about x_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  for ( let testGeneratorFunc of gTestGeneratorFuncMap.keys() ) {
    let progress_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    gTestGeneratorFuncMap.set( testGeneratorFunc, progress_tester );
  }

  let progressReceiver = new ValueMax.Receiver.HTMLProgress
    .createByTitle_or_getDummy( "TestProgressBar" );

  async function* testerAll() {
    for ( let [ testGeneratorFunc, progress_tester ]
      of gTestGeneratorFuncMap ) {
      yield* testGeneratorFunc( progress_tester );
    }
  }

  // Whether detect progress back-track.
  let bDetectProgressBacktrack;
  {
    //bDetectProgressBacktrack = false;
    bDetectProgressBacktrack = true;

//!!! (2023/04/04 Temp Remarked) if no retry, should also not backtrack.
    // HttpRequest.Fetcher will back-track progress.
    if ( gTestGeneratorFuncMap.get( GSheets_tester.tester ) )
      bDetectProgressBacktrack = false;
  }

  let tester = testerAll();

  let testPromise = PartTime.forOf(
    tester,
    ( progressRoot ) => {

      // (For Debug) Detect progress back-track.
      if ( bDetectProgressBacktrack ) {
        let uiProgessValue = progressReceiver.getValue();
        if ( progressRoot.valuePercentage < uiProgessValue ) {
          debugger;
        }
      }

      progressReceiver.setValueMax( // Report progress to UI.
        progressRoot.valuePercentage, progressRoot.maxPercentage );
    },
    () => { // Release resource.

      if ( 100 != progress.valuePercentage )
        throw Error( `x_tester.test(): `
          + `Progress (${progress.valuePercentage}) should be 100 `
          + `after testing done.`);

      if ( 100 != progressReceiver.getValue() )
        throw Error( `x_tester.test(): `
          + `ProgressReceiver.getValue() (${progressReceiver.getValue()}) `
          + `should be 100 after testing done.`);

      progress.disposeResources_and_recycleToPool();
      progress = null;

      Pool.Asserter.assert_Pool_issuedCount( "x_tester.test()",
        pool_all_issuedCount_before );

      let tensorflow_memoryInfo_after = tf.memory();
      if ( tensorflow_memoryInfo_after.numTensors
              != tensorflow_memoryInfo_before.numTensors )
        throw Error( `x_tester.test(): `
          + `tensorflow.js memory leak. `
          + `result tensor count `
          + `( ${tensorflow_memoryInfo_after.numTensors} ) `
          + `should be ( ${tensorflow_memoryInfo_before.numTensors} ).`
        );
    },
    delayMilliseconds
  );

  testPromise.then( value => {
    console.log( "util testing... Done." );
    //progressReceiver.informDone(r); // Inform UI progress done.

  }).catch( reason => {
    alert( reason );
    console.error( reason );
    //debugger;
  });

}
