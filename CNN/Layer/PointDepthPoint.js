export { Base };

/**
 * One step of one block of testing filters. There are at most three convolution inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * The second pointwise convolution is always existed. It, however, may have or not bias and activation function.
 *
 * @member {number} channelCount_pointwise1After_depthwiseBefore
 *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals expansionChannelCount.
 * If ( pointwise1ChannelCount <= 0 ), it equals channelCount_expansionBefore.
 *
 * @member {number} channelCount_depthwiseAfter_pointwise2Before
 *   The channel count after the NxN depthwise convolution.  If ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 * ( channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier ). If "Avg" or "Max" or ( <= 0 ), it equals
 * channelCount_pointwise1After_depthwiseBefore.
 *
 * @member {number} channelCount_pointwise2After
 *   The channel count after the second 1x1 pointwise convolution. If ( pointwise2ChannelCount > 0 ), it equals pointwiseChannelCount.
 * If ( pointwise2ChannelCount <= 0 ), it equals channelCount_depthwiseAfter_pointwise2Before.
 *
 * @member {function} apply_and_destroy
 *   This is a method. It has an parameter inputTensor (tf.tensor4d) represents the image which will be processed. It returns a new
 * tf.tensor4d. All other tensors (including inputTensor) will be disposed. In fact, this method calls one of
 * apply_and_destroy_AddInputToOutput(), apply_and_destroy_NoResidual() according to the init()'s parameters.
 */
class Base {

  /**
   * @param {number} channelCount_pointwise1Before
   *   The channel count of input image.
   *
   * @param {number} pointwise1ChannelCount
   *   The output channel count of the first pointwise convolution. If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bPointwise1Bias
   *   If true, there will be a bias after pointwise convolution. If ( pointwise1ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise1ActivationName
   *   The activation function name after the first 1x1 pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   * If ( pointwise1ChannelCount == 0 ), this activation function will also be ignored.
   *
   * @param {number} depthwiseFilterHeight
   *   The height (and width) of depthwise convolution's filter.
   *
   * @param {string|number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If "Avg", average pooling. If "Max", max pooling. If positive integer number, depthwise convolution and the number
   * indicates channel multiplier of depthwise convolution. If 0, there will be no depthwise operation.
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
   * @param {number} pointwise2ChannelCount
   *   The output channel count of the second 1x1 pointwise convolution. If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bPointwise2Bias
   *   If true, there will be a bias after the second 1x1 pointwise convolution. If ( pointwise2ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {string} pointwise2ActivationName
   *   The activation function name after the second 1x1 pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   * If ( pointwise2ChannelCount == 0 ), this activation function will also be ignored.
   *
   * @param {boolean} bAddInputToOutput
   *   If true and ( depthwiseStrides == 1 ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ), the inputTensor will be added
   * to output in apply_and_destroy(). This could achieve the residual connection of MobileNetV2.
   *
//!!!???
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy() will not dispose inputTensor. This is usually used by the branch of step 0 of ShuffleNetV2.
   */
  init(
    channelCount_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    bAddInputToOutput,
//!!!???
    bKeepInputTensor ) {

    this.disposeTensors();

    this.channelCount_pointwise1Before = channelCount_pointwise1Before;

    // The first 1x1 pointwise convolution.
    this.pointwise1ChannelCount = pointwise1ChannelCount;
    this.bPointwise1 = ( pointwise1ChannelCount > 0 );
    this.bPointwise1Bias = bPointwise1Bias;
    this.pointwise1ActivationName = pointwise1ActivationName;
    this.pointwise1ActivationFunction = Base.getActivationFunction( pointwise1ActivationName );

    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = pointwise1ChannelCount;

      this.pointwise1FilterHeightWidth = [ 1, 1 ];
      this.pointwise1FiltersShape =      [ 1, 1, this.channelCount_pointwise1Before, this.channelCount_pointwise1After_depthwiseBefore ];
      this.pointwise1BiasesShape =       [ 1, 1, this.channelCount_pointwise1After_depthwiseBefore ];

      this.pointwise1FiltersTensor4d = Base.generateTensor( this.pointwise1FiltersShape );

      if ( ( bAddInputToOutput ) && ( depthwiseStrides == 1 ) )    // So setp 0 (whose strides == 2) never add input to output.
        this.pfn_pointwise1Conv = Base.pointwise1Conv;             // will NOT dispose inputTensor.
      else
        this.pfn_pointwise1Conv = Base.pointwise1Conv_and_destroy; // will dispose inputTensor.

      if ( bPointwise1Bias ) {
        this.pointwise1BiasesTensor3d = Base.generateTensor( this.pointwise1BiasesShape );
        this.pfn_pointwise1Bias = Base.pointwise1Bias_and_destroy;
      }

      if ( this.pointwise1ActivationFunction )
        this.pfn_pointwise1Activation = Base.pointwise1Activation_and_destroy;

    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount_pointwise1Before;  // No first 1x1 pointwise convolution.
    }

