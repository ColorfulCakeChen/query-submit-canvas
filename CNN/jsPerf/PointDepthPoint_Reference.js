export { TestCase };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Reference computation of class PointDepthPoint.Base.
 */
class TestCase {

  /**
   * @param {number[]} paramsInArray     parameters data which will be processed by PointDepthPoint.Params
   * @param {number[]} paramsOutArray    parameters data which should match the result of PointDepthPoint.Params
   *
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
//!!! ...unfinished...
   * @param {number[]} imageOutArray     Output image data
   */
  constructor(
    paramsInArray, paramsOutArray,
    pointwise1FiltersArray, pointwise1BiasesArray,
    depthwiseFiltersArray, depthwiseBiasesArray,
    pointwise2FiltersArray, pointwise2BiasesArray,
    imageIn,
//!!!
    imageOutArray
  ) {
    this.weights = {
      params: {
        inArray:  paramsInArray,
        outArray: paramsOutArray
      },
      pointwise1Filters: pointwise1FiltersArray, pointwise1Biases: pointwise1BiasesArray,
      depthwiseFilters:  depthwiseFiltersArray,  depthwiseBiases:  depthwiseBiasesArray,
      pointwise2Filters: pointwise2FiltersArray, pointwise2Biases: pointwise2BiasesArray
    };

    this.image = {
      in:  imageIn,
//!!!
      outArray: imageOutArray
    };

    // For testing not start at the offset 0.
    this.weightsElementOffsetBegin = 3; // Skip the un-used. (in element count)
    this.weightsByteOffsetBegin = this.weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used. (in byte count)

    // Prepare weights source and offset into array. So that they can be accessed by loop.
    let weightsSourceArray = this.weightsSourceArray = [];
    {
      let offset = this.weightsElementOffsetBegin;

      if ( paramsInArray ) {
        weightsSourceArray.push( { offset: offset, weights: paramsInArray } );
        offset += paramsInArray.length;
      }

      if ( pointwise1FiltersArray ) {
        weightsSourceArray.push( { offset: offset, weights: pointwise1FiltersArray } );
        offset += pointwise1FiltersArray.length;
      }

      if ( pointwise1BiasesArray ) {
        weightsSourceArray.push( { offset: offset, weights: pointwise1BiasesArray } );
        offset += pointwise1BiasesArray.length;
      }

      if ( depthwiseFiltersArray ) {
        weightsSourceArray.push( { offset: offset, weights: depthwiseFiltersArray } );
        offset += depthwiseFiltersArray.length;
      }

      if ( depthwiseBiasesArray ) {
        weightsSourceArray.push( { offset: offset, weights: depthwiseBiasesArray } );
        offset += depthwiseBiasesArray.length;
      }

      if ( pointwise2FiltersArray ) {
        weightsSourceArray.push( { offset: offset, weights: pointwise2FiltersArray } );
        offset += pointwise2FiltersArray.length;
      }

      if ( pointwise2BiasesArray ) {
        weightsSourceArray.push( { offset: offset, weights: pointwise2BiasesArray } );
        offset += pointwise2BiasesArray.length;
      }

      this.weightsTotalLength = offset;
    }

    // Concatenate this.weights into a Float32Array.
    this.weightsFloat32Array = new Float32Array( this.weightsTotalLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      for ( let i = 0; i < weightsSourceArray.length; ++i ) { // Concatenate this.weights into a Float32Array.
        this.weightsFloat32Array.set( weightsSourceArray[ i ].weights, weightsSourceArray[ i ].offset );
      }
    }
  }

