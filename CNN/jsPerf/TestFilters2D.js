import * as ChannelShuffler from "../Layer/ChannelShuffler.js";

export { Base };

/**
 * One step of one block of testing filters. There are at most three convolution inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * @member {number} channelCount_expansionAfter_depthwiseBefore
 *   The channel count after the first 1x1 pointwise convolution. If ( expansionChannelCountRate > 0 ), it equals
 * ( channelCount_expansionBefore * expansionChannelCountRate ).
 *
 * @member {number} channelCount_depthwiseAfter_pointwiseBefore
 *   The channel count after the NxN depthwise convolution.  If ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 * ( channelCount_expansionAfter_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier ).
 *
 * @member {number} channelCount_pointwiseAfter
 *   The channel count after the second 1x1 pointwise convolution. If ( pointwiseChannelCountRate > 0 ), it equals
 * ( channelCount_depthwiseAfter_pointwiseBefore * pointwiseChannelCountRate ).
 */
class ExpandMultiplierShrink {

  /**
   * @param {number} channelCount_expansionBefore
   *   The channel count of input image.
   *
   * @param {number} expansionChannelCountRate
   *   The output channel count of the first pointwise convolution will be ( channelCount_expansionBefore * expansionChannelCountRate ).
   * If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bExpansionBias
   *   If true, there will be a bias after pointwise convolution. If ( expansionChannelCountRate == 0 ), this will also be ignored.
   *
   * @param {string} expansionActivationName
   *   The activation function name after the first 1x1 pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   * If ( expansionChannelCountRate == 0 ), this activation function will also be ignored.
   *
   * @param {string|number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If "Avg", average pooling. If "Max", max pooling. If positive integer number, depthwise convolution and the number
   * indicates channel multiplier of depthwise convolution. If 0, there will be no depthwise operation.
   *
   * @param {number} depthwiseFilterHeight
   *   The height (and width) of depthwise convolution's filter.
   *
   * @param {number} depthwiseStrides
   *   The strides of depthwise convolution.
   *
   * @param {string} depthwisePad
   *   The padding of depthwise convolution. "valid" or "same".
   *
   * @param {boolean} bDepthwiseBias
   *   If true, there will be a bias after depthwise convolution.
   *
   * @param {string} depthwiseActivationName
   *   The activation function name after depthwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   *
!!! should always same as channelCount_expansionBefore

   * @param {number} pointwiseChannelCountRate
   *   The output channel count of the second 1x1 pointwise convolution will be ( output channel count of depthwise convolution * pointwiseChannelCountRate ).
   * If 0, there will be no pointwise convolution after depthwise convolution.
   *
   * @param {boolean} bPointwiseBias
   *   If true, there will be a bias after the second 1x1 pointwise convolution.
   *
   * @param {string} pointwiseActivationName
   *   The activation function name after the second 1x1 pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   */
  init(
    channelCount_expansionBefore,
    expansionChannelCountRate, bExpansionBias, expansionActivationName,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
    bPointwiseBias, pointwiseActivationName ) {

    this.disposeTensors();

    this.channelCount_expansionBefore = channelCount_expansionBefore;

    // The first 1x1 pointwise convolution.
    this.expansionChannelCountRate = expansionChannelCountRate;
    this.bExpansion = ( expansionChannelCountRate > 0 );
    this.bExpansionBias = bExpansionBias;
    this.expansionActivationName = expansionActivationName;
    this.expansionActivationFunction = ExpandMultiplierShrink.getActivationFunction( expansionActivationName );

    if ( this.bExpansion ) {
      this.channelCount_expansionAfter_depthwiseBefore = channelCount_expansionBefore * expansionChannelCountRate;

      this.expansionFilterHeightWidth = [ 1, 1 ];
      this.expansionFiltersShape =      [ 1, 1, this.channelCount_expansionBefore, this.channelCount_expansionAfter_depthwiseBefore ];
      this.expansionBiasesShape =       [ 1, 1, this.channelCount_expansionAfter_depthwiseBefore ];

      this.expansionFiltersTensor4d = ExpandMultiplierShrink.generateTensor( this.expansionFiltersShape );

      if ( bExpansionBias )
        this.expansionBiasesTensor3d = ExpandMultiplierShrink.generateTensor( this.expansionBiasesShape );

    } else {
      this.channelCount_expansionAfter_depthwiseBefore = channelCount_expansionBefore;  // No first 1x1 pointwise convolution.
    }

    // The depthwise operation.
    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if ( Number.isNaN( depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
        case "Avg":  this.bDepthwise = this.bDepthwiseAvg = true; break;
        case "Max":  this.bDepthwise = this.bDepthwiseMax = true; break;
        //case "Conv": this.bDepthwiseConv = true;
      }
      this.channelCount_depthwiseAfter_pointwiseBefore = this.channelCount_expansionAfter_depthwiseBefore; // depthwise without channel multiplier.

    } else {
      if ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) {
        this.bDepthwise = this.bDepthwiseConv = true;
        this.channelCount_depthwiseAfter_pointwiseBefore = this.channelCount_expansionAfter_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ depthwiseFilterHeight, this.depthwiseFilterWidth, this.channelCount_expansionAfter_depthwiseBefore, depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersTensor4d = ExpandMultiplierShrink.generateTensor( this.depthwiseFiltersShape );

      } else {
        this.bDepthwise = this.bDepthwiseConv = false;  // e.g. zero or negative number
        this.channelCount_depthwiseAfter_pointwiseBefore = this.channelCount_expansionAfter_depthwiseBefore; // No depthwise and no channel multiplier.
      }
    }

    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.
    this.depthwiseStrides = depthwiseStrides;
    this.depthwisePad = depthwisePad;
    this.bDepthwiseBias = bDepthwiseBias;
    this.depthwiseActivationName = depthwiseActivationName;
    this.depthwiseActivationFunction = ExpandMultiplierShrink.getActivationFunction( depthwiseActivationName );

