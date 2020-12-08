import * as Base64ToUint8Array_tester from "./Base64ToUint8Array_tester.js";
import * as GVizTQ_tester from "./GVizTQ_tester.js";
import * as ScriptLoader from "../ScriptLoader.js";
import * as ValueMax from "../ValueMax.js";


/** Aggregate all progress about testing.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = new Array( 2 );
    for (let i = 0; i < children.length; ++i) {
      children[ i ] = new ValueMax.Percentage.Aggregate();
    }

    super(children);
  }
}

window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js").then(test); });

function test() {
  console.log("util testing...");
  let delayMilliseconds = 1000;

  let progress = new Progress();
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
}
