export { Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js"; 

/**
 * Reference computation of class PointDepthPoint.Base.
 */
class Base {

  /**
   * @param {PointDepthPoint_TestParams.TestParams} testParams
   *   The test parameters. It is the value of PointDepthPoint_TestParams.Base.ParamsGenerator()'s result.
   */
  constructor( testParams ) {
    this.testParams = testParams;
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {object[]} imageInArray
   *   The image to be tested.
   *
   * @param {number}   imageInArray[ i ].height    Image height
   * @param {number}   imageInArray[ i ].width     Image width
   * @param {number}   imageInArray[ i ].depth     Image channel count
   * @param {number[]} imageInArray[ i ].dataArray Image data
   *
   * @param {tf.tensor3d[]} imageInTensor3dArray
   *   The tensor3d created from imageInArray.
   */
  testCorrectness( imageInArray, imageInTensor3dArray ) {

    try {

      for ( let nKeepInputTensor = 0; nKeepInputTensor < 2; ++nKeepInputTensor ) {
        let bKeepInputTensor = ( nKeepInputTensor != 0 );

        try {
          tf.tidy( () => {

            let inputTensorDestroyCount; // How many input tensors will be destroyed by PointDepthPoint.apply().

            let outputTensor3dArray = [];
            let inputTensor3dArray = new Array( 2 );
            if ( bKeepInputTensor ) {
              inputTensor3dArray[ 0 ] = imageInTensor3dArray[ 0 ];

              if ( this.testParams.out.inputTensorCount > 1 ) { // Pass two input tensors according to parameters.
                inputTensor3dArray[ 1 ] = imageInTensor3dArray[ 1 ];
              }

              inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

            } else {
              inputTensor3dArray[ 0 ] = imageInTensor3dArray[ 0 ].clone(); // Otherwise, this.dataTensor3d will be destroyed. 
              inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.

              if ( this.testParams.out.inputTensorCount > 1 ) { // Pass two input tensors according to parameters.
                inputTensor3dArray[ 1 ] = imageInTensor3dArray[ 1 ].clone();
                inputTensorDestroyCount = 2; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
              }
            }

            let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.
            let pointDepthPoint = this.pointDepthPoint_create( bKeepInputTensor );

            // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
            // tensor count (i.e. inputTensorDestroyCount).
            let tensorNumDifference_apply_before_after = pointDepthPoint.outputTensorCount - inputTensorDestroyCount;

            let memoryInfo_apply_before = tf.memory(); // Test memory leakage of pointDepthPoint apply.
            pointDepthPoint.apply_and_destroy_or_keep( inputTensor3dArray, outputTensor3dArray );
            let memoryInfo_apply_after = tf.memory();

            let parametersDescription = pointDepthPoint.parametersDescription;

            tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
              `PointDepthPoint.apply_and_destroy_or_keep() memory leak. `
                + `result tensor count (${memoryInfo_apply_after.numTensors}) `
                + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
                + `${parametersDescription}` );

            // Test correctness of pointDepthPoint apply.
            this.check_Input_Output_WeightsTable( imageInArray, imageInTensor3dArray, outputTensor3dArray, parametersDescription );

            pointDepthPoint.disposeTensors();
            let memoryInfo_afterDispose = tf.memory();

            tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
              `PointDepthPoint create/dispose memory leak. `
                + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
                + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
                + `${parametersDescription}` );

            tf.dispose( outputTensor3dArray );
          });
        } catch ( e ) {
          console.log( `bKeepInputTensor=${bKeepInputTensor}` );
          throw e;
        }
      }
    } catch ( e ) {
      let backendName = tf.getBackend();
      console.log( `backendName=${backendName}, PointDepthPoint this.testParams.id = ${this.testParams.id}` );
      throw e;
    }

  }


  /**
   * Check the PointDepthPoint's output according to input (for correctness testing).
   *
   * @param {object[]} imageInArray
   *   The image to be tested.
   *
   * @param {number}   imageInArray[ i ].height    Image height
   * @param {number}   imageInArray[ i ].width     Image width
   * @param {number}   imageInArray[ i ].depth     Image channel count
   * @param {number[]} imageInArray[ i ].dataArray Image data
   *
   * @param {tf.tensor3d[]} inputTensors
   *   The input array of the PointDepthPoint's apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d[]} outputTensors
   *   The output array of the PointDepthPoint's apply_and_destroy_or_keep().
   */
  check_Input_Output_WeightsTable( imageInArray, inputTensors, outputTensors, parametersDescription ) {
    tf.tidy( () => {

//!!! (2021/07/05 Remarked)
//       let fractionDigits = 2;
//       let fractionDigitsMultiplier = Math.pow( 10, fractionDigits );
      let acceptableDifference = 0.001;

      let strNote = `( this.testParams.id=${this.testParams.id}, ${parametersDescription} )`;

      tf.util.assert( imageInArray.length == 2,
        `PointDepthPoint imageInArray.length ( ${imageInArray.length} ) should be 2. ${strNote}`);

      tf.util.assert( inputTensors.length == 2,
        `PointDepthPoint inputTensors.length ( ${inputTensors.length} ) should be 2. ${strNote}`);

      tf.util.assert( outputTensors.length == 2,
        `PointDepthPoint outputTensors.length ( ${outputTensors.length} ) should be 2. ${strNote}`);

      let imageOutRefs = this.calcResult( imageInArray ); // Output is an array with two elements.

      tf.util.assert( imageOutRefs.length == 2,
        `PointDepthPoint imageOutRefs.length ( ${imageOutRefs.length} ) should be 2. ${strNote}`);

      for ( let i = 0; i < imageOutRefs.length; ++i ) {
        // Get referenced result (as number array).
        let imageOutRef = imageOutRefs[ i ];
        let outputArrayRef = null;
        if ( imageOutRef ) {
          outputArrayRef = imageOutRef.dataArray;
        }

        // Get real (tested target) result (as typed-array).
        let outputTensor = outputTensors[ i ];
        let outputArray = null;
        if ( outputTensor ) {
          outputArray = outputTensor.dataSync();
        }

        // Checking real result against referneced result.
        tf.util.assert( ( outputArray == null ) == ( outputArrayRef == null ),
          `PointDepthPoint output${i} ( ${outputArray} ) and outputRef${i} ( ${outputArrayRef} ) should be both null or non-null. ${strNote}`);

        if( outputArray ) {
          tf.util.assert( outputArray.length == outputArrayRef.length,
            `PointDepthPoint output${i} length ( ${outputArray.length} ) should be ( ${outputArrayRef.length} ). ${strNote}`);

//!!! (2021/07/05 Remarked) floating-point accumulated error. (especially activation function is SIGMOID, TANH, SIN, COS.)
//           tf.util.assert( outputArray.every( ( value, index ) => value === outputArrayRef[ index ] ),
//             `PointDepthPoint output${i} ( ${outputArray} ) should be ( ${outputArrayRef} ). ${strNote}`);

          // Because floating-point accumulated error of float32 (GPU) and float64 (CPU) is different (especially activation function
          // is one of SIGMOID, TANH, SIN, COS), only some digits after decimal are compared. Otherwise, they may not pass this test.
          let elementIndex;
          tf.util.assert( outputArray.every( ( value, index ) =>
            Math.abs( value - outputArrayRef[ elementIndex = index ] ) <= acceptableDifference,
            `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
              +`( ${outputArray} ) should be ( ${outputArrayRef} ). ${strNote}` );

//!!! (2021/07/05 Remarked)
//           let elementIndex;
//           tf.util.assert( outputArray.every( ( value, index ) =>
//             Math.round( value * fractionDigitsMultiplier ) === Math.round( outputArrayRef[ elementIndex = index ] * fractionDigitsMultiplier ) ),
//             `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
//               +`( ${outputArray} ) should be ( ${outputArrayRef} ). ${strNote}` );

        }
      }

    });
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
    let testParams = this.testParams;
    let bInitOk = pointDepthPoint.init(
      progress,
      testParams.in.channelCount1_pointwise1Before, // (i.e. inChannels1)
      testParams.in.channelCount2_pointwise1Before, // (i.e. inChannels2)
      bKeepInputTensor,

      new PointDepthPoint.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
        testParams.in.pointwise1ChannelCount, testParams.in.bPointwise1Bias, testParams.in.pointwise1ActivationId,

        testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight,
        testParams.in.depthwiseStridesPad, testParams.in.bDepthwiseBias, testParams.in.depthwiseActivationId,

        testParams.in.pointwise21ChannelCount, testParams.in.bPointwise21Bias, testParams.in.pointwise21ActivationId,
        testParams.in.pointwise22ChannelCount, testParams.in.bPointwise22Bias, testParams.in.pointwise22ActivationId,
        testParams.in.inputTensorCount
      )

    );

    let bAddInputToOutput = ( 0 == testParams.out.inputTensorCount );

    let parametersDescription = `( ${pointDepthPoint.parametersDescription} )`;

    tf.util.assert( ( pointDepthPoint.isValid() == bInitOk ),
      `PointDepthPoint validation state (${pointDepthPoint.isValid()}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize pointDepthPoint object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);


    Base.AssertTwoEqualValues( "parsing beginning position",
      pointDepthPoint.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      pointDepthPoint.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // input tensor parameters.
    Base.AssertTwoEqualValues( "inChannels", pointDepthPoint.inChannels, testParams.in.channelCount_pointwise1Before, parametersDescription );
    Base.AssertTwoEqualValues( "inputTensorCount", pointDepthPoint.inputTensorCount, testParams.out.inputTensorCount, parametersDescription );
    Base.AssertTwoEqualValues( "bAddInputToOutput", pointDepthPoint.bAddInputToOutput, bAddInputToOutput, parametersDescription );
    Base.AssertTwoEqualValues( "bKeepInputTensor", pointDepthPoint.bKeepInputTensor, bKeepInputTensor, parametersDescription );

    // pointwise1 parameters.
    Base.AssertTwoEqualValues( "pointwise1ChannelCount",
      pointDepthPoint.pointwise1ChannelCount, testParams.out.pointwise1ChannelCount, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise1Bias",
      pointDepthPoint.bPointwise1Bias, testParams.out.bPointwise1Bias, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise1ActivationId",
      pointDepthPoint.pointwise1ActivationId, testParams.out.pointwise1ActivationId, parametersDescription );

    let pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise1ActivationId );
    Base.AssertTwoEqualValues( "pointwise1ActivationName",
      pointDepthPoint.pointwise1ActivationName, pointwise1ActivationName, parametersDescription );

    // depthwise parameters.
    Base.AssertTwoEqualValues( "depthwise_AvgMax_Or_ChannelMultiplier",
      pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseFilterHeight",
      pointDepthPoint.depthwiseFilterHeight, testParams.out.depthwiseFilterHeight, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseStridesPad",
      pointDepthPoint.depthwiseStridesPad, testParams.out.depthwiseStridesPad, parametersDescription );

    Base.AssertTwoEqualValues( "bDepthwiseBias",
      pointDepthPoint.bDepthwiseBias, testParams.out.bDepthwiseBias, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseActivationId",
      pointDepthPoint.depthwiseActivationId, testParams.out.depthwiseActivationId, parametersDescription );

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.depthwiseActivationId );
    Base.AssertTwoEqualValues( "depthwiseActivationName",
      pointDepthPoint.depthwiseActivationName, depthwiseActivationName, parametersDescription );

    // pointwise21 parameters.
    Base.AssertTwoEqualValues( "pointwise21ChannelCount",
      pointDepthPoint.pointwise21ChannelCount, testParams.out.pointwise21ChannelCount, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise21Bias",
      pointDepthPoint.bPointwise21Bias, testParams.out.bPointwise21Bias, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise21ActivationId",
      pointDepthPoint.pointwise21ActivationId, testParams.out.pointwise21ActivationId, parametersDescription );

    let pointwise21ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise21ActivationId );
    Base.AssertTwoEqualValues( "pointwise21ActivationName",
      pointDepthPoint.pointwise21ActivationName, pointwise21ActivationName, parametersDescription );

    // pointwise22 parameters.
    Base.AssertTwoEqualValues( "pointwise22ChannelCount",
      pointDepthPoint.pointwise22ChannelCount, testParams.out.pointwise22ChannelCount, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise22Bias",
      pointDepthPoint.bPointwise22Bias, testParams.out.bPointwise22Bias, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise22ActivationId",
      pointDepthPoint.pointwise22ActivationId, testParams.out.pointwise22ActivationId, parametersDescription );

    let pointwise22ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise22ActivationId );
    Base.AssertTwoEqualValues( "pointwise22ActivationName",
      pointDepthPoint.pointwise22ActivationName, pointwise22ActivationName, parametersDescription );

    // Other parameters.

//!!! ...unfinished...
//     tf.util.assert( ( pointDepthPoint.outChannels == outChannels ),
//       `PointDepthPoint outChannels (${pointDepthPoint.outChannels}) should be (${outChannels}). ${parametersDescription}`);

    return pointDepthPoint;
  }


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `PointDepthPoint ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

  /** According to imageInArray and this.testParams.in.weights, calculate imageOutArray.
   *
   * @param {number}   imageInArray[ i ].height    Image height
   * @param {number}   imageInArray[ i ].width     Image width
   * @param {number}   imageInArray[ i ].depth     Image channel count
   * @param {number[]} imageInArray[ i ].dataArray Image data
   *
   * @return {number[]} Return output image data as array.
   */ 
  calcResult( imageInArray ) {

    let testParams = this.testParams;
    let bAddInputToOutput = ( 0 == testParams.out.inputTensorCount );

    // Create description for debug easily.
    this.paramsOutDescription =
        `pointwise1ChannelCount=${testParams.out.pointwise1ChannelCount}, bPointwise1Bias=${testParams.out.bPointwise1Bias}, `// pointwise1ActivationName=${pointwise1ActivationName}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${testParams.out.depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${testParams.out.depthwiseStridesPad}, `
      + `bDepthwiseBias=${testParams.out.bDepthwiseBias}, `
//      + `depthwiseActivationName=${depthwiseActivationName}, `
      + `pointwise21ChannelCount=${testParams.out.pointwise21ChannelCount}, bPointwise21Bias=${testParams.out.bPointwise21Bias}, `//pointwise21ActivationName=${pointwise21ActivationName}, `
      + `pointwise22ChannelCount=${testParams.out.pointwise22ChannelCount}, bPointwise22Bias=${testParams.out.bPointwise22Bias}, `//pointwise22ActivationName=${pointwise22ActivationName}, `
      + `inputTensorCount=${testParams.out.inputTensorCount} `
      + `bAddInputToOutput=${bAddInputToOutput}`
    ;

    let nextImageIn = imageInArray[ 0 ];

    // 1. Pointwise1
    if ( testParams.out.pointwise1ChannelCount > 0 ) {
      nextImageIn = Base.calcPointwise(
        nextImageIn,
        testParams.out.pointwise1ChannelCount,
        testParams.in.weights.pointwise1Filters, testParams.out.bPointwise1Bias,
        testParams.in.weights.pointwise1Biases, testParams.out.pointwise1ActivationId,
        "Pointwise1", this.paramsOutDescription );
    }

    // 2. Depthwise
    if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      nextImageIn = Base.calcDepthwise(
        nextImageIn,
        testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwiseFilterHeight, testParams.out.depthwiseStridesPad,
        testParams.in.weights.depthwiseFilters, testParams.out.bDepthwiseBias,
        testParams.in.weights.depthwiseBiases, testParams.out.depthwiseActivationId,
        "Depthwise", this.paramsOutDescription );
    }

    // 3. Concat (along image depth)
    if ( testParams.out.inputTensorCount > 1 ) {
      nextImageIn = Base.calcConcatAlongAxisId2( nextImageIn, imageInArray[ 1 ], "ConcatAlongDepth", this.paramsOutDescription );
    }

    // 4. Pointwise2
    let pointwise21Result, pointwise22Result;
    if ( ( testParams.out.pointwise21ChannelCount == 0 ) && ( testParams.out.pointwise22ChannelCount == 0 ) ) {

      // 4.0 No Pointwise21 and No Pointwise22.

      // Residual Connection.
      pointwise21Result = Base.modifyByInput(
        nextImageIn, bAddInputToOutput, imageInArray[ 0 ], "ImageOut1", this.paramsOutDescription );

    } else {

      // 4.1 Pointwise21
      if ( testParams.out.pointwise21ChannelCount > 0 ) {
        pointwise21Result = Base.calcPointwise(
          nextImageIn,
          testParams.out.pointwise21ChannelCount,
          testParams.in.weights.pointwise21Filters, testParams.out.bPointwise21Bias,
          testParams.in.weights.pointwise21Biases, testParams.out.pointwise21ActivationId,
          "Pointwise21", this.paramsOutDescription );

        // Residual Connection.
        pointwise21Result = Base.modifyByInput(
          pointwise21Result, bAddInputToOutput, imageInArray[ 0 ], "ImageOut1", this.paramsOutDescription );
      }

      // 4.2 Pointwise22
      if ( testParams.out.pointwise22ChannelCount > 0 ) {
        pointwise22Result = Base.calcPointwise(
          nextImageIn,
          testParams.out.pointwise22ChannelCount,
          testParams.in.weights.pointwise22Filters, testParams.out.bPointwise22Bias,
          testParams.in.weights.pointwise22Biases, testParams.out.pointwise22ActivationId,
          "Pointwise22", this.paramsOutDescription );

        // Residual Connection.
        //
        // Always using input image1 (i.e. imageInArray[ 0 ]). In fact, only if ( inputTensorCount <= 1 ), the residual connection is possible.
        pointwise22Result = Base.modifyByInput(
          pointwise22Result, bAddInputToOutput, imageInArray[ 0 ], "ImageOut2", this.paramsOutDescription );
      }

    }

    // 4.3 Integrate pointwise21 and pointwise22 into pointwise2.
    let nextImageOutArray;
    if ( pointwise21Result ) {
      if ( pointwise22Result ) {
        nextImageOutArray = [ pointwise21Result, pointwise22Result ];
      } else {
        nextImageOutArray = [ pointwise21Result, null ];
      }
    } else {
      if ( pointwise22Result ) {
//!!! (2021/07/05 Remarked)
//        nextImageOutArray = [ pointwise22Result, null ];
        nextImageOutArray = [ null, pointwise22Result ];
      } else {
        nextImageOutArray = [ null, null ];
      }
    }

    return nextImageOutArray;
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
    let imageOut = { height: imageIn.height, width: imageIn.width, depth: pointwiseChannelCount, dataArray: new Float32Array( imageOutLength ) };

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
    Base.modifyByBias( imageOut, bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Activation
    Base.modifyByActivation( imageOut, pointwiseActivationId, parametersDesc );

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

    if ( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE === depthwise_AvgMax_Or_ChannelMultiplier )
      return imageIn; // No depthwise operation.

//!!! ...unfinished... (2021/03/17) What about ( depthwiseFilterHeight <= 0 )?
      
    let channelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if (   ( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier )
        || ( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) ) {
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

    let padHeight = 0, padHeightTop = 0, padHeightBottom = 0, padWidth = 0, padWidthLeft = 0, padWidthRight = 0;
    let imageInBeginY = 0, imageInBeginX = 0; // So that negative ( inX, inY ) will never happen. for ( pad == "valid" ).

    // Determine padding number around the input image height and width.
    if ( depthwisePad == "same" ) {
      padHeight = effectFilterHeight - 1; // So that the output height will be the same as input height.
      let padHeightHalf = padHeight / 2;
      padHeightTop    = Math.ceil(  padHeightHalf );
      padHeightBottom = Math.floor( padHeightHalf );

      padWidth = effectFilterWidth - 1;  // So that the output width will be the same as input width.
      let padWidthHalf = padWidth / 2;
      padWidthLeft    = Math.ceil(  padWidthHalf );
      padWidthRight   = Math.floor( padWidthHalf );

      imageInBeginY = - padHeightTop; // So that negative ( inX, inY ) may happen, but they will be viewed as zero value. for ( pad == "same" ).
      imageInBeginX = - padWidthLeft;
    }

    let imageOutHeight = Math.floor( ( ( imageIn.height + padHeight - effectFilterHeight) / stridesHeight ) + 1 );
    let imageOutWidth =  Math.floor( ( ( imageIn.width  + padWidth  - effectFilterWidth ) / stridesWidth  ) + 1 );

    // If not AVG, MAX, NONE, the filters shape should match input image channel count.
    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      tf.util.assert( ( ( depthwiseFiltersArray.length / ( depthwiseFilterHeight * depthwiseFilterWidth * channelMultiplier ) ) == imageIn.depth ),
        `${depthwiseName} filters shape `
          + `( ${depthwiseFiltersArray.length} / ( ${depthwiseFilterHeight} * ${depthwiseFilterWidth} * ${channelMultiplier} ) ) `
          + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);
    }

    let imageOutLength = ( imageOutHeight * imageOutWidth * imageOutDepth );
    let imageOut = { height: imageOutHeight, width: imageOutWidth, depth: imageOutDepth, dataArray: new Float32Array( imageOutLength ) };

    // Max pooling
    if ( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) {
        imageOut.dataArray.fill( Number.NEGATIVE_INFINITY ); // So that any value is greater than initialized value.
    }

    // Depthwise Convolution
    for ( let outY = 0; outY < imageOutHeight; ++outY ) {
      let outIndexBaseX = ( outY * imageOutWidth );
      let inYBase = imageInBeginY + ( outY * stridesHeight );

      for ( let outX = 0; outX < imageOutWidth; ++outX ) {
        let outIndexBaseC = ( ( outIndexBaseX + outX ) * imageOutDepth );
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
                    let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * imageOutDepth );
                    let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * channelMultiplier );

                    let filterIndex = filterIndexBaseSubC + outChannelSub;

                    switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
                      case PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG: // Avg pooling
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ];
                        break;

                      case PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX: // Max pooling
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
            if ( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier ) {
              imageOut.dataArray[ outIndex ] /= avgDivisor; // So that every sum is averaged.
            }
          }
        }
      }
    }

    // Bias
    Base.modifyByBias( imageOut, bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation
    Base.modifyByActivation( imageOut, depthwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * @param {number}   imageIn1.height    Image1 height
   * @param {number}   imageIn1.width     Image1 width
   * @param {number}   imageIn1.depth     Image1 channel count
   * @param {number[]} imageIn1.dataArray Image1 data
   * @param {number}   imageIn2.height    Image2 height
   * @param {number}   imageIn2.width     Image2 width
   * @param {number}   imageIn2.depth     Image2 channel count
   * @param {number[]} imageIn2.dataArray Image2 data
   * @param {string}   concatName        A string for debug message of this concatenation.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {object}
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
    let imageOut = {
      height: imageIn1.height, width: imageIn1.width, depth: ( imageIn1.depth + imageIn2.depth ), dataArray: new Float32Array( imageOutLength ) };

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

    return imageOut;
  }

  /**
   * @param {number}   imageOut.height      Output image height
   * @param {number}   imageOut.width       Output image width
   * @param {number}   imageOut.depth       Output image channel count
   * @param {number[]} imageOut.dataArray   Output image data
   * @param {boolean}  bAddInputToOutput    Whether add input to output.
   * @param {number}   imageIn.height       Input image height
   * @param {number}   imageIn.width        Input image width
   * @param {number}   imageIn.depth        Input image channel count
   * @param {number[]} imageIn.dataArray    Input image data
   * @param {string}   addInputToOutputName A string for debug message of this bias.
   * @param {string}   parametersDesc       A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return imageOut. If no additive, it will be the original imageOut. If additive, the imageOut.dataArray will be replaced with
   * new data. Return null, if ( imageOut == null ).
   */
  static modifyByInput( imageOut, bAddInputToOutput, imageIn, addInputToOutputName, parametersDesc ) {

    if ( !imageOut )
      return null;

    if ( !bAddInputToOutput )
      return imageOut;

    // If the output dimensions ( height, width, depth ) is not the same as input, it is impossible to add-input-to-output.
    if ( ( imageIn.height != imageOut.height ) || ( imageIn.width != imageOut.width ) || ( imageIn.depth != imageOut.depth ) )
      return imageOut;

    tf.util.assert( ( imageIn.height == imageOut.height ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.height ( ${imageIn.height} ) `
        + `should match imageOut.height ( ${imageOut.height} ). (${parametersDesc})`);

    tf.util.assert( ( imageIn.width == imageOut.width ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.width ( ${imageIn.width} ) `
        + `should match imageOut.width ( ${imageOut.width} ). (${parametersDesc})`);

    tf.util.assert( ( imageIn.depth == imageOut.depth ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.depth ( ${imageIn.depth} ) `
        + `should match imageOut.depth ( ${imageOut.depth} ). (${parametersDesc})`);

    let resultArray = imageIn.dataArray.map( ( value, i ) => ( imageOut.dataArray[ i ] + value ) );
    imageOut.dataArray = resultArray;

    return imageOut;
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

    if ( !bBias )
      return imageIn;

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
   * @return {Float32Array}
   *   The result of the activation function. Its .dataArray may be just the imageIn.dataArray directly (when no activation function).
   * Or, its .dataArray may be a new Float32Array (when has activation function).
   */
  static modifyByActivation( imageIn, nActivationId, parametersDesc ) {

    let pfnActivation = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    if ( !pfnActivation )
      return imageIn;

    // Because pfnActivation is function of tensorflow.js, it process tf.tensor (i.e. not a single value).
    // Let it process the whole input (as an Array) directly.
    let tensorOut = pfnActivation( imageIn.dataArray )
    imageIn.dataArray = tensorOut.dataSync();
    tensorOut.dispose();

    return imageIn;
  }

}
