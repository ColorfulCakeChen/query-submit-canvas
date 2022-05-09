export { Base };

import * as TensorTools from "../../util/TensorTools.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ImageSourceBag from "./ImageSourceBag.js"; 
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js"; 
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js"; 
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as Block from "../../Conv/Block.js";

/**
 * Reference computation of class Block.Base.
 */
class Base {

  constructor() {
    this.PointDepthPoint_Reference = new PointDepthPoint_Reference.Base();
    this.asserter_Tensor_NumberArray = new TensorTools.Asserter_Tensor_NumberArray( 0.5 );

    // For reducing memory allocation.
    this.imageInArray = new Array( 2 );  // imageInArray[ 0 ] is input0, imageInArray[ 1 ] is input1.
    //this.imageOutArray = new Array( 2 ); // imageOutArray[ 0 ] is output0, imageOutArray[ 1 ] is output1.
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {
    this.testParams = testParams;

    try {
      let sourceHeight = this.testParams.out.sourceHeight;
      let sourceWidth = this.testParams.out.sourceWidth;
      let sourceChannelCount = this.testParams.out.sourceChannelCount;
      let stepCountRequested = this.testParams.out.stepCountRequested;
      let bPointwise1 = this.testParams.out.bPointwise1;
      let depthwiseFilterHeight = this.testParams.out.depthwiseFilterHeight;
      let depthwiseFilterWidth = this.testParams.out.depthwiseFilterWidth;
      let nActivationId = this.testParams.out.nActivationId;
      let bPointwise2BiasAtBlockEnd = this.testParams.out.bPointwise2BiasAtBlockEnd;
      let nConvBlockType = this.testParams.out.nConvBlockType;
      let bKeepInputTensor = this.testParams.out.bKeepInputTensor;

      let referredParams = {};
      let outputHeight, outputWidth, outputChannelCount;
      {
        Block.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( referredParams, sourceHeight, sourceWidth );

        outputHeight = referredParams.outputHeight;
        outputWidth = referredParams.outputWidth;

        outputChannelCount = sourceChannelCount * 2; // In current Block's design, the output channel always is twice as input.
      }

      let strNote;
      strNote = `( this.testParams.id=${this.testParams.id} )`;

      let imageIn = imageSourceBag.getImage_by( sourceChannelCount );
      let imageOutReference = this.calcResult( imageIn );

      let inputTensor3d = imageSourceBag.getTensor3d_by( sourceChannelCount );

      let inputTensorDestroyCount; // How many input tensors will be destroyed by Block.apply().
      if ( bKeepInputTensor ) {
        inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

      } else {
        inputTensor3d = inputTensor3d.clone(); // Clone for being destroyed. 
        inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.
      let block = Base.Block_create( testParams );

      let parametersDescription = block.parametersDescription;
      strNote = `( this.testParams.id=${this.testParams.id}, ${parametersDescription} )`;

      Base.AssertTwoEqualValues( "outputHeight", block.outputHeight, outputHeight, strNote );
      Base.AssertTwoEqualValues( "outputWidth", block.outputWidth, outputWidth, strNote );
      Base.AssertTwoEqualValues( "outputChannelCount", block.outputChannelCount, outputChannelCount, strNote );

      Base.AssertTwoEqualValues( "stepCount", block.stepCount, testParams.stepsArray.length, strNote );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let block_outputTensorCount = 1;
      let tensorNumDifference_apply_before_after = block_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of Block.apply.
      let outputTensor3d = block.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
        `Block.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.util.assert( inputTensor3d,
        `Block inputTensor3d should not be null. ${strNote}`); // But may be disposed.

      tf.util.assert( outputTensor3d,
        `Block outputTensor3d should not be null. ${strNote}`);

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        Base.AssertTwoEqualValues( "outChannels", block.outputChannelCount, outputTensorChannelCount, strNote );
      }

      // Test correctness of Block.apply.
      {
        let outputArrayRef;

        if ( imageOutReference ) {
          outputArrayRef = imageOutReference.dataArray; // Get referenced result (as number array).
        } else {
          outputArrayRef = null;
        }

        this.asserter_Tensor_NumberArray.assert(
          outputTensor3d, outputArrayRef,
          "Block", `outputTensor`, `outputRef`, parametersDescription
        );
      }

      block.disposeTensors();
      let memoryInfo_afterDispose = tf.memory();

      tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
        `Block create/dispose memory leak. `
          + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
          + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.dispose( outputTensor3d );

    } catch ( e ) {
      let backendName = tf.getBackend();
      console.log( `Block_Reference.js: testCorrectness(): backendName=${backendName}, `
        + `Block this.testParams.id == ${this.testParams.id}` );
      throw e;
    }

  }

  /**
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   * @return {Block.Base} The created Block object.
   */
  static Block_create( testParams ) {

    let block = new Block.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new Block.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.sourceHeight, testParams.in.sourceWidth, testParams.in.sourceChannelCount,
      testParams.in.stepCountRequested,
      testParams.in.bPointwise1,
      testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.nActivationId,
      testParams.in.bPointwise2BiasAtBlockEnd,
      testParams.in.nConvBlockType,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = block.init( progress, extractedParams );

    let parametersDescription = `( ${block.parametersDescription} )`;

    tf.util.assert( ( block.bInitOk == bInitOk ),
      `Block validation state (${block.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize block object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);

    if ( block.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    Base.AssertTwoEqualValues( "parsing beginning position",
      block.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      block.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // parameters.
    Base.AssertTwoEqualValues( "sourceHeight", block.sourceHeight, testParams.out.sourceHeight, parametersDescription );
    Base.AssertTwoEqualValues( "sourceWidth", block.sourceWidth, testParams.out.sourceWidth, parametersDescription );
    Base.AssertTwoEqualValues( "sourceChannelCount", block.sourceChannelCount, testParams.out.sourceChannelCount, parametersDescription );
    Base.AssertTwoEqualValues( "stepCountRequested", block.stepCountRequested, testParams.out.stepCountRequested, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise1", block.bPointwise1, testParams.out.bPointwise1, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseFilterHeight",
      block.depthwiseFilterHeight, testParams.out.depthwiseFilterHeight, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseFilterWidth",
      block.depthwiseFilterWidth, testParams.out.depthwiseFilterWidth, parametersDescription );

    Base.AssertTwoEqualValues( "nActivationId", block.nActivationId, testParams.out.nActivationId, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise2BiasAtBlockEnd",
      block.bPointwise2BiasAtBlockEnd, testParams.out.bPointwise2BiasAtBlockEnd, parametersDescription );

    Base.AssertTwoEqualValues( "nConvBlockType", block.nConvBlockType, testParams.out.nConvBlockType, parametersDescription );

    // Referred parameters.
    Base.AssertTwoEqualValues( "outputHeight", block.outputHeight, testParams.out.outputHeight, parametersDescription );
    Base.AssertTwoEqualValues( "outputWidth", block.outputWidth, testParams.out.outputWidth, parametersDescription );

    // Other parameters.
    Base.AssertTwoEqualValues( "bKeepInputTensor", block.bKeepInputTensor, testParams.out.bKeepInputTensor, parametersDescription );

    Base.AssertParameters_Block_steps( block, parametersDescription ); // Test every step's parameters.

    return block;
  }

  /** */
  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `Block ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

  /**
   * Test every step's parameters.
   *
   * @param {Block.Base[]|Block_TestParams.Base[]} blockParams
   *   The block to be checked. It parameters will be checked.
   *
   */
  static AssertParameters_Block_steps( blockParams, parametersDescription ) {
    let stepParamsArray = blockParams.stepsArray; // No matter Block.Base or Block_TestParams.Base

    if ( blockParams instanceof Block_TestParams.Base ) {
      blockParams = blockParams.out;
    } else { // Block.Base
    }

    let stepCountRequested = blockParams.stepCountRequested;
    let nConvBlockType = blockParams.nConvBlockType;

    let single_Step0Input0ChannelCount = blockParams.sourceChannelCount;        // Single of step0's input0 channel count.
    let double_Step0Input0ChannelCount = double_Step0Input0ChannelCount * 2;    // Double of step0's input0 channel count.
    let quadruple_Step0Input0ChannelCount = blockParams.sourceChannelCount * 4; // Quadruple of step0's input0 channel count.

    let stepCount = stepParamsArray.length;

    tf.util.assert( ( stepCount > 0 ),
      `Block stepCount (${stepCount}) should be larger than 0. ${parametersDescription}`);

    let stepName, stepParams, pointwise1ChannelCount;
    for ( let stepIndex = 0; stepIndex < stepCount; ++stepIndex ) {
      stepName = `step${stepIndex}`;

      {
        stepParams = stepParamsArray[ stepIndex ];
        if ( stepParams instanceof PointDepthPoint_TestParams.Base ) {
          stepParams = stepParams.out;
        } else { // PointDepthPoint.Base
        }
      }

      let asserter = new ObjectPropertyAsserter.Base( `Block.${stepName}`, stepParams, parametersDescription );

      let strUnknownConvBlockType = `Block_Reference.Base.AssertParameters_Block_steps(): `
            `unknown nConvBlockType ( ${nConvBlockType} ) value. ${asserter.contextDescription}`;

      // channelCount0_pointwise1Before
      if ( 0 == stepIndex ) { //step0
        asserter.propertyValue( "channelCount0_pointwise1Before", single_Step0Input0ChannelCount );
      } else { // step1, 2, 3, ...
        switch ( nConvBlockType ) {
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount0_pointwise1Before", double_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "channelCount0_pointwise1Before", single_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount0_pointwise1Before", double_Step0Input0ChannelCount );
            break;

          default: tf.util.assert( false, strUnknownConvBlockType ); break;
        }
      }

      // channelCount1_pointwise1Before
      if ( 0 == stepIndex ) { //step0
        switch ( nConvBlockType ) {
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            if ( blockParams.bPointwise1 == false ) {
              asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            } else {
              asserter.propertyValue( "channelCount1_pointwise1Before",
                ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE );
            }
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 );
            break;

          default: tf.util.assert( false, strUnknownConvBlockType ); break;
        }

      } else { // step1, 2, 3, ...
        switch ( nConvBlockType ) {
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
            asserter.propertyValue( "channelCount1_pointwise1Before", ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT );
            break;

          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            asserter.propertyValue( "channelCount1_pointwise1Before", single_Step0Input0ChannelCount ); // TWO_INPUTS
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            asserter.propertyValue( "channelCount1_pointwise1Before",
              ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH );
            break;

          default: tf.util.assert( false, strUnknownConvBlockType ); break;
        }
      }

      // pointwise1ChannelCount
      if ( 0 == stepIndex ) { //step0
        switch ( nConvBlockType ) {
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
            if ( blockParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
            if ( blockParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", quadruple_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
            if ( blockParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            if ( blockParams.bPointwise1 == false ) {
              if ( stepParams instanceof PointDepthPoint_TestParams.Base ) {
                asserter.propertyValue( "pointwise1ChannelCount", 0 ); // Zero in parameters.
              } else { // PointDepthPoint.Base
                asserter.propertyValue( "pointwise1ChannelCount", double_Step0Input0ChannelCount ); // Double in reality internally.
              }
            } else {
              if ( stepParams instanceof PointDepthPoint_TestParams.Base ) {
                asserter.propertyValue( "pointwise1ChannelCount", single_Step0Input0ChannelCount ); // Single in parameters.
              } else { // PointDepthPoint.Base
                asserter.propertyValue( "pointwise1ChannelCount", double_Step0Input0ChannelCount ); // Double in reality internally.
              }
            }
            break;

          default: tf.util.assert( false, strUnknownConvBlockType ); break;
        }

      } else { // step1, 2, 3, ...
        switch ( nConvBlockType ) {
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
          case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
            if ( blockParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", double_Step0Input0ChannelCount );
            break;

          case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
            if ( blockParams.bPointwise1 == false )
              asserter.propertyValue( "pointwise1ChannelCount", 0 );
            else
              asserter.propertyValue( "pointwise1ChannelCount", quadruple_Step0Input0ChannelCount );
            break;

          default: tf.util.assert( false, strUnknownConvBlockType ); break;
        }
      }

      asserter.propertyValue( "bPointwise1Bias", true );
      asserter.propertyValue( "pointwise1ActivationId", blockParams.nActivationId );

      asserter.propertyValue( "depthwiseFilterHeight", blockParams.depthwiseFilterHeight );
      asserter.propertyValue( "depthwiseFilterWidth", blockParams.depthwiseFilterWidth );

//!!! ...unfinished... (2022/05/09) depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad


      if ( ValueDesc.ConvBlockType.isMobileNetV2( blockParams.nConvBlockType ) ) {
        asserter.propertyValue( "bDepthwiseBias", true );
        asserter.propertyValue( "depthwiseActivationId", blockParams.nActivationId );
      } else {
        asserter.propertyValue( "bDepthwiseBias", false );
        asserter.propertyValue( "depthwiseActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
      }


//!!! ...unfinished... (2022/05/09) pointwise21ChannelCount

      asserter.propertyValue( "bPointwise21Bias", true );

      if ( 0 == stepIndex ) { //step0
        if ( ValueDesc.ConvBlockType.isMobileNetV2( blockParams.nConvBlockType ) ) {
          asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
        } else {
          asserter.propertyValue( "pointwise21ActivationId", blockParams.nActivationId );
        }

      } else { // step1, 2, 3, ...
        if ( ValueDesc.ConvBlockType.isMobileNetV2( blockParams.nConvBlockType ) ) {
          asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );

        } else {
          if ( blockParams.bPointwise2ActivatedAtBlockEnd == false ) {
            asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );
          } else {
            asserter.propertyValue( "pointwise21ActivationId", blockParams.nActivationId );
          }
        }

      }

//!!! (2022/05/07 Remarked) according to MobileNetV2_Xxx or bPointwise2ActivatedAtBlockEnd
//       if ( ( stepCount - 1 ) != stepIndex ) {
//         if ( ( ValueDesc.ConvBlockType.isMobileNet( blockParams.nConvBlockType ) ) && ( blockParams.bPointwise1 == true ) ) {
//           asserter.propertyValue( "bPointwise21Bias", false );
//         } else {
//           asserter.propertyValue( "bPointwise21Bias", true );
//         }
//
//       } else { // stepLast
//         if ( blockParams.bPointwise2BiasAtBlockEnd == false ) {
//           asserter.propertyValue( "bPointwise21Bias", false );
//         } else {
//           asserter.propertyValue( "bPointwise21Bias", true );
//         }
//       }
//
//       asserter.propertyValue( "pointwise21ActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );


//!!! ...unfinished... (2022/05/05) pointwise1ChannelCount


//!!! ...unfinished... (2022/05/05) nConvBlockType
//
//       case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
//       case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
//       case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
//       case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (3)
//
//       case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
//       case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
//       case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
//       case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
//


      switch ( nConvBlockType ) {
        case ValueDesc.nConvBlockType.Singleton.Ids.NONE: // (0) 2. MobileNetV2 or MobileNetV1
        {
          let pointwise21ChannelCount = double_Step0Input0ChannelCount;

          asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
          asserter.propertyValue( "depthwiseFilterHeight", blockParams.depthwiseFilterHeight );

          if ( 0 == stepIndex ) {
            asserter.propertyValue( "depthwiseStridesPad", 2 );
          } else {
            asserter.propertyValue( "depthwiseStridesPad", 1 );
          }

          asserter.propertyValue( "pointwise21ChannelCount", pointwise21ChannelCount );

          asserter.propertyValue( "bOutput1Requested", false );

          //asserter.propertyValue( "outChannels0", pointwise21ChannelCount );
          //asserter.propertyValue( "outChannels1", 0 );

        }
          break;

        case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER: // (1) 3. ShuffleNetV2
        case ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22:      // (2) 4. ShuffleNetV2_ByPointwise22
        {

          if ( 0 == stepIndex ) {
            if ( stepParams.pointwise1ChannelCount == 0 ) {
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 2 );
            } else {
              asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
            }
          } else {
            asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", 1 );
          }

          asserter.propertyValue( "depthwiseFilterHeight", blockParams.depthwiseFilterHeight );

          if ( 0 == stepIndex ) {
            asserter.propertyValue( "depthwiseStridesPad", 2 );
          } else {
            asserter.propertyValue( "depthwiseStridesPad", 1 );
          }

          asserter.propertyValue( "bDepthwiseBias", false );
          asserter.propertyValue( "depthwiseActivationId", ValueDesc.ActivationFunction.Singleton.Ids.NONE );

          if ( ( stepCount - 1 ) != stepIndex ) {
            asserter.propertyValue( "pointwise21ChannelCount", blockParams.sourceChannelCount );
          } else { // stepLast
            if ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFFLER ) { // (1) ShuffleNetV2
              asserter.propertyValue( "pointwise21ChannelCount", blockParams.sourceChannelCount );
            } else { // ValueDesc.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22 ) (2) ShuffleNetV2_ByPointwise22
              asserter.propertyValue( "pointwise21ChannelCount", ( double_Step0Input0ChannelCount ) );
            }
          }

          if ( ( stepCount - 1 ) != stepIndex ) {
            asserter.propertyValue( "bOutput1Requested", true );
            //asserter.propertyValue( "outChannels0", blockParams.sourceChannelCount );
            //asserter.propertyValue( "outChannels1", blockParams.sourceChannelCount );

          } else { // stepLast
            asserter.propertyValue( "bOutput1Requested", false );
            //asserter.propertyValue( "outChannels0", ( double_Step0Input0ChannelCount ) );
            //asserter.propertyValue( "outChannels1", 0 );
          }

        }
          break;

        default:
          tf.util.assert( false, `Block_Reference.Base.AssertParameters_Block_steps(): `
             `unknown nWhetherShuffleChannel ( ${nWhetherShuffleChannel} ) value. ${asserter.contextDescription}` );
          break;
      }

      // .addInput0ToPointwise21
      if ( 0 == stepIndex ) {
      } else {

//!!! ...unfinished... (2022/05/05)
// should assert .addInput0ToPointwise21 exists if MobileNetV2.

      }

      if ( 0 == stepIndex ) {
        asserter.propertyValue( "bKeepInputTensor", blockParams.bKeepInputTensor );
      } else {
        asserter.propertyValue( "bKeepInputTensor", false );
      }

    }
  }

  /** According to imageIn and this.testParams.in.paramsNumberArrayObject, calculate imageOut.
   *
   * @param {object} imageIn
   *   The image to be tested.
   *
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   *
   * @return {object} Return output image as object { height, widthm depth, dataArray }.
   */
  calcResult( imageIn ) {
    let testParams = this.testParams;

    let channelShuffler_concatenatedShape;
    let channelShuffler_outputGroupCount = 2; // In ShuffleNetV2, channel shuffler always has 2 convolution group.

    {
      let referredParams = {};
      Block.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( referredParams,
        testParams.out.sourceHeight, testParams.out.sourceWidth );

      // In ShuffleNetV2, channel shuffler always has half ( height, width ) and twice channel count of original input0.
      channelShuffler_concatenatedShape = [ referredParams.outputHeight, referredParams.outputWidth, imageIn.depth * 2 ];

      // Create description for debug easily.
      this.paramsOutDescription =

          `sourceHeight=${testParams.out.sourceHeight}, sourceWidth=${testParams.out.sourceWidth}, `
        + `sourceChannelCount=${testParams.out.sourceChannelCount}, `
        + `stepCountRequested=${testParams.out.stepCountRequested}, `
        + `bPointwise1=${testParams.out.bPointwise1}, `
        + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, depthwiseFilterWidth=${testParams.out.depthwiseFilterWidth}, `

        + `nActivationIdName=${ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.nActivationId )}`
          + `(${testParams.out.nActivationId}), `

        + `bPointwise2BiasAtBlockEnd=${testParams.out.bPointwise2BiasAtBlockEnd}, `

        + `nConvBlockType=${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockType )}`
          + `(${testParams.out.nConvBlockType}), `

        + `outputHeight=${referredParams.outputHeight}, outputWidth=${referredParams.outputWidth}, `
//        + `outputChannelCount=${???.outputChannelCount}, `
        + `bKeepInputTensor=${testParams.out.bKeepInputTensor}`
      ;
    }

    Base.AssertParameters_Block_steps( testParams, this.paramsOutDescription ); // Test every step's parameters.

    // Calculate every steps in sequence.

    let pointDepthPointRef = this.PointDepthPoint_Reference;

    this.imageInArray[ 0 ] = imageIn;
    this.imageInArray[ 1 ] = null;

    let imageOutArray = this.imageInArray;
    let stepCount = testParams.stepsArray.length;
    for ( let stepIndex = 0; stepIndex < stepCount; ++stepIndex ) {
      pointDepthPointRef.testParams = testParams.stepsArray[ stepIndex ];
      imageOutArray = pointDepthPointRef.calcResult( imageOutArray, channelShuffler_concatenatedShape, channelShuffler_outputGroupCount );
    }

    let imageOut = imageOutArray[ 0 ]; // The stepLast should have only input0.
    return imageOut;
  }

}
