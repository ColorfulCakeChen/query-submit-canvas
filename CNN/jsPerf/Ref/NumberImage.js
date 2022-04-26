export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
//import * as Pointwise from "../../Conv/Pointwise.js";
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

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {boolean}  bPassThrough      Whether scale the output image for pass-through activation function (i.e. scale to the linear part).
   * @param {string}   pointwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the pointwise convolution, bias and activation.
   */
  cloneBy_pointwise(
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    bPassThrough,
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

          tBounds
            .set_byBoundsArray( imageOut.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel )
            .multiply_byN( pointwiseFiltersArray[ filterIndex ] );

          imageOut.boundsArraySet.afterFilter.add_one_byBounds( outChannel, tBounds );
        }
      }
    }

    // Bias
    imageOut.modifyByBias( bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
    // by .afterBias, bPassThrough and activation function's output range.
    imageOut.boundsArraySet.set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId( pointwiseActivationId );

//!!! ...unfinished... (2022/04/26)
// should .apply_doEscapingScale_to_filtersArray_biasesArray()
// after .set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId
// before call .modifyByActivation().

    // Activation
    imageOut.modifyByActivation( pointwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {boolean}  bBias             Whether add bias.
   * @param {boolean}  bPassThrough      Whether scale the output image for pass-through activation function (i.e. scale to the linear part).
   * @param {string}   depthwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of the depthwise convolution, bias and activation.
   */
  cloneBy_depthwise(
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    bPassThrough,
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
    imageOut.modifyByBias( bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
    // by .afterBias, bPassThrough and activation function's output range.
    imageOut.boundsArraySet.set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId( depthwiseActivationId );

//!!! ...unfinished... (2022/04/26)
// should .apply_doEscapingScale_to_filtersArray_biasesArray()
// after .set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId
// before call .modifyByActivation().

    // Activation
    imageOut.modifyByActivation( depthwiseActivationId, parametersDesc );

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

    imageIn.boundsArraySet.afterBias.set_all_byBoundsArray( imageIn.boundsArraySet.afterFilter );
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

    // Calculate value bounds of every output channels (i.e. .afterBias) by shifting as the bias.
    for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
      imageIn.boundsArraySet.afterBias.add_one_byN( inChannel, biasesArray[ inChannel ] );
    }

    return imageIn;
  }

  /**
   * @param {NumberImage.Base} this      The source image to be processed.
   * @param {string}   nActivationId     The name string of this activation function.
   *
   * @param {string}   parametersDesc A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return this which may or may not be modified by activation function (according to nActivationId). The this.dataArray may be
   * just the original this.dataArray directly (when no activation function). Or, it may be a new Float32Array (when having activation
   * function).
   */
  modifyByActivation( nActivationId, parametersDesc ) {
    let imageIn = this;

    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    if ( !theActivationFunctionInfo )
      return imageIn;

//!!! (2022/04/26 Remarked) Moved to cloneBy_pointwise() and cloneBy_depthwise()
//     // Calculate value bounds of every output channels (i.e. .output0 (.boundsArray, .scaleArraySet.do, .scaleArraySet.undo))
//     // by .afterBias, bPassThrough and activation function's output range.
//     imageIn.boundsArraySet.set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId( nActivationId );

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
   * @param {string} addName               A string for debug message of this addding operation.
   * @param {string} parametersDesc        A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base}
   *   Return a newly created object which is the result of adding this and another.
   */
  cloneBy_add( another, addName, parametersDesc ) {

    // If the output dimensions ( height, width, depth ) is not the same as input, it is impossible to add-input-to-output.
    {
      tf.util.assert( ( another.height == this.height ),
        `${addName}: another.height ( ${another.height} ) `
          + `should match this.height ( ${this.height} ). (${parametersDesc})`);

      tf.util.assert( ( another.width == this.width ),
        `${addName}: another.width ( ${another.width} ) `
          + `should match this.width ( ${this.width} ). (${parametersDesc})`);

      tf.util.assert( ( another.depth == this.depth ),
        `${addName}: another.depth ( ${another.depth} ) `
          + `should match this.depth ( ${this.depth} ). (${parametersDesc})`);
    }

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
      resultArray,
      new BoundsArraySet.InputsOutputs( this.boundsArraySet.output0, undefined, this.depth )
    );

    // Calculate value bounds of every output channels (i.e. .afterActivation; .output).
    imageOutNew.boundsArraySet.output0.set_all_byScaleBoundsArray_add(
      imageOutNew.boundsArraySet.input0, another.boundsArraySet.output0 );

    return imageOutNew;
  }

  /**
   * @param {NumberImage.Base} imageIn  The source image to be processed.
   * @param {string} splitName          A string for debug message of this splitting.
   * @param {string} parametersDesc     A string for debug message of this point-depth-point.
   *
   * @return {NumberImage.Base[]}
   *   Return splitted images [ imageOut1, imageOut2 ] along the axis id 2. If imageIn is null, return [ null, null ].
   */
  static calcSplitAlongAxisId2( imageIn, splitName, parametersDesc ) {

    if ( null == imageIn )
      return [ null, null ];

    // Split value bounds array.
    let rScaleBoundsArray_lowerHalf = new ActivationEscaping.ScaleBoundsArray( 0 );
    let rScaleBoundsArray_higherHalf = new ActivationEscaping.ScaleBoundsArray( 0 );
    imageIn.boundsArraySet.output0.split_to_lowerHalf_higherHalf( rScaleBoundsArray_lowerHalf, rScaleBoundsArray_higherHalf );

    // If not divided by 2, let lower half have one more.
    let imageOutDepth_lowerHalf = rScaleBoundsArray_lowerHalf.length;
    let imageOutDepth_higherHalf = rScaleBoundsArray_higherHalf.length;

    let imageOutLength_lowerHalf = ( imageIn.height * imageIn.width * imageOutDepth_lowerHalf );
    let imageOutLength_higherHalf = ( imageIn.height * imageIn.width * imageOutDepth_higherHalf );

    let imageOutArray = [
      new Base(
        imageIn.height, imageIn.width, imageOutDepth_lowerHalf, new Float32Array( imageOutLength_lowerHalf ),
        new BoundsArraySet.InputsOutputs( imageIn.boundsArraySet.output0, undefined, imageOutDepth_lowerHalf ) ),

      new Base(
        imageIn.height, imageIn.width, imageOutDepth_higherHalf, new Float32Array( imageOutLength_higherHalf ),
        new BoundsArraySet.InputsOutputs( imageIn.boundsArraySet.output0, undefined, imageOutDepth_higherHalf ) )
    ];

    let imageOut0 = imageOutArray[ 0 ];
    let imageOut1 = imageOutArray[ 1 ];

    // Split along the image depth.
    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );

        let inIndexBaseC  = ( indexBaseC * imageIn.depth );

        let inChannel = 0;

        let outIndexBaseC_lowerHalf = ( indexBaseC * imageOutDepth_lowerHalf );
        let outIndexBaseC_higherHalf = ( indexBaseC * imageOutDepth_higherHalf );

        for ( let outChannel = 0; outChannel < imageOutDepth_lowerHalf; ++outChannel, ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          let outIndex_lowerHalf = outIndexBaseC_lowerHalf + outChannel;
          imageOut0.dataArray[ outIndex_lowerHalf ] = imageIn.dataArray[ inIndex ];
        }

        for ( let outChannel = 0; outChannel < imageOutDepth_higherHalf; ++outChannel, ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          let outIndex_higherHalf = outIndexBaseC_higherHalf + outChannel;
          imageOut1.dataArray[ outIndex_higherHalf ] = imageIn.dataArray[ inIndex ];
        }

      }
    }

    // Setup value bounds array.
    imageOut0.boundsArraySet.set_outputs_all_byScaleBoundsArray( rScaleBoundsArray_lowerHalf );
    imageOut1.boundsArraySet.set_outputs_all_byScaleBoundsArray( rScaleBoundsArray_higherHalf );

    return imageOutArray;
  }

  /**
   * @param {NumberImage.Base} imageIn1   The source image1 to be processed.
   * @param {NumberImage.Base} imageIn2   The source image2 to be processed.
   * @param {string} concatName           A string for debug message of this concatenation.
   * @param {string} parametersDesc       A string for debug message of this point-depth-point.
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
    for ( let y = 0; y < imageIn1.height; ++y ) {
      let indexBaseX = ( y * imageIn1.width );

      for ( let x = 0; x < imageIn1.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );
        let outIndexBaseC = ( indexBaseC * imageOut.depth );

        let outChannel = 0;

        let in1IndexBaseC  = ( indexBaseC * imageIn1.depth );
        for ( let in1Channel = 0; in1Channel < imageIn1.depth; ++in1Channel, ++outChannel ) {
          let in1Index = in1IndexBaseC + in1Channel;
          let outIndex = outIndexBaseC + outChannel;
          imageOut.dataArray[ outIndex ] = imageIn1.dataArray[ in1Index ];
        }

        let in2IndexBaseC  = ( indexBaseC * imageIn2.depth );
        for ( let in2Channel = 0; in2Channel < imageIn2.depth; ++in2Channel, ++outChannel ) {
          let in2Index = in2IndexBaseC + in2Channel;
          let outIndex = outIndexBaseC + outChannel;
          imageOut.dataArray[ outIndex ] = imageIn2.dataArray[ in2Index ];
        }

      }
    }

    // Concat value bounds array.
    imageOut.boundsArraySet.set_outputs_all_by_concat_input0_input1();

    return imageOut;
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
 
