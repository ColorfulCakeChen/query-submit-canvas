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
//!!! (2022/12/30 Remarked) Moved to itself's tester html.
//import * as NeuralWorker_tester from "./NeuralWorker_tester.js";
import * as NeuralOrchestra_tester from "./NeuralOrchestra_tester.js";

window.addEventListener( "load", event => {

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader
    .createPromise( NeuralWorker.Common.tensorflowJsURL ).then( test );

});

/** */
const gTestSwitch = {

  // Base64ToUint8Array: true,

  // Float12: true,
  // Uint12: true,

  GSheets: true,

  // AsyncWorker: true,

//!!! (2023/02/14 Temp Remarked) For speed up other testing.
  //NeuralOrchestra: true,

};


function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  let pool_all_issuedCount_before = Pool.All.issuedCount;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_Base64ToUint8Array_tester;
  if ( gTestSwitch.Base64ToUint8Array )
    progress_Base64ToUint8Array_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_Float12_testerl
  if ( gTestSwitch.Float12 )
    progress_Float12_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_Uint12_tester;
  if ( gTestSwitch.Uint12 )
    progress_Uint12_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_GSheets_tester;
  if ( gTestSwitch.GSheets )
    progress_GSheets_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_AsyncWorker_tester;
  if ( gTestSwitch.AsyncWorker )
    progress_AsyncWorker_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_NeuralOrchestra_tester;
  if ( gTestSwitch.NeuralOrchestra ) {
    progress_NeuralOrchestra_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

  async function* testerAll() {

    if ( gTestSwitch.Base64ToUint8Array )
      yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );

    if ( gTestSwitch.Float12 )
      yield* Float12_tester.tester( progress_Float12_tester );

    if ( gTestSwitch.Uint12 )
      yield* Uint12_tester.tester( progress_Uint12_tester );

    if ( gTestSwitch.GSheets )
      yield* GSheets_tester.tester( progress_GSheets_tester );

    if ( gTestSwitch.AsyncWorker )
      yield* AsyncWorker_tester.tester( progress_AsyncWorker_tester );

    if ( gTestSwitch.NeuralOrchestra )
      yield* NeuralOrchestra_tester.tester( progress_NeuralOrchestra_tester );
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

//!!! (2023/02/22) seems needs display progress one more time when done.
//       progressReceiver.setValueMax( // Report progress to UI.
//         progress.valuePercentage, progress.maxPercentage );
  
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
