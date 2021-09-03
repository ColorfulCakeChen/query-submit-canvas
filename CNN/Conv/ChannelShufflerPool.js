export { Base };

import * as ChannelShuffler from "./ChannelShuffler.js";

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
//!!! ...unfinished... (2021/09/03)
  }

  /** Release all channel shuffler and their tf.tensor. */
  disposeTensors() {
//!!! ...unfinished... (2021/09/03)
  }

}
