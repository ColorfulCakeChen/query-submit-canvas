export { FiltersArray_BiasesArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { ChannelPartInfo, FiltersBiasesPartInfo }
  from "./Depthwise_ChannelPartInfo.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";
import { BoundsArray_PerPixel } from "./Depthwise_BoundsArray_PerPixel.js";

/**
 * Extract depthwise convolution filters and biases.
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
 * @member {BoundsArraySet.Depthwise} boundsArraySet
 *   The element value bounds (per channel) of this depthwise convolution.
 *
 * @member {number} inputHeight
 *   The height of input image. When ( nHigherHalfDifferent ==
 * ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} inputWidth
 *   The width of input image. When ( nHigherHalfDifferent ==
 * ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} nPassThroughStyleId
 *   The pass-through style id (ValueDesc.PassThroughStyle.Singleton.Ids.Xxx)
 * of this convolution. It only affect the channels which need to be
 * pass-through from input to output.
 *
 * @member {ValueDesc.Depthwise_HigherHalfDifferent} nHigherHalfDifferent
 *   - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ), it is just a normal depthwise convolution.
 *
 *   - If ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ):
 *
 *     - Can not be used when:
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier )
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2 ),
 *         (i.e. bHigherHalfDepthwise2, for depthwise1 of
 *           ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the input channels between 0 and
 *         ( inputChannelCount_lowerHalf - 1 ) are depthwise1, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are
 *         depthwise2. These two filters (and biases) will be extracted in
 *         sequence, but they will be combined into one larger filters (and
 *         biases). This makes these filters' weights are arranged the same as
 *         ShuffleNetV2's head. So that the same filters weights could be used
 *         in these two architectures for comparing performance and correctness.
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 *         (i.e. bHigherHalfPassThrough, for depthwise1 of
 *           ShuffleNetV2_ByMopbileNetV1's body/tail),
 *         the filters for the input channels between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) will
 *         just pass through the input to output.
 *
 * @member {boolean} bHigherHalfDifferent
 *   It will be false, if ( nHigherHalfDifferent ==
 * ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ).
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half channel count of input image. When ( nHigherHalfDifferent
 * != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ), it will be
 * used and must be a positive integer.
 *
 * @member {number} tensorWeightCountTotal_internal
 *   The total wieght count used in tensors. Not including Params, because they
 * are not used in tensors. Including inferenced weights, if they are used in
 * tensors.
 *
 * @member {number[]} filtersShape
 *   The shape of the depthwise convolution filters array.
 *
 * @member {number[]} biasesShape
 *   The shape of the depthwise convolution biases array.
 *
 * @member {number[]} filtersArray
 *   The depthwise convolution filters array.
 *
 * @member {number[]} biasesArray
 *   The depthwise convolution biases array.
 *
 * @member {boolean} bInitOk
 *   If .init() success, it will be true.
 *
 * @see PadInfoCalculator
 */
let FiltersArray_BiasesArray = ( ParentClass = Object ) =>
  class FiltersArray_BiasesArray
    extends Weights.Base( PadInfoCalculator( ParentClass ) ) {

  /**
   * Used as default Depthwise.FiltersArray_BiasesArray provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.FiltersArray_BiasesArray.Pool",
    FiltersArray_BiasesArray );

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf,
    ...restArgs ) {

    super( inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      ...restArgs );

    this.#setAsConstructor_self(
      inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );
  }

  /** @override */
  setAsConstructor(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf,
    ...restArgs ) {

    super.setAsConstructor(
      inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      ...restArgs );

    this.#setAsConstructor_self(
      inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );
  }

  /** @override */
  #setAsConstructor_self(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nPassThroughStyleId = nPassThroughStyleId;
    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;

    this.tensorWeightCountTotal_internal = 0;

    // The depthwise filter of AVG pooling and MAX pooling can not be
    // manipulated.
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG
               === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX
               === AvgMax_Or_ChannelMultiplier ) ) {

      if ( nHigherHalfDifferent
             != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ) {

        let msg = `Depthwise.FiltersArray_BiasesArray.#setAsConstructor_self(): `
          + `nHigherHalfDifferent `
          + `( ${ValueDesc.Depthwise_HigherHalfDifferent.Singleton.getNameWithInt_byId( nHigherHalfDifferent )} ) `
          + `should be ( NONE ) when `
          + `AvgMax_Or_ChannelMultiplier is `
          + `( ${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getNameWithInt_byId( AvgMax_Or_ChannelMultiplier )} )`
          ;

        throw Error( msg );
      }
    }

    // (2021/07/20)
    // Note: In backend WASM, when filter width is 1 (note: filter height does
    //       not have this issue and could be 1), it seems that tf.pool() (both
    //       AVG and MAX) and tf.depthwiseConv2d() will calculate wrongly. In
    //       backend CPU and WebGL, this problem does not exist.
    //
    // (2022/05/01)
    // The tensorflow.js team seems not recognize this issue as a problem and
    // will not fix it. So, we need get around it by ourselves testing procedure.
    if ( AvgMax_Or_ChannelMultiplier != 0 ) {
      if ( ( filterWidth == 1 ) && ( tf.getBackend() == "wasm" ) ) {
        throw Error( `Depthwise.FiltersArray_BiasesArray`
          + `.#setAsConstructor_self(): `
          + `In backend WASM, it seems that tf.pool() (both AVG and MAX) `
          + `and tf.depthwiseConv2d() can not work with filterWidth = 1.`
        );
      }
    }

    if ( this.bHigherHalfDifferent ) {
      if ( inputChannelCount_lowerHalf > inputChannelCount )
        throw Error( `Depthwise.FiltersArray_BiasesArray`
          + `.#setAsConstructor_self(): `
          + `inputChannelCount_lowerHalf `
          + `( ${this.inputChannelCount_lowerHalf} ) `
          + `can not be larger than `
          + `inputChannelCount ( ${this.inputChannelCount} ).`
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

    if ( this.poolWindowShape ) {
      this.poolWindowShape.disposeResources_and_recycleToPool();
      this.poolWindowShape = null;
    }

    this.outputChannelCount_toBeExtracted = undefined;
    this.inputChannelCount_toBeExtracted = undefined;

    this.outputChannelCount_higherHalf = undefined;
    this.outputChannelCount_lowerHalf = undefined;
    this.inputChannelCount_higherHalf = undefined;

    this.tensorWeightCountTotal_internal = undefined;

    this.inputChannelCount_lowerHalf = undefined;
    this.nHigherHalfDifferent = undefined;
    this.nPassThroughStyleId = undefined;
    this.nActivationId = undefined;
    this.bBias = undefined;

    super.disposeResources();
  }

  /**
   * Extract depthwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.weightElementOffsetBegin
   *   - this.weightElementOffsetEnd
   *   - this.tensorWeightCountTotal_internal
   *   - this.boundsArraySet
   *   - this.poolWindowShape ( if ( this.AvgMax_Or_ChannelMultiplier < 0 ) )
   *   - this.filtersShape    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.filtersArray    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {Float32Array} inputWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is the
   * .output of the previous convolution-bias-activation value bounds set of
   * this depthwise convolution. It will be kept (not cloned) directly. So
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
      throw Error( `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) `
        + `should be the same as `
        + `outputChannelCount of previous convolution-bias-activation `
        + `( ${inputScaleBoundsArray.length} ).`
      );

    if ( this.inputChannelCount
           != inputScaleBoundsArray.scaleArraySet.undo.length )
      throw Error( `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) `
        + `should be the same as `
        + `the length of .output.scaleArraySet.undo of previous `
        + `convolution-bias-activation `
        + `( ${inputScaleBoundsArray.scaleArraySet.undo.length} ).`
      );


    // Note: This method may not work properly when
    // ( this.AvgMax_Or_ChannelMultiplier
    //     == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ).
    //

    let aFiltersBiasesPartInfoArray;
    try {

      // Calculate lower half and higher half channel count.
      //
      // Even if avg/max pooling or ( bHigherHalfDifferent == false ), these
      // are still correct.
      //
      if ( this.inputChannelCount_lowerHalf != undefined ) {
        this.inputChannelCount_higherHalf
          = this.inputChannelCount - this.inputChannelCount_lowerHalf;
        this.outputChannelCount_lowerHalf
          = this.inputChannelCount_lowerHalf * this.channelMultiplier;
        this.outputChannelCount_higherHalf
          = this.outputChannelCount - this.outputChannelCount_lowerHalf;
      } else {
        this.inputChannelCount_higherHalf = undefined;
        this.outputChannelCount_lowerHalf = undefined;
        this.outputChannelCount_higherHalf = undefined;
      }

      // Determine shape of the filters, biases, channels.
      let filtersWeightCount_extracted, biasesWeightCount_extracted;

      // Set up aFiltersBiasesPartInfoArray and filtersShape and biasesShape.
      {
        // Depthwise by AVG or MAX pooling (so no channel multiplier).
        if ( this.AvgMax_Or_ChannelMultiplier < 0 ) {

          // In normal depthwise avg/max pooling, use specified specified
          // channel count as extracted channel count. Although they are not
          // used to extract avg/max filters, they will be used for extracting
          // bias.
          this.inputChannelCount_toBeExtracted = this.inputChannelCount;
          this.outputChannelCount_toBeExtracted = this.outputChannelCount;

          // Note: avg/max pooling do not have this.filtersShape to be
          //       extracted.
          this.poolWindowShape = Recyclable.Array.Pool.get_or_create_by(
            this.filterHeight, this.filterWidth );

          if ( this.bBias ) {
            this.biasesShape = Recyclable.Array.Pool.get_or_create_by(
              1, 1, this.outputChannelCount );

            biasesWeightCount_extracted = this.outputChannelCount;
          }

          aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
            .get_or_create_by(
              FiltersBiasesPartInfo.Pool.get_or_create_by(
                ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount )
              )
            );

        // Depthwise by convolution (with channel multiplier).
        } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) {

          switch ( this.nHigherHalfDifferent ) {
            case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
              this.inputChannelCount_toBeExtracted = this.inputChannelCount;
              this.outputChannelCount_toBeExtracted = this.outputChannelCount;

              aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
                .get_or_create_by(
                  FiltersBiasesPartInfo.Pool.get_or_create_by(
                    ChannelPartInfo.Pool.get_or_create_by(
                      this.inputChannelCount )
                  )
                );
              break;

            case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1)

              if ( !( this.inputChannelCount_lowerHalf > 0 ) )
                throw Error( `Depthwise.FiltersArray_BiasesArray`
                  + `.extractAs_HigherHalfDepthwise2(): `
                  + `inputChannelCount_lowerHalf `
                  + `( ${this.inputChannelCount_lowerHalf} ) `
                  + `must be positive.`
                );

              // Extract filters and biases for the specified channel count,
              // but in different sequence.
              this.inputChannelCount_toBeExtracted = this.inputChannelCount;
              this.outputChannelCount_toBeExtracted = this.outputChannelCount;

              aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
                .get_or_create_by(
                  FiltersBiasesPartInfo.Pool.get_or_create_by(
                    ChannelPartInfo.Pool.get_or_create_by(
                      this.inputChannelCount_lowerHalf )
                  ),
                  FiltersBiasesPartInfo.Pool.get_or_create_by(
                    ChannelPartInfo.Pool.get_or_create_by(
                      this.inputChannelCount_higherHalf )
                  )
                );
              break;

            case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2)

              if ( !( this.inputChannelCount_lowerHalf > 0 ) )
                throw Error( `Depthwise.FiltersArray_BiasesArray`
                  + `.extractAs_HigherHalfPassThrough(): `
                  + `inputChannelCount_lowerHalf `
                  + `( ${this.inputChannelCount_lowerHalf} ) `
                  + `must be positive.`
                );

              // Just extract filters and biases for half of the specified
              // channel count.
              this.inputChannelCount_toBeExtracted
                = this.inputChannelCount_lowerHalf;
              this.outputChannelCount_toBeExtracted
                = this.outputChannelCount_lowerHalf;

              aFiltersBiasesPartInfoArray = Recyclable.OwnerArray.Pool
                .get_or_create_by(
                  FiltersBiasesPartInfo.Pool.get_or_create_by(
                    ChannelPartInfo.Pool.get_or_create_by(
                      this.inputChannelCount_lowerHalf ),
                    ChannelPartInfo.Pool.get_or_create_by(
                      this.inputChannelCount_higherHalf,
                      this.padHeightTop, this.padWidthLeft )
                  )
                );
              break;

            default:
              throw Error(
                `Depthwise.FiltersArray_BiasesArray.init(): `
                  + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) `
                  + `is unknown value.`
              );
              break;
          }

          this.filtersShape = Recyclable.Array.Pool.get_or_create_by(
            this.filterHeight, this.filterWidth,
            this.inputChannelCount, this.channelMultiplier );

          filtersWeightCount_extracted
            = this.filterHeight * this.filterWidth
                * this.inputChannelCount_toBeExtracted
                * this.channelMultiplier;

          if ( this.bBias ) {
            this.biasesShape = Recyclable.Array.Pool.get_or_create_by(
              1, 1, this.outputChannelCount );

            biasesWeightCount_extracted
              = this.outputChannelCount_toBeExtracted;
          }

        } else { // No depthwise (i.e. zero) (so no channel multiplier).
          aFiltersBiasesPartInfoArray
            = Recyclable.OwnerArray.Pool.get_or_create_by();
          // Note: In this case, even if ( this.bBias == true ), the
          //       biasesArray will still not be extracted.
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
        weightsCount_extracted += biasesWeightCount_extracted

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
      // especially important for ActivationEscaping. Because inputDomainLinear
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
      //      .afterActivationEscaping, .afterActivation.
      //
      //   - In the 2nd round, apply doEscapingScale (i.e.
      //       .activationEscaping_ScaleArraySet.do.scales[ outChannel ] ) to
      //       filter and bias value (and also .afterFilter and .afterBias).
      //
      {
        // Round 0
        {
          // Initialize element value bounds (per channel). Determine .input
          // and .afterUndoPreviousActivationEscaping
          //
          // Note: Even if avg/max pooling, input value bounds is the same as
          //       the previous output value bounds
          this.boundsArraySet = BoundsArraySet.Depthwise.Pool.get_or_create_by(
            inputScaleBoundsArray, this.outputChannelCount );
        }

        // Round 1
        {
          this.boundsArraySet.set_bPassThroughArray_all_byChannelPartInfoArray(
            aFiltersBiasesPartInfoArray );

          this.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
            inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray,
            aFiltersBiasesPartInfoArray );

          // Determine .activationEscaping_ScaleArraySet,
          // .afterActivationEscaping, .afterActivation
          {
            if (   ( this.AvgMax_Or_ChannelMultiplier < 0 )
                && (   ( this.bBias == false )
                    && ( this.nActivationId
                           == ValueDesc.ActivationFunction.Singleton.Ids.NONE )
                   )
               ) {

              // For avg/max pooling, if it has no bias and no activation, the
              // value bounds does not change (i.e. should be the same as
              // input).
              //
              // In this case, the previous activation-escaping needs not be
              // undo (so undoPreviousEscapingScale could be not 1). Using them
              // as this avg/max pooling's activation-escaping since they can
              // not be calculated in fact.
              //

              // For average pooling, value bounds are re-calculated (but
              // activation esaping scale is not and still the same as input).
              if ( this.AvgMax_Or_ChannelMultiplier
                     == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG ) {

                this.boundsArraySet
                  .set_outputs_all_byBoundsArray_ScaleArraySet(
                    this.boundsArraySet.afterBias,
                    this.boundsArraySet.input0.scaleArraySet );

              // For maximum pooling, value bounds is exactly the same as
              // input.
              } else {
                this.boundsArraySet.set_outputs_all_by_input0();
              }

              // Note: Since there is no undo previous scales, it needs not
              //       .apply_doEscapingScale_to_filtersArray_biasesArray().

            } else {
              this.boundsArraySet
                .adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThroughArray_nActivationId(
                  this.nActivationId );

              // Round 2
              // Apply doEscapingScale.
              this.apply_doEscapingScale_to_filtersArray_biasesArray();
            }
          }
        }
      }

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
   * this depthwise convolution. It will be kept (not cloned) directly. So
   * caller should not modify them.
   *
   * @param {Depthwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
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

    // 0. Init

    // 0.1 Prepare .afterFilter accumulation.

    // Virtual input image (for calculating value bounds).
    //
    // When pad=same, part of filter will be applied to the padded pixels (i.e.
    // zero value).
    //
    // Although it seems a smaller size ( height, width ) should be just
    // enough, however, strides also affects the bounds calculating for evey
    // kinds of padded or non-padded pixel configuration for depthwise
    // convolution.
    //
    // So, virtual input image should use the same as real input size.
    //
    // Note: In theroy, for average pooling, value bounds should be the same as
    //       input. In reality, however, it should also be calculated one by
    //       one because of floating-point accumulate error.
    //
    let tBounds;
    let virtualImageInfo;
    let virtualImageOutput_afterFilter_BoundsArray_PerPixel;

    // For Average pooling or depthwise convolution.
    if (   ( this.AvgMax_Or_ChannelMultiplier
               == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG )
        || ( this.filtersArray )
       ) {
      tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 );

      virtualImageInfo = this; // PadInfoCalculator

      // Used to track every ( height, width, channel ) pixel's value bounds.
      virtualImageOutput_afterFilter_BoundsArray_PerPixel
        = BoundsArray_PerPixel.Pool.get_or_create_by( virtualImageInfo );
    }

    { // 0.2 Init

      // Note: .afterFilter needs not be initialized to zero because it will be
      // calculated from virtualImageOutput_afterFilter_BoundsArray_PerPixel.
    }

    // 1. Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex = weightElementOffsetBegin, filterIndex = 0, biasIndex = 0;

    let inChannelBegin = 0, inChannelEnd = 0,   // [ inChannelBegin, inChannelEnd ) are input channels of the current FiltersBiasesPart.
        outChannelBegin = 0, outChannelEnd = 0; // [ outChannelBegin, outChannelEnd ) are output channels of the current FiltersBiasesPart.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0;
      aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length;
      ++aFiltersBiasesPartIndex ) {

      let aFiltersBiasesPartInfo
         = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];

      let inChannelPartInfoArray = aFiltersBiasesPartInfo;

      // Begin from the ending of the previous FiltersBiasesPart.
      inChannelBegin = inChannelEnd;

      // Begin from the ending of the previous FiltersBiasesPart.
      filterIndex = outChannelBegin = outChannelEnd;

      for ( let filterY = 0, effectFilterY = 0;
        filterY < this.filterHeight; ++filterY ) {

        for ( let dilationFilterY = 0;
          dilationFilterY < this.dilationHeight;
          ++dilationFilterY, ++effectFilterY ) {

          for ( let filterX = 0, effectFilterX = 0;
            filterX < this.filterWidth; ++filterX ) {

            for ( let dilationFilterX = 0;
              dilationFilterX < this.dilationWidth;
              ++dilationFilterX, ++effectFilterX ) {

              // The filter's dilation part needs not be extracted from weights
              // array. (They are always zero.)
              if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                continue;

              let inChannel = inChannelBegin;
              let outChannel = outChannelBegin;

              InChannelPartIndexLoop:
              for ( let inChannelPartIndex = 0;
                inChannelPartIndex < inChannelPartInfoArray.length;
                ++inChannelPartIndex ) {

                let inChannelPartInfo
                  = inChannelPartInfoArray[ inChannelPartIndex ];

                for ( let inChannelSub = 0;
                  inChannelSub < inChannelPartInfo.inputChannelCount;
                  ++inChannelSub, ++inChannel ) {

                  // Never exceeds the total input channel count.
                  if ( inChannel >= this.inputChannelCount ) {
                    break InChannelPartIndexLoop;
                  }

                  const undoPreviousEscapingScale = inputScaleBoundsArray
                    .scaleArraySet.undo.scales[ inChannel ];

                  const filterValuePassThrough
                     = thePassThroughStyleInfo.filterValue
                         * undoPreviousEscapingScale;

                  for ( let outChannelSub = 0;
                    outChannelSub < this.channelMultiplier;
                    ++outChannelSub, ++outChannel ) {

                    // Note: The .afterUndoPreviousActivationEscaping has
                    //       already been multiplied by
                    //       undoPreviousEscapingScale.

                    // 1.1
                    if ( this.filtersArray ) { // 1.1.1

                      // For pass-through half channels.
                      if ( inChannelPartInfo.bPassThrough ) {

                        if ( inChannelPartInfo
                               .isPassThrough_FilterPosition_NonZero(
                                 effectFilterY, effectFilterX ) ) {

                          // The only one filter position (in the pass-through
                          // part) may have non-zero value.
                          this.filtersArray[ filterIndex ]
                            = filterValuePassThrough;

                          tBounds
                            .set_byBoundsArray(
                              this.boundsArraySet.afterUndoPreviousActivationEscaping,
                              inChannel )
                            .multiply_byN( thePassThroughStyleInfo.filterValue );

                        } else {
                          // All other filter positions (in the pass-through
                          // part) are zero.
                          this.filtersArray[ filterIndex ] = 0;
                          tBounds.set_byN( 0 );
                        }

                      } else { // Non-pass-through half channels.
                        let sourceWeight = sourceWeightArray[ sourceIndex ];
                        ++sourceIndex;

                        // Note: fround() for all source (i.e. input, filter and bias).
                        //       Please see NumberImage_Base.clone_byDepthwise().
                        //
                        // (2025/07/05)
                        sourceWeight = Math.fround( sourceWeight );

                        this.filtersArray[ filterIndex ]
                          = sourceWeight * undoPreviousEscapingScale;

                        // Note: For depthwise convolution, do NOT fround() here
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

                      // Accumulate value bounds for the filter position
                      // (across the whole virtual input image).
                      //
                      // Note1: For depthwise convolution, do fround() here
                      //        (i.e. when adding). This is different from avg
                      //        pooling.
                      //        Please see NumberImage_Base.clone_byDepthwise().
                      //
                      // Note2: Here should not call .fround_one( outChannel )
                      //        directly because it is not by channel but by every
                      //        pixel. Use ( bDo_fround == true ) instead.
                      //
                      // (2025/07/10)
                      const bDo_fround = true; // fround (for depthwise convolution)
                      virtualImageOutput_afterFilter_BoundsArray_PerPixel
                        .add_one_outputChannel_byBounds(
                          outChannel, filterY, filterX, tBounds,
                          bDo_fround
                        );

                    // 1.1.2 ( !this.filtersArray ). No filters array to be
                    //       extracted. (i.e. avg/max pooling)
                    } else {

                      // For average pooling, value bounds should also be
                      // calculated.
                      if ( this.AvgMax_Or_ChannelMultiplier
                             == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG ) {

                        // Note: Because avg pooling can not undo previous
                        //       activation escaping scale, use .input0 instead
                        //       of .afterUndoPreviousActivationEscaping to
                        //       calculate value bounds.
                        tBounds.set_byBoundsArray(
                          this.boundsArraySet.input0.boundsArray, inChannel );

                        // Accumulate value bounds for the filter position
                        // (across the whole virtual input image).
                        //
                        // Note: For avg pooling, do NOT fround() when adding.
                        //       Do fround() when dividing instead. Please see
                        //       NumberImage_Base.clone_byDepthwise().
                        //
                        // (2025/07/05)
                        const bDo_fround = false; // NOT fround (for average pooling)
                        virtualImageOutput_afterFilter_BoundsArray_PerPixel
                          .add_one_outputChannel_byBounds(
                            outChannel, filterY, filterX, tBounds,
                            bDo_fround
                         );

                      } else {
                        // For maximum pooling, value bounds is exactly the
                        // same as input.
                      }

                      // Confirm no need to undo previous activaction-escaping
                      // (when has bias or has activation), because avg/max
                      // pooling can not do that in these situations.
                      //
                      if (   ( this.bBias != false )
                          || ( this.nActivationId
                                 != ValueDesc.ActivationFunction.Singleton.Ids.NONE ) ) {
            
                        if ( undoPreviousEscapingScale != 1 )
                          throw Error( `Depthwise.FiltersArray_BiasesArray`
                            + `.${funcNameInMessage}(): `
                            + `For avg/max pooling, `
                            + `if ( bBias ( ${this.bBias} ) is not false ) or `
                            + `( nActivationId `
                              + `( ${ValueDesc.ActivationFunction.Singleton.getNameWithInt_byId( this.nActivationId )} ) `
                              + `is not ValueDesc.ActivationFunction.Singleton.Ids.NONE(0) ), `
                            + `undoPreviousEscapingScale[ ${inChannelEnd} ] `
                              + `( ${undoPreviousEscapingScale} ) must be 1 .`
                          );
                      }
                    }

                    ++filterIndex;

                  } // outChannelSub, outChannel
                } // inChannelSub, inChannel
              } // inChannelPartIndex

              // Record the ending input channel index of the current
              // FiltersBiasesPart.
              inChannelEnd = inChannel;

              // Record the ending output channel index of the current
              // FiltersBiasesPart.
              outChannelEnd = outChannel;

              // Jump to the outChannelBegin of the next inChannel.
              filterIndex
                += ( this.outputChannelCount - outChannel ) + outChannelBegin;

            } // dilationFilterX
          } // filterX
        } // dilationFilterY
      } // filterY


      // 1.2
      if ( this.biasesArray ) {
        let biasValue;
        let inChannel = inChannelBegin;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0;
          inChannelPartIndex < inChannelPartInfoArray.length;
          ++inChannelPartIndex ) {

          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let inChannelSub = 0;
            inChannelSub < inChannelPartInfo.inputChannelCount;
            ++inChannelSub, ++inChannel ) {

            // Never exceeds the total input channel count.
            if ( inChannel >= this.inputChannelCount ) {
              break InChannelPartIndexLoop;
            }

            for ( let outChannelSub = 0;
              outChannelSub < this.channelMultiplier;
              ++outChannelSub, ++outChannel ) {

              // Note: bias is not responsible for undoPreviousEscapingScale.
              //       (i.e. the filter already done it)

              // For pass-through half channels.
              if ( inChannelPartInfo.bPassThrough ) {
                biasValue = thePassThroughStyleInfo.biasValue;

              } else { // Non-pass-through half channels.
                biasValue = sourceWeightArray[ sourceIndex ];
                ++sourceIndex;
              }

              // Note: fround() for all source (i.e. input, filter and bias).
              //       Please see NumberImage_Base.modify_byBias().
              //
              // (2025/07/05)
              biasValue = Math.fround( biasValue );

              this.biasesArray[ biasIndex ] = biasValue;

              this.boundsArraySet.afterBias
                .set_one_byN( outChannel, biasValue );

              ++biasIndex;

            } // outChannelSub, outChannel
          } // inChannel
        } // inChannelPartIndex

      } else { // ( !this.biasesArray ). No biases array to be extracted.
        // Do nothing.
      }

    } // aFiltersBiasesPartIndex

    // 2. Determine .afterFilter of all virtual image pixels (of every
    //    channel).
    {
      // For Average pooling or depthwise convolution.
      if ( virtualImageOutput_afterFilter_BoundsArray_PerPixel ) {

        // For average pooling, value bounds should be divided by every pixel's
        // accumulation count.
        if ( this.AvgMax_Or_ChannelMultiplier
               == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG ) {
          virtualImageOutput_afterFilter_BoundsArray_PerPixel
            .divide_all_by_accumulationCounts()
            .fround_all();
        }

        virtualImageOutput_afterFilter_BoundsArray_PerPixel
          .collapse_byOutputChannel_toBoundsArray(
            this.boundsArraySet.afterFilter );

        virtualImageOutput_afterFilter_BoundsArray_PerPixel
          .disposeResources_and_recycleToPool();

        virtualImageOutput_afterFilter_BoundsArray_PerPixel = null;

        // Just nullify it (because it points to this object self).
        virtualImageInfo = null;

        tBounds.disposeResources_and_recycleToPool();
        tBounds = null;

      } else {
        // For max pooling, the value bounds does not change.
        this.boundsArraySet.afterFilter.set_all_byBoundsArray(
          this.boundsArraySet.afterUndoPreviousActivationEscaping );
      }
    }

    // 3. Combine .afterFilter to .afterBias.
    //
    // Q1: Why not combine when initializing .afterBias ?
    // A1: Because .afterFilter is unknown before FiltersBiasesPartInfoArray
    //     has been visited totally.
    //
    // Q2: Why enlarge the value bounds a little (before activation) for
    //     non-pass-through channels.
    // A2: To alleviate the accumulation error (between backend webgl and cpu).
    //     Because many multiplication and addition (i.e. convolution and bias)
    //     accumulate large error (calculated by GPU), the result values may
    //     exceed their bounds (calculated here (i.e. by CPU (not by GPU)).
    //
    // Q3: Why only enlarge the value bounds for non-pass-through channels.
    // A3: For pass-through channels, they are just passed through to the next
    //     operation (i.e. will not increase accumulation error). So, do not
    //     change their value bounds. Otheriwse, the bounds will be mismatched
    //     between SHUFFLE_NET_V2 and SHUFFLE_NET_V2_BY_MOBILE_NET_V1.
    //
    // Q4: Why enlarge the value bounds before activation?
    // A4: Activation function (no matter whether activation escaping) could
    //     reduce accumulation error because it re-calibrates bounds.
    //
    // (2025/07/18)

    if ( this.biasesArray ) {
      this.boundsArraySet.afterBias
        .add_all_byBoundsArray( this.boundsArraySet.afterFilter )
        .fround_all()

      // Since has bias, enlarge only .afterBias value bounds.
        .enalrge_all_byIntegerPowersOfTwo_exceptPassThrough(
          this.boundsArraySet.bPassThroughArray );

    } else {
      // Since no bias, enlarge both .afterFilter and .afterBias value bounds.
      this.boundsArraySet.afterFilter
        .enalrge_all_byIntegerPowersOfTwo_exceptPassThrough(
          this.boundsArraySet.bPassThroughArray );

      this.boundsArraySet.afterBias
        .set_all_byBoundsArray( this.boundsArraySet.afterFilter );
    }

    if ( inChannelEnd != this.inputChannelCount )
      throw Error( `Depthwise.FiltersArray_BiasesArray`
        + `.${funcNameInMessage}(): `
        + `aFiltersBiasesPartInfoArray[ inChannelPartInfoArray[] ] `
        + `total input channel count ( ${inChannelEnd} ) `
        + `should be ( ${this.inputChannelCount} ).` );
  }

  /**
   * Apply this.boundsArraySet.output0.scaleArraySet.do.scales[] to
   * this.filtersArray and this.biasesArray.
   */
  apply_doEscapingScale_to_filtersArray_biasesArray() {
    const doEscapingScaleArray
      = this.boundsArraySet.output0.scaleArraySet.do.scales;

    if ( this.filtersArray ) {
      let filterIndex = 0;

      for ( let filterY = 0, effectFilterY = 0;
        filterY < this.filterHeight; ++filterY ) {

        for ( let dilationFilterY = 0;
          dilationFilterY < this.dilationHeight;
          ++dilationFilterY, ++effectFilterY ) {

          for ( let filterX = 0, effectFilterX = 0;
            filterX < this.filterWidth; ++filterX ) {

            for ( let dilationFilterX = 0;
              dilationFilterX < this.dilationWidth;
              ++dilationFilterX, ++effectFilterX ) {

              // The filter's dilation part needs not be extracted from weights
              // array. (They are always zero.)
              if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                continue;

              let outChannel = 0;
              for ( let inChannel = 0;
                inChannel < this.inputChannelCount; ++inChannel ) {

                for ( let outChannelSub = 0;
                  outChannelSub < this.channelMultiplier;
                  ++outChannelSub, ++outChannel ) {

                  const doEscapingScale = doEscapingScaleArray[ outChannel ];

                  // filter wieghts scaled.
                  this.filtersArray[ filterIndex ] *= doEscapingScale;

                  ++filterIndex;

                } // outChannelSub, outChannel
              } // inChannel
            } // dilationFilterX
          } // filterX
        } // dilationFilterY
      } // filterY

    } else { // ( !this.filtersArray ).
      // Do nothing. No filters array to be doEscapingScale. (i.e. avg/max
      // pooling)
    }

    if ( this.biasesArray ) {
      let biasIndex = 0;

      let outChannel = 0;
      for ( let inChannel = 0;
        inChannel < this.inputChannelCount; ++inChannel ) {

        for ( let outChannelSub = 0;
          outChannelSub < this.channelMultiplier;
          ++outChannelSub, ++outChannel ) {

          const doEscapingScale = doEscapingScaleArray[ outChannel ];

          // bias wieghts scaled.
          this.biasesArray[ biasIndex ] *= doEscapingScale;

          ++biasIndex;

        } // outChannelSub, outChannel
      } // inChannel

    } else { // ( !this.biasesArray ).
      // Do nothing. No biases array to be doEscapingScale.
    }
  }


  get bHigherHalfDifferent() {
    return (
         ( this.nHigherHalfDifferent )
      && ( this.nHigherHalfDifferent
             != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE )
    );
  }

}
