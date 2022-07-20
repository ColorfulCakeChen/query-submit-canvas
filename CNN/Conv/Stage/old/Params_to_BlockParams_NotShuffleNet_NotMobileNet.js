

//!!! ...unfinished... (2022/05/01) NotShuffleNet_NotMobileNet should be deprecated.

/** Provide parameters for pure depthwise-pointwise convolutions.
 *
 * This configuration is similar to MobileNetV2 but with ( depthwiseStridesPad == ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID (0) ),
 * automatic block count, varing depthwiseFilterHeight, depthwiseFilterWidth, bias-activation at pointwise2 (not at depthwise),
 * and without add-input-to-output.
 *
 * Since it is similar to MobileNetV2, its performance could be compared to MobileNetV2 more eaily. Interestingly,
 * it is usually slower than MobileNetV2. The reason might be MobileNetV2's block0 uses
 * ( depthwiseStridesPad == ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME (2) ).
 * This shrinks ( height, width ) quickly so that data are reduced a lot.
 *
 */
Params.to_BlockParams.NotShuffleNet_NotMobileNet = class extends Params.to_BlockParams.MobileNetV2 {

  /**
   * Compute how many block shoud be used and what is the last block's depthwise filter size, when shrink sourceHeight to outputHeight
   * by depthwise convolution with ( strides = 1, pad = "valid" ).
   *
   * The this.blockCount will be at least 1 (never 0).
   * The this.depthwiseFilterHeight_Last will be at least 1 (at most this.stageParams.depthwiseFilterHeight).
???
   * The this.depthwiseFilterWidth_Last will be at least 2 (at most this.stageParams.depthwiseFilterWidth).
   *
   * @override
   */
  determine_blockCount_depthwiseFilterHeightWidth_Default_Last() {
    super.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(); // Got default value.

    let stageParams = this.stageParams;

//!!! ...unfinished... (2022/04/29) What if height and width need different block count?

    let differenceHeight = stageParams.sourceHeight - stageParams.outputHeight;
    //let differenceWidth =  stageParams.sourceWidth  - stageParams.outputWidth;

    if ( 0 == differenceHeight ) { // 1. No difference between source and output size.
      this.blockCount = 1; // Only one block is needed. (Avoid no blocks. At least, there should be one block.)

//!!! ...unfinished... (2022/04/29)
// depthwiseFilterWidth is at least 2.
// The only way to keep image size in ( depthwiseStridesPad == 0 ) seems no depthwise convolution.

      // The only one block (also the first and last block) should use filter size 1x1 so that the input size could be kept.
      this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = 1;

    } else {

      // Since difference between source and output exists, the filter size should be larger than 1x1.
      if ( this.depthwiseFilterHeight_Default <= 1 )
        this.depthwiseFilterHeight_Default = 2; // Otherwise, the image size could not be shrinked.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerBlock = this.depthwiseFilterHeight_Default - 1;

      // The possible block count for reducing sourceHeight to outputHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      //
      // This value may be less than real block count because the filter size of the last block may be larger than its input.
      let blockCountCandidate = Math.floor( differenceHeight / heightReducedPerBlock );

      let differenceHeightLast = differenceHeight - ( blockCountCandidate * heightReducedPerBlock ); // The last block should reduce so many height.
      if ( 0 == differenceHeightLast ) {
        // 2. The original depthwiseFilterHeight could achieve the output size at the last block. 
        this.blockCount = blockCountCandidate; // It is the real block count.
        this.depthwiseFilterHeight_Last = this.depthwiseFilterHeight_Default; // The last block uses the default depthwise filter size is enough.

      } else {

        // 3. The original depthwiseFilterHeight could not achieve the output size at the last block.
        //    It is larger than the last block's input size. An extra block with a smaller filter size is needed.
        this.blockCount = blockCountCandidate + 1; // Needs one more block.

        // The extra last block's depthwise filter size should just eliminate the last diffference.
        this.depthwiseFilterHeight_Last = differenceHeightLast + 1;
      }
    }
  }

//!!! ...unfinished... (2022/04/29)
// Perhaps, former blocks original channel count, latter blocks twice channel count (by channelMultiplier = 2 ).
// Performance may be better.

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // Almost the same as MobileNetV2.

    let stageParams = this.stageParams;
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID; // In NotShuffleNet_NotMobileNet, always ( strides = 1, pad = "valid" ).

    // In NotShuffleNet_NotMobileNet, depthwise convolution doesn't have activation.
    //
    // Because NotShuffleNet_NotMobileNet does not have add-input-to-output (different from MobileNetV2), its pointwise2 should
    // have bias and activation. Otherwise, the pointwise2 and the pointwise1 of the next block will become one (not two) affine
    // transformation.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.bDepthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    // In NotShuffleNet_NotMobileNet, all blocks' pointwise21 always has bias and activation.
    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = stageParams.nActivationId;
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0() {
    super.configTo_beforeBlockN_exceptBlock0(); // Almost the same as MobileNetV2.

    // In NotShuffleNet_NotMobileNet:
    //   - All blocks (include block0) without add-input-to-output (and without concatenation).
    //   - All blocks (include block0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID; // In NotShuffleNet_NotMobileNet, always ( strides = 1, pad = "valid" ).
  }

}
