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

//!!! ...unfinished... (2022/01/09)
// In fact, AllPassThrough could be achieved without using special ( outputChannelCount <= 0 ).
// Just using ( HIGHER_HALF_PASS_THROUGH ) with ( inputChannelCount_lowerHalf == 0 ) and ( outputChannelCount_lowerHalf == 0 )
// is enough to do AllPassThrough.

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
      `Pointwise.FiltersArray_BiasesArray.constructor(): `
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


    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.output.lowers.length ),
      `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as `
        + `outputChannelCount of previous convolution-bias-activation ( ${previous_ConvBiasActivation_BoundsArraySet.output.lowers.length} ).`
    );

    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length ),
      `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as the length of `
        + `activationEscaping_ScaleArraySet.undo of previous convolution-bias-activation `
        + `( ${previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length} ).`
    );


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

//!!! ...unfinished... (2022/01/09)
// Even if ( this.outputChannelCount <= 0 ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.

//!!! (2022/01/09 Remarked) Wrong!
//     if ( this.outputChannelCount <= 0 )
//       return true; // Nothing needs to be extracted.

    // Determine shape of the filters, biases, channels.
    let inChannelPartInfoArray;
    let filtersShape_extracted, biasesShape_extracted;

    // Set up inChannelPartInfoArray and filtersShape and biasesShape.
    {
//!!! ...unfinished... (2022/01/08)
//       this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

      this.filtersShape =  [ 1, 1, this.inputChannelCount, this.outputChannelCount ];
      if ( this.bBias )
        this.biasesShape = [ this.outputChannelCount ];

      switch ( this.nHigherHalfDifferent ) {
        // 3.0 Normal pointwise convolution and bias.
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
          this.outputChannelCount_Real = this.outputChannelCount;
          this.inputChannelCount_toBeExtracted = this.inputChannelCount; // Extract all weights as specified input/output channels.
          this.outputChannelCount_toBeExtracted = this.outputChannelCount;
          inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount, this.outputChannelCount, false ) ];
          break;

        // 3.1 bHigherHalfCopyLowerHalf_LowerHalfPassThrough
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH: // (1)
          this.outputChannelCount_Real = this.outputChannelCount;
          this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = 0; // Does not extract any weights.
          //this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf; // Not used in this case.
          this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;
          inChannelPartInfoArray = [
            new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  true ),
            new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true ) ];
          break;

        // 3.2 bHigherHalfCopyLowerHalf
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF: // (2)
          this.outputChannelCount_Real = this.outputChannelCount;
          this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
          this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;
          this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
          this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;
          inChannelPartInfoArray = [
            new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf, false ),
            new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true ) ];
          break;

        // 3.3 bHigherHalfPointwise22
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_POINTWISE22: // (3)
          this.outputChannelCount_Real = this.outputChannelCount;
          this.inputChannelCount_toBeExtracted = this.inputChannelCount;   // Extract all weights as specified input/output channels.
          this.outputChannelCount_toBeExtracted = this.outputChannelCount; // (like a normal pointwise convolution, but with a different arrangement.)
          this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
          this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

          //!!! (2022/01/08 Remarked) Perhaps, treated as normal pointwise.
          //// The channel count can not be halved (e.g. ( inputChannelCount == 1 ) or ( outputChannelCount == 1 ) ).
          //tf.util.assert( ( ( 0 != this.inputChannelCount_higherHalf ) && ( 0 != this.outputChannelCount_higherHalf ) ),
          //  `Pointwise.FiltersArray_BiasesArray.init(): `
          //    + `When nHigherHalfDifferent ( ${ValueDesc.Pointwise_HigherHalfDifferent.Singleton.getStringOf( this.nHigherHalfDifferent )} ) `
          //    + `inputChannelCount_higherHalf ( ${this.inputChannelCount_higherHalf} ) and `
          //    + `outputChannelCount_higherHalf ( ${this.outputChannelCount_higherHalf} ) `
          //    + `can not be zero.`
          //);

          inChannelPartInfoArray = [
            new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false ),
            new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf, false ) ];
          break;

        // 3.4
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (4)

          if ( this.outputChannelCount > 0 ) { // 3.4.1.1 bHigherHalfPassThrough
            this.outputChannelCount_Real = this.outputChannelCount;
            this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;
            this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
            this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;
            inChannelPartInfoArray = [
              new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false ),
              new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf,  true ) ];

          } else { // ( outputChannelCount <= 0 ), // 3.4.2.1 bAllPassThrough

//!!! ...unfinished... (2022/01/09)
// In fact, AllPassThrough could be achieved without using special ( outputChannelCount <= 0 ).
// Just using ( HIGHER_HALF_PASS_THROUGH ) with ( inputChannelCount_lowerHalf == 0 ) and ( outputChannelCount_lowerHalf == 0 )
// is enough to do AllPassThrough.

            this.bAllPassThrough = true; // Marked for this special case.
            this.outputChannelCount_Real = this.inputChannelCount; // (Note: In this case, this.outputChannelCount is zero. So use inputChannelCount.)
            this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = 0; // Does not extract any weights.
            inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount, this.outputChannelCount_Real, true ) ];
          }

