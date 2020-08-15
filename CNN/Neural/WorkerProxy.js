/**
 * @file This file is an importable module to handle neural (web) worker body.
 *
 */

import * as ValueMax from "../ValueMax.js";
//import * as Net from "./Net.js";

export { InitProgress, InitProgressAll, PendingPromiseInfo, Base };


/**
 * Aggregate initialization progress of one web worker.
 * Including: download tensorflow and neural network library, download neural network weights, parse neural network weights.
 */
class InitProgress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading tensorflow and neural network library.
      new ValueMax.Percentage.Concrete(), // Increased when downloading neural network weights.
      new ValueMax.Percentage.Concrete(), // Increased when parsing neural network weights.
    ];

    super( children );
    [ this.libraryDownload, this.weightsDownload, this.weightsParse ] = children;
  }
}

/**
 * Aggregate initialization progress of two workers.
 */
class InitProgressAll extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new InitProgress(), // Increased when web worker 1 initializing.
      new InitProgress(), // Increased when web worker 2 initializing.
    ];

    super( children );
    [ this.worker1, this.worker2 ] = children;
  }
}

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject (rejecting function object).
 *
 * @member {number}   workerId     The array index of the worker owns this processing.
 * @member {number}   processingId The id of the processing.
 * @member {Promise}  promise      The pending promise for the processing.
 * @member {function} resolve      The fulfilling function object of the pending promise for the processing.
 * @member {function} reject       The rejecting function object of the pending promise for the processing.
 */
class PendingPromiseInfo {

  constructor( workerId, processingId ) {
    this.workerId = workerId;
    this.processingId = processingId;
  }

}

/**
 * Hold the worker and its related promise map.
 *
 * @member {number} workerId              The array index of this worker proxy.
 * @member {Worker} worker                The worker.
 * @member {Map}    pendingPromiseInfoMap The map for promise of the unhandled processing.
 */
class Base {

  constructor( workerId ) {
    this.workerId = workerId;

    // Every worker has a result promise map. The key of the map is processing id. The value of the map is a WorkerPendingPromiseInfo.
    this.pendingPromiseInfoMap = new Map();
  }

}