    this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, this.depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_pointwiseBefore ];

    if ( this.bDepthwise ) {
      if ( bDepthwiseBias )
        this.depthwiseBiasesTensor3d = ExpandMultiplierShrink.generateTensor( this.depthwiseBiasesShape );
    }

    // The second pointwise convolution. (This convolution is always existed. It, however, may have or not bias and activation function.)
    this.bPointwiseBias = bPointwiseBias;
    this.pointwiseActivationName = pointwiseActivationName;
    this.pointwiseActivationFunction = ExpandMultiplierShrink.getActivationFunction( pointwiseActivationName );

    this.channelCount_pointwiseAfter = this.channelCount_expansionBefore; // The output channel count always be the same as input.

    this.pointwiseFilterHeightWidth = [ 1, 1 ];
    this.pointwiseFiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwiseBefore, this.channelCount_pointwiseAfter ];
    this.pointwiseBiasesShape =       [ 1, 1, this.channelCount_pointwiseAfter ];

    this.pointwiseFiltersTensor4d = ExpandMultiplierShrink.generateTensor( this.pointwiseFiltersShape );

    if ( bPointwiseBias )
      this.pointwiseBiasesTensor3d = ExpandMultiplierShrink.generateTensor( this.pointwiseBiasesShape );
  }

  /** Convert activation function to function object. */
  static getActivationFunction( strActivationName ) {
    switch ( strActivationName ) {
      case "relu":    return tf.relu;    break;
      case "relu6":   return tf.relu6;   break;
      case "sigmoid": return tf.sigmoid; break;
      case "tanh":    return tf.tanh;    break;
      case "sin":     return tf.sin;     break;
      //default:
    }
    return null;
  }

  /**
   * @param {number[]} newTensorShape
   *   The returned tensor's shape. If null, same as zero size.
   *
   * @return {tf.tensor4d|tf.tensor3d}
   *   Return a tensor4d or tensor3d acccording to newTensorShape. If size of newTensorShape is zero, return null.
   */
  static generateTensor( newTensorShape ) {
    return tf.tidy( () => {

      let valueCount = 0;
      if ( newTensorShape )
        valueCount = tf.util.sizeFromShape( newTensorShape );

      let tensor1d, tensorNew = null;
      if ( valueCount ) {
        tensor1d = tf.range( 0, valueCount, 1 );
        tensorNew = tensor1d.reshape( newTensorShape );
      }

      return tensorNew;
    });
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.expansionFiltersTensor4d ) {
      tf.dispose( this.expansionFiltersTensor4d );
      this.expansionFiltersTensor4d = null;
    }

    if ( this.depthwiseFiltersTensor4d ) {
      tf.dispose( this.depthwiseFiltersTensor4d );
      this.depthwiseFiltersTensor4d = null;
    }

    if ( this.depthwiseBiasesTensor3d ) {
      tf.dispose( this.depthwiseBiasesTensor3d );
      this.depthwiseBiasesTensor3d = null;
    }

    if ( this.pointwiseFiltersTensor4d ) {
      tf.dispose( this.pointwiseFiltersTensor4d );
      this.pointwiseFiltersTensor4d = null;
    }

    if ( this.pointwiseBiasesTensor3d ) {
      tf.dispose( this.pointwiseBiasesTensor3d );
      this.pointwiseBiasesTensor3d = null;
    }
  }

  /**
   * Process input, destroy input, return result.
   *
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor will be disposed.
   *
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  apply_and_destroy( inputTensor ) {
    let t = inputTensor, tNew;

    // The first 1x1 pointwise convolution.
    if ( this.bExpansion ) {
      tNew = t.conv2d( this.expansionFiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bExpansionBias ) {
        tNew = t.add( this.expansionBiasesTensor3d );
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.expansionActivationFunction ) {
        tNew = this.expansionActivationFunction( t );
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      }
    }

    // The depthwise convolution (or average pooling, or max pooling).
    if ( this.bDepthwise ) {

      if ( this.bDepthwiseConv ) {
        tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      } else if ( this.bDepthwiseAvg ) {
        tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      } else if ( this.bDepthwiseMax ) {
        tNew = t.pool( this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.bDepthwiseBias ) {
        tNew = t.add( this.depthwiseBiasesTensor3d );
        t.dispose();                                         // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.depthwiseActivationFunction ) {
        tNew = this.depthwiseActivationFunction( t );
        t.dispose();                                         // Dispose all intermediate (temporary) data.
        t = tNew;
      }
    }

    // The second 1x1 pointwise convolution.
    {
      tNew = t.conv2d( this.pointwiseFiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bPointwiseBias ) {
        tNew = t.add( this.pointwiseBiasesTensor3d );
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.pointwiseActivationFunction ) {
        tNew = this.pointwiseActivationFunction( t );
        t.dispose();                                       // Dispose all intermediate (temporary) data.
        t = tNew;
      }
    }

    return t;
  }

  /** The output channel count after these three convolutions. */
  get outputChannelCount() { return this.channelCount_pointwiseAfter; }
}