//!!! ...unfinished... (2022/01/08) how to shuffle? this.output_interleave_asGrouptTwo()

          // 3.4.1.2 bHigherHalfPassThroughShuffle
          // 3.4.2.2 bAllPassThroughShuffle
          if ( bExtractOk ) {
            if ( this.channelShuffler_outputGroupCount > 0 ) {
              Base.shuffle_filters_biases.call( this ); // Pre-shuffle channels by shuffling the filters and biases.
            }
          }
          break;

        default:
          tf.util.assert( ( false ),
            `Pointwise.FiltersArray_BiasesArray.init(): `
              + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) is unknown value.`
          );
          break;
      }

      filtersShape_extracted = [ 1, 1, this.inputChannelCount_toBeExtracted, this.outputChannelCount_toBeExtracted  ];
      biasesShape_extracted =  [ this.outputChannelCount_toBeExtracted ];
    }

//!!! ...unfinished... (2022/01/08)


    // Prepare result filters and biases array.
    if ( this.filtersShape )
      this.filtersArray = new Array( tf.util.sizeFromShape( this.filtersShape ) );
    if ( this.biasesShape )
      this.biasesArray = new Array( tf.util.sizeFromShape( this.biasesShape ) );

    // Calculate weights count of filters and biases to be extracted.
    let weightsCount_extracted = 0;
    if ( filtersShape_extracted )
      weightsCount_extracted += tf.util.sizeFromShape( filtersShape_extracted );
    if ( biasesShape_extracted )
      weightsCount_extracted += tf.util.sizeFromShape( biasesShape_extracted );

    // Prepare source weights to be extracted.
    let sourceWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, weightsCount_extracted );
    if ( !sourceWeights.extract() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = sourceWeights.defaultByteOffsetEnd;
    this.tensorWeightCountExtracted = weightsCount_extracted;

    // filters and bias: weights and value bounds.
    //
    // It should be better to calculate per channel value bounds by real filter and bias value (i.e. not by an estimated value bounds).
    // This is especially important for ActivationEscaping. Because inputDomainLinear of activation function is not wide, using looser
    // value bounds estimation has higher possibility to lost information.
    //
    // Two-rounds processing is used:
    //
    //   - In the 1st round, extracting filter and bias value from sourceWeights[]. At the same time, calculating .afterFilter and
    //       .afterBias by these extracted values combined with undoPreviousEscapingScale
    //       (i.e. previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ]). And then,
    //       Find out .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation.
    //
    //   - In the 2nd round, apply doEscapingScale (i.e. .activationEscaping_ScaleArraySet.do.scales[ outChannel ] )
    //       to filter and bias value (and also .afterFilter and .afterBias).
    //
    {
      // Round 0
      {
        // Determine .input
        this.boundsArraySet.input.set_all_byBoundsArray( previous_ConvBiasActivation_BoundsArraySet.output );

        // Determine .afterUndoPreviousActivationEscaping
        this.boundsArraySet.afterUndoPreviousActivationEscaping
          .set_all_byBoundsArray( this.boundsArraySet.input )
          .multiply_all_byNs( previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales );

        // Init .afterFilter
        this.boundsArraySet.afterFilter.set_all_byN( 0 );
      }

      // Round 1
      {
        this.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
          sourceWeights, previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray );

        // Determine .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation
        this.boundsArraySet.set_bPassThrough_all_byChannelPartInfoArray( inChannelPartInfoArray );
        this.boundsArraySet.set_activationEscaping_afterActivationEscaping_afterActivation_by_afterBias_bPassThrough_nActivationId(
          this.nActivationId );
      }

      // Round 2
      this.apply_doEscapingScale_to_filtersArray_biasesArray( inChannelPartInfoArray ); // Apply doEscapingScale.
    }

    {
      this.tensorWeightCountTotal = 0;

      if ( this.filtersShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersShape );

      if ( this.biasesShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesShape );
    }

    return true;
  }

  /**
   * Extract this.filtersArray and this.biasesArray from sourceWeights and apply this.boundsArraySet.activationEscaping_ScaleArraySet.undo.scales[].
   * Also set the .afterFilter and .afterBias.
   *
   * @param {Float32Array} sourceWeights
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this pointwise convolution.
   *
   * @param {Depthwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
    sourceWeights, previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray ) {

    let tBounds = new FloatValue.Bounds( 0, 0 );

    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex = 0, filterIndex = 0, biasIndex = 0;

    { // this.filtersArray

      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
        let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];
        let outChannel = 0;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
          let inChannelToBegin = inChannel - inChannelPartInfo.inChannelBegin;

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

            if ( ( inChannelToBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {
                
              if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                if ( inChannelToBegin == outChannelSub ) { // The only one filter position (in the pass-through part) has non-zero value.
                  this.filtersArray[ filterIndex ] = undoPreviousEscapingScale;
                } else {
                  this.filtersArray[ filterIndex ] = 0; // All other filter positions (in the pass-through part) are zero.
                }

              } else { // Non-pass-through half channels.
                this.filtersArray[ filterIndex ] = sourceWeights[ sourceIndex ] * undoPreviousEscapingScale;

                ++sourceIndex;
              }

            } else {
              this.filtersArray[ filterIndex ] = 0; // All input channels which is not in range use zero filter to ignore the inputs.
            }

            // Determine .afterFilter
            tBounds.set_byBoundsArray( this.afterUndoPreviousActivationEscaping, inChannel ).multiply_byN( this.filtersArray[ filterIndex ] );
            this.boundsArraySet.afterFilter.add_one_byBounds( outChannel, tBounds );

            ++filterIndex;

          } // outChannelSub, outChannel
        } // inChannelPartIndex
      } // inChannel
    } // this.filtersArray

    // Init .afterBias
    {
      this.boundsArraySet.afterBias.set_all_byBoundsArray( this.boundsArraySet.afterFilter );
    }

    if ( this.biasesArray ) {
      let outChannel = 0;

      InChannelPartIndexLoop:
      for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
        let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
          if ( outChannel >= this.outputChannelCount )
            break InChannelPartIndexLoop; // Never exceeds the total output channel count.

          // Note: bias is not responsible for undoPreviousEscapingScale. (i.e. the filter already done it)

          if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
            this.biasesArray[ biasIndex ] = 0;

          } else { // Non-pass-through half channels.
            this.biasesArray[ biasIndex ] = sourceWeights[ sourceIndex ];

            // Determine .afterBias
            this.boundsArraySet.afterBias.add_one_byBounds( outChannel, this.biasesArray[ biasIndex ] ); // Shift the value bounds by the bias.

            ++sourceIndex;
          }

          ++biasIndex;

        } // outChannelSub, outChannel
      } // inChannelPartIndex

    } else { // ( !this.biasesArray ). No biases array to be extracted.
      // Do nothing.
    }
  }

  /**
   * Apply this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[] to this.filtersArray and this.biasesArray.
   *
   * @param {Depthwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  apply_doEscapingScale_to_filtersArray_biasesArray( inChannelPartInfoArray ) {
    let filterIndex = 0, biasIndex = 0;

    { // this.filtersArray

      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
        let outChannel = 0;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
          let inChannelToBegin = inChannel - inChannelPartInfo.inChannelBegin;

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

            let doEscapingScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
            this.filtersArray[ filterIndex ] *= doEscapingScale; // filter wieghts scaled.

            this.boundsArraySet.afterFilter.multiply_one_byN( outChannel, doEscapingScale ); // value bounds after filter also scaled.

            ++filterIndex;

          } // outChannelSub, outChannel
        } // inChannelPartIndex
      } // inChannel
    } // this.filtersArray

    if ( this.biasesArray ) {
      let outChannel = 0;

      InChannelPartIndexLoop:
      for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
        let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
          if ( outChannel >= this.outputChannelCount )
            break InChannelPartIndexLoop; // Never exceeds the total output channel count.

          let doEscapingScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
          this.biasesArray[ biasIndex ] *= doEscapingScale; // bias wieghts scaled.

          this.boundsArraySet.afterBias.multiply_one_byN( outChannel, doEscapingScale ); // value bounds after bias also scaled.

          ++biasIndex;

        } // outChannelSub, outChannel
      } // inChannelPartIndex

    } else { // ( !this.biasesArray ). No biases array to be extracted.
      // Do nothing.
    }
  }

  /**
   * Shuffle (.filtersArray, .biasesArray, .boundsArraySet) by interleaving.
   *   - Only ( outputGroupCount == 2 ) is supported.
   *   - The output channel count must be even (i.e. divisible by 2).
   *
   *
   */
  output_interleave_asGrouptTwo() {

    tf.util.assert( ( this.channelShuffler_outputGroupCount == 2 ),
      `Pointwise.FiltersArray_BiasesArray.interleave_byGrouptTwo(): `
        + `channelShuffler_outputGroupCount ( ${this.channelShuffler_outputGroupCount} ) only 2 is supported.`
    );

    tf.util.assert( ( ( this.outputChannelCount % 2 ) == 0 ),
      `Pointwise.FiltersArray_BiasesArray.interleave_byGrouptTwo(): `
        + `output channel count ( ${this.outputChannelCount} ) must be even (i.e. divisible by 2).`
    );

    let arrayTemp = new Array( this.outputChannelCount );

    for ( let indexBegin = 0; i < this.inputChannelCount; indexBegin += this.outputChannelCount ) { // Shuffle filters.
      FloatValue.ArrayInterleaver.interleave_asGrouptTwo( this.filtersArray, indexBegin, this.outputChannelCount, arrayTemp );
    }

    FloatValue.ArrayInterleaver.interleave_asGrouptTwo( this.biasesArray, 0, this.biasesArray.length, arrayTemp ); // Shuffle biases.

    this.boundsArraySet.output_interleave_asGrouptTwo( arrayTemp ); // Shuffle bounds array set of output.
  }

}
