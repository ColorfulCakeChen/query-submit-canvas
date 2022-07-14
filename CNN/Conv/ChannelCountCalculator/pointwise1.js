export { pointwise1 };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { HigherHalfPassThrough } from "./HigherHalfPassThrough.js";

/**
 * Calculate the channel count of lower half (of input and output) and higher half (of input and output) for pointwise1 of
 * ShuffleNetV2_ByMopbileNetV1's head/body/tail.
 *
 * @member {number} nConvBlockTypeId
 *   The convolution type id of the block (i.e. ValueDesc.ConvBlockType.Singleton.Ids.Xxx).
 *
 * @member {number} inputChannelCount
 *   The total input channel count of pointwise1.
 *
 * @member {number} outputChannelCount
 *   The total output channel count of pointwise1.
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half of the input channel count.
 *
 * @member {number} inputChannelCount_higherHalf
 *   The higher half of the input channel count.
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half of the output channel count.
 *
 * @member {number} outputChannelCount_higherHalf
 *   The higher half of the output channel count.
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   It will be one of the following:
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE (0)
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH (1)
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF (2)
 *
 */
class pointwise1 extends Recyclable.Root {

  /**
   * Used as default ChannelCountCalculator.pointwise1 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelCountCalculator.pointwise1.Pool", pointwise1, pointwise1.setAsConstructor );

  /**
   *
   */
  constructor( nConvBlockTypeId, inputChannelCount, outputChannelCount ) {
    super();
    pointwise1.setAsConstructor_self.call( this, nConvBlockTypeId, inputChannelCount, outputChannelCount );
  }

  /** @override */
  static setAsConstructor( nConvBlockTypeId, inputChannelCount, outputChannelCount ) {
    super.setAsConstructor();
    pointwise1.setAsConstructor_self.call( this, nConvBlockTypeId, inputChannelCount, outputChannelCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( nConvBlockTypeId, inputChannelCount, outputChannelCount ) {
    this.nConvBlockTypeId = nConvBlockTypeId;
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    
    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );

    this.nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    this.inputChannelCount_lowerHalf = undefined;
    this.inputChannelCount_higherHalf = undefined;
    this.outputChannelCount_lowerHalf = undefined;
    this.outputChannelCount_higherHalf = undefined;


//!!! ...unfinished... (2021/11/15) What if ( depthwise_AvgMax_Or_ChannelMultiplier > 1 )?

    if ( infoConvBlockType.bHigherHalfDifferent == true ) {

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's head)
      if ( infoConvBlockType.bHigherHalfDepthwise2 == true ) {

        this.inputChannelCount_lowerHalf = inputChannelCount;

        if ( outputChannelCount > 0 ) {
          this.nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF;
          this.outputChannelCount_lowerHalf = outputChannelCount;

        } else {

          this.nHigherHalfDifferent
            = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH;
!!!
          // Since this is an almost copy operation, bias and activation is not necessary.
          this.pointwise1Bias = false;
          this.pointwise1ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
          this.pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( this.pointwise1ActivationId );

          this.pointwise1_outputChannelCount_lowerHalf = input0_channelCount; // For depthwise1 (by pass-through-input-to-output)
        }

        // Enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count ) so that depthwise1 could include depthwise2.
        this.pointwise1ChannelCount_modified = (
            this.pointwise1_outputChannelCount_lowerHalf // For depthwise1.
          + input0_channelCount                          // For depthwise2 (by depthwise1).
        );

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
      } else {

        // So that bHigherHalfPassThrough (or bAllPassThrough).
        this.pointwise1_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;

        let pointwise1_higherHalfPassThrough = ChannelCountCalculator.HigherHalfPassThrough.Pool.get_or_create_by(
          this.input0_channelCount, this.pointwise1ChannelCount );

        this.pointwise1_inputChannelCount_lowerHalf = pointwise1_higherHalfPassThrough.inputChannelCount_lowerHalf;
        this.pointwise1_outputChannelCount_lowerHalf = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;

        pointwise1_higherHalfPassThrough.disposeResources_and_recycleToPool();
        pointwise1_higherHalfPassThrough = null;
      }

    // In other cases, Pointwise.Base could handle ( pointwise1ChannelCount == 0 ) correctly.
    }

    if ( this.pointwise1_inputChannelCount_lowerHalf > 0 ) {
      this.pointwise1_inputChannelCount_higherHalf = input0_channelCount - this.pointwise1_inputChannelCount_lowerHalf;
    }

    this.outputChannelCount_higherHalf = ???;
  }

  /** @override */
  disposeResources() {
    this.nConvBlockTypeId = undefined;
    this.inputChannelCount = undefined;
    this.outputChannelCount = undefined;

    this.nHigherHalfDifferent = undefined;
    this.inputChannelCount_lowerHalf = undefined;
    this.inputChannelCount_higherHalf = undefined;
    this.outputChannelCount_lowerHalf = undefined;
    this.outputChannelCount_higherHalf = undefined;

    super.disposeResources();
  }

}

