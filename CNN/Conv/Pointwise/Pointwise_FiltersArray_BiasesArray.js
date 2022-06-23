export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Pool from "../../util/Pool.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "./Pointwise_ChannelPartInfo.js";
import { ChannelPartInfoPool, FiltersBiasesPartInfoPool } from  "./Pointwise_ChannelPartInfo.js";

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
 * @member {BoundsArraySet.Pointwise} boundsArraySet
 *   The element value bounds (per channel) of this pointwise convolution.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this pointwise convolutiuon.
 *     - Usually, if ( outputChannelCount == 0 ), it means no operation at all (i.e. bPointwise == bExisted == false ).
 *     - However, if ( outputChannelCount == 0 ) but ( channelShuffler_outputGroupCount > 0 ), this pointwise will exist
 *         (i.e. bPointwise == bExisted == true ) and always will not have biases (no matter how bBias is). It is
 *         all-pass-through-and-channel-shuffling mode.
 *
 * @member {number} nPassThroughStyleId
 *   The pass-through style id (ValueDesc.PassThroughStyle.Singleton.Ids.Xxx) of this convolution. It only affect the channels
 * which need to be pass-through from input to output.
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
 *         (for pointwise1 of ShuffleNetV2_ByMobileNetV1's head),
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
 *         (for pointwise1 of ShuffleNetV2_ByMobileNetV1's head),
 *         the filters for the output channels between ( outputChannelCount_lowerHalf ) and ( outputChannelCount - 1 ) will just copy
 *         the input channels between 0 and ( outputChannelCount_lowerHalf - 1 ).
 *
 *     - 2.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *   - 3. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE ):
 *          
 *     - 3.1 If ( outputChannelCount > 0 ), (i.e. bHigherHalfAnotherPointwise),
 *         (for pointwise2 of ShuffleNetV2_ByMobileNetV1's head),
 *         the filters for the input channels between 0 and ( inputChannelCount_lowerHalf - 1 ) are pointwise21, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are pointwise212. These two filters (and biases)
 *         will be extracted in sequence, but they will be combined into one larger filters (and biases). This makes these
 *         filters' (and biases') weights are arranged the same as pointwise2 of ShuffleNetV2_ByPointwise22's head. So that
 *         the same filters weights could be used in these two architectures for comparing performance and correctness.
 *
 *      - 3.1.1 If ( channelShuffler_outputGroupCount <= 0 ), (i.e. bHigherHalfAnotherPointwise).
 *          (Not used.)
 *
 *      - 3.1.2 If ( channelShuffler_outputGroupCount > 0 ), (i.e. bHigherHalfAnotherPointwiseShuffle).
 *          (for pointwise2 of ShuffleNetV2_ByMobileNetV1's head with channel shuffling)
 *          The output channels will be arranged just like applying channel shuffler on them.
 *
 *     - 3.2 If ( outputChannelCount <= 0 ), no poitwise convolution, no bias, no channel shuffler. ( bPointwise == bExisted == false ).
 *
 *  - 4. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ):
 *      (for pointwise1/pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *
 *    - 4.1 If ( outputChannelCount > 0 ), the filters for the output channels between ( outputChannelCount_lowerHalf )
 *        and ( outputChannelCount - 1 ) will just pass through the input to output.
 *
 *      - 4.1.1 If ( channelShuffler_outputGroupCount <= 0 ), (i.e. bHigherHalfPassThrough).
 *          (for pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *
 *      - 4.1.2 If ( channelShuffler_outputGroupCount > 0 ), (i.e. bHigherHalfPassThroughShuffle).
 *          (for pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *          The output channels will be arranged just like applying channel shuffler on them.
 *

//!!! ...unfinished... (2022/05/20) Perhaps, deprecate this special case. Since pointwise2 always exists now.

 *    - 4.2 If ( outputChannelCount <= 0 ), the filters will just pass through all input channels to output. In this case,
 *        the ( bPointwise == bExisted == true ) (not false), although the specified outputChannelCount is zero. And, it
 *        will always have no biases (no matter how bBias is).
 *
 *      - 4.2.1 If ( channelShuffler_outputGroupCount <= 0 ), (i.e. bAllPassThrough; no pointwise and no channel shuffler).
 *          (for pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *
 *      - 4.2.2 If ( channelShuffler_outputGroupCount > 0 ), (i.e. bAllPassThroughShuffle).
 *          (for pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *          The output channels will be arranged just like applying channel shuffler on them.
 *
 *
 * @member {boolean} bHigherHalfDifferent
 *   It will be false, if ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE ).
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half input channel count when ( bHigherHalfDifferent == true ). It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half output channel count when ( bHigherHalfDifferent == true ). It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} channelShuffler_outputGroupCount
 *   The output group count of the channel shuffler. Usually, it is used when:
 *   - ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE ).
 *   - ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ).
 *
 * @member {number} tensorWeightCountTotal_internal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted_internal
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
let FiltersArray_BiasesArray = ( ParentClass = Object ) => class FiltersArray_BiasesArray extends ParentClass {

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount,
    ...restArgs ) {

    super( ...restArgs );
      
    this.setAsConstructor(
      inputChannelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount,
      ...restArgs );
  }

 /**
   * @return {FiltersArray_BiasesArray}
   *   Return the this object.
   */
  setAsConstructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount,
    ...restArgs ) {

    if ( super.setAsConstructor instanceof Function )
      super.setAsConstructor( ...restArgs ); // 0. All other arguments passed to parent class.

    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nPassThroughStyleId = nPassThroughStyleId;

    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;

    this.tensorWeightCountExtracted_internal = 0;
    this.tensorWeightCountTotal_internal = 0;

    tf.util.assert( ( inputChannelCount > 0 ),
      `Pointwise.FiltersArray_BiasesArray.setAsConstructor(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) must be positive integer.`
    );

    if ( this.bHigherHalfDifferent ) {
      tf.util.assert( ( this.inputChannelCount_lowerHalf <= inputChannelCount ),
        `Pointwise.FiltersArray_BiasesArray.setAsConstructor(): `
          + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) can not be larger than `
          + `inputChannelCount ( ${this.inputChannelCount} ).`
      );

      if ( this.outputChannelCount > 0 ) {
        tf.util.assert( ( this.outputChannelCount_lowerHalf <= outputChannelCount ),
          `Pointwise.FiltersArray_BiasesArray.setAsConstructor(): `
            + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) can not be larger than `
            + `outputChannelCount ( ${this.outputChannelCount} ).`
        );

      } else { // ( this.outputChannelCount <= 0 ), the outputChannelCount_Real will be inputChannelCount.
        tf.util.assert( ( this.outputChannelCount_lowerHalf <= inputChannelCount ),
          `Pointwise.FiltersArray_BiasesArray.setAsConstructor(): `
            + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) can not be larger than `
            + `inputChannelCount ( ${this.inputChannelCount} ) when `
            + `outputChannelCount ( ${this.outputChannelCount} ) is zero or negative.`
        );
      }

      tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ) == ( this.outputChannelCount_lowerHalf > 0 ),
        `Pointwise.FiltersArray_BiasesArray.setAsConstructor(): `
          + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) and `
          + `outputChannelCount_lowerHalf ( ${this.outputChannelCount_lowerHalf} ) `
          + `should be both positive or both not.`
      );
    }

    return this;
  }

  /**
   * Extract pointwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted_internal
   *   - this.tensorWeightCountTotal_internal
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
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo ) {

    let bInitOk;

    Pool.Array.Singleton.sessionCall( () => {

      // It will be filled with: [ boundsArraySet, filtersShape, filtersArray, biasesShape, biasesArray ].
      // It is mainly used for preventing these elements been recycled by itself recycling pool.
      //
      let keptObjectArray = Pool.Array.Singleton.get_or_create_by( 5 );

      FiltersBiasesPartInfoPool.Singleton.sessionCall( () => {
        ChannelPartInfoPool.Singleton.sessionCall( () => {
          Pool.Array.Singleton.sessionCall( () => {

            bInitOk = FiltersArray_BiasesArray.init_internal.call( this,
              inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo );

            keptObjectArray[ 0 ] = this.boundsArraySet;
            keptObjectArray[ 1 ] = this.filtersShape;
            keptObjectArray[ 2 ] = this.filtersArray;
            keptObjectArray[ 3 ] = this.biasesShape;
            keptObjectArray[ 4 ] = this.biasesArray;

            return keptObjectArray;
          } )
        } )
      } );

    } );

    return bInitOk;
  }

  /**
   * Extract pointwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted_internal
   *   - this.tensorWeightCountTotal_internal
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
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {boolean} Return true, if succeeded.
   */
  static init_internal( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    tf.util.assert( ( this.inputChannelCount == inputScaleBoundsArray.length ),
      `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as `
        + `outputChannelCount of previous convolution-bias-activation ( ${inputScaleBoundsArray.length} ).`
    );

    tf.util.assert( ( this.inputChannelCount == inputScaleBoundsArray.scaleArraySet.undo.length ),
      `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as the length of `
        + `.output.scaleArraySet.undo of previous convolution-bias-activation `
        + `( ${inputScaleBoundsArray.scaleArraySet.undo.length} ).`
    );

    //
    // Note: Even if ( this.outputChannelCount <= 0 ), this function should work correctly as pass-through input to output.
    // In fact, this condition is used for all-pass-through-shuffle.
    //

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // Calculate lower half and higher half channel count. (Even if ( bHigherHalfDifferent == false ), these are still correct.)
    {
      if ( this.inputChannelCount_lowerHalf != undefined )
        this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

      if ( this.outputChannelCount_lowerHalf != undefined )
        this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;
    }

    // Determine shape of the filters, biases, channels.
    let aChannelPartInfoArray;
    let aFiltersBiasesPartInfoArray;
    let filtersWeightCount_extracted, biasesWeightCount_extracted;

    // Set up aFiltersBiasesPartInfoArray and filtersShape and biasesShape.
    {
      switch ( this.nHigherHalfDifferent ) {
        // 3.0 Normal pointwise convolution and bias.
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
          this.outputChannelCount_Real = this.outputChannelCount;

          // Extract all weights as specified input/output channels.          
          filtersWeightCount_extracted = this.inputChannelCount * this.outputChannelCount;
          biasesWeightCount_extracted = this.outputChannelCount;

//!!! (2022/06/22 Remarked) Replaced by pool.
//           aFiltersBiasesPartInfoArray = [
//             new FiltersBiasesPartInfo(
//               new ChannelPartInfo( 0, this.inputChannelCount, this.outputChannelCount, false ) ] )
//           ];

          aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
          aChannelPartInfoArray[ 0 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by( 0, this.inputChannelCount, this.outputChannelCount, false );

          aFiltersBiasesPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
          aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );
          break;

        // 3.1 bHigherHalfCopyLowerHalf_LowerHalfPassThrough
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH: // (1)
          this.outputChannelCount_Real = this.outputChannelCount;
          filtersWeightCount_extracted = biasesWeightCount_extracted = 0; // Does not extract any weights.

//!!! (2022/06/22 Remarked) Replaced by pool.
//           aFiltersBiasesPartInfoArray = [
//             new FiltersBiasesPartInfo( [
//               new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  true ),
//               new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true ) ] )
//           ];

          aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 2 );
          aChannelPartInfoArray[ 0 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  true );
          aChannelPartInfoArray[ 1 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true );

          aFiltersBiasesPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
          aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );
          break;

        // 3.2 bHigherHalfCopyLowerHalf
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF: // (2)
          this.outputChannelCount_Real = this.outputChannelCount;

          filtersWeightCount_extracted = this.inputChannelCount_lowerHalf * this.outputChannelCount_lowerHalf;
          biasesWeightCount_extracted = this.outputChannelCount_lowerHalf;

//!!! (2022/06/22 Remarked) Replaced by pool.
//           aFiltersBiasesPartInfoArray = [
//             new FiltersBiasesPartInfo( [
//               new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf, false ),
//               new ChannelPartInfo( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true ) ] )
//           ];

          aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 2 );
          aChannelPartInfoArray[ 0 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf, false );
          aChannelPartInfoArray[ 1 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by( 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_higherHalf, true );

          aFiltersBiasesPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
          aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );
          break;

        // 3.3 bHigherHalfAnotherPointwise
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE: // (3)
          this.outputChannelCount_Real = this.outputChannelCount;

          filtersWeightCount_extracted =
              ( this.inputChannelCount_lowerHalf * this.outputChannelCount_lowerHalf )
            + ( this.inputChannelCount_higherHalf * this.outputChannelCount_higherHalf );

          biasesWeightCount_extracted = this.outputChannelCount;

