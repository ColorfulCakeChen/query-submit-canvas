export { Bag };

import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * A container which provides shared channel shufflers. This could simplify memory management.
 *
 * @member {Pool.Base} channelShufflerPool
 *   The pool object for creating new channel shuffler. It is one of the following:
 *   - ChannelShuffler.ShuffleInfo.Pool
 *   - ChannelShuffler.ConcatGather.Pool
 *   - ChannelShuffler.SplitConcat.Pool
 *   - ChannelShuffler.ConcatPointwiseConv.Pool
 */
class Bag extends Recyclable.Base( MultiLayerMap.Base ) {

  /**
   * Used as default ChannelShuffler.Bag provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelShuffler.BagPool", Bag, Bag.setAsConstructor );

  /**
   */
  constructor( channelShufflerPool = ConcatPointwiseConv.Pool ) {
    super();
    Bag.setAsConstructor_self.call( this, channelShufflerPool );
  }

  /** @override */
  static setAsConstructor( channelShufflerPool = ConcatPointwiseConv.Pool ) {
    super.setAsConstructor();
    Bag.setAsConstructor_self.call( this, channelShufflerPool );
    return this;
  }

  /** @override */
  static setAsConstructor_self( channelShufflerPool = ConcatPointwiseConv.Pool ) {
    this.channelShufflerPool = channelShufflerPool;

    // A re-used shared array for reducing memory allocation.
    this.concatenatedShape = Recyclable.Array.Pool.get_or_create_by( 3 );
  }

  /** Release all channel shufflers and their tf.tensor.
   * @override
   */
  disposeResources() {
    
    this.concatenatedShape.disposeResources_and_recycleToPool();
    this.concatenatedShape = null;
    
    this.channelShufflerPool = null;

    this.clear();

    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let channelShuffler of this.values() ) {
      channelShuffler.disposeResources_and_recycleToPool();
    }
    super.clear();
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

}