/**
 * One block of testing filters.
 */
class Block {

  /**
   * @param sourceHeight        The height (and width) of the source image which will be processed by apply().
   * @param sourceChannelCount  The channel count of the source image.
   * @param targetHeight        The taregt image height (and width).
   *
   * @param {boolean} bShuffleNetV2
   *   If true, ShuffleNetV2 (i.e. split and concat channels) will be used and expansionChannelCountRate will be fixed as 1.
   * If false, MobileNetV2 (i.e. expand, shrink, and add channels) will be used.
   *
   * @param {number} stepCountPerBlock
   *   If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) for shrinking sourceHeight
   * (minus ( filterHeight - 1 )). If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   * (half downsample) and use ( stageCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until the block end.
   *
   * @param strAvgMaxConv
   *   Depthwise operation. "Avg" or "Max" or "Conv" for average pooling, max pooling, depthwise convolution.
   *
   * @param {number} depthwiseChannelMultiplierStep0
   *   The depthwise convolution of the first step (Step 0) will expand input channel by this factor.
   *
   * @see ExpandMultiplierShrink.init()
   */
  init(
    sourceHeight, sourceChannelCount, targetHeight,
    bShuffleNetV2,
    stepCountPerBlock,
    expansionChannelCountRate, bExpansionBias, expansionActivationName,
    strAvgMaxConv, depthwiseChannelMultiplierStep0, depthwiseFilterHeight, bDepthwiseBias, depthwiseActivationName,
    pointwiseChannelCountRate, bPointwiseBias, pointwiseActivationName ) {

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
    // In MobileNetV3, step A expands channel count (with activation), step C shrinks channel count (without activation).
    // It may use squeeze-and-excitation after step B.
    //
    // In ShuffleNetV2, step A (with activation) and step C (with activation) never change channel count. It expands channel count
    // by concatenating when shrinking (halving) height x weight.
    //

    this.bShuffleNetV2 = bShuffleNetV2;

    let sourceWidth = sourceHeight;  // Assume source's width equals its height.
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;

    this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, sourceChannelCount ];

    if ( this.bShuffleNetV2 ) {
      expansionChannelCountRate = 1;  // ShuffleNetV2 never expands channels by pointwise convolution.

      let outputGroupCount = 2; // ShuffleNetV2 always uses two groups.
      this.concatGather = new ChannelShuffler.ConcatGather();
      this.concatGather.init( this.sourceConcatenatedShape, outputGroupCount );
    }
// !!!
//     this.depthwiseFilterHeight = depthwiseFilterHeight;
//     let depthwiseFilterWidth =   depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.

