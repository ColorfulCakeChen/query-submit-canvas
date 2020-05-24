import * as ChannelShuffler from "../Layer/ChannelShuffler.js";

/**
 * Test different channel shuffle implementation for CNN ShuffleNet.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-channel-shuffle}
 */

// // concat-reshape-transpose-reshape-split
// function ConcatReshapeTransposeReshapeSplit( dataTensor3dArray ) {
//   return tf.tidy( () => {
//     let groupCount = dataTensor3dArray.length;
//     let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;
//
//     let dataTensor3d = tf.concat( dataTensor3dArray, lastAxisId );
//
//     let [ h, w, c ] = dataTensor3d.shape;
//     let intermediateChannelCount = c / groupCount;
//
//     let x = dataTensor3d.reshape( [ h, w, groupCount, intermediateChannelCount ] );
//     x = x.transpose( [ 0, 1, 3, 2 ] );
//     x = x.reshape( [ h, w, c] );
//
//     return x = x.split( groupCount, lastAxisId );
//   });
// }
//
// // concat-gather
// function ConcatGather( dataTensor3dArray ) {
//   return tf.tidy( () => {
//     let groupCount = dataTensor3dArray.length;
//     let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;
//
//     let dataTensor3d = tf.concat( dataTensor3dArray, lastAxisId );
//
//     // shuffle and split by gather (one operation achieves two operations).
//     let shuffledSplitedTensor3dArray = globalThis.shuffledChannelIndicesTensor1dArray.map(
//       ( shuffledChannelIndicesTensor1d, i ) => {
//         return dataTensor3d.gather( shuffledChannelIndicesTensor1d, lastAxisId );
//     });
//
//     return shuffledSplitedTensor3dArray;
//   });
// }

// // split-concat
// function SplitConcat( dataTensor3dArray ) {
//   return tf.tidy( () => {
//     let groupCount = dataTensor3dArray.length;
//     let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;
//
//     let totalChannelCount = groupCount * dataTensor3dArray[ 0 ].shape[ lastAxisId ];
//     let intermediateChannelCount = totalChannelCount / groupCount;
// //!!! Old
// //     // Split every group (a multiple channel tensor3d) into more (intermediate) channels.
// //     let tensor3dArrayArray = dataTensor3dArray.map( ( dataTensor3d, i ) => {
// //       return dataTensor3d.split( intermediateChannelCount, lastAxisId );
// //     });
// //
// //     let oneChannelTensor3dArray = tensor3dArrayArray.flat(); // Every element will be a single channel tensor3d.
//
//     // Split every group (a multiple channel tensor3d) into more (intermediate) channels.
//     let oneChannelTensor3dArray = new Array(); // Every element will be a single channel tensor3d.
//     for ( let dataTensor3d of dataTensor3dArray ) {
//       oneChannelTensor3dArray.push( ...dataTensor3d.split( intermediateChannelCount, lastAxisId ) );
//     }
//
//     let multipleChannelTensor3dArray = new Array( intermediateChannelCount );
//
//     // shuffle and split by concat (one operation achieves two operations).
//     let shuffledSplitedTensor3dArray = globalThis.shuffledChannelIndicesArray.map( ( shuffledChannelIndices, i ) => {
//       shuffledChannelIndices.forEach( ( channelIndex, i ) => {
//         multipleChannelTensor3dArray[ i ] = oneChannelTensor3dArray[ channelIndex ];
//       });
//
//       return tf.concat( multipleChannelTensor3dArray, lastAxisId );
//     });
//
//     return shuffledSplitedTensor3dArray;
//   });
// }
//
// /** @return Return true, if two array of tensor are equal by value. */
// function isTensorArrayEqual( tensorArray1, tensorArray2 ) {
//
//   if ( tensorArray1 === tensorArray2 )
//     return true;
//
//   if ( tensorArray1 == null || tensorArray2 == null )
//     return false;
//
//   if ( tensorArray1.length !== tensorArray2.length )
//     return false;
//
//   for ( let i = 0; i < tensorArray1.length; ++i ) {
//     if ( !tensorArray1[ i ].equal( tensorArray2[ i ] ) )
//       return false;
//   }
//
//   return true;
// }
//
// // Testing whether the results of different implementation are the same.
// function testResultSame() {
//   tf.tidy( () => {
//     let t1Array = ConcatReshapeTransposeReshapeSplit( dataTensor3dArray );
//     let t2Array = ConcatGather( dataTensor3dArray );
//     let t3Array = SplitConcat( dataTensor3dArray );
//
//     tf.util.assert(
//       isTensorArrayEqual( t1Array, t2Array ),
//       `ConcatReshapeTransposeReshapeSplit() != ConcatGather()`);    
//
//     tf.util.assert(
//       isTensorArrayEqual( t2Array, t3Array ),
//       `ConcatGather() != SplitConcat()`);    
//   });
// }


