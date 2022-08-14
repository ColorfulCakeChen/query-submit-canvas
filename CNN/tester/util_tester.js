import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as GSheet_tester from "./GSheet_tester.js";
import * as ScriptLoader from "../ScriptLoader.js";
import * as ValueMax from "../ValueMax.js";
import * as PartTime from "../PartTime.js";

window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js").then(test); });

function test() {
  console.log("util testing...");
  let delayMilliseconds = 100;

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_Base64ToUint8Array_tester = progress.addChild(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_GSheet_tester = progress.addChild(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy("TestProgressBar");

//   for await ( let progressRoot of Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester ) ) {
//   }

  async function* testerAll() {
    yield* Base64ToUint8Array_tester.tester( progress_Base64ToUint8Array_tester );
    yield* GSheet_tester.tester( progress_GSheet_tester );
  }

  let tester = testerAll();

  let testPromise = PartTime.forOf(
    tester,
    ( progressRoot ) => { progressReceiver.setValueMax( progressRoot.valuePercentage, progressRoot.maxPercentage ); }, // Report progress to UI.
    delayMilliseconds
  ).then(r => {
  });

//   progressReceiver.informDone(r); // Inform UI progress done.

  testPromise.then(values => {
    console.log("util testing... Done.");
  });

//!!! ...unfinished...
  progress.disposeResources_and_recycleToPool();
  progress = null;

//!!! ...unfinished... test case by multipler web worker?
}
