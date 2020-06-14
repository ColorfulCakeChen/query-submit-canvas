//import * as TensorTools from "../util/TensorTools.js";

export { Base };

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
    this.targetSize = [ Math.floor( height / 20 ) * 10, Math.floor( width / 20 ) * 10 ];

    // The filter size for achieving target size in one step.
    let filterHeight_OneStep =      ( height - this.targetSize[ 0 ] ) + 1;
    let filterWidth_OneStep =       ( width - this.targetSize[ 1 ] ) + 1;
    this.filterHeightWidth_OneStep = [ filterHeight_OneStep, filterWidth_OneStep ];

    // How many steps if achieving target size in many 3x3 depthwise convolution.
    let sizeReducedPerStepBy3x3 = 3 - 1;
    this.stepsBy3x3MultiSteps = ( this.height - this.targetSize[ 0 ] ) / sizeReducedPerStepBy3x3;

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let inChannels =        depth;
    let channelMultiplier = 1;

    this.depthwiseConvFilters_OneStep = tf.tidy( () => {
      let filtersShape = [ filterHeight_OneStep, filterWidth_OneStep, inChannels, channelMultiplier ];
      let filtersValueCount = tf.util.sizeFromShape( filtersShape );

      let filtersTensor1d = tf.range( 0, filtersValueCount, 1 );
      let filtersTensor4d = filtersTensor1d.reshape( filtersShape );
      return filtersTensor4d;
    });

    this.depthwiseConv3x3Filters = tf.tidy( () => {
      let filtersShape = [ 3, 3, inChannels, channelMultiplier ];
      let filtersValueCount = tf.util.sizeFromShape( filtersShape );

      let filtersTensor1d = tf.range( 0, filtersValueCount, 1 );
      let filtersTensor4d = filtersTensor1d.reshape( filtersShape );
      return filtersTensor4d;
    });
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      tf.dispose( this.dataTensor3d );
      this.dataTensor3d = null;
    }

    if ( this.depthwiseConvFilters_OneStep ) {
      tf.dispose( this.depthwiseConvFilters_OneStep );
      this.depthwiseConvFilters_OneStep = null;
    }

    if ( this.depthwiseConv3x3Filters ) {
      tf.dispose( this.depthwiseConv3x3Filters );
      this.depthwiseConv3x3Filters = null;
    }
  }

  // Test max-pool
  test_MaxPool( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.maxPool( this.filterHeightWidth_OneStep, 1, "valid" );
      if ( bReturn )
        return t;
    });
  }

  // Test avg-pool
  test_AvgPool( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.avgPool( this.filterHeightWidth_OneStep, 1, "valid" );
      if ( bReturn )
        return t;
    });
  }

  // Test depthwise convolution (2D)
  test_DepthwiseConv2d_OneStep( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d( this.depthwiseConvFilters_OneStep, 1, "valid" );
      if ( bReturn )
        return t;
    });
  }

  // Test depthwise convolution (2D) by 3x3 filter with multi-step
  test_DepthwiseConv2d_3x3_MultiStep( bReturn ) {
    return tf.tidy( () => {
      let steps = this.stepsBy3x3MultiSteps;
      let t = this.dataTensor3d;
      for ( let i = 0; i < steps; ++i ) {
        let tNew = t.depthwiseConv2d( this.depthwiseConv3x3Filters, 1, "valid" );

        if ( t != this.dataTensor3d )  // NOTE: Do not dispose the original data.
          tf.dispose( t );

        t = tNew;
      }
      if ( bReturn )
        return t;
    });
  }

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d( this.depthwiseConv3x3Filters, 2, "same" );
      if ( bReturn )
        return t;
    });
  }

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
      let quarterTensor1 = this.test_MaxPool( true );
      let quarterTensor2 = this.test_AvgPool( true );
      let quarterTensor3 = this.test_DepthwiseConv2d_OneStep( true );
      let quarterTensor4 = this.test_DepthwiseConv2d_3x3_MultiStep( true );
      let quarterTensor5 = this.test_DepthwiseConv2d_3x3_Stride2( true );
      let quarterTensor6 = this.test_ResizeBilinear( true );
      let quarterTensor7 = this.test_ResizeNearestNeighbor( true );

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor1.shape, quarterTensor2.shape ),
        `MaxPool() != AvgPool()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor2.shape, quarterTensor3.shape ),
        `AvgPool() != DepthwiseConv2d_OneStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor3.shape, quarterTensor4.shape ),
        `DepthwiseConv2d_OneStep() != DepthwiseConv2d_3x3_MultiStep()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor4.shape, quarterTensor5.shape ),
        `DepthwiseConv2d_3x3_MultiStep() != DepthwiseConv2d_3x3_Stride2()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor5.shape, quarterTensor6.shape ),
        `DepthwiseConv2d_3x3_Stride2() != ResizeBilinear()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor6.shape, quarterTensor7.shape ),
        `ResizeBilinear() != ResizeNearestNeighbor()`);
    });

    tf.tidy( () => {
      this.logProfile( "MaxPool", this.test_MaxPool.bind( this ) );
      this.logProfile( "AvgPool", this.test_AvgPool.bind( this ) );
      this.logProfile( "DepthwiseConv2d_OneStep", this.test_DepthwiseConv2d_OneStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_3x3_MultiStep", this.test_DepthwiseConv2d_3x3_MultiStep.bind( this ) );
      this.logProfile( "DepthwiseConv2d_3x3_Stride2", this.test_DepthwiseConv2d_3x3_Stride2.bind( this ) );
      this.logProfile( "ResizeBilinear", this.test_ResizeBilinear.bind( this ) );
      this.logProfile( "ResizeNearestNeighbor", this.test_ResizeNearestNeighbor.bind( this ) );
    });
  }
  
  logProfile( title, func ) {
    tf.profile( func ).then( profile => {
      tf.time( func ).then( time => {
        
        console.log(
           `${title}: `

         + `newBytes: ${profile.newBytes}, `
         + `newTensors: ${profile.newTensors}, `
         + `peakBytes: ${profile.peakBytes}, `
         + `byte usage over all kernels: ${profile.kernels.map(k => k.totalBytesSnapshot)}, `

         + `kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
      });
    });
  }
}