    // The special of a block's step 0 are:
    //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
    //   - Double channels. (ShuffleNetV2 only)
    //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us only.)

    this.depthwiseChannelMultiplierStep0 = depthwiseChannelMultiplierStep0;
    if ( bShuffleNetV2 ) {      // ShuffleNetV2

      // the channel count of the first step (i.e. Step 0).
      this.channelCountStep0 = {
        expansionBefore:                 sourceChannelCount,
        expansionAfter_depthwiseBefore:  sourceChannelCount,  // No expansion.
        depthwiseAfter_pointwiseBefore:  sourceChannelCount * depthwiseChannelMultiplierStep0,
        pointwiseAfter:                  sourceChannelCount * depthwiseChannelMultiplierStep0,
      };

      // The step 0 of ShuffleNetV2 has a branch for height and width halving without 1x1 (pointwise) convolution before halving by depthwise convolution.
      this.channelCountStep0Branch = {
        depthwiseBefore:                 sourceChannelCount,  // No expansion.
        depthwiseAfter_pointwiseBefore:  sourceChannelCount * depthwiseChannelMultiplierStep0,
        pointwiseAfter:                  sourceChannelCount * depthwiseChannelMultiplierStep0,
      };

      // the channel count after the first step (i.e. Step 1, 2, 3, ...).
      this.channelCountStep1 = {
        expansionBefore:                 this.channelCountStep0.pointwiseAfter + this.channelCountStep0Branch.pointwiseAfter,  // Expansion twice.
        expansionAfter_depthwiseBefore:  this.channelCountStep0.pointwiseAfter + this.channelCountStep0Branch.pointwiseAfter,
        depthwiseAfter_pointwiseBefore:  this.channelCountStep0.pointwiseAfter + this.channelCountStep0Branch.pointwiseAfter,
        pointwiseAfter:                  this.channelCountStep0.pointwiseAfter + this.channelCountStep0Branch.pointwiseAfter,
      };

    } else {  // MobileNetV2

      this.expandedChannelCount = sourceChannelCount * expansionChannelCountRate;

      // the channel count of the first step (i.e. Step 0).
      this.channelCountStep0 = {
        expansionBefore:                 sourceChannelCount,
        expansionAfter_depthwiseBefore:  this.expandedChannelCount,  // Expansion.
        depthwiseAfter_pointwiseBefore:  this.expandedChannelCount * depthwiseChannelMultiplierStep0,
        pointwiseAfter:                  this.expandedChannelCount * depthwiseChannelMultiplierStep0,
      };

      // The step 0 of MobileNetV2 has no branch.
      this.channelCountStep0Branch = {
      };

      // the channel count after the first step (i.e. Step 1, 2, 3, ...).
      this.channelCountStep1 = {
        expansionBefore:                 this.channelCountStep0.pointwiseAfter,
        expansionAfter_depthwiseBefore:  this.channelCountStep0.pointwiseAfter * 2,  // Expansion twice.
        depthwiseAfter_pointwiseBefore:  this.channelCountStep0.pointwiseAfter * 2,
        pointwiseAfter:                  this.channelCountStep0.pointwiseAfter * 2,
      };
    }

    this.stepCountPerBlock = stepCountPerBlock;
    this.steps = new Array( stepCountPerBlock );

    // Step 0.
    {
      let depthwise_AvgMax_Or_ChannelMultiplier;
      if ( strAvgMaxConv == "Conv" )
        depthwise_AvgMax_Or_ChannelMultiplier = depthwiseChannelMultiplierStep0;
      else
        depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

      let depthwiseStrides = 2;  // Step 0 is responsibile for halving input's height (and width).
      let depthwisePad = "same";

      let step0 = new ExpandMultiplierShrink();
      step0.init(
        this.channelCountStep0.expansionBefore,
        expansionChannelCountRate, bExpansionBias, expansionActivationName,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
        pointwiseChannelCountRate, bPointwiseBias, pointwiseActivationName ) {
      );

      this.steps[ 0 ] = step0;

//!!! step0's branch ?
    }

