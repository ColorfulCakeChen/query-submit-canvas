
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
   * @param strAvgMaxConv     "Avg" or "Max" or "Conv". for average pooling, max pooling, depthwise convolution.
   *
   * @param depthwiseActivationName
   *   The activation function name after depthwise convolution. One of the following "", "relu", "relu6", "sigmoid", "sin".
   *
   * @param filterHeight      The height (and width) of each depthwise convolution.
   * @param bPointwise        If true, there will be pointwise convolution after every layer of depthwise convolution.
   *
   * @param pointwiseActivationName
   *   The activation function name after pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "sin".
   * If ( bPointwise == false ), this activation function will be ignored.
   */
  init( sourceHeight, sourceDepth, targetHeight, filterHeight, strAvgMaxConv, depthwiseActivationName, bPointwise, pointwiseActivationName ) {
    this.disposeTensors();

//    this.name = name;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;
    let channelMultiplier = 1;

    this.strAvgMaxConv = strAvgMaxConv;
    switch ( strAvgMaxConv ) {
      case "Avg":  this.bDepthwiseAvg = true;
      case "Max":  this.bDepthwiseMax = true;
      case "Conv": this.bDepthwiseConv = true;
    }

    this.depthwiseActivationName = depthwiseActivationName;
    switch ( depthwiseActivationName ) {
      case "relu":    this.depthwiseActivationFunction = tf.relu;    break;
      case "relu6":   this.depthwiseActivationFunction = tf.relu6;   break;
      case "sigmoid": this.depthwiseActivationFunction = tf.sigmoid; break;
      case "sin":     this.depthwiseActivationFunction = tf.sin;     break;
      //default:
    }

    this.bPointwise = bPointwise;

    this.pointwiseActivationName = pointwiseActivationName;
    switch ( pointwiseActivationName ) {
      case "relu":    this.pointwiseActivationFunction = tf.relu;    break;
      case "relu6":   this.pointwiseActivationFunction = tf.relu6;   break;
      case "sigmoid": this.pointwiseActivationFunction = tf.sigmoid; break;
      case "sin":     this.pointwiseActivationFunction = tf.sin;     break;
      //default:
    }

    this.depthwiseFiltersShape = [ filterHeight, filterWidth, sourceDepth, channelMultiplier ];
    this.depthwiseFilterHeightWidth = [ filterHeight, filterWidth ];

    let depthwiseFiltersValueCount = tf.util.sizeFromShape( this.depthwiseFiltersShape );

    this.pointwiseFiltersShape = [ 1, 1, sourceDepth, sourceDepth ];  // Assume output depth is the same as input.
    this.pointwiseFilterHeightWidth = [ 1, 1 ];

    let pointwiseFiltersValueCount = tf.util.sizeFromShape( this.pointwiseFiltersShape );

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = filterHeight - 1;

    // The step count for reducing sourceHeight to targetHeight by depthwise convolution filter.
    this.blockCount = Math.floor( differenceHeight / heightReducedPerStep );

    // e.g. "DConv_101x101_RELU_1x1_RELU_1_Block"
    this.name = `D${strAvgMaxConv}_${filterHeight}x{filterHeight}`
      + `${ this.depthwiseActivationFunction ? ( "_" + depthwiseActivationName ) : ""}`
      + `${ this.bPointwise ? "_1x1" : ""}`
      + `${ this.pointwiseActivationFunction ? ( "_" + pointwiseActivationName ) : ""}`
      + `${this.blockCount}_Block`
    ;

    // Every element (Tensor4d) is a depthwiseFilters for one layer (i.e. one step).
    this.depthwiseFiltersTensor4dArray = tf.tidy( () => {
      let filtersTensor4dArray = new Array( this.stepCount );
      for ( let i = 0; i < this.stepCount; ++i ) {
        if ( this.bDepthwiseConv ) {
          let filtersTensor1d = tf.range( 0, depthwiseFiltersValueCount, 1 );
          let filtersTensor4d = filtersTensor1d.reshape( this.depthwiseFiltersShape );
          filtersTensor4dArray[ i ] = filtersTensor4d;
        } else {
          filtersTensor4dArray[ i ] = null;
        }
      }
      return filtersTensor4dArray;
    });

    // Every element (Tensor4d) is a pointwiseFilters for one layer (i.e. one step).
    this.pointwiseFiltersTensor4dArray = tf.tidy( () => {
      let filtersTensor4dArray = new Array( this.stepCount );
      for ( let i = 0; i < this.stepCount; ++i ) {
        if ( bPointwise ) {
          let filtersTensor1d = tf.range( 0, pointwiseFiltersValueCount, 1 );
          let filtersTensor4d = filtersTensor1d.reshape( this.pointwiseFiltersShape );
          filtersTensor4dArray[ i ] = filtersTensor4d;
        } else {
          filtersTensor4dArray[ i ] = null;
        }
      }
      return filtersTensor4dArray;
    });

  }

  disposeTensors() {
    if ( this.depthwiseFiltersTensor4dArray ) {
      tf.dispose( this.depthwiseFiltersTensor4dArray );
      this.depthwiseFiltersTensor4dArray = null;
    }

    if ( this.pointwiseFiltersTensor4dArray ) {
      tf.dispose( this.pointwiseFiltersTensor4dArray );
      this.pointwiseFiltersTensor4dArray = null;
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

      let t, tNew;
//      let depthwiseFiltersTensor4d;
//      let pointwiseFiltersTensor4d;

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

      if ( this.depthwiseActivationFunction ) {
        tNew = this.depthwiseActivationFunction( t );
        t.dispose();                                         // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      if ( this.bPointwise ) {
        tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ 0 ], 1, "valid" ); // 1x1, Stride = 1
        t.dispose();                                         // Dispose all intermediate (temporary) data.
        t = tNew;

        if ( this.pointwiseActivationFunction ) {
          tNew = this.pointwiseActivationFunction( t );
          t.dispose();                                         // Dispose all intermediate (temporary) data.
          t = tNew;
        }
      }

      // Layer 1, ...
      if ( this.bDepthwiseAvg ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.depthwiseActivationFunction ) {
            tNew = this.depthwiseActivationFunction( t );
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;

            if ( this.pointwiseActivationFunction ) {
              tNew = this.pointwiseActivationFunction( t );
              t.dispose();                                         // Dispose all intermediate (temporary) data.
              t = tNew;
            }
          }
        }

      } else if ( this.bDepthwiseMax ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.depthwiseActivationFunction ) {
            tNew = this.depthwiseActivationFunction( t );
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;

            if ( this.pointwiseActivationFunction ) {
              tNew = this.pointwiseActivationFunction( t );
              t.dispose();                                         // Dispose all intermediate (temporary) data.
              t = tNew;
            }
          }
        }

      } else if ( this.bDepthwiseConv ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ i ], 1, "valid" );  // Stride = 1
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.depthwiseActivationFunction ) {
            tNew = this.depthwiseActivationFunction( t );
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;

            if ( this.pointwiseActivationFunction ) {
              tNew = this.pointwiseActivationFunction( t );
              t.dispose();                                         // Dispose all intermediate (temporary) data.
              t = tNew;
            }
          }
        }

      }

      if ( bReturn )
        return t;
    });
  }

}