// Testing whether the results of different implementation are the same.
function testResultSame() {
  tf.tidy( () => {
    let t1Array = globalThis.shuffleInfo.concatReshapeTransposeReshapeSplit( dataTensor3dArray );
    let t2Array = globalThis.concatGather.concatGather( dataTensor3dArray );
    let t3Array = globalThis.splitConcat.splitConcat( dataTensor3dArray );

    tf.util.assert(
      ChannelShuffler.Layer.isTensorArrayEqual( t1Array, t2Array ),
      `ConcatReshapeTransposeReshapeSplit() != ConcatGather()`);    

    tf.util.assert(
      ChannelShuffler.Layer.isTensorArrayEqual( t2Array, t3Array ),
      `ConcatGather() != SplitConcat()`);    
  });
}


// Test concat-reshape-transpose-reshape-split
function by_ConcatReshapeTransposeReshapeSplit( dataTensor3dArray ) {
  tf.tidy( () => {
    globalThis.shuffleInfo.concatReshapeTransposeReshapeSplit( dataTensor3dArray );
  });
}

// Test concat-gather
function by_ConcatGather( dataTensor3dArray ) {
  tf.tidy( () => {
    globalThis.concatGather.concatGather( dataTensor3dArray );
  });
}

// Test split-concat
function by_SplitConcat( dataTensor3dArray ) {
  tf.tidy( () => {
    globalThis.splitConcat.splitConcat( dataTensor3dArray );
  });
}


let height = 110; // image height
let width = 110;  // image width
let depth = 30;  // image channel count

let valueCount = height * width * depth;

// ( depth / groupCount ) should be an integer.

//let groupCount = 15; // Split the data into how many groups.
let groupCount = 10; // Split the data into how many groups.
//let groupCount = 2; // Split the data into how many groups.

let concatenatedShape = [ height, width, depth ];

let dataTensor3dArray = tf.tidy( () => {
  let dataTensor1d = tf.linspace(0, valueCount - 1, valueCount );
  let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
  return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
});

// // Shuffled channel indices tensor1d (One dimension) for ConcatGather()
// globalThis.shuffledChannelIndicesTensor1dArray = tf.tidy( () => {
//   let channelIndices = tf.linspace( 0, depth - 1, depth ).toInt(); // should be integer so that can be used as gather's index.
//   let lastAxisId = channelIndices.rank - 1;
//
//   let intermediateChannelCount = depth / groupCount;
//
//   let x = channelIndices.reshape( [ groupCount, intermediateChannelCount ] );
//   x = x.transpose( [ 1, 0 ] );
//   x = x.reshape( [ depth ] );
//
//   return x.split( groupCount, lastAxisId );
// });
//
// // Shuffled channel indices (One dimension) for SplitConcat()
// globalThis.shuffledChannelIndicesArray = new Array( globalThis.shuffledChannelIndicesTensor1dArray.length );
// globalThis.shuffledChannelIndicesTensor1dArray.map( ( shuffledChannelIndicesTensor1d, i ) => {
//   globalThis.shuffledChannelIndicesArray[ i ] = shuffledChannelIndicesTensor1d.dataSync();
// });

globalThis.shuffleInfo = new ChannelShuffler.ShuffleInfo( concatenatedShape, groupCount );
( globalThis.concatGather = new ChannelShuffler.ConcatGather() ).init( concatenatedShape, groupCount );
( globalThis.splitConcat = new ChannelShuffler.SplitConcat() ).init( concatenatedShape, groupCount );


globalThis.dataTensor3dArray = dataTensor3dArray;

globalThis.cnnShuffle_by_ConcatReshapeTransposeReshapeSplit = by_ConcatReshapeTransposeReshapeSplit;
globalThis.cnnShuffle_by_ConcatGather = by_ConcatGather;
globalThis.cnnShuffle_by_SplitConcat = by_SplitConcat;

globalThis.cnnShuffle_testResultSame = testResultSame;
