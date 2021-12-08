export { Base };

//import * as NetProgress from "./NetProgress.js";
import * as NetConfig from "../NetConfig.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ConvBlock from "../Conv/Block.js";

/**
 * A neural network composes of multiple blocks.
 *
 *
 *
 * @member {NetConfig.Base} config
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
   * @param {NetConfig.Base} config
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

//!!! ...unfinished... (2021/12/08) should call Weights.Float32Array_CloneLegal() on the weights array to restrict the weight value range.


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
