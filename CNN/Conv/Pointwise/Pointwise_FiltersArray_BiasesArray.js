export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ConvBiasActivation from "../ConvBiasActivation.js";
import { ChannelPartInfo } from  "./Pointwise_ChannelPartInfo.js";
import { BoundsArraySet } from  "./Pointwise_BoundsArraySet.js";

/**
 * Extract pointwise convolution filters and biases.
 *
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init(). This is relative to the
 * inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ). This is relative to the inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *
 * @member {BoundsArraySet} boundsArraySet
 *   The element value bounds (per channel) of input, beforeActivation, and output for this pointwise convolution.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this pointwise convolutiuon.
 *     - Usually, if ( outputChannelCount == 0 ), it means no operation at all (i.e. bPointwise == bExisted == false ).
 *     - However, if ( outputChannelCount == 0 ) but ( channelShuffler_outputGroupCount > 0 ), this pointwise will exist
 *         (i.e. bPointwise == bExisted == true ) and always will not have biases (no matter how bBias is). It is
 *         all-pass-through-and-channel-shuffling mode.
 *
 * @member {number} outputChannelCount_Real
 *   Usually, the same as outputChannelCount. But when ( this.bAllPassThrough == true ) or ( this.bAllPassThroughShuffle == true ),
 * outputChannelCount_Real will be the same as inputChannelCount (in this case, the outputChannelCount is zero).
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   - 0. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE ), it is just a normal poitwise convolution.
 *
 *     - 0.1 If ( outputChannelCount > 0 ), normal poitwise convolution.
 *
 *     - 0.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *   - 1. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH ):
 *
 *     - 1.1 If ( outputChannelCount > 0 ), (i.e. bHigherHalfCopyLowerHalf_LowerHalfPassThrough),
 *         (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the output channels between 0 and ( outputChannelCount_lowerHalf - 1 ) will just pass
 *         through the input to output. The filters for the output channels between ( outputChannelCount_lowerHalf )
 *         and ( outputChannelCount - 1 ) will just copy the input channels between 0 and ( outputChannelCount_lowerHalf - 1 ).
 *         In this case, it will always have no biases (no matter how bBias is).
 *
 *     - 1.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *   - 2. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF ):
 *
 *     - 2.1 If ( outputChannelCount > 0 ), (i.e. bHigherHalfCopyLowerHalf),
 *         (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the output channels between ( outputChannelCount_lowerHalf ) and ( outputChannelCount - 1 ) will just copy
 *         the input channels between 0 and ( outputChannelCount_lowerHalf - 1 ).
 *
 *     - 2.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *   - 3. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_POINTWISE22 ):
 *          
 *     - 3.1 If ( outputChannelCount > 0 ), (i.e. bHigherHalfPointwise22),
 *         (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the input channels between 0 and ( inputChannelCount_lowerHalf - 1 ) are pointwise21, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are pointwise22. These two filters (and biases)
 *         will be extracted in sequence, but they will be combined into one larger filters (and biases). This makes these
 *         filters' (and biases') weights are arranged the same as pointwise2 of ShuffleNetV2_ByPointwise22's head. So that
 *         the same filters weights could be used in these two architectures for comparing performance and correctness.
 *
 *     - 3.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *  - 4. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ):
 *      (for pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 *    - 4.1 If ( outputChannelCount > 0 ), the filters for the output channels between ( outputChannelCount_lowerHalf )
 *        and ( outputChannelCount - 1 ) will just pass through the input to output.
 *
 *      - 4.1.1 If ( channelShuffler_outputGroupCount <= 0 ), (i.e. bHigherHalfPassThrough).
 *          (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 *      - 4.1.2 If ( channelShuffler_outputGroupCount > 0 ), (i.e. bHigherHalfPassThroughShuffle).
 *          (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *          The output channels will be arranged just like applying channel shuffler on them.
 *
 *    - 4.2 If ( outputChannelCount <= 0 ), the filters will just pass through all input channels to output. In this case,
 *        the ( bPointwise == bExisted == true ) (not false), although the specified outputChannelCount is zero. And, it
 *        will always have no biases (no matter how bBias is).
 *
 *      - 4.2.1 If ( channelShuffler_outputGroupCount <= 0 ), (i.e. bAllPassThrough; no pointwise and no channel shuffler).
 *          (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 *      - 4.2.2 If ( channelShuffler_outputGroupCount > 0 ), (i.e. bAllPassThroughShuffle).
 *          (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *          The output channels will be arranged just like applying channel shuffler on them.
 *
 * @member {boolean} bHigherHalfDifferent
 *   It will be false, if ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE )
 * or ( outputChannelCount <= 0 ) or ( inputChannelCount_lowerHalf <= 0 ) or ( outputChannelCount_lowerHalf <= 0 ).
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half input channel count when ( bHigherHalfDifferent == true ). It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half output channel count when ( bHigherHalfDifferent == true ). It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} channelShuffler_outputGroupCount
 *   The output group count of the channel shuffler. Usually, it is used when
 * ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ).
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *

//!!! ...unfinished... (2022/01/08)

 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {number[]} filtersShape
 *   The shape of the pointwise convolution filters array.
 *
 * @member {number[]} biasesShape
 *   The shape of the pointwise convolution biases array.
 *
 * @member {number[]} filtersArray
 *   The pointwise convolution filters array.
 *
 * @member {number[]} biasesArray
 *   The pointwise convolution biases array.
 *
 */
