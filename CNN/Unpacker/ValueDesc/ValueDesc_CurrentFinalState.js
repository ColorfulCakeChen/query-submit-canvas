export { CurrentFinalState };

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
class CurrentFinalState extends Int {

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

}

/** The only one ValueDesc.CurrentFinalState instance. */
CurrentFinalState.Singleton = new CurrentFinalState;
