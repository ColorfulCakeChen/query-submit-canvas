export { InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ChannelCountCalculator from "./Block_ChannelCountCalculator.js";
import * as Depthwise from "../Depthwise.js";

/**
 * All properties inferenced from Block.Params.
 *
 */
class InferencedParams extends Recyclable.Root {

  /**
   * Used as default Block.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block.InferencedParams.Pool", InferencedParams, InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    super();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
  }

  /** @override */
  static setAsConstructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    super.setAsConstructor();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    InferencedParams.set_inferencedParams_by.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
  }

  /** @override */
  disposeResources() {
    this.DepthwisePadInfo_dispose();

    this.pointwise1ChannelCount_modified = undefined;
    this.depthwiseFilterHeight_modified = undefined;
    this.depthwiseFilterWidth_modified = undefined;

//!!! ...unfinished... (2022/07/18) Other properties?

    super.disposeResources();
  }

  /** Release .depthwisePadInfo */
  DepthwisePadInfo_dispose() {
    if ( this.depthwisePadInfo ) {
      this.depthwisePadInfo.disposeResources_and_recycleToPool();
      this.depthwisePadInfo = null;
    }
  }

  /**
   * Determine the following properties:
   *   - this.bLinear_between_depthwise_and_pointwise2
   *   - this.depthwiseFilterHeight_modified
   *   - this.depthwiseFilterWidth_modified
   *   - this.depthwiseBias
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.depthwisePadInfo (set if ( this.bDepthwiseRequestedAndNeeded == true ))
   *
   * When ( bDepthwiseRequestedAndNeeded == false ), the depthwise could be discarded to improve performance.
   */
  static set_depthwise_inferenced_by(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
  ) {

    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    //
    if ( ValueDesc.StridesPad.pad_isValid( depthwiseStridesPad ) ) {
      if ( depthwiseFilterHeight > input0_height )
        this.depthwiseFilterHeight_modified = input0_height;
      else
        this.depthwiseFilterHeight_modified = depthwiseFilterHeight;

      if ( depthwiseFilterWidth > input0_width )
        this.depthwiseFilterWidth_modified = input0_width;
      else
        this.depthwiseFilterWidth_modified = depthwiseFilterWidth;
    } else {
      this.depthwiseFilterHeight_modified = depthwiseFilterHeight;
      this.depthwiseFilterWidth_modified = depthwiseFilterWidth;
    }

    let bNoSqueezeExcitation_between_depthwise_and_pointwise2;
    {
      bNoSqueezeExcitation_between_depthwise_and_pointwise2 =

         // no squeeze-and-excitation (so there is no squeeze-and-excitation between depthwise and pointwise2)
        (   ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)

         // or, has squeeze-and-excitation, but after pointwise2.
         || ( bSqueezeExcitationPrefix == false )
        );
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {

      // Note: Because no depthwise, there is no depthwise activation function necessary to be considered.
      this.bLinear_between_depthwise_and_pointwise2 = bNoSqueezeExcitation_between_depthwise_and_pointwise2;

      this.depthwiseBias = false;
      this.bDepthwiseRequestedAndNeeded = false; // depthwise is not requested.

      if ( this.depthwisePadInfo ) // Clear it.
        this.depthwisePadInfo.set( 1, 1, 1, 0, 1, 1, 0 );

      return;
    }

    let bLinear_between_depthwise_and_pointwise2;
    {
      bLinear_between_depthwise_and_pointwise2 = this.bLinear_between_depthwise_and_pointwise2 =
         ( depthwiseActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) // depthwise has no activation function.
      && ( bNoSqueezeExcitation_between_depthwise_and_pointwise2 ) // no squeeze-and-excitation between depthwise and pointwise2.
      ;
    }

    {
      if ( bLinear_between_depthwise_and_pointwise2 )
        this.depthwiseBias = false; // Because its could be combined into the next operation's (i.e. pointwise2's) bias.
      else
        this.depthwiseBias = true;
    }

    let stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfo_byId( depthwiseStridesPad );

    let bChannelCountSame = Depthwise.PadInfoCalculatorRoot.output_channelCount_is_same_as_input( depthwise_AvgMax_Or_ChannelMultiplier );

    let bHeightWidthSame = Depthwise.PadInfoCalculatorRoot.output_height_width_is_same_as_input( input0_height, input0_width,
      depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight_modified, this.depthwiseFilterWidth_modified, stridesPadInfo );

    let bNoNeighborAnalysis = Depthwise.PadInfoCalculatorRoot.output_height_width_is_no_neighbor_analysis( input0_height, input0_width,
      depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight_modified, this.depthwiseFilterWidth_modified );

    // If a depthwise operation does not change output's ( height, width, channelCount ), does not analyze ( height, width ) neightbors,
    // does not non-linear, then it is equivalent to do nothing.
    //
    let bDepthwiseRequestedAndNeeded;
    {
      let depthwise_bDoesNothing = ( bChannelCountSame && bHeightWidthSame && bNoNeighborAnalysis && bLinear_between_depthwise_and_pointwise2 );
      if ( depthwise_bDoesNothing )
        bDepthwiseRequestedAndNeeded = this.bDepthwiseRequestedAndNeeded = false; // depthwise is requested, but is not necessary.
      else
        bDepthwiseRequestedAndNeeded = this.bDepthwiseRequestedAndNeeded = true; // depthwise is requested and is necessary.
    }

    // depthwisePadInfo
    if ( bDepthwiseRequestedAndNeeded ) { // When depthwise operation is necessary, infer its information.
      if ( this.depthwisePadInfo ) { // Re-using (instead of re-creating) may improve runtime speed.
        this.depthwisePadInfo.set(
          input0_height, input0_width, input0_channelCount, 
          depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight_modified, this.depthwiseFilterWidth_modified,
          depthwiseStridesPad );
      } else {
        this.depthwisePadInfo = Depthwise.PadInfoCalculatorRoot.Pool.get_or_create_by(
          input0_height, input0_width, input0_channelCount, 
          depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight_modified, this.depthwiseFilterWidth_modified,
          depthwiseStridesPad );
      }
    } else {
      if ( this.depthwisePadInfo ) { // Clear it.
        this.depthwisePadInfo.set( 1, 1, 1, 0, 1, 1, 0 );
      } else {
        // Do nothing.
      }
    }
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1_height
   *   - this.input1_width
   *   - this.input1_channelCount
   *   - this.bLinear_between_depthwise_and_pointwise2
   *   - this.depthwiseFilterHeight_modified
   *   - this.depthwiseFilterWidth_modified
   *   - this.depthwiseBias
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.depthwisePadInfo (set if ( this.bDepthwiseRequestedAndNeeded == true ))
   *
   */
  static set_inputTensorCount_input1_height_width_channelCount_depthwise_inferenced_by(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
  ) {

    // 1. input tensor count.
    this.inputTensorCount = ValueDesc.ConvBlockType.inputTensorCount_get( nConvBlockTypeId );

    // 2. depthwise inferenced information.
    InferencedParams.set_depthwise_inferenced_by.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    );
  
    // 3. input1 ( height, width, channelCount )

    if ( this.inputTensorCount <= 1 ) { // 3.1 No input1 (i.e. one input; only input0).
      this.input1_height = 0;
      this.input1_width = 0;
      this.input1_channelCount = 0;

    } else { // 3.2 Has input1 (i.e. two inputs).

      // 3.2.1 input1's height and width.
      if ( this.bDepthwiseRequestedAndNeeded ) { // When depthwise operation existed, it dominates height and width.
        this.input1_height = this.depthwisePadInfo.outputHeight;
        this.input1_width = this.depthwisePadInfo.outputWidth;
      } else {
        this.input1_height = input0_height;
        this.input1_width = input0_width;
      }

      // 3.2.2 input1's channel count
      switch ( nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:
          this.input1_channelCount = pointwise20ChannelCount; // (Note: pointwise20 always exists.)
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY:
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL:
          if ( this.bDepthwiseRequestedAndNeeded ) {
            this.input1_channelCount = this.depthwisePadInfo.outputChannelCount; // i.e. the same as depthwise1's output channel count.
          } else {
            if ( pointwise1ChannelCount > 0 ) {
              this.input1_channelCount = pointwise1ChannelCount;
            } else {
              this.input1_channelCount = input0_channelCount;
            }
          }
          break;

        default: // No input1 (i.e. one input; only input0). It should not execute to here.
          this.input1_height = 0;
          this.input1_width = 0;
          this.input1_channelCount = 0;

          if ( this.inputTensorCount > 1 )
            throw Error(
              `Block.InferencedParams.set_inputTensorCount_input1_height_width_channelCount_bDepthwiseRequestedAndNeeded_depthwisePadInfo_by(): `
              + `When ( nConvBlockTypeId == `
              + `${ValueDesc.ConvBlockType.Singleton.getName_byId( nConvBlockTypeId )}`
              + `(${nConvBlockTypeId}) ), `
              + `input tensor count ( ${this.inputTensorCount} ) should be one.`
            );
          break;
      }
    }
  }

  /**
   * Determine the following properties:
   *   - this.bLinear_between_pointwise1_and_depthwise
   *   - this.bLinear_between_pointwise1_and_pointwise2
   *   - this.pointwise1Bias
   *   - this.pointwise1ActivationId
   *   - this.pointwise1ActivationName
   */
  static set_pointwise1Bias_pointwise1ActivationId_pointwise1ActivationName_by(
    pointwise1ChannelCount,
    bLinear_between_depthwise_and_pointwise2,
    bDepthwiseRequestedAndNeeded,
    depthwisePadInfo, // Used if ( this.bDepthwiseRequestedAndNeeded == true ))
    nActivationId,
  ) {

    // 1. If no pointwise1, there is no bias and no activation.
    if ( pointwise1ChannelCount <= 0 ) {
      this.pointwise1Bias = false;
      this.pointwise1ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      this.bLinear_between_pointwise1_and_depthwise = true;

      if ( bDepthwiseRequestedAndNeeded ) {
        if ( depthwisePadInfo.stridesPadInfo.pad_isValid() ) {
          this.bLinear_between_pointwise1_and_pointwise2 = true;
        } else {
          this.bLinear_between_pointwise1_and_pointwise2 = false; // depthwise with ( pad = "same" ) should be viewed as non-linear.
        }
      } else { // no depthwise.
        if ( bLinear_between_depthwise_and_pointwise2 ) {
          this.bLinear_between_pointwise1_and_pointwise2 = true
        } else {
          this.bLinear_between_pointwise1_and_pointwise2 = false;
        }
      }

    // 2. If pointwise1 exists.
    } else {

      this.pointwise1ActivationId = nActivationId;

      let bLinear_between_pointwise1_and_depthwise = this.bLinear_between_pointwise1_and_depthwise =
         ( this.pointwise1ActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ); // pointwise1 has no activation function.

      if ( bLinear_between_pointwise1_and_depthwise ) {
        if ( bDepthwiseRequestedAndNeeded ) {
          if ( depthwisePadInfo.stridesPadInfo.pad_isValid() ) {
            this.pointwise1Bias = false;
            this.bLinear_between_pointwise1_and_pointwise2 = true;
          } else {
            this.pointwise1Bias = true;
            this.bLinear_between_pointwise1_and_pointwise2 = false; // depthwise with ( pad = "same" ) should be viewed as non-linear.
          }
        } else { // no depthwise.
          if ( bLinear_between_depthwise_and_pointwise2 ) {
            this.pointwise1Bias = false;
            this.bLinear_between_pointwise1_and_pointwise2 = true;
          } else {
            this.pointwise1Bias = true;
            this.bLinear_between_pointwise1_and_pointwise2 = false;
          }
        }
      } else {
        this.pointwise1Bias = true;
        this.bLinear_between_pointwise1_and_pointwise2 = false;
      }

    }

    // 3.
    this.pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.getName_byId( this.pointwise1ActivationId );
  }

  /**
   * Determine the following properties:
   *   - this.squeezeExcitationActivationId
   *   - this.squeezeExcitationActivationName
   */
  static set_squeezeExcitationActivationId_squeezeExcitationActivationName_by( nActivationId ) {
    this.squeezeExcitationActivationId = nActivationId;
    this.squeezeExcitationActivationName = ValueDesc.ActivationFunction.Singleton.getName_byId( this.squeezeExcitationActivationId );
  }

  /**
   * Determine the following properties:
   *   - this.pointwise21ChannelCount
   *   - this.pointwise21Bias
   *   - this.pointwise21ActivationId
   *   - this.pointwise21ActivationName
   */
  static set_pointwise21ChannelCount_pointwise21Bias_pointwise21ActivationId_by(
    nConvBlockTypeId, pointwise20ChannelCount, pointwise20Bias, pointwise20ActivationId ) {

    // Note: Even if ( outputTensorCount == 2 ), it does not means pointwise21 existed.
    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );
    if ( infoConvBlockType.bPointwise21 ) {
      this.pointwise21ChannelCount = pointwise20ChannelCount; // Still may be 0.
    } else {
      this.pointwise21ChannelCount = 0; // No pointwise21.
    }
    this.pointwise21Bias = pointwise20Bias;
    this.pointwise21ActivationId = pointwise20ActivationId;
    this.pointwise21ActivationName = ValueDesc.ActivationFunction.Singleton.getName_byId( this.pointwise21ActivationId );
  }

  /**
   * Determine the following properties:
   *   - this.pointwise1ChannelCount_modified
   *   - this.pointwise1Bias (may be modified)
   *   - this.pointwise1ActivationId (may be modified)
   *   - this.pointwise1ActivationName (may be modified)
   *   - this.pointwise1_nHigherHalfDifferent
   *   - this.pointwise1_inputChannelCount_lowerHalf
   *   - this.pointwise1_inputChannelCount_higherHalf
   *   - this.pointwise1_outputChannelCount_lowerHalf
   *
   */
  static set_pointwise1_nHigherHalfDifferent_modify_pointwise1ChannelCount_pointwise1Bias_pointwise1ActivationId_by(
    input0_channelCount, nConvBlockTypeId, pointwise1ChannelCount
  ) {
    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );

    this.pointwise1ChannelCount_modified = undefined;
    this.pointwise1_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    this.pointwise1_inputChannelCount_lowerHalf = undefined;
    this.pointwise1_inputChannelCount_higherHalf = undefined;
    this.pointwise1_outputChannelCount_lowerHalf = undefined;