  /**
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep).
   *
   * @return {PointDepthPoint.Base} The created pointDepthPoint object.
   */
  pointDepthPoint_create( bKeepInputTensor ) {

    let pointDepthPoint = new PointDepthPoint.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let bInitOk = pointDepthPoint.init(
      progress, this.weightsFloat32Array, this.weightsByteOffsetBegin,
      this.image.in.depth, // channelCount_pointwise1Before (i.e. inChannels)

//!!! ...unfinished... Could be randomized some null some non-null?

      // Pass null as the following parameters so that they will be extracted from this.weightsFloat32Array.

      //pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      null, null, null,

      //depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      null, null, null, null, null,

      //pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
      null, null, null,

      // bAddInputToOutput
      null,

      bKeepInputTensor
    );

    // Pass null as the following parameters so that they will be extracted from this.weightsFloat32Array.
    let [
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
      bAddInputToOutput
    ] = this.weights.params.outArray;

    let parametersDescription = `( ${pointDepthPoint.parametersDescription} )`;

    tf.util.assert( ( pointDepthPoint.isValid() == bInitOk ),
      `PointDepthPoint validation state (${pointDepthPoint.isValid()}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize pointDepthPoint object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);


    tf.util.assert( ( pointDepthPoint.byteOffsetBegin == this.weightsByteOffsetBegin ),
      `PointDepthPoint parsing beginning position (${pointDepthPoint.byteOffsetBegin}) should be (${this.weightsByteOffsetBegin}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.byteOffsetEnd == this.weightsFloat32Array.byteLength ),
      `PointDepthPoint parsing ending position (${pointDepthPoint.byteOffsetEnd}) should be (${this.weightsFloat32Array.byteLength}). ${parametersDescription}`);


    tf.util.assert( ( pointDepthPoint.inChannels == this.image.in.depth ),
      `PointDepthPoint inChannels (${pointDepthPoint.inChannels}) should be (${this.image.in.depth}). ${parametersDescription}`);

    // pointwise1 parameters.
    tf.util.assert( ( pointDepthPoint.pointwise1ChannelCount == pointwise1ChannelCount ),
      `PointDepthPoint pointwise1ChannelCount (${pointDepthPoint.pointwise1ChannelCount}) should be (${pointwise1ChannelCount}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.bPointwise1Bias == bPointwise1Bias ),
      `PointDepthPoint bPointwise1Bias (${pointDepthPoint.bPointwise1Bias}) should be (${bPointwise1Bias}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.pointwise1ActivationId == pointwise1ActivationId ),
      `PointDepthPoint pointwise1ActivationId (${pointDepthPoint.pointwise1ActivationId}) should be (${pointwise1ActivationId}). ${parametersDescription}`);

    let pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( pointwise1ActivationId );
    tf.util.assert( ( pointDepthPoint.pointwise1ActivationName == pointwise1ActivationName ),
      `PointDepthPoint pointwise1ActivationName (${pointDepthPoint.pointwise1ActivationName}) should be (${pointwise1ActivationName}). ${parametersDescription}`);

    // depthwise parameters.
    tf.util.assert( ( pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier == depthwise_AvgMax_Or_ChannelMultiplier ),
      `PointDepthPoint depthwise_AvgMax_Or_ChannelMultiplier (${pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier}) should be (${depthwise_AvgMax_Or_ChannelMultiplier}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.depthwiseFilterHeight == depthwiseFilterHeight ),
      `PointDepthPoint depthwiseFilterHeight (${pointDepthPoint.depthwiseFilterHeight}) should be (${depthwiseFilterHeight}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.depthwiseStridesPad == depthwiseStridesPad ),
      `PointDepthPoint depthwiseStridesPad (${pointDepthPoint.depthwiseStridesPad}) should be (${depthwiseStridesPad}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.bDepthwiseBias == bDepthwiseBias ),
      `PointDepthPoint bDepthwiseBias (${pointDepthPoint.bDepthwiseBias}) should be (${bDepthwiseBias}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.depthwiseActivationId == depthwiseActivationId ),
      `PointDepthPoint depthwiseActivationId (${pointDepthPoint.depthwiseActivationId}) should be (${depthwiseActivationId}). ${parametersDescription}`);

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( depthwiseActivationId );
    tf.util.assert( ( pointDepthPoint.depthwiseActivationName == depthwiseActivationName ),
      `PointDepthPoint depthwiseActivationName (${pointDepthPoint.depthwiseActivationName}) should be (${depthwiseActivationName}). ${parametersDescription}`);

    // pointwise2 parameters.
    tf.util.assert( ( pointDepthPoint.pointwise2ChannelCount == pointwise2ChannelCount ),
      `PointDepthPoint pointwise2ChannelCount (${pointDepthPoint.pointwise2ChannelCount}) should be (${pointwise2ChannelCount}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.bPointwise2Bias == bPointwise2Bias ),
      `PointDepthPoint bPointwise2Bias (${pointDepthPoint.bPointwise2Bias}) should be (${bPointwise2Bias}). ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.pointwise2ActivationId == pointwise2ActivationId ),
      `PointDepthPoint pointwise2ActivationId (${pointDepthPoint.pointwise2ActivationId}) should be (${pointwise2ActivationId}). ${parametersDescription}`);

