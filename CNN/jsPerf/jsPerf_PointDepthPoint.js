export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test CNN PointDepthPoint.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/}
 */


/**
 *
 */
class TestCase {

  /**
   * @param {number[]} paramsInArray      parameters data which will be processed by PointDepthPoint.Params
   * @param {number[]} paramsOutArray     parameters data which should match the result of PointDepthPoint.Params
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
    imageIn, imageOutArray
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
      outArray: imageOutArray
    };

    // For testing not start at the offset 0.
    this.weightsElementOffsetBegin = 3; // Skip the un-used. (in element count)

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

      for ( let i = 0; i < weightsSourceArray.length; ++i ) {
        this.weightsFloat32Array.set( weightsSourceArray[ i ].weights, weightsSourceArray[ i ].offset );
      }
    }
  }

  /** According to this.weights.params.outArray and this.image.inArray, calculate this.image.outArray.
   */ 
  calcResult() {
    // Assume the paramsOutArray is correct. Unpack it into parameters.
    let [
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
      depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
      bAddInputToOutput
    ] = this.weights.params.outArray;

    // Create description for debug easily.
    this.params.description =
        `pointwise1ChannelCount=${pointwise1ChannelCount}, bPointwise1Bias=${bPointwise1Bias}, pointwise1ActivationName=${pointwise1ActivationName}, `
      + `depthwiseFilterHeight=${depthwiseFilterHeight}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseStridesPad=${depthwiseStridesPad}, `
      + `bDepthwiseBias=${bDepthwiseBias}, `
      + `depthwiseActivationName=${depthwiseActivationName}, `
      + `pointwise2ChannelCount=${pointwise2ChannelCount}, bPointwise2Bias=${bPointwise2Bias}, pointwise2ActivationName=${pointwise2ActivationName}, `
      + `bAddInputToOutput=${bAddInputToOutput}`
    ;

    let nextImageIn = this.image.in;

    // Pointwise1
    if ( pointwise1ChannelCount > 0 ) {
      nextImageIn = TestCase.calcPointwise(
        nextImageIn,
        pointwise1ChannelCount, this.weights.pointwise1Filters, bPointwise1Bias, this.weights.pointwise1Biases, pointwise1ActivationName,
        "Pointwise 1", this.params.description );
    }

    // Depthwise
    if ( 0 != depthwise_AvgMax_Or_ChannelMultiplier ) {
      nextImageIn = TestCase.calcDepthwise(
        nextImageIn,
        depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad,
        this.weights.depthwiseFilters, bDepthwiseBias, this.weights.depthwiseBiases, depthwiseActivationName,
        "Depthwise", this.params.description );
    }

    // Pointwise2
    if ( pointwise2ChannelCount > 0 ) {
      nextImageIn = TestCase.calcPointwise(
        nextImageIn,
        pointwise2ChannelCount, this.weights.pointwise2Filters, bPointwise2Bias, this.weights.pointwise2Biases, pointwise2ActivationName,
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
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationName,
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
    TestCase.modifyByActivation( imageOut, pointwiseActivationName, parametersDesc );

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
    depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationName,
    depthwiseName, parametersDesc ) {

    let depthwiseFilterWidth = depthwiseFilterHeight; // Assume filter's width equals height.

    let channelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if (   ( "Avg" === depthwise_AvgMax_Or_ChannelMultiplier )
        || ( "Max" === depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      channelMultiplier = 1;
    }

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
//!!! (2021/01/24 Remarked)
//            let inY = inYBase - 1; // "-1" for letting the first "++inY" equals inYBase.

            // For Avg pooling, the divisor is effect filter size which includes dilation but excludes input image outside.
            let avgDivisor = 0;

            FilterYLoop:
            for ( let filterY = 0, inY = inYBase; filterY < depthwiseFilterHeight; ++filterY ) {
              for ( let dilationFilterY = 0; dilationFilterY < dilationHeight; ++dilationFilterY, ++inY ) {
//!!! (2021/01/24 Remarked)
//                ++inY;
                if ( inY < 0 )
                  continue;          // Never access outside of input image. Continue to find out non-negative input image y position.
                else if ( inY >= imageIn.height )
                  break FilterYLoop; // Never access outside of input image. Break because it is impossible to find inside of input image.

                let inIndexBaseX = ( inY * imageIn.width );
                let filterIndexBaseX = ( filterY * depthwiseFilterWidth );

//!!! (2021/01/24 Remarked)
//                let inX = inXBase - 1; // "-1" for letting the first "++inX" equals inXBase.

                FilterXLoop:
                for ( let filterX = 0, inX = inXBase; filterX < depthwiseFilterWidth; ++filterX ) {
                  for ( let dilationFilterX = 0; dilationFilterX < dilationWidth; ++dilationFilterX, ++inX ) {
//!!! (2021/01/24 Remarked)
//                    ++inX;
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
    TestCase.modifyByActivation( imageOut, depthwiseActivationName, parametersDesc );

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
   * @param {string}   activationName The name string of this activation function.
   * @param {string}   parametersDesc A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return imageIn which may or may not be activated.
   */
  static modifyByActivation( imageIn, activationName, parametersDesc ) {

    let pfnActivation = PointDepthPoint.getActivationFunction( activationName );
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

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   */
  constructor( height, width, depth ) {

    this.disposeTensors();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;

    this.concatenatedShape = [ height, width, depth ];

//!!! ...unfinished...

    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    // depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
    // pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    // bAddInputToOutput,
    //

    let testImageData = {
      height: 3, width: 3, depth: 4,
      dataArray: [
        111, 112, 113, 114,  121, 122, 123, 124,  131, 132, 133, 134,
        211, 212, 213, 214,  221, 222, 223, 224,  231, 232, 233, 234,
        311, 312, 313, 314,  321, 322, 323, 324,  331, 332, 333, 334,
//        411, 412, 413, 414,  421, 422, 423, 424,  431, 432, 433, 434,
      ]
    };
    this.testCases = [
      new TestCase(
        [ 2.1,  1.1,   6.1, 3.1, 2.1, 3.1,  3.2,   6.2, 8,  5.3,   6.3,  7.4 ], // paramsInArray
        [   2, true, "cos",   3,   2,   0, true, "cos", 8, true, "cos", true ], // paramsOutArray

        // pointwise1FiltersArray
        // = [  450,  900,   490,  980,   530, 1060,
        //      850, 1610,   890, 1780,   930, 1860,
        //     1250, 2500,   ]
        [ 1, 1, 1, 1,  2, 2, 2, 2 ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        // depthwiseFiltersArray
        [],
        // depthwiseBiasesArray
        [],
        // pointwise2FiltersArray
        [],
        // pointwise2BiasesArray
        [],
        // imageIn
        testImageData,
        // imageOutArray
        [ ],
      ),
    ];


    this.weightsElementOffsetBegin = 3; // Skip the un-used. (in element count)
    this.weightsByteOffsetBegin = this.weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used. (in byte count)
    this.vocabularyCountPerInputChannel = 256;

    this.dataTensor3d = tf.tidy( () => {
      // Make-up the input data. They should between [ 0, this.vocabularyCountPerInputChannel ).
      let inputData = new Array( this.valueCount );
      for ( let i = 0; i < inputData.length; ++i ) {
        inputData[ i ] = Math.floor( Math.random() * this.vocabularyCountPerInputChannel );
      }

      let dataTensor1dInt32 = tf.tensor1d( inputData, "int32" ); // Embedding accepts integer input only.

      let dataTensor3d = dataTensor1dInt32.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let channelMultiplierEstimated = channelMultiplier;
    if ( channelMultiplierEstimated < 1 )
      channelMultiplierEstimated = 1;

    let wieghtsArrayLength = 
      this.weightsElementOffsetBegin // Skip the un-used.
        + ( depth * ( this.vocabularyCountPerInputChannel * channelMultiplierEstimated ) ) 
      ;

    this.weightsFloat32Array = new Float32Array( wieghtsArrayLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      for ( let i = this.weightsElementOffsetBegin; i < wieghtsArrayLength; ++i ) { // Make-up the embedding weight values.
        this.weightsFloat32Array[ i ] = ( i - this.weightsElementOffsetBegin );  // For debugging more easily.
//        this.weightsFloat32Array[ i ] = Math.random() * 10;
      }
    }
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      this.dataTensor3d.dispose();
      this.dataTensor3d = null;
    }

    this.pointDepthPoint_release();
  }

  /**
   * @return {PointDepthPoint.Base} The created pointDepthPoint object.
   */
  pointDepthPoint_create(
    inputFloat32Array, byteOffsetBegin,

    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    bAddInputToOutput,

    bKeepInputTensor
  ) {

    let pointDepthPoint = new PointDepthPoint.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let bInitOk = pointDepthPoint.init(
      progress, inputFloat32Array, byteOffsetBegin,

      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
      depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
      bAddInputToOutput,

      bKeepInputTensor
    );

    let parametersDescription = `( `
      + `pointwise1ChannelCount=${pointwise1ChannelCount}, bPointwise1Bias=${bPointwise1Bias}, pointwise1ActivationName=${pointwise1ActivationName} `
      + `depthwiseFilterHeight=${depthwiseFilterHeight}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseStridesPad=${depthwiseStridesPad}, `
      + `bDepthwiseBias=${bDepthwiseBias}, `
      + `depthwiseActivationName=${depthwiseActivationName}, `
      + `pointwise2ChannelCount=${pointwise2ChannelCount}, bPointwise2Bias=${bPointwise2Bias}, pointwise2ActivationName=${pointwise2ActivationName}, `
      + `bAddInputToOutput=${bAddInputToOutput}, `
      + `bKeepInputTensor=${bKeepInputTensor} `
      + `)`
    ;

    tf.util.assert( ( pointDepthPoint.isValid() == bInitOk ),
        `PointDepthPoint validation state (${pointDepthPoint.isValid()}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
        `Failed to initialize pointDepthPoint object.  ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
        `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.byteOffsetBegin == ),

    tf.util.assert( ( pointDepthPoint.byteOffsetEnd

    tf.util.assert( ( pointDepthPoint.inChannels

    tf.util.assert( ( pointDepthPoint.pointwise1ChannelCount
    tf.util.assert( ( pointDepthPoint.bPointwise1Bias
    tf.util.assert( ( pointDepthPoint.pointwise1ActivationName

    tf.util.assert( ( pointDepthPoint.depthwiseFilterHeight
    tf.util.assert( ( pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier
    tf.util.assert( ( pointDepthPoint.depthwiseStridesPad
    tf.util.assert( ( pointDepthPoint.bDepthwiseBias
    tf.util.assert( ( pointDepthPoint.depthwiseActivationName

    tf.util.assert( ( pointDepthPoint.pointwise2ChannelCount
    tf.util.assert( ( pointDepthPoint.bPointwise2Bias
    tf.util.assert( ( pointDepthPoint.pointwise2ActivationName

    tf.util.assert( ( pointDepthPoint.bAddInputToOutput

    tf.util.assert( ( pointDepthPoint.outChannels

    tf.util.assert( ( pointDepthPoint.bKeepInputTensor

    return pointDepthPoint;
  }

  pointDepthPoint_init() {
    this.pointDepthPoint_release();

//!!! ...unfinished...

    // Different pointDepthPoint objects.
    //
    // ( bEmbedVocabularyId, bKeepInputTensor, bSplitReshapeGatherConcat )
    this.pointDepthPoint_list = [
      this.pointDepthPoint_create( false, false, false ),
      this.embedding2d_create(  true, false, false ),

      // The embedding (vocabulary tabe tensor3d) for performance testing should:
      //   - ( bEmbedVocabularyId == false ). Otherwise, shortcut operation (i.e. return directly) will be used when ( channelMultiplier == 1 ).
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//      this.embedding2d_SplitGatherConcatReshape =
      this.embedding2d_AddGatherReshape =
      this.embedding2d_create( false,  true, false ),
      this.embedding2d_create(  true,  true, false ),


      this.embedding2d_create( false, false,  true ),
      this.embedding2d_create(  true, false,  true ),

      // The embedding (vocabulary tabe tensor2d) for performance testing should:
      //   - ( bEmbedVocabularyId == false ). Otherwise, shortcut operation (i.e. return directly) will be used when ( channelMultiplier == 1 ).
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
      this.embedding2d_SplitReshapeGatherConcat =
      this.embedding2d_create( false,  true,  true ),
      this.embedding2d_create(  true,  true,  true ),

    ];

  }

  pointDepthPoint_release() {
    if ( this.pointDepthPoint_list ) {
      for ( let i = 0; i < this.pointDepthPoint_list.length; ++i ) {
        let pointDepthPoint = this.pointDepthPoint_list[ i ];
        pointDepthPoint.disposeTensors();
      }
      this.pointDepthPoint_list = this.pointDepthPoint = null;
    }
  }

//!!! ...unfinished...
  /**
   * Check the Embedding2d's output by look up weights according to input.
   *
   * @param {Embedding2d.Base} embedding2d
   *   The object which implemets embedding logic.
   *
   * @param {tf.tensor3d} inputTensor3d
   *   The input of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be int32.
   *
   * @param {tf.tensor3d} outputTensor3d
   *   The output of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be float32.
   */
  check_Input_Output_WeightsTable( embedding2d, inputTensor3d, outputTensor3d ) {
    tf.tidy( () => {

      let channelMultiplier_forExtract; // How many channels (of per input channel) are extracted from table raw data.
      if ( embedding2d.bEmbedVocabularyId )
        channelMultiplier_forExtract = embedding2d.channelMultiplier - 1; // less one because the channel will be auto-generated vocabulary id.
      else
        channelMultiplier_forExtract = embedding2d.channelMultiplier;

      let inputRowArray = inputTensor3d.arraySync();
      let outputRowArray = outputTensor3d.arraySync();

      tf.util.assert( outputRowArray.length == inputRowArray.length,
          `Row count of embedding output and input should be the same. ( ${outputRowArray.length} != ${inputRowArray.length} )`);

      // The float32 count of an embedding vocabulary table of one input channel.
      let float32CountPerTable = channelMultiplier_forExtract * this.vocabularyCountPerInputChannel;

      // Height
      for ( let y = 0; y < inputRowArray.length; ++y ) {
        let inputColumnArray = inputRowArray[ y ];
        let outputColumnArray = outputRowArray[ y ];

        tf.util.assert( outputColumnArray.length == inputColumnArray.length,
          `Column count of embedding output and input should be the same. ( ${outputColumnArray.length} != ${inputColumnArray.length} )`);

        // Width
        for ( let x = 0; x < inputColumnArray.length; ++x ) {
          let inputChannelArray = inputColumnArray[ x ];
          let outputChannelArray = outputColumnArray[ x ];

          tf.util.assert( outputChannelArray.length == ( inputChannelArray.length * embedding2d.channelMultiplier ),
            `Channel count of embedding output and input should match. `
              + `( ${outputChannelArray.length} != ( ${inputChannelArray.length} * ${embedding2d.channelMultiplier} ) )`);

          // Input Channel
          for ( let inputChannelIndex = 0; inputChannelIndex < inputChannelArray.length; ++inputChannelIndex ) {
            let inputChannelValue = inputChannelArray[ inputChannelIndex ]; // Int32

            // The embedding vocabulary table beginning of the input channel.
            let vocabularyTableOffset = ( inputChannelIndex * float32CountPerTable );

            // The embedding vocabulary element beginning of the vocabulary table.
            let vocabularyTableElementOffset = ( inputChannelValue * channelMultiplier_forExtract );

            // The embedding vocabulary element channel beginning of the vocabulary element.
            let vocabularyTableElementChannelOffsetBase = ( this.weightsElementOffsetBegin + vocabularyTableOffset + vocabularyTableElementOffset );

            // Output Channel
            for ( let outputChannelIndexOffset = 0; outputChannelIndexOffset < embedding2d.channelMultiplier; ++outputChannelIndexOffset ) {
              let outputChannelIndexBase = ( inputChannelIndex * embedding2d.channelMultiplier );
              let outputChannelIndex = outputChannelIndexBase + outputChannelIndexOffset;
              let outputChannelValueFromOutput = outputChannelArray[ outputChannelIndex ]; // Float32

              if ( ( embedding2d.bEmbedVocabularyId ) && ( outputChannelIndexOffset == 0 ) ) {
                // When ( bEmbedVocabularyId == true ), every embedding2d.channelMultiplier output channel should be auto-generated
                // vocabulary id (i.e. should be the same as the input channel value).
                tf.util.assert( outputChannelValueFromOutput == inputChannelValue,
                  `Channel value of output should be vocabulary id. `
                    + `( ${outputChannelValueFromOutput} != ${inputChannelValue} )`);

              } else {
                let lookUpAtElementOffset = vocabularyTableElementChannelOffsetBase + outputChannelIndexOffset;

                // When ( bEmbedVocabularyId == true ), every embedding2d.channelMultiplier output channel is auto-generated vocabulary
                // id. So the table offset should count start from 1 (not 0) (i.e. ignore ( outputChannelIndexOffset == 0 ) ).
                if ( embedding2d.bEmbedVocabularyId ) {
                  lookUpAtElementOffset -= 1;
                }

                let outputChannelValueFromTable = this.weightsFloat32Array[ lookUpAtElementOffset ]; // Float32

                tf.util.assert( outputChannelValueFromOutput == outputChannelValueFromTable,
                  `Channel value of output and table should match. `
                    + `( ${outputChannelValueFromOutput} != ${outputChannelValueFromTable} ) `
                    + `at ( y, x, inputChannelIndex, outputChannelIndexOffset ) = (${y}, ${x}, ${inputChannelIndex}, ${outputChannelIndexOffset}) `
                    + `( channelMultiplier = ${embedding2d.channelMultiplier} )`
                );
              }

            }
          }
        }
      }
    });

  }

  // Test apply by add-gather-reshape (i.e. vocabulary table is one merged longer tensor2d).
  test_AddGatherReshape() {
    let outputTensor3d = this.embedding2d_AddGatherReshape.apply_and_destroy_or_keep( this.dataTensor3d );
    outputTensor3d.dispose();
  }

  // Test apply by split-reshape-gather-concat (i.e. vocabulary table is tensor2d).
  test_SplitReshapeGatherConcat() {
//!!! (2021/01/06 Temp) for testing performance without Add.
//    let outputTensor3d = this.embedding2d_AddGatherReshape.temp_apply_and_destroy_or_keep_GatherReshape( this.dataTensor3d );
    let outputTensor3d = this.embedding2d_SplitReshapeGatherConcat.apply_and_destroy_or_keep( this.dataTensor3d );
    outputTensor3d.dispose();
  }

//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//   // Test apply by split-gather-concat-reshape (i.e. vocabulary table is tensor3d).
//   test_SplitGatherConcatReshape() {
//     let outputTensor3d = this.embedding2d_SplitGatherConcatReshape.apply_and_destroy_or_keep( this.dataTensor3d );
//     outputTensor3d.dispose();
//   }

  // Testing whether the results of different implementation are the same.
  testCorrectness() {
    tf.tidy( () => { // Test memory leakage of embedding2d.
      let memoryInfoPre = tf.memory();
      this.embedding2d_init();
      this.embedding2d_release();
      let memoryInfo = tf.memory();
      tf.util.assert( memoryInfoPre.numTensors == memoryInfo.numTensors, `Embedding2d init/release memory leak.`);
    });

    this.embedding2d_init();  // (Should outside tidy() for preventing from tensors being disposed.

    tf.tidy( () => {
      for ( let i = 0; i < this.embedding2d_list.length; ++i ) {
        let embedding2d = this.embedding2d_list[ i ];

        let memoryInfo0 = tf.memory();

        let inputTensor3d;
        if ( embedding2d.bKeepInputTensor ) {
          inputTensor3d = this.dataTensor3d;
        } else {
          inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
        }

        // Test memory leak of embedding apply.
        let outputTensor3d = embedding2d.apply_and_destroy_or_keep( inputTensor3d );
        let memoryInfo1 = tf.memory();
        tf.util.assert( memoryInfo1.numTensors == ( memoryInfo0.numTensors + 1 ), `Embedding2d.apply_and_destroy_or_keep() memory leak.`);

        // Test correctness of embedding apply.
        this.check_Input_Output_WeightsTable( embedding2d, this.dataTensor3d, outputTensor3d );

        outputTensor3d.dispose();
      }

//!!!
//       tf.util.assert(
//         TensorTools.Comparator.isTensorArrayEqual( t1Array, t2Array ),
//         `ConcatReshapeTransposeReshapeSplit() != ConcatGatherUnsorted()`);
    });
  }

//   testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit() {
//     let functionTable = [
//     ];
//     this.testDifferentDisposeStrategy( functionTable, this.shuffleInfo );
//   }

   testDifferentDisposeStrategy_All() {
//     this.testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit();
   }

//   testDifferentDisposeStrategy( functionTable, thisArg ) {
//     tf.tidy( () => {
//       let funcPrev;
//       let tArrayPrev;
//
//       for ( let i = 0; i < functionTable.length; ++i ) {
//         let func = functionTable[ i ];
//
//         let memoryInfoPrev = tf.memory();
//         let tArray = func.call( thisArg, this.dataTensor3dArray );
//         let memoryInfo = tf.memory();
//
//         tf.util.assert( memoryInfo.numTensors == ( memoryInfoPrev.numTensors + tArray.length ), `${func.name}() memory leak`);
//
//         if ( tArrayPrev ) {
//           tf.util.assert(
//             TensorTools.Comparator.isTensorArrayEqual( tArrayPrev, tArray ),
//             `${funcPrev.name}() != ${func.name}()`);
//         }
//
//         tf.dispose( tArrayPrev );
//
//         funcPrev = func;
//         tArrayPrev = tArray;
//       }
//     });
//   }

}

function init() {
  disposeTensors();

  // (cm = channel multiplier)

  let depth = 8; //24;
  globalThis.testSet_110x120x8_cm32 = new HeightWidthDepth( 110, 120, depth, 32 ); // height, width, depth, channelMultiplier
  globalThis.testSet_110x120x8_cm16 = new HeightWidthDepth( 110, 120, depth, 16 );
  globalThis.testSet_110x120x8_cm8 = new HeightWidthDepth( 110, 120, depth, 8 );
  globalThis.testSet_110x120x8_cm4 = new HeightWidthDepth( 110, 120, depth, 4 );
  globalThis.testSet_110x120x8_cm3 = new HeightWidthDepth( 110, 120, depth, 3 );
  globalThis.testSet_110x120x8_cm2 = new HeightWidthDepth( 110, 120, depth, 2 );
  globalThis.testSet_110x120x8_cm1 = new HeightWidthDepth( 110, 120, depth, 1 );
  globalThis.testSet_110x120x8_cm0 = new HeightWidthDepth( 110, 120, depth, 0 );
  globalThis.testSet_110x120x8_cmNegative = new HeightWidthDepth( 110, 120, depth, -1 );

  globalThis.testSet_110x120x8_All = [
    globalThis.testSet_110x120x8_cm32,
    globalThis.testSet_110x120x8_cm16,
    globalThis.testSet_110x120x8_cm8,
    globalThis.testSet_110x120x8_cm4,
    globalThis.testSet_110x120x8_cm3,
    globalThis.testSet_110x120x8_cm2,
    globalThis.testSet_110x120x8_cm1,
    globalThis.testSet_110x120x8_cm0,
    globalThis.testSet_110x120x8_cmNegative
  ];
}

function testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x8_All[ i ];
    testSet.testCorrectness();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x8_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeTensors() {
  if ( globalThis.testSet_110x120x8_All ) {
    for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
      let testSet = globalThis.testSet_110x120x8_All[ i ];
      if ( testSet )
        testSet.disposeTensors();
    }

    globalThis.testSet_110x120x8_All = null;
  }

  globalThis.testSet_110x120x8_cm32
    = globalThis.testSet_110x120x8_cm16
    = globalThis.testSet_110x120x8_cm8
    = globalThis.testSet_110x120x8_cm4
    = globalThis.testSet_110x120x8_cm3
    = globalThis.testSet_110x120x8_cm2
    = globalThis.testSet_110x120x8_cm1
    = globalThis.testSet_110x120x8_cm0
    = globalThis.testSet_110x120x8_cmNegative
    = null;
}