//!!! (2022/06/22 Remarked) Replaced by pool.
//           aFiltersBiasesPartInfoArray = [
//             new FiltersBiasesPartInfo( [
//               new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false ),
//             ] ),
//             new FiltersBiasesPartInfo( [
//               new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf, false ),
//             ] )
//           ];


          aFiltersBiasesPartInfoArray = Pool.Array.Singleton.get_or_create_by( 2 );

          {
            aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
            aChannelPartInfoArray[ 0 ]
              = ChannelPartInfoPool.Singleton.get_or_create_by(
                                                 0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false );

            aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );
          }

          {
            aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
            aChannelPartInfoArray[ 0 ]
              = ChannelPartInfoPool.Singleton.get_or_create_by(
                  this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf, false );

            aFiltersBiasesPartInfoArray[ 1 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );
          }
          break;

        // 3.4 bHigherHalfPassThrough
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (4)

//!!! (2022/06/22 Remarked) Deprecate ( outputChannelCount <= 0 ), // 3.4.2.1 bAllPassThrough
//          if ( this.outputChannelCount > 0 ) { // 3.4.1.1 bHigherHalfPassThrough

          this.outputChannelCount_Real = this.outputChannelCount;

          filtersWeightCount_extracted = this.inputChannelCount_lowerHalf * this.outputChannelCount_lowerHalf;
          biasesWeightCount_extracted = this.outputChannelCount_lowerHalf;

