//import * as TensorTools from "../util/TensorTools.js";

export { Base };

/**
 * Testing Filters of multiple layers.
 */
class TestFilters2D {

  /**
   * @param sourceHeight      The height (and width) of the source image which will be processed by apply().
   * @param sourceDepth       The channel count of the source image.
   * @param targetHeight      The taregt image height (and width).
   * @param filterHeight      The height (and width) of each depthwise convolution.
   * @param bPointwise        If true, there will be pointwise convolution after every layer of depthwise convolution.
   */
  init( sourceHeight, sourceDepth, targetHeight, filterHeight, bPointwise ) {
    this.disposeTensors();

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;
    let channelMultiplier = 1;

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
        let filtersTensor1d = tf.range( 0, depthwiseFiltersValueCount, 1 );
        let filtersTensor4d = filtersTensor1d.reshape( this.depthwiseFiltersShape );
        filtersTensor4dArray[ i ] = filtersTensor4d;
      }
      return filtersTensor4dArray;
    });

    // Every element (Tensor4d) is a pointwiseFilters for one layer (i.e. one step).
    this.pointwiseFiltersTensor4dArray = tf.tidy( () => {
      let filtersTensor4dArray = new Array( this.stepCount );
      for ( let i = 0; i < this.stepCount; ++i ) {
        let filtersTensor1d = tf.range( 0, pointwiseFiltersValueCount, 1 );
        let filtersTensor4d = filtersTensor1d.reshape( this.pointwiseFiltersShape );
        filtersTensor4dArray[ i ] = filtersTensor4d;
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

      let tNew;

      // Layer 0
      //
      // So that every layer could dispose previous result without worry about mis-dispose source.
      let depthwiseFiltersTensor4d = this.depthwiseFiltersTensor4dArray[ 0 ];
      let pointwiseFiltersTensor4d = this.pointwiseFiltersTensor4dArray[ 0 ];

      let t = sourceImage.depthwiseConv2d( depthwiseFiltersTensor4d, 1, "valid" );  // Stride = 1
      // NOTE: Do not dispose the original data.

      if ( this.bPointwise ) {
        tNew = t.conv2d( pointwiseFiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
        tf.dispose( t );                                         // Dispose all intermediate (temporary) data.
        t = tNew;
      }

      // Layer 1, ...
      for ( let i = 1; i < this.stepCount; ++i ) {
        depthwiseFiltersTensor4d = this.depthwiseFiltersTensor4dArray[ i ];
        pointwiseFiltersTensor4d = this.pointwiseFiltersTensor4dArray[ i ];

        tNew = t.depthwiseConv2d( depthwiseFiltersTensor4d, 1, "valid" );  // Stride = 1
        tf.dispose( t );                                           // Dispose all intermediate (temporary) data.
        t = tNew;

        if ( this.bPointwise ) {
          tNew = t.conv2d( pointwiseFiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
          tf.dispose( t );                                         // Dispose all intermediate (temporary) data.
          t = tNew;
        }
      }

      if ( bReturn )
        return t;
    });
  }

}


/**
 * A test set.
 */
class Base {

  /**
   * @param {number} height      image height
   * @param {number} width       image width
   * @param {number} depth       image channel count
   */
  constructor( height, width, depth ) {

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;

    //this.concatenatedShape = [ height, width, depth ];

    // About half, but the difference should be divisable by 2.
//    this.targetSize = [ Math.floor( height / 20 ) * 10, Math.floor( width / 20 ) * 10 ];
    this.targetSize = [ 1, 1 ]; // to 1x1.

    // The filter size for achieving target size in one step.
    let filterHeight_OneStep =      ( height - this.targetSize[ 0 ] ) + 1;
    let filterWidth_OneStep =       ( width - this.targetSize[ 1 ] ) + 1;

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let inChannels =        depth;
    let channelMultiplier = 1;

    ( this.depthwiseConvFilters_OneStep = new TestFilters2D() )
      .init( height, depth, this.targetSize[ 0 ], filterHeight_OneStep, false );

    ( this.depthwiseConvFilters_1x1_OneStep = new TestFilters2D() )
      .init( height, depth, this.targetSize[ 0 ], filterHeight_OneStep, true );

    ( this.depthwiseConv2x2Filters = new TestFilters2D() ).init( height, depth, this.targetSize[ 0 ], 2, false );
    ( this.depthwiseConv2x2Filters1x1 = new TestFilters2D() ).init( height, depth, this.targetSize[ 0 ], 2, true );

    ( this.depthwiseConv3x3Filters = new TestFilters2D() ).init( height, depth, this.targetSize[ 0 ], 3 );
    ( this.depthwiseConv6x6Filters = new TestFilters2D() ).init( height, depth, this.targetSize[ 0 ], 6 );
    ( this.depthwiseConv11x11Filters = new TestFilters2D() ).init( height, depth, this.targetSize[ 0 ], 11 );
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      tf.dispose( this.dataTensor3d );
      this.dataTensor3d = null;
    }

    if ( this.depthwiseConvFilters_OneStep ) {
      this.depthwiseConvFilters_OneStep.disposeTensors();
      this.depthwiseConvFilters_OneStep = null;
    }

    if ( this.depthwiseConvFilters_1x1_OneStep ) {
      this.depthwiseConvFilters_1x1_OneStep.disposeTensors();
      this.depthwiseConvFilters_1x1_OneStep = null;
    }

    if ( this.depthwiseConv2x2Filters1x1 ) {
      this.depthwiseConv2x2Filters1x1.disposeTensors();
      this.depthwiseConv2x2Filters1x1 = null;
    }

    if ( this.depthwiseConv2x2Filters ) {
      this.depthwiseConv2x2Filters.disposeTensors();
      this.depthwiseConv2x2Filters = null;
    }

    if ( this.depthwiseConv3x3Filters ) {
      this.depthwiseConv3x3Filters.disposeTensors();
      this.depthwiseConv3x3Filters = null;
    }

    if ( this.depthwiseConv6x6Filters ) {
      this.depthwiseConv6x6Filters.disposeTensors();
      this.depthwiseConv6x6Filters = null;
    }

    if ( this.depthwiseConv11x11Filters ) {
      this.depthwiseConv11x11Filters.disposeTensors();
      this.depthwiseConv11x11Filters = null;
    }
  }

  // Test max-pool
  test_MaxPool( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.maxPool( this.depthwiseConvFilters_OneStep.depthwiseFilterHeightWidth, 1, "valid" );
      if ( bReturn )
        return t;
    });
  }

  // Test avg-pool
  test_AvgPool( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.pool( this.depthwiseConvFilters_OneStep.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
      if ( bReturn )
        return t;
    });
  }

  // Test depthwise convolution (2D)
  test_DepthwiseConv2d_OneStep( bReturn ) {
    return this.depthwiseConvFilters_OneStep.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) and pointwise convolution
  test_DepthwiseConv2d_1x1_OneStep( bReturn ) {
    return this.depthwiseConvFilters_1x1_OneStep.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 2x2 filter with multi-step
  test_DepthwiseConv2d_2x2_MultiStep( bReturn ) {
    return this.depthwiseConv2x2Filters.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 2x2 filter and pointwise convolution with multi-step
  test_DepthwiseConv2d_2x2_1x1_MultiStep( bReturn ) {
    return this.depthwiseConv2x2Filters1x1.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 3x3 filter with multi-step
  test_DepthwiseConv2d_3x3_MultiStep( bReturn ) {
    return this.depthwiseConv3x3Filters.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 6x6 filter with multi-step
  test_DepthwiseConv2d_6x6_MultiStep( bReturn ) {
    return this.depthwiseConv6x6Filters.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 11x11 filter with multi-step
  test_DepthwiseConv2d_11x11_MultiStep( bReturn ) {
    return this.depthwiseConv11x11Filters.apply( this.dataTensor3d, bReturn );
  }

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d(
                this.depthwiseConv3x3Filters.depthwiseConvFiltersTensor4dArray[ 0 ], 2, "same" );
      if ( bReturn )
        return t;
    });
  }

//!!! ...unfinished...
// resize 1/2 v.s. tf.pool( windowShape = [ 2, 2 ], poolingType = “avg”, pad = “valid”, dilations = 1, strides = 2 )
  // Test rsize-bilinear 
  test_ResizeBilinear( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.resizeBilinear( this.targetSize, true );
      if ( bReturn )
        return t;
    });
  }

  // Test rsize-nearest-neighbor
  test_ResizeNearestNeighbor( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
      if ( bReturn )
        return t;
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
      let quarterTensor_MaxPool =               this.test_MaxPool( true );
      let quarterTensor_AvgPool =               this.test_AvgPool( true );
      let quarterTensor_OneStep =               this.test_DepthwiseConv2d_OneStep( true );
      let quarterTensor_1x1_OneStep =           this.test_DepthwiseConv2d_1x1_OneStep( true );
      let quarterTensor_2x2 =                   this.test_DepthwiseConv2d_2x2_MultiStep( true );
      let quarterTensor_2x2_1x1 =               this.test_DepthwiseConv2d_2x2_1x1_MultiStep( true );
      let quarterTensor_3x3 =                   this.test_DepthwiseConv2d_3x3_MultiStep( true );
      let quarterTensor_6x6 =                   this.test_DepthwiseConv2d_6x6_MultiStep( true );
      let quarterTensor_11x11 =                 this.test_DepthwiseConv2d_11x11_MultiStep( true );
//      let quarterTensor_3x3_Stride2 =           this.test_DepthwiseConv2d_3x3_Stride2( true );
      let quarterTensor_ResizeBilinear =        this.test_ResizeBilinear( true );
      let quarterTensor_ResizeNearestNeighbor = this.test_ResizeNearestNeighbor( true );

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_MaxPool.shape, quarterTensor_AvgPool.shape ),
        `MaxPool() != AvgPool()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_AvgPool.shape, quarterTensor_OneStep.shape ),
        `AvgPool() != DepthwiseConv2d_OneStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_OneStep.shape, quarterTensor_1x1_OneStep.shape ),
        `DepthwiseConv2d_OneStep() != DepthwiseConv2d_1x1_OneStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_1x1_OneStep.shape, quarterTensor_2x2.shape ),
        `DepthwiseConv2d_1x1_OneStep() != DepthwiseConv2d_2x2_MultiStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_2x2.shape, quarterTensor_2x2_1x1.shape ),
        `DepthwiseConv2d_2x2_MultiStep() != DepthwiseConv2d_2x2_1x1_MultiStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_2x2_1x1.shape, quarterTensor_3x3.shape ),
        `DepthwiseConv2d_2x2_1x1_MultiStep() != DepthwiseConv2d_3x3_MultiStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_3x3.shape, quarterTensor_6x6.shape ),
        `DepthwiseConv2d_3x3_MultiStep() != DepthwiseConv2d_6x6_MultiStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_6x6.shape, quarterTensor_11x11.shape ),
        `DepthwiseConv2d_6x6_MultiStep() != DepthwiseConv2d_11x11_MultiStep()`);

//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_11x11.shape, quarterTensor_3x3_Stride2.shape ),
//         `DepthwiseConv2d_11x11_MultiStep() != DepthwiseConv2d_3x3_Stride2()`);
//
//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_3x3_Stride2.shape, quarterTensor_ResizeBilinear.shape ),
//         `DepthwiseConv2d_3x3_Stride2() != ResizeBilinear()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_11x11.shape, quarterTensor_ResizeBilinear.shape ),
        `DepthwiseConv2d_11x11_MultiStep() != ResizeBilinear()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_ResizeBilinear.shape, quarterTensor_ResizeNearestNeighbor.shape ),
        `ResizeBilinear() != ResizeNearestNeighbor()`);
    });

    tf.tidy( () => {
      this.logProfile( "MaxPool", this.test_MaxPool.bind( this ) );
      this.logProfile( "AvgPool", this.test_AvgPool.bind( this ) );
      this.logProfile( "DepthwiseConv2d_OneStep", this.test_DepthwiseConv2d_OneStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_1x1_OneStep", this.test_DepthwiseConv2d_1x1_OneStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_11x11_MultiStep", this.test_DepthwiseConv2d_11x11_MultiStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_6x6_MultiStep", this.test_DepthwiseConv2d_6x6_MultiStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_3x3_MultiStep", this.test_DepthwiseConv2d_3x3_MultiStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_2x2_MultiStep", this.test_DepthwiseConv2d_2x2_MultiStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_2x2_1x1_MultiStep", this.test_DepthwiseConv2d_2x2_1x1_MultiStep.bind( this ) );
//      this.logProfile( "DepthwiseConv2d_3x3_Stride2", this.test_DepthwiseConv2d_3x3_Stride2.bind( this ) );
      this.logProfile( "ResizeBilinear", this.test_ResizeBilinear.bind( this ) );
      this.logProfile( "ResizeNearestNeighbor", this.test_ResizeNearestNeighbor.bind( this ) );
    });
  }
  
  logProfile( title, func ) {
    tf.profile( func ).then( profile => {
      tf.time( func ).then( time => {

        let backendName = tf.getBackend();

        console.log(
           `${title} (${backendName}): `

         + `newBytes: ${profile.newBytes}, `
         + `newTensors: ${profile.newTensors}, `
         + `peakBytes: ${profile.peakBytes}, `
//         + `byte usage over all kernels: ${profile.kernels.map(k => k.totalBytesSnapshot)}, `

         + `kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
      });
    });
  }
}
