export { StartStopState };

import { Int } from "./ValueDesc_Base.js";

/**
 * Describe start-stop state.
 *
 *
 * Convert number value into integer between [ 0, 4 ] representing state:
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
   *   An integer representing current index. For example, it could be
   * increased by one before every time an async generator yield.
   *   - undefined:     not yet started,  if ( finalIndex == undefined ).
   *   - undefined:     illegal,          if ( finalIndex != undefined ).
   *   - <  0 or NaN:   illegal,          if ( finalIndex == undefined ).
   *   - == 0:          starting,         if ( finalIndex == undefined ).
   *   - >  0:          started,          if ( finalIndex == undefined ).
   *
   *   - == finalIndex: stopping,         if ( finalIndex != undefined ).
   *   -  > finalIndex: stopped,          if ( finalIndex != undefined ).
   * 
   *   - >  0: started,  if ( finalIndex == undefined ).
   *   - >  0: illegal,  if ( finalIndex != undefined ).
   *   - >  0: started,  if ( finalIndex != undefined ).
   *   - finalIndex: stopping

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
   *   An integer recording the stopping index.
   *   - If undefined, either not yet started or starting or started.
   *   - If defined, either stopping or stopped.
   *
   * @return {number}
   *   Return one of StartStopState.Ids.Xxx according to currentIndex and
   * finalIndex.
   */
  static determine_byCurrentFinal( currentIndex, finalIndex ) {

    if ( currentIndex == undefined ) { // 1.

      if ( finalIndex == undefined ) { // 1.1
        return StartStopState.Singleton.Ids.NOT_YET_STARTED; // (0)

      } else { // 1.2
        throw Error( `ValueDesc.StartStopState.determine_byCurrentFinal(): `
          + `finalIndex ( ${finalIndex} ) should also be undefined `
          + `when currentIndex ( ${currentIndex} ) is undefined.`
        );
      }

    } else { // 2. ( currentIndex != undefined )

      if ( finalIndex == undefined ) { // 2.1

        if ( currentIndex == 0 ) // 2.1.1
          return StartStopState.Singleton.Ids.STARTING; // (1)

        if ( currentIndex > 0 ) // 2.1.2
          return StartStopState.Singleton.Ids.STARTED; // (2)

        // 2.1.3 ( currentIndex < 0 ) or Number.isNaN( currentIndex )
        throw Error( `ValueDesc.StartStopState.determine_byCurrentFinal(): `
          + `when finalIndex ( ${finalIndex} ) is undefined, `
          + `currentIndex ( ${currentIndex} ) should be either `
          + `equal or greater than 0.`
        );

      } else { // 2.2 ( finalIndex != undefined )

        if ( currentIndex == finalIndex ) // 2.2.1
          return StartStopState.Singleton.Ids.STOPPING; // (3)

        if ( currentIndex > finalIndex ) // 2.2.2
          return StartStopState.Singleton.Ids.STOPPED; // (4)

        // 2.2.3 ( currentIndex < finalIndex )
        //       or Number.isNaN( currentIndex ) or Number.isNaN( finalIndex )
        throw Error( `ValueDesc.StartStopState.determine_byCurrentFinal(): `
          + `when finalIndex ( ${finalIndex} ) is not undefined, `
          + `currentIndex ( ${currentIndex} ) should be either `
          + `equal or greater than finalIndex.`
        );
      }

    }

//!!! ...unfinished... (2023/04/01)

  }

}

/** The only one ValueDesc.StartStopState instance. */
StartStopState.Singleton = new StartStopState;
