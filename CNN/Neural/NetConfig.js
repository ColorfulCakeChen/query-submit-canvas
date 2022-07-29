export { NetConfig_Base as Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as ConvStage from "../Conv/Stage.js";


//!!! ...unfinished... (2021/10/07)
/**
 * How to let stage generate more channels?
 * (For example, for letting the extra output channel combined into the input of the next run.)
 *
 * 1. Input larger ( height, width ).
 *
 *    Problem: This may slower the computation speed.
 *
 *
 * 2. Use Embedding2d to let depth of input become larger.
 *
 *    Problem: This may slower the computation speed in backend CPU and WASM. (In WEBGL, it still is fast.)
 *
 *
 * 3. Use more stages.
 *
 *    Problem: The extra stages will all operate at input ( height, width ) = ( 1, 1 ).
 *
 *
 * 4. Let Stage have parameter extraOutputChannelCountRate.
 *
 *    The outputChannelCount will always be even (i.e. ( 2 * extraOutputChannelCountRate ) ) because ShuffleNetV2 should
 *    always double the channel count at least.
 *
 *
 * 5. Let Stage have parameter bHalveHeightWidth.
 *
 *    If ( bHalveHeightWidth == false ), Stage will keep the ( height, width ) of output the same as input.
 *    Problem1: Stage_NotShuffleNet_NotMobileNet will have only one block in this case.
 *    Problem2: How does Neural.Net determine which stage should or shoud not halve the ( height, width )?
 *
 *
 */ 



//!!! ...unfinished... (2021/08/13) Define:
// class NotShuffleNet_NotMobileNet
// class ShuffleNetV2
// class MobileNet


//!!! ...unfinished... (2021/08/17) should compare performance of:
//   - depthwise-pointwise-bias-activation
//   - pointwise1-bias1-activation-depthwise-pointwise2-bias2-activation.
//
// Why need pointwise1-bias-activation? That is, the pointwise1ChannelCountRate should always 0.
// Since depthwise-pointwise2-bias2-activation is complete (Note: the bias2 is important).
//



/**
 * The base class for neural network's configuration.
 *
 * A special recommended configuration is 3x3 ShuffleNetV2 without explicit bias (but with implicit bias by SIGMOID
 * activation) and without activation at the end of every stage:
 *   - bChannelShuffler: true
 *   - pointwise1ChannelCountRate: 1

//!!! ...unfinished... (2021/08/11) should be removed.
// *   - strAvgMaxConv: "Conv"

 *   - depthwiseFilterHeight: 3

//!!! ...unfinished... (2021/08/11) should be removed.
// *   - depthwiseChannelMultiplierStage0Block0: 1

 *   - bBias: false
 *   - nActivationId: ValueDesc.ActivationFunction.Singleton.Ids.SIGMOID
 *   - nActivationIdAtStageEnd: ValueDesc.ActivationFunction.Singleton.Ids.NONE
 *
 *
 * 1. The bias operation
 *
 * The bias operation (i.e. tf.add()) is very important. Without bias, the affine transformation could not be completed.
 * If the activation function is called before bias has been added, the input's information might be destroyed by the
 * non-linearity of the activation function.
 *
 *
 * 1.1 Explicit bias
 *
 * By specifying ( bBias = true ), the configuration will have bias operations. For example:
 *   - pointwise1-bias-activation-depthwise-pointwise2-bias-activation
 *
 * However, the execution speed of bias operation seems slow. This is especially true when tf.add() with broadcasting by CPU.
 *
 *
 * 1.2 Implicit bias: from zero to non-zero
 *
 * Fortunately, in modern deep neural network, there is a possibility to achieve implicit bias. Because deep neural network
 * has multiple layers, the former layer's linear transformation (i.e. scale) could become the latter layer's bias basis by
 * using scale 0 and specific activation function.
 * 
 * No matter depthwise or pointwise convolution (just many multiply and add), it is easy to generate constant 0 (i.e. just
 * multiply input by weiht 0). It, however, is hard to generate non-zero constant (e.g. 1). Only non-zero constant could
 * become the bias basis. The opportunity to generate non-constant is by activation function.
 *
 * Not every kinds of activation function could acheive this task. The SIGMOID (and SOFTPLUS) are good at this job, because
 * the following reasons:
 *
 *   - They has non-zero y-intercept (the result value when input is zero). ( SIGMOID( 0 ) = 0.5, SOFTPLUS( 0 ) ~= 0.6931 )
 *       This definitely transforms zero to non-zero (so that as an implicit bias basis for latter layer's affine transformation).
 *
 *   - They are strictly increasing or strictly descreaing (i.e. strinctly monotone) near the origin (i.e. near the ( x = 0 ) ).
 *       When its input is just linear transformed (not yet affine transformed, i.e. only scaled not yet biased), this property
 *       provides the possibility to keep the input's linearity so that it could continue to complete its affine transformation
 *       after the activation function. Otherwise (e.g. COSine function), the input's information might be destroyed forcibly
 *       because it has not yet been affine transformed.
 *
 * So, by specifying ( bBias = false ) and ( nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.SIGMOID ), the
 * configuration will have implicit bias.
 *
 * Note: When using back-propagation as learning method, SIGMOID may have some drawback. Using SOFTPLUS could avoid the issue.
 * Using other learning method is also as possible solution.
 *

//!!! ...unfinished… (2021/08/13)
// 即使輸入給 depthwise 的資料中，某個頻道全部都是相同的常數值，在 pad = same 時，邊緣位置的資料會有 padded 0 值參與卷積。
// 導致邊緣位置的卷積結果，與其他位置的值不同，因而無法維持該頻道是固定的常數值。

 * For example, in configuration pointwise1-SIGMOID-depthwise-pointwise2-activation:
 *   - pointwise1-SIGMOID
 *     - If there is a weight-set ( 0, 0, ..., 0 ), it produces a channel with all value 0.
 *     - Using activation SIGMOID so that 0 will become 0.5. This will provide a constant term (i.e. bias basis) for pointwise2.
 *   - depthwise
 *     - If there is a filter with non-all-zero weight-set, the 0.5 (provided by pointwise1's 0 weights and SIGMOID) might be
 *         manipulated to other value. But it's still a non-zero constant value (i.e. its value is not related to pointwise1's input).
 *     - Although the non-zero constant could not be utilized by the depthwise itself, it could be past to pointwise2 by using
 *         NONE or other appropriate activation function.
 *   - pointwise2-activation
 *     - The constant value (provided by pointwise1's 0 weights and SIGMOID and depthwise's filter) is just like a bias basis.
 *     - This completes an affine transformation. The activation funtction could achieve great expressiveness.
 *
 * For another example, in configuration depthwise-SIGMOID-pointwise2-activation:
 *   - depthwise-SIGMOID
 *     - If there is a filter with all-zero weight-set ( 0, 0, ..., 0 ), it produces a channel with all value.
 *     - Using activation SIGMOID so that 0 will become 0.5. This will provide a constant term (i.e. bias basis) for pointwise2.
 *     - Although the non-zero constant could not be utilized by the depthwise itself, it could be past to pointwise2.
 *   - pointwise2-activation
 *     - The constant value (provided by depthwise's 0 filter weights and SIGMOID) is just like a bias basis.
 *     - This completes an affine transformation. The activation funtction could achieve great expressiveness.
 *
 *
 * 2. Channel Count
 *
 * In addition, the recommended sourceChannelCount is 4. This is because source image is usually generated by tf.browser.fromPixels() and
 * it handles RGBA 4 channels faster than RGB 3 channels.
 *
 *
 * 3. The final activation function
 *
 * The last block's pointwise2 of every stage without activation function
 * (i.e. nActivationIdAtStageEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE) could let the output of neural network be any
 * arbitrary value because it will not be restricted by the range of the activation function.
 *
 */
class NetConfig_Base {
  /**
   * @param {number} depthwiseChannelMultiplierStage0Block0
   *   The depthwise convolution of the first block (Block 0) of the first stage (Stage 0) will expand input channel by this factor.
   *
   * @see ConvStage.Base.init 
   */
  constructor(
    sourceHeight, sourceWidth, sourceChannelCount = 4,
    blockCountPerStage,
    bChannelShuffler = true,
    pointwise1ChannelCountRate = 1,
    strAvgMaxConv = "Conv", depthwiseFilterHeight = 3, depthwiseChannelMultiplierStage0Block0 = 1, bBias = false,
    nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.COS,
    nActivationIdAtStageEnd = ValueDesc.ActivationFunction.Singleton.Ids.NONE )
  {
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;
    this.blockCountPerStage = blockCountPerStage;
    this.bChannelShuffler = bChannelShuffler;
    this.pointwise1ChannelCountRate = pointwise1ChannelCountRate;
    this.strAvgMaxConv = strAvgMaxConv;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseChannelMultiplierStage0Block0 = depthwiseChannelMultiplierStage0Block0;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nActivationIdAtStageEnd = nActivationIdAtStageEnd;

    this.sourceHeightWidth = [ this.sourceHeight, this.sourceWidth ];
  }

  /**
   * @param {ImageData|HTMLCanvasElement} source_ImageData_or_Canvas
   *   The image or canvas which provides image.
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will guaranteed to be int32.
   * Otherwise, the dtype of the returned tf.tensor3d may be int32 or float32 (if
   * resized). This is useful if the result will be used by an embedding layer
   * (which only accepts integer input).
   *
   * @return {tf.tensor3d}
   *   Return the tensor3d which is the scaled image from canvas. Its size will
   * be this.sourceImageHeightWidth. Its channel count will be this.config.sourceChannelCount.
   */
  create_ScaledSourceTensor_from_ImageData_or_Canvas( source_ImageData_or_Canvas, bForceInt32 ) {

    let sourceTensor = tf.browser.fromPixels( source_ImageData_or_Canvas, this.sourceChannelCount ); // dtype will be int32.

    // If the size (height x width) is as expected, use it directly. (dtype will still be int32.)
    if (   ( sourceTensor.shape[ 0 ] == this.sourceHeight )
        && ( sourceTensor.shape[ 1 ] == this.sourceWidth  ) )
      return sourceTensor;

    // Otherwise, resize to the default size (height x width) which is the input
    // image size used for training the neural network.
    //
    // ( alignCorners = true ) for visual image resizing.
    let scaledSourceTensorFloat32;
    try {
      scaledSourceTensorFloat32 = tf.image.resizeBilinear( sourceTensor, this.sourceHeightWidth, true );
    } catch ( e ) {
      throw e; // e.g. out of (GPU) memory.
    } finally {
      sourceTensor.dispose();
    }

    if ( !bForceInt32 )
      return scaledSourceTensorFloat32;

    // Convert to int32 if necessary. (Because the tf.resize() result's dtype is float32.)
    try {
      let scaledSourceTensorInt32 = scaledSourceTensorFloat32.cast( 'int32' );
      return scaledSourceTensorInt32;
    } catch ( e ) {
      throw e; // e.g. out of (GPU) memory.
    } finally {
      scaledSourceTensorFloat32.dispose();
    }
  }

  /** The channel count of the first stage (Stage 0). */
  get channelCountStage0() {
    return this.sourceChannelCount * this.depthwiseChannelMultiplierStage0Block0;
  }

}
