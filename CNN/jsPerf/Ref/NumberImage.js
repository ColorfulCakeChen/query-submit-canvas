export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
import * as Depthwise from "../../Conv/Depthwise.js";

/**
 * Image composed from numbers. For testing.
 *
 *
 * @member {number}   height    Image height
 * @member {number}   width     Image width
 * @member {number}   depth     Image channel count
 * @member {number[]} dataArray Image data
 *
 * @member {BoundsArraySet.InputsOutput} boundsArraySet
 *   The element value bounds set of this image.
 */
class Base extends Recyclable.Root {

  /**
   * Used as default NumberImage.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NumberImage.Base.Pool", Base, Base.setAsConstructor );

  /**
   *
   * @param {number} preFilledValue
   *   Use this value to fill the created .dataArray[]. If undefined, the .dataArray will not be pre-filled any value.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} input0_ScaleBoundsArray
   *   The element value bounds (per channel) of 1st input (can NOT null). It is the domain of the operation. It (from constructor)
   * will be cloned. This behavior is different from BoundsArraySet.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} input1_ScaleBoundsArray
   *   The element value bounds (per channel) of 2nd input (can null or undefined). It is the domain of the operation. It (from constructor)
   * will be cloned. This behavior is different from BoundsArraySet.
   *
   * @param {Objetc} BoundsArraySetClass
   *   What kinds of BoundsArraySet will be created. It should be one of BoundsArraySet.InputsOutputs, BoundsArraySet.ConvBiasActivation,
   * BoundsArraySet.Depthwise, BoundsArraySetPointwise.
   *
   * @param {FloatValue.Bounds} aBounds
   *   The value bounds of all pixels of this image. If undefined, the .boundsArraySet will not be pre-filled any value.
   */

//!!! (2022/06/29 Remarked) Replaced by filledValue and aBounds.
//  (i.e. Weights.Base.ValueBounds).
//  constructor( height, width, depth, dataArray, boundsArraySet ) {

  constructor( height, width, depth, preFilledValue,
    input0_ScaleBoundsArray, input1_ScaleBoundsArray, BoundsArraySetClass, aBounds ) {

    super();
    Base.setAsConstructor_self.call( this, height, width, depth, preFilledValue,
      input0_ScaleBoundsArray, input1_ScaleBoundsArray, BoundsArraySetClass, aBounds );
  }

  /** @override */
  static setAsConstructor( height, width, depth, preFilledValue,
    input0_ScaleBoundsArray, input1_ScaleBoundsArray, BoundsArraySetClass, aBounds ) {

    super.setAsConstructor();
    Base.setAsConstructor_self.call( this, height, width, depth, preFilledValue,
      input0_ScaleBoundsArray, input1_ScaleBoundsArray, BoundsArraySetClass, aBounds );
    return this;
  }

  /** @override */
  static setAsConstructor_self( height, width, depth, preFilledValue,
    input0_ScaleBoundsArray, input1_ScaleBoundsArray, BoundsArraySetClass, aBounds ) {
    this.height = height;
    this.width = width;
    this.depth = depth;

    // Note: The preFilledValue and aBounds will not be recorded.

    let elementCount = height * width * depth;
    this.dataArray = Recyclable.Array.Pool.get_or_create_by( elementCount );
    if ( preFilledValue != undefined )
      this.dataArray.fill( preFilledValue );

    // Note: NumberImage always owns itself input bounds array. (Although BoundsArraySet does not.)
    this.input0_ScaleBoundsArray = input0_ScaleBoundsArray.clone();
    this.input1_ScaleBoundsArray = input1_ScaleBoundsArray?.clone();

    // Note1: Different BoundsArraySet class have different arguments.
    // Note2: NumberImage's BoundsArraySet always has only output0.
    if ( BoundsArraySetClass instanceof BoundsArraySet.ConvBiasActivation ) {
      this.boundsArraySet = BoundsArraySetClass.Pool.get_or_create_by( input0_ScaleBoundsArray, depth );
    } else {
      this.boundsArraySet = BoundsArraySetClass.Pool.get_or_create_by( input0_ScaleBoundsArray, input1_ScaleBoundsArray, depth, undefined );
    }

    // Default value bounds for an image. (Note: Do not use .filledValue as bounds.)
    if ( aBounds != undefined ) {
      this.boundsArraySet.set_outputs_all_byBounds( aBounds );
    }
  }

  /** @override */
  disposeResources() {
    this.boundsArraySet.disposeResources_and_recycleToPool();
    this.boundsArraySet = null;

    this.input1_ScaleBoundsArray?.disposeResources_and_recycleToPool();
    this.input1_ScaleBoundsArray = null;

    this.input0_ScaleBoundsArray.disposeResources_and_recycleToPool();
    this.input0_ScaleBoundsArray = null;

    this.dataArray.disposeResources_and_recycleToPool();
    this.dataArray = null;

    this.depth = undefined;
    this.width = undefined;
    this.height = undefined;

    super.disposeResources();
  }

