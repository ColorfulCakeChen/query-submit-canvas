export { init, testResultSame, testDifferentDisposeStrategy_All, disposeResources };

import * as ChannelShuffler from "../Conv/ChannelShuffler.js";
import * as TensorTools from "../util/TensorTools.js";
import * as Pool_Asserter from "./Ref/Pool_Asserter.js";
//import * as PointDepthPoint_Reference from "../jsPerf/Ref/PointDepthPoint_Reference.js";

/**
 * Test different channel shuffle implementation for CNN ShuffleNet.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/10945/60/colorfulcakechen-cnn-channel-shuffler-be3918c3f08f3f5e4}
 * @see {@link https://www.measurethat.net/Benchmarks/Show/10988/26/colorfulcakechen-cnn-channel-shuffler-concatreshapetran}
 * @see {@link https://www.measurethat.net/Benchmarks/Show/10978/12/colorfulcakechen-cnn-channel-shuffler-concatgatherunsor}
 * @see {@link https://www.measurethat.net/Benchmarks/Show/10973/21/colorfulcakechen-cnn-channel-shuffler-concatpointwiseco}
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

    this.asserter_Equal = new TensorTools.Asserter_Equal( 0.4, 0.001 );

    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );

      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
    });

  }

  disposeResources() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.shufflers_release();
  }

  shufflers_init() {
    this.shufflers_release();

    this.shuffleInfo = ChannelShuffler.PerformanceTest.ShuffleInfoPool.Singleton.get_or_create_by(
      this.concatenatedShape, this.groupCount );

    this.concatGatherUnsorted = ChannelShuffler.PerformanceTest.ConcatGatherPool.Singleton.get_or_create_by(
      this.concatenatedShape, this.groupCount );

    this.splitConcatSortedShared = ChannelShuffler.PerformanceTest.SplitConcatPool.Singleton.get_or_create_by(
      this.concatenatedShape, this.groupCount );

    this.concatPointwiseConv = ChannelShuffler.PerformanceTest.ConcatPointwiseConvPool.Singleton.get_or_create_by(
      this.concatenatedShape, this.groupCount );
  }

  shufflers_release() {
    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeResources_and_recycleToPool();
      this.shuffleInfo = null;
    }

    if ( this.concatGatherUnsorted ) {
      this.concatGatherUnsorted.disposeResources_and_recycleToPool();
      this.concatGatherUnsorted = null;
    }

    if ( this.splitConcatSortedShared ) {
      this.splitConcatSortedShared.disposeResources_and_recycleToPool();
      this.splitConcatSortedShared = null;
    }

    if ( this.concatPointwiseConv ) {
      this.concatPointwiseConv.disposeResources_and_recycleToPool();
      this.concatPointwiseConv = null;
    }
  }

  // Test concat-reshape-transpose-reshape-split
  test_ConcatReshapeTransposeReshapeSplit() {
    let shuffledArray = this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test concat-gather (Unsorted)
  test_ConcatGatherUnsorted() {
    let shuffledArray = this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test split-concat (Sorted Shared)
  test_SplitConcatSortedShared() {
    let shuffledArray = this.splitConcatSortedShared.splitConcat( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test concat-pointwise-convolution
  test_ConcatPointwiseConv() {
    let shuffledArray = this.concatPointwiseConv.concatGather( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally_call_dispose_finally( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally_call_dispose_finally( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_finally( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_finally( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_direct()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_direct( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_direct()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_direct( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_call_tidy()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_tidy( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct_call_tidy()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_tidy( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_dispose_direct()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct( this.dataTensor3dArray ) ); }

  test_ConcatReshapeTransposeReshapeSplit_dispose_finally_calls()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_calls( this.dataTensor3dArray ) ); }
  test_ConcatReshapeTransposeReshapeSplit_tidy()  { tf.dispose( this.shuffleInfo.concatReshapeTransposeReshapeSplit_tidy( this.dataTensor3dArray ) ); }


  test_ConcatGatherUnsorted_dispose_finally_call_loop()  { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_finally_call_loop( this.dataTensor3dArray ) ); }
  test_ConcatGatherUnsorted_dispose_direct_call_loop() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_direct_call_loop( this.dataTensor3dArray ) ); }

  test_ConcatGatherUnsorted_dispose_dispose_finally_call_map()  { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_finally_call_map( this.dataTensor3dArray ) ); }
  test_ConcatGatherUnsorted_dispose_direct_call_map() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_direct_call_map( this.dataTensor3dArray ) ); }

  test_ConcatGatherUnsorted_dispose_finally_loop() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_finally_loop( this.dataTensor3dArray ) ); }
  test_ConcatGatherUnsorted_dispose_direct_loop() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_direct_loop( this.dataTensor3dArray ) ); }

  test_ConcatGatherUnsorted_dispose_finally_map() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_finally_map( this.dataTensor3dArray ) ); }
  test_ConcatGatherUnsorted_dispose_direct_map() { tf.dispose( this.concatGatherUnsorted.concatGather_dispose_direct_map( this.dataTensor3dArray ) ); }

  test_ConcatGatherUnsorted_tidy_map() { tf.dispose( this.concatGatherUnsorted.concatGather_tidy_map( this.dataTensor3dArray ) ); }


  test_ConcatPointwiseConv_dispose_finally_call_loop()  { tf.dispose( this.concatPointwiseConv.concatGather_dispose_finally_call_loop( this.dataTensor3dArray ) ); }
  test_ConcatPointwiseConv_dispose_direct_call_loop() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_direct_call_loop( this.dataTensor3dArray ) ); }

  test_ConcatPointwiseConv_dispose_finally_call_map()  { tf.dispose( this.concatPointwiseConv.concatGather_dispose_finally_call_map( this.dataTensor3dArray ) ); }
  test_ConcatPointwiseConv_dispose_direct_call_map() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_direct_call_map( this.dataTensor3dArray ) ); }

  test_ConcatPointwiseConv_dispose_finally_loop() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_finally_loop( this.dataTensor3dArray ) ); }
  test_ConcatPointwiseConv_dispose_direct_loop() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_direct_loop( this.dataTensor3dArray ) ); }

  test_ConcatPointwiseConv_dispose_finally_map() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_finally_map( this.dataTensor3dArray ) ); }
  test_ConcatPointwiseConv_dispose_direct_map() { tf.dispose( this.concatPointwiseConv.concatGather_dispose_direct_map( this.dataTensor3dArray ) ); }

  test_ConcatPointwiseConv_tidy_map() { tf.dispose( this.concatPointwiseConv.concatGather_tidy_map( this.dataTensor3dArray ) ); }


  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => {

      let memoryInfoPre = tf.memory(); // Test memory leakage of channel shufflers.
      
      Pool_Asserter.assert_Pool_issuedCount_same_after_as_before( "jsPerf_CNNChannelShuffle.testResultSame()", () => {
        this.shufflers_init();
        this.shufflers_release();
      } );

      let memoryInfo = tf.memory();

      if ( memoryInfoPre.numTensors != memoryInfo.numTensors )
        throw Error( `Channel shufflers memory leak.` );
    });

    this.shufflers_init();  // (Should outside tidy() for preventing from tensors being disposed.

    tf.tidy( () => {
      let memoryInfo0 = tf.memory();

      let t1Array = this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
      let memoryInfo1 = tf.memory();
      if ( memoryInfo1.numTensors != ( memoryInfo0.numTensors + t1Array.length ) )
        throw Error( `ConcatReshapeTransposeReshapeSplit() memory leak` );

      let t2Array = this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
      let memoryInfo2 = tf.memory();
      if ( memoryInfo2.numTensors != ( memoryInfo1.numTensors + t2Array.length ) )
        throw Error( `ConcatGatherUnsorted() memory leak` );

      let t3Array = this.splitConcatSortedShared.splitConcat( this.dataTensor3dArray );
      let memoryInfo3 = tf.memory();
      if ( memoryInfo3.numTensors != ( memoryInfo2.numTensors + t3Array.length ) )
        throw Error( `SplitConcatSortedShared() memory leak` );

      let t4Array = this.concatPointwiseConv.concatGather( this.dataTensor3dArray );
      let memoryInfo4 = tf.memory();
      if ( memoryInfo4.numTensors != ( memoryInfo3.numTensors + t4Array.length ) )
        throw Error( `PointwiseConv() memory leak` );

//!!! (2021/10/11 Remarked)
//       // Test reference shuffle-split.
//       {
//         let imageInArray = new Array( this.dataTensor3dArray.length );
//         for ( let i = 0; i < this.dataTensor3dArray.length; ++i ) {
//           let t = this.dataTensor3dArray[ i ];
//           imageInArray[ i ] = { height: t.shape[ 0 ], width: t.shape[ 1 ], depth: t.shape[ 2 ], dataArray: t.dataSync() };
//         }
//
//         let imageOutArray = new Array( this.dataTensor3dArray.length );
// //!!! (2021/10/11 Remarked)
// //         PointDepthPoint_Reference.Base.calcConcatShuffleSplit( this.concatPointwiseConv,
// //           imageInArray, imageOutArray, "PointDepthPoint_Reference.calcConcatShuffleSplit", "" );
//         PointDepthPoint_Reference.Base.calcConcatShuffleSplit(
//           this.concatPointwiseConv.concatenatedShape, this.concatPointwiseConv.outputGroupCount,
//           imageInArray, imageOutArray, "PointDepthPoint_Reference.calcConcatShuffleSplit", "" );
//
//         for ( let i = 0; i < t1Array.length; ++i ) {
//           this.asserter_Equal.assert_Tensor_NumberArray(
//             t1Array[ i ], imageOutArray[ i ].dataArray,
//             "ConcatShuffleSplit", `output${i}`, `outputRef${i}`, "PointDepthPoint_Reference.calcConcatShuffleSplit"
//           );
//         }
//       }

      if ( !TensorTools.Comparator.isTensorArrayEqual( t1Array, t2Array ) )
        throw Error( `ConcatReshapeTransposeReshapeSplit() != ConcatGatherUnsorted()` );

//!!! Sorted never equal to Unsorted. 
//       if ( !ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t3Array ) )
//         throw Error( `ConcatGatherUnsorted() != SplitConcatSortedShared()` );

      // Because the sorted will never equal to unsorted, try to compare their sum.
      // (Using average may be have some floating-point error.)
      tf.tidy( () => {
//         let t2MeanArray = t2Array.map( t => t.mean() );
//         let t3MeanArray = t3Array.map( t => t.mean() );
        let lastAxisId = t2Array[ 0 ].rank - 1;
        let t2SumArray = t2Array.map( t => t.sum( lastAxisId ) );
        let t3SumArray = t3Array.map( t => t.sum( lastAxisId ) );

        if ( !TensorTools.Comparator.isTensorArrayEqual( t2SumArray, t3SumArray ) )
          throw Error( `ConcatGatherUnsorted() != SplitConcatSortedShared()` );
      });

      if ( !TensorTools.Comparator.isTensorArrayEqual( t2Array, t4Array ) )
        throw Error( `ConcatGatherUnsorted() != PointwiseConv()` );
    });
  }

  testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit() {
    let functionTable = [
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally_call_dispose_finally,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally_call_dispose_finally,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_finally,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_finally,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_direct,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_direct,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally_call_tidy,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct_call_tidy,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_finally,
      this.shuffleInfo.concatReshapeTransposeReshapeSplit_dispose_direct,

      this.shuffleInfo.concatReshapeTransposeReshapeSplit_tidy,
    ];
    this.testDifferentDisposeStrategy( functionTable, this.shuffleInfo );
  }

  testDifferentDisposeStrategy_ConcatGatherUnsorted() {
    let functionTable = [
      this.concatGatherUnsorted.concatGather_dispose_finally_call_loop,
      this.concatGatherUnsorted.concatGather_dispose_direct_call_loop,

      this.concatGatherUnsorted.concatGather_dispose_finally_call_map,
      this.concatGatherUnsorted.concatGather_dispose_direct_call_map,

      this.concatGatherUnsorted.concatGather_dispose_finally_loop,
      this.concatGatherUnsorted.concatGather_dispose_direct_loop,

      this.concatGatherUnsorted.concatGather_dispose_finally_map,
      this.concatGatherUnsorted.concatGather_dispose_direct_map,

      this.concatGatherUnsorted.concatGather_tidy_map,
    ];
    this.testDifferentDisposeStrategy( functionTable, this.concatGatherUnsorted );
  }

  testDifferentDisposeStrategy_ConcatPointwiseConv() {
    let functionTable = [
      this.concatPointwiseConv.concatGather_dispose_finally_call_loop,
      this.concatPointwiseConv.concatGather_dispose_direct_call_loop,

      this.concatPointwiseConv.concatGather_dispose_finally_call_map,
      this.concatPointwiseConv.concatGather_dispose_direct_call_map,

      this.concatPointwiseConv.concatGather_dispose_finally_loop,
      this.concatPointwiseConv.concatGather_dispose_direct_loop,

      this.concatPointwiseConv.concatGather_dispose_finally_map,
      this.concatPointwiseConv.concatGather_dispose_direct_map,

      this.concatPointwiseConv.concatGather_tidy_map,
    ];
    this.testDifferentDisposeStrategy( functionTable, this.concatPointwiseConv );
  }

  testDifferentDisposeStrategy_All() {
    this.testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit();
    this.testDifferentDisposeStrategy_ConcatGatherUnsorted();
    this.testDifferentDisposeStrategy_ConcatPointwiseConv();
  }

  testDifferentDisposeStrategy( functionTable, thisArg ) {
    tf.tidy( () => {
      let funcPrev;
      let tArrayPrev;

      for ( let i = 0; i < functionTable.length; ++i ) {
        let func = functionTable[ i ];

        let memoryInfoPrev = tf.memory();
        let tArray = func.call( thisArg, this.dataTensor3dArray );
        let memoryInfo = tf.memory();

        if ( memoryInfo.numTensors != ( memoryInfoPrev.numTensors + tArray.length ) )
          throw Error( `${func.name}() memory leak` );

        if ( tArrayPrev ) {
          if ( !TensorTools.Comparator.isTensorArrayEqual( tArrayPrev, tArray ) )
            throw Error( `${funcPrev.name}() != ${func.name}()` );
        }

        tf.dispose( tArrayPrev );

        funcPrev = func;
        tArrayPrev = tArray;
      }
    });
  }
}

function init() {
//!!! (2021/09/03 Temp) For Debug.
//   let height = 1;
//   let width = 1;
//   let depth = 8;

  let height = 110;
  let width = 100;
  let depth = 24;

  globalThis.testSet_110x110x24_g8 = new HeightWidthDepthGroup( height, width, depth, 8 ); // height, width, depth, groupCount
  globalThis.testSet_110x110x24_g4 = new HeightWidthDepthGroup( height, width, depth, 4 );
  globalThis.testSet_110x110x24_g3 = new HeightWidthDepthGroup( height, width, depth, 3 );
  globalThis.testSet_110x110x24_g2 = new HeightWidthDepthGroup( height, width, depth, 2 );
  globalThis.testSet_110x110x24_g1 = new HeightWidthDepthGroup( height, width, depth, 1 );
}

function testResultSame() {
  globalThis.testSet_110x110x24_g8.testResultSame();
  globalThis.testSet_110x110x24_g4.testResultSame();
  globalThis.testSet_110x110x24_g3.testResultSame();
  globalThis.testSet_110x110x24_g2.testResultSame();
  globalThis.testSet_110x110x24_g1.testResultSame();
}

function testDifferentDisposeStrategy_All() {
  globalThis.testSet_110x110x24_g8.testDifferentDisposeStrategy_All();
  globalThis.testSet_110x110x24_g4.testDifferentDisposeStrategy_All();
  globalThis.testSet_110x110x24_g3.testDifferentDisposeStrategy_All();
  globalThis.testSet_110x110x24_g2.testDifferentDisposeStrategy_All();
  globalThis.testSet_110x110x24_g1.testDifferentDisposeStrategy_All();
}

function disposeResources() {
  if ( globalThis.testSet_110x110x24_g8 ) {
    globalThis.testSet_110x110x24_g8.disposeResources();
    globalThis.testSet_110x110x24_g8 = null;
  }

  if ( globalThis.testSet_110x110x24_g4 ) {
    globalThis.testSet_110x110x24_g4.disposeResources();
    globalThis.testSet_110x110x24_g4 = null;
  }

  if ( globalThis.testSet_110x110x24_g3 ) {
    globalThis.testSet_110x110x24_g3.disposeResources();
    globalThis.testSet_110x110x24_g3 = null;
  }

  if ( globalThis.testSet_110x110x24_g2 ) {
    globalThis.testSet_110x110x24_g2.disposeResources();
    globalThis.testSet_110x110x24_g2 = null;
  }

  if ( globalThis.testSet_110x110x24_g1 ) {
    globalThis.testSet_110x110x24_g1.disposeResources();
    globalThis.testSet_110x110x24_g1 = null;
  }
}
