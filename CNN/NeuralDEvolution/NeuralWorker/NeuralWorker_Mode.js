export { NeuralWorker_Mode as Mode };

import { Int } from "../../Unpacker/ValueDesc/ValueDesc_Base.js";

/** Describe id, range, name of NeuralWorker_Mode.
 *
 * Convert number value into integer between [ 0, 4 ] representing neural worker mode:
 *   -  0: ONE_WORKER__ONE_SCALE__FILL
 *   -  1: ONE_WORKER__ONE_SCALE__NO_FILL
 *   -  2: TWO_WORKER__ONE_SCALE__FILL
 *   -  3: TWO_WORKER__ONE_SCALE__NO_FILL
 *   -  4: TWO_WORKER__TWO_SCALE__NO_FILL
 */
class NeuralWorker_Mode extends Int {

  constructor() {
    super( 0, 4,
      {
        ONE_WORKER__ONE_SCALE__FILL:     new NeuralWorker_Mode.Info(
          0, "ONE_WORKER__ONE_SCALE__NO_FILL", 1,  true ),

        ONE_WORKER__ONE_SCALE__NO_FILL:  new NeuralWorker_Mode.Info(
          1, "ONE_WORKER__ONE_SCALE__NO_FILL", 1, false ),

        TWO_WORKER__ONE_SCALE__FILL:     new NeuralWorker_Mode.Info(
          2, "TWO_WORKER__ONE_SCALE__FILL",    2,  true ),

        TWO_WORKER__ONE_SCALE__NO_FILL:  new NeuralWorker_Mode.Info(
          3, "TWO_WORKER__ONE_SCALE__NO_FILL", 2, false ),

        TWO_WORKER__TWO_SCALE__NO_FILL:  new NeuralWorker_Mode.Info(
          4, "TWO_WORKER__TWO_SCALE__NO_FILL", 2, false ),
      }
    );
  }


  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode. (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   The web worker count (1 or 2) of the NeuralWorker_Mode.Singleton.Ids.Xxx.
   */
  static workerCount_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
    if ( info )
      return info.workerCount;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode. (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   Whether the worker mode will fill alignment mark in image before process it.
   */
  static bFill_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
    if ( info )
      return info.bFill;
    return NaN;
  }

}


/**
 *
 * @member {number} workerCount
 *   The web worker count for The convolution block type. Either 1 or 2.
 *
 * @member {boolean} bFill
 *   Whether the worker mode will fill alignment mark in image before process it.
 *
 */
NeuralWorker_Mode.Info = class NeuralWorker_Mode_Info extends Int.Info {

  /**
   *
   * @param {number} nNeuralWorker_ModeId
   *   The neural worker mode id (NeuralWorker.Mode.Singleton.Ids.Xxx).
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug message.
   * This is why it is a string (so that it will not be twisted by JavaScript codes
   * compressor).
   *
   */
  constructor( nNeuralWorker_ModeId, nameForMessage,
    workerCount, bFill
  ) {
    super( nNeuralWorker_ModeId, nameForMessage );

    this.workerCount = workerCount;
    this.bFill = bFill;
  }

}


/** The only one NeuralWorker.Mode instance. */
NeuralWorker_Mode.Singleton = new NeuralWorker_Mode;
