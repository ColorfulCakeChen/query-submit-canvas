import * as ScriptLoader from "../util/ScriptLoader.js";
import * as ValueMax from "../util/ValueMax.js";
import * as PartTime from "../util/PartTime.js";
import * as Pool from "../util/Pool.js";
import * as NeuralWorker from "../NeuralDEvolution/NeuralWorker.js";
import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as Float12_tester from "./Float12_tester.js";
import * as Uint12_tester from "./Uint12_tester.js";
import * as GSheets_tester from "./GSheets_tester.js";
import * as AsyncWorker_tester from "./AsyncWorker_tester.js";
import * as NeuralWorker_tester from "./NeuralWorker_tester.js";
import * as NeuralOrchestra_tester from "./NeuralOrchestra_tester.js";

window.addEventListener( "load", event => {

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader
    .createPromise( NeuralWorker.Common.tensorflowJsURL ).then( test );

});

const gTestNeuralWorker = false;
//!!! (2022/12/28 Temp Remarked) For speed up other testing.
//const gTestNeuralWorker = true;

function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  let pool_all_issuedCount_before = Pool.All.issuedCount;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_Base64ToUint8Array_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_Float12_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_Uint12_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_GSheets_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_AsyncWorker_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_NeuralWorker_tester_cpu;
  let progress_NeuralWorker_tester_webgl;
  if ( gTestNeuralWorker ) {
    progress_NeuralWorker_tester_cpu = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    progress_NeuralWorker_tester_webgl = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  let progress_NeuralOrchestra_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

  async function* testerAll() {

    yield* NeuralOrchestra_tester.tester( progress_NeuralOrchestra_tester );

    yield* Uint12_tester.tester( progress_Uint12_tester );
    yield* Float12_tester.tester( progress_Float12_tester );
    yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );

    if ( gTestNeuralWorker ) {

      let bAscent_or_Descent;
      bAscent_or_Descent = false; // Descent
      yield* NeuralWorker_tester.tester( progress_NeuralWorker_tester_webgl,
        "webgl", bAscent_or_Descent );
    
      bAscent_or_Descent = true; // Ascent
      yield* NeuralWorker_tester.tester( progress_NeuralWorker_tester_cpu,
        "cpu", bAscent_or_Descent );
    }

    yield* AsyncWorker_tester.tester( progress_AsyncWorker_tester );
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
