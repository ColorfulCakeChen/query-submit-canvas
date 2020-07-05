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
??? 
 * apply_and_destroy_??? NotShuffleNetV2_NotMobileNetV2(), apply_and_destroy_???ShuffleNetV2(), apply_and_destroy_???MobileNetV2() according to
 * the init()'s parameters.
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
   */
  init(
    channelCount_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStrides, depthwisePad, bDepthwiseBias, depthwiseActivationName,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    bAddInputToOutput ) {

    this.disposeTensors();

    this.channelCount_pointwise1Before = channelCount_pointwise1Before;

    // The first 1x1 pointwise convolution.
    this.pointwise1ChannelCount = pointwise1ChannelCount;
    this.bPointwise1 = ( pointwise1ChannelCount > 0 );
    this.bPointwise1Bias = bPointwise1Bias;
    this.pointwise1ActivationName = pointwise1ActivationName;
    this.pointwise1ActivationFunction = PointDepthPoint.getActivationFunction( pointwise1ActivationName );

    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = pointwise1ChannelCount;

      this.pointwise1FilterHeightWidth = [ 1, 1 ];
      this.pointwise1FiltersShape =      [ 1, 1, this.channelCount_pointwise1Before, this.channelCount_pointwise1After_depthwiseBefore ];
      this.pointwise1BiasesShape =       [ 1, 1, this.channelCount_pointwise1After_depthwiseBefore ];

      this.pointwise1FiltersTensor4d = PointDepthPoint.generateTensor( this.pointwise1FiltersShape );

      if ( bPointwise1Bias )
        this.pointwise1BiasesTensor3d = PointDepthPoint.generateTensor( this.pointwise1BiasesShape );

    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount_pointwise1Before;  // No first 1x1 pointwise convolution.
    }

    // The depthwise operation.
    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if ( Number.isNaN( depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
        case "Avg":  this.bDepthwise = this.bDepthwiseAvg = true; break;
        case "Max":  this.bDepthwise = this.bDepthwiseMax = true; break;
        //case "Conv": this.bDepthwiseConv = true;
      }
      this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // depthwise without channel multiplier.

    } else {
      if ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) {
        this.bDepthwise = this.bDepthwiseConv = true;
        this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ depthwiseFilterHeight, this.depthwiseFilterWidth, this.channelCount_pointwise1After_depthwiseBefore, depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersTensor4d = PointDepthPoint.generateTensor( this.depthwiseFiltersShape );

      } else {
        this.bDepthwise = this.bDepthwiseConv = false;  // e.g. zero or negative number
        this.channelCount_depthwiseAfter_pointwise2Before = this.channelCount_pointwise1After_depthwiseBefore; // No depthwise (so that no channel multiplier).
      }
    }

    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.
    this.depthwiseStrides = depthwiseStrides;
    this.depthwisePad = depthwisePad;
    this.bDepthwiseBias = bDepthwiseBias;
    this.depthwiseActivationName = depthwiseActivationName;
    this.depthwiseActivationFunction = PointDepthPoint.getActivationFunction( depthwiseActivationName );

    this.depthwiseFilterHeightWidth = [ depthwiseFilterHeight, this.depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before ];

    if ( this.bDepthwise ) {
      if ( bDepthwiseBias )
        this.depthwiseBiasesTensor3d = PointDepthPoint.generateTensor( this.depthwiseBiasesShape );
    }

    // The second pointwise convolution. (This convolution is always existed. It, however, may have or not bias and activation function.)
    this.pointwise2ChannelCount = pointwise2ChannelCount;
    this.bPointwise2 = ( pointwise2ChannelCount > 0 );
    this.bPointwise2Bias = bPointwise2Bias;
    this.pointwise2ActivationName = pointwise2ActivationName;
    this.pointwise2ActivationFunction = PointDepthPoint.getActivationFunction( pointwise2ActivationName );

    if ( this.bPointwise2 ) {
      this.channelCount_pointwise2After = this.pointwise2ChannelCount;

      this.pointwise2FilterHeightWidth = [ 1, 1 ];
      this.pointwise2FiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before, this.channelCount_pointwise2After ];
      this.pointwise2BiasesShape =       [ 1, 1, this.channelCount_pointwise2After ];

      this.pointwise2FiltersTensor4d = PointDepthPoint.generateTensor( this.pointwise2FiltersShape );

      if ( bPointwise2Bias )
        this.pointwise2BiasesTensor3d = PointDepthPoint.generateTensor( this.pointwise2BiasesShape );

    } else {
      this.channelCount_pointwise2After = this.channelCount_depthwiseAfter_pointwise2Before;
    }

    this.bAddInputToOutput = bAddInputToOutput;
    if ( bAddInputToOutput )
      if ( depthwiseStrides == 1 )
        if ( channelCount_pointwise1Before == this.channelCount_pointwise2After ) {
//!!!
          this.apply_and_destroy = ???;
        }

//!!!
    this.apply_and_destroy = ???;
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
  }

  /** */
  static apply_and_destroy_PointBiasActivation_DepthBiasActivation_PointBiasActivation_AddInputToOutput( inputTensor ) {
    let t0, t1;

    // The first 1x1 pointwise convolution.
    t0 = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    // DO NOT dispose inputTensor here. It should be disposed at the end (after add it to output) for achieving residual connection.

    t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
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
//???
  /** */
  static apply_and_destroy_PointBiasActivation_DepthBiasActivation_PointBiasActivation_AddInputToOutput( inputTensor ) {
    let t0, t1;

    // The first 1x1 pointwise convolution.
    t0 = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
    // DO NOT dispose inputTensor here. It should be disposed at the end (after add it to output) for achieving residual connection.

    t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
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

  /** The output channel count after these three convolutions. It is the same as this.channelCount_pointwise2After. */
  get outputChannelCount() { return this.channelCount_pointwise2After; }
}
