export { NeuralWorker_Mode as Mode };

import { Int } from "../../Unpacker/ValueDesc/ValueDesc_Base.js";

/** Describe id, range, name of NeuralWorker_Mode.
 *
 * Convert number value into integer between [ 0, 3 ] representing neural
 * worker mode:
 *
 *   -  0: ONE_WORKER__TWO_NET             (training usage)
 *   -  1: TWO_WORKER__TWO_NET__APPLY      (training usage)
 *   -  2: TWO_WORKER__TWO_NET__APPLIER    (training usage)
 *   -  3: ONE_WORKER__ONE_NET             (inference usage)
 *
 */
class NeuralWorker_Mode extends Int {

  constructor() {
    super( 0, 3,
      {
        ONE_WORKER__TWO_NET:
          new NeuralWorker_Mode.Info( 0,
            "ONE_WORKER__TWO_NET",          1, 2, undefined ),

        TWO_WORKER__TWO_NET__APPLY:
          new NeuralWorker_Mode.Info( 1,
            "TWO_WORKER__TWO_NET__APPLY",   2, 2,      true ),

        TWO_WORKER__TWO_NET__APPLIER:
          new NeuralWorker_Mode.Info( 2,
            "TWO_WORKER__TWO_NET__APPLIER", 2, 2,     false ),

        ONE_WORKER__ONE_NET:
          new NeuralWorker_Mode.Info( 3,
            "ONE_WORKER__ONE_NET",          1, 1, undefined ),
      }
    );
  }


  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode.
   * (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   The web worker count (1 or 2) of the
   * NeuralWorker_Mode.Singleton.Ids.Xxx.
   */
  static workerCount_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId(
      nNeuralWorker_ModeId );
    if ( info )
      return info.workerCount;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode.
   * (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   The neural network count (1 or 2) of the
   * NeuralWorker_Mode.Singleton.Ids.Xxx.
   */
  static neuralNetCount_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId(
      nNeuralWorker_ModeId );
    if ( info )
      return info.neuralNetCount;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ModeId
   *   The numeric identifier of NeuralWorker_Mode.
   * (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   Only meaningful for mode XXX_APPLY and XXX_APPLIER.
   *   - If true, use neuralNet.apply().
   *   - If false, use neuralNet.applier().
   */
   static bApply_or_Applier_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId(
      nNeuralWorker_ModeId );
    if ( info )
      return info.bApply_or_Applier;
    return NaN;
  }

}


/**
 *
 * @member {number} workerCount
 *   The web worker count for the neural worker mode. Either 1 or 2.
 *
 * @member {number} neuralNetCount
 *   The neural network count for the neural worker mode. Either 1 or 2.
 *   - For neural network training usage (by diffiential evolution), it is 2.
 *   - For neural network inference usage (after training), it is 1.
 *
 * @member {boolean} bApply_or_Applier
 *   Only meaningful for mode XXX_APPLY and XXX_APPLIER.
 *   - If true, use neuralNet.apply().
 *   - If false, use neuralNet.applier().
 *
 */
NeuralWorker_Mode.Info = class NeuralWorker_Mode_Info extends Int.Info {

  /**
   *
   * @param {number} nNeuralWorker_ModeId
   *   The neural worker mode id (NeuralWorker.Mode.Singleton.Ids.Xxx).
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug
   * message. This is why it is a string (so that it will not be twisted by
   * JavaScript codes compressor).
   *
   */
  constructor( nNeuralWorker_ModeId, nameForMessage,
    workerCount, neuralNetCount, bApply_or_Applier
  ) {
    super( nNeuralWorker_ModeId, nameForMessage );

    this.workerCount = workerCount;
    this.neuralNetCount = neuralNetCount;
    this.bApply_or_Applier = bApply_or_Applier;
  }

}


/** The only one NeuralWorker.Mode instance. */
NeuralWorker_Mode.Singleton = new NeuralWorker_Mode;
