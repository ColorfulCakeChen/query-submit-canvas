export { NeuralWorker_Mode as Mode };

import { Int } from "../Unpacker/ValueDesc/ValueDesc_Base.js";

/** Describe id, range, name of NeuralWorker_Mode.
 *
 * Convert number value into integer between [ 0, 3 ] representing neural worker mode:
 *   -  0: FILL_WORKER_2_SMALLER
 *   -  1: NO_FILL_WORKER_2_SMALLER
 *   -  2: NO_FILL_WORKER_2_SAME
 *   -  3: NO_FILL_ONE_WORKER
 */
class NeuralWorker_Mode extends Int {

  constructor() {
    super( 0, 3,
      {
         MOBILE_NET_V1_HEAD_BODY_TAIL:                     new NeuralWorker_Mode.Info(  0, "MOBILE_NET_V1_HEAD_BODY_TAIL",
           1, ),

         MOBILE_NET_V2_BODY_TAIL:                          new NeuralWorker_Mode.Info(  1, "MOBILE_NET_V2_BODY_TAIL",
           1, ),

         SHUFFLE_NET_V2_HEAD:                              new NeuralWorker_Mode.Info(  2, "SHUFFLE_NET_V2_HEAD",
           1, ),

         SHUFFLE_NET_V2_BODY:                              new NeuralWorker_Mode.Info(  3, "SHUFFLE_NET_V2_BODY",
           2, ),
      }
    );
  }


  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode. (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   Return the web worker tensor count (1 or 2) of the
   * NeuralWorker_Mode.Singleton.Ids.Xxx.
   */
  static workerCount_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
    if ( info )
      return info.workerCount;
    return NaN;
  }

}


/**
 *
 * @member {number} workerCount
 *   The web worker tensor count for The convolution block type. Either 1 or 2.
 *
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
    workerCount,
  ) {
    super( nNeuralWorker_ModeId, nameForMessage );

    this.workerCount = workerCount;
  }

}


/** The only one NeuralWorker.Mode instance. */
NeuralWorker_Mode.Singleton = new NeuralWorker_Mode;
