import * as ChannelShuffler from "../Layer/ChannelShuffler.js";

export { Base };

/**
 * One step of one block of testing filters.
 */
// class PointDepthPoint {
// }

/**
 * One block of testing filters.
 */
class Block {

  /**
   * @param {number} channelExpansionFactor
   *   The channel expansion factor by 1x1 (pointwise) convolution (not by depthwise convolution). If 0 (or negative), it will looks like
   * ShuffleNetV2 (i.e. will split and concat channels). If positive (>= 1), it will looks like MobileNetV2 (i.e. expand and shrink
   * channels).
   *
   * @param sourceHeight        The height (and width) of the source image which will be processed by apply().
   * @param sourceChannelCount  The channel count of the source image.
   * @param targetHeight        The taregt image height (and width).
   *
   * @param depthwiseFilterHeight
   *   The height (and width) of each depthwise convolution.
   *
   * @param {number} depthwiseChannelMultiplierStep0
   *   The depthwise convolution of the first step (Step 0) will expand input channel by this factor.
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
    depthwiseFilterHeight, depthwiseChannelMultiplierStep0,
    stepCountPerBlock,
    strAvgMaxConv, bDepthwiseBias, depthwiseActivationName,
    bPointwise, bPointwiseBias, pointwiseActivationName ) {

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

    this.channelExpansionFactor = channelExpansionFactor;
    if ( channelExpansionFactor <= 0 ) {
      this.bShuffleNetV2 = true;
    } else {
      this.bMobileNetV2 =  true;
    }

    let sourceWidth = sourceHeight;  // Assume source's width equals its height.
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;

    this.sourceConcatenatedShape = [ sourceHeight, sourceWidth, sourceChannelCount ];

    if ( this.bShuffleNetV2 ) {
      let outputGroupCount = 2; // ShuffleNetV2 always uses two groups.
      this.concatGather = new ChannelShuffler.ConcatGather();
      this.concatGather.init( this.sourceConcatenatedShape, outputGroupCount );
    }

    this.depthwiseFilterHeight = depthwiseFilterHeight;
    let depthwiseFilterWidth =   depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.

    // The special of a block's step 0 are:
    //   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
    //   - Double channels. (ShuffleNetV2 only)
    //   - Expand channels by channelMultiplier of depthwise convolution. (Both ShuffleNetV2 and MobileNetV2 do not have this. It is added by us only.)

    this.depthwiseChannelMultiplierStep0 = depthwiseChannelMultiplierStep0;
    if ( channelExpansionFactor <= 0 ) {      // ShuffleNetV2

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

      this.expandedChannelCount = sourceChannelCount * channelExpansionFactor;

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

    this.strAvgMaxConv = strAvgMaxConv;
    switch ( strAvgMaxConv ) {
      case "Avg":  this.bDepthwiseAvg = true;
      case "Max":  this.bDepthwiseMax = true;
      case "Conv": this.bDepthwiseConv = true;
    }

    this.bDepthwiseBias = bDepthwiseBias;

    this.depthwiseActivationName = depthwiseActivationName;
    switch ( depthwiseActivationName ) {
      case "relu":    this.depthwiseActivationFunction = tf.relu;    break;
      case "relu6":   this.depthwiseActivationFunction = tf.relu6;   break;
      case "sigmoid": this.depthwiseActivationFunction = tf.sigmoid; break;
      case "tanh":    this.depthwiseActivationFunction = tf.tanh;    break;
      case "sin":     this.depthwiseActivationFunction = tf.sin;     break;
      //default:
    }

    this.bPointwise = bPointwise;
    this.bPointwiseBias = bPointwiseBias;

    this.pointwiseActivationName = pointwiseActivationName;
    switch ( pointwiseActivationName ) {
      case "relu":    this.pointwiseActivationFunction = tf.relu;    break;
      case "relu6":   this.pointwiseActivationFunction = tf.relu6;   break;
      case "sigmoid": this.pointwiseActivationFunction = tf.sigmoid; break;
      case "tanh":    this.pointwiseActivationFunction = tf.tanh;    break;
      case "sin":     this.pointwiseActivationFunction = tf.sin;     break;
      //default:
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


  /**
   * @param  {tf.tensor4d} inputTensor  Apply this tensor with depthwise (bias and activation) and pointwise (bias and activation).
   * @param  {number}      blockIndex   Which block's depthwise and pointwise operrations.
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( inputTensor, stepIndex ) {
    let t = inputTensor, tNew;

    if ( this.bDepthwiseBias ) {
      tNew = t.add( this.depthwiseBiasesTensor3dArray[ stepIndex ] );
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;
    }

    if ( this.depthwiseActivationFunction ) {
      tNew = this.depthwiseActivationFunction( t );
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;
    }

    if ( this.bPointwise ) {
      tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ stepIndex ], 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bPointwiseBias ) {
        tNew = t.add( this.pointwiseBiasesTensor3dArray[ stepIndex ] );
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

  /**
   * Process input by this block's steps.
   *
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

      let t, tNew;

      // Step 0


//!!! ...unfinished...

      // Step 0 ???
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

