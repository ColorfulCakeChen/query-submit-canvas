import * as ScriptLoader from "../util/ScriptLoader.js";
import * as ValueMax from "../util/ValueMax.js";
import * as PartTime from "../util/PartTime.js";
import * as Pool from "../util/Pool.js";
import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as GSheet_tester from "./GSheet_tester.js";

window.addEventListener( "load", event => {
  ScriptLoader
    .createPromise(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.19.0/dist/tf.min.js" )
    .then( test );
});

function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_Base64ToUint8Array_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_GSheet_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

//   for await ( let progressRoot of Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester ) ) {
//   }

  async function* testerAll() {
    yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );
    yield* GSheet_tester.tester( progress_GSheet_tester );
  }

  let pool_all_issuedCount_before = Pool.All.issuedCount;

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

      Pool.Asserter.assert_Pool_issuedCount( "util_tester.test()", pool_all_issuedCount_before );
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
