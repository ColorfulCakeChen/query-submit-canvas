
export { Base };

/**
 * Testing Filters of multiple layers.
 */
class Base {

  /**
   * @param name              This test filters' name.
   * @param sourceHeight      The height (and width) of the source image which will be processed by apply().
   * @param sourceDepth       The channel count of the source image.
   * @param targetHeight      The taregt image height (and width).
   * @param strAvgMaxConv     "Avg" or "Max" or "Conv". for average pooling, max pooling, depthwise convolution.
   * @param filterHeight      The height (and width) of each depthwise convolution.
   * @param bPointwise        If true, there will be pointwise convolution after every layer of depthwise convolution.
   */
  init( name, sourceHeight, sourceDepth, targetHeight, filterHeight, strAvgMaxConv, bPointwise ) {
    this.disposeTensors();

    this.name = name;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;
    let channelMultiplier = 1;

    this.strAvgMaxConv = strAvgMaxConv;
    this.bDepthwiseAvg = ( strAvgMaxConv == "Avg" );
    this.bDepthwiseMax = ( strAvgMaxConv == "Max" );
    this.bDepthwiseConv = ( strAvgMaxConv == "Conv" );

    this.bPointwise = bPointwise;

    this.depthwiseFiltersShape = [ filterHeight, filterWidth, sourceDepth, channelMultiplier ];
    this.depthwiseFilterHeightWidth = [ filterHeight, filterWidth ];

    let depthwiseFiltersValueCount = tf.util.sizeFromShape( this.depthwiseFiltersShape );

    this.pointwiseFiltersShape = [ 1, 1, sourceDepth, sourceDepth ];  // Assume output depth is the same as input.
    this.pointwiseFilterHeightWidth = [ 1, 1 ];

    let pointwiseFiltersValueCount = tf.util.sizeFromShape( this.pointwiseFiltersShape );

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = filterHeight - 1;

    // The step count for reducing sourceHeight to targetHeight by depthwise convolution filter.
    this.stepCount = Math.floor( differenceHeight / heightReducedPerStep );

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

      if ( this.bPointwise ) {
        tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ 0 ], 1, "valid" ); // 1x1, Stride = 1
        t.dispose();                                         // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      // Layer 1, ...
      if ( this.bDepthwiseAvg ) {

        for ( let i = 1; i < this.stepCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }
        }

      } else if ( this.bDepthwiseMax ) {

        for ( let i = 1; i < this.stepCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }
        }

      } else if ( this.bDepthwiseConv ) {

        for ( let i = 1; i < this.stepCount; ++i ) {
          tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ i ], 1, "valid" );  // Stride = 1
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = tNew;

          if ( this.bPointwise ) {
            tNew = t.conv2d( this.pointwiseFiltersTensor4dArray[ i ], 1, "valid" ); // 1x1, Stride = 1
            t.dispose();                                         // Dispose all intermediate (temporary) data.
            t = tNew;
          }
        }

      }

      if ( bReturn )
        return t;
    });
  }

}

