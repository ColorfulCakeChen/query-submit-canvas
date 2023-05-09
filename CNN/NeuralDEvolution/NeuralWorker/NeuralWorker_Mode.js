export { NeuralWorker_Mode as Mode };

import { Int } from "../../Unpacker/ValueDesc/ValueDesc_Base.js";

/** Describe id, range, name of NeuralWorker_Mode.
 *
 * Convert number value into integer between [ 0, 8 ] representing neural
 * worker mode:
 *

//!!! ...unfinished... (2023/05/05)
// Deprecate FILL and NO_FILL.
// Deprecate XX_SCALE.


 *   -  0: ONE_WORKER__TWO_NET__ONE_SCALE__FILL             (training usage)
 *   -  1: ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL          (training usage)
 *
 *   -  2: TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY      (training usage)
 *   -  3: TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER    (training usage)
 *
 *   -  4: TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY   (training usage)
 *   -  5: TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (training usage)
 *
 *   -  6: TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL          (training usage)
 *
 *   -  7: ONE_WORKER__ONE_NET__ONE_SCALE__FILL             (inference usage)
 *   -  8: ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL          (inference usage)
 *
 */
class NeuralWorker_Mode extends Int {

  constructor() {
    super( 0, 8,
      {
        ONE_WORKER__TWO_NET__ONE_SCALE__FILL:
          new NeuralWorker_Mode.Info( 0,
            "ONE_WORKER__TWO_NET__ONE_SCALE__FILL",
            1, 2, true, undefined ),

        ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL:
          new NeuralWorker_Mode.Info( 1,
            "ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL",
            1, 2, false, undefined ),


        TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY:
          new NeuralWorker_Mode.Info( 2,
            "TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY",
            2, 2, true,  true ),

        TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER:
          new NeuralWorker_Mode.Info( 3,
            "TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER",
            2, 2, true, false ),


        TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY:
          new NeuralWorker_Mode.Info( 4,
            "TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY",
            2, 2, false,  true ),

        TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER:
          new NeuralWorker_Mode.Info( 5,
            "TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER",
            2, 2, false, false ),


        TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL:
          new NeuralWorker_Mode.Info( 6,
            "TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL",
            2, 2, false, undefined ),


//!!! ...unfinished... (2023/05/04) TWO_WORKER__TWO_SCALE__FILL?
// _APPLY ? or _APPLIER ?
//         TWO_WORKER__TWO_SCALE__FILL:          new NeuralWorker_Mode.Info(
//           7, "TWO_WORKER__TWO_SCALE__FILL",          2, 2,
//           true, ???undefined ),


        ONE_WORKER__ONE_NET__ONE_SCALE__FILL:
          new NeuralWorker_Mode.Info( 7,
            "ONE_WORKER__ONE_NET__ONE_SCALE__FILL",
            1, 1, true, undefined ),

        ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL:
          new NeuralWorker_Mode.Info( 8,
            "ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL",
            1, 1, false, undefined ),
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
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
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
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
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
   *   Whether the neural worker mode will fill alignment mark and feedback
   * (i.e. previous time output) into image before processing it.
   */
  static bFill_get( nNeuralWorker_ModeId ) {
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
    if ( info )
      return info.bFill;
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
    let info = NeuralWorker_Mode.Singleton.getInfo_byId( nNeuralWorker_ModeId );
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
 * @member {boolean} bFill
 *   Whether the neural worker mode will fill alignment mark and feedback
 * (i.e. previous time output) into image before processing it.
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
   *   The string name of the integer value. Usually, it is used for debug message.
   * This is why it is a string (so that it will not be twisted by JavaScript codes
   * compressor).
   *
   */
  constructor( nNeuralWorker_ModeId, nameForMessage,
    workerCount, neuralNetCount, bFill, bApply_or_Applier
  ) {
    super( nNeuralWorker_ModeId, nameForMessage );

    this.workerCount = workerCount;
    this.neuralNetCount = neuralNetCount;
    this.bFill = bFill;
    this.bApply_or_Applier = bApply_or_Applier;
  }

}


/** The only one NeuralWorker.Mode instance. */
NeuralWorker_Mode.Singleton = new NeuralWorker_Mode;
