import * as TensorTools from "../util/TensorTools.js";

/**
 * Test different resize implementation for CNN.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-height-width-resize}
 */

/**
 * A test set.
 */
class HeightWidthDepth {

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

//!!! This testing seems crash the video driver.
//   // Test max-pool
//   test_MaxPool() {
//     tf.tidy( () => {
//       this.dataTensor3d.maxPool( this.filterHeightWidth, 1, "valid" );
//     });
//   }

  // Test avg-pool
  test_AvgPool() {
    tf.tidy( () => {
      this.dataTensor3d.avgPool( this.filterHeightWidth, 1, "valid" );
    });
  }

  // Test depthwise convolution (2D)
  test_DepthwiseConv2d() {
    tf.tidy( () => {
      this.dataTensor3d.depthwiseConv2D( this.depthwiseConvFilters, 1, "valid" );
    });
  }

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2() {
    tf.tidy( () => {
      this.dataTensor3d.depthwiseConv2D( this.depthwiseConv3x3Filters, 1, "same" );
    });
  }

  // Test rsize-nearest-neighbor
  test_ResizeNearestNeighbor() {
    tf.tidy( () => {
      this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
    });
  }

  // Test rsize-bilinear 
  test_ResizeBilinear() {
    tf.tidy( () => {
      this.dataTensor3d.resizeBilinear( this.targetSize, true );
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
//      let quarterTensor1 = this.dataTensor3d.maxPool( this.filterHeightWidth, 1, "valid" );
      let quarterTensor2 = this.dataTensor3d.avgPool( this.filterHeightWidth, 1, "valid" );
      let quarterTensor3 = this.dataTensor3d.depthwiseConv2D( this.depthwiseConvFilters, 1, "valid" );
      let quarterTensor4 = this.dataTensor3d.depthwiseConv2D( this.depthwiseConv3x3Filters, 1, "same" );
      let quarterTensor5 = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
      let quarterTensor6 = this.dataTensor3d.resizeBilinear( this.targetSize, true );

//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor1.shape, quarterTensor2.shape ),
//         `MaxPool() != AvgPool()`);

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
  }
  
}


globalThis.testSet_110x110x24 = new HeightWidthDepth( 110, 110, 24 ); // height, width, depth
