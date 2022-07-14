export { HigherHalfPassThrough };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * Calculate the channel count of lower half (of input and output) and higher half (of input and output) when the higher half of
 * input should be passed-through to output.
 *
 * It is mainly used for pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail.
 *
 * @member {number} inputChannelCount
 *   The total input channel count.
 *
 * @member {number} outputChannelCount
 *   The total output channel count.
 *
 * @member {number} outputChannelCount_real
 *   It is usually the same as outputChannelCount. However, if ( outputChannelCount <= 0 ), it will be the same as
 * inputChannelCount instead. That is, it will be the same as input when no output is specified.
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half of the input channel count. (= Math.ceil( inputChannelCount / 2 ) )
 *
 * @member {number} inputChannelCount_higherHalf
 *   The higher half of the input channel count. (= ( inputChannelCount - inputChannelCount_lowerHalf ) )
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half of the output channel count. (= ( outputChannelCount_real - inputChannelCount_higherHalf ) )
 *
 * @member {number} outputChannelCount_higherHalf
 *   The higher half of the output channel count. (= inputChannelCount_higherHalf )
 *
 *
 */
class HigherHalfPassThrough extends Recyclable.Root {

  /**
   * Used as default ChannelCountCalculator.HigherHalfPassThrough provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelCountCalculator.HigherHalfPassThrough.Pool",
    HigherHalfPassThrough, HigherHalfPassThrough.setAsConstructor );

  /**
   *
   */
  constructor( inputChannelCount, outputChannelCount ) {
    super();
    HigherHalfPassThrough.setAsConstructor_self.call( this, inputChannelCount, outputChannelCount );
  }

  /** @override */
  static setAsConstructor( inputChannelCount, outputChannelCount ) {
    super.setAsConstructor();
    HigherHalfPassThrough.setAsConstructor_self.call( this, inputChannelCount, outputChannelCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( inputChannelCount, outputChannelCount ) {

    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;

    this.inputChannelCount_lowerHalf = Math.ceil( inputChannelCount / 2 );

    // The input channel count to be past-through. (Note: Since it is past-through, it is fixed from input to output.)
    this.inputChannelCount_higherHalf = inputChannelCount - this.inputChannelCount_lowerHalf;

    if ( this.outputChannelCount > 0 )
      this.outputChannelCount_real = outputChannelCount;
    else
      this.outputChannelCount_real = inputChannelCount; // When output channel count is not specified, it will be the same as input.

    // Since higher half will be past through, it must be fixed the same as the higher half of input.
    this.outputChannelCount_higherHalf = this.inputChannelCount_higherHalf;

    // The non-past-through channel count equals the output channel count minus the fixed (past-through) channel count.
    this.outputChannelCount_lowerHalf = this.outputChannelCount_real - this.outputChannelCount_higherHalf;
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}

}