//!!! (2022/06/22 Remarked) Replaced by pool.
//           aFiltersBiasesPartInfoArray = [
//             new FiltersBiasesPartInfo( [
//               new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false ),
//               new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf,  true ) ] )
//             ];

          aChannelPartInfoArray = Pool.Array.Singleton.get_or_create_by( 2 );
          aChannelPartInfoArray[ 0 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by(
                                               0, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,  false );

          aChannelPartInfoArray[ 1 ]
            = ChannelPartInfoPool.Singleton.get_or_create_by(
                this.inputChannelCount_lowerHalf, this.inputChannelCount,           this.outputChannelCount_higherHalf,  true );

          aFiltersBiasesPartInfoArray = Pool.Array.Singleton.get_or_create_by( 1 );
          aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfoPool.Singleton.get_or_create_by( aChannelPartInfoArray );


          // Note: If ( HIGHER_HALF_PASS_THROUGH ) with ( inputChannelCount_lowerHalf == 0 ) and ( outputChannelCount_lowerHalf == 0 ),
          // the result should be the same as AllPassThrough without using special ( outputChannelCount <= 0 ). In that case, however,
          // the bAllPassThrough will be false.


//!!! (2022/06/22 Remarked) Deprecate ( outputChannelCount <= 0 ), // 3.4.2.1 bAllPassThrough
//           } else { // ( outputChannelCount <= 0 ), // 3.4.2.1 bAllPassThrough
//
// //!!! ...unfinished... (2022/05/20)
//             // Perhaps, deprecate this special case. Since pointwise2 always exists now.
//             // So assert if executed here.
//             tf.util.assert( false,
//               `Pointwise.FiltersArray_BiasesArray.init(): `
//                 + `outputChannelCount ( ${this.outputChannelCount} ) shoulde be positive.`
//             );
//
//             this.bAllPassThrough = true; // Marked for this special case.
//             this.outputChannelCount_Real = this.inputChannelCount; // (Note: In this case, this.outputChannelCount is zero. So use inputChannelCount.)
//             filtersWeightCount_extracted = biasesWeightCount_extracted = 0; // Does not extract any weights.
//             aFiltersBiasesPartInfoArray = [
//               new FiltersBiasesPartInfo( [
//                 new ChannelPartInfo( 0, this.inputChannelCount, this.outputChannelCount_Real, true ) ] )
//             ];
//          }
          break;

        default:
          tf.util.assert( ( false ),
            `Pointwise.FiltersArray_BiasesArray.init(): `
              + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) is unknown value.`
          );
          break;
      }

      this.filtersShape = Pool.Array.Singleton.get_or_create_by( 4 );
      this.filtersShape[ 0 ] = 1;
      this.filtersShape[ 1 ] = 1;
      this.filtersShape[ 2 ] = this.inputChannelCount;
      this.filtersShape[ 3 ] = this.outputChannelCount_Real;

      if ( this.bBias ) {
        this.biasesShape = Pool.Array.Singleton.get_or_create_by( 1 );
        this.biasesShape[ 0 ] = this.outputChannelCount_Real;
      } else {
        biasesWeightCount_extracted = 0;
      }
    }

    // Prepare result filters and biases array.
    if ( this.filtersShape )
      this.filtersArray = Pool.Array.Singleton.get_or_create_by( tf.util.sizeFromShape( this.filtersShape ) );
    if ( this.biasesShape )
      this.biasesArray = Pool.Array.Singleton.get_or_create_by( tf.util.sizeFromShape( this.biasesShape ) );

    // Calculate weights count of filters and biases to be extracted.
    let weightsCount_extracted = 0;
    if ( filtersWeightCount_extracted )
      weightsCount_extracted += filtersWeightCount_extracted;
    if ( biasesWeightCount_extracted )
      weightsCount_extracted += biasesWeightCount_extracted;

    // Prepare source weights to be extracted.
    let sourceWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, weightsCount_extracted );
    if ( !sourceWeights.extract() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = sourceWeights.defaultByteOffsetEnd;
    this.tensorWeightCountExtracted_internal = weightsCount_extracted;

    // filters and bias: weights and value bounds.
    //
    // It should be better to calculate per channel value bounds by real filter and bias value (i.e. not by an estimated value bounds).
    // This is especialy important for ActivationEscaping. Because inputDomainLinear of activation function is not wide, using looser
    // value bounds estimation has higher possibility to lost information.
    //
    // Two-rounds processing is used:
    //
    //   - In the 1st round, extracting filter and bias value from sourceWeights[]. At the same time, calculating .afterFilter and
    //       .afterBias by these extracted values combined with undoPreviousEscapingScale
    //       (i.e. inputScaleBoundsArray.scaleArraySet.undo.scales[ inChannel ]). And then,
    //       Find out .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation.
    //
    //   - In the 2nd round, apply doEscapingScale (i.e. .activationEscaping_ScaleArraySet.do.scales[ outChannel ] )
    //       to filter and bias value (and also .afterFilter and .afterBias).
    //
    {
      // Round 0
      {
        // Initialize element value bounds (per channel). Determine .input and .afterUndoPreviousActivationEscaping

//!!! (2022/06/22 Remarked) Use pool instead.
//        this.boundsArraySet = new BoundsArraySet.Pointwise( inputScaleBoundsArray, this.outputChannelCount_Real );

        this.boundsArraySet = BoundsArraySet.PointwisePool.Singleton.get_or_create_by( inputScaleBoundsArray, this.outputChannelCount_Real );
      }

      // Round 1
      {
        this.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
          sourceWeights.weights, inputScaleBoundsArray, aFiltersBiasesPartInfoArray );

        this.boundsArraySet.set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray );

        // Determine .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation
        this.boundsArraySet.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( this.nActivationId );
      }

      // Round 2
      this.apply_doEscapingScale_to_filtersArray_biasesArray(); // Apply doEscapingScale.
    }

    // Shuffle channels.
    if ( this.channelShuffler_outputGroupCount > 0 ) { // Pre-shuffle channels by shuffling the filters and biases.

      switch ( this.nHigherHalfDifferent ) {

        // 3.3
        // 3.4
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE: // (3)
        case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (4)

          // 3.3.1.2 bHigherHalfAnotherPointwiseShuffle
          // 3.4.1.2 bHigherHalfPassThroughShuffle
          // 3.4.2.2 bAllPassThroughShuffle
          this.set_filters_biases_outputScaleBoundsArray_all_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo );
          break;

        default:
          tf.util.assert( false,
            `Pointwise.FiltersArray_BiasesArray.init(): `
              + `channelShuffler_outputGroupCount (${this.channelShuffler_outputGroupCount}) should be zero when `
              + `nHigherHalfDifferent=`
                + `${ValueDesc.Pointwise_HigherHalfDifferent.Singleton.getStringOf( this.nHigherHalfDifferent )}`
                + `(${this.nHigherHalfDifferent}). `
              + `Usually, only HIGHER_HALF_PASS_THROUGH could have channel shuffler.`
          );
          break;
      }
    }

    {
      this.tensorWeightCountTotal_internal = 0;

      if ( this.filtersShape )
        this.tensorWeightCountTotal_internal += tf.util.sizeFromShape( this.filtersShape );

      if ( this.biasesShape )
        this.tensorWeightCountTotal_internal += tf.util.sizeFromShape( this.biasesShape );
    }

    return true;
  }

  /**
   * Extract this.filtersArray and this.biasesArray from sourceFloat32Array and
   * apply inputScaleBoundsArray.scaleArraySet.undo.scales[]. Also set the .afterFilter and .afterBias.
   *
   * @param {Float32Array} sourceFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Pointwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
    sourceFloat32Array, inputScaleBoundsArray, aFiltersBiasesPartInfoArray ) {

    const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfoById( this.nPassThroughStyleId );
    let tBounds = new FloatValue.Bounds( 0, 0 );

    // Init
    {
      this.boundsArraySet.afterFilter.set_all_byN( 0 ); // Init .afterFilter
      this.boundsArraySet.afterBias.set_all_byN( 0 );   // Init .afterBias

      if ( this.biasesArray ) {
        this.biasesArray.fill( 0 );
      }
    }

    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex = 0, filterIndex = 0, biasIndex = 0;

    let outChannelBegin = 0, outChannelEnd = 0; // [ outChannelBegin, outChannelEnd ) are output channels of the current FiltersBiasesPart.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      filterIndex = outChannelBegin = outChannelEnd; // Begin from the ending of the previous FiltersBiasesPart.

      { // this.filtersArray

        for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

          let undoPreviousEscapingScale = inputScaleBoundsArray.scaleArraySet.undo.scales[ inChannel ];
          let filterValuePassThrough = thePassThroughStyleInfo.filterValue * undoPreviousEscapingScale;
          let outChannel = outChannelBegin;

          InChannelPartIndexLoop:
          for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
            let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
            let inChannelToPartBegin = inChannel - inChannelPartInfo.inChannelBegin;

            for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
              if ( outChannel >= this.outputChannelCount )
                break InChannelPartIndexLoop; // Never exceeds the total output channel count.

              // Note: The .afterUndoPreviousActivationEscaping has already been multiplied by undoPreviousEscapingScale.

              if ( ( inChannelToPartBegin >= 0 ) && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {
                if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                  if ( inChannelToPartBegin == outChannelSub ) { // The only one filter position (in the pass-through part) may have non-zero value.
                    this.filtersArray[ filterIndex ] = filterValuePassThrough;
                    tBounds
                      .set_byBoundsArray( this.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel )
                      .multiply_byN( thePassThroughStyleInfo.filterValue );

                  } else {
                    this.filtersArray[ filterIndex ] = 0; // All other filter positions (in the pass-through part) are zero.
                    tBounds.set_byN( 0 );
                  }

                } else { // Non-pass-through half channels.
                  let sourceWeight = sourceFloat32Array[ sourceIndex ];
                  ++sourceIndex;

                  this.filtersArray[ filterIndex ] = sourceWeight * undoPreviousEscapingScale;
                  tBounds
                    .set_byBoundsArray( this.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel )
                    .multiply_byN( sourceWeight );
                }

                // Determine .afterFilter
                this.boundsArraySet.afterFilter.add_one_byBounds( outChannel, tBounds );

              } else {
                this.filtersArray[ filterIndex ] = 0; // All input channels which is not in range use zero filter to ignore the inputs.
              }

              ++filterIndex;

            } // outChannelSub, outChannel
          } // inChannelPartIndex

          outChannelEnd = outChannel; // Record the ending output channel index of the current FiltersBiasesPart.
          filterIndex += ( this.outputChannelCount_Real - outChannel ) + outChannelBegin; // Jump to the outChannelBegin of the next inChannel.

        } // inChannelSub, inChannel

      } // this.filtersArray


      if ( this.biasesArray ) {
        let biasValue;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

            // Note: bias is not responsible for undoPreviousEscapingScale. (i.e. the filter already done it)

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              biasValue = thePassThroughStyleInfo.biasValue;

            } else { // Non-pass-through half channels.
              biasValue = sourceFloat32Array[ sourceIndex ];
              ++sourceIndex;
            }

            this.biasesArray[ biasIndex ] += biasValue; // Note: Use adding instead of assignment.

            // Determine .afterBias
            this.boundsArraySet.afterBias.add_one_byN( outChannel, biasValue ); // Shift the value bounds by the bias.

            ++biasIndex;

          } // outChannelSub, outChannel
        } // inChannelPartIndex

      } else { // ( !this.biasesArray ). No biases array to be extracted.
        // Do nothing.
      }

    } // aFiltersBiasesPartIndex

    // Combine .afterFilter to .afterBias.
    //
    // Q: Why not combine when initializing .afterBias ?
    // A: Because .afterFilter is unknown before FiltersBiasesPartInfoArray has been visited totally.
    //
    this.boundsArraySet.afterBias.add_all_byBoundsArray( this.boundsArraySet.afterFilter );

    tf.util.assert( ( outChannelEnd == this.outputChannelCount_Real ),
      `Pointwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(): `
        + `aFiltersBiasesPartInfoArray[ inChannelPartInfoArray[] ] total output channel count ( ${outChannelEnd} ) `
        + `should be ( ${this.outputChannelCount_Real} ).` );
  }

  /**
   * Apply this.boundsArraySet.output0.scaleArraySet.do.scales[] to this.filtersArray and this.biasesArray.
   */
  apply_doEscapingScale_to_filtersArray_biasesArray() {

    { // this.filtersArray
      let filterIndex = 0;

      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
        for ( let outChannel = 0; outChannel < this.outputChannelCount; ++outChannel ) {

          let doEscapingScale = this.boundsArraySet.output0.scaleArraySet.do.scales[ outChannel ];
          this.filtersArray[ filterIndex ] *= doEscapingScale; // filter wieghts scaled.

          ++filterIndex;

        } // outChannel
      } // inChannel
    } // this.filtersArray

    if ( this.biasesArray ) {
      let biasIndex = 0;

      for ( let outChannel = 0; outChannel < this.outputChannelCount; ++outChannel ) {

        let doEscapingScale = this.boundsArraySet.output0.scaleArraySet.do.scales[ outChannel ];
        this.biasesArray[ biasIndex ] *= doEscapingScale; // bias wieghts scaled.

        ++biasIndex;

      } // outChannel

    } else { // ( !this.biasesArray ). No biases array to be extracted.
      // Do nothing.
    }
  }

  /**
   * Shuffle (.filtersArray, .biasesArray, .boundsArraySet) by interleaving.
   *   - Only ( outputGroupCount == 2 ) is supported.
   *   - The output channel count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   */
  set_filters_biases_outputScaleBoundsArray_all_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo ) {

    tf.util.assert( ( this.channelShuffler_outputGroupCount == 2 ),
      `Pointwise.FiltersArray_BiasesArray.interleave_byGrouptTwo(): `
        + `channelShuffler_outputGroupCount ( ${this.channelShuffler_outputGroupCount} ) only 2 is supported.`
    );

    tf.util.assert( ( ( this.outputChannelCount % 2 ) == 0 ),
      `Pointwise.FiltersArray_BiasesArray.interleave_byGrouptTwo(): `
        + `output channel count ( ${this.outputChannelCount} ) must be even (i.e. divisible by 2).`
    );

    { // Shuffle filters.
      let filtersWeightsCount = this.inputChannelCount * this.outputChannelCount;

      for ( let indexBegin = 0; indexBegin < filtersWeightsCount; indexBegin += this.outputChannelCount ) {
        FloatValue.ArrayInterleaver.interleave_asGrouptTwo(
          this.filtersArray, indexBegin, this.outputChannelCount, arrayTemp_forInterleave_asGrouptTwo );
      }
    }

    if ( this.biasesArray )
      FloatValue.ArrayInterleaver.interleave_asGrouptTwo(
        this.biasesArray, 0, this.biasesArray.length, arrayTemp_forInterleave_asGrouptTwo ); // Shuffle biases.

    this.boundsArraySet.set_outputs_all_byInterleave_asGrouptTwo(
      arrayTemp_forInterleave_asGrouptTwo ); // Shuffle bounds array set of output.
  }


  get bHigherHalfDifferent() {
    return ( this.nHigherHalfDifferent ) && ( this.nHigherHalfDifferent != ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE );
  }

}
