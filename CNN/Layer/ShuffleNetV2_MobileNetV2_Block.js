import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

export { Base };

/**
 * Implement a block of ShuffleNetV2 (with 2 output channel groups) or MobileNetV2.
 *
 *
 *
 * @member {function} apply_and_destroy
 *   This is a method. It has an parameter inputTensor (tf.tensor4d) represents the image which will be processed. It returns a new
 * tf.tensor4d. All other tensors (including inputTensor) will be disposed. In fact, this method calls one of
 * apply_and_destroy_NotShuffleNetV2_NotMobileNetV2(), apply_and_destroy_ShuffleNetV2(), apply_and_destroy_MobileNetV2() according to
 * the init()'s parameters.
 *
 * @member {number} outputChannelCount
 *   The output channel count of this block's last step.
 *
 * @member {string} pointwise2ActivationName
 *   The activation function name after the second 1x1 pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
 * If MobileNetV2, it will be null. Otherwise, it will be the same as strAvgMaxConv.
 *
 * @see ChannelShuffler.ConcatGather
 */
class Base {

  /**
   * @param sourceHeight        The height (and width) of the source image which will be processed by apply().
   * @param sourceChannelCount  The channel count of the source image.
   * @param targetHeight        The taregt image height (and width).
   *
   * @param {number} stepCountPerBlock
   *   If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) for shrinking sourceHeight
   * (minus ( filterHeight - 1 )). If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   * (halve height x width) and use ( stageCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until the block end.
   *
   * @param {boolean} bShuffleNetV2
   *   If true, ShuffleNetV2 (i.e. split and concat channels) will be used. If false, MobileNetV2 (i.e. expand, shrink, and add channels)
   * will be used. If ( stepCountPerBlock <= 0 ), this flag will be ignored.
   *
   * @param strAvgMaxConv
   *   Depthwise operation. "Avg" or "Max" or "Conv" for average pooling, max pooling, depthwise convolution.
   *
   * @param {number} depthwiseChannelMultiplierStep0
   *   The depthwise convolution of the first step (Step 0) will expand input channel by this factor.
   *
   * @param {boolean} bBias
   *   If true, there will be a bias after every convolution.
   *
   * @param {string} strActivationName
   *   The activation function name after the convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   *
   * @see PointDepthPoint.Base.init()
   */
  init(
    sourceHeight, sourceChannelCount, targetHeight,
    stepCountPerBlock,
    bShuffleNetV2,
//     step0_pointwise1ChannelCount, step0_bPointwise1Bias, step0_pointwise1ActivationName,
//     step0_pointwise2ChannelCount, step0_bPointwise2Bias, step0_pointwise2ActivationName,
//     strAvgMaxConv, depthwiseChannelMultiplierStep0, depthwiseFilterHeight, bDepthwiseBias, depthwiseActivationName,
//     pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName

//    pointwise1ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierStep0, bBias, strActivationName ) {

    this.disposeTensors();

    // Both MobileNetV3 and ShuffleNetV2:
    //   - They all do not use (depthwise convolution) channelMultiplier.
    //   - They all use 1x1 (pointwise) convolution to expand channel count.
    //   - They all use 1x1 (pointwise) convolution before depthwise convolution.
    //   - They all do not use activation function after depthwise convolution.
    //   - They all use depthwise convolution with ( pad = "same").
    //   - They all use depthwise convolution with ( strides = 2 ) for shrinking (halving) height x weight.
    //   - They all do not use bias after pointwise and depthwise convolution.
    //
    // Inisde one of their block, three convolutions are used:
    //   A) 1x1 (pointwise) convolution, with activation.
    //   B) depthwise convolution, without activation.
    //   C) 1x1 (pointwise) convolution, (ShuffleNetV2) with or (MobileNetV2) without activation.
    //
    // In MobileNetV3, convolution A expands channel count (with activation), convolution C shrinks channel count (without activation).
    // It may use squeeze-and-excitation after convolution B (without activation). When there is necessary to increase output channel
    // count (usually in step 0 of a block), the convolution C is responsible for this.
    //
    // In ShuffleNetV2, convolution A (with activation), convolution B (without activation) and convolution C (with activation) never
    // change channel count. When there is necessary to increase output channel count (usually in step 0 of a block), it expands channel
    // count by concatenating two shrinked (halven) height x weight.
    //

    this.stepCountPerBlock = stepCountPerBlock;
    this.bShuffleNetV2 = bShuffleNetV2;

    let sourceWidth = sourceHeight;  // Assume source's width equals its height.
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;

    this.strAvgMaxConv = strAvgMaxConv;

    let depthwiseFilterWidth =   depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterWidth;

    this.depthwiseChannelMultiplierStep0 = depthwiseChannelMultiplierStep0;

    this.bBias = bBias;
    this.strActivationName = strActivationName;
    this.bAddInputToOutput = false;

    if ( stepCountPerBlock <= 0 ) {  // Not ShuffleNetV2, Not MobileNetV2.

      // Only one step (i.e. step 0 ) for depthwise operation with ( strides = 1, pad = "valid" ) for shrinking sourceHeight
      // (minus ( filterHeight - 1 )).

      let pointwise1ChannelCount = 0; // no pointwise convolution before depthwise convolution.
      let pointwise2ChannelCount;

      let depthwise_AvgMax_Or_ChannelMultiplier;
      if ( strAvgMaxConv == "Conv" ) { // Depthwise convolution.
        depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        pointwise2ChannelCount = sourceChannelCount * depthwiseChannelMultiplierStep0;
      } else {
        depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".
        pointwise2ChannelCount = sourceChannelCount;           // The output channel count of average (or max) pooling is the same as input channel count.
      }

      let depthwiseStrides = 1;
      let depthwisePad = "valid";     // so that shrinking sourceHeight a little.

      let step0 = this.step0 = new PointDepthPoint.Base();
      step0.init(
        sourceChannelCount,
        pointwise1ChannelCount, bBias, strActivationName,
        depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bBias, strActivationName,
        pointwise2ChannelCount, bBias, strActivationName,
        this.bAddInputToOutput );

      this.apply_and_destroy = Base.apply_and_destroy_NotShuffleNetV2_NotMobileNetV2;
      this.outputChannelCount = step0.outputChannelCount;

    } else {  // ShuffleNetV2, or MobileNetV2.

      // Step 0.
      //
      // The special of a block's step 0 are:
      //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
      //   - Double channels. (by concat if ShuffleNetV2. by second pointwise if MobileNetV2.)
      //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us only.)
      let step0, step0Branch;
      {
        let depthwise_AvgMax_Or_ChannelMultiplier;
        if ( strAvgMaxConv == "Conv" )
          depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
        else
          depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

        let depthwiseStrides = 2;  // Step 0 is responsibile for halving input's height (and width).
        let depthwisePad = "same";

        let pointwise1ChannelCount, pointwise2ChannelCount;
        if ( bShuffleNetV2 ) {
          pointwise1ChannelCount = sourceChannelCount * 1; // In ShuffleNetV2, all convolutions do not change channel count
          pointwise2ChannelCount = sourceChannelCount * 1;
          this.pointwise2ActivationName = strActivationName;
        } else {
          pointwise1ChannelCount = sourceChannelCount * 4; // In MobileNetV2, ( pointwise1ChannelCount > pointwise2ChannelCount )
          pointwise2ChannelCount = sourceChannelCount * 2; // The channel count of step 0 of MobileNetV2 output is twice as input.
          this.bAddInputToOutput = true;
          this.pointwise2ActivationName = null;            // In MobileNetV2, the second 1x1 pointwise convolution does not have activation function.
        }

        step0 = this.step0 = new PointDepthPoint.Base();
        step0.init(
          sourceChannelCount,
          pointwise1ChannelCount, bBias, strActivationName,
          depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bBias, strActivationName,
          pointwise2ChannelCount, bBias, this.pointwise2ActivationName,
          this.bAddInputToOutput );

        // Step0's branch (ShuffleNetV2)
        //
        // The step 0 of ShuffleNetV2 has a branch for halving height and width by depthwise convolution without 1x1 (pointwise) convolution in front of it.
        if ( bShuffleNetV2 ) {
          this.step0Branch = step0Branch = new PointDepthPoint.Base();
          step0Branch.init(
            sourceChannelCount,
            0, false, "", // ShuffleNetV2 Step0's branch does not have pointwise convolution before depthwise convolution ( strides = 2 ).
            depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bBias, strActivationName,
            pointwise2ChannelCount, bBias, this.pointwise2ActivationName );

          this.concatTensorArray = new Array( 2 );  // Pre-allocated array (with only two elements) for improving performance by reducing memory re-allocation.

          this.apply_and_destroy = Base.apply_and_destroy_ShuffleNetV2; // Bind here (step 0's logic), because step 1 (2, 3, ...) may not existed.
          this.outputChannelCount = step0.outputChannelCount + step0Branch.outputChannelCount;

        } else {
          this.apply_and_destroy = Base.apply_and_destroy_MobileNetV2;  // Bind here (step 0's logic), because step 1 (2, 3, ...) may not existed.
          this.outputChannelCount = step0.outputChannelCount;
        }
      }

      // Step 1, 2, 3, ...
      if ( stepCountPerBlock > 0 ) {

        let depthwise_AvgMax_Or_ChannelMultiplier;
        if ( strAvgMaxConv == "Conv" )
          depthwise_AvgMax_Or_ChannelMultiplier = 1; // Force to 1, because only step 0 can have ( channelMultiplier > 1 ).
        else
          depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

        let depthwiseStrides = 1;  // Force to 1, because only step 0 should halve input's height (and width).
        let depthwisePad = "same";

        // In ShuffleNetV2, the input channel count of step 1 (2, 3, ...) is the concatenated output channel count of the main and branch of step 0.
        // In MobileNetV2, the input channel count of step 1 (2, 3, ...) is the output channel count of the step 0.
        //
        // However, they are all the same as ( sourceChannelCount * 2 ).
        let channelCount_pointwise1Before;
        let pointwise1ChannelCount, pointwise2ChannelCount;

        if ( bShuffleNetV2 ) {
          channelCount_pointwise1Before = step0.outputChannelCount + step0Branch.outputChannelCount;

          // In ShuffleNetV2, all convolutions do not change channel count which is just half of canatenated channel count of step 0.
          //
          // This is because they will be splitted (by channel shuffler) into two channel groups. Every channel group has just channel
          // count of one branch of step 0.
          pointwise1ChannelCount = pointwise2ChannelCount = step0.outputChannelCount;

          // In ShuffleNetV2, there is a channel shuffler in every step (except setp 0).
          {
            let sourceConcatenatedShape = this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, channelCount_pointwise1Before ];
            let outputGroupCount = 2; // ShuffleNetV2 always uses two (depthwise convolution) groups.
            this.concatGather = new ChannelShuffler.ConcatGather();
            this.concatGather.init( sourceConcatenatedShape, outputGroupCount );
          }

        } else {  // MobileNetV2
          channelCount_pointwise1Before = step0.outputChannelCount;
          pointwise1ChannelCount = channelCount_pointwise1Before * 2; // In MobileNetV2, ( pointwise1ChannelCount > pointwise2ChannelCount )
          pointwise2ChannelCount = channelCount_pointwise1Before * 1; // The channel count of step 1 (2, 3, ...) of MobileNetV2 output are the same as input.
        }

        this.steps1After = new Array( stepCountPerBlock - 1 );  // "-1" because this array does not include step0.

        for ( let i = 0; i < this.steps1After.length; ++i ) {
          let step = new PointDepthPoint.Base();
          step.init(
            channelCount_pointwise1Before,
            pointwise1ChannelCount, bBias, strActivationName,
            depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bBias, strActivationName,
            pointwise2ChannelCount, bBias, this.pointwise2ActivationName,
            this.bAddInputToOutput );

          this.steps1After[ i ] = step;
        }
      }
    }
  }

  disposeTensors() {
    if ( this.concatGather ) {
      this.concatGather.disposeTensors();
      this.concatGather = null;
    }

    if ( this.concatTensorArray ) {
      this.concatTensorArray = null;
    }

    if ( this.step0 ) {
      this.step0.disposeTensors();
      this.step0 = null;
    }

    if ( this.step0Branch ) {
      this.step0Branch.disposeTensors();
      this.step0Branch = null;
    }

    if ( this.steps1After ) {
      for ( let step of this.steps1After ) {
        step.disposeTensors();
      }
      this.steps1After = null;
    }
  }

  /** Process input, destroy input, return result. (For Not ShuffleNetV2 and Not MobileNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy().
   *
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor will be disposed.
   *
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  static apply_and_destroy_NotShuffleNetV2_NotMobileNetV2( inputTensor ) {
    let t = this.step0.apply_and_destroy( inputTensor );
    inputTensor.dispose();          // Dispose all intermediate (temporary) data.
    return t;
  }

  /** Process input, destroy input, return result. (For ShuffleNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy().
   *
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor will be disposed.
   *
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  static apply_and_destroy_ShuffleNetV2( inputTensor ) {

    // Keep data as local variables for improving performance.

//!!! ...unfinished... Compare performance to call concatGather.concatGather() directly.

    let lastAxisId = this.concatGather.shuffleInfo.lastAxisId;

    // There are exactly two output channel groups, take them out from array. (for reducing array access cost.)
    let group0_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 0 ];
    let group1_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 1 ];

    let concatTensorArray = this.concatTensorArray; // Keep pre-allocated array (with two elements) as local variables for improving performance.

    // tensor of convolution group 0, tensor of convolution group 1, new tensor of convolution group 1, tensor of concatenation of group 0 and 1. 
    let t0, t1, t1New, concatenatedTensor;

    // Step 0.
    concatTensorArray[ 0 ] = t0 = this.step0Branch.apply_and_destroy( inputTensor );  // Branch.
    concatTensorArray[ 1 ] = t1 = this.step0      .apply_and_destroy( inputTensor );  // Main Path.
    inputTensor.dispose();          // Dispose all intermediate (temporary) data.

    concatenatedTensor = tf.concat( concatTensorArray, lastAxisId );
    t0.dispose();                   // Dispose all intermediate (temporary) data.
    t1.dispose();                   // Dispose all intermediate (temporary) data.

    // Step 1, 2, 3, ...
    let step;
    for ( let i = 0; i < this.steps1After.length; ++i ) {
      step = this.steps1After[ i ];

      // shuffle and split by gather (one operation achieves two operations).
      t0 = concatenatedTensor.gather( group0_channelIndicesTensor1d, lastAxisId );
      t1 = concatenatedTensor.gather( group1_channelIndicesTensor1d, lastAxisId );
      concatenatedTensor.dispose(); // Dispose all intermediate (temporary) data.

      concatTensorArray[ 0 ] = t0;                                    // Branch do nothing (as a shortcut).
      concatTensorArray[ 1 ] = t1New = step.apply_and_destroy( t1 );  // Main path is processed.
      t1.dispose();                 // Dispose all intermediate (temporary) data.

      concatenatedTensor = tf.concat( concatTensorArray, lastAxisId );
      t0.dispose();                 // Dispose all intermediate (temporary) data.
      t1New.dispose();              // Dispose all intermediate (temporary) data.
    }

    return concatenatedTensor;
  }

  /** Process input, destroy input, return result. (For MobileNetV2.)
   *
   * @param {Block} this
   *   This method should not be called directly. It should be called by calling apply_and_destroy().
   *
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor will be disposed.
   *
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  static apply_and_destroy_MobileNetV2( inputTensor ) {
    let t, tNew;

    // Step 0.
    t = this.step0.apply_and_destroy( inputTensor );
    inputTensor.dispose();          // Dispose all intermediate (temporary) data.

    // Step 1, 2, 3, ...
    let step;
    for ( let i = 0; i < this.steps1After.length; ++i ) {
      step = this.steps1After[ i ];
      tNew = step.apply_and_destroy( t );
      t.dispose();                  // Dispose all intermediate (temporary) data.
      t = tNew;
    }

    return t;
  }

}