    // Step 1, 2, 3, ...
    for ( let i = 1; i < stepCountPerBlock; ++i )
    {
      let depthwise_AvgMax_Or_ChannelMultiplier;
      if ( strAvgMaxConv == "Conv" )
        depthwise_AvgMax_Or_ChannelMultiplier = 1; // Force to 1, because only step 0 can have ( channelMultiplier > 1 ).
      else
        depthwise_AvgMax_Or_ChannelMultiplier = strAvgMaxConv; // "Avg" or "Max".

      let depthwiseStrides = 1;  // Force to 1, because only step 0 should halve input's height (and width).
      let depthwisePad = "same";

      let step = new ExpandMultiplierShrink();
      step.init(
        this.channelCountStep1.expansionBefore,
        expansionChannelCountRate, bExpansionBias, expansionActivationName,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
        pointwiseChannelCountRate, bPointwiseBias, pointwiseActivationName ) {
      );

      this.steps[ i ] = step;
    }      


      
      
    // Pointwise Filters for Channel Expansion
    {
      this.expansionFilterHeightWidth = [ 1, 1 ];
      this.expansionFiltersShapeStep0 = [ 1, 1, this.channelCountStep0.expansionBefore, this.channelCountStep0.expansionAfter_depthwiseBefore ];
      this.expansionFiltersShape =      [ 1, 1, this.channelCountStep1.expansionBefore, this.channelCountStep1.expansionAfter_depthwiseBefore ];

      // Every element (Tensor4d) is a pointwiseFilters for one step.
      this.expansionFiltersTensor4dArray = Block.generateTensorArray( stepCountPerBlock, this.expansionFiltersShapeStep0, this.expansionFiltersShape );
    }

    // Depthwise Filters and Biases
    {
      this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, depthwiseFilterWidth ];

      // First step's depthwise filters could expand channel count by depthwiseChannelMultiplierStep0.
      this.depthwiseFiltersShapeStep0
        = [ depthwiseFilterHeight, depthwiseFilterWidth, this.channelCountStep0.expansionAfter_depthwiseBefore, depthwiseChannelMultiplierStep0 ];

      this.depthwiseFiltersShape
        = [ depthwiseFilterHeight, depthwiseFilterWidth, this.channelCountStep1.expansionAfter_depthwiseBefore,                               1 ];

      this.depthwiseBiasesShapeStep0 =  [ 1, 1, this.channelCountStep0.depthwiseAfter_pointwiseBefore ];
      this.depthwiseBiasesShape =       [ 1, 1, this.channelCountStep1.depthwiseAfter_pointwiseBefore ];

      // Every element (Tensor4d) is a depthwiseFilters for one step.
      if ( this.bDepthwiseConv )
        this.depthwiseFiltersTensor4dArray = Block.generateTensorArray( stepCountPerBlock, this.depthwiseFiltersShapeStep0, this.depthwiseFiltersShape );

