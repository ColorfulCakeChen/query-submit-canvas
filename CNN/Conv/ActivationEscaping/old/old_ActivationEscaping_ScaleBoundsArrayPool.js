export { ScaleBoundsArrayPool };

import * as Pool from "../../util/Pool.js";

//!!! (2022/06/23) Merged to ActivationEscaping_ScaleBoundsArray.js

/**
 * Providing ScaleBoundsArray by specifying length.
 *
 */
class ScaleBoundsArrayPool extends Pool.Root {

  /**
   *
   */
  constructor() {
    super( ScaleBoundsArray, ScaleBoundsArrayPool.setAsConstructor_by_length );
  }

  /**
   * @param {ScaleBoundsArray} this
   *   The ScaleBoundsArray object to be set length.
   *
   * @param {number} newLength
   *   The this.length to be set to newLength.
   *
   * @return {ScaleBoundsArray}
   *   Return the this object.
   */
  static setAsConstructor_by_length( newLength ) {
    this.length = newLength;
    return this;
  }

}

/**
 * Used as default ScaleBoundsArray provider.
 */
ScaleBoundsArrayPool.Singleton = new ScaleBoundsArrayPool();
