export { Base };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ConvBiasActivation from "../../Conv/ConvBiasActivation.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";

/**
 * Image composed from numbers. For testing.
 *
 *
 * @member {number}   height    Image height
 * @member {number}   width     Image width
 * @member {number}   depth     Image channel count
 * @member {number[]|Float32Array} dataArray Image data
 *
 * @member {ConvBiasActivation.BoundsArraySet} boundsArraySet
 *   The element value bounds set of the pointwise or depthwise convolution.
 */
class Base {

  constructor( height, width, depth, dataArray, boundsArraySet ) {
    this.height = height;
    this.width = width;
    this.depth = depth;
    this.dataArray = dataArray;
    this.boundsArraySet = boundsArraySet;

    if ( !this.boundsArraySet ) { // Default bounds for an image.
      this.boundsArraySet = new ConvBiasActivation.BoundsArraySet( depth, depth );
      this.boundsArraySet.set_all_byBounds( Weights.Base.ValueBounds ); // Assume all images are inside the default value bounds.
    }
  }

  clone() {
    let result = new Base( this.height, this.width, this.depth, new Float32Array( this.dataArray ), this.boundsArraySet.clone() );
    return result;
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   pointwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the pointwise convolution, bias and activation.
   */
  cloneBy_pointwise(
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    pointwiseName, parametersDesc ) {

    let imageIn = this;

    if ( pointwiseChannelCount <= 0 )
      return imageIn.clone(); // No pointwise operation.

    tf.util.assert( ( ( pointwiseFiltersArray.length / pointwiseChannelCount ) == imageIn.depth ),
      `${pointwiseName} filters shape ( ${pointwiseFiltersArray.length} / ${pointwiseChannelCount} ) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    let imageOutLength = ( imageIn.height * imageIn.width * pointwiseChannelCount );
    let imageOut = new Base(
      imageIn.height, imageIn.width, pointwiseChannelCount, new Float32Array( imageOutLength ),
      new Pointwise.BoundsArraySet( imageIn.depth, pointwiseChannelCount ) );

//!!! ...unfinished... (2022/02/21)

    // Determine element value bounds.
    {
      imageOut.boundsArraySet.reset_byBounds( imageIn.boundsArraySet.output );

      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;

      imageOut.boundsArraySet.beforeActivation.multiply_all_byBounds( filtersValueBounds )
        .multiply_all_byN( imageIn.depth ); // Every pointwise output channel is composed of all input channel.
    }

    // Pointwise Convolution
    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );
        let inIndexBaseC  = ( indexBaseC * imageIn.depth );
        let outIndexBaseC = ( indexBaseC * pointwiseChannelCount );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;

          for ( let outChannel = 0; outChannel < pointwiseChannelCount; ++outChannel ) {
            let outIndex = outIndexBaseC + outChannel;
            let filterIndexBase = ( inChannel * pointwiseChannelCount );
            let filterIndex = filterIndexBase + outChannel;

            imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ] * pointwiseFiltersArray[ filterIndex ];
          }
        }
      }
    }

    // Bias
    imageOut.modifyByBias( bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Activation
    imageOut.modifyByActivation( pointwiseActivationId, imageIn.boundsArraySet, parametersDesc );

    return imageOut;
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   depthwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the depthwise convolution, bias and activation.
   */
  cloneBy_depthwise(
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    depthwiseName, parametersDesc ) {

    let imageIn = this;

    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE === depthwise_AvgMax_Or_ChannelMultiplier )
      return imageIn.clone(); // No depthwise operation.

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
      tf.util.assert( ( ( depthwiseFiltersArray.length / ( depthwiseFilterHeight * depthwiseFilterWidth * channelMultiplier ) ) == imageIn.depth ),
        `${depthwiseName} filters shape `
          + `( ${depthwiseFiltersArray.length} / ( ${depthwiseFilterHeight} * ${depthwiseFilterWidth} * ${channelMultiplier} ) ) `
          + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);
    }

    let imageOut = new Base(
      outputHeight, outputWidth, outputChannelCount, new Float32Array( outputElementCount ),
      new Depthwise.BoundsArraySet( inputChannelCount???, outputChannelCount??? ) );

//!!! ...unfinished... (2022/02/21)
    // Determine element value bounds.
    {
      imageOut.boundsArraySet.reset_byBounds( imageIn.boundsArraySet.output );

      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;

      // Note: For maximum pooling, the multiply_Bounds is a little bit overestimated (but should be acceptable).
      let filterSize = depthwiseFilterHeight * depthwiseFilterWidth;
      imageOut.boundsArraySet.beforeActivation.multiply_all_byBounds( filtersValueBounds )
        .multiply_all_byN( filterSize ); // Every depthwise output pixel is composed of all of a filter.
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
          let outIndexBaseSubC = outIndexBaseC + ( inChannel * channelMultiplier );

          for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub ) {
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
                    let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * channelMultiplier );

                    let filterIndex = filterIndexBaseSubC + outChannelSub;

                    switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG: // Avg pooling
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ];
                        break;

                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX: // Max pooling
                        imageOut.dataArray[ outIndex ] = Math.max( imageOut.dataArray[ outIndex ], imageIn.dataArray[ inIndex ] );
                        break;

                      default: // Convolution
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ] * depthwiseFiltersArray[ filterIndex ];
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
    imageOut.modifyByBias( bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation
    imageOut.modifyByActivation( depthwiseActivationId, imageIn.boundsArraySet, parametersDesc );

    return imageOut;
  }

  /**
   * @param {NumberImage.Base} this     The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {number[]} biasesArray       The bias values.
   * @param {string}   biasName          A string for debug message of this bias.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be added bias (according to bBias).
   */
  modifyByBias( bBias, biasesArray, biasName, parametersDesc ) {

    let imageIn = this;

    if ( !bBias )
      return imageIn;

    tf.util.assert( ( biasesArray != null ),
      `${biasName} biasesArray (${biasesArray}) `
        + `should not be null. (${parametersDesc})`);

    tf.util.assert( ( biasesArray.length == imageIn.depth ),
      `${biasName} shape (${biasesArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let inIndexBaseC  = ( ( indexBaseX + x ) * imageIn.depth );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          imageIn.dataArray[ inIndex ] += biasesArray[ inChannel ];
        }
      }
    }

    for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) { // Calculate value bounds of every output channels by shifting as the bias.
      imageIn.boundsArraySet.afterBias.add_one_byN( inChannel, biasesArray[ inChannel ] );
    }

    return imageIn;
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {string}   nActivationId     The name string of this activation function.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The element value bounds set of previous pointwise/depthwise convolution.
   *
   * @param {string}   parametersDesc A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be modified by activation function (according to nActivationId). The this.dataArray may be
   * just the original this.dataArray directly (when no activation function). Or, it may be a new Float32Array (when having activation
   * function).
   */
  modifyByActivation( nActivationId, previous_ConvBiasActivation_BoundsArraySet, parametersDesc ) {

    let imageIn = this;

//!!! ...unfinished... (2022/02/21)
    // Determine the element value bounds.
    {
      imageIn.boundsArraySet.set_output_by_beforeActivation_ActivationId( nActivationId );

      imageIn.boundsArraySet.activationEscaping_ScaleTranslateSet.set_by_currentValueBoundsSet_previousActivationEscaping(
        imageIn.boundsArraySet, previous_ConvBiasActivation_ValueBoundsSet.activationEscaping_ScaleTranslateSet );
    }

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
   * @param {NumberImage.Base} this        The first image to be used for adding. It must have the same size as another.
   * @param {NumberImage.Base} another     The second image to be used for adding. It must have the same size as this.
   *
   * @param {string} addInputToOutputName  A string for debug message of this bias.
   * @param {string} parametersDesc        A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of adding this and another.
   */
  cloneBy_add( another, addInputToOutputName, parametersDesc ) {

    // If the output dimensions ( height, width, depth ) is not the same as input, it is impossible to add-input-to-output.
    {
//!!! (2021/12/17 Remarked) Alreaddy the following assertion.
//       if ( ( another.height != this.height ) || ( another.width != this.width ) || ( another.depth != this.depth ) )
//         return ???imageOut;

      tf.util.assert( ( another.height == this.height ),
        `${addInputToOutputName}: another.height ( ${another.height} ) `
          + `should match this.height ( ${this.height} ). (${parametersDesc})`);

      tf.util.assert( ( another.width == this.width ),
        `${addInputToOutputName}: another.width ( ${another.width} ) `
          + `should match this.width ( ${this.width} ). (${parametersDesc})`);

      tf.util.assert( ( another.depth == this.depth ),
        `${addInputToOutputName}: another.depth ( ${another.depth} ) `
          + `should match this.depth ( ${this.depth} ). (${parametersDesc})`);
    }

//!!! (2021/12/17 Remarked) Using for-loop is faster.
//    let resultArray = another.dataArray.map( ( value, i ) => ( this.dataArray[ i ] + value ) );

    let resultArray = new Float32Array( this.dataArray.length );
    for ( let i = 0; i < this.dataArray.length; ++i ) {
      resultArray[ i ] = this.dataArray[ i ] + another.dataArray[ i ];
    }

    // Q: Why not just modify this directly?
    // A: The this might be the original input array which should not be modified at all. (because they might be used in another test.)
    let imageOutNew = new Base(
      this.height,
      this.width,
      this.depth,
      resultArray
    );

//!!! ...unfinished... (2022/02/21)
    {
      imageOutNew.boundsArraySet.input.set_byBoundsArray( this.boundsArraySet.output );

      imageOutNew.boundsArraySet.output.set_byBoundsArray( this.boundsArraySet.output );
      imageOutNew.boundsArraySet.output.add_byBoundsArray( another.boundsArraySet.output );

      // Keep .beforeActivation the same as .output.
      imageOutNew.boundsArraySet.beforeActivation.set_byBoundsArray( imageOutNew.boundsArraySet.output );

      //imageOutNew.boundsArraySet.activationEscaping_ScaleTranslateSet; // Keeps as default ( 1, 0 ).
    }

    return imageOutNew;
  }

}
 
