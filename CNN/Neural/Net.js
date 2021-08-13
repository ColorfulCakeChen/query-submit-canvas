export { Config, Base };

//import * as NetProgress from "./NetProgress.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ConvBlock from "../Conv/Block.js";


//!!! ...unfinished... (2021/08/11)
// A depthwise-pointwise pair is a complete (cubic) convolution.
// depthwise-pointwise-bias-COS is more like Fourier series.
// Compare it to depthwise-COS-pointwise-COS (no bias but two COS) about speed and accuracy.
//

//!!! ...unfinished... (2021/08/11)
    // Rule: Before bias is added, the activation function should not be called. Otherwise, information might be destroy by the activation function.


/**
 * A neural network's configuration.
 *
 * A special recommended configuration is 3x3 ShuffleNetV2 without explicit bias (but with implicit bias by cosine activation)
 * and without activation at the end of every block:
 *   - bChannelShuffler: true
 *   - pointwise1ChannelCountRate: 1

//!!! ...unfinished... (2021/08/11) should be removed.
// *   - strAvgMaxConv: "Conv"

 *   - depthwiseFilterHeight: 3

//!!! ...unfinished... (2021/08/11) should be removed.
// *   - depthwiseChannelMultiplierBlock0Step0: 1

 *   - bBias: false

//!!! ...unfinished... (2021/08/12)
// *   - nActivationId: ValueDesc.ActivationFunction.Singleton.Ids.COS
 *   - nActivationId: ValueDesc.ActivationFunction.Singleton.Ids.SIGMOID
 *   - nActivationId: ValueDesc.ActivationFunction.Singleton.Ids.SOFTPLUS
 *   - nActivationIdAtBlockEnd: ValueDesc.ActivationFunction.Singleton.Ids.NONE
 *
 *
 * 1. The bias operation
 *

//!!! ...unfinished... (2021/08/13)

 *
 * The bias (e.g. tf.add()) is important. Without bias, the affine transformation could not be completed. The execution speed of
 * bias, however, seems slow (especially when tf.add() with broadcasting). Fortunately, in modern deep neural network, there is
 * a possibility to achieve implicit bias. Because deep neural network has multiple layers, the former layer's linear
 * transformation (i.e. scale) could become the latter layer's bias basis by using scale 0 and specific activation function.
 *
 *
 * 1.1 Scale 0
 *
 * No matter depthwise or pointwise convolution, it is easy to generate constant 0 (i.e. just multiply input by weiht 0). It,
 * however, is hard to generate constant 1 (which is the bias basis). If  
 *
 *
 * SIGMOID (or SOFTPLUS) is a good activation function.
 *
 *   - It has non-zero y-intercept (the result value when input is zero). ( SIGMOID( 0 ) = 0.5, SOFTPLUS( 0 ) ~= 0.6931 )
 *       This could become an implicit bias basis for affine transformation.
 *
 *   - It is strictly increasing or strictly descreaing (i.e. strinctly monotone) near the origin (i.e. near the ( x = 0 ) ).
 *       When its input is just linear transformed (not yet affine transformed, i.e. only scaled not yet biased), this property
 *       provides the possibility to keep the input's linearity so that it could continue to complete its affine transformation
 *       after the activation function. Otherwise (e.g. COSine function), the input's information might be destroyed forcibly
 *       because it has not yet been affine transformed.
 *

 * The kernel idea is:
 *   - A depthwise-pointwise pair is a complete (cubic) convolution.
 *   - The depthwise-pointwise-bias-COS combination is more like Fourier series.
 *
 * The bias operation (which is not seen in most neural network architecture) is very important (in my opinion). Without it, the Fourier
 * series is not established. Its execution speed, however, is poor. (This might be the reason why most neural network architecture do
 * not use it.)
 *
 *
 * 1.1 COS as implicit bias
 *
 * The cosine activation function can achieve impilcit bias. This is because depthwise and pointwise convolution can easily achieve zero
 * and ( cos( 0 ) == 1 ). A constant value (e.g. 1) becomes the bias of the next convolution. So there is not necessary to use explicit
 * bias which has worse performance (than without it).
 *
 * For example, in ShuffleNetV2 ( ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 1 ) and ( bBias == false ) ):
 *   - pointwise1
 *     - If there is a weights ( 0, 0, ..., 0 ), it produces a term's value as 0.
 *     - Using activation COS so that 0 will become 1. This will provide a constant (i.e. bias) term for pointwise2.
 *     - Problem: COS without bias will destroy some information!
 *   - depthwise
 *     - The 1 (provided by pointwise1's 0 weights and COS) might be manipulated to other value by filters. But it's still a
 *         constant value (i.e. its value is not related to pointwise1's input).
 *     - Using activation NONE (ShuffleNetV2's design). This also lets depthwise-pointwise2 compose a complete (cubic) convolution.
 *   - pointwise2
 *     - The constant value (provided by pointwise1's 0 weights and COS and depthwise's filter) is just like a bias term.
 *     - Using activation COS (ShuffleNetV2's design) or NONE (at the block's last step).
 *     - The depthwise-pointwise-bias-COS is just like Fourier series although the bias is implicit.
 *

//!!! ...unfinished... (2021/08/11)
// It seems that TANH, SIGMOID, RELU6 could achieve implicit bias.
//   - Multiplied by large scale.
//   - Than, TANH.
//   - Problem: Three possible values: -1 or 0 or +1. This is not a usable bias which should always the same one (not three) constant.
//
// Another possible:
//   - Multiplied by input self. (i.e. power 2)
//   - Then, TANH.
//   - Problem1: Power2 destroy some information (just like COS do).
//   - Problem2: Thwo possible values: 0 or +1. This is not a usable bias which should always the same one (not two) constant.
//

//!!! ...unfinished... (2021/08/11)

 *
 * 1.2 Explicit bias
 *
 * However, the above design might encounter some problems. Because the pointwise1 itself does not have bias, there is a dangerous
 * that its activation COS might destroy information. For function SIN, the linear relationship could be kept without bias. For
 * functnion COS, however, the linear relationship of negative input value will always be destroyed when no bias.
 *
 * In my opinion, it may be better in ShuffleNetV2 ( ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 0 ) and ( bBias == true ) ):
 *   - Remove pointwise1 (i.e. ( pointwise1ChannelCountRate == 0 ) ).
 *   - Let pointwise2 have explicit bias (i.e. ( bBias == true ) ).
 *
 * The execution speed which is lowered by the pointwise2's bias could be compensated by the removed pointwise1.
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
 * The last PointDepthPoint's pointwise2 of every block without activation function
 * (i.e. nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE) could let the output of neural network be any
 * arbitrary value because it will not be restricted by the range of the activation function.
 */
