
export { Base };

/**
 * Testing Filters of multiple layers.
 *
 * @member {string} name This test filters' name.
 */
class Base {

  /**
   * @param sourceHeight      The height (and width) of the source image which will be processed by apply().
   * @param sourceDepth       The channel count of the source image.
   * @param targetHeight      The taregt image height (and width).
   * @param filterHeight      The height (and width) of each depthwise convolution.
   * @param channelMultiplier Every input channel will become so many channels.
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
    sourceHeight, sourceDepth, targetHeight,
    filterHeight, channelMultiplier,
    strAvgMaxConv, bDepthwiseBias, depthwiseActivationName,
    bPointwise, bPointwiseBias, pointwiseActivationName ) {

    this.disposeTensors();

//    this.name = name;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;
    this.channelMultiplier = channelMultiplier;

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

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = filterHeight - 1;

    // The step count for reducing sourceHeight to targetHeight by depthwise convolution filter.
    this.blockCount = Math.floor( differenceHeight / heightReducedPerStep );

    // e.g. "D24_DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1"
    this.name = `D${sourceDepth * channelMultiplier}_D${strAvgMaxConv}_${filterHeight}x${filterHeight}`
      + `${ ( this.bDepthwiseBias ) ? ( "_DBias" ) : ""}`
      + `${ ( this.depthwiseActivationFunction ) ? ( "_" + depthwiseActivationName ) : ""}`
      + `${ ( this.bPointwise ) ? "__PConv" : ""}`
      + `${ ( this.bPointwise && this.bPointwiseBias ) ? ( "_PBias" ) : ""}`
      + `${ ( this.bPointwise && this.pointwiseActivationFunction ) ? ( "_" + pointwiseActivationName ) : ""}`
      + `__Block_${this.blockCount}`
    ;

    // Depthwise Filters and Biases

    this.depthwiseFilterHeightWidth = [ filterHeight, filterWidth ];
    this.depthwiseFiltersShape = [ filterHeight, filterWidth, sourceDepth, channelMultiplier ];
    this.depthwiseBiasesShape =  [            1,           1, ( sourceDepth * channelMultiplier ) ];

    let depthwiseFiltersValueCount = tf.util.sizeFromShape( this.depthwiseFiltersShape );
    let depthwiseBiasesValueCount =  tf.util.sizeFromShape( this.depthwiseBiasesShape );

    // Every element (Tensor4d) is a depthwiseFilters for one block.
    this.depthwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, depthwiseFiltersValueCount, this.depthwiseFiltersShape, this.bDepthwiseConv );

    // Every element (Tensor3d) is a depthwiseBiases for one block.
    this.depthwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, depthwiseBiasesValueCount, this.depthwiseBiasesShape, ( this.bDepthwiseConv && bDepthwiseBias ) );


    // Pointwise Filters and Biases

    let pointwiseInputDepth =  sourceDepth;
    let pointwiseOutputDepth = sourceDepth; // Assume output depth is the same as input.

    this.pointwiseFilterHeightWidth = [ 1, 1 ];
    this.pointwiseFiltersShape = [ 1, 1, pointwiseInputDepth, pointwiseOutputDepth ];

    // Both input depth and output depth of pointwise bias are the same as pointwise convolution output.
    this.pointwiseBiasesShape =  [ 1, 1, pointwiseOutputDepth ];

    let pointwiseFiltersValueCount = tf.util.sizeFromShape( this.pointwiseFiltersShape );
    let pointwiseBiasesValueCount =  tf.util.sizeFromShape( this.pointwiseBiasesShape );

    // Every element (Tensor4d) is a pointwiseFilters for one block.
    this.pointwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, pointwiseFiltersValueCount, this.pointwiseFiltersShape, bPointwise );

    // Every element (Tensor3d) is a pointwiseBiases for one block.
    this.pointwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, pointwiseBiasesValueCount, this.pointwiseBiasesShape, ( bPointwise && bPointwiseBias ) );
  }

  /**
   * @param {number}   blockCount     The element count (i.e. length) of the returned array.
   * @param {number}   valueCount     The element count of every tensor4d (which is an element of the returned array).
   * @param {number[]} newTensorShape The tensor's shape of every element of the returned array.
   * @param {boolean}  bNullElement   If true, every element of the return array will be null.
   *
   * @return {tf.tensor4d[]|tf.tensor3d[]}
   *   Return a array whose every element is a tensor4d or tensor3d (for one block), or null (if ( bNullElement == true ) ).
   */
  static generateTensorArray( blockCount, valueCount, newTensorShape, bNullElement ) {
    return tf.tidy( () => {
      let tensorNewArray = new Array( blockCount );
      for ( let i = 0; i < blockCount; ++i ) {
        if ( bNullElement ) {
          let tensor1d = tf.range( 0, valueCount, 1 );
          let tensorNew = tensor1d.reshape( newTensorShape );
          tensorNewArray[ i ] = tensorNew;
        } else {
          tensorNewArray[ i ] = null;
        }
      }
      return tensorNewArray;
    });
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
   * @param  {tf.tensor4d} inputTensor  Apply this tensor with depthwise (bias and activation) and pointwise (bias and activation).
   * @param  {number}      blockIndex   Which block's depthwise and pointwise operrations.
   * @return {tf.tensor4d} Return a new tensor. All other tensors (including inputTensor) were disposed.
   */
  apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( inputTensor, blockIndex ) {
    let t = inputTensor, tNew;

    if ( this.bDepthwiseBias ) {
      tNew = t.add( this.depthwiseBiasesTensor3dArray[ blockIndex ] );
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;
    }

    if ( this.depthwiseActivationFunction ) {
      tNew = this.depthwiseActivationFunction( t );
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;
    }

    if ( this.bPointwise ) {
      tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ blockIndex ], 1, "valid" ); // 1x1, Stride = 1
      t.dispose();                                         // Dispose all intermediate (temporary) data.
      t = tNew;

      if ( this.bPointwiseBias ) {
        tNew = t.add( this.pointwiseBiasesTensor3dArray[ blockIndex ] );
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

