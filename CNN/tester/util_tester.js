import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as GSheet_tester from "./GSheet_tester.js";
import * as ScriptLoader from "../ScriptLoader.js";
import * as ValueMax from "../ValueMax.js";


window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js").then(test); });

function test() {
  console.log("util testing...");
  let delayMilliseconds = 1000;

  // Aggregate all progress about util_tester.
  let progress = new ValueMax.Percentage.Aggregate();
  let progress_Base64ToUint8Array_tester = progress.addChild( new ValueMax.Percentage.Aggregate() );
  let progress_GSheet_tester = progress.addChild( new ValueMax.Percentage.Aggregate() );

  let progressReceiver = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy("TestProgressBar");

/*
  let testPromiseAll = [];
  for (let i = 0; i < testCases.length; ++i) {
    let testCase = testCases[ i ];

    let decoder = Base64ToUint8Array.decoder_FromArrayBuffer(
        testCase.source, testCase.skipLineCount, progress.children[ i ], testCase.suspendByteCount);

    let testPromise = PartTime.forOf(
      decoder,
      ( valueMax ) => { progressReceiver.setValueMax( valueMax.valuePercentage, valueMax.maxPercentage ); }, // Report progress to UI.
      delayMilliseconds
    ).then(r => {
      progressReceiver.informDone(r); // Inform UI progress done.
      tf.util.assert(
        r.toString() == testCase.result.toString(),
        `[${i}]`
          + ` Skip ${testCase.skipLineCount} lines.`
          + ` suspendByteCount=${testCase.suspendByteCount}.`
          + ` ${testCase.note} [${r}] != [${testCase.result}]`);
    });

    testPromiseAll.push( testPromise );
  }

  Promise.all(testPromiseAll).then(values => {
    console.log("util testing... Done.");
  });
*/

//!!! ...unfinished... test case by multipler web worker?
}
