import * as ScriptLoader from "../ScriptLoader.js";
import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";

const base64EncodedString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64DecodedString = atob(base64EncodedString);

let tEncoder = new TextEncoder();
const base64DecodedUint8Array = tEncoder.encode(base64DecodedString);

let original = [
  base64String,
  
  "\n"   + base64EncodedString,
  "\r"   + base64EncodedString,
  "\r\n" + base64EncodedString,
  "\n\r" + base64EncodedString,

  "qwerty\n"   + base64EncodedString,
  "qwerty\r"   + base64EncodedString,
  "qwerty\r\n" + base64EncodedString,
  "qwerty\n\r" + base64EncodedString,
];

let result = [
  base64DecodedUint8Array,

  base64DecodedUint8Array,
  base64DecodedUint8Array,
  base64DecodedUint8Array,
  base64DecodedUint8Array,

  base64DecodedUint8Array,
  base64DecodedUint8Array,
  base64DecodedUint8Array,
  base64DecodedUint8Array,
];


/** Aggregate all progress about downloading, JSON parsing, characters scanning, and weights scanning.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading from network.
      new ValueMax.Percentage.Concrete(), // Increased when parsing the downloaded data to Uint8Array.
    ];

    super(children);

    [this.download, this.Uint8Array] = children;
  }
}

let progress = new Progress();
let receiver = new ValueMax.Receiver.Base();

window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.0.0/dist/tf.min.js").then(test); });

function test() {
  console.log("Hi! test()");

  PartTime.forOf(
    Base64ArrayBufferToUint8Array.decode_Generator(
      original[ 0 ], progress, progress.Uint8Array, 0, 1),
    receiver
  ).then(r => {
    tf.util.assert(
      r == result[0],
      `No skip line, base64 decode ${r} != ${result[0]}`);
  });
}
