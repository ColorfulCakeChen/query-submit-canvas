import * as ChannelShuffler from "../Layer/ChannelShuffler.js";

/**
 * Test different channel shuffle implementation for CNN ShuffleNet.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-channel-shuffle}
 */

/**
 * A test set.
 */
class HeightWidthDepthGroup {

  /**
   * @param {number} height      image height
   * @param {number} width       image width
   * @param {number} depth       image channel count
   * @param {number} groupCount  Split the data into how many groups. ( depth / groupCount ) should be an integer.
   */
  constructor( height, width, depth, groupCount ) {

    this.height = height;
    this.width = width;
    this.depth = depth;
    this.groupCount = groupCount;

    this.valueCount = height * width * depth;

    this.concatenatedShape = [ height, width, depth ];

    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );

//!!! test splitConcatSorted (reduce floating-point error)
//      dataTensor1d = dataTensor1d.toInt();

      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
    });

    this.shuffleInfo = new ChannelShuffler.ShuffleInfo( this.concatenatedShape, groupCount );
    ( this.concatGatherUnsorted = new ChannelShuffler.ConcatGather() ).init( this.concatenatedShape, groupCount );
    ( this.splitConcatSortedShared = new ChannelShuffler.SplitConcat() ).init( this.concatenatedShape, groupCount );
    ( this.pointwiseConv = new ChannelShuffler.PointwiseConv() ).init( this.concatenatedShape, groupCount );
    ( this.pointwiseConvSplit = new ChannelShuffler.PointwiseConvSplit() ).init( this.concatenatedShape, groupCount );
  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    if ( this.concatGatherUnsorted )
      this.concatGatherUnsorted.disposeTensors();

    if ( this.pointwiseConv )
      this.pointwiseConv.disposeTensors();
  }

  // Test concat-reshape-transpose-reshape-split
  test_ConcatReshapeTransposeReshapeSplit() {
    tf.tidy( () => {
      this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
    });
  }

  // Test concat-gather (Unsorted)
  test_ConcatGatherUnsorted() {
    tf.tidy( () => {
      this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
    });
  }

  // Test split-concat (Sorted Shared)
  test_SplitConcatSortedShared() {
    tf.tidy( () => {
      this.splitConcatSortedShared.splitConcat( this.dataTensor3dArray );
    });
  }

  // Test pointwise-convolution
  test_PointwiseConv() {
    tf.tidy( () => {
      this.pointwiseConv.concatGather( this.dataTensor3dArray );
    });
  }

  // Test pointwise-convolution-split
  test_PointwiseConvSplit() {
    tf.tidy( () => {
      this.pointwiseConvSplit.concatShuffleSplit( this.dataTensor3dArray );
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
      let t1Array = this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
      let t2Array = this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
      let t3Array = this.splitConcatSortedShared.splitConcat( this.dataTensor3dArray );
      let t4Array = this.pointwiseConv.concatGather( this.dataTensor3dArray );
      let t5Array = this.pointwiseConvSplit.concatShuffleSplit( this.dataTensor3dArray );

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t1Array, t2Array ),
        `ConcatReshapeTransposeReshapeSplit() != ConcatGatherUnsorted()`);

//!!! Sorted never equal to Unsorted. 
//       tf.util.assert(
//         ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t3Array ),
//         `ConcatGatherUnsorted() != SplitConcatSortedShared()`);

      // Because the sorted will never equal to unsorted, try to compare their sum.
      // (Using average may be have some floating-point error.)
      tf.tidy( () => {
//         let t2MeanArray = t2Array.map( t => t.mean() );
//         let t3MeanArray = t3Array.map( t => t.mean() );
        let t2SumArray = t2Array.map( t => t.sum() );
        let t3SumArray = t3Array.map( t => t.sum() );

        tf.util.assert(
          ChannelShuffler.Layer.isTensorArrayEqual( t2SumArray, t3SumArray ),
          `ConcatGatherUnsorted() != SplitConcatSortedShared()`);
      });

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t4Array ),
        `ConcatGatherUnsorted() != PointwiseConv()`);

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t5Array ),
        `ConcatGatherUnsorted() != PointwiseConvSplit()`);
    });
  }
  
}


globalThis.testSet_110x110x24_g8 = new HeightWidthDepthGroup( 110, 110, 24, 8 ); // height, width, depth, groupCount
globalThis.testSet_110x110x24_g4 = new HeightWidthDepthGroup( 110, 110, 24, 4 );
globalThis.testSet_110x110x24_g3 = new HeightWidthDepthGroup( 110, 110, 24, 3 );
globalThis.testSet_110x110x24_g2 = new HeightWidthDepthGroup( 110, 110, 24, 2 );
globalThis.testSet_110x110x24_g1 = new HeightWidthDepthGroup( 110, 110, 24, 1 );