    // The depthwise operation.
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.

    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if ( Number.isNaN( depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
        case "Avg":  this.bDepthwise = this.bDepthwiseAvg = true; this.pfn_depthwiseOperation = Base.depthwiseAvg_and_destroy; break;
        case "Max":  this.bDepthwise = this.bDepthwiseMax = true; this.pfn_depthwiseOperation = Base.depthwiseMax_and_destroy; break;
        //case "Conv": this.bDepthwiseConv = true;
      }
      this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // depthwise without channel multiplier.

    } else {
      if ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) {
        this.bDepthwise = this.bDepthwiseConv = true;
        this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ depthwiseFilterHeight, this.depthwiseFilterWidth, this.channelCount_pointwise1After_depthwiseBefore, depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersTensor4d = Base.generateTensor( this.depthwiseFiltersShape );
        this.pfn_depthwiseOperation = Base.depthwiseConv_and_destroy;

      } else {
        this.bDepthwise = this.bDepthwiseConv = false;  // e.g. zero or negative number
        this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // No depthwise (so that no channel multiplier).
      }
    }

    this.depthwiseStrides = depthwiseStrides;
    this.depthwisePad = depthwisePad;
    this.bDepthwiseBias = bDepthwiseBias;
    this.depthwiseActivationName = depthwiseActivationName;
    this.depthwiseActivationFunction = Base.getActivationFunction( depthwiseActivationName );

    this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, this.depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before ];

    if ( this.bDepthwise ) {
      if ( bDepthwiseBias ) {
        this.depthwiseBiasesTensor3d = Base.generateTensor( this.depthwiseBiasesShape );
        this.pfn_depthwiseBias = Base.depthwiseBias_and_destroy;
      }

      if ( this.depthwiseActivationFunction )
        this.pfn_depthwiseActivation = Base.depthwiseActivation_and_destroy;
    }

    // The second 1x1 pointwise convolution.
    this.pointwise2ChannelCount = pointwise2ChannelCount;
    this.bPointwise2 = ( pointwise2ChannelCount > 0 );
    this.bPointwise2Bias = bPointwise2Bias;
    this.pointwise2ActivationName = pointwise2ActivationName;
    this.pointwise2ActivationFunction = Base.getActivationFunction( pointwise2ActivationName );

    if ( this.bPointwise2 ) {
      this.channelCount_pointwise2After = this.pointwise2ChannelCount;

      this.pointwise2FilterHeightWidth = [ 1, 1 ];
      this.pointwise2FiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before, this.channelCount_pointwise2After ];
      this.pointwise2BiasesShape =       [ 1, 1, this.channelCount_pointwise2After ];

      this.pointwise2FiltersTensor4d = Base.generateTensor( this.pointwise2FiltersShape );
      this.pfn_pointwise2Conv = Base.pointwise2Conv_and_destroy;

      if ( bPointwise2Bias ) {
        this.pointwise2BiasesTensor3d = Base.generateTensor( this.pointwise2BiasesShape );
        this.pfn_pointwise2Bias = Base.pointwise2Bias_and_destroy;
      }

      if ( this.pointwise2ActivationFunction )
        this.pfn_pointwise2Activation = Base.pointwise2Activation_and_destroy;

    } else {
      this.channelCount_pointwise2After = this.channelCount_depthwiseAfter_pointwise2Before;
    }

    this.bAddInputToOutput = bAddInputToOutput;
