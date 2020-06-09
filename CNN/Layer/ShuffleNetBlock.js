import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Implement a block of ShuffleNetV2.
 *
 *
 *
 *
 * @see ChannelShuffler.ConcatGather
 */
class Base {

  constructor() {
  }
  
  init() {
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.shuffledChannelIndicesTensor1dArray ) {
      tf.dispose( this.shuffledChannelIndicesTensor1dArray );
      this.shuffledChannelIndicesTensor1dArray = null;
    }
  }


}
