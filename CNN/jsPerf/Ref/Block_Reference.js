export { Base };

import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Block from "../../Conv/Block.js";
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as ImageSourceBag from "./ImageSourceBag.js"; 

/**
 * Reference computation of class Block.Base.
 */
class Base {

  constructor() {

//!!! ...unfinished... (2021/09/28)

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

//!!! ...unfinished... (2021/09/28)


    // Initialize successfully or failed.
    let extractedParams = new Block.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.channelCount0_pointwise1Before, testParams.in.channelCount1_pointwise1Before,
      testParams.in.pointwise1ChannelCount, testParams.in.bPointwise1Bias, testParams.in.pointwise1ActivationId,
      testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight,
      testParams.in.depthwiseStridesPad, testParams.in.bDepthwiseBias, testParams.in.depthwiseActivationId,
      testParams.in.pointwise21ChannelCount, testParams.in.bPointwise21Bias, testParams.in.pointwise21ActivationId,
      testParams.in.bOutput1Requested,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = Block.init( progress, extractedParams );

    let flags = {};
    PointDepthPoint.Params.setFlags_by.call( flags,
      testParams.out.channelCount0_pointwise1Before, testParams.out.channelCount1_pointwise1Before,
      testParams.out.pointwise1ChannelCount,
      testParams.out.depthwise_AvgMax_Or_ChannelMultiplier,
      testParams.out.pointwise21ChannelCount,
      testParams.out.bOutput1Requested );

    let parametersDescription = `( ${pointDepthPoint.parametersDescription} )`;

    tf.util.assert( ( pointDepthPoint.bInitOk == bInitOk ),
      `PointDepthPoint validation state (${pointDepthPoint.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize pointDepthPoint object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);


    if ( pointDepthPoint.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    Base.AssertTwoEqualValues( "parsing beginning position",
      pointDepthPoint.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      pointDepthPoint.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // input tensor parameters.
    Base.AssertTwoEqualValues( "inChannels0", pointDepthPoint.inChannels0, testParams.out.channelCount0_pointwise1Before, parametersDescription );

    Base.AssertTwoEqualValues( "channelCount1_pointwise1Before",
      pointDepthPoint.channelCount1_pointwise1Before, testParams.out.channelCount1_pointwise1Before, parametersDescription );

    Base.AssertTwoEqualValues( "inputTensorCount", pointDepthPoint.inputTensorCount, flags.inputTensorCount, parametersDescription );
    Base.AssertTwoEqualValues( "bDepthwise2Requested", pointDepthPoint.bDepthwise2Requested, flags.bDepthwise2Requested, parametersDescription );
    Base.AssertTwoEqualValues( "bConcat1Requested", pointDepthPoint.bConcat1Requested, flags.bConcat1Requested, parametersDescription );

    Base.AssertTwoEqualValues( "bAddInputToOutputRequested",
      pointDepthPoint.bAddInputToOutputRequested, flags.bAddInputToOutputRequested, parametersDescription );

    Base.AssertTwoEqualValues( "bConcat2ShuffleSplitRequested",
      pointDepthPoint.bConcat2ShuffleSplitRequested, flags.bConcat2ShuffleSplitRequested, parametersDescription );

    // Only if channel shuffler is used, it is recorded.
    if ( pointDepthPoint.bConcat2ShuffleSplitRequested ) {
      Base.AssertTwoEqualValues( "channelShuffler_ConcatPointwiseConv",
        pointDepthPoint.channelShuffler_ConcatPointwiseConv, channelShuffler_ConcatPointwiseConv, parametersDescription );
    } else {
      Base.AssertTwoEqualValues( "channelShuffler_ConcatPointwiseConv",
        pointDepthPoint.channelShuffler_ConcatPointwiseConv, null, parametersDescription );
    }

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
    Base.AssertTwoEqualValues( "bOutput1Requested",
      pointDepthPoint.bOutput1Requested, testParams.out.bOutput1Requested, parametersDescription );
    
    { // Test pointwise22ChannelCount.

      // In ShuffleNetV2's body/tail, there is always no pointwise22.
      if ( testParams.out.channelCount1_pointwise1Before
             == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)

        Base.AssertTwoEqualValues( "pointwise22ChannelCount", pointDepthPoint.pointwise22ChannelCount, 0, parametersDescription );

      // Otherwise, pointwise22 is output1 directly. It is determined by both bOutput1Requested and pointwise21ChannelCount.
      } else {
        if ( testParams.out.bOutput1Requested ) {
          Base.AssertTwoEqualValues( "pointwise22ChannelCount", // Either same as pointwise21 (if requested). (Still may be 0.)
            pointDepthPoint.pointwise22ChannelCount, testParams.out.pointwise21ChannelCount, parametersDescription );
        } else {
          Base.AssertTwoEqualValues( "pointwise22ChannelCount", // or 0 (if not requested).
            pointDepthPoint.pointwise22ChannelCount, 0, parametersDescription );
        }
      }
    }

    Base.AssertTwoEqualValues( "bPointwise22Bias",
      pointDepthPoint.bPointwise22Bias, testParams.out.bPointwise21Bias, parametersDescription ); // Always same as pointwise21.

    Base.AssertTwoEqualValues( "pointwise22ActivationId",
      pointDepthPoint.pointwise22ActivationId, testParams.out.pointwise21ActivationId, parametersDescription ); // Always same as pointwise21.

    Base.AssertTwoEqualValues( "pointwise22ActivationName",
      pointDepthPoint.pointwise22ActivationName, pointwise21ActivationName, parametersDescription ); // Always same as pointwise21.

    // Other parameters.
    Base.AssertTwoEqualValues( "bKeepInputTensor", pointDepthPoint.bKeepInputTensor, testParams.out.bKeepInputTensor, parametersDescription );

    return pointDepthPoint;
  }


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `Block ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

}

//!!! ...unfinished... (2021/07/30)
// Test the generated params of every step of every Block.ParamsConfig_Xxx whether conform with expectation.


//!!! ...unfinished... (2021/07/29)
//    *   - If ( stepCountPerBlock == 0 ), this rate will be ignored. There will be no first 1x1 pointwise.
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 0 ), will be simplified ShuffleNetV2 (expanding by once depthwise).
//    *   - If ( bChannelShuffler ==  true ) and ( pointwise1ChannelCountRate == 1 ), will be similar to ShuffleNetV2 (expanding by twice depthwise).
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1.
//    *   - If ( bChannelShuffler == false ) and ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2.


//!!! ...unfinished... (2021/07/27)
//    this.channelCount1_pointwise1Before;
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_XXX (> 0)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT: // ( 0)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT: // (-1)
//     ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE: // (-2)
//
//     let flags = {};
//     PointDepthPoint.Params.setFlags_by_channelCount1_pointwise1Before.call( flags, this.channelCount1_pointwise1Before );