      // Every element (Tensor3d) is a depthwiseBiases for one step.
      if ( this.bDepthwiseConv && bDepthwiseBias )
        this.depthwiseBiasesTensor3dArray = Block.generateTensorArray( stepCountPerBlock, this.depthwiseBiasesShapeStep0, this.depthwiseBiasesShape );
    }

    // Pointwise Filters and Biases
    {
      this.pointwiseFilterHeightWidth = [ 1, 1 ];

      this.pointwiseFiltersShapeStep0 = [ 1, 1, this.channelCountStep0.depthwiseAfter_pointwiseBefore, this.channelCountStep0.pointwiseAfter ];
      this.pointwiseFiltersShape =      [ 1, 1, this.channelCountStep0.depthwiseAfter_pointwiseBefore, this.channelCountStep1.pointwiseAfter ];

      // Both input channel count and output channel count of pointwise bias are the same as pointwise convolution output.
      this.pointwiseBiasesShapeStep0 =  [ 1, 1, this.channelCountStep0.pointwiseAfter ];
      this.pointwiseBiasesShape =       [ 1, 1, this.channelCountStep1.pointwiseAfter ];

      // Every element (Tensor4d) is a pointwiseFilters for one step.
      if ( bPointwise )
        this.pointwiseFiltersTensor4dArray = Block.generateTensorArray( stepCountPerBlock, this.pointwiseFiltersShapeStep0, this.pointwiseFiltersShape );

      // Every element (Tensor3d) is a pointwiseBiases for one step.
      if ( bPointwise && bPointwiseBias )
        this.pointwiseBiasesTensor3dArray = Block.generateTensorArray( stepCountPerBlock, this.pointwiseBiasesShapeStep0, this.pointwiseBiasesShape );
    }

    // Branch's Depthwise Filters and Biases and Pointwise Filters and Biases. (Only ShuffleNetV2 block's step 0 has this branch.)
    if ( channelExpansionFactor <= 0 ) {      // ShuffleNetV2

      {
        this.branchDepthwiseFilterHeightWidth = [ depthwiseFilterHeight, depthwiseFilterWidth ];

        this.branchDepthwiseFiltersShapeStep0
          = [ depthwiseFilterHeight, depthwiseFilterWidth, this.channelCountStep0Branch.depthwiseBefore, depthwiseChannelMultiplierStep0 ];

        this.branchDepthwiseBiasesShapeStep0 =  [ 1, 1, this.channelCountStep0Branch.depthwiseAfter_pointwiseBefore ];

        // Every element (Tensor4d) is a depthwiseFilters for one step.
        this.branchDepthwiseFiltersTensor4dArray = Block.generateTensorArray( stepCountPerBlock, this.branchDepthwiseFiltersShapeStep0, null );

        // Every element (Tensor3d) is a depthwiseBiases for one step.
        this.branchDepthwiseBiasesTensor3dArray = Block.generateTensorArray( stepCountPerBlock, this.branchDepthwiseBiasesShapeStep0, null );
      }

      {
        this.branchPointwiseFilterHeightWidth = [ 1, 1 ];

        this.branchPointwiseFiltersShapeStep0 = [ 1, 1, this.channelCountStep0Branch.depthwiseAfter_pointwiseBefore, this.channelCountStep0Branch.pointwiseAfter ];

        // Both input channel count and output channel count of pointwise bias are the same as pointwise convolution output.
        this.branchPointwiseBiasesShapeStep0 =  [ 1, 1, this.channelCountStep0Branch.pointwiseAfter ];

        // Every element (Tensor4d) is a pointwiseFilters for one step.
        this.branchPointwiseFiltersTensor4dArray = Block.generateTensorArray( stepCountPerBlock, this.branchPointwiseFiltersShapeStep0, null );

        // Every element (Tensor3d) is a pointwiseBiases for one step.
        this.branchPointwiseBiasesTensor3dArray = Block.generateTensorArray( stepCountPerBlock, this.branchPointwiseBiasesShapeStep0, null );
      }
    }
  }

  /**
   * @param {number}   stepCount           The element count (i.e. length) of the returned array.
   * @param {number[]} newTensorShapeFirst The tensor's shape of first element of the returned array. If null, same as newTensorShape.
   * @param {number[]} newTensorShape      The tensor's shape of every (except first) element of the returned array. If null, same as zero size.
   *
   * @return {tf.tensor4d[]|tf.tensor3d[]}
   *   Return a array whose every element is a tensor4d or tensor3d (for one block), or null (if ( bCreateElement == false ) ).
   */
  static generateTensorArray( stepCount, newTensorShapeFirst, newTensorShape ) {
    return tf.tidy( () => {
      let valueCount = 0;
      if ( newTensorShape )
        valueCount = tf.util.sizeFromShape( newTensorShape );

      // first element (i.e. first step) (i.e. step 0)
      let valueCountFirst = 0;
      if ( newTensorShapeFirst )
        valueCountFirst = tf.util.sizeFromShape( newTensorShapeFirst );
      else
        valueCountFirst = valueCount;

      let tensor1d, tensorNew;
      let tensorNewArray = new Array( stepCount );
      for ( let i = 0; i < stepCount; ++i ) {
        tensorNew = null; // For ( valueCount == 0 )
        if ( 0 == i ) {   // Step 0
          if ( valueCountFirst ) {
            tensor1d = tf.range( 0, valueCountFirst, 1 );
            tensorNew = tensor1d.reshape( newTensorShapeFirst );
          }
        } else {          // Step 1, 2, 3, ...
          if ( valueCount ) {
            tensor1d = tf.range( 0, valueCount, 1 );
            tensorNew = tensor1d.reshape( newTensorShape );
          }
        }
        tensorNewArray[ i ] = tensorNew;
      }
      return tensorNewArray;
    });
  }

  disposeTensors() {
    if ( this.concatGather ) {
      this.concatGather.disposeTensors();
      this.concatGather = null;
    }

    if ( this.expansionFiltersTensor4dArray ) {
      tf.dispose( this.expansionFiltersTensor4dArray );
      this.expansionFiltersTensor4dArray = null;
    }


    if ( this.depthwiseFiltersTensor4dArray ) {
      tf.dispose( this.depthwiseFiltersTensor4dArray );
      this.depthwiseFiltersTensor4dArray = null;
    }

    if ( this.depthwiseBiasesTensor3dArray ) {
      tf.dispose( this.depthwiseBiasesTensor3dArray );
      this.depthwiseBiasesTensor3dArray = null;
    }


    if ( this.pointwiseFiltersTensor4dArray ) {
      tf.dispose( this.pointwiseFiltersTensor4dArray );
      this.pointwiseFiltersTensor4dArray = null;
    }

    if ( this.pointwiseBiasesTensor3dArray ) {
      tf.dispose( this.pointwiseBiasesTensor3dArray );
      this.pointwiseBiasesTensor3dArray = null;
    }


    {
      if ( this.branchDepthwiseFiltersTensor4dArray ) {
        tf.dispose( this.branchDepthwiseFiltersTensor4dArray );
        this.branchDepthwiseFiltersTensor4dArray = null;
      }

      if ( this.branchDepthwiseBiasesTensor3dArray ) {
        tf.dispose( this.branchDepthwiseBiasesTensor3dArray );
        this.branchDepthwiseBiasesTensor3dArray = null;
      }


      if ( this.branchPointwiseFiltersTensor4dArray ) {
        tf.dispose( this.branchPointwiseFiltersTensor4dArray );
        this.branchPointwiseFiltersTensor4dArray = null;
      }

      if ( this.branchPointwiseBiasesTensor3dArray ) {
        tf.dispose( this.branchPointwiseBiasesTensor3dArray );
        this.branchPointwiseBiasesTensor3dArray = null;
      }
    }
  }



  // The output channel count of this block's last step.
  get outputChannelCount() { return this.channelCountStep1.pointwiseAfter; }

}