class Config {
  /**
   * @param {number} depthwiseChannelMultiplierBlock0Step0
   *   The depthwise convolution of the first step (Step 0) of the first block (Block 0) will expand input channel by this factor.
   *
   * @see ConvBlock.Base.init 
   */
  constructor(
    sourceHeight, sourceWidth, sourceChannelCount = 4,
    stepCountPerBlock,
    bChannelShuffler = true,
    pointwise1ChannelCountRate = 1,
    strAvgMaxConv = "Conv", depthwiseFilterHeight = 3, depthwiseChannelMultiplierBlock0Step0 = 1, bBias = false,
    nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.COS,
    nActivationIdAtBlockEnd = ValueDesc.ActivationFunction.Singleton.Ids.NONE )
  {
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;
    this.stepCountPerBlock = stepCountPerBlock;
    this.bChannelShuffler = bChannelShuffler;
    this.pointwise1ChannelCountRate = pointwise1ChannelCountRate;
    this.strAvgMaxConv = strAvgMaxConv;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseChannelMultiplierBlock0Step0 = depthwiseChannelMultiplierBlock0Step0;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nActivationIdAtBlockEnd = nActivationIdAtBlockEnd;

    this.sourceHeightWidth = [ this.sourceHeight, this.sourceWidth ];
  }

