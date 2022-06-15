export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
import * as Depthwise from "../../Conv/Depthwise.js";


//!!! ...unfinished... (2022/05/24)
// Perhaps, provides NumberImagePool to create and recycle NumberImage for reducing memory re-allocation.
// Pool by Map( length, Set( number_array ), at least recycle .dataArray

/**
 * Image composed from numbers. For testing.
 *
 *
 * @member {number}   height    Image height
 * @member {number}   width     Image width
 * @member {number}   depth     Image channel count
 * @member {number[]|Float32Array} dataArray Image data
 *
 * @member {BoundsArraySet.InputsOutput} boundsArraySet
 *   The element value bounds set of this image.
 */
class Base {

  /**
   *
   */
  constructor( height, width, depth, dataArray, boundsArraySet ) {
    this.height = height;
    this.width = width;
    this.depth = depth;
    this.dataArray = dataArray;
    this.boundsArraySet = boundsArraySet;

    if ( !this.boundsArraySet ) { // Default value bounds for an image.
      let inputScaleBoundsArray = new ActivationEscaping.ScaleBoundsArray( depth );
      this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, null, depth, undefined );
      this.boundsArraySet.set_outputs_all_byBounds( Weights.Base.ValueBounds ); // Assume all images are inside the default value bounds.
    }
  }

  clone() {
    let result = new Base( this.height, this.width, this.depth, new Float32Array( this.dataArray ), this.boundsArraySet.clone() );
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
   * @param {string}   parametersDesc    A string for debug message of this block.
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

//!!! (2022/06/12 Remarked) No matter whether is pass-through, these check always should be done.
//     } else {
//       tf.util.assert( ( ( pointwiseFiltersArray.length / pointwiseChannelCount ) == imageIn.depth ),
//         `${pointwiseName} filters shape ( ${pointwiseFiltersArray.length} / ${pointwiseChannelCount} ) `
//           + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);
    }        

    {
      let filtersWeightCount = imageIn.depth * pointwiseChannelCount;

      tf.util.assert( ( pointwiseFiltersArray.length == filtersWeightCount ),
        `${pointwiseName}: filters weight count ( ${pointwiseFiltersArray.length} ) `
          + `should be ( ${filtersWeightCount} ). (${parametersDesc})`);

      let biasesWeightCountShouldBe, biasesWeightCountInFact;
      if ( bPointwiseBias ) {
        biasesWeightCountShouldBe = pointwiseChannelCount;
        biasesWeightCountInFact = pointwiseBiasesArray.length;
      } else {
        biasesWeightCountShouldBe = 0;
        biasesWeightCountInFact = ( pointwiseBiasesArray ) ? pointwiseBiasesArray.length : 0;
      }

      tf.util.assert( ( biasesWeightCountInFact == biasesWeightCountShouldBe ),
        `${pointwiseName}: biases weight count ( ${biasesWeightCountInFact} ) `
          + `should be ( ${biasesWeightCountShouldBe} ). (${parametersDesc})`);
    }

    let imageOutLength = ( imageIn.height * imageIn.width * pointwiseChannelCount );
    let imageOut = new Base(
      imageIn.height, imageIn.width, pointwiseChannelCount, new Float32Array( imageOutLength ),
      new BoundsArraySet.Pointwise( imageIn.boundsArraySet.output0, pointwiseChannelCount ) );

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
      let tBounds = new FloatValue.Bounds( 0, 0 );
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
        pointwiseName + " activation escaping scale", parametersDesc );
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
   * @param {string}   parametersDesc    A string for debug message of this block.
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

    let padInfo = new ( Depthwise.PadInfoCalculator() )( imageIn.height, imageIn.width, imageIn.depth, 
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

    let { channelMultiplier, dilationHeight, dilationWidth,
          stridesHeight, stridesWidth, padHeightTop, padWidthLeft,
          outputHeight, outputWidth, outputChannelCount, outputElementCount } = padInfo;

    // For ( pad == "valid" ), negative ( inX, inY ) will never happen.
    // For ( pad == "same"  ), negative ( inX, inY ) may happen, but those pixels will be viewed as zero value.
    let imageInBeginY = - padHeightTop;
    let imageInBeginX = - padWidthLeft;

    // If not AVG, MAX, NONE, the filters shape should match input image channel count.
    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {

//!!! (2022/06/13 Remarked)
//       tf.util.assert( ( ( depthwiseFiltersArray.length / ( depthwiseFilterHeight * depthwiseFilterWidth * channelMultiplier ) ) == imageIn.depth ),
//         `${depthwiseName} filters shape `
//           + `( ${depthwiseFiltersArray.length} / ( ${depthwiseFilterHeight} * ${depthwiseFilterWidth} * ${channelMultiplier} ) ) `
//           + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

      let filtersWeightCount = depthwiseFilterHeight * depthwiseFilterWidth * imageIn.depth * channelMultiplier ;

      tf.util.assert( ( depthwiseFiltersArray.length == filtersWeightCount ),
        `${depthwiseName}: filters weight count ( ${depthwiseFiltersArray.length} ) `
          + `should be ( ${filtersWeightCount} ). (${parametersDesc})`);
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

      tf.util.assert( ( biasesWeightCountInFact == biasesWeightCountShouldBe ),
        `${depthwiseName}: biases weight count ( ${biasesWeightCountInFact} ) `
          + `should be ( ${biasesWeightCountShouldBe} ). (${parametersDesc})`);
    }

    let imageOut = new Base(
      outputHeight, outputWidth, outputChannelCount, new Float32Array( outputElementCount ),
      new BoundsArraySet.Depthwise( imageIn.boundsArraySet.output0, outputChannelCount ) );

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
        filtersArray_bBoundsCalculated = new Array( depthwiseFiltersArray.length );
        filtersArray_bBoundsCalculated.fill( false );

        tBounds = new FloatValue.Bounds( 0, 0 );
      }
    }

    // Max pooling
    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) {
        imageOut.dataArray.fill( Number.NEGATIVE_INFINITY ); // So that any value is greater than initialized value.
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

    // Bias
    imageOut.modify_byBias( bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation Escaping.
    {
      // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
      // by .afterBias, bPassThrough and activation function's output range.
      imageOut.boundsArraySet.adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( depthwiseActivationId );

      // Before activation function, scale every element according to its channel.
      Base.scale_byChannel_withoutAffect_BoundsArraySet( imageOut, imageOut.boundsArraySet.output0.scaleArraySet.do,
        depthwiseName + " activation escaping scale", parametersDesc );
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
   * @param {string}   parametersDesc    A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be added bias (according to bBias).
   */
  modify_byBias( bBias, biasesArray, biasName, parametersDesc ) {
    let imageIn = this;

    imageIn.boundsArraySet.afterBias.set_all_byBoundsArray( imageIn.boundsArraySet.afterFilter );
    if ( !bBias )
      return imageIn;

    tf.util.assert( ( biasesArray != null ),
      `${biasName} biasesArray (${biasesArray}) `
        + `should not be null. (${parametersDesc})`);

    tf.util.assert( ( biasesArray.length == imageIn.depth ),
      `${biasName} shape (${biasesArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

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
   * @param {string}   scaleName                A string for debug message of this scaling.
   * @param {string}   parametersDesc           A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return the (modified) image whose every element is scaled according to its channel.
   */
  static scale_byChannel_withoutAffect_BoundsArraySet( imageIn, scaleArray, scaleName, parametersDesc ) {

    tf.util.assert( ( scaleArray != null ),
      `${scaleName} scaleArray (${scaleArray}) `
        + `should not be null. (${parametersDesc})`);

    tf.util.assert( ( scaleArray.length == imageIn.depth ),
      `${scaleName} shape (${scaleArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

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
   * Note: This method does not adjust any BoundsArraySet.
   *
   * @param {NumberImage.Base} imageIn   The source image to be processed.
   * @param {string}   nActivationId     The name string of this activation function.
   *
   * @param {string}   parametersDesc A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be modified by activation function (according to nActivationId). The this.dataArray may be
   * just the original this.dataArray directly (when no activation function). Or, it may be a new Float32Array (when having activation
   * function).
   */
  static modify_byActivation_withoutAffect_BoundsArraySet( imageIn, nActivationId, parametersDesc ) {

//!!! ...unfinished... (2022/05/23) Perhaps, re-implement without tensor.


    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    if ( !theActivationFunctionInfo )
      return imageIn;

    let pfnActivation = theActivationFunctionInfo.pfn;
    if ( !pfnActivation )
      return imageIn;

    // Because pfnActivation is function of tensorflow.js, it process tf.tensor (i.e. not a single value).
    // Let it process the whole input (as an Array) directly.
    let tensorOut = pfnActivation( imageIn.dataArray )
    imageIn.dataArray = tensorOut.dataSync();
    tensorOut.dispose();

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
   * @param {string} parametersDesc        A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of adding this and another.
   */
  clone_byAdd( another, addName, parametersDesc ) {
    let rHeight, rWidth, rDepth, rBoundsArraySet;
    let resultArray;

    if ( ( another.height == this.height ) && ( another.width == this.width ) && ( another.depth == this.depth ) ) { // Same size.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      resultArray = new Float32Array( this.dataArray.length );
      for ( let i = 0; i < this.dataArray.length; ++i ) {
        resultArray[ i ] = this.dataArray[ i ] + another.dataArray[ i ];
      }

    } else if ( ( another.height == 1 ) && ( another.width == 1 ) && ( another.depth == this.depth ) ) { // Broadcast another to this.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      resultArray = new Float32Array( this.dataArray.length );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            resultArray[ i ] = this.dataArray[ i ] + another.dataArray[ c ];
          }
        }
      }

    } else if ( ( this.height == 1 ) && ( this.width == 1 ) && ( this.depth == another.depth ) ) { // Broadcast this to another.

      rHeight = another.height; rWidth = another.width; rDepth = another.depth;
      resultArray = new Float32Array( another.dataArray.length );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            resultArray[ i ] = this.dataArray[ c ] + another.dataArray[ i ];
          }
        }
      }

    } else {
      tf.util.assert( false,
        `${addName}: another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `this ( height, width, depth ) = ( ${this.height}, ${this.width}, ${this.depth} ) `
          + `and `
          + `another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `should be either totally the same or one is ( 1, 1, N ). `
          + `(${parametersDesc})`);
    }

    {
      rBoundsArraySet = new BoundsArraySet.InputsOutputs( this.boundsArraySet.output0, another.boundsArraySet.output0, rDepth );
      rBoundsArraySet.output0
        .set_all_byScaleBoundsArray( this.boundsArraySet.output0 )

         // Note: Not add_all_byScaleBoundsArray_one(). The reason is that it is supported to broadcast in the same channel
         // (i.e. not across channels).
         //
        .add_all_byScaleBoundsArray_all( another.boundsArraySet.output0 );
    }

    // Q: Why not just modify this directly?
    // A: The this might be the original input array which should not be modified at all. (because they might be used in another test.)
    let imageOutNew = new Base( rHeight, rWidth, rDepth, resultArray, rBoundsArraySet );
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
   * @param {string} parametersDesc        A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of multiplying this and another.
   */
  clone_byMultiply( another, multiplyName, parametersDesc ) {
    let rHeight, rWidth, rDepth, rBoundsArraySet;
    let resultArray;

    if ( ( another.height == this.height ) && ( another.width == this.width ) && ( another.depth == this.depth ) ) { // Same size.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      resultArray = new Float32Array( this.dataArray.length );
      for ( let i = 0; i < this.dataArray.length; ++i ) {
        resultArray[ i ] = this.dataArray[ i ] * another.dataArray[ i ];
      }

    } else if ( ( another.height == 1 ) && ( another.width == 1 ) && ( another.depth == this.depth ) ) { // Broadcast another to this.

      rHeight = this.height; rWidth = this.width; rDepth = this.depth;
      resultArray = new Float32Array( this.dataArray.length );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            resultArray[ i ] = this.dataArray[ i ] * another.dataArray[ c ];
          }
        }
      }

    } else if ( ( this.height == 1 ) && ( this.width == 1 ) && ( this.depth == another.depth ) ) { // Broadcast this to another.

      rHeight = another.height; rWidth = another.width; rDepth = another.depth;
      resultArray = new Float32Array( another.dataArray.length );

      let i = 0;
      for ( let y = 0; y < rHeight; ++y ) {
        for ( let x = 0; x < rWidth; ++x ) {
          for ( let c = 0; c < rDepth; ++c, ++i ) {
            resultArray[ i ] = this.dataArray[ c ] * another.dataArray[ i ];
          }
        }
      }

    } else {
      tf.util.assert( false,
        `${multiplyName}: `
          + `this ( height, width, depth ) = ( ${this.height}, ${this.width}, ${this.depth} ) `
          + `and `
          + `another ( height, width, depth ) = ( ${another.height}, ${another.width}, ${another.depth} ) `
          + `should be either totally the same or one is ( 1, 1, N ). `
          + `(${parametersDesc})`);
    }

    {
      rBoundsArraySet = new BoundsArraySet.InputsOutputs( this.boundsArraySet.output0, another.boundsArraySet.output0, rDepth );
      rBoundsArraySet.output0
        .set_all_byScaleBoundsArray( this.boundsArraySet.output0 )

         // Note: Not multiply_all_byScaleBoundsArray_one(). The reason is that it is supported to broadcast in the same channel
         // (i.e. not across channels).
         //
        .multiply_all_byScaleBoundsArray_all( another.boundsArraySet.output0 );
    }

    // Q: Why not just modify this directly?
    // A: The this might be the original input array which should not be modified at all. (because they might be used in another test.)
    let imageOutNew = new Base( rHeight, rWidth, rDepth, resultArray, rBoundsArraySet );
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
   * @param {string}   parametersDesc    A string for debug message of this block.
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

    tf.util.assert(
      (   ( nSqueezeExcitationChannelCountDivisor != undefined )
       && ( nSqueezeExcitationChannelCountDivisor >= ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE )
      ),
      `${squeezeExcitationName}: `
        + `nSqueezeExcitationChannelCountDivisor ( ${nSqueezeExcitationChannelCountDivisor} ) `
        + `should be >= `
        + `ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE `
          + `( ${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE} ) `
        + `(${parametersDesc})`);

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
   * @param {string} interleaveName  A string for debug message of this interleaving.
   * @param {string} parametersDesc  A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return this object which has been modifed in place.
   */
  modify_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo, interleaveName, parametersDesc ) {

    tf.util.assert( ( ( this.depth % 2 ) == 0 ),
      `NumberImage.Base.modify_byInterleave_asGrouptTwo(): `
        + `${interleaveName}: `                   
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
   * @param {string} splitName          A string for debug message of this splitting.
   * @param {string} parametersDesc     A string for debug message of this block.
   */
  static calcSplitAlongAxisId2( imageIn, imageOutArray, splitName, parametersDesc ) {

    imageOutArray.length = 2;
    imageOutArray[ 0 ] = null;
    imageOutArray[ 1 ] = null;

    if ( null == imageIn )
      return;

    // Split value bounds array.
    let rScaleBoundsArray_lowerHalf = new ActivationEscaping.ScaleBoundsArray( 0 );
    let rScaleBoundsArray_higherHalf = new ActivationEscaping.ScaleBoundsArray( 0 );
    imageIn.boundsArraySet.output0.split_to_lowerHalf_higherHalf( rScaleBoundsArray_lowerHalf, rScaleBoundsArray_higherHalf );

    // If not divided by 2, let lower half have one more.
    let imageOutDepth_lowerHalf = rScaleBoundsArray_lowerHalf.length;
    let imageOutDepth_higherHalf = rScaleBoundsArray_higherHalf.length;

    let imageOutLength_lowerHalf = ( imageIn.height * imageIn.width * imageOutDepth_lowerHalf );
    let imageOutLength_higherHalf = ( imageIn.height * imageIn.width * imageOutDepth_higherHalf );

    imageOutArray[ 0 ] = new Base(
        imageIn.height, imageIn.width, imageOutDepth_lowerHalf, new Float32Array( imageOutLength_lowerHalf ),
        new BoundsArraySet.InputsOutputs( imageIn.boundsArraySet.output0, undefined, imageOutDepth_lowerHalf ) );

    imageOutArray[ 1 ] = new Base(
        imageIn.height, imageIn.width, imageOutDepth_higherHalf, new Float32Array( imageOutLength_higherHalf ),
        new BoundsArraySet.InputsOutputs( imageIn.boundsArraySet.output0, undefined, imageOutDepth_higherHalf ) );

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
  }

  /**
   * @param {NumberImage.Base} imageIn1   The source image1 to be processed.
   * @param {NumberImage.Base} imageIn2   The source image2 to be processed.
   * @param {string} concatName           A string for debug message of this concatenation.
   * @param {string} parametersDesc       A string for debug message of this block.
   *
   * @return {NumberImage.Base}
   *   Return concatenated image along the axis id 2. If imageIn1 is null, return imageIn2. If imageIn2 is null, return imageIn1.
   * If both imageIn1 and imageIn2 is null, return null.
   */
  static calcConcatAlongAxisId2( imageIn1, imageIn2, concatName, parametersDesc ) {

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

    tf.util.assert( ( imageIn1.height == imageIn2.height ),
      `${concatName} shape imageIn1.height (${imageIn1.height}) `
        + `should match imageIn2.height (${imageIn2.height}). (${parametersDesc})`);

    tf.util.assert( ( imageIn1.width == imageIn2.width ),
      `${concatName} shape imageIn1.width (${imageIn1.width}) `
        + `should match imageIn2.width (${imageIn2.width}). (${parametersDesc})`);

    let imageOutLength = ( imageIn1.height * imageIn1.width * imageIn1.depth ) + ( imageIn2.height * imageIn2.width * imageIn2.depth );
    let imageOutDepth = imageIn1.depth + imageIn2.depth;
    let imageOut = new Base(
      imageIn1.height, imageIn1.width, imageOutDepth, new Float32Array( imageOutLength ),
      new BoundsArraySet.InputsOutputs( imageIn1.boundsArraySet.output0, imageIn2.boundsArraySet.output0, imageOutDepth )
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
   * @param {boolean} bSplit
   *   If true, the result will be splitted into imageOutArray[ 0 ] and imageOutArray[ 1 ]. If false, the result will be placed in
   * imageOutArray[ 0 ] and imageOutArray[ 1 ] will be null.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @param {string}   concatShuffleSplitName       A string for debug message of this concatenation-shuffle-split.
   * @param {string}   parametersDesc               A string for debug message of this block.
   */
  static calcConcatShuffleSplit(
    imageInArray, imageOutArray, bSplit,
    arrayTemp_forInterleave_asGrouptTwo,
    concatShuffleSplitName, parametersDesc ) {

    tf.util.assert( ( imageInArray.length == 2 ),
      `${concatShuffleSplitName}: `
        + `The length of imageInArray[] ( ${imageInArray.length} ) must be 2. `
        + `(${parametersDesc})`
    );

    // Note: Although different depth is wierd, it might still work. So, allow it.
    tf.util.assert(
      (   ( imageInArray[ 0 ].height == imageInArray[ 1 ].height )
       && ( imageInArray[ 0 ].width ==  imageInArray[ 1 ].width )
       //&& ( imageInArray[ 0 ].depth ==  imageInArray[ 1 ].depth )
      ),

      `${concatShuffleSplitName}: The first input image's shape ( height, width, depth ) = `
        + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${imageInArray[ 0 ].depth} ) `
        + `should be the same as the second input image's shape `
        + `( ${imageInArray[ 1 ].height}, ${imageInArray[ 1 ].width}, ${imageInArray[ 1 ].depth} ). `
        + `(${parametersDesc})`
    );

    let concatResult = NumberImage.Base.calcConcatAlongAxisId2( imageInArray[ 0 ], imageInArray[ 1 ],
      `${concatShuffleSplitName}_concat`, parametersDesc );

    let shuffleResult = concatResult.modify_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo,
      `${concatShuffleSplitName}_interleave_asGrouptTwo`, parametersDesc );
 
    if ( bSplit ) {
      NumberImage.Base.calcSplitAlongAxisId2( shuffleResult, imageOutArray, `${concatShuffleSplitName}_split`, parametersDesc );
    } else {
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
   *   If true, the value bounds will be is real bounds of the generated elements. If false, the value bounds will be
   * Weights.Base.ValueBounds. Default is false.
   *
   * @return {NumberImage.Base}
   *   Return a generated new image. Basically, they are sequential numbers which could be added by random offset between
   * [ randomOffsetMin, randomOffsetMax].
   */
  static create_bySequenceRandom( height, width, channelCount, randomOffsetMin = 0, randomOffsetMax = 0, bAutoBounds = false ) {
    let elementCount = height * width * channelCount;

    let tBounds;
    if ( bAutoBounds ) {
     tBounds = new FloatValue.Bounds( 0, 0 );
    }

    let dataArray = RandTools.generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax, tBounds );

    let boundsArraySet; // If null, assume all image pixels are inside the default value bounds (i.e. Weights.Base.ValueBounds).
    if ( bAutoBounds ) {
      let inputScaleBoundsArray = new ActivationEscaping.ScaleBoundsArray( channelCount );
      inputScaleBoundsArray.set_all_byBounds( tBounds );

      boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, undefined, channelCount, undefined );
    }

    let imageNew = new Base( height, width, channelCount, dataArray, boundsArraySet );
    return imageNew;
  }

}
 