/**
 * Testing Filters of multiple blocks.
 *
 * @member {string} name This test filters' name.
 */
class Base {

  /**
   * @param sourceHeight        The height (and width) of the source image which will be processed by apply().
   * @param sourceChannelCount  The channel count of the source image.
   * @param targetHeight        The taregt image height (and width).
   * @param filterHeight        The height (and width) of each depthwise convolution.
   *
   * @param {number} channelMultiplierBlock0
   *   The first block (Block 0) will expand input channel by this factor.
   *
   * @param {number} stepCountPerBlock
   *   If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) for shrinking sourceHeight
   * (minus ( filterHeight - 1 )). If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   * (half downsample) and use ( stageCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until the block end.
   *
   * @param strAvgMaxConv
   *   Depthwise operation. "Avg" or "Max" or "Conv" for average pooling, max pooling, depthwise convolution.
   *
   * @param bDepthwiseBias
   *   If true, there will be a bias after depthwise convolution.
   *
   * @param depthwiseActivationName
   *   The activation function name after depthwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   *
   * @param bPointwise
   *   If true, there will be pointwise convolution after every layer of depthwise convolution.
   *
   * @param bPointwiseBias
   *   If true, there will be a bias after pointwise convolution. If ( bPointwise == false ), this will be also ignored.
   *
   * @param pointwiseActivationName
   *   The activation function name after pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   * If ( bPointwise == false ), this activation function will be also ignored.
   */
  init(
    channelExpansionFactor,
    sourceHeight, sourceChannelCount, targetHeight,
    filterHeight, channelMultiplierBlock0,
    stepCountPerBlock,
    strAvgMaxConv, bDepthwiseBias, depthwiseActivationName,
    bPointwise, bPointwiseBias, pointwiseActivationName ) {

    this.disposeTensors();

    this.stepCountPerBlock = stepCountPerBlock;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;

    this.channelMultiplier = channelMultiplierBlock0;
    this.channelCountBlock0 = sourceChannelCount * channelMultiplierBlock0;  // the channel count of the first block (Block 0).

//!!! ...unfinished...

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = filterHeight - 1;

    if ( stepCountPerBlock >= 1 ) {
      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
      this.blockCount = Math.floor( Math.log2( sourceHeight ) );
    } else {
      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerStep );
    }

//!!! ...unfinished... should use Block0 info (instead of this)

    // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
    this.name = `C${sourceChannelCount}_${this.channelCountBlock0}`
      + `__D${strAvgMaxConv}_${filterHeight}x${filterHeight}`
      + `${ ( this.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
      + `${ ( this.depthwiseActivationFunction ) ? ( "_" + depthwiseActivationName ) : "" }`
      + `${ ( this.bPointwise ) ? "__PConv" : "" }`
      + `${ ( this.bPointwise && this.bPointwiseBias ) ? ( "_PBias" ) : "" }`
      + `${ ( this.bPointwise && this.pointwiseActivationFunction ) ? ( "_" + pointwiseActivationName ) : "" }`
      + `__Block_${this.blockCount}`
      + `__Step${stepCountPerBlock}`
    ;

    // Depthwise Filters and Biases

    this.depthwiseFilterHeightWidth = [ filterHeight, filterWidth ];

    // First block's depthwise filters will expand channel count from sourceChannelCount to ( sourceChannelCount * channelMultiplierBlock0 ).
    this.depthwiseFiltersShapeFirst = [ filterHeight, filterWidth,      sourceChannelCount, channelMultiplierBlock0 ];
    this.depthwiseFiltersShape =      [ filterHeight, filterWidth, this.channelCountBlock0,                       1 ];
    this.depthwiseBiasesShape =       [            1,           1, this.channelCountBlock0 ];

    // Every element (Tensor4d) is a depthwiseFilters for one block.
    this.depthwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, this.depthwiseFiltersShapeFirst, this.depthwiseFiltersShape, this.bDepthwiseConv );

    // Every element (Tensor3d) is a depthwiseBiases for one block.
    this.depthwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, null, this.depthwiseBiasesShape, ( this.bDepthwiseConv && bDepthwiseBias ) );


    // Pointwise Filters and Biases

    let pointwiseInputDepth =  this.channelCountBlock0;
    let pointwiseOutputDepth = this.channelCountBlock0; // Assume output depth is the same as input.

    this.pointwiseFilterHeightWidth = [ 1, 1 ];
    this.pointwiseFiltersShape = [ 1, 1, pointwiseInputDepth, pointwiseOutputDepth ];

    // Both input depth and output depth of pointwise bias are the same as pointwise convolution output.
    this.pointwiseBiasesShape =  [ 1, 1, pointwiseOutputDepth ];

    // Every element (Tensor4d) is a pointwiseFilters for one block.
    this.pointwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, null, this.pointwiseFiltersShape, bPointwise );

    // Every element (Tensor3d) is a pointwiseBiases for one block.
    this.pointwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, null, this.pointwiseBiasesShape, ( bPointwise && bPointwiseBias ) );
  }

  disposeTensors() {
    if ( this.depthwiseFiltersTensor4dArray ) {
      tf.dispose( this.depthwiseFiltersTensor4dArray );
      this.depthwiseFiltersTensor4dArray = null;
    }

    if ( this.depthwiseBiasesTensor3dArray ) {
      tf.dispose( this.depthwiseBiasesTensor3dArray );
      this.depthwiseBiasesTensor3dArray = null;
    }

    if ( this.pointwiseFiltersTensor4dArray ) {
      tf.dispose( this.pointwiseFiltersTensor4dArray );
      this.pointwiseFiltersTensor4dArray = null;
    }

    if ( this.pointwiseBiasesTensor3dArray ) {
      tf.dispose( this.pointwiseBiasesTensor3dArray );
      this.pointwiseBiasesTensor3dArray = null;
    }
  }


  /**
   * @param sourceImage
   *   The image which will be processed.
   *
   * @param bReturn
   *   If true, the result convoluiotn will be returned.
   *
   * @return
   *   If ( bReturn == true ), return the convolution result (tensor). Otheriwse, reurn null.
   */
  apply( sourceImage, bReturn ) {
    return tf.tidy( () => {

//!!! ...unfinished... fromPixels(). so that we can always dispose all tensors.

      let t, tNew;

      // Layer 0
      //
      // So that every layer could dispose previous result without worry about mis-dispose source.

      if ( this.bDepthwiseAvg ) {
        t = sourceImage.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
      } else if ( this.bDepthwiseMax ) {
        t = sourceImage.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
      } else if ( this.bDepthwiseConv ) {
        t = sourceImage.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ 0 ], 1, "valid" );  // Stride = 1
      }
      // NOTE: Do not dispose the original data.

      t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( t, 0 );

      // Layer 1, ...
      if ( this.bDepthwiseAvg ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      } else if ( this.bDepthwiseMax ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      } else if ( this.bDepthwiseConv ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ i ], 1, "valid" );  // Stride = 1
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      }

      if ( bReturn )
        return t;
    });
  }

}

