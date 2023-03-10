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
import * as DEvolution_tester from "./DEvolution_tester.js";
import * as NeuralOrchestra_tester from "./NeuralOrchestra_tester.js";

window.addEventListener( "load", event => {

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader
    .createPromise( NeuralWorker.Common.tensorflowJsURL ).then( test );

});

/** Map from test generator function to boolean or ValueMax.Percentage.Aggregate */
const gTestGeneratorFuncMap = new Map(

  // [ Base64ToUint8Array_tester.tester, true ],

  // [ Float12_tester.tester, true ],
  // [ Uint12_tester.tester, true ],

  // [ GSheets_tester.tester, true ],

  // [ AsyncWorker_tester.tester, true ],
  // [ DEvolution_tester.tester, true ],

//!!! (2023/02/14 Temp Remarked) For speed up other testing.
  [ NeuralOrchestra_tester.tester, true ],

};


function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  let pool_all_issuedCount_before = Pool.All.issuedCount;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  for ( let testGeneratorFunc of gTestGeneratorMap.keys() ) {
    let progress_tester = progress.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    gTestGeneratorMap.set( testGeneratorFunc, progress_tester );
  }

//!!! (2023/03/10 Remarked) Replaced by gTestGeneratorMap.
//   let progress_Base64ToUint8Array_tester;
//   if ( gTestSwitch.Base64ToUint8Array )
//     progress_Base64ToUint8Array_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress_Float12_testerl
//   if ( gTestSwitch.Float12 )
//     progress_Float12_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress_Uint12_tester;
//   if ( gTestSwitch.Uint12 )
//     progress_Uint12_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress_GSheets_tester;
//   if ( gTestSwitch.GSheets )
//     progress_GSheets_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress_AsyncWorker_tester;
//   if ( gTestSwitch.AsyncWorker )
//     progress_AsyncWorker_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress_DEvolution_tester;
//   if ( gTestSwitch.DEvolution )
//     progress_DEvolution_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//  
//   let progress_NeuralOrchestra_tester;
//   if ( gTestSwitch.NeuralOrchestra )
//     progress_NeuralOrchestra_tester = progress.child_add(
//       ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

  async function* testerAll() {

    for ( let [ testGeneratorFunc, progress_tester ] of gTestGeneratorMap ) {
      yield* testGeneratorFunc( progress_tester );
    }
  
//!!! (2023/03/10 Remarked) Replaced by gTestGeneratorMap.
//     if ( gTestSwitch.Base64ToUint8Array )
//       yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );
//
//     if ( gTestSwitch.Float12 )
//       yield* Float12_tester.tester( progress_Float12_tester );
//
//     if ( gTestSwitch.Uint12 )
//       yield* Uint12_tester.tester( progress_Uint12_tester );
//
//     if ( gTestSwitch.GSheets )
//       yield* GSheets_tester.tester( progress_GSheets_tester );
//
//     if ( gTestSwitch.AsyncWorker )
//       yield* AsyncWorker_tester.tester( progress_AsyncWorker_tester );
//
//     if ( gTestSwitch.DEvolution )
//       yield* DEvolution_tester.tester( progress_DEvolution_tester );
//
//     if ( gTestSwitch.NeuralOrchestra )
//       yield* NeuralOrchestra_tester.tester( progress_NeuralOrchestra_tester );
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

      if ( 100 != progressReceiver.getValue() )
        throw Error( `util_tester.test(): `
          + `ProgressReceiver.getValue() (${progressReceiver.getValue()}) `
          + `should be 100 after testing done.`);

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
