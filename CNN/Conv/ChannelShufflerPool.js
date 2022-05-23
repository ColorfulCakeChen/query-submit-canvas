export { Base };

//import * as MapTools from "../util/MapTools.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

//!!! ...unfinished... (2022/05/23) Re-implement by MultiLayerMap.

/**
 * A container which provides shared channel shufflers. This could simplify memory management.
 *
 */
class Base {

  /**
   * @param {object} channelShufflerClass
   *   The class object for creating new channel shuffler. It is one of ChannelShuffler.ShuffleInfo, ChannelShuffler.ConcatGather,
   * ChannelShuffler.SplitConcat, ChannelShuffler.ConcatPointwiseConv.
   */
  constructor( channelShufflerClass = ChannelShuffler.ConcatPointwiseConv ) {
    this.channelShufflerClass = channelShufflerClass;

    // channel shufflers indexed by [ concatenatedHeight, concatenatedWidth, concatenatedDepth, outputGroupCount ].
    this.channelShufflersBy_height_width_depth_group = new Map();

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

    let channelShufflersBy_width_depth_group = MapTools.get_or_create( this.channelShufflersBy_height_width_depth_group, concatenatedHeight );
    let channelShufflersBy_depth_group = MapTools.get_or_create( channelShufflersBy_width_depth_group, concatenatedWidth );
    let channelShufflersBy_group = MapTools.get_or_create( channelShufflersBy_depth_group, concatenatedDepth );

    let channelShuffler = channelShufflersBy_group.get( outputGroupCount );

    if ( channelShuffler )
      return channelShuffler; // 1. The requested channel shufffler has already been created. Re-use it. Return it directly.

    // 2. The requested channel shufffler has not yet existed. It should be created newly.
    this.concatenatedShape[ 0 ] = concatenatedHeight;
    this.concatenatedShape[ 1 ] = concatenatedWidth;
    this.concatenatedShape[ 2 ] = concatenatedDepth;
    channelShuffler = new (this.channelShufflerClass)( this.concatenatedShape, outputGroupCount );

    channelShufflersBy_group.set( outputGroupCount, channelShuffler ); // Cache it.
    return channelShuffler;
  }

  /** Release all channel shufflers and their tf.tensor. */
  disposeTensors() {
    if ( this.channelShufflersBy_height_width_depth_group ) {
      for ( let channelShuffler of MapTools.values_recursively( this.channelShufflersBy_height_width_depth_group ) ) {
        channelShuffler.disposeTensors();
      }

      this.channelShufflersBy_height_width_depth_group.clear();
    }
  }

}
