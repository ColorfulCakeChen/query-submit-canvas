export { Bag };
export { BagPool };

import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ConcatPointwiseConvPool } from "./ChannelShuffler_ConcatPointwiseConv.js";

/**
 * A container which provides shared channel shufflers. This could simplify memory management.
 *
 * @member {Pool.Base} channelShufflerPool
 *   The pool object for creating new channel shuffler. It is one of the following:
 *   - ChannelShuffler.ShuffleInfoPool.Singleton
 *   - ChannelShuffler.ConcatGatherPool.Singleton
 *   - ChannelShuffler.SplitConcatPool.Singleton
 *   - ChannelShuffler.ConcatPointwiseConvPool.Singleton
 */
class Bag extends Recyclable.Base( MultiLayerMap.Base ) {

  /**
   */
  constructor( channelShufflerPool, ...restArgs ) {
    super( ...restArgs );
    Bag.setAsConstructor.call( this, channelShufflerPool, ...restArgs );
  }

  /**
   *
   * @param {ShuffleInfo} this
   *   The object to be initialized.
   *
   * @return {Bag}
   *   Return the this object.
   */
  static setAsConstructor( channelShufflerPool = ConcatPointwiseConvPool.Singleton, ...restArgs ) {

    if ( super.setAsConstructor instanceof Function )
      super.setAsConstructor.apply( this, restArgs );

    this.channelShufflerPool = channelShufflerPool;

    // A re-used shared array for reducing memory allocation.
    this.concatenatedShape = Recyclable.Array.Pool.get_or_create_by( 3 );

    return this;
  }

  /**
   *
   * @param {number} concatenatedHeight
   *   The image height which will be processed by the returned channel shuffler.
   *
   * @param {number} concatenatedWidth
   *   The image width which will be processed by the returned channel shuffler.
   *
   * @param {number} concatenatedDepth
   *   The image depth which will be processed by the returned channel shuffler.
   *
   * @param {number} outputGroupCount
   *   The outputGroupCount which will be produced by the returned channel shuffler.
   *
   * @param {object}
   *   A shared channel shuffler which could process the specific concatenatedShape and outputGroupCount.
   */
  getChannelShuffler_by( concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount ) {
    return this.get_or_create_by_arguments1_etc( Bag.create_by,
      concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount );
  }

  /** */
  static create_by( concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount ) {
    this.concatenatedShape[ 0 ] = concatenatedHeight;
    this.concatenatedShape[ 1 ] = concatenatedWidth;
    this.concatenatedShape[ 2 ] = concatenatedDepth;
    let channelShuffler = this.channelShufflerPool.get_or_create_by( this.concatenatedShape, outputGroupCount );
    return channelShuffler;
  }

  /** Release all channel shufflers and their tf.tensor. */
  disposeResources() {
    
    this.concatenatedShape.disposeResources_and_recycleToPool();
    this.concatenatedShape = null;
    
    this.channelShufflerPool = null;

    for ( let channelShuffler of this.values() ) {
      channelShuffler.disposeResources_and_recycleToPool();
    }
    this.clear();
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   *
   * Sub-class should override this method for recycling to its pool (and NEVER call super.disposeResources_and_recycleToPool()).
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    BagPool.Singleton.recycle( this );
  }

}


/**
 * Providing ChannelShuffler.Bag
 *
 */
class BagPool extends Pool.Root {

  constructor() {
    super( "ChannelShuffler.BagPool", Bag, Bag.setAsConstructor );
  }

}

/**
 * Used as default ChannelShuffler.Bag provider.
 */
BagPool.Singleton = new BagPool();

/**
 * An alias to ChannelShuffler.BagPool.Singleton for conforming to Recyclable interface.
 */
Bag.Pool.Singleton = BagPool.Singleton;
