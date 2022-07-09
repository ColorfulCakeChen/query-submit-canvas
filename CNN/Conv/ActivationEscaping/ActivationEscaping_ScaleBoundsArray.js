export { ScaleBoundsArray };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
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
    // By default (i.e. there is no channel shuffling), the .beforeChannelShuffled is just this ScaleBoundsArrayBase self.
    // Only when .set_all_byInterleave_asGrouptTwo() is called, it will be created as a new and different ScaleBoundsArrayBase.
    this.beforeChannelShuffled = this;
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
      if ( this.beforeChannelShuffled != this ) { // Has shuffled info.
        result.beforeChannelShuffled = this.beforeChannelShuffled.clone();
      } else { // No shuffled info.
        result.beforeChannelShuffled = result;
      }
    }
    return result;
  }

  /**
   * Release .beforeChannelShuffled (if exists).
   */
  beforeChannelShuffled_dispose() {
    if ( this.beforeChannelShuffled ) {
      if ( this.beforeChannelShuffled != this ) { // Has shuffled info.
        this.beforeChannelShuffled.disposeResources_and_recycleToPool();
      }
      this.beforeChannelShuffled = null;
    }
  }

  /**
   * Rearrange channels information by interleaving as ( groupCount == 2 ). This channel count must be even
   * (i.e. divisible by 2). The original "this" (i.e. not channel shuffled) ScaleBoundsArray will be swapped and kept in
   * the .beforeChannelShuffled data member.
   *
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo() {
    this.beforeChannelShuffled_dispose();
    this.beforeChannelShuffled = ScaleBoundsArray.Pool.get_or_create_by( this.length );

    // Swap this and the new ScaleBoundsArray.
    {
      let tempBoundsArray = this.boundsArray;
      let tempScaleArraySet = this.scaleArraySet;

      this.boundsArray = this.beforeChannelShuffled.boundsArray;
      this.scaleArraySet = this.beforeChannelShuffled.scaleArraySet;

      // Keep the old (i.e. not channel shuffled) ScaleBoundsArray.
      this.beforeChannelShuffled.boundsArray = tempBoundsArray;
      this.beforeChannelShuffled.scaleArraySet = tempScaleArraySet;
    }

    // Generae the new (i.e. channel shuffled) ScaleBoundsArray.
    this.boundsArray.set_all_byInterleave_asGrouptTwo_byBoundsArray( this.beforeChannelShuffled.boundsArray );
    this.scaleArraySet.set_all_byInterleave_asGrouptTwo_byScaleArraySet( this.beforeChannelShuffled.scaleArraySet );

    return this;
  }

}
