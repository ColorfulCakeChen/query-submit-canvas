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
      let dataTensor1d = tf.linspace(0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
    });

    this.shuffleInfo = new ChannelShuffler.ShuffleInfo( this.concatenatedShape, groupCount );
    ( this.concatGatherUnsorted = new ChannelShuffler.ConcatGather() ).init( this.concatenatedShape, groupCount, false );
    ( this.concatGatherSorted = new ChannelShuffler.ConcatGather() ).init( this.concatenatedShape, groupCount, true );
    ( this.splitConcatUnsorted = new ChannelShuffler.SplitConcat() ).init( this.concatenatedShape, groupCount, false );
    ( this.splitConcatSorted = new ChannelShuffler.SplitConcat() ).init( this.concatenatedShape, groupCount, true );
  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }      
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

  // Test concat-gather (Sorted)
  test_ConcatGatherSorted() {
    tf.tidy( () => {
      this.concatGatherSorted.concatGather( this.dataTensor3dArray );
    });
  }

  // Test split-concat (Unsorted)
  test_SplitConcatUnsorted() {
    tf.tidy( () => {
      this.splitConcatUnsorted.splitConcat( this.dataTensor3dArray );
    });
  }

  // Test split-concat (Sorted)
  test_SplitConcatSorted() {
    tf.tidy( () => {
      this.splitConcatSorted.splitConcat( this.dataTensor3dArray );
    });
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {
      let t1Array = this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
      let t2Array = this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
      let t3Array = this.concatGatherSorted.concatGather( this.dataTensor3dArray );
      let t4Array = this.splitConcatUnsorted.splitConcat( this.dataTensor3dArray );
      let t5Array = this.splitConcatSorted.splitConcat( this.dataTensor3dArray );

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t1Array, t2Array ),
        `ConcatReshapeTransposeReshapeSplit() != ConcatGather()`);    

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t3Array ),
        `ConcatGatherUnsorted() != ConcatGatherSorted()`);    

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t3Array, t4Array ),
        `ConcatGatherSorted() != SplitConcatUnsorted()`);    

      tf.util.assert(
        ChannelShuffler.Layer.isTensorArrayEqual( t4Array, t5Array ),
        `SplitConcatUnsorted() != SplitConcatSorted()`);    
    });
  }
  
}


// let height = 110; // image height
// let width = 110;  // image width
// let depth = 30;  // image channel count
//
// let valueCount = height * width * depth;
//
// // ( depth / groupCount ) should be an integer.
//
// //let groupCount = 15; // Split the data into how many groups.
// let groupCount = 10; // Split the data into how many groups.
// //let groupCount = 2; // Split the data into how many groups.
//
// let concatenatedShape = [ height, width, depth ];
//
// let dataTensor3dArray = tf.tidy( () => {
//   let dataTensor1d = tf.linspace(0, valueCount - 1, valueCount );
//   let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
//   return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
// });
//
// globalThis.shuffleInfo = new ChannelShuffler.ShuffleInfo( concatenatedShape, groupCount );
// ( globalThis.concatGather = new ChannelShuffler.ConcatGather() ).init( concatenatedShape, groupCount );
// ( globalThis.splitConcat = new ChannelShuffler.SplitConcat() ).init( concatenatedShape, groupCount );
//
// globalThis.dataTensor3dArray = dataTensor3dArray;
//
// globalThis.cnnShuffle_by_ConcatReshapeTransposeReshapeSplit = by_ConcatReshapeTransposeReshapeSplit;
// globalThis.cnnShuffle_by_ConcatGather = by_ConcatGather;
// globalThis.cnnShuffle_by_SplitConcat = by_SplitConcat;
//
// globalThis.cnnShuffle_testResultSame = testResultSame;


globalThis.testSet_110x110x24_g8 = new HeightWidthDepthGroup( 110, 110, 24, 8 ); // height, width, depth, groupCount
globalThis.testSet_110x110x24_g4 = new HeightWidthDepthGroup( 110, 110, 24, 4 );
globalThis.testSet_110x110x24_g3 = new HeightWidthDepthGroup( 110, 110, 24, 3 );
globalThis.testSet_110x110x24_g2 = new HeightWidthDepthGroup( 110, 110, 24, 2 );
globalThis.testSet_110x110x24_g1 = new HeightWidthDepthGroup( 110, 110, 24, 1 );


