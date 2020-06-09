//import * as ChannelShuffler from "../Layer/ChannelShuffler.js";

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

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    this.depthwiseConvFilters = tf.tidy( () => {
      let filterHeight =      targetSize[ 0 ] + 1;
      let filterWidth =       targetSize[ 1 ] + 1;
      let inChannels =        depth;
      let channelMultiplier = 1;
      let filtersShape = [ filterHeight, filterWidth, inChannels, channelMultiplier ];

      let filtersTensor1d = tf.range( 1, this.valueCount, 1 );
      let filtersTensor4d = tf.tensor4d( filtersTensor1d, filtersShape );
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
  }

  // Test max-pool
  test_MaxPool() {
    tf.tidy( () => {
      let quarter = this.dataTensor3d.maxPool( 2, 1, "valid" );
    });
  }

  // Test avg-pool
  test_AvgPool() {
    tf.tidy( () => {
      let quarter = this.dataTensor3d.avgPool( 2, 1, "valid" );
    });
  }

  // Test depthwise convolution (2D)
  test_DepthwiseConv2d() {
    tf.tidy( () => {
      let quarter = this.dataTensor3d.depthwiseConv2d( this.depthwiseConvFilters, 1, "valid" );
    });
  }

  // Test rsize-nearest-neighbor
  test_ResizeNearestNeighbor() {
    tf.tidy( () => {
      let quarter = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
    });
  }

  // Test rsize-bilinear 
  test_ResizeBilinear() {
    tf.tidy( () => {
      let quarter = this.dataTensor3d.resizeBilinear( this.targetSize, true );
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
      test_MaxPool();
      test_AvgPool();
      test_DepthwiseConv2d();
      test_ResizeNearestNeighbor();
      test_ResizeBilinear();

//      tf.util.assert(
//        ChannelShuffler.Layer.isTensorArrayEqual( t1Array, t2Array ),
//        `ConcatReshapeTransposeReshapeSplit() != ConcatGatherUnsorted()`);
    });
  }
  
}


globalThis.testSet_110x110x24 = new HeightWidthDepth( 110, 110, 24 ); // height, width, depth
