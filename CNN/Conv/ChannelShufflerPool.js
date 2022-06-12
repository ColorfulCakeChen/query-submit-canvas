export { Base };

import * as MultiLayerMap from "../util/MultiLayerMap.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

//!!! ...unfinished... (2022/05/23) Re-implement by MultiLayerMap.

/**
 * A container which provides shared channel shufflers. This could simplify memory management.
 *
 */
class Base extends MultiLayerMap.Base {

  /**
   * @param {object} channelShufflerClass
   *   The class object for creating new channel shuffler. It is one of ChannelShuffler.ShuffleInfo, ChannelShuffler.ConcatGather,
   * ChannelShuffler.SplitConcat, ChannelShuffler.ConcatPointwiseConv.
   */
  constructor( channelShufflerClass = ChannelShuffler.ConcatPointwiseConv ) {
    super();

    this.channelShufflerClass = channelShufflerClass;

    this.concatenatedShape = [ null, null, null ]; // A re-used shared array for reducing memory allocation.
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
    return this.get_or_create_by_arguments1_etc( ( concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount ) => {
        this.concatenatedShape[ 0 ] = concatenatedHeight;
        this.concatenatedShape[ 1 ] = concatenatedWidth;
        this.concatenatedShape[ 2 ] = concatenatedDepth;
        let channelShuffler = new (this.channelShufflerClass)( this.concatenatedShape, outputGroupCount );
        return channelShuffler;
      },
      concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount );
  }

  /** Release all channel shufflers and their tf.tensor. */
  disposeTensors() {
    for ( let channelShuffler of this.values() ) {
      channelShuffler.disposeTensors();
    }
    this.clear();
  }

}
