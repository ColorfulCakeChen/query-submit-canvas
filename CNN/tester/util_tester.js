import * as ScriptLoader from "../util/ScriptLoader.js";
import * as ValueMax from "../util/ValueMax.js";
import * as PartTime from "../util/PartTime.js";
import * as Pool from "../util/Pool.js";
import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as GSheets_tester from "./GSheets_tester.js";
import * as AsyncWorker_tester from "./AsyncWorker_tester.js";
import * as jsPerf_NeuralWorker from "../jsPerf/jsPerf_NeuralWorker.js";

window.addEventListener( "load", event => {
  ScriptLoader
    .createPromise(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.19.0/dist/tf.min.js" )
    .then( test );
});

function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  let pool_all_issuedCount_before = Pool.All.issuedCount;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_Base64ToUint8Array_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_GSheets_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_AsyncWorker_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_jsPerf_NeuralWorker_cpu = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_jsPerf_NeuralWorker_webgl = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

  async function* testerAll() {
    yield* jsPerf_NeuralWorker.tester( progress_jsPerf_NeuralWorker_cpu, "cpu" );
    yield* jsPerf_NeuralWorker.tester( progress_jsPerf_NeuralWorker_webgl, "webgl" );
    yield* AsyncWorker_tester.tester( progress_AsyncWorker_tester );
    yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );
    yield* GSheets_tester.tester( progress_GSheets_tester );
  }

  let tester = testerAll();

  let testPromise = PartTime.forOf(
    tester,
    ( progressRoot ) => {
      progressReceiver.setValueMax( // Report progress to UI.
        progressRoot.valuePercentage, progressRoot.maxPercentage );
    },
    () => { // Release resource.

      if ( 100 != progress.valuePercentage )
        throw Error( `util_tester.test(): `
          + `Progress (${progress.valuePercentage}) should be 100 `
          + `after testing done.`);

      progress.disposeResources_and_recycleToPool();
      progress = null;

      Pool.Asserter.assert_Pool_issuedCount( "util_tester.test()",
        pool_all_issuedCount_before );
    },
    delayMilliseconds
  ).then(r => {
  });

//   progressReceiver.informDone(r); // Inform UI progress done.

  testPromise.then(values => {
    console.log( "util testing... Done." );
  });


//!!! ...unfinished... test case by multipler web worker?
}