      // Step 0.
      //
      // The special points of a block's step 0 are:
      //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
      //   - Double channels. (By concat if ShuffleNetV2. By second pointwise if MobileNetV2.)
      //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us.)
      let step0, step0Branch;
      {
        let depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0; // (Can not be zero.)

        // Step 0 is responsibile for halving input's height (and width).
        let depthwiseStridesPad = 2; // ( depthwiseStrides == 2 ) and ( depthwisePad == "same" )

        let pointwise1ChannelCount, pointwise2ChannelCount;
        if ( bChannelShuffler ) {                            // ShuffleNetV2.
          pointwise2ChannelCount = sourceChannelCount * 1;   // In ShuffleNetV2, all convolutions do not change channel count

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          depthwiseBias = false;

          // In ShuffleNetV2, depthwise convolution does not have activation function.
          depthwiseActivationId = PointDepthPoint.Params.Activation.Ids.NONE;

        } else {                                             // MobileNetV1, or MobileNetV2.
          pointwise2ChannelCount = sourceChannelCount * 2;   // The output channel count of step 0 of MobileNetV2 is twice as input.

          // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
          pointwise2Bias = false;

//!!! ...unfinished... (2021/04/09) How to know now is MobileNetV2 (not MobileNetV1)? Maybe according to ( pointwise1ChannelCountRate > 1 )?

          // In MobileNetV2, the second 1x1 pointwise convolution does not have activation function in default.
          //
          // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
          pointwise2ActivationId = PointDepthPoint.Params.Activation.Ids.NONE;
        }

        // If there is only one step, this (step 0) is also the last step of this block (i.e. at-block-end) and a different activation
        // function may be used after pointwise2 convolution.
        //
        // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
        if ( 1 == stepCountPerBlock ) {
          pointwise2ActivationId = nActivationIdAtBlockEnd;
        }

        // If ( pointwise1ChannelCount < pointwise2ChannelCount ), similar to ResNet.
        // If ( pointwise1ChannelCount == pointwise2ChannelCount ), similar to MobileNetV1 or ShufffleNetV2.
        // If ( pointwise1ChannelCount > pointwise2ChannelCount ), similar to MobileNetV2.
        pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

        step0 = this.step0 = new PointDepthPoint.Base();
        step0.init(
          sourceChannelCount,
          pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
          pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,

          // In MobileNet2, step 0 is not possible, because output channel count is tiwce as input.
          // In ShuffleNetV2, the skipping connection is achieved by concatenating.
          // So, it is not necessary to add input to output.
          false,
          bKeepInputTensor  // Step 0 may or may not keep input tensor according to caller's necessary. 
        );

        // Step0's branch (ShuffleNetV2)
        //
        // The step 0 of ShuffleNetV2 has a branch which also halves the height and width by depthwise convolution. And it does not have
        // the first 1x1 (pointwise) convolution. But it has the second 1x1 (pointwise) convolution.
        if ( bChannelShuffler ) {
          this.step0Branch = step0Branch = new PointDepthPoint.Base();
          step0Branch.init(
            sourceChannelCount,

            // ShuffleNetV2 Step0's branch does not have the first 1x1 pointwise convolution before depthwise convolution ( strides = 2 ).
            0, false, ValueDesc.ActivationFunction.Singleton.Ids.NONE,

            depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
            pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
            false, // In ShuffleNetV2, the skipping connection is achieved by concatenating. So, it is not necessary to add input to output.
            true   // This is the only case that must keep input tensor, because the input tensor need be re-used by the main path of setp 0.
          );

          // Pre-allocated array (with only two elements) for improving performance by reducing memory re-allocation.
          this.concatTensorArray = new Array( 2 );

          // Bind in step 0's logic, because step 1 (2, 3, ...) may not existed.
          this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_ChannelShuffle;
          this.outputChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;

        } else {
          // Bind in step 0's logic, because step 1 (2, 3, ...) may not existed.
          this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_AddInputToOutput;
          this.outputChannelCount = step0.outputChannelCount;
        }
      }