  clone() {
    let result = Base.Pool.get_or_create_by( this.height, this.width, this.depth,
      undefined, // Because .dataArray will be filled by copying.
      this.boundsArraySet.input0, this.boundsArraySet.input1,
      this.boundsArraySet.constructor, // BoundsArraySet class.
      undefined  // Because .boundsArraySet will be filled by copying.
    );

    for ( let i = 0; i < this.dataArray.length; ++i ) { // Copy image pixels.
      result.dataArray [ i ] = this.dataArray[ i ];
    }

    result.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.boundsArraySet ); // Only copy BoundsArraySet.outputX
    return result;
  }

  /** Call this.clone_byPointwise() with ( bPassThrough == true ). */
  clone_byPointwise_PassThrough(
    pointwiseChannelCount, bPointwiseBias, pointwiseActivationId,
    aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
    pointwiseName, parametersDesc ) {

    return this.clone_byPointwise(
      pointwiseChannelCount, null, bPointwiseBias, null, pointwiseActivationId,
      true, aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId, // (bPassThrough)
      pointwiseName, parametersDesc );
  }

  /** Call this.clone_byPointwise() with ( bPassThrough == false ). */
  clone_byPointwise_NonPassThrough(
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    pointwiseName, parametersDesc ) {
      
    return this.clone_byPointwise(
      pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
      false, null, null, // (bPassThrough)
      pointwiseName, parametersDesc );
  }

  /**
   * @param {NumberImage.Base} this           The source image to be processed.
   *
   * @param {number[]} pointwiseFiltersArray  The pointwise convolution filter weights. Only used when ( bPassThrough == false ).
   * @param {boolean}  bPointwiseBias         Whether add bias.
   * @param {number[]} pointwiseBiasesArray   The bias weights. Only used when ( bPassThrough == false ) and ( bPointwiseBias == true ).
   * @param {number}   pointwiseActivationId  The activation function id (i.e. ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
   *
   * @param {boolean}  bPassThrough
   *   If true, pass-through filters and biases will be used (i.e. pointwiseFiltersArray and pointwiseBiasesArray will be ignored).
   * And the output image will be scaled for pass-through activation function (i.e. scale to the linear part).
   *
   * @param {Pointwise.PassThrough_FiltersArray_BiasesArray_Bag} aPointwise_PassThrough_FiltersArray_BiasesArray_Bag
   *   A bag for generating pass-through pointwise convolution filters and biases. Only used when ( bPassThrough == true ).
   *
   * @param {number} nPassThroughStyleId
   *   The pass-through style to be used (i.e. ValueDesc.PassThroughStyle.Singleton.Ids.Xxx) when ( bPassThrough == true ).
   *
   * @param {string}   pointwiseName     A string for debug message of this convolution.
   * @param {Object}   parametersDesc    Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the pointwise convolution, bias and activation.
   */
  clone_byPointwise(
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    bPassThrough,
    aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
    pointwiseName, parametersDesc ) {

    let imageIn = this;

    if ( pointwiseChannelCount <= 0 )
      return imageIn.clone(); // No pointwise operation.

    let pointwisePassThrough;
    if ( bPassThrough ) { // Generate pass-through filters and biases.

      let inputChannelIndexStart = 0; // Pass-through all channels (beginning from channel index 0).
      pointwisePassThrough = aPointwise_PassThrough_FiltersArray_BiasesArray_Bag.get_by_PassThroughStyleId(
        imageIn.depth, pointwiseChannelCount, inputChannelIndexStart, bPointwiseBias, nPassThroughStyleId );

      pointwiseFiltersArray = pointwisePassThrough.filtersArray;
      pointwiseBiasesArray = pointwisePassThrough.biasesArray;
    }        

    {
      let filtersWeightCount = imageIn.depth * pointwiseChannelCount;

      if ( pointwiseFiltersArray.length != filtersWeightCount )
        throw Error( `${pointwiseName}: filters weight count ( ${pointwiseFiltersArray.length} ) `
          + `should be ( ${filtersWeightCount} ). (${parametersDesc})` );

      let biasesWeightCountShouldBe, biasesWeightCountInFact;
      if ( bPointwiseBias ) {
        biasesWeightCountShouldBe = pointwiseChannelCount;
        biasesWeightCountInFact = pointwiseBiasesArray.length;
      } else {
        biasesWeightCountShouldBe = 0;
        biasesWeightCountInFact = ( pointwiseBiasesArray ) ? pointwiseBiasesArray.length : 0;
      }

      if ( biasesWeightCountInFact != biasesWeightCountShouldBe )
        throw Error( `${pointwiseName}: biases weight count ( ${biasesWeightCountInFact} ) `
          + `should be ( ${biasesWeightCountShouldBe} ). (${parametersDesc})` );
    }

    let imageOut = Base.Pool.get_or_create_by(
      imageIn.height, imageIn.width, pointwiseChannelCount, 0,
      imageIn.boundsArraySet.output0, null, BoundsArraySet.Pointwise, null );

    imageOut.boundsArraySet.set_bPassThrough_all( bPassThrough );

    // Pointwise Convolution
    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );
        let inIndexBaseC  = ( indexBaseC * imageIn.depth );
        let outIndexBaseC = ( indexBaseC * pointwiseChannelCount );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          let filterIndexBase = ( inChannel * pointwiseChannelCount );

          let undoPreviousEscapingScale = imageIn.boundsArraySet.output0.scaleArraySet.undo.scales[ inChannel ];

          for ( let outChannel = 0; outChannel < pointwiseChannelCount; ++outChannel ) {
            let outIndex = outIndexBaseC + outChannel;
            let filterIndex = filterIndexBase + outChannel;

            imageOut.dataArray[ outIndex ]
              += ( imageIn.dataArray[ inIndex ] * undoPreviousEscapingScale ) * pointwiseFiltersArray[ filterIndex ];
          }
        }
      }
    }

    {
      // Prepare value bounds of every output channels (i.e. .afterFilter).
      {
        // Note: imageOut.boundsArraySet.afterUndoPreviousActivationEscaping has already been setup by BoundsArraySet.Pointwise() constructor.

        imageOut.boundsArraySet.afterFilter.set_all_byN( 0 );
      }

      // Calculate value bounds of every output channels (i.e. .afterFilter).
      let tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 );
      for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
        let filterIndexBase = ( inChannel * pointwiseChannelCount );

        for ( let outChannel = 0; outChannel < pointwiseChannelCount; ++outChannel ) {
          let filterIndex = filterIndexBase + outChannel;

          // Note: .afterUndoPreviousActivationEscaping has already been multiplied by undoPreviousEscapingScale.
          tBounds
            .set_byBoundsArray( imageOut.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel )
            .multiply_byN( pointwiseFiltersArray[ filterIndex ] );

          imageOut.boundsArraySet.afterFilter.add_one_byBounds( outChannel, tBounds );
        }
      }
      tBounds.disposeResources_and_recycleToPool();
      tBounds = null;
    }

    // Bias
    imageOut.modify_byBias( bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Activation Escaping.
    {
      // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
      // by .afterBias, bPassThrough and activation function's output range.
      imageOut.boundsArraySet.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( pointwiseActivationId );

      // Before activation function, scale every element according to its channel.
      Base.scale_byChannel_withoutAffect_BoundsArraySet( imageOut, imageOut.boundsArraySet.output0.scaleArraySet.do,
        pointwiseName, "ActivationEscapingScale", parametersDesc );
    }

    // Activation
    Base.modify_byActivation_withoutAffect_BoundsArraySet( imageOut, pointwiseActivationId, parametersDesc );

    return imageOut;
  }

  /** Call this.clone_byDepthwise() with ( bPassThrough == true ). */
  clone_byDepthwise_PassThrough(
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    aDepthwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
    depthwiseName, parametersDesc ) {

    return this.clone_byDepthwise(
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      null, bDepthwiseBias, null, depthwiseActivationId,
      true, aDepthwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId, // (bPassThrough)
      depthwiseName, parametersDesc );
  }

  /** Call this.clone_byPointwise() with ( bPassThrough == false ). */
  clone_byDepthwise_NonPassThrough(
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    depthwiseName, parametersDesc ) {

    return this.clone_byDepthwise(
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
      false, null, null, // (bPassThrough)
      depthwiseName, parametersDesc );
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   *
   * @param {number[]} pointwiseFiltersArray  The depthwise convolution filter weights. Only used when ( bPassThrough == false ).
   * @param {boolean}  bDepthwiseBias         Whether add bias.
   * @param {number[]} depthwiseBiasesArray   The bias weights. Only used when ( bPassThrough == false ) and ( bDepthwiseBias == true ).
   * @param {number}   depthwiseActivationId  The activation function id (i.e. ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
   *
   * @param {boolean}  bPassThrough
   *   If true, pass-through filters and biases will be used (i.e. pointwiseFiltersArray and pointwiseBiasesArray will be ignored).
   * And the output image will be scaled for pass-through activation function (i.e. scale to the linear part).
   *
   * @param {Depthwise.PassThrough_FiltersArray_BiasesArray_Bag} aDepthwise_PassThrough_FiltersArray_BiasesArray_Bag
   *   A bag for generating pass-through depthwise convolution filters and biases. Only used when ( bPassThrough == true ).
   *
   * @param {number} nPassThroughStyleId
   *   The pass-through style to be used (i.e. ValueDesc.PassThroughStyle.Singleton.Ids.Xxx) when ( bPassThrough == true ).
   *
   * @param {string}   depthwiseName     A string for debug message of this convolution.
   * @param {Object}   parametersDesc    Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the depthwise convolution, bias and activation.
   */
  clone_byDepthwise(
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    bPassThrough,
    aDepthwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
    depthwiseName, parametersDesc ) {

    let imageIn = this;

    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE === depthwise_AvgMax_Or_ChannelMultiplier )
      return imageIn.clone(); // No depthwise operation.

    let depthwisePassThrough;
    if ( bPassThrough ) { // Generate pass-through filters and biases.

      depthwisePassThrough = aDepthwise_PassThrough_FiltersArray_BiasesArray_Bag.get_by_PassThroughStyleId(
        this.height, this.width, this.depth,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias,
        nPassThroughStyleId
      );

      depthwiseFiltersArray = depthwisePassThrough.filtersArray;
      depthwiseBiasesArray = depthwisePassThrough.biasesArray;

    } else {
      // Not pass-through.
    }

//!!! ...unfinished... (2021/03/17) What about ( depthwiseFilterHeight <= 0 ) or ( depthwiseFilterWidth <= 0 )?

    let padInfo = Depthwise.PadInfoCalculatorRoot.Pool.get_or_create_by( imageIn.height, imageIn.width, imageIn.depth, 
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

    let { channelMultiplier, dilationHeight, dilationWidth,
          stridesHeight, stridesWidth, padHeightTop, padWidthLeft,
          outputHeight, outputWidth, outputChannelCount, //outputElementCount
    } = padInfo;

    padInfo.disposeResources_and_recycleToPool();
    padInfo = null;

    // For ( pad == "valid" ), negative ( inX, inY ) will never happen.
    // For ( pad == "same"  ), negative ( inX, inY ) may happen, but those pixels will be viewed as zero value.
    let imageInBeginY = - padHeightTop;
    let imageInBeginX = - padWidthLeft;

    // If not AVG, MAX, NONE, the filters shape should match input image channel count.
    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      let filtersWeightCount = depthwiseFilterHeight * depthwiseFilterWidth * imageIn.depth * channelMultiplier ;

      if ( depthwiseFiltersArray.length != filtersWeightCount )
        throw Error( `${depthwiseName}: filters weight count ( ${depthwiseFiltersArray.length} ) `
          + `should be ( ${filtersWeightCount} ). (${parametersDesc})` );
    }

    {
      let biasesWeightCountShouldBe, biasesWeightCountInFact;
      if ( bDepthwiseBias ) {
        biasesWeightCountShouldBe = imageIn.depth * channelMultiplier;
        biasesWeightCountInFact = depthwiseBiasesArray.length;
      } else {
        biasesWeightCountShouldBe = 0;
        biasesWeightCountInFact = ( depthwiseBiasesArray ) ? depthwiseBiasesArray.length : 0;
      }

      if ( biasesWeightCountInFact != biasesWeightCountShouldBe )
        throw Error( `${depthwiseName}: biases weight count ( ${biasesWeightCountInFact} ) `
          + `should be ( ${biasesWeightCountShouldBe} ). (${parametersDesc})` );
    }

    let preFilledValue;
    {
      // Max pooling
      if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) {
        preFilledValue = Number.NEGATIVE_INFINITY; // So that any value is greater than initialized value.
      } else {
        preFilledValue = 0;
      }
    }

    let imageOut = Base.Pool.get_or_creae_by(
      outputHeight, outputWidth, outputChannelCount, preFilledValue,
      imageIn.boundsArraySet.output0, null, BoundsArraySet.Depthwise, null );

    imageOut.boundsArraySet.set_bPassThrough_all( bPassThrough );

    // Prepare value bounds of every output channels (i.e. .afterFilter).
    let filtersArray_bBoundsCalculated, tBounds;
    {
      // Note: imageOut.boundsArraySet.afterUndoPreviousActivationEscaping has already been setup by BoundsArraySet.Depthwise() constructor.

      if ( depthwise_AvgMax_Or_ChannelMultiplier <= 0 ) { // For avg/max pooling, the value bounds will not change.
        imageOut.boundsArraySet.afterFilter.set_all_byBoundsArray( imageOut.boundsArraySet.afterUndoPreviousActivationEscaping );

      } else { // For normal depthwise convolution, value bounds should be calculated by accumulation.
        imageOut.boundsArraySet.afterFilter.set_all_byN( 0 );

        // If true, the .boundsArraySet.afterFilter for the filter position is calculated.
        filtersArray_bBoundsCalculated = Recyclable.Array.Pool.get_or_create_by( depthwiseFiltersArray.length );
        filtersArray_bBoundsCalculated.fill( false );

        tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 );
      }
    }

    // Depthwise Convolution
    for ( let outY = 0; outY < outputHeight; ++outY ) {
      let outIndexBaseX = ( outY * outputWidth );
      let inYBase = imageInBeginY + ( outY * stridesHeight );

      for ( let outX = 0; outX < outputWidth; ++outX ) {
        let outIndexBaseC = ( ( outIndexBaseX + outX ) * outputChannelCount );
        let inXBase = imageInBeginX + ( outX * stridesWidth );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let outChannelBase = inChannel * channelMultiplier;
          let outIndexBaseSubC = outIndexBaseC + outChannelBase;

          let undoPreviousEscapingScale = imageIn.boundsArraySet.output0.scaleArraySet.undo.scales[ inChannel ];

          for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub ) {
            let outChannel = outChannelBase + outChannelSub;
            let outIndex = outIndexBaseSubC + outChannelSub;

            // For Avg pooling, the divisor is effect filter size which includes dilation but excludes input image outside.
            let avgDivisor = 0;

            FilterYLoop:
            for ( let filterY = 0, inY = inYBase; filterY < depthwiseFilterHeight; ++filterY ) {
              for ( let dilationFilterY = 0; dilationFilterY < dilationHeight; ++dilationFilterY, ++inY ) {
                if ( inY < 0 )
                  continue;          // Never access outside of input image. Continue to find out non-negative input image y position.
                else if ( inY >= imageIn.height )
                  break FilterYLoop; // Never access outside of input image. Break because it is impossible to find inside of input image.

                let inIndexBaseX = ( inY * imageIn.width );
                let filterIndexBaseX = ( filterY * depthwiseFilterWidth );

                FilterXLoop:
                for ( let filterX = 0, inX = inXBase; filterX < depthwiseFilterWidth; ++filterX ) {
                  for ( let dilationFilterX = 0; dilationFilterX < dilationWidth; ++dilationFilterX, ++inX ) {
                    if ( inX < 0 )
                      continue;          // Never access outside of input image. Continue to find out non-negative input image x position.
                    else if ( inX >= imageIn.width )
                      break FilterXLoop; // Never access outside of input image. Break because it is impossible to find inside of input image.

                    // For Avg pooling, the divisor should include filter dilation but exclude input image outside.
                    //
                    // This accumulation should be done after confirm ( inY, inX ) is inside the input image.
                    ++avgDivisor;

                    // No need to compute the filter's dilation part (because it is always zero).
                    //
                    // This shortcut check should be done after avgDivisor has been increased, so that the filter dilation will
                    // be included by avgDivisor.
                    if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                      continue;

                    let inIndexBaseC = ( ( inIndexBaseX + inX ) * imageIn.depth );
                    let inIndex = inIndexBaseC + inChannel;
                    let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * outputChannelCount );
                    let filterIndex = filterIndexBaseC + outChannel;

                    switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG: // Avg pooling
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ];
                        break;

                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX: // Max pooling
                        imageOut.dataArray[ outIndex ] = Math.max( imageOut.dataArray[ outIndex ], imageIn.dataArray[ inIndex ] );
                        break;

                      default: // Convolution
                        imageOut.dataArray[ outIndex ]
                          += ( imageIn.dataArray[ inIndex ] * undoPreviousEscapingScale ) * depthwiseFiltersArray[ filterIndex ];

                        // Calculate value bounds of every output channels (i.e. .afterFilter).
                        if ( !filtersArray_bBoundsCalculated[ filterIndex ] ) {

                          // Note: .afterUndoPreviousActivationEscaping has already been multiplied by undoPreviousEscapingScale.
                          tBounds
                            .set_byBoundsArray( imageOut.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel )
                            .multiply_byN( depthwiseFiltersArray[ filterIndex ] );

                          imageOut.boundsArraySet.afterFilter.add_one_byBounds( outChannel, tBounds );

                          filtersArray_bBoundsCalculated[ filterIndex ] = true;
                        }
                        break;
                    }
                  }
                }
              }
            }

            // Avg pooling
            if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier ) {
              imageOut.dataArray[ outIndex ] /= avgDivisor; // So that every sum is averaged.
            }
          }
        }
      }
    }

    if ( tBounds ) {
      tBounds.disposeResources_and_recycleToPool();
      tBounds = null;
    }

    if ( filtersArray_bBoundsCalculated ) {
      filtersArray_bBoundsCalculated.disposeResources_and_recycleToPool();
      filtersArray_bBoundsCalculated = null;
    }

    // Bias
    imageOut.modify_byBias( bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation Escaping.
    {
      // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
      // by .afterBias, bPassThrough and activation function's output range.
      imageOut.boundsArraySet.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( depthwiseActivationId );

      // Before activation function, scale every element according to its channel.
      Base.scale_byChannel_withoutAffect_BoundsArraySet( imageOut, imageOut.boundsArraySet.output0.scaleArraySet.do,
        depthwiseName, "ActivationEscapingScale", parametersDesc );
    }

    // Activation
    Base.modify_byActivation_withoutAffect_BoundsArraySet( imageOut, depthwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * Note: This method will also set .boundsArraySet.afterBias.
   *
   * @param {NumberImage.Base} this     The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {number[]} biasesArray       The bias values.
   * @param {string}   biasName          A string for debug message of this bias.
   * @param {Object}   parametersDesc    Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be added bias (according to bBias).
   */
  modify_byBias( bBias, biasesArray, biasName, parametersDesc ) {
    let imageIn = this;

    imageIn.boundsArraySet.afterBias.set_all_byBoundsArray( imageIn.boundsArraySet.afterFilter );
    if ( !bBias )
      return imageIn;

    if ( biasesArray == null )
      throw Error( `${biasName}: biasesArray (${biasesArray}) `
        + `should not be null. (${parametersDesc})` );

    if ( biasesArray.length != imageIn.depth )
      throw Error( `${biasName}: shape (${biasesArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})` );

    let index = 0;
    for ( let y = 0; y < imageIn.height; ++y ) {
      for ( let x = 0; x < imageIn.width; ++x ) {
        for ( let channel = 0; channel < imageIn.depth; ++channel ) {
          imageIn.dataArray[ index ] += biasesArray[ channel ];
          ++index;
        }
      }
    }

    // Calculate value bounds of every output channels (i.e. .afterBias) by shifting as the bias.
    for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
      imageIn.boundsArraySet.afterBias.add_one_byN( inChannel, biasesArray[ inChannel ] );
    }

    return imageIn;
  }

  /**
   * Note: This method does not adjust any BoundsArraySet.
   *
   * @param {NumberImage.Base} imageIn          The imageIn.dataArray[] will be multiplied by scaleArray in place.
   * @param {FloatValue.ScaleArray} scaleArray  The scales for every channel.
   * @param {string} scaleName1                 The 1st part string for debug message of this scaling.
   * @param {string} scaleName2                 The 2nd part string for debug message of this scaling.
   * @param {Object} parametersDesc             Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return the (modified) image whose every element is scaled according to its channel.
   */
  static scale_byChannel_withoutAffect_BoundsArraySet( imageIn, scaleArray, scaleName1, scaleName2, parametersDesc ) {

    if ( scaleArray == null )
      throw Error( `${scaleName1}${ scaleName2 ? "_" : "" }${scaleName2}: scaleArray (${scaleArray}) `
        + `should not be null. (${parametersDesc})` );

    if ( scaleArray.length != imageIn.depth )
      throw Error( `${scaleName1}${ scaleName2 ? "_" : "" }${scaleName2}: shape (${scaleArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})` );

    let index = 0;
    for ( let y = 0; y < imageIn.height; ++y ) {
      for ( let x = 0; x < imageIn.width; ++x ) {
        for ( let channel = 0; channel < imageIn.depth; ++channel ) {
          imageIn.dataArray[ index ] *= scaleArray.scales[ channel ];
          ++index;
        }
      }
    }

    return imageIn;
  }

  /**
   * Note: This method does NOT adjust any BoundsArraySet.
   *
   * @param {NumberImage.Base} imageIn   The source image to be processed.
   * @param {string}   nActivationId     The name string of this activation function.
   *
   * @param {Object}   parametersDesc    Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be modified by activation function (according to nActivationId). The this.dataArray will be
   * just the original this.dataArray directly.
   */
  static modify_byActivation_withoutAffect_BoundsArraySet( imageIn, nActivationId, parametersDesc ) {

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    if ( !theActivationFunctionInfo )
      return imageIn;

//!!! (2022/06/15 Remarked) Using CPU instead of tensor to improve performance.
//     let pfnActivation = theActivationFunctionInfo.pfn;
//     if ( !pfnActivation )
//       return imageIn;
//
//     // Because pfnActivation is function of tensorflow.js, it process tf.tensor (i.e. not a single value).
//     // Let it process the whole input (as an Array) directly.
//     let tensorOut = pfnActivation( imageIn.dataArray )
//     imageIn.dataArray = tensorOut.dataSync();
//     tensorOut.dispose();

    let pfnActivation = theActivationFunctionInfo.pfnReference;
    if ( !pfnActivation )
      return imageIn;

    for ( let i = 0; i < imageIn.dataArray.length; ++i ) {
      imageIn.dataArray[ i ] = pfnActivation( imageIn.dataArray[ i ] );
    }

    return imageIn;
  }

  /**
   * Two input dimensions ( height, width, depth ) should be the same, or one should be a scalar ( 1, 1, depth ) value
   * (i.e. boradcast in the same channel (i.e. not across channels) is supported).
   *
   * @param {NumberImage.Base} this        The first image to be used for adding.
   * @param {NumberImage.Base} another     The second image to be used for adding.
   *
   * @param {string} addName               A string for debug message of this adding operation.
   * @param {Object} parametersDesc        Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of adding this and another.
   */
  clone_byAdd( another, addName, parametersDesc ) {
    let rHeight, rWidth, rDepth;
    let imageOutNew;

    // Q: Why not just modify this directly?
    // A: The this might be the original input array which should not be modified at all. (because they might be used in another test.)

    if ( ( another.height == this.height ) && ( another.width == this.width ) && ( another.depth == this.depth ) ) { // Same size.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      for ( let i = 0; i < this.dataArray.length; ++i ) {
        imageOutNew.dataArray[ i ] = this.dataArray[ i ] + another.dataArray[ i ];
      }

    } else if ( ( another.height == 1 ) && ( another.width == 1 ) && ( another.depth == this.depth ) ) { // Broadcast another to this.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            imageOutNew.dataArray[ i ] = this.dataArray[ i ] + another.dataArray[ c ];
          }
        }
      }

    } else if ( ( this.height == 1 ) && ( this.width == 1 ) && ( this.depth == another.depth ) ) { // Broadcast this to another.

      rHeight = another.height; rWidth = another.width; rDepth = another.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            imageOutNew.dataArray[ i ] = this.dataArray[ c ] + another.dataArray[ i ];
          }
        }
      }

    } else {
      throw Error(
        `${addName}: another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `this ( height, width, depth ) = ( ${this.height}, ${this.width}, ${this.depth} ) `
          + `and `
          + `another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `should be either totally the same or one is ( 1, 1, N ). `
          + `(${parametersDesc})` );
    }

    {
      imageOutNew.boundsArraySet.output0
        .set_all_byScaleBoundsArray( this.boundsArraySet.output0 )

         // Note: Not add_all_byScaleBoundsArray_one(). The reason is that it is supported to broadcast in the same channel
         // (i.e. not across channels).
         //
        .add_all_byScaleBoundsArray_all( another.boundsArraySet.output0 );
    }

    return imageOutNew;
  }

  /**
   * Two input dimensions ( height, width, depth ) should be the same, or one should be a scalar ( 1, 1, depth ) value
   * (i.e. boradcast in the same channel (i.e. not across channels) is supported).
   *
   * @param {NumberImage.Base} this        The first image to be used for multiplying.
   * @param {NumberImage.Base} another     The second image to be used for multiplying.
   *
   * @param {string} multiplyName          A string for debug message of this multiplying operation.
   * @param {Object} parametersDesc        Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of multiplying this and another.
   */
  clone_byMultiply( another, multiplyName, parametersDesc ) {
    let rHeight, rWidth, rDepth;
    let imageOutNew;

    // Q: Why not just modify this directly?
    // A: The this might be the original input array which should not be modified at all. (because they might be used in another test.)

    if ( ( another.height == this.height ) && ( another.width == this.width ) && ( another.depth == this.depth ) ) { // Same size.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      for ( let i = 0; i < this.dataArray.length; ++i ) {
        imageOutNew.dataArray[ i ] = this.dataArray[ i ] * another.dataArray[ i ];
      }

    } else if ( ( another.height == 1 ) && ( another.width == 1 ) && ( another.depth == this.depth ) ) { // Broadcast another to this.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            imageOutNew.dataArray[ i ] = this.dataArray[ i ] * another.dataArray[ c ];
          }
        }
      }

    } else if ( ( this.height == 1 ) && ( this.width == 1 ) && ( this.depth == another.depth ) ) { // Broadcast this to another.

      rHeight = another.height; rWidth = another.width; rDepth = another.depth;
      imageOutNew = Base.Pool.get_or_create_by( rHeight, rWidth, rDepth, undefined,
        this.boundsArraySet.output0, another.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            imageOutNew.dataArray[ i ] = this.dataArray[ c ] * another.dataArray[ i ];
          }
        }
      }

    } else {
      throw Error(
        `${multiplyName}: `
          + `this ( height, width, depth ) = ( ${this.height}, ${this.width}, ${this.depth} ) `
          + `and `
          + `another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `should be either totally the same or one is ( 1, 1, N ). `
          + `(${parametersDesc})` );
    }

    {
      imageOutNew.boundsArraySet.output0
        .set_all_byScaleBoundsArray( this.boundsArraySet.output0 )

         // Note: Not multiply_all_byScaleBoundsArray_one(). The reason is that it is supported to broadcast in the same channel
         // (i.e. not across channels).
         //
        .multiply_all_byScaleBoundsArray_all( another.boundsArraySet.output0 );
    }

    return imageOutNew;
  }

  /** Call this.clone_bySqueezeExcitation() with ( bPassThrough == true ). */
  clone_bySqueezeExcitation_PassThrough(
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    aPointwise_PassThrough_FiltersArray_BiasesArray_Bag,
    squeezeExcitationName, parametersDesc ) {

    return this.clone_bySqueezeExcitation(
      nSqueezeExcitationChannelCountDivisor,
      null, null, null, null,
      nActivationId,
      true, aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, // (bPassThrough)
      squeezeExcitationName, parametersDesc );
  }

  /** Call this.clone_bySqueezeExcitation() with ( bPassThrough == false ). */
  clone_bySqueezeExcitation_NonPassThrough(
    nSqueezeExcitationChannelCountDivisor,
    intermediateFiltersArray, intermediateBiasesArray,
    excitationFiltersArray, excitationBiasesArray,
    nActivationId,
    squeezeExcitationName, parametersDesc ) {

    return this.clone_bySqueezeExcitation(
      nSqueezeExcitationChannelCountDivisor,
      intermediateFiltersArray, intermediateBiasesArray,
      excitationFiltersArray, excitationBiasesArray,
      nActivationId,
      false, null, // (bPassThrough)
      squeezeExcitationName, parametersDesc );
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   *
   * @param {number} nSqueezeExcitationChannelCountDivisor
   *   An integer represents the channel count divisor for squeeze-and-excitation's intermediate pointwise convolution channel count.
   * (Please see also SqueezeExcitation.Base.nSqueezeExcitationChannelCountDivisor explanation.)
   *
   * @param {number[]} intermediateFiltersArray  The intermediate pointwise convolution filter weights. Only used if ( bPassThrough == false ).
   * @param {number[]} intermediateBiasesArray   The intermediate bias weights. Only used if ( bPassThrough == false ).
   * @param {number[]} excitationFiltersArray    The excitation pointwise convolution filter weights. Only used if ( bPassThrough == false ).
   * @param {number[]} excitationBiasesArray     The excitation bias weights. Only used if ( bPassThrough == false ).
   * @param {number}   nActivationId  The activation function id (i.e. ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
   *
   * @param {boolean}  bPassThrough
   *   If true, pass-through filters and biases will be used (i.e. intermediateFiltersArray, intermediateBiasesArray,
   * excitationFiltersArray, excitationBiasesArray will be ignored). And the output image will be scaled for pass-through
   * activation function (i.e. scale to the linear part).
   *
   * @param {Pointwise.PassThrough_FiltersArray_BiasesArray_Bag} aPointwise_PassThrough_FiltersArray_BiasesArray_Bag
   *   A bag for generating pass-through pointwise convolution filters and biases. Only used when ( bPassThrough == true ).
   *
   * @param {string}   squeezeExcitationName  A string for debug message of this squeeze-and-excitation.
   * @param {Object}   parametersDesc         Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the squeeze-and-excitation.
   */
  clone_bySqueezeExcitation(
    nSqueezeExcitationChannelCountDivisor,
    intermediateFiltersArray, intermediateBiasesArray,
    excitationFiltersArray, excitationBiasesArray,
    nActivationId,
    bPassThrough,
    aPointwise_PassThrough_FiltersArray_BiasesArray_Bag,
    squeezeExcitationName, parametersDesc ) {

    if (   ( nSqueezeExcitationChannelCountDivisor == undefined )
        || ( nSqueezeExcitationChannelCountDivisor < ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE )
       )
      throw Error( `${squeezeExcitationName}: `
        + `nSqueezeExcitationChannelCountDivisor ( ${nSqueezeExcitationChannelCountDivisor} ) `
        + `should be >= `
        + `ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE `
          + `( ${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE} ) `
        + `(${parametersDesc})` );

    if ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
      return this.clone(); // No squeeze-and-excitation operation.

    // For squeeze-and-excitation, if pass-through is required, the pass-through style is always ( filter = 0, bias = 1 )
    // (i.e. ConstantWhenPassThrough). So that the final multiplication will not destroy input.
    //
    const nPassThroughStyleId = ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1;

    // 1. squeezeDepthwise
    let squeezeOut;
    if (
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2), no-op.
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION_1 (-1), squeeze is not required.
            //
            ( nSqueezeExcitationChannelCountDivisor < 0 )

         || ( ( this.height <= 0 ) || ( this.width <= 0 ) ) // squeeze can not be done.
         || ( ( this.height == 1 ) && ( this.width == 1 ) ) // squeeze is not necessary. (already squeezed.)
       ) {

      // No squeeze. Do nothing.
      squeezeOut = this;

    } else {
      const squeezeAvgMax_Or_ChannelMultiplier =  ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG;
      const squeezeFilterHeight = this.height;
      const squeezeFilterWidth = this.width; // Global average pooling.
      const squeezeStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID; // So that image size could be shrinked to ( 1 * 1 )
      const squeezeFiltersArray = null;
      const squeezeBias = false;
      const squeezeBiasesArray = null;
      const squeezeActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE; // squeeze has no filters weights, no bias, no activation).

      squeezeOut = this.clone_byDepthwise_NonPassThrough( // average pooling can not pass-through. (only convolution could do pass-through.)
        squeezeAvgMax_Or_ChannelMultiplier, squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
        squeezeFiltersArray, squeezeBias, squeezeBiasesArray, squeezeActivationId,
        `${squeezeExcitationName}_squeezeDepthwise`, parametersDesc );
    }

    // 2. intermediatePointwise
    let intermediateOut;
    {
      let intermediateChannelCount;
      if ( nSqueezeExcitationChannelCountDivisor <= 0 ) {
        intermediateChannelCount = 0;
      } else {
        intermediateChannelCount = Math.ceil( this.depth / nSqueezeExcitationChannelCountDivisor );
      }

      if ( intermediateChannelCount > 0 ) {

        // If it has no activation, it could be no bias because the next operation's (i.e. excitationPointwise) bias will achieve it.
        let bBias_intermediatePointwise;
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          bBias_intermediatePointwise = false;
        } else {
          bBias_intermediatePointwise = true;
        }

        intermediateOut = squeezeOut.clone_byPointwise(
          intermediateChannelCount, intermediateFiltersArray, bBias_intermediatePointwise, intermediateBiasesArray, nActivationId,
          bPassThrough, aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
          `${squeezeExcitationName}_intermediatePointwise`, parametersDesc );

      } else { // No intermediate pointwise convolution.
        intermediateOut = squeezeOut;
      }
    }

    // 3. excitationPointwise
    let excitationOut;
    {
      const excitationChannelCount = this.depth; // excitation output input channel count is the same as original input channel count.
      const bBias_excitationPointwise = true; // excitation always has bias.

      excitationOut = intermediateOut.clone_byPointwise(
        excitationChannelCount, excitationFiltersArray, bBias_excitationPointwise, excitationBiasesArray, nActivationId,
        bPassThrough, aPointwise_PassThrough_FiltersArray_BiasesArray_Bag, nPassThroughStyleId,
        `${squeezeExcitationName}_excitationPointwise`, parametersDesc );
    }

    // 4. multiply
    let multiplyOut = this.clone_byMultiply( excitationOut, `${squeezeExcitationName}_multiply`, parametersDesc );

    return multiplyOut;
  }

  /**
   * Note: This method will also set .boundsArraySet.afterBias.
   *
   * Shuffle (.dataArray, .biasesArray, .boundsArraySet) by interleaving.
   *   - Only ( outputGroupCount == 2 ) is supported.
   *   - The channel count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @param {NumberImage.Base} this  The source image to be processed.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @param {string} interleaveName1  The 1st part string for debug message of this interleaving.
   * @param {string} interleaveName2  The 1st part string for debug message of this interleaving.
   * @param {Object} parametersDesc   Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this object which has been modifed in place.
   */
  modify_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo, interleaveName1, interleaveName2, parametersDesc ) {

    if ( ( this.depth % 2 ) != 0 )
      throw Error( `NumberImage.Base.modify_byInterleave_asGrouptTwo(): `
        + `${interleaveName1}${ interleaveName2 ? "_" :"" }${interleaveName2}: `
        + `channel count ( ${this.depth} ) must be even (i.e. divisible by 2). `
        + `(${parametersDesc})`
      );

    // Shuffle data.
    for ( let indexBegin = 0; indexBegin < this.dataArray.length; indexBegin += this.depth ) {
      FloatValue.ArrayInterleaver.interleave_asGrouptTwo(
        this.dataArray, indexBegin, this.depth, arrayTemp_forInterleave_asGrouptTwo );
    }

    // Shuffle BoundsArraySet.
    this.boundsArraySet.set_outputs_all_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo );

    return this;
  }

  /**
   * Split image along the axis id 2 (i.e. depth) into imageOutArray as [ imageOut1, imageOut2 ]. If imageIn is null,
   * return [ null, null ].
   *
   * @param {NumberImage.Base} imageIn  The source image to be processed.
   *
   * @param {NumberImage.Base} imageOutArray[ 0 ]   The first output image.
   * @param {NumberImage.Base} imageOutArray[ 1 ]   The second output image.
   *
   * @param {string} splitName1      The 1st part string for debug message of this splitting.
   * @param {string} splitName2      The 2nd part string for debug message of this splitting.
   * @param {Object} parametersDesc  Its .toString() for debug message of this block.
   */
  static calcSplitAlongAxisId2( imageIn, imageOutArray, splitName1, splitName2, parametersDesc ) {

    imageOutArray.length = 2;
    imageOutArray[ 0 ] = null;
    imageOutArray[ 1 ] = null;

    if ( null == imageIn )
      return;

    // Split value bounds array.
    let rScaleBoundsArray_lowerHalf = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( 0 );
    let rScaleBoundsArray_higherHalf = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( 0 );
    imageIn.boundsArraySet.output0.split_to_lowerHalf_higherHalf( rScaleBoundsArray_lowerHalf, rScaleBoundsArray_higherHalf );

    // If not divided by 2, let lower half have one more.
    let imageOutDepth_lowerHalf = rScaleBoundsArray_lowerHalf.length;
    let imageOutDepth_higherHalf = rScaleBoundsArray_higherHalf.length;

    let imageOutLength_lowerHalf = ( imageIn.height * imageIn.width * imageOutDepth_lowerHalf );
    let imageOutLength_higherHalf = ( imageIn.height * imageIn.width * imageOutDepth_higherHalf );

    imageOutArray[ 0 ] = Base.Pool.get_or_create_by(
      imageIn.height, imageIn.width, imageOutDepth_lowerHalf, undefined,
      imageIn.boundsArraySet.output0, undefined, BoundsArraySet.InputsOutputs, undefined );

    imageOutArray[ 1 ] = Base.Pool.get_or_create_by(
      imageIn.height, imageIn.width, imageOutDepth_higherHalf, undefined,
      imageIn.boundsArraySet.output0, undefined, BoundsArraySet.InputsOutputs, undefined );

    let imageOut0 = imageOutArray[ 0 ];
    let imageOut1 = imageOutArray[ 1 ];

    // Split along the image depth.
    let inIndex = 0, outIndex_lowerHalf = 0, outIndex_higherHalf = 0;
    for ( let y = 0; y < imageIn.height; ++y ) {

      for ( let x = 0; x < imageIn.width; ++x ) {
        let inChannel = 0;

        for ( let outChannel = 0; outChannel < imageOutDepth_lowerHalf; ++outChannel, ++inChannel ) {
          imageOut0.dataArray[ outIndex_lowerHalf ] = imageIn.dataArray[ inIndex ];
          ++inIndex;
          ++outIndex_lowerHalf;
        }

        for ( let outChannel = 0; outChannel < imageOutDepth_higherHalf; ++outChannel, ++inChannel ) {
          imageOut1.dataArray[ outIndex_higherHalf ] = imageIn.dataArray[ inIndex ];
          ++inIndex;
          ++outIndex_higherHalf;
        }

      }
    }

    // Setup value bounds array.
    imageOut0.boundsArraySet.set_outputs_all_byScaleBoundsArray( rScaleBoundsArray_lowerHalf );
    imageOut1.boundsArraySet.set_outputs_all_byScaleBoundsArray( rScaleBoundsArray_higherHalf );

    {
      rScaleBoundsArray_lowerHalf.disposeResources_and_recycleToPool();
      rScaleBoundsArray_lowerHalf = null;

      rScaleBoundsArray_higherHalf.disposeResources_and_recycleToPool();
      rScaleBoundsArray_higherHalf = null;
    }
  }

  /**
   * @param {NumberImage.Base} imageIn1   The source image1 to be processed.
   * @param {NumberImage.Base} imageIn2   The source image2 to be processed.
   * @param {string} concatName1          The 1st part string for debug message of this concatenation.
   * @param {string} concatName2          The 2nd part string for debug message of this concatenation.
   * @param {Object} parametersDesc       Its .toString() for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return concatenated image along the axis id 2. If imageIn1 is null, return imageIn2. If imageIn2 is null, return imageIn1.
   * If both imageIn1 and imageIn2 is null, return null.
   */
  static calcConcatAlongAxisId2( imageIn1, imageIn2, concatName1, concatName2, parametersDesc ) {

    if ( null == imageIn1 ) {
      if ( null == imageIn2 )
        return null; // Both input is null. Return null.
      else
        return imageIn2; // Only input1 is null. Return input2.
    } else {
      if ( null == imageIn2 )
        return imageIn1; // Only input2 is null. Return input1.
      else
        ; // Both input is not null. Do concatenate them in the following.
    }

    if ( imageIn1.height != imageIn2.height )
      throw Error( `${concatName1}${ concatName2 ? "_" :"" }${concatName2}: shape imageIn1.height (${imageIn1.height}) `
        + `should match imageIn2.height (${imageIn2.height}). (${parametersDesc})` );

    if ( imageIn1.width != imageIn2.width )
      throw Error( `${concatName1}${ concatName2 ? "_" :"" }${concatName2}: shape imageIn1.width (${imageIn1.width}) `
        + `should match imageIn2.width (${imageIn2.width}). (${parametersDesc})` );

    //let imageOutLength = ( imageIn1.height * imageIn1.width * imageIn1.depth ) + ( imageIn2.height * imageIn2.width * imageIn2.depth );
    let imageOutDepth = imageIn1.depth + imageIn2.depth;
    let imageOut = Base.Pool.get_or_create_by(
      imageIn1.height, imageIn1.width, imageOutDepth, undefined,
      imageIn1.boundsArraySet.output0, imageIn2.boundsArraySet.output0, BoundsArraySet.InputsOutputs, undefined
    );

    // Concatenate along the image depth.
    let in1Index = 0, in2Index = 0, outIndex = 0;
    for ( let y = 0; y < imageIn1.height; ++y ) {

      for ( let x = 0; x < imageIn1.width; ++x ) {
        let outChannel = 0;

        for ( let in1Channel = 0; in1Channel < imageIn1.depth; ++in1Channel, ++outChannel ) {
          imageOut.dataArray[ outIndex ] = imageIn1.dataArray[ in1Index ];
          ++in1Index;
          ++outIndex;
        }

        for ( let in2Channel = 0; in2Channel < imageIn2.depth; ++in2Channel, ++outChannel ) {
          imageOut.dataArray[ outIndex ] = imageIn2.dataArray[ in2Index ];
          ++in2Index;
          ++outIndex;
        }
      }
    }

    // Concat value bounds array.
    imageOut.boundsArraySet.set_outputs_all_by_concat_input0_input1();

    return imageOut;
  }

  /**
   *
   * @param {NumberImage.Base} imageInArray[ 0 ]   The first input image to be processed.
   * @param {NumberImage.Base} imageInArray[ 1 ]   The second input image to be processed.
   *
   * @param {NumberImage.Base} imageOutArray[ 0 ]   The first output image.
   * @param {NumberImage.Base} imageOutArray[ 1 ]   The second output image.
   *
   * @param {boolean} bShuffle
   *   Whether shuffle channels (after concatenating before splitting).
   *
   * @param {boolean} bSplit
   *   Whether split channels (after shuffleing).
   *     - If false, channels will not be splitted. The result will be placed in imageOutArray[ 0 ] and imageOutArray[ 1 ] will be null.
   *     - If true, channels will be splitted into imageOutArray[ 0 ] and imageOutArray[ 1 ].
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @param {string} concatShuffleSplitName  The 1st part string for debug message of this concatenation-shuffle-split.
   * @param {Object} parametersDesc          Its .toString() for debug message of this block.
   */
  static calcConcatShuffleSplit(
    imageInArray, imageOutArray, bShuffle, bSplit,
    arrayTemp_forInterleave_asGrouptTwo,
    concatShuffleSplitName, parametersDesc ) {

    if ( imageInArray.length != 2 )
      throw Error( `${concatShuffleSplitName}: `
        + `The length of imageInArray[] ( ${imageInArray.length} ) must be 2. `
        + `(${parametersDesc})`
      );

    // Note: Although different depth is wierd, it might still work. So, allow it.
    if (   ( imageInArray[ 0 ].height != imageInArray[ 1 ].height )
         || ( imageInArray[ 0 ].width !=  imageInArray[ 1 ].width )
         //|| ( imageInArray[ 0 ].depth !=  imageInArray[ 1 ].depth )
       )
      throw Error( `${concatShuffleSplitName}: The first input image's shape ( height, width, depth ) = `
        + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${imageInArray[ 0 ].depth} ) `
        + `should be the same as the second input image's shape `
        + `( ${imageInArray[ 1 ].height}, ${imageInArray[ 1 ].width}, ${imageInArray[ 1 ].depth} ). `
        + `(${parametersDesc})`
      );

    // 1.
    let concatResult = Base.calcConcatAlongAxisId2( imageInArray[ 0 ], imageInArray[ 1 ],
      "concatShuffleSplitName", "concat", parametersDesc );

    // 2.
    let shuffleResult;
    if ( bShuffle ) {
      shuffleResult = concatResult.modify_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo,
        "concatShuffleSplitName", "interleave_asGrouptTwo", parametersDesc );
    } else {
      shuffleResult = concatResult;
    }
 
    // 3.
    if ( bSplit ) {
      Base.calcSplitAlongAxisId2( shuffleResult, imageOutArray, "concatShuffleSplitName", "split", parametersDesc );
    } else {
      imageInArray.length = 2;
      imageOutArray[ 0 ] = shuffleResult;
      imageOutArray[ 1 ] = null;
    }
  }

  /**
   *
   * @param {number} height
   *   The height of the generate image.
   *
   * @param {number} width
   *   The width of the generate image.
   *
   * @param {number} channelCount
   *   The channel count of the generate image.
   *
   * @param {number} randomOffsetMin
   *   Every element of the generated number array will been shifted from the sequence id between
   * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly. Default is 0.
   *
   * @param {number} randomOffsetMax
   *   Every element of the generated number array will been shifted from the sequence id between
   * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly. Default is 0.
   *
   * @param {boolean} bAutoBounds
   *   If true, the value bounds will be real bounds of the generated elements. If false, the value bounds will be
   * Weights.Base.ValueBounds. Default is false.
   *
   * @return {NumberImage.Base}
   *   Return a newly generated image. Basically, they are sequential numbers which could be added by random offset between
   * [ randomOffsetMin, randomOffsetMax].
   */
  static create_bySequenceRandom( height, width, channelCount, randomOffsetMin = 0, randomOffsetMax = 0, bAutoBounds = false ) {

    // 0.
    let tBounds;
    if ( bAutoBounds ) {
      tBounds = FloatValue.Bounds.Pool.get_or_create_by( 0, 0 );
    }

    // 1.
    let imageNew;
    {
      const preFilledValue = undefined; // Because it will be filled with generated random values.
      const aBounds = undefined;        // Because .boundsArraySet will be filled later.

      let inputScaleBoundsArray = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( channelCount );
      inputScaleBoundsArray.set_all_byBounds( Weights.Base.ValueBounds );

      imageNew = Base.Pool.get_or_create_by( height, width, channelCount, preFilledValue,
        inputScaleBoundsArray, null, BoundsArraySet.InputsOutputs, aBounds );

      inputScaleBoundsArray.disposeResources_and_recycleToPool(); // Because the newly created NumberImage.Base has already copy it.
      inputScaleBoundsArray = null;
    }

    // 2. Fill .dataArray with random sequence values and got their bounds (if requested).
    RandTools.fill_numberArray( imageNew.dataArray, randomOffsetMin, randomOffsetMax, tBounds );

    // 3. Fill .boundsArraySet
    if ( tBounds ) { // 3.1 by collected bounds (if requested).
      imageNew.boundsArraySet.set_outputs_all_byBounds( tBounds );
      tBounds.disposeResources_and_recycleToPool();
      tBounds = null;

    } else { // 3.2 Otherwise, assume all image pixels are inside the default value bounds (i.e. Weights.Base.ValueBounds).
      imageNew.boundsArraySet.set_outputs_all_byBounds( Weights.Base.ValueBounds );
    }

    return imageNew;
  }

}
 
