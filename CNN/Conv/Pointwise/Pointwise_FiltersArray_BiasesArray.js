export { FiltersArray_BiasesArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { ChannelPartInfo, FiltersBiasesPartInfo }
  from "./Pointwise_ChannelPartInfo.js";

/**
 * Extract pointwise convolution filters and biases.
 *
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray
 * by init().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from
 * inputWeightArray by init(). Where to extract next weights. Only meaningful
 * if .init() returns true.
 *
 * @member {BoundsArraySet.Pointwise} boundsArraySet
 *   The element value bounds (per channel) of this pointwise convolution.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this pointwise convolutiuon.
 *     - Usually, if ( outputChannelCount == 0 ), it means no operation at all
 *         (i.e. bPointwise == bExisted == false ).
 *
 * @member {number} nPassThroughStyleId
 *   The pass-through style id (ValueDesc.PassThroughStyle.Singleton.Ids.Xxx)
 * of this convolution. It only affect the channels which need to be
 * pass-through from input to output.
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   - 0. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE ),
 *         it is just a normal poitwise convolution.
 *         (i.e. normal poitwise convolution)
 *
 *   - 1. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH ):
 *         (i.e. bHigherHalfCopyLowerHalf_LowerHalfPassThrough),
 *         (for pointwise1 of ShuffleNetV2_ByMobileNetV1's head),
 *         the filters for the output channels between 0 and
 *         ( outputChannelCount_lowerHalf - 1 ) will just pass through the
 *         input to output. The filters for the output channels between
 *         ( outputChannelCount_lowerHalf ) and ( outputChannelCount - 1 ) will
 *         just copy the input channels between 0 and
 *         ( outputChannelCount_lowerHalf - 1 ). In this case, it will always
 *         have no biases (no matter how bBias is).
 *
 *   - 2. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF ):
 *         (i.e. bHigherHalfCopyLowerHalf),
 *         (for pointwise1 of ShuffleNetV2_ByMobileNetV1's head),
 *         the filters for the output channels between
 *         ( outputChannelCount_lowerHalf ) and ( outputChannelCount - 1 ) will
 *         just copy the input channels between 0 and
 *         ( outputChannelCount_lowerHalf - 1 ).
 *
 *   - 3. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE ):
 *         (i.e. bHigherHalfAnotherPointwise),
 *         (for pointwise2 of ShuffleNetV2_ByMobileNetV1's head),
 *         the filters for the input channels between 0 and
 *         ( inputChannelCount_lowerHalf - 1 ) are pointwise21, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are
 *         pointwise212. These two filters (and biases) will be extracted in
 *         sequence, but they will be combined into one larger filters (and
 *         biases). This makes these filters' (and biases') weights are
 *         arranged the same as pointwise2 of ShuffleNetV2_ByPointwise22's
 *         head. So that the same filters weights could be used in these two
 *         architectures for comparing performance and correctness.
 *
 *     - 3.1 If ( channelShuffler_outputGroupCount <= 0 ),
 *           (i.e. bHigherHalfAnotherPointwise).
 *           (Not used.)
 *
 *     - 3.2 If ( channelShuffler_outputGroupCount > 0 ),
 *           (i.e. bHigherHalfAnotherPointwiseShuffle).
 *           (for pointwise2 of ShuffleNetV2_ByMobileNetV1's head with channel
 *              shuffling)
 *           The output channels will be arranged just like applying channel
 *           shuffler on them.
 *
 *   - 4. If ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ):
 *        the filters for the output channels between
 *        ( outputChannelCount_lowerHalf ) and ( outputChannelCount - 1 ) will
 *        just pass through the input to output.
 *
 *     - 4.1 If ( channelShuffler_outputGroupCount <= 0 ),
 *           (i.e. bHigherHalfPassThrough).
 *           (for pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *
 *     - 4.2 If ( channelShuffler_outputGroupCount > 0 ),
 *           (i.e. bHigherHalfPassThroughShuffle).
 *           (for pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
 *           The output channels will be arranged just like applying channel
 *           shuffler on them.
 *
 * @member {boolean} bHigherHalfDifferent
 *   It will be false, if ( nHigherHalfDifferent
 * == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE ).
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half input channel count when ( bHigherHalfDifferent == true ).
 * It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half output channel count when ( bHigherHalfDifferent == true ).
 * It is ignored when ( bHigherHalfDifferent == false ).
 *
 * @member {number} channelShuffler_inputGroupCount
 *   The input group count of the channel shuffler. Usually, it is used for
 * undo previous operation's channel shuffling. If 0, the inputScaleBoundsArray
 * will be used. If positive (only 2 is supported currently), the
 * inputScaleBoundsArray.beforeChannelShuffled will be used.
 *
 * @member {number} channelShuffler_outputGroupCount
 *   The output group count of the channel shuffler. Usually, it is used when:
 *   - ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE ).
 *   - ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ).
 *
 * @member {number} tensorWeightCountTotal_internal
 *   The total wieght count used in tensors. Not including Params, because they
 * are not used in tensors. Including inferenced weights, if they are used in
 * tensors.
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
 * @member {boolean} bInitOk
 *   If .init() success, it will be true.
 *
 */
let FiltersArray_BiasesArray = ( ParentClass = Object ) =>
  class FiltersArray_BiasesArray extends Weights.Base( ParentClass ) {

  /**
   * Used as default Pointwise.FiltersArray_BiasesArray provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.FiltersArray_BiasesArray.Pool",
    FiltersArray_BiasesArray );

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent,
    inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount,
    ...restArgs ) {

    super( ...restArgs );
      
    this.#setAsConstructor_self(
      inputChannelCount, outputChannelCount,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent,
      inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );
  }

  /** @override */
  setAsConstructor(
    inputChannelCount, outputChannelCount,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent,
    inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount,
    ...restArgs ) {

    super.setAsConstructor( ...restArgs );

    this.#setAsConstructor_self(
      inputChannelCount, outputChannelCount,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent,
      inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );
  }

  /**  */
  #setAsConstructor_self(
    inputChannelCount, outputChannelCount,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent,
    inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nPassThroughStyleId = nPassThroughStyleId;

    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;
    this.channelShuffler_inputGroupCount = channelShuffler_inputGroupCount;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;

    this.tensorWeightCountTotal_internal = 0;

    if ( inputChannelCount <= 0 )
      throw Error( `Pointwise.FiltersArray_BiasesArray`
        + `.#setAsConstructor_self(): `
        + `inputChannelCount ( ${inputChannelCount} ) `
        + `must be positive integer.`
      );

    if ( this.bHigherHalfDifferent ) {
      if ( this.inputChannelCount_lowerHalf > inputChannelCount )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.#setAsConstructor_self(): `
          + `inputChannelCount_lowerHalf ( ${inputChannelCount_lowerHalf} ) `
          + `can not be larger than `
          + `inputChannelCount ( ${inputChannelCount} ).`
        );

      if ( outputChannelCount_lowerHalf > outputChannelCount )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.#setAsConstructor_self(): `
          + `outputChannelCount_lowerHalf ( ${outputChannelCount_lowerHalf} ) `
          + `can not be larger than `
          + `outputChannelCount ( ${outputChannelCount} ).`
        );

      if ( ( inputChannelCount_lowerHalf > 0 )
             != ( outputChannelCount_lowerHalf > 0 ) )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.#setAsConstructor_self(): `
          + `inputChannelCount_lowerHalf ( ${inputChannelCount_lowerHalf} ) `
          + `and `
          + `outputChannelCount_lowerHalf ( ${outputChannelCount_lowerHalf} ) `
          + `should be both positive or both not.`
        );
    }
  }

  /** @override */
  disposeResources() {

    if ( this.boundsArraySet ) {
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }

    if ( this.biasesArray ) {
      this.biasesArray.disposeResources_and_recycleToPool();
      this.biasesArray = null;
    }

    if ( this.biasesShape ) {
      this.biasesShape.disposeResources_and_recycleToPool();
      this.biasesShape = null;
    }

    if ( this.filtersArray ) {
      this.filtersArray.disposeResources_and_recycleToPool();
      this.filtersArray = null;
    }

    if ( this.filtersShape ) {
      this.filtersShape.disposeResources_and_recycleToPool();
      this.filtersShape = null;
    }

    this.inputChannelCount_higherHalf = undefined;
    this.outputChannelCount_higherHalf = undefined;

    this.tensorWeightCountTotal_internal = undefined;

    this.channelShuffler_outputGroupCount = undefined;
    this.channelShuffler_inputGroupCount = undefined;
    this.outputChannelCount_lowerHalf = undefined;
    this.inputChannelCount_lowerHalf = undefined;

    this.nHigherHalfDifferent = undefined;

    this.nPassThroughStyleId = undefined;
    this.nActivationId = undefined;
    this.bBias = undefined;
    this.outputChannelCount = undefined;
    this.inputChannelCount = undefined;

    super.disposeResources();
  }

  /**
   * Extract pointwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.weightElementOffsetBegin
   *   - this.weightElementOffsetEnd
   *   - this.tensorWeightCountTotal_internal
   *   - this.boundsArraySet
   *   - this.filtersShape
   *   - this.filtersArray
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is the
   * .output of the previous convolution-bias-activation value bounds set 
   * of this pointwise convolution. It will be kept (not cloned) directly. So
   * caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if succeeded.
   */
  init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) {

    // Q1: Why is the inputWeightArray not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputWeightArray so that
    //     it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputWeightArray could be released.


    if ( this.inputChannelCount != inputScaleBoundsArray.length )
      throw Error( `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) `
        + `should be the same as outputChannelCount of previous `
        + `convolution-bias-activation ( ${inputScaleBoundsArray.length} ).`
      );

    if ( this.inputChannelCount
           != inputScaleBoundsArray.scaleArraySet.undo.length )
      throw Error( `Pointwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) `
        + `should be the same as the length of .output.scaleArraySet.undo `
        + `of previous convolution-bias-activation `
        + `( ${inputScaleBoundsArray.scaleArraySet.undo.length} ).`
      );

    // Note: Even if ( this.outputChannelCount <= 0 ), this function should
    //       work correctly as pass-through input to output.
    //

    let aFiltersBiasesPartInfoArray;
    try {

      // Calculate lower half and higher half channel count. (Even if
      // ( bHigherHalfDifferent == false ), these are still correct.)
      {
        if ( this.inputChannelCount_lowerHalf != undefined )
          this.inputChannelCount_higherHalf
            = this.inputChannelCount - this.inputChannelCount_lowerHalf;
        else
          this.inputChannelCount_higherHalf = undefined;

        if ( this.outputChannelCount_lowerHalf != undefined )
          this.outputChannelCount_higherHalf
            = this.outputChannelCount - this.outputChannelCount_lowerHalf;
        else
          this.outputChannelCount_higherHalf = undefined;
      }

      // Determine shape of the filters, biases, channels.
      let filtersWeightCount_extracted, biasesWeightCount_extracted;

      // Set up aFiltersBiasesPartInfoArray and filtersShape and biasesShape.
      {
        switch ( this.nHigherHalfDifferent ) {
          // 3.0 Normal pointwise convolution and bias.
          case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)

            // Extract all weights as specified input/output channels.          
            filtersWeightCount_extracted
              = this.inputChannelCount * this.outputChannelCount;

            biasesWeightCount_extracted = this.outputChannelCount;

            aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
              .get_or_create_by(
                FiltersBiasesPartInfo.Pool.get_or_create_by(
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount, this.outputChannelCount, false )
                )
              );
            break;

          // 3.1 bHigherHalfCopyLowerHalf_LowerHalfPassThrough
          case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH: // (1)
            filtersWeightCount_extracted = 0; // Does not extract any weights.
            biasesWeightCount_extracted = 0; // Does not extract any weights.
            aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
              .get_or_create_by(
                FiltersBiasesPartInfo.Pool.get_or_create_by(
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount_lowerHalf,
                    this.outputChannelCount_lowerHalf,  true ),
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount_lowerHalf,
                    this.outputChannelCount_higherHalf, true )
                )
              );
            break;

          // 3.2 bHigherHalfCopyLowerHalf
          case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF: // (2)
            filtersWeightCount_extracted
              = this.inputChannelCount_lowerHalf
                  * this.outputChannelCount_lowerHalf;
            biasesWeightCount_extracted = this.outputChannelCount_lowerHalf;

            aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
              .get_or_create_by(
                FiltersBiasesPartInfo.Pool.get_or_create_by(
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount_lowerHalf,
                    this.outputChannelCount_lowerHalf, false ),
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount_lowerHalf,
                    this.outputChannelCount_higherHalf, true )
                )
              );
            break;

          // 3.3 bHigherHalfAnotherPointwise
          case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE: // (3)
            filtersWeightCount_extracted =
                ( this.inputChannelCount_lowerHalf
                    * this.outputChannelCount_lowerHalf )
              + ( this.inputChannelCount_higherHalf
                    * this.outputChannelCount_higherHalf );

            biasesWeightCount_extracted = this.outputChannelCount;

            aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
              .get_or_create_by(
                FiltersBiasesPartInfo.Pool.get_or_create_by(
                  ChannelPartInfo.Pool.get_or_create_by(
                    0, this.inputChannelCount_lowerHalf,
                    this.outputChannelCount_lowerHalf,  false )
                ),
                FiltersBiasesPartInfo.Pool.get_or_create_by(
                  ChannelPartInfo.Pool.get_or_create_by(
                    this.inputChannelCount_lowerHalf, this.inputChannelCount,
                    this.outputChannelCount_higherHalf, false )
                )
              );
            break;

          // 3.4 bHigherHalfPassThrough
          case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (4)
            filtersWeightCount_extracted
              = this.inputChannelCount_lowerHalf
                  * this.outputChannelCount_lowerHalf;
            biasesWeightCount_extracted = this.outputChannelCount_lowerHalf;

            aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool.get_or_create_by(
              FiltersBiasesPartInfo.Pool.get_or_create_by(
                ChannelPartInfo.Pool.get_or_create_by(
                  0, this.inputChannelCount_lowerHalf,
                  this.outputChannelCount_lowerHalf,  false ),
                ChannelPartInfo.Pool.get_or_create_by(
                  this.inputChannelCount_lowerHalf, this.inputChannelCount,
                  this.outputChannelCount_higherHalf,  true )
              )
            );

            // Note: If ( HIGHER_HALF_PASS_THROUGH ) with
            //       ( inputChannelCount_lowerHalf == 0 ) and
            //       ( outputChannelCount_lowerHalf == 0 ), the result should
            //       be the same as AllPassThrough without using special
            //       ( outputChannelCount <= 0 ).
            break;

          default:
            throw Error(
              `Pointwise.FiltersArray_BiasesArray.init(): `
                + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) `
                + `is unknown value.`
            );
            break;
        }

        this.filtersShape = Recyclable.Array.Pool.get_or_create_by(
          1, 1, this.inputChannelCount, this.outputChannelCount );

        if ( this.bBias ) {
          this.biasesShape = Recyclable.Array.Pool.get_or_create_by(
            1, 1, this.outputChannelCount );
        } else {
          biasesWeightCount_extracted = 0;
        }
      }

      // Prepare result filters and biases array.
      if ( this.filtersShape )
        this.filtersArray = Recyclable.Array.Pool.get_or_create_by(
          tf.util.sizeFromShape( this.filtersShape ) );

      if ( this.biasesShape )
        this.biasesArray = Recyclable.Array.Pool.get_or_create_by(
          tf.util.sizeFromShape( this.biasesShape ) );

      // Calculate weights count of filters and biases to be extracted.
      let weightsCount_extracted = 0;
      if ( filtersWeightCount_extracted )
        weightsCount_extracted += filtersWeightCount_extracted;
      if ( biasesWeightCount_extracted )
        weightsCount_extracted += biasesWeightCount_extracted;

      // Prepare source weights to be extracted.
      if ( !super.init( inputWeightArray, weightElementOffsetBegin,
              weightsCount_extracted ) ) { // i.e. Weights.Base.init()
        this.bInitOk = false;
        return false;  // e.g. input array does not have enough data.
      }

      // filters and bias: weights and value bounds.
      //
      // It should be better to calculate per channel value bounds by real
      // filter and bias value (i.e. not by an estimated value bounds). This is
      // especialy important for ActivationEscaping. Because inputDomainLinear
      // of activation function is not wide, using looser value bounds
      // estimation has higher possibility to lost information.
      //
      // Two-rounds processing is used:
      //
      //   - In the 1st round, extracting filter and bias value from
      //       sourceWeights[]. At the same time, calculating .afterFilter and
      //       .afterBias by these extracted values combined with
      //       undoPreviousEscapingScale
      //       (i.e. inputScaleBoundsArray.scaleArraySet.undo.scales[ inChannel ]).
      //       And then, find out .activationEscaping_ScaleArraySet,
      //       .afterActivationEscaping, .afterActivation.
      //
      //   - In the 2nd round, apply doEscapingScale (i.e.
      //       .activationEscaping_ScaleArraySet.do.scales[ outChannel ] )
      //       to filter and bias value (and also .afterFilter and .afterBias).
      //
      {
        // Round 0
        {
          // Initialize element value bounds (per channel). Determine .input
          // and .afterUndoPreviousActivationEscaping
          this.boundsArraySet = BoundsArraySet.Pointwise.Pool.get_or_create_by(
            inputScaleBoundsArray,
            this.outputChannelCount, this.channelShuffler_inputGroupCount );
        }

        // Round 1
        {
          this.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
            inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray,
            aFiltersBiasesPartInfoArray );

          this.boundsArraySet.set_bPassThroughArray_all_byChannelPartInfoArray(
            aFiltersBiasesPartInfoArray );

          // Determine .activationEscaping_ScaleArraySet,
          // .afterActivationEscaping, .afterActivation
          this.boundsArraySet
            .adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThroughArray_nActivationId(
              this.nActivationId );
        }

        // Round 2
        // Apply doEscapingScale.
        this.apply_doEscapingScale_to_filtersArray_biasesArray();
      }

      // Shuffle channels.
      //
      // Pre-shuffle channels by shuffling the filters and biases.
      this.set_filters_biases_outputScaleBoundsArray_all_byInterleave_asGrouptTwo();

      {
        this.tensorWeightCountTotal_internal = 0;

        if ( this.filtersShape )
          this.tensorWeightCountTotal_internal
            += tf.util.sizeFromShape( this.filtersShape );

        if ( this.biasesShape )
          this.tensorWeightCountTotal_internal
            += tf.util.sizeFromShape( this.biasesShape );
      }

      this.bInitOk = true;
      return true;

    } finally { // Release temporary resource.
      if ( aFiltersBiasesPartInfoArray ) {
        aFiltersBiasesPartInfoArray.disposeResources_and_recycleToPool();
        aFiltersBiasesPartInfoArray = null;
      }
    }
  }

  /**
   * Extract this.filtersArray and this.biasesArray from sourceWeightArray and
   * apply inputScaleBoundsArray.scaleArraySet.undo.scales[]. Also set the
   * .afterFilter and .afterBias.
   *
   * @param {Float32Array} sourceWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is the
   * .output of the previous convolution-bias-activation value bounds set of
   * this pointwise convolution. It will be kept (not cloned) directly. So
   * caller should not modify them.
   *
   * @param {Pointwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels
   * index range.
   */
  set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
    sourceWeightArray, weightElementOffsetBegin,
    inputScaleBoundsArray, aFiltersBiasesPartInfoArray ) {

    const funcNameInMessage
      = "set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale";

    const thePassThroughStyleInfo
      = ValueDesc.PassThroughStyle.Singleton.getInfo_byId(
          this.nPassThroughStyleId );

    let tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 );

    // Init
    {
      this.boundsArraySet.afterFilter.set_all_byN( 0 ); // Init .afterFilter
      this.boundsArraySet.afterBias.set_all_byN( 0 );   // Init .afterBias

!!! ...unfinished... (2025/07/10)
// Why fetching bias by adding (not by assigning)?

      // Because biases is fetched by adding, it should be initialized to zero.
      // (Note: The .filtersArray is fetched by assigning, so it needs not be
      // initialized.)
      //
      if ( this.biasesArray ) {
        this.biasesArray.fill( 0 );
      }
    }

    let input_scaleArraySet_undo;
    {
      // Use non-channel-shuffled info of previous operation.
      if ( this.channelShuffler_inputGroupCount > 0 ) {
        input_scaleArraySet_undo
          = FloatValue.ScaleArray.Pool.get_or_create_by(
              inputScaleBoundsArray.scaleArraySet.undo.length );
        input_scaleArraySet_undo
          .set_all_byInterleave_asGrouptTwo_undo_byScaleArray(
            inputScaleBoundsArray.scaleArraySet.undo );

      // Use channel-shuffled info of previous operation.
      } else {
        input_scaleArraySet_undo = inputScaleBoundsArray.scaleArraySet.undo;
      }
    }

    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex = weightElementOffsetBegin;
    let filterIndex = 0, biasIndex = 0;

    // [ outChannelBegin, outChannelEnd ) are output channels of the current
    // FiltersBiasesPart.
    let outChannelBegin = 0, outChannelEnd = 0;

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0;
      aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length;
      ++aFiltersBiasesPartIndex ) {

      let aFiltersBiasesPartInfo
        = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];

      let inChannelPartInfoArray = aFiltersBiasesPartInfo;

      // Begin from the ending of the previous FiltersBiasesPart.
      filterIndex = outChannelBegin = outChannelEnd;

      { // this.filtersArray

        for ( let inChannel = 0;
          inChannel < this.inputChannelCount; ++inChannel ) {

          const undoPreviousEscapingScale
            = input_scaleArraySet_undo.scales[ inChannel ];

          const filterValuePassThrough
            = thePassThroughStyleInfo.filterValue * undoPreviousEscapingScale;

          let outChannel = outChannelBegin;

          InChannelPartIndexLoop:
          for ( let inChannelPartIndex = 0;
            inChannelPartIndex < inChannelPartInfoArray.length;
            ++inChannelPartIndex ) {

            let inChannelPartInfo
              = inChannelPartInfoArray[ inChannelPartIndex ];

            let inChannelToPartBegin
              = inChannel - inChannelPartInfo.inChannelBegin;

            for ( let outChannelSub = 0;
              outChannelSub < inChannelPartInfo.outputChannelCount;
              ++outChannelSub, ++outChannel ) {

              // Never exceeds the total output channel count.
              if ( outChannel >= this.outputChannelCount ) {
                break InChannelPartIndexLoop;
              }

              // Note: The .afterUndoPreviousActivationEscaping has already
              //       been multiplied by undoPreviousEscapingScale.

              if (   ( inChannelToPartBegin >= 0 )
                  && ( inChannel < inChannelPartInfo.inChannelEnd ) ) {

                // For pass-through half channels.
                if ( inChannelPartInfo.bPassThrough ) {

                  // The only one filter position (in the pass-through part)
                  // may have non-zero value.
                  if ( inChannelToPartBegin == outChannelSub ) {
                    this.filtersArray[ filterIndex ] = filterValuePassThrough;

                    // Note: For pointwise convolution, do NOT fround()
                    //       when multiplying. Do fround() when adding.
                    //       Please see NumberImage_Base.clone_byPointwise().
                    //
                    // (2025/07/05)
                    tBounds
                      .set_byBoundsArray(
                        this.boundsArraySet.afterUndoPreviousActivationEscaping,
                        inChannel )
                      .multiply_byN( thePassThroughStyleInfo.filterValue );

                  } else {
                    // All other filter positions (in the pass-through part)
                    // are zero.
                    this.filtersArray[ filterIndex ] = 0;
                    tBounds.set_byN( 0 );
                  }

                // Non-pass-through half channels.
                } else {
                  let sourceWeight = sourceWeightArray[ sourceIndex ];
                  ++sourceIndex;

                  // Note: fround() for all source (i.e. input, filter and bias).
                  //       Please see NumberImage_Base.clone_byPointwise().
                  //
                  // (2025/07/05)
                  sourceWeight = Math.fround( sourceWeight );

                  this.filtersArray[ filterIndex ]
                    = sourceWeight * undoPreviousEscapingScale;

                  // Note: For pointwise convolution, do NOT fround() here
                  //       (i.e. when multiplying).
                  //
                  // (2025/07/05)
                  tBounds
                    .set_byBoundsArray(
                      this.boundsArraySet.afterUndoPreviousActivationEscaping,
                      inChannel )
                    .multiply_byN( sourceWeight )
                    // Do NOT fround here.
                    ;
                }

                // Determine .afterFilter
                //
                // Note: For pointwise convolution, do fround() here (i.e.
                //       when adding).
                //       Please see NumberImage_Base.clone_byPointwise().
                //
                // (2025/07/05)
                this.boundsArraySet.afterFilter
                  .add_one_byBounds( outChannel, tBounds )
                  .fround_one( outChannel );

              } else {
                // All input channels which is not in range use zero filter
                // to ignore the inputs.
                this.filtersArray[ filterIndex ] = 0;
              }

              ++filterIndex;

            } // outChannelSub, outChannel
          } // inChannelPartIndex

          // Record the ending output channel index of the current
          // FiltersBiasesPart.
          outChannelEnd = outChannel;

          // Jump to the outChannelBegin of the next inChannel.
          filterIndex
            += ( this.outputChannelCount - outChannel ) + outChannelBegin;

        } // inChannelSub, inChannel

      } // this.filtersArray


      if ( this.biasesArray ) {
        let biasValue;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0;
          inChannelPartIndex < inChannelPartInfoArray.length;
          ++inChannelPartIndex ) {

          let inChannelPartInfo
            = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let outChannelSub = 0;
            outChannelSub < inChannelPartInfo.outputChannelCount;
            ++outChannelSub, ++outChannel ) {

            // Never exceeds the total output channel count.
            if ( outChannel >= this.outputChannelCount ) {
              break InChannelPartIndexLoop;
            }

            // Note: bias is not responsible for undoPreviousEscapingScale.
            //       (i.e. the filter already done it)

            // For pass-through half channels.
            if ( inChannelPartInfo.bPassThrough ) {
              biasValue = thePassThroughStyleInfo.biasValue;

            // Non-pass-through half channels.
            } else {
              biasValue = sourceWeightArray[ sourceIndex ];
              ++sourceIndex;
            }

            // Note: fround() for all source (i.e. input, filter and bias).
            //       Please see NumberImage_Base.modify_byBias().
            //
            // (2025/07/05)
            biasValue = Math.fround( biasValue );

!!! ...unfinished... (2025/07/10)
// Perhaps, should fround() the result ( this.biasesArray[ biasIndex ] + biasValue )
//
// Why fetching bias by adding (not by assigning)?

            // Note: Use adding instead of assignment.
            this.biasesArray[ biasIndex ] += biasValue;

            // Determine .afterBias
            // Shift the value bounds by the bias.
            //
            // Note: For bias, do fround() when adding.
            //       Please see NumberImage_Base.modify_byBias().
            //
            // (2025/07/05)
            this.boundsArraySet.afterBias
              .add_one_byN( outChannel, biasValue )
              .fround_one( outChannel );

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
    // A: Because .afterFilter is unknown before FiltersBiasesPartInfoArray has
    //    been visited totally.
    //
    this.boundsArraySet.afterBias
      .add_all_byBoundsArray( this.boundsArraySet.afterFilter )
      .fround_all();

    if ( outChannelEnd != this.outputChannelCount )
      throw Error( `Pointwise.FiltersArray_BiasesArray`
        + `.${funcNameInMessage}(): `
        + `aFiltersBiasesPartInfoArray[ inChannelPartInfoArray[] ] `
        + `total output channel count ( ${outChannelEnd} ) `
        + `should be ( ${this.outputChannelCount} ).` );

    // Release temporary resources.
    {
      if ( this.channelShuffler_inputGroupCount > 0 ) {
        input_scaleArraySet_undo.disposeResources_and_recycleToPool();
        input_scaleArraySet_undo = null;
      }

      tBounds.disposeResources_and_recycleToPool();
      tBounds = null;
    }
  }

  /**
   * Apply this.boundsArraySet.output0.scaleArraySet.do.scales[] to
   * this.filtersArray and this.biasesArray.
   */
  apply_doEscapingScale_to_filtersArray_biasesArray() {

    { // this.filtersArray
      let filterIndex = 0;

      for ( let inChannel = 0;
        inChannel < this.inputChannelCount; ++inChannel ) {

        for ( let outChannel = 0;
          outChannel < this.outputChannelCount; ++outChannel ) {

          let doEscapingScale = this.boundsArraySet.output0
            .scaleArraySet.do.scales[ outChannel ];

          // filter wieghts scaled.
          this.filtersArray[ filterIndex ] *= doEscapingScale;

          ++filterIndex;

        } // outChannel
      } // inChannel
    } // this.filtersArray

    if ( this.biasesArray ) {
      let biasIndex = 0;

      for ( let outChannel = 0;
        outChannel < this.outputChannelCount; ++outChannel ) {

        let doEscapingScale = this.boundsArraySet.output0
          .scaleArraySet.do.scales[ outChannel ];

        // bias wieghts scaled.
        this.biasesArray[ biasIndex ] *= doEscapingScale;

        ++biasIndex;

      } // outChannel

    } else { // ( !this.biasesArray ). No biases array to be extracted.
      // Do nothing.
    }
  }

  /**
   * Shuffle (.filtersArray, .biasesArray, .boundsArraySet) by interleaving.
   *   - Only ( outputGroupCount == 2 ) is supported.
   *   - The input channel count must be even (i.e. divisible by 2), if
   *       ( .channelShuffler_inputGroupCount > 0 ).
   *   - The output channel count must be even (i.e. divisible by 2), if
   *       ( .channelShuffler_outputGroupCount > 0 ).
   */
  set_filters_biases_outputScaleBoundsArray_all_byInterleave_asGrouptTwo() {
    const funcNameInMessage
      = "set_filters_biases_outputScaleBoundsArray_all_byInterleave_asGrouptTwo";
    
    // 1.Shuffle along input channels.
    if ( this.channelShuffler_inputGroupCount > 0 ) {

      if ( this.channelShuffler_inputGroupCount != 2 )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.${funcNameInMessage}(): `
          + `channelShuffler_inputGroupCount `
          + `( ${this.channelShuffler_inputGroupCount} ) `
          + `only 2 is supported.`
        );

      if ( ( this.inputChannelCount % 2 ) != 0 )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.${funcNameInMessage}(): `
          + `input channel count ( ${this.inputChannelCount} ) `
          + `must be even (i.e. divisible by 2).`
        );

      // Shuffle filters.
      {
        let filtersArrayShuffled = Recyclable.Array.Pool.get_or_create_by(
          this.filtersArray.length );

        FloatValue.ArrayInterleaver
          .interleave_asGrouptTwo_alongLast2ndAxis_from_to(
            this.filtersArray, filtersArrayShuffled,
            this.inputChannelCount, this.outputChannelCount );

        this.filtersArray.disposeResources_and_recycleToPool();
        this.filtersArray = filtersArrayShuffled;
      }

      // Because its channel shuffling is undone before filters and biases
      // weights extracting, redo it to restore to its original order.
      this.boundsArraySet
        .set_afterUndoPreviousActivationEscaping_by_Interleave_asGrouptTwo();

      // Note: biases and other BoundsArraySet.afterXxx are not affected
      //       because they are along output channels (i.e. not along input
      //       channels).
    }

    // 2. Shuffle along output channels.
    if ( this.channelShuffler_outputGroupCount > 0 ) {

      if ( this.channelShuffler_outputGroupCount != 2 )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.${funcNameInMessage}(): `
          + `channelShuffler_outputGroupCount `
          + `( ${this.channelShuffler_outputGroupCount} ) `
          + `only 2 is supported.`
        );

      if ( ( this.outputChannelCount % 2 ) != 0 )
        throw Error( `Pointwise.FiltersArray_BiasesArray`
          + `.${funcNameInMessage}(): `
          + `output channel count ( ${this.outputChannelCount} ) `
          + `must be even (i.e. divisible by 2).`
        );

      // Shuffle filters.
      {
        let filtersArrayShuffled = Recyclable.Array.Pool.get_or_create_by(
          this.filtersArray.length );

        FloatValue.ArrayInterleaver
          .interleave_asGrouptTwo_alongLastAxis_from_to(
            this.filtersArray, filtersArrayShuffled,
            this.inputChannelCount, this.outputChannelCount );

        this.filtersArray.disposeResources_and_recycleToPool();
        this.filtersArray = filtersArrayShuffled;
      }

      // Shuffle biases.
      if ( this.biasesArray ) {
        let biasesArrayShuffled = Recyclable.Array.Pool.get_or_create_by(
          this.biasesArray.length );

        FloatValue.ArrayInterleaver
          .interleave_asGrouptTwo_alongLastAxis_from_to(
            this.biasesArray, biasesArrayShuffled,
            this.outputChannelCount );

        this.biasesArray.disposeResources_and_recycleToPool();
        this.biasesArray = biasesArrayShuffled;
      }

      // Shuffle bounds array set of output.
      this.boundsArraySet.set_outputs_all_byInterleave_asGrouptTwo();
    }
  }


  get bHigherHalfDifferent() {
    return (
         ( this.nHigherHalfDifferent )
      && ( this.nHigherHalfDifferent
             != ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE )
    );
  }

}
