export { StartStopState };

import { Int } from "./ValueDesc_Base.js";

/**
 * Describe start-stop state composed of current index and final index.
 *
 *
 * Convert number value into integer between [ 0, 4 ] representing operation:
 *   - 0: NOT_YET_STARTED
 *   - 1: STARTING
 *   - 2: STARTED
 *   - 3: STOPPING
 *   - 4: STOPPED
 */
class StartStopState extends Int {

  constructor() {
    super( 0, 4,
      {
        NOT_YET_STARTED: new Int.Info( 0, "NOT_YET_STARTED" ),
        STARTING:        new Int.Info( 1, "STARTING" ),
        STARTED:         new Int.Info( 2, "STARTED" ),
        STOPPING:        new Int.Info( 3, "STOPPING" ),
        STOPPED:         new Int.Info( 4, "STOPPED" ),
      }
    );
  }

  /**
   * @param {number} currentIndex
   *   An integer representing current index which will be increased by one
   * before every time an async generator yield.
   *   - If undefined: not yet started. (No matter what finalIndex is.)

//!!! ...unfinished... (2023/04/01)

   *   - ( < finalIndex ):  
   *     - Zero: .load_asyncGenerator() just starts loading.
   *     - Positive: .load_asyncGenerator() is still loading.
   *   - ( == finalIndex ):
   *     - Zero or Positive: .load_asyncGenerator()'s final yield.
   *   - ( > finalIndex ):
   *     - Zero or Positive: .load_asyncGenerator() has stopped.
   *
   * @param {number} finalIndex
   *   An integer recording the final index.
   *   - If it is undefined, either starting or started.
   *   - If it is not undefined, either stopping or stopped.
   *
   * @return {number}
   *   Return one of StartStopState.Ids.Xxx according to currentIndex and
   * finalIndex.
   */
  static determine_byCurrentFinal( currentIndex, finalIndex ) {

    if ( currentIndex == undefined ) {
      if ( finalIndex == undefined ) {
        return StartStopState.Singleton.Ids.NOT_YET_STARTED; // (0)
      } else {
        throw Error( `ValueDesc.StartStopState.determine_byCurrentFinal(): `
          + `finalIndex ( ${finalIndex} ) should be undefined `
          + `when currentIndex ( ${currentIndex} ) is undefined.`
        );
      }
    } else {

    }

//!!! ...unfinished... (2023/04/01)

  }

}

/** The only one ValueDesc.StartStopState instance. */
StartStopState.Singleton = new StartStopState;
