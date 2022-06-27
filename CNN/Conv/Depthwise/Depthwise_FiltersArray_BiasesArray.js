export { FiltersArray_BiasesArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "./Depthwise_ChannelPartInfo.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * Extract depthwise convolution filters and biases.
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
 * @member {BoundsArraySet.Depthwise} boundsArraySet
 *   The element value bounds (per channel) of this depthwise convolution.
 *
 * @member {number} inputHeight
 *   The height of input image. When ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} inputWidth
 *   The width of input image. When ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} nPassThroughStyleId
 *   The pass-through style id (ValueDesc.PassThroughStyle.Singleton.Ids.Xxx) of this convolution. It only affect the channels
 * which need to be pass-through from input to output.
 *
 * @member {ValueDesc.Depthwise_HigherHalfDifferent} nHigherHalfDifferent
 *   - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ), it is just a normal depthwise convolution.
 *

//!!! ...unfinished... (2021/11/12) What if channel multiplier is 0? is 2?

 *   - If ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ):
 *
 *     - Can not be used when:
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier )
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2 ),
 *         (i.e. bHigherHalfDepthwise2, for depthwise1 of ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the input channels between 0 and ( inputChannelCount_lowerHalf - 1 ) are depthwise1, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are depthwise2. These two filters (and biases) will be
 *         extracted in sequence, but they will be combined into one larger filters (and biases). This makes these filters' weights
 *         are arranged the same as ShuffleNetV2's head. So that the same filters weights could be used in these two architectures
 *         for comparing performance and correctness.
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 *         (i.e. bHigherHalfPassThrough, for depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail),
 *         the filters for the input channels between ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) will just pass
 *         through the input to output.
 *
 * @member {boolean} bHigherHalfDifferent
 *   It will be false, if ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ).
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half channel count of input image. When ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ),
 * it will be used and must be a positive integer.
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
 * @see PadInfoCalculator
 */
