export { ScaleBoundsArray };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
//import * as FloatValue from "../../Unpacker/FloatValue.js";
import { ScaleBoundsArrayBase } from "./ActivationEscaping_ScaleBoundsArrayBase.js";

/**
 * A pair of ScaleBoundsArrayBase. One is before channel shuffled. The other is channel shuffled.
 *
 *
 *
 */
class ScaleBoundsArray extends ScaleBoundsArrayBase {

  /**
   * Used as default ActivationEscaping.ScaleBoundsArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ActivationEscaping.ScaleBoundsArray.Pool", ScaleBoundsArray, ScaleBoundsArray.setAsConstructor );

  /**
   */
  constructor( channelCount ) {
    super( channelCount );
    ScaleBoundsArray.setAsConstructor_self.call( this, channelCount );
  }

  /** @override */
  static setAsConstructor( channelCount ) {
    super.setAsConstructor( channelCount );
    ScaleBoundsArray.setAsConstructor_self.call( this, channelCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( channelCount ) {
    // Do nothing.
    //
    // The .beforeChannelShuffled does not be created by default. It will be created when .set_all_byInterleave_asGrouptTwo() is called.
  }

  /** @override */
  disposeResources() {
    this.beforeChannelShuffled_dispose();
    super.disposeResources();
  }

  /**
   * @return {ScaleBoundsArray}
   *   Return a newly created ScaleBoundsArray which is a copy of this ScaleBoundsArray.
   */
  clone() {
    let result = ScaleBoundsArray.Pool.get_or_create_by( this.channelCount );
    result.set_all_byScaleBoundsArray( this );

    if ( this.beforeChannelShuffled ) {
      result.beforeChannelShuffled = this.beforeChannelShuffled.clone();
    }
    return result;
  }

  /**
   * Release .beforeChannelShuffled (if exists).
   */
  beforeChannelShuffled_dispose() {
    if ( this.beforeChannelShuffled ) {
      this.beforeChannelShuffled.disposeResources_and_recycleToPool();
      this.beforeChannelShuffled = null;
    }
  }

  /**
   * Rearrange this.outputs[] channel information by interleaving as ( groupCount == 2 ). This channel count must be even
   * (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance.
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo( arrayTemp ) {
    this.beforeChannelShuffled_dispose();

!!! ...unfinished... (2022/07/09)
// Perhaps, use new algorithm which needs not arrayTemp but creates new .boundsArray and .scaleArraySet.
// Because the only will be kept as .beforeChannelShuffled.


//    this.beforeChannelShuffled = ScaleBoundsArray.Pool.get_or_create_by( channelCount );

    this.boundsArray.set_all_byInterleave_asGrouptTwo( arrayTemp );
    this.scaleArraySet.set_all_byInterleave_asGrouptTwo( arrayTemp );
    return this;
  }

}