//!!! ...unfinished... (2021/11/15) What if ( depthwise_AvgMax_Or_ChannelMultiplier > 1 )?

    if ( infoConvBlockType.bHigherHalfDifferent == true ) {

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's head)
      if ( infoConvBlockType.bHigherHalfDepthwise2 == true ) {

        this.pointwise1_inputChannelCount_lowerHalf = input0_channelCount;

        if ( pointwise1ChannelCount > 0 ) {
          this.pointwise1_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF;
          this.pointwise1_outputChannelCount_lowerHalf = pointwise1ChannelCount; // For depthwise1 (by specified channel count)

        } else {

          this.pointwise1_nHigherHalfDifferent
            = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH;

          // Since this is an almost copy operation, bias and activation is not necessary.
          this.pointwise1Bias = false;
          this.pointwise1ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
          this.pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.getName_byId( this.pointwise1ActivationId );

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
          input0_channelCount, pointwise1ChannelCount );

        this.pointwise1_inputChannelCount_lowerHalf = pointwise1_higherHalfPassThrough.inputChannelCount_lowerHalf;
        this.pointwise1_outputChannelCount_lowerHalf = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;

        pointwise1_higherHalfPassThrough.disposeResources_and_recycleToPool();
        pointwise1_higherHalfPassThrough = null;
      }

    // In other cases, Pointwise.Base could handle ( pointwise1ChannelCount == 0 ) correctly.
    }

    if ( this.pointwise1_inputChannelCount_lowerHalf > 0 )
      this.pointwise1_inputChannelCount_higherHalf = input0_channelCount - this.pointwise1_inputChannelCount_lowerHalf;
  }

  /**
   * Determine the following properties:
   *   - this.pointwise1ChannelCount_modified
   *   - this.pointwise1Bias (may be modified)
   *   - this.pointwise1ActivationId (may be modified)
   *   - this.pointwise1ActivationName (may be modified)
   *   - this.pointwise1_nHigherHalfDifferent
   *   - this.pointwise1_inputChannelCount_lowerHalf
   *   - this.pointwise1_inputChannelCount_higherHalf
   *   - this.pointwise1_outputChannelCount_lowerHalf
   *   - this.depthwise1_nHigherHalfDifferent
   *   - this.pointwise20_nHigherHalfDifferent
   *   - this.pointwise20_outputChannelCount_lowerHalf
   *
   */
  static set_nHigherHalfDifferent_by( input0_channelCount, nConvBlockTypeId, pointwise1ChannelCount, pointwise20ChannelCount ) {
    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );

    // pointwise1
    InferencedParams.set_pointwise1_nHigherHalfDifferent_modify_pointwise1ChannelCount_pointwise1Bias_pointwise1ActivationId_by.call( this,
      input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount
    );

    // depthwise1
    {
      this.depthwise1_nHigherHalfDifferent = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE;

      if ( infoConvBlockType.bHigherHalfDifferent == true ) {

        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
        // (i.e. bHigherHalfDepthwise2, for depthwise1 of ShuffleNetV2_ByMobileNetV1's head)
        if ( infoConvBlockType.bHigherHalfDepthwise2 == true ) {
          this.depthwise1_nHigherHalfDifferent = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2;

        // If depthwise1's higher half is responsible for achieving pass-through, it needs height and width of input image.
        //
        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
        // (i.e. bHigherHalfPassThrough, for depthwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
        } else {
          this.depthwise1_nHigherHalfDifferent = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;
        }
      }
    }

    // pointwise20
    {
      this.pointwise20_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
      this.pointwise20_outputChannelCount_lowerHalf = undefined;

      if ( infoConvBlockType.bHigherHalfDifferent == true ) {

        // In this case, it should be according to half of pointwise20ChannelCount (just like pointwise1).
        // Note: Unlike pointwise1ChannelCount (which may be zero), pointwise20ChannelCount is always positive.
        this.pointwise20_outputChannelCount_lowerHalf = Math.ceil( pointwise20ChannelCount / 2 );

        // For bHigherHalfAnotherPointwise(Shuffle) (i.e. ( pointwise20ChannelCount > 0 ) ).
        //
        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
        // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's head)
        if ( infoConvBlockType.bHigherHalfDepthwise2 == true ) {
          this.pointwise20_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE;

        // For bHigherHalfPassThrough(Shuffle) (i.e. ( pointwise20ChannelCount > 0 ) ).
        //
        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
        // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
        // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
        } else {
          this.pointwise20_nHigherHalfDifferent = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;
        }
      }
    }
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1_height
   *   - this.input1_width
   *   - this.input1_channelCount
   *   - this.bLinear_between_pointwise1_and_depthwise
   *   - this.bLinear_between_pointwise1_and_pointwise2
   *   - this.pointwise1ChannelCount_modified
   *   - this.pointwise1Bias
   *   - this.pointwise1ActivationId
   *   - this.pointwise1ActivationName
   *   - this.pointwise1_nHigherHalfDifferent
   *   - this.pointwise1_inputChannelCount_lowerHalf
   *   - this.pointwise1_inputChannelCount_higherHalf
   *   - this.pointwise1_outputChannelCount_lowerHalf
   *   - this.bLinear_between_depthwise_and_pointwise2
   *   - this.depthwiseFilterHeight_modified
   *   - this.depthwiseFilterWidth_modified
   *   - this.depthwiseBias
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.depthwisePadInfo (set if ( this.bDepthwiseRequestedAndNeeded == true ))
   *   - this.depthwise1_nHigherHalfDifferent
   *   - this.bDepthwise2Requested
   *   - this.bConcat1Requested
   *   - this.bAddInputToOutputRequested
   *   - this.bConcat2ShuffleSplitRequested
   *   - this.bHigherHalfDifferent
   *   - this.bHigherHalfDepthwise2
   *   - this.pointwise20Bias
   *   - this.pointwise20_nHigherHalfDifferent
   *   - this.pointwise20_outputChannelCount_lowerHalf
   *   - this.pointwise20_channelShuffler_outputGroupCount
   *   - this.pointwise21ChannelCount
   *   - this.pointwise21Bias
   *   - this.pointwise21ActivationId
   *   - this.pointwise21ActivationName
   *   - this.squeezeExcitationActivationId
   *   - this.squeezeExcitationActivationName
   *   - this.outputTensorCount
   *
   */
  static set_inferencedParams_by(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {

    // 0. Prepare.
    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );

    this.pointwise20Bias = true; // pointwise2 always has bias.

    // 1. The input1 channel count.
    InferencedParams.set_inputTensorCount_input1_height_width_channelCount_depthwise_inferenced_by.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    );

    // 2. The output tensor count.
    this.outputTensorCount = infoConvBlockType.outputTensorCount;

    // 3.
    this.bDepthwise2Requested = infoConvBlockType.bDepthwise2Requested;
    this.bConcat1Requested = infoConvBlockType.bConcat1Requested;
    this.bAddInputToOutputRequested = infoConvBlockType.bAddInputToOutputRequested;
    this.bConcat2ShuffleSplitRequested = infoConvBlockType.bConcat2ShuffleSplitRequested;

    // 4. Whether manipulate the higher half channel of convolution.
    this.bHigherHalfDifferent = infoConvBlockType.bHigherHalfDifferent;
    this.bHigherHalfDepthwise2 = infoConvBlockType.bHigherHalfDepthwise2;
    this.pointwise20_channelShuffler_outputGroupCount = infoConvBlockType.pointwise20_channelShuffler_outputGroupCount;

    // 5. Pointwise1
    InferencedParams.set_pointwise1Bias_pointwise1ActivationId_pointwise1ActivationName_by.call( this,
      pointwise1ChannelCount,
      this.bLinear_between_depthwise_and_pointwise2,
      this.bDepthwiseRequestedAndNeeded,
      this.depthwisePadInfo,
      nActivationId,
    );

    // 6. Pointwise21
    //
    // Note: Even if ( outputTensorCount == 2 ), it does not means pointwise21 existed.
    InferencedParams.set_pointwise21ChannelCount_pointwise21Bias_pointwise21ActivationId_by.call( this,
      nConvBlockTypeId, pointwise20ChannelCount, this.pointwise20Bias, pointwise20ActivationId );

    // 5. squeeze-and-excitation
    InferencedParams.set_squeezeExcitationActivationId_squeezeExcitationActivationName_by.call( this,
      nActivationId
    );

    // 6. nHigherHalfDifferent
    InferencedParams.set_nHigherHalfDifferent_by.call( this,
      input0_channelCount, nConvBlockTypeId, pointwise1ChannelCount, pointwise20ChannelCount );
  }

}
