export { Net_Base as Base };

//import * as NetProgress from "./NetProgress.js";
import * as NetConfig from "../NetConfig.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ConvStage from "../Conv/Stage.js";

/**
 * A neural network composes of multiple stages.
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
class Net_Base {

  /**
   * @param {NetConfig.Base} config
   *   The configuration of this neural network.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep).
   *
   * @see ConvStage.Base.init
   */
  init( config, bKeepInputTensor ) {

    this.disposeTensors();

    this.config = config;
    this.bKeepInputTensor = bKeepInputTensor;

//!!! ...unfinished... (2021/12/08)
// should call Weights.Base.ValueBounds.Float32Array_RestrictedClone() on the weights array to restrict the weight value range.


    let targetHeight = 1; // The final output always has ( height x width ) = ( 1 x 1 ), i.e. only one pixel per channel.

    let differenceHeight = config.sourceHeight - targetHeight;
//    let filterWidth = depthwiseFilterHeight;

//  this.depthwiseChannelMultiplierStage0Step0 = depthwiseChannelMultiplierStage0Step0;
//    this.channelCountStage0 = config.sourceChannelCount * config.depthwiseChannelMultiplierStage0Step0;  // the channel count of the first stage (Stage 0).

    if ( config.stepCountPerStage <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerStage = config.depthwiseFilterHeight - 1;

      // The stage count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.stageCount = Math.floor( differenceHeight / heightReducedPerStage );

      // Channel count only be expanded by channel multiplier of depthwise convolution of step 0 of stage 0.
      this.totalChannelExpansionFactor = config.depthwiseChannelMultiplierStage0Step0;

    } else {  // ShuffleNetV2 or MobileNetV2. Halven per stage.

      // The stage count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
//      this.stageCount = Math.floor( Math.log2( sourceHeight ) );
      this.stageCount = Math.ceil( Math.log2( config.sourceHeight ) );

//!!! wrong
//       // Channel count is expanded both by channel multiplier of depthwise convolution of step 0 of stage 0
//       // and by every stage (half height x width and double channel count).
//       this.totalChannelExpansionFactor = depthwiseChannelMultiplierStage0Step0 * Math.pow( 2, this.stageCount );

      // Channel count is expanded by every stage (half height x width and double channel count).
      this.totalChannelExpansionFactor = Math.pow( 2, this.stageCount );
    }

    let nextStageInputChannelCount = config.sourceChannelCount;
    let nextStageDepthwiseChannelMultiplier = config.depthwiseChannelMultiplierStage0Step0; // Only stage 0 can have ( depthwise channel multiplier > 1 ).

    let nextKeepInputTensor = bKeepInputTensor; // Only step 0 may or may not keep the input tensor according to caller's necessary.

    this.stages = new Array( this.stageCount );
    for ( let i = 0; i < this.stageCount; ++i )
    {
      let stage = new ConvStage.Base();
      stage.init(
//!!! ...unfinished... (2021/04/10) Every stage's input image size (height * width * channelCount) should be different.
// It should depend on the output image size of the previous stage.
        config.sourceHeight, config.sourceWidth, nextStageInputChannelCount,
        config.stepCountPerStage,
        config.bChannelShuffler,
        config.pointwise1ChannelCountRate,
        config.strAvgMaxConv, config.depthwiseFilterHeight, nextStageDepthwiseChannelMultiplier, config.bBias, config.nActivationId,
        config.nActivationIdAtStageEnd,
        nextKeepInputTensor
      );

      this.stages[ i ] = stage;
      nextStageInputChannelCount = stage.outputChannelCount; // Using previous stage's output channel count as next stage's input channel count.
      nextStageDepthwiseChannelMultiplier = 1;               // Except stage 0, all other stages' depthwise channel multiplier should be 1.
      nextKeepInputTensor = false;                           // All stages (except stage 0) should not keep (and should dispose) the input tensor.
    }

    let stage0 = this.stages[ 0 ];
    {
      let step0 = stage0.step0;
      let stepLast = stage0.stepLast;

      // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Stage_1__Step_1"
      this.structure = `C${config.sourceChannelCount}_${config.channelCountStage0}`

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
        // Although the Conv/PointDepthPoint.js might have no pointwise2 convolution, the Conv/Stage.js always has pointwise2 convolution.
        // So, the last activation function always is the activation function of the last step's pointwise2 convolution.
        + `${ ( config.stepCountPerStage > 1 )
                ? ( ( stepLast.bPointwise2 && stepLast.pointwise2ActivationFunction )
                     ? ( "_" + stepLast.pointwise2ActivationName )
                     : "_NoLastActivation" )
                : "" }`

        + `__${this.stageCount}_Stage`
        + `__${config.stepCountPerStage}_Step`
        + `${ ( config.bChannelShuffler ) ? "__Shuffle" : ( ( config.stepCountPerStage > 0 ) ? "__AddInput" : "" ) }`
        //+ `${ ( bKeepInputTensor ) ? "__KeepInput" : "" }`
      ;
    }

    this.sourceImageHeightWidth = [ stage0.sourceHeight, stage0.sourceWidth ];
  }

  disposeTensors() {
    if ( this.stages ) {
      for ( let i = 0; i < this.stages.length; ++i ) {
        let stage = this.stages[ i ];
        stage.disposeTensors();
      }
      this.stages = null;
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

    let stage;
    for ( let i = 0; i < this.stages.length; ++i ) {
      stage = this.stages[ i ];
      t = stage.apply_and_destroy_or_keep( t );
    }

    if ( bReturn )
      return t;
    else
      t.dispose();
  }

}