let FiltersArray_BiasesArray = ( ParentClass = Object ) => class FiltersArray_BiasesArray extends PadInfoCalculator( ParentClass ) {

  /**
   * Used as default Depthwise.FiltersArray_BiasesArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.FiltersArray_BiasesArray.Pool", FiltersArray_BiasesArray, FiltersArray_BiasesArray.setAsConstructor );

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf,
    ...restArgs ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, ...restArgs );

    FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );
  }

  /** @override */
  static setAsConstructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf,
    ...restArgs ) {

    super.setAsConstructor(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, ...restArgs );

    FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );

    return this;
  }

  /** @override */
  static setAsConstructor_self(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nPassThroughStyleId = nPassThroughStyleId;
    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;

    this.tensorWeightCountExtracted_internal = 0;
    this.tensorWeightCountTotal_internal = 0;

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {

      if ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ) {
        let msg = `Depthwise.FiltersArray_BiasesArray.setAsConstructor_self(): `
          + `nHigherHalfDifferent ( ${ValueDesc.Depthwise_HigherHalfDifferent.Singleton.getStringOf( nHigherHalfDifferent )} ) `
          + `should be ( NONE ) when `
          + `AvgMax_Or_ChannelMultiplier is ( ${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getStringOf( AvgMax_Or_ChannelMultiplier )} )`
          ;

        throw msg;
      }
    }

    // (2021/07/20)
    // Note: In backend WASM, when filter width is 1 (note: filter height does not have this issue and could be 1), it seems that
    // tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() will calculate wrongly. In backend CPU and WebGL, this problem does
    // not exist.
    //
    // (2022/05/01)
    // The tensorflow.js team seems not recognize this issue as a problem and will not fix it. So, we need get around it by
    // ourselves testing procedure.
    if ( AvgMax_Or_ChannelMultiplier != 0 ) {
      if ( ( filterWidth == 1 ) && ( tf.getBackend() == "wasm" ) ) {
        throw Error(
          `Depthwise.FiltersArray_BiasesArray.setAsConstructor_self(): `
            + `In backend WASM, it seems that tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() can not work with filterWidth = 1.`
        );
      }
    }

    if ( this.bHigherHalfDifferent ) {
      if ( inputChannelCount_lowerHalf > inputChannelCount )
        throw Error( `Depthwise.FiltersArray_BiasesArray.setAsConstructor_self(): `
          + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) can not be larger than `
          + `inputChannelCount ( ${this.inputChannelCount} ).`
        );
    }
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /**
   * Extract depthwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted_internal
   *   - this.tensorWeightCountTotal_internal
   *   - this.boundsArraySet
   *   - this.poolWindowShape ( if ( this.AvgMax_Or_ChannelMultiplier < 0 ) )
   *   - this.filtersShape    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.filtersArray    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this depthwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray ) {

    let bInitOk;

    let keptObjectArray;
    try {
      // It will be filled with: [ bInitOk, boundsArraySet, poolWindowShape, filtersShape, filtersArray, biasesShape, biasesArray ].
      // It is mainly used for preventing these elements been recycled by .sessionCall().
      //
      keptObjectArray = Recyclable.Array.Pool.get_or_create_by( 6 );

      Pool.All.sessionCall( FiltersArray_BiasesArray.init_internal, this,
        inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, keptObjectArray );

      bInitOk = keptObjectArray[ 0 ];

    } catch ( e ) {
      throw e:

    } finally {
      if ( keptObjectArray ) {
        keptObjectArray.disposeResources_and_recycleToPool();
        keptObjectArray = null;
      }
    }

    return bInitOk;
  }

  /**
   * Extract depthwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted_internal
   *   - this.tensorWeightCountTotal_internal
   *   - this.boundsArraySet
   *   - this.poolWindowShape ( if ( this.AvgMax_Or_ChannelMultiplier < 0 ) )
   *   - this.filtersShape    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.filtersArray    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this depthwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Object[]} o_keptObjectArray
   *   Return [ bInitOk, this.boundsArraySet, this.poolWindowShape, this.filtersShape, this.filtersArray, this.biasesShape, this.biasesArray ].
   * The bInitOk will be true, if succeeded.
   *
   * @return {boolean}
   *   Return o_keptObjectArray.
   */
  static init_internal( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, o_keptObjectArray ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    if ( this.inputChannelCount != inputScaleBoundsArray.length )
      throw Error( `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as `
        + `outputChannelCount of previous convolution-bias-activation ( ${inputScaleBoundsArray.length} ).`
      );

    if ( this.inputChannelCount != inputScaleBoundsArray.scaleArraySet.undo.length )
      throw Error( `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as the length of `
        + `.output.scaleArraySet.undo of previous convolution-bias-activation `
        + `( ${inputScaleBoundsArray.scaleArraySet.undo.length} ).`
      );


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    o_keptObjectArray.lnegth = 7;
    o_keptObjectArray[ 0 ] = false; // bInitOk.

//!!! ...unfinished... (2022/01/11) What about ( bDepthwise == false )?

//!!! ...unfinished... (2022/01/09)
// Even if ( this.AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.

//!!! (2022/01/09 Remarked) Wrong!
//     if ( this.AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE )
//       return o_keptObjectArray; // Nothing needs to be extracted.


    // Calculate lower half and higher half channel count.
    //
    // Even if avg/max pooling or ( bHigherHalfDifferent == false ), these are still correct.
    //
    if ( this.inputChannelCount_lowerHalf != undefined ) {
      this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
      this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.channelMultiplier;
      this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;
    }

    // Determine shape of the filters, biases, channels.
    let aChannelPartInfoArray;
    let aFiltersBiasesPartInfoArray;
    let filtersWeightCount_extracted, biasesWeightCount_extracted;

    // Set up aFiltersBiasesPartInfoArray and filtersShape and biasesShape.
    {
      if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

        // In normal depthwise avg/max pooling, use specified specified channel count as extracted channel count.
        // Although they are not used to extract avg/max filters, they will be used for extracting bias.
        this.inputChannelCount_toBeExtracted = this.inputChannelCount;
        this.outputChannelCount_toBeExtracted = this.outputChannelCount;

        // Note: avg/max pooling do not have this.filtersShape to be extracted.
        this.poolWindowShape = Recyclable.Array.Pool.get_or_create_by( 2 );
        this.poolWindowShape[ 0 ] = this.filterHeight;
        this.poolWindowShape[ 1 ] = this.filterWidth;

        if ( this.bBias ) {
          this.biasesShape = Recyclable.Array.Pool.get_or_create_by( 1 );
          this.biasesShape[ 0 ] = this.outputChannelCount;

          biasesWeightCount_extracted = this.outputChannelCount;
        }

//!!! (2022/06/22 Remarked) Replaced by pool.
//         aFiltersBiasesPartInfoArray = [
//           new FiltersBiasesPartInfo( [
//             new ChannelPartInfo( this.inputChannelCount ) ] )
//         ];

        aChannelPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
        aChannelPartInfoArray[ 0 ] = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount );

        aFiltersBiasesPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
        aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfo.Pool.get_or_create_by( aChannelPartInfoArray );

      } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).

        switch ( this.nHigherHalfDifferent ) {
          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
            this.inputChannelCount_toBeExtracted = this.inputChannelCount;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//!!! (2022/06/22 Remarked) Replaced by pool.
//             aFiltersBiasesPartInfoArray = [
//               new FiltersBiasesPartInfo( [
//                 new ChannelPartInfo( this.inputChannelCount ) ] )
//             ];

            aChannelPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
            aChannelPartInfoArray[ 0 ] = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount );

            aFiltersBiasesPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
            aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfo.Pool.get_or_create_by( aChannelPartInfoArray );
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1)

            if ( this.inputChannelCount_lowerHalf <= 0 )
              throw Error( `Depthwise.FiltersArray_BiasesArray.extractAs_HigherHalfDepthwise2(): `
                + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
              );

            // Extract filters and biases for the specified channel count, but in different sequence.
            this.inputChannelCount_toBeExtracted = this.inputChannelCount;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//!!! (2022/06/22 Remarked) Replaced by pool.
//             aFiltersBiasesPartInfoArray = [
//               new FiltersBiasesPartInfo( [
//                 new ChannelPartInfo( this.inputChannelCount_lowerHalf  ) ] ),
//               new FiltersBiasesPartInfo( [
//                 new ChannelPartInfo( this.inputChannelCount_higherHalf ) ] )
//             ];

            aFiltersBiasesPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 2 );

            {
              aChannelPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
              aChannelPartInfoArray[ 0 ] = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount_lowerHalf );

              aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfo.Pool.get_or_create_by( aChannelPartInfoArray );
            }

            {
              aChannelPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
              aChannelPartInfoArray[ 0 ] = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount_higherHalf );

              aFiltersBiasesPartInfoArray[ 1 ] = FiltersBiasesPartInfo.Pool.get_or_create_by( aChannelPartInfoArray );
            }
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2)

            if ( this.inputChannelCount_lowerHalf <= 0 )
              throw Error( `Depthwise.FiltersArray_BiasesArray.extractAs_HigherHalfPassThrough(): `
                + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
              );

            // Just extract filters and biases for half of the specified channel count.
            this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

//!!! (2022/06/22 Remarked) Replaced by pool.
//             aFiltersBiasesPartInfoArray = [
//               new FiltersBiasesPartInfo( [
//                 new ChannelPartInfo( this.inputChannelCount_lowerHalf ),
//                 new ChannelPartInfo( this.inputChannelCount_higherHalf, this.padHeightTop, this.padWidthLeft ) ] )
//             ];

            aChannelPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 2 );
            aChannelPartInfoArray[ 0 ]
              = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount_lowerHalf );
            aChannelPartInfoArray[ 1 ]
              = ChannelPartInfo.Pool.get_or_create_by( this.inputChannelCount_higherHalf, this.padHeightTop, this.padWidthLeft );

            aFiltersBiasesPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 1 );
            aFiltersBiasesPartInfoArray[ 0 ] = FiltersBiasesPartInfo.Pool.get_or_create_by( aChannelPartInfoArray );
            break;

          default:
            throw Error(
              `Depthwise.FiltersArray_BiasesArray.init(): `
                + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) is unknown value.`
            );
            break;
        }

        this.filtersShape = Recyclable.Array.Pool.get_or_create_by( 4 );
        this.filtersShape[ 0 ] = this.filterHeight;
        this.filtersShape[ 1 ] = this.filterWidth;
        this.filtersShape[ 2 ] = this.inputChannelCount;
        this.filtersShape[ 3 ] = this.channelMultiplier;

        filtersWeightCount_extracted = this.filterHeight * this.filterWidth * this.inputChannelCount_toBeExtracted * this.channelMultiplier;

        if ( this.bBias ) {
          this.biasesShape = Recyclable.Array.Pool.get_or_create_by( 1 );
          this.biasesShape[ 0 ] = this.outputChannelCount;

          biasesWeightCount_extracted = this.outputChannelCount_toBeExtracted;
        }

      } else { // No depthwise (i.e. zero) (so no channel multiplier).
        aFiltersBiasesPartInfoArray = Recyclable.Array.Pool.get_or_create_by( 0 );
        // Note: In this case, even if ( this.bBias == true ), the biasesArray will still not be extracted.
      }
    }

    // Prepare result filters and biases array.
    if ( this.filtersShape )
      this.filtersArray = Recyclable.Array.Pool.get_or_create_by( tf.util.sizeFromShape( this.filtersShape ) );
    if ( this.biasesShape )
      this.biasesArray = Recyclable.Array.Pool.get_or_create_by( tf.util.sizeFromShape( this.biasesShape ) );

    // Calculate weights count of filters and biases to be extracted.
    let weightsCount_extracted = 0;
    if ( filtersWeightCount_extracted )
      weightsCount_extracted += filtersWeightCount_extracted;
    if ( biasesWeightCount_extracted )
      weightsCount_extracted += biasesWeightCount_extracted

    // Prepare source weights to be extracted.
    let sourceWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, weightsCount_extracted );
    if ( !sourceWeights.extract() )
      return o_keptObjectArray;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = sourceWeights.defaultByteOffsetEnd;
    this.tensorWeightCountExtracted_internal = weightsCount_extracted;

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
        //
        // Note: Even if avg/max pooling, input value bounds is the same as the previous ooutput value bounds