  /**
   * @param {ImageData|HTMLCanvasElement} source_ImageData_or_Canvas
   *   The image or canvas which provides image.
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will guaranteed to be int32. Otherwise, the dtype of the returned tf.tensor3d
   * may be int32 or float32 (if resized). This is useful if the result will be used by an embedding layer (which only accepts
   * integer input).
   *
   * @return {tf.tensor3d}
   *   Return the tensor3d which is the scaled image from canvas. Its size will be this.sourceImageHeightWidth. Its channel count
   * will be this.config.sourceChannelCount.
   */
  create_ScaledSourceTensor_from_ImageData_or_Canvas( source_ImageData_or_Canvas, bForceInt32 ) {

    let sourceTensor = tf.browser.fromPixels( source_ImageData_or_Canvas, this.sourceChannelCount ); // dtype will be int32.

    // If the size (height x width) is as expected, use it directly. (dtype will still be int32.)
    if (   ( sourceTensor.shape[ 0 ] == this.sourceHeight )
        && ( sourceTensor.shape[ 1 ] == this.sourceWidth  ) )
      return sourceTensor;

    // Otherwise, resize to the default size (height x width) which is the input image size used for training the neural network.
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

    if ( !bForceInt32 ) {
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

  /** The channel count of the first block (Block 0). */
  get channelCountBlock0() {
    return this.sourceChannelCount * this.depthwiseChannelMultiplierBlock0Step0;
  }

}

/**
 * A neural network composes of multiple blocks.
 *
 *
 *
 * @member {Config} config
 *   This neural network's configuration.
 *
 * @member {string} structure
 *   A string denote this neural network's structure (configuration).
 *
 * @member {number} totalChannelExpansionFactor
 *   The final output of this neural network will have ( totalChannelExpansionFactor * sourceChannelCount ) channel count.
 *
 * @member {number[]} sourceImageHeightWidth
 *   The size (i.e. [ height, width ]) of the source image. When apply_and_destroy_or_keep() is called, the input tensor should be this size.
 */
class Base {

  /**
   * @param {Config} config
   *   The configuration of this neural network.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep).
   *
   * @see ConvBlock.Base.init
   */
  init( config, bKeepInputTensor ) {

    this.disposeTensors();

    this.config = config;
    this.bKeepInputTensor = bKeepInputTensor;

    let targetHeight = 1; // The final output always has ( height x width ) = ( 1 x 1 ), i.e. only one pixel per channel.

    let differenceHeight = config.sourceHeight - targetHeight;
//    let filterWidth = depthwiseFilterHeight;

//  this.depthwiseChannelMultiplierBlock0Step0 = depthwiseChannelMultiplierBlock0Step0;
//    this.channelCountBlock0 = config.sourceChannelCount * config.depthwiseChannelMultiplierBlock0Step0;  // the channel count of the first block (Block 0).

    if ( config.stepCountPerBlock <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerBlock = config.depthwiseFilterHeight - 1;

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerBlock );

      // Channel count only be expanded by channel multiplier of depthwise convolution of step 0 of block 0.
      this.totalChannelExpansionFactor = config.depthwiseChannelMultiplierBlock0Step0;

    } else {  // ShuffleNetV2 or MobileNetV2. Halven per block.

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
//      this.blockCount = Math.floor( Math.log2( sourceHeight ) );
      this.blockCount = Math.ceil( Math.log2( config.sourceHeight ) );

//!!! wrong
//       // Channel count is expanded both by channel multiplier of depthwise convolution of step 0 of block 0
//       // and by every block (half height x width and double channel count).
//       this.totalChannelExpansionFactor = depthwiseChannelMultiplierBlock0Step0 * Math.pow( 2, this.blockCount );

      // Channel count is expanded by every block (half height x width and double channel count).
      this.totalChannelExpansionFactor = Math.pow( 2, this.blockCount );
    }

    let nextBlockInputChannelCount = config.sourceChannelCount;
    let nextBlockDepthwiseChannelMultiplier = config.depthwiseChannelMultiplierBlock0Step0; // Only block 0 can have ( depthwise channel multiplier > 1 ).

    let nextKeepInputTensor = bKeepInputTensor; // Only step 0 may or may not keep the input tensor according to caller's necessary.

    this.blocks = new Array( this.blockCount );
    for ( let i = 0; i < this.blockCount; ++i )
    {
      let block = new ConvBlock.Base();
      block.init(
//!!! ...unfinished... (2021/04/10) Every block's input image size (height * width * channelCount) should be different.
// It should depend on the output image size of the previous block.
        config.sourceHeight, config.sourceWidth, nextBlockInputChannelCount,
        config.stepCountPerBlock,
        config.bChannelShuffler,
        config.pointwise1ChannelCountRate,
        config.strAvgMaxConv, config.depthwiseFilterHeight, nextBlockDepthwiseChannelMultiplier, config.bBias, config.nActivationId,
        config.nActivationIdAtBlockEnd,
        nextKeepInputTensor
      );

      this.blocks[ i ] = block;
      nextBlockInputChannelCount = block.outputChannelCount; // Using previous block's output channel count as next block's input channel count.
      nextBlockDepthwiseChannelMultiplier = 1;               // Except block 0, all other blocks' depthwise channel multiplier should be 1.
      nextKeepInputTensor = false;                           // All blocks (except block 0) should not keep (and should dispose) the input tensor.
    }

    let block0 = this.blocks[ 0 ];
    {
      let step0 = block0.step0;
      let stepLast = block0.stepLast;

      // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
      this.structure = `C${config.sourceChannelCount}_${config.channelCountBlock0}`

        + `${ ( step0.bPointwise1 ) ? "__PConv1(x" + config.pointwise1ChannelCountRate + ")" : "" }`
        + `${ ( step0.bPointwise1 && step0.bPointwise1Bias ) ? ( "_PBias1" ) : "" }`
        + `${ ( step0.bPointwise1 && step0.pointwise1ActivationFunction ) ? ( "_" + step0.pointwise1ActivationName ) : "" }`

        + `${ ( step0.bDepthwise ) ? `__D${config.strAvgMaxConv}_${config.depthwiseFilterHeight}x${config.depthwiseFilterHeight}` : "" }`
        + `${ ( step0.bDepthwise && step0.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
//!!! (2021/03/10 Remarked)
//        + `${ ( step0.bDepthwise && step0.depthwiseActivationFunction ) ? ( "_" + config.strActivationName ) : "" }`
        + `${ ( step0.bDepthwise && step0.depthwiseActivationFunction ) ? ( "_" + step0.depthwiseActivationName ) : "" }`

        + `${ ( step0.bPointwise2 ) ? "__PConv2" : "" }`
        + `${ ( step0.bPointwise2 && step0.bPointwise2Bias ) ? ( "_PBias2" ) : "" }`
        + `${ ( step0.bPointwise2 && step0.pointwise2ActivationFunction ) ? ( "_" + step0.pointwise2ActivationName ) : "" }`

        // If there are more (than 1) steps, show the activation function name (if exists) of the last step.
        //
        // Note: Is it possible that a step does not have the pointwise2 convolution?
        // Although the Conv/PointDepthPoint.js might have no pointwise2 convolution, the Conv/Block.js always has pointwise2 convolution.
        // So, the last activation function always is the activation function of the last step's pointwise2 convolution.
        + `${ ( config.stepCountPerBlock > 1 )
                ? ( ( stepLast.bPointwise2 && stepLast.pointwise2ActivationFunction )
                     ? ( "_" + stepLast.pointwise2ActivationName )
                     : "_NoLastActivation" )
                : "" }`

        + `__${this.blockCount}_Block`
        + `__${config.stepCountPerBlock}_Step`
        + `${ ( config.bChannelShuffler ) ? "__Shuffle" : ( ( config.stepCountPerBlock > 0 ) ? "__AddInput" : "" ) }`
        //+ `${ ( bKeepInputTensor ) ? "__KeepInput" : "" }`
      ;
    }

    this.sourceImageHeightWidth = [ block0.sourceHeight, block0.sourceWidth ];
  }

  disposeTensors() {
    if ( this.blocks ) {
      for ( let i = 0; i < this.blocks.length; ++i ) {
        let block = this.blocks[ i ];
        block.disposeTensors();
      }
      this.blocks = null;
    }
  }

  /**
   *
   * @param {tf.tensor3d} inputTensor
   *   The image which will be processed. This inputTensor may or may not be disposed according to init()'s bKeepInputTensor.
   * Its size should be this.sourceImageHeightWidth.
   *
   * @param {boolean} bReturn
   *   If true, the result tensor will be returned. Otherwise, the result tensor will be disposed.
   *
   * @return {tf.tensor3d}
   *   If ( bReturn == true ), return the result (new) tensor. If ( bReturn == false ), the result tensor will be disposed and nothing
   * will be returned. No matter in which case, all other intermediate tensors were disposed.
   */
  apply_and_destroy_or_keep( inputTensor, bReturn ) {
    let t = inputTensor;

    let block;
    for ( let i = 0; i < this.blocks.length; ++i ) {
      block = this.blocks[ i ];
      t = block.apply_and_destroy_or_keep( t );
    }

    if ( bReturn )
      return t;
    else
      t.dispose();
  }

}
