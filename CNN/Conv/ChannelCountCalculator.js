export { HigherHalfPassThrough };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * Calculate the channel count of lower half (of input and output) and higher half (of input and output) when the higher half of
 * input should be past-through to output.
 *
 * It is mainly used for pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail.
 *
 * @member {number} inputChannelCount_total
 *   The total input channel count.
 *
 * @member {number} outputChannelCount_total
 *   The total output channel count.
 *
 * @member {number} outputChannelCount_total_real
 *   It is usually the same as outputChannelCount_total. However, if ( outputChannelCount_total <= 0 ), it will be the same as
 * inputChannelCount_total instead. That is, it will be the same as input when no output is specified.
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half of the input channel count. (= Math.ceil( inputChannelCount_total / 2 ) )
 *
 * @member {number} inputChannelCount_higherHalf
 *   The higher half of the input channel count. (= ( inputChannelCount_total - inputChannelCount_lowerHalf ) )
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half of the output channel count. (= ( outputChannelCount_total_real - inputChannelCount_higherHalf ) )
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
  constructor( inputChannelCount_total, outputChannelCount_total ) {
    super();
    HigherHalfPassThrough.setAsConstructor.call( this, inputChannelCount_total, outputChannelCount_total );
  }

  /** @override */
  static setAsConstructor_self( inputChannelCount_total, outputChannelCount_total ) {

    this.inputChannelCount_total = inputChannelCount_total;
    this.outputChannelCount_total = outputChannelCount_total;

    this.inputChannelCount_lowerHalf = Math.ceil( inputChannelCount_total / 2 );

    // The input channel count to be past-through. (Note: Since it is past-through, it is fixed from input to output.)
    this.inputChannelCount_higherHalf = inputChannelCount_total - this.inputChannelCount_lowerHalf;

    if ( this.outputChannelCount_total <= 0 )
      this.outputChannelCount_total_real = inputChannelCount_total; // When output channel count is not specified, it will be the same as input.
    else
      this.outputChannelCount_total_real = outputChannelCount_total;

    // Since higher half will be past through, it must be fixed the same as the higher half of input.
    this.outputChannelCount_higherHalf = this.inputChannelCount_higherHalf;

    // The non-past-through channel count equals the output channel count minus the fixed (past-through) channel count.
    this.outputChannelCount_lowerHalf = this.outputChannelCount_total_real - this.outputChannelCount_higherHalf;
  }

  /** @override */
  static setAsConstructor( inputChannelCount_total, outputChannelCount_total ) {
    super.setAsConstructor();
    HigherHalfPassThrough.setAsConstructor_self.call( this, inputChannelCount_total, outputChannelCount_total );
    return this;
  }

}