//!!! (2022/06/22 Remarked) Use pool instead.
//        this.boundsArraySet = new BoundsArraySet.Depthwise( inputScaleBoundsArray, this.outputChannelCount );

        this.boundsArraySet = BoundsArraySet.Depthwise.Pool.get_or_create_by( inputScaleBoundsArray, this.outputChannelCount );
      }

      // Round 1
      {
        this.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(
          sourceWeights.weights, inputScaleBoundsArray, aFiltersBiasesPartInfoArray );

        this.boundsArraySet.set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray );

        // Determine .activationEscaping_ScaleArraySet, .afterActivationEscaping, .afterActivation
        {
          if (   ( this.AvgMax_Or_ChannelMultiplier < 0 )
              && (   ( this.bBias == false )
                  && ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE )
                 )
             ) {

            // For avg/max pooling, if it has no bias and no activation), the value bounds does not change (i.e. should be the same as input).
            //
            // In this case, the previous activation-escaping needs not be undo (so undoPreviousEscapingScale could be not 1). Using them
            // as this avg/max pooling's activation-escaping since they can not be calculated in fact.
            //
            this.boundsArraySet.set_outputs_all_by_input0();
          } else {
            this.boundsArraySet.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( this.nActivationId );
          }
        }
      }

      // Round 2
      this.apply_doEscapingScale_to_filtersArray_biasesArray(); // Apply doEscapingScale.
    }

    {
      this.tensorWeightCountTotal_internal = 0;

      if ( this.filtersShape )
        this.tensorWeightCountTotal_internal += tf.util.sizeFromShape( this.filtersShape );

      if ( this.biasesShape )
        this.tensorWeightCountTotal_internal += tf.util.sizeFromShape( this.biasesShape );
    }

    o_keptObjectArray[ 0 ] = true; // bInitOk.
    o_keptObjectArray[ 1 ] = this.boundsArraySet;
    o_keptObjectArray[ 2 ] = this.poolWindowShape;
    o_keptObjectArray[ 3 ] = this.filtersShape;
    o_keptObjectArray[ 4 ] = this.filtersArray;
    o_keptObjectArray[ 5 ] = this.biasesShape;
    o_keptObjectArray[ 6 ] = this.biasesArray;

    return o_keptObjectArray;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {

    if ( this.boundsArraySet ) {
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }

    if ( this.biasesArray ) {
      Recyclable.Array.Pool.recycle( this.biasesArray );
      this.biasesArray = null;
    }

    if ( this.biasesShape ) {
      Recyclable.Array.Pool.recycle( this.biasesShape );
      this.biasesShape = null;
    }

    if ( this.filtersArray ) {
      Recyclable.Array.Pool.recycle( this.filtersArray );
      this.filtersArray = null;
    }

    if ( this.filtersShape ) {
      Recyclable.Array.Pool.recycle( this.filtersShape );
      this.filtersShape = null;
    }

    if ( this.poolWindowShape ) {
      Recyclable.Array.Pool.recycle( this.poolWindowShape );
      this.poolWindowShape = null;
    }

    this.tensorWeightCountTotal_internal = 0;
    this.tensorWeightCountExtracted_internal = 0;

    this.byteOffsetBegin = this.byteOffsetEnd = -1;

    super.disposeResources();
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
   * set of this depthwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Depthwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
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

      // Because biases is fetched by adding, it should be initialized to zero. (Note: The .filtersArray is fetched by assigning, so
      // it needs not be initialized.)
      //
      if ( this.biasesArray ) {
        this.biasesArray.fill( 0 );
      }
    }

    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex = 0, filterIndex = 0, biasIndex = 0;

    let inChannelBegin = 0, inChannelEnd = 0,   // [ inChannelBegin, inChannelEnd ) are input channels of the current FiltersBiasesPart.
        outChannelBegin = 0, outChannelEnd = 0; // [ outChannelBegin, outChannelEnd ) are output channels of the current FiltersBiasesPart.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      if ( this.filtersArray ) {
        inChannelBegin = inChannelEnd;                 // Begin from the ending of the previous FiltersBiasesPart.
        filterIndex = outChannelBegin = outChannelEnd; // Begin from the ending of the previous FiltersBiasesPart.

        for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
          for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

            for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
              for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

                // The filter's dilation part needs not be extracted from weights array. (They are always zero.)
                if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                  continue;

                let inChannel = inChannelBegin;
                let outChannel = outChannelBegin;

                InChannelPartIndexLoop:
                for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
                  let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

                  for ( let inChannelSub = 0; inChannelSub < inChannelPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
                    if ( inChannel >= this.inputChannelCount )
                      break InChannelPartIndexLoop; // Never exceeds the total input channel count.

                    let undoPreviousEscapingScale = inputScaleBoundsArray.scaleArraySet.undo.scales[ inChannel ];
                    let filterValuePassThrough = thePassThroughStyleInfo.filterValue * undoPreviousEscapingScale;

                    for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

                      // Note: The .afterUndoPreviousActivationEscaping has already been multiplied by undoPreviousEscapingScale.

                      if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                        if ( inChannelPartInfo.isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) ) {

                          this.filtersArray[ filterIndex ] = filterValuePassThrough; // The only one filter position (in the pass-through part) may have non-zero value.
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

                      ++filterIndex;

                    } // outChannelSub, outChannel
                  } // inChannelSub, inChannel
                } // inChannelPartIndex

                inChannelEnd = inChannel;   // Record the ending input channel index of the current FiltersBiasesPart.
                outChannelEnd = outChannel; // Record the ending output channel index of the current FiltersBiasesPart.
                filterIndex += ( this.outputChannelCount - outChannel ) + outChannelBegin; // Jump to the outChannelBegin of the next inChannel.

              } // dilationFilterX
            } // filterX
          } // dilationFilterY
        } // filterY

      } else { // ( !this.filtersArray ). No filters array to be extracted. (i.e. avg/max pooling)

        // For avg/max pooling, the value bounds does not change.
        this.boundsArraySet.afterFilter.set_all_byBoundsArray( this.boundsArraySet.afterUndoPreviousActivationEscaping );

        for ( ; inChannelEnd < this.inputChannelCount; ++inChannelEnd ) {

          // Confirm no need to undo previous activaction-escaping (when has bias or has activation), because
          // avg/max pooling can not do that in these situations.
          //
          if (   ( this.bBias != false )
              || ( this.nActivationId != ValueDesc.ActivationFunction.Singleton.Ids.NONE ) ) {

            let undoPreviousEscapingScale = inputScaleBoundsArray.scaleArraySet.undo.scales[ inChannelEnd ];

            if ( undoPreviousEscapingScale != 1 ),
              throw Error(
                  `Depthwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(): `
                + `For avg/max pooling, `
                + `if ( bBias ( ${this.bBias} ) is not false ) or `
                + `( nActivationId ( ${ValueDesc.ActivationFunction.Singleton.getStringOf( this.nActivationId )}(${this.nActivationId}) ) `
                  + `is not ValueDesc.ActivationFunction.Singleton.Ids.NONE(0) ), `
                + `undoPreviousEscapingScale[ ${inChannelEnd} ] ( ${undoPreviousEscapingScale} ) must be 1 .`
              );
          }

        } // inChannel
      }


      if ( this.biasesArray ) {
        let biasValue;
        let inChannel = inChannelBegin;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let inChannelSub = 0; inChannelSub < inChannelPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
            if ( inChannel >= this.inputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total input channel count.

            for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

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
          } // inChannel
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

    if ( inChannelEnd != this.inputChannelCount )
      throw Error( `Depthwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_afterFilter_afterBias_apply_undoPreviousEscapingScale(): `
        + `aFiltersBiasesPartInfoArray[ inChannelPartInfoArray[] ] total input channel count ( ${inChannelEnd} ) `
        +`should be ( ${this.inputChannelCount} ).` );
  }

  /**
   * Apply this.boundsArraySet.output0.scaleArraySet.do.scales[] to this.filtersArray and this.biasesArray.
   */
  apply_doEscapingScale_to_filtersArray_biasesArray() {

    if ( this.filtersArray ) {
      let filterIndex = 0;

      for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
        for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

          for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
            for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

              // The filter's dilation part needs not be extracted from weights array. (They are always zero.)
              if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                continue;

              let outChannel = 0;
              for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
                for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

                  let doEscapingScale = this.boundsArraySet.output0.scaleArraySet.do.scales[ outChannel ];
                  this.filtersArray[ filterIndex ] *= doEscapingScale; // filter wieghts scaled.

                  ++filterIndex;

                } // outChannelSub, outChannel
              } // inChannel
            } // dilationFilterX
          } // filterX
        } // dilationFilterY
      } // filterY

    } else { // ( !this.filtersArray ).
      // Do nothing. No filters array to be doEscapingScale. (i.e. avg/max pooling)
    }

    if ( this.biasesArray ) {
      let biasIndex = 0;

      let outChannel = 0;
      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
        for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

          let doEscapingScale = this.boundsArraySet.output0.scaleArraySet.do.scales[ outChannel ];
          this.biasesArray[ biasIndex ] *= doEscapingScale; // bias wieghts scaled.

          ++biasIndex;

        } // outChannelSub, outChannel
      } // inChannel

    } else { // ( !this.biasesArray ).
      // Do nothing. No biases array to be doEscapingScale.
    }
  }


  get bHigherHalfDifferent() {
    return ( this.nHigherHalfDifferent ) && ( this.nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE );
  }

}
