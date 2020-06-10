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
    this.targetSize = [ ( height / 2 ), ( width / 2 ) ];

    let filterHeight =      this.targetSize[ 0 ] + 1;
    let filterWidth =       this.targetSize[ 1 ] + 1;
    this.filterHeightWidth = [ filterHeight, filterWidth ];

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let inChannels =        depth;
    let channelMultiplier = 1;

    this.depthwiseConvFilters = tf.tidy( () => {
      let filtersShape = [ filterHeight, filterWidth, inChannels, channelMultiplier ];
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

    if ( this.depthwiseConvFilters ) {
      tf.dispose( this.depthwiseConvFilters );
      this.depthwiseConvFilters = null;
    }

    if ( this.depthwiseConv3x3Filters ) {
      tf.dispose( this.depthwiseConv3x3Filters );
      this.depthwiseConv3x3Filters = null;
    }
  }

  // Test max-pool
  test_MaxPool() {
    tf.tidy( () => {
      let t = this.dataTensor3d.maxPool( this.filterHeightWidth, 1, "valid" );
      tf.dispose( t );
    });
  }

  // Test avg-pool
  test_AvgPool() {
    tf.tidy( () => {
      let t = this.dataTensor3d.avgPool( this.filterHeightWidth, 1, "valid" );
      tf.dispose( t );
    });
  }

  // Test depthwise convolution (2D)
  test_DepthwiseConv2d() {
    tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d( this.depthwiseConvFilters, 1, "valid" );
      tf.dispose( t );
    });
  }

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2() {
    tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d( this.depthwiseConv3x3Filters, 2, "same" );
      tf.dispose( t );
    });
  }

  // Test rsize-nearest-neighbor
  test_ResizeNearestNeighbor() {
    tf.tidy( () => {
      let t = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
      tf.dispose( t );
    });
  }

  // Test rsize-bilinear 
  test_ResizeBilinear() {
    tf.tidy( () => {
      let t = this.dataTensor3d.resizeBilinear( this.targetSize, true );
      tf.dispose( t );
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
      let quarterTensor1 = this.dataTensor3d.maxPool( this.filterHeightWidth, 1, "valid" );
      let quarterTensor2 = this.dataTensor3d.avgPool( this.filterHeightWidth, 1, "valid" );
      let quarterTensor3 = this.dataTensor3d.depthwiseConv2d( this.depthwiseConvFilters, 1, "valid" );
      let quarterTensor4 = this.dataTensor3d.depthwiseConv2d( this.depthwiseConv3x3Filters, 2, "same" );
      let quarterTensor5 = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
      let quarterTensor6 = this.dataTensor3d.resizeBilinear( this.targetSize, true );

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor1.shape, quarterTensor2.shape ),
        `MaxPool() != AvgPool()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor2.shape, quarterTensor3.shape ),
        `AvgPool() != DepthwiseConv2d()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor3.shape, quarterTensor4.shape ),
        `DepthwiseConv2d() != DepthwiseConv2d_3x3_Stride2()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor4.shape, quarterTensor5.shape ),
        `DepthwiseConv2d_3x3_Stride2() != ResizeNearestNeighbor()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor5.shape, quarterTensor6.shape ),
        `ResizeNearestNeighbor() != ResizeBilinear()`);
    });

    tf.tidy( () => {
      this.logProfile( "MaxPool", this.test_MaxPool.bind( this ) );
      this.logProfile( "AvgPool", this.test_AvgPool.bind( this ) );
      this.logProfile( "DepthwiseConv2d", this.test_DepthwiseConv2d.bind( this ) );
      this.logProfile( "DepthwiseConv2d_3x3_Stride2", this.test_DepthwiseConv2d_3x3_Stride2.bind( this ) );
      this.logProfile( "ResizeNearestNeighbor", this.test_ResizeNearestNeighbor.bind( this ) );
      this.logProfile( "ResizeBilinear", this.test_ResizeBilinear.bind( this ) );
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