//!!!???
    this.bKeepInputTensor = bKeepInputTensor;

    if ( ( bAddInputToOutput ) && ( depthwiseStrides == 1 ) )    // So setp 0 (whose strides == 2) never add input to output.
      // Should also ( depthwiseStrides == 1 ) and ( channelCount_pointwise1Before == this.channelCount_pointwise2After ).
      // Otherwise, the result will be wrong.
      this.apply_and_destroy = Base.apply_and_destroy_AddInputToOutput;
    else
      this.apply_and_destroy = Base.apply_and_destroy_NoResidual;
  }

  /** Convert activation function name to function object. */
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
    if ( this.pointwise1FiltersTensor4d ) {
      tf.dispose( this.pointwise1FiltersTensor4d );
      this.pointwise1FiltersTensor4d = null;
    }

    if ( this.pointwise1BiasesTensor3d ) {
      tf.dispose( this.pointwise1BiasesTensor3d );
      this.pointwise1BiasesTensor3d = null;
    }

    if ( this.depthwiseFiltersTensor4d ) {
      tf.dispose( this.depthwiseFiltersTensor4d );
      this.depthwiseFiltersTensor4d = null;
    }

    if ( this.depthwiseBiasesTensor3d ) {
      tf.dispose( this.depthwiseBiasesTensor3d );
      this.depthwiseBiasesTensor3d = null;
    }

    if ( this.pointwise2FiltersTensor4d ) {
      tf.dispose( this.pointwise2FiltersTensor4d );
      this.pointwise2FiltersTensor4d = null;
    }

    if ( this.pointwise2BiasesTensor3d ) {
      tf.dispose( this.pointwise2BiasesTensor3d );
      this.pointwise2BiasesTensor3d = null;
    }

    this.pfn_pointwise1Conv =     this.pfn_pointwise1Bias = this.pfn_pointwise1Activation =
    this.pfn_depthwiseOperation = this.pfn_depthwiseBias =  this.pfn_depthwiseActivation =
    this.pfn_pointwise2Conv =     this.pfn_pointwise2Bias = this.pfn_pointwise2Activation = Base.no_operation;
  }

  /** (Just return inputTensor without doing anything.) */
  static no_operation( inputTensor ) { return inputTensor; }

  /** First 1x1 pointwise convolution. (The inputTensor will not be disposed so that it can be used for achieving residual connection.) */
  static pointwise1Conv( inputTensor ) {
    return tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static pointwise1Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  static pointwise1Bias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.pointwise1BiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static pointwise1Activation_and_destroy( inputTensor ) {
    let t = this.pointwise1ActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Average Pooling. */
  static depthwiseAvg_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Max Pooling. */
  static depthwiseMax_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Convolution. */
  static depthwiseConv_and_destroy( inputTensor ) {
    let t = tf.depthwiseConv2d( inputTensor, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
    inputTensor.dispose();
    return t;
  }

  static depthwiseBias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.depthwiseBiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static depthwiseActivation_and_destroy( inputTensor ) {
    let t = this.depthwiseActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  static pointwise2Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.pointwise2FiltersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  static pointwise2Bias_and_destroy( inputTensor ) {
    let t = tf.add( inputTensor, this.pointwise2BiasesTensor3d );
    inputTensor.dispose();
    return t;
  }

  static pointwise2Activation_and_destroy( inputTensor ) {
    let t = this.pointwise2ActivationFunction( inputTensor );
    inputTensor.dispose();
    return t;
  }

  /** The input will be added to output for achieving residual connection. */
  static apply_and_destroy_AddInputToOutput( inputTensor ) {
    let t0, t1;

    // The first 1x1 pointwise convolution.
    t0 = this.pfn_pointwise1Conv( inputTensor ); // inputTensor should NOT be disposed here. It should be disposed later (after residual connection).
    t1 = this.pfn_pointwise1Bias( t0 );
    t0 = this.pfn_pointwise1Activation( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperation( t0 );
    t0 = this.pfn_depthwiseBias( t1 );
    t1 = this.pfn_depthwiseActivation( t0 );

    // The second 1x1 pointwise convolution.
    t0 = this.pfn_pointwise2Conv( t1 );
    t1 = this.pfn_pointwise2Bias( t0 );
    t0 = this.pfn_pointwise2Activation( t1 );

    // Residual connection.
    t1 = tf.add( inputTensor, t0 );

    inputTensor.dispose();
    t0.dispose();

    return t1;
  }

  /** The input will not be added to output (i.e. no residual connection). */
  static apply_and_destroy_NoResidual( inputTensor ) {
    let t0, t1;

//!!! ShuffleNetV2 step0Branch should not destroy input tensor.

    // The first 1x1 pointwise convolution.
    t0 = this.pfn_pointwise1Conv( inputTensor ); // inputTensor should be disposed here.
    t1 = this.pfn_pointwise1Bias( t0 );
    t0 = this.pfn_pointwise1Activation( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperation( t0 );
    t0 = this.pfn_depthwiseBias( t1 );
    t1 = this.pfn_depthwiseActivation( t0 );

    // The second 1x1 pointwise convolution.
    t0 = this.pfn_pointwise2Conv( t1 );
    t1 = this.pfn_pointwise2Bias( t0 );
    t0 = this.pfn_pointwise2Activation( t1 );

    return t0;
  }

/*
  /** Full with residual connection. * /
  static apply_and_destroy_PointBiasActivation_DepthBiasActivation_PointBiasActivation_AddInputToOutput( inputTensor ) {

    // The first 1x1 pointwise convolution.
    let t0 = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    // DO NOT dispose inputTensor here. It should be disposed at the end (after add it to output) for achieving residual connection.

    let t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
    t0.dispose(); t0 = this.pointwise1ActivationFunction( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1.dispose(); t1 = tf.depthwiseConv2d( t0, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
    t0.dispose(); t0 = tf.add( t1, this.depthwiseBiasesTensor3d );
    t1.dispose(); t1 = this.depthwiseActivationFunction( t0 );

    // The second 1x1 pointwise convolution.
    t0.dispose(); t0 = tf.conv2d( t1, this.pointwise2FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    t1.dispose(); t1 = tf.add( t0, this.pointwise2BiasesTensor3d );
    t0.dispose(); t0 = this.pointwise2ActivationFunction( t1 );

    // Residual connection.
    t1.dispose(); t1 = tf.add( inputTensor, t0 );

    inputTensor.dispose();
    t0.dispose();

    return t1;
  }

  /** Full without residual connection. * /
  static apply_and_destroy_PointBiasActivation_DepthBiasActivation_PointBiasActivation( t1 ) {

    // The first 1x1 pointwise convolution.
    let t0 = tf.conv2d( t1, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    t1.dispose(); t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
    t0.dispose(); t0 = this.pointwise1ActivationFunction( t1 );

    // The depthwise convolution (or average pooling, or max pooling).
    t1.dispose(); t1 = tf.depthwiseConv2d( t0, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
    t0.dispose(); t0 = tf.add( t1, this.depthwiseBiasesTensor3d );
    t1.dispose(); t1 = this.depthwiseActivationFunction( t0 );

    // The second 1x1 pointwise convolution.
    t0.dispose(); t0 = tf.conv2d( t1, this.pointwise2FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    t1.dispose(); t1 = tf.add( t0, this.pointwise2BiasesTensor3d );
    t0.dispose(); t0 = this.pointwise2ActivationFunction( t1 );

    return t0;
  }

  /**
   * Process input, destroy input, return result.
   *
   * @param {tf.tensor4d} inputTensor
   *   The image which will be processed. This inputTensor will be disposed.
   *
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   * /
  apply_and_destroy( inputTensor ) {
    
//!!!
    let t = inputTensor, tNew;

    // The first 1x1 pointwise convolution.
    if ( this.bPointwise1 ) {
      tNew = t.conv2d( this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                       // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bPointwise1Bias ) {
        tNew = t.add( this.pointwise1BiasesTensor3d );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.pointwise1ActivationFunction ) {
        tNew = this.pointwise1ActivationFunction( t );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }
    }

    // The depthwise convolution (or average pooling, or max pooling).
    if ( this.bDepthwiseConv ) {
      tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
      t.dispose();                                       // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bDepthwiseBias ) {
        tNew = t.add( this.depthwiseBiasesTensor3d );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.depthwiseActivationFunction ) {
        tNew = this.depthwiseActivationFunction( t );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

    } else if ( this.bDepthwiseAvg ) {
      tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
      t.dispose();                                       // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bDepthwiseBias ) {
        tNew = t.add( this.depthwiseBiasesTensor3d );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.depthwiseActivationFunction ) {
        tNew = this.depthwiseActivationFunction( t );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

    } else if ( this.bDepthwiseMax ) {
      tNew = t.pool( this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
      t.dispose();                                       // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bDepthwiseBias ) {
        tNew = t.add( this.depthwiseBiasesTensor3d );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.depthwiseActivationFunction ) {
        tNew = this.depthwiseActivationFunction( t );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

    }

    // The second 1x1 pointwise convolution.
    if ( this.bPointwise2 ) {
      tNew = t.conv2d( this.pointwise2FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                       // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bPointwise2Bias ) {
        tNew = t.add( this.pointwise2BiasesTensor3d );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.pointwise2ActivationFunction ) {
        tNew = this.pointwise2ActivationFunction( t );
        t.dispose();                                     // Dispose all intermediate (temporary) data.
        t = tNew;
      }
    }

    return t;

//!!!??? If ( pointwiseChannelCount == channelCount.expansionBefore ) in MobileNetV2, add input and output as output.

  }
*/

  /** The output channel count after these three convolutions. It is the same as this.channelCount_pointwise2After. */
  get outputChannelCount() { return this.channelCount_pointwise2After; }
}
