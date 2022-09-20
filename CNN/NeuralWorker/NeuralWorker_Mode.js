export { NeuralWorker_Mode as Mode };

import { Int } from "../Unpacker/ValueDesc/ValueDesc_Base.js";

/** Describe id, range, name of NeuralWorker_Mode.
 *
 * Convert number value into integer between [ 0, 3 ] representing neural worker mode:
 *   -  0: TWO_WORKER__FILL__ONE_SCALE
 *   -  1: TWO_WORKER__NO_FILL__ONE_SCALE
 *   -  2: TWO_WORKER__NO_FILL__TWO_SCALE
 *   -  3: ONE_WORKER__NO_FILL__ONE_SCALE
 */
class NeuralWorker_Mode extends Int {

  constructor() {
    super( 0, 3,
      {
        TWO_WORKER__FILL__ONE_SCALE:     new NeuralWorker_Mode.Info(
          0, "TWO_WORKER__FILL__ONE_SCALE",    1,  true ),

        TWO_WORKER__NO_FILL__ONE_SCALE:  new NeuralWorker_Mode.Info(
          1, "TWO_WORKER__NO_FILL__ONE_SCALE", 1, false ),

        TWO_WORKER__NO_FILL__TWO_SCALE:     new NeuralWorker_Mode.Info(
          2, "TWO_WORKER__NO_FILL__TWO_SCALE",    1, false ),

        ONE_WORKER__NO_FILL__ONE_SCALE:         new NeuralWorker_Mode.Info(
          3, "ONE_WORKER__NO_FILL__ONE_SCALE",        2, false ),
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