      // Step 1, 2, 3, ...
      if ( stepCountPerBlock > 0 ) {

        let depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        if ( depthwise_AvgMax_Or_ChannelMultiplier >= 0 ) { // Depthwise convolution.
          // In non-step0, it should not expand channel. Only step 0 can have ( channelMultiplier > 1 ). So, force to 1.
          depthwise_AvgMax_Or_ChannelMultiplier = 1;
        } else { // Avg pooling, or Max pooling.
          // Do nothing. Keep going.
        }

        // Force to ( depthwiseStrides == 1 ), because only step 0 (i.e. not here) should halve input's height (and width).
        let depthwiseStridesPad = 1; // ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )

        // In ShuffleNetV2, the input channel count of step 1 (2, 3, ...) is the concatenated output channel count of the
        // main and branch of step 0. However, they will be splitted (by channel shuffler) into two channel groups. So every
        // channel group has just only half of concatenated channel count of step 0 (i.e. not including the step0Branch).
        //
        // In MobileNetV2, the input channel count of step 1 (2, 3, ...) is the output channel count of the step 0.
        //
        // In a word, they are all the same as step0.outputChannelCount.
        let channelCount_pointwise1Before = step0.outputChannelCount;
        let pointwise2ChannelCount = channelCount_pointwise1Before;  // Every step will output the same channel count as input.

        // The first 1x1 pointwise convolution can change channel count.
        let pointwise1ChannelCount = pointwise2ChannelCount * pointwise1ChannelCountRate;

        // In ShuffleNetV2, there is a channel shuffler in every step (except setp 0). It is shared by these steps in the same block.
        if ( bChannelShuffler ) {
          let concatenatedChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;
          let sourceConcatenatedShape = this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, concatenatedChannelCount ];
          let outputGroupCount = 2; // ShuffleNetV2 always uses two (depthwise convolution) groups.

//!!! (2021/04/10) ...unfinished... Using ChannelShuffler.ConcatPointwiseConv instead.
          this.concatGather = new ChannelShuffler.ConcatGather();
          this.concatGather.init( sourceConcatenatedShape, outputGroupCount );

          this.concatPointwiseConv = new ChannelShuffler.ConcatPointwiseConv();
          this.concatPointwiseConv.init( sourceConcatenatedShape, outputGroupCount );
        }

        this.steps1After = new Array( stepCountPerBlock - 1 );  // "- 1" because this array does not include step0.

        for ( let i = 0; i < this.steps1After.length; ++i ) {

          // If this is the last step of this block (i.e. at-block-end), a different activation function may be used after
          // pointwise2 convolution.
          //
          // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
          if ( i == ( this.steps1After.length - 1 ) ) {
            pointwise2ActivationId = nActivationIdAtBlockEnd;
          }

          let step = new PointDepthPoint.Base();
          step.init(
            channelCount_pointwise1Before,
            pointwise1ChannelCount, pointwise1Bias, pointwise1ActivationId,
            depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, depthwiseBias, depthwiseActivationId,
            pointwise2ChannelCount, pointwise2Bias, pointwise2ActivationId,
            this.bAddInputToOutput,
            false // No matter bKeepInputTensor, all steps (except step 0) should not keep input tensor.
          );

          this.steps1After[ i ] = step;
        }

        if ( 1 == stepCountPerBlock ) {
          this.stepLast = this.step0; // If there is only one step, it is also the last step.
        } else {
          this.stepLast = this.steps1After[ this.steps1After.length - 1 ]; // Shortcut to the last step.
        }
      }
//!!! ...unfinished... (2021/07/28)
      this.bInitOk = true;
    }

    return this.bInitOk;