    let pointwise2ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( pointwise2ActivationId );
    tf.util.assert( ( pointDepthPoint.pointwise2ActivationName == pointwise2ActivationName ),
      `PointDepthPoint pointwise2ActivationName (${pointDepthPoint.pointwise2ActivationName}) should be (${pointwise2ActivationName}). ${parametersDescription}`);

    // Other parameters.
    tf.util.assert( ( pointDepthPoint.bAddInputToOutput == bAddInputToOutput ),
      `PointDepthPoint bAddInputToOutput (${pointDepthPoint.bAddInputToOutput}) should be (${bAddInputToOutput}). ${parametersDescription}`);


    tf.util.assert( ( pointDepthPoint.bKeepInputTensor == bKeepInputTensor ),
      `PointDepthPoint bKeepInputTensor (${pointDepthPoint.bKeepInputTensor}) should be (${bKeepInputTensor}). ${parametersDescription}`);

//!!! ...unfinished...
//     tf.util.assert( ( pointDepthPoint.outChannels == outChannels ),
//       `PointDepthPoint outChannels (${pointDepthPoint.outChannels}) should be (${outChannels}). ${parametersDescription}`);

    return pointDepthPoint;
  }

  /** According to this.weights.params.outArray and this.image.inArray, calculate this.image.outArray.
   * @return {number[]} Return output image data as array.
   */ 
  calcResult() {
    // Assume the paramsOutArray is correct. Unpack it into parameters.
    let [
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
      bAddInputToOutput
    ] = this.weights.params.outArray;

    // Create description for debug easily.
    this.params.description =
        `pointwise1ChannelCount=${pointwise1ChannelCount}, bPointwise1Bias=${bPointwise1Bias}, `// pointwise1ActivationName=${pointwise1ActivationName}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseFilterHeight=${depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${depthwiseStridesPad}, `
      + `bDepthwiseBias=${bDepthwiseBias}, `
//      + `depthwiseActivationName=${depthwiseActivationName}, `
      + `pointwise2ChannelCount=${pointwise2ChannelCount}, bPointwise2Bias=${bPointwise2Bias}, `//pointwise2ActivationName=${pointwise2ActivationName}, `
      + `bAddInputToOutput=${bAddInputToOutput}`
    ;

    let nextImageIn = this.image.in;

    // Pointwise1
    if ( pointwise1ChannelCount > 0 ) {
      nextImageIn = TestCase.calcPointwise(
        nextImageIn,
        pointwise1ChannelCount, this.weights.pointwise1Filters, bPointwise1Bias, this.weights.pointwise1Biases, pointwise1ActivationId,
        "Pointwise 1", this.params.description );
    }

    // Depthwise
    if ( 0 != depthwise_AvgMax_Or_ChannelMultiplier ) {
      nextImageIn = TestCase.calcDepthwise(
        nextImageIn,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
        this.weights.depthwiseFilters, bDepthwiseBias, this.weights.depthwiseBiases, depthwiseActivationId,
        "Depthwise", this.params.description );
    }

    // Pointwise2
    if ( pointwise2ChannelCount > 0 ) {
      nextImageIn = TestCase.calcPointwise(
        nextImageIn,
        pointwise2ChannelCount, this.weights.pointwise2Filters, bPointwise2Bias, this.weights.pointwise2Biases, pointwise2ActivationId,
        "Pointwise 2", this.params.description );
    }

    return nextImageIn;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   pointwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {Float32Array}
   *   The result of the pointwise convolution, bias and activation.
   */
  static calcPointwise(
    imageIn,
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    pointwiseName, parametersDesc ) {

    tf.util.assert( ( ( pointwiseFiltersArray.length / pointwiseChannelCount ) == imageIn.depth ),
      `${pointwiseName} filters shape ( ${pointwiseFiltersArray.length} / ${pointwiseChannelCount} ) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    let imageOutLength = ( imageIn.height * imageIn.width * pointwiseChannelCount );
    let imageOut = { height: imageIn.height, width: imageIn.width, depth: imageIn.depth, dataArray: new Float32Array( imageOutLength ) };

    // Pointwise Convolution
    for ( let outChannel = 0; outChannel < pointwiseChannelCount; ++outChannel ) {
      let filterIndexBase = ( outChannel * imageIn.depth );

      for ( let y = 0; y < imageIn.height; ++y ) {
        let indexBaseX = ( y * imageIn.width );

        for ( let x = 0; x < imageIn.width; ++x ) {
          let indexBaseC = ( indexBaseX + x );
          let inIndexBaseC  = ( indexBaseC * imageIn.depth );
          let outIndexBaseC = ( indexBaseC * pointwiseChannelCount );

          for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
            let inIndex = inIndexBaseC + inChannel;
            let outIndex = outIndexBaseC + outChannel;
            let filterIndex = filterIndexBase + inChannel;

            imageOut.dataArray[ outIndex ] = imageIn.dataArray[ inIndex ] * pointwiseFiltersArray[ filterIndex ];
          }
        }
      }
    }

    // Bias
    TestCase.modifyByBias( imageOut, bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Activation
    TestCase.modifyByActivation( imageOut, pointwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   depthwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {Float32Array}
   *   The result of the depthwise convolution, bias and activation.
   */
  static calcDepthwise(
    imageIn,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    depthwiseName, parametersDesc ) {

    let channelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if (   ( "Avg" === depthwise_AvgMax_Or_ChannelMultiplier )
        || ( "Max" === depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      channelMultiplier = 1;
    }

    let depthwiseFilterWidth = depthwiseFilterHeight; // Assume filter's width equals height.

    let imageOutDepth = imageIn.depth * channelMultiplier;

    // Strides and Padding.
    let depthwiseStrides, depthwisePad;
    switch ( depthwiseStridesPad ) {
      case 0:  depthwiseStrides = 1; depthwisePad = "valid"; break;
      default:
      case 1:  depthwiseStrides = 1; depthwisePad = "same";  break;
      case 2:  depthwiseStrides = 2; depthwisePad = "same";  break;
    }

    // Assume strides width equals strides height.
    let stridesHeight = depthwiseStrides;
    let stridesWidth = depthwiseStrides;

    // Currently, we can only handle dilation = 1.
    let dilationHeight = 1;
    let dilationWidth = 1;

    // Effect filter size (includes dilation).
    let effectFilterHeight = dilationHeight * ( depthwiseFilterHeight - 1 ) + 1;
    let effectFilterWidth =  dilationWidth  * ( depthwiseFilterWidth  - 1 ) + 1;
    let effectFilterSize = effectFilterHeight * effectFilterWidth;

    // For accessing the input pixels around the filter.
    let effectFilterHeightOffset = Math.floor( ( effectFilterHeight - 1 ) / 2 );
    let effectFilterWidthOffset =  Math.floor( ( effectFilterWidth  - 1 ) / 2 );

    let imageOutHeight, imageOutWidth;
    let imageInBeginY, imageInBeginX;

    switch ( depthwisePad ) {
      case "valid": // When ( pad == "valid" ), the convolution will be ignored if the filter is partially outside input image.
        imageOutHeight = Math.floor( ( ( imageIn.height - effectFilterHeight) / stridesHeight ) + 1 );
        imageOutWidth =  Math.floor( ( ( imageIn.width  - effectFilterWidth ) / stridesWidth  ) + 1 );
        imageInBeginY = effectFilterHeightOffset; // So that negative ( inX, inY ) will never happen.
        imageInBeginX = effectFilterWidthOffset;
        break;

      case "same":
        imageOutHeight = imageIn.height;
        imageOutWidth = imageIn.width;
        imageInBeginY = imageInBeginX = 0; // So that negative ( inX, inY ) will happen, but they will be viewed as zero value.
        break;
    }

    tf.util.assert( ( ( depthwiseFiltersArray.length / ( depthwiseFilterHeight * depthwiseFilterWidth * channelMultiplier ) ) == imageIn.depth ),
      `${depthwiseName} filters shape `
        + `( ${depthwiseFiltersArray.length} / ( ${depthwiseFilterHeight} * ${depthwiseFilterWidth} * ${channelMultiplier} ) ) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    let imageOutLength = ( imageOutHeight * imageOutWidth * imageOutDepth * channelMultiplier );
    let imageOut = { height: imageOutHeight, width: imageOutWidth, depth: imageOutDepth, dataArray: new Float32Array( imageOutLength ) };

    if ( "Max" === depthwise_AvgMax_Or_ChannelMultiplier ) { // Max pooling
        imageOut.dataArray.fill( Number.NEGATIVE_INFINITY ); // So that any value is greater than initialized value.
    }

    // Depthwise Convolution
    for ( let outY = 0; outY < imageOutHeight; ++outY ) {
      let outIndexBaseX = ( outY * imageIn.width );
      let inYBase = imageInBeginY + ( outY * stridesHeight ) - effectFilterHeightOffset;

      for ( let outX = 0; outX < imageOutWidth; ++outX ) {
        let outIndexBaseC = ( ( outIndexBaseX + outX ) * imageOutDepth );
        let inXBase = imageInBeginX + ( outX * stridesWidth ) - effectFilterWidthOffset;

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
                    let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * imageOutDepth );
                    let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * channelMultiplier );

                    let filterIndex = filterIndexBaseSubC + outChannelSub;

                    switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
                      case "Avg": // Avg pooling
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ];
                        break;

                      case "Max": // Max pooling
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

            if ( "Avg" === depthwise_AvgMax_Or_ChannelMultiplier ) { // Avg pooling
              imageOut.dataArray[ i ] /= avgDivisor; // So that every sum is averaged.
            }
          }
        }
      }
    }

    // Bias
    TestCase.modifyByBias( imageOut, bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation
    TestCase.modifyByActivation( imageOut, depthwiseActivationId, parametersDesc );

    return imageOut;
/* For test in console only.

// Pass an array of values to create a vector.
let x = tf.tensor3d( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], [ 3, 3, 1 ] );
//let x = tf.tensor3d( [ 1, 2, 3, 4 ], [ 2, 2, 1 ] );
//x.print();

//let filter = tf.tensor4d( [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], [ 3, 3, 1, 1 ] );
let filter = tf.tensor4d( [ 1, 2, 3, 4 ], [ 2, 2, 1, 1 ] );
//filter.print();

let dilations = 2;
let strides = 1;
//let pad = "valid";
let pad = "same";
//let y = x.depthwiseConv2d( filter, strides, pad );
let y = x.pool( filter.shape, "avg", pad, dilations, strides );
y.print();
*/
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {number[]} biasesArray       The bias values.
   * @param {string}   biasName          A string for debug message of this bias.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return imageIn which may or may not be added bias (according to bBias).
   */
  static modifyByBias( imageIn, bBias, biasesArray, biasName, parametersDesc ) {

    tf.util.assert( ( biasesArray.length == imageIn.depth ),
      `${biasName} shape (${biasesArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    if ( !bBias )
      return imageIn;

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

    return imageIn;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {string}   nActivationId     The name string of this activation function.
   * @param {string}   parametersDesc A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return imageIn which may or may not be activated.
   */
  static modifyByActivation( imageIn, nActivationId, parametersDesc ) {

    let pfnActivation = PointDepthPoint.getActivationFunction( nActivationId );
    if ( !pfnActivation )
      return imageIn;

    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let inIndexBaseC  = ( ( indexBaseX + x ) * imageIn.depth );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          imageIn.dataArray[ inIndex ] = pfnActivation( imageIn.dataArray[ inIndex ] );
        }
      }
    }

    return imageIn;
  }

}
