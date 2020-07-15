import * as ShuffleNetV2_MobileNetV2_Block from "../Layer/ShuffleNetV2_MobileNetV2_Block.js";

export { Base };

/**
 * A neural network composes of multiple blocks.
 *
 * A special recommended configuration is 3x3 ShuffleNetV2 without (explicit) bias:
 *   - bChannelShuffler: true
 *   - pointwise1ChannelCountRate: 1
 *   - strAvgMaxConv: "Conv"
 *   - depthwiseFilterHeight: 3
 *   - depthwiseChannelMultiplierBlock0Step0: 1
 *   - bBias: false
 *   - strActivationName: "cos"
 *
 * The cosine activation function can achieve impilcit bias. This is because depthwise and pointwise convolution can easily achieve zero
 * and ( cos( 0 ) == 1 ). A constant value (e.g. 1) becomes an bias of the next convolution. So there is not necessary to use explicit bias
 * which has worse performance (than without it).
 *
 *
 *
 * @member {string} structure
 *   This neural network's structure.
 *
 * @member {number} totalChannelExpansionFactor
 *   The final output of this neural network will have ( totalChannelExpansionFactor * sourceChannelCount ) channel count.
 *
 * @member {number[]} sourceImageHeightWidth
 *   The size (i.e. [ height, width ]) of the source image. When apply_and_destroy_or_keep() is called, the input tensor should be this size.
 */
class Base {

  /**
   * @param {number} depthwiseChannelMultiplierBlock0Step0
   *   The depthwise convolution of the first step (Step 0) of the first block (Block 0) will expand input channel by this factor.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep).
   *
   * @see ShuffleNetV2_MobileNetV2_Block.init 
   */
  init(
    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName,
    bKeepInputTensor
  ) {

    this.disposeTensors();

    this.sourceChannelCount = sourceChannelCount;
    this.stepCountPerBlock = stepCountPerBlock;
    this.bChannelShuffler = bChannelShuffler;
    this.pointwise1ChannelCountRate = pointwise1ChannelCountRate;
    this.bKeepInputTensor = bKeepInputTensor;

    let targetHeight = 1; // The final output always has ( height x width ) = ( 1 x 1 ), i.e. only one pixel per channel.

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = depthwiseFilterHeight;

    this.depthwiseChannelMultiplierBlock0Step0 = depthwiseChannelMultiplierBlock0Step0;
    this.channelCountBlock0 = sourceChannelCount * depthwiseChannelMultiplierBlock0Step0;  // the channel count of the first block (Block 0).

    if ( stepCountPerBlock <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerBlock = depthwiseFilterHeight - 1;

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerBlock );

      // Channel count only be expanded by channel multiplier of depthwise convolution of step 0 of block 0.
      this.totalChannelExpansionFactor = depthwiseChannelMultiplierBlock0Step0;

    } else {  // ShuffleNetV2 or MobileNetV2. Halven per block.

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
//      this.blockCount = Math.floor( Math.log2( sourceHeight ) );
      this.blockCount = Math.ceil( Math.log2( sourceHeight ) );

//!!! wrong
//       // Channel count is expanded both by channel multiplier of depthwise convolution of step 0 of block 0
//       // and by every block (half height x width and double channel count).
//       this.totalChannelExpansionFactor = depthwiseChannelMultiplierBlock0Step0 * Math.pow( 2, this.blockCount );

      // Channel count is expanded by every block (half height x width and double channel count).
      this.totalChannelExpansionFactor = Math.pow( 2, this.blockCount );
    }

    let nextBlockInputChannelCount = sourceChannelCount;
    let nextBlockDepthwiseChannelMultiplier = depthwiseChannelMultiplierBlock0Step0; // Only block 0 can have ( depthwise channel multiplier > 1 ).

    let nextKeepInputTensor = bKeepInputTensor; // Only step 0 may or may not keep the input tensor according to caller's necessary.

    this.blocks = new Array( this.blockCount );
    for ( let i = 0; i < this.blockCount; ++i )
    {
      let block = new ShuffleNetV2_MobileNetV2_Block.Base();
      block.init(
        sourceHeight, sourceWidth, nextBlockInputChannelCount,
        stepCountPerBlock,
        bChannelShuffler,
        pointwise1ChannelCountRate,
        strAvgMaxConv, depthwiseFilterHeight, nextBlockDepthwiseChannelMultiplier, bBias, strActivationName,
        nextKeepInputTensor
      );

      this.blocks[ i ] = block;
      nextBlockInputChannelCount = block.outputChannelCount; // Using previous block's output channel count as next block's input channel count.
      nextBlockDepthwiseChannelMultiplier = 1;               // Except block 0, all other blocks' depthwise channel multiplier should be 1.
      nextKeepInputTensor = false;                           // All blocks (except block 0) should not keep (and should dispose) the input tensor.
    }

    let block0 = this.blocks[ 0 ];

    // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
    this.structure = `C${sourceChannelCount}_${this.channelCountBlock0}`

      + `${ ( block0.step0.bPointwise1 ) ? "__PConv1(x" + pointwise1ChannelCountRate + ")" : "" }`
      + `${ ( block0.step0.bPointwise1 && block0.step0.bPointwise1Bias ) ? ( "_PBias1" ) : "" }`
      + `${ ( block0.step0.bPointwise1 && block0.step0.pointwise1ActivationFunction ) ? ( "_" + block0.step0.pointwise1ActivationName ) : "" }`

      + `${ ( block0.step0.bDepthwise ) ? `__D${strAvgMaxConv}_${depthwiseFilterHeight}x${depthwiseFilterHeight}` : "" }`
      + `${ ( block0.step0.bDepthwise && block0.step0.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
      + `${ ( block0.step0.bDepthwise && block0.step0.depthwiseActivationFunction ) ? ( "_" + strActivationName ) : "" }`

      + `${ ( block0.step0.bPointwise2 ) ? "__PConv2" : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.step0.bPointwise2Bias ) ? ( "_PBias2" ) : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.step0.pointwise2ActivationFunction ) ? ( "_" + block0.step0.pointwise2ActivationName ) : "" }`

      + `__Block_${this.blockCount}`
      + `__Step_${stepCountPerBlock}`
      + `${ ( bChannelShuffler ) ? "__Shuffle" : ( ( stepCountPerBlock > 0 ) ? "__AddInput" : "" ) }`
      //+ `${ ( bKeepInputTensor ) ? "__KeepInput" : "" }`
    ;

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
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor may or may not be disposed according to the init()'s bKeepInputTensor.
   * Its size should be this.sourceImageHeightWidth.
   *
   * @param {boolean} bReturn
   *   If true, the result tensor will be returned. Otherwise, the result tensor will be disposed.
   *
   * @return {tf.tensor4d}
   *   If ( bReturn == true ), return the result (new) tensor. Otheriwse, the result tensor will be disposed and nothing will be returned.
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