let FiltersArray_BiasesArray = ( Base = Object ) => class extends Base {

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super();
    this.boundsArraySet = new BoundsArraySet();
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;

    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;

    this.bHigherHalfDifferent
      =    ( nHigherHalfDifferent != ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE )
        && ( outputChannelCount > 0 )
        && ( inputChannelCount_lowerHalf > 0 )
        && ( outputChannelCount_lowerHalf > 0 );

    tf.util.assert( ( inputChannelCount > 0 ),
      `Pointwise.Base.constructor(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) must be positive integer.`
    );

    tf.util.assert( ( this.inputChannelCount_lowerHalf <= inputChannelCount ),
      `Pointwise.FiltersArray_BiasesArray.constructor(): `
        + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) can not be larger than `
        + `inputChannelCount ( ${this.inputChannelCount} ).`
    );

    if ( this.outputChannelCount > 0 ) {
      tf.util.assert( ( this.outputChannelCount_lowerHalf <= outputChannelCount ),
        `Pointwise.FiltersArray_BiasesArray.constructor(): `
          + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) can not be larger than `
          + `outputChannelCount ( ${this.outputChannelCount} ).`
      );

    } else { // ( this.outputChannelCount <= 0 ), the outputChannelCount_Real will be inputChannelCount.
      tf.util.assert( ( this.outputChannelCount_lowerHalf <= inputChannelCount ),
        `Pointwise.FiltersArray_BiasesArray.constructor(): `
          + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) can not be larger than `
          + `inputChannelCount ( ${this.inputChannelCount} ) when `
          + `outputChannelCount ( ${this.outputChannelCount} ) is zero or negative.`
      );
    }

    tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ) == ( this.outputChannelCount_lowerHalf > 0 ),
      `Pointwise.FiltersArray_BiasesArray.constructor(): `
        + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) and `
        + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) `
        + `should be both positive or both not.`
    );
  }


//!!! ...unfinished... (2022/01/08)

  /**
   * Extract pointwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.boundsArraySet
   *   - this.filtersShape
   *   - this.filtersArray
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, previous_ConvBiasActivation_BoundsArraySet ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.

//!!! ...unfinished... (2022/01/08)


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // Determine shape of the filters, biases, channels.
    let inChannelPartInfoArray;
    let filtersShape_extracted, biasesShape_extracted;
      

//!!! ...unfinished... (2022/01/08)


    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex, filterIndex, biasIndex;
    sourceIndex = filterIndex = biasIndex = 0;

    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.beginIndex;
      let inChannelEnd = inChannelPartInfo.endIndex;

      { // this.filtersArray

        let outChannel = 0;
        for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

//!!! ...unfinished... (2022/01/08)

          let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outChannelCount; ++outChannelSub, ++outChannel ) {

            if ( inChannelPartInfo.isPassThrough_byInputChannelIndex( inChannel ) ) { // For pass-through half channels.

  //!!! ...unfinished... (2022/01/08)

            } else { // Non-pass-through half channels.

  //!!! ...unfinished... (2022/01/08)

            }

          } // outChannelSub
        } // inChannel
      }

      if ( this.biasesArray ) {

//!!! ...unfinished... (2022/01/08)

        let outChannel = 0;
        for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outChannelCount; ++outChannelSub, ++outChannel ) {

            let doEscapingScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
            let extraScale = doEscapingScale; // Note: bias is not responsible for undoPreviousEscapingScale. (i.e. the filter already done it)

            if ( inChannelPartInfo.isPassThrough_byInputChannelIndex( inChannel ) ) { // For pass-through half channels.
              this.biasesArray[ biasIndex ] = 0;

            } else { // Non-pass-through half channels.
              this.biasesArray[ biasIndex ] = sourceWeights[ sourceIndex ] * extraScale;

              ++sourceIndex;
            }

            ++biasIndex;
          }
        }

      } else { // ( !this.biasesArray ). No biases array to be extracted.
        // Do nothing.
      }

    } // inChannelPartIndex


    {
      this.tensorWeightCountTotal = 0;

      if ( this.filtersShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersShape );

      if ( this.biasesShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesShape );
    }

    return true;
  }

}
