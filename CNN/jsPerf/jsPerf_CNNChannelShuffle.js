
/**
 * Test different channel shuffle implementation for CNN ShuffleNet.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-channel-shuffle}
 */

// concat-reshape-transpose-reshape-split
function ConcatReshapeTransposeReshapeSplit( dataTensor3dArray ) {
  return tf.tidy( () => {
    let groupCount = dataTensor3dArray.length;
    let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;

    let dataTensor3d = tf.concat( dataTensor3dArray, lastAxisId );
 
    let [ h, w, c ] = dataTensor3d.shape;
    let intermediateChannelCount = c / groupCount;

    let x = dataTensor3d.reshape( [ h, w, groupCount, intermediateChannelCount ] );
    x = x.transpose( [ 0, 1, 3, 2 ] );
    x = x.reshape( [ h, w, c] );

    return x = x.split( groupCount, lastAxisId );
  });
}

// concat-gather
function ConcatGather( dataTensor3dArray ) {
  return tf.tidy( () => {
    let groupCount = dataTensor3dArray.length;
    let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;

    let dataTensor3d = tf.concat( dataTensor3dArray, lastAxisId );

    // shuffle and split by gather (one operation achieves two operations).
    let shuffledSplitedArray = globalThis.shuffledChannelIndicesArray.map( ( shuffledChannelIndices, i ) => {
      return dataTensor3d.gather( shuffledChannelIndices, lastAxisId );
    });

    return shuffledSplitedArray;
  });
}

// split-concat
function by_SplitConcat( dataTensor3dArray ) {
  return tf.tidy( () => {
    let groupCount = dataTensor3dArray.length;
    let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;

    let totalChannelCount = groupCount * dataTensor3dArray[ 0 ].shape[ lastAxisId ];
    let intermediateChannelCount = totalChannelCount / groupCount;

    // Split every group into more (intermediate) channels.
    let tensor3dArrayArray = dataTensor3dArray.map( ( dataTensor3d, i ) => {
      return dataTensor3d.split( intermediateChannelCount, lastAxisId );
    });

    let resultTensor3dArray = new Array( groupCount );
    let shuffledTensor3dArray = new Array( intermediateChannelCount );
    for ( let x = 0; x < groupCount; ++x ) {

      // Collect x-th intermediate channels of every group as new (x-th) group (i.e. shuffle them).
      for ( let y = 0; y < intermediateChannelCount; ++y ) {
        shuffledTensor3dArray[ y ] = tensor3dArrayArray[ y ][ x ]
      }

      // Concatenate x-th intermediate channels into one group (i.e. the x-th group).
      resultTensor3dArray[ x ] = tf.concat( shuffledTensor3dArray, lastAxisId );
    }

    return resultTensor3dArray;
  });
}



// Test concat-reshape-transpose-reshape-split
function by_ConcatReshapeTransposeReshapeSplit( dataTensor3dArray ) {
  tf.tidy( () => {
    ConcatReshapeTransposeReshapeSplit( dataTensor3dArray );
  });
}

// Test concat-gather
function by_ConcatGather( dataTensor3dArray ) {
  tf.tidy( () => {
    ConcatGather( dataTensor3dArray );
  });
}

// Test split-concat
function by_SplitConcat( dataTensor3dArray ) {
  tf.tidy( () => {
    SplitConcat( dataTensor3dArray );
  });
}


let height = 10; // image height
let width = 15;  // image width
let depth = 12;  // image channel count

let valueCount = height * width * depth;

let groupCount = 2; // Split the data into how many groups.

let dataTensor3dArray = tf.tidy( () => {
  let dataTensor1d = tf.linspace(0, valueCount - 1, valueCount );
  let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
  return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
});

// Shuffled channel indices (One dimension) for by_ConcatGather()
globalThis.shuffledChannelIndicesArray = tf.tidy( () => {
  let channelIndices = tf.linspace( 0, depth - 1, depth ).toInt(); // should be integer so that can be used as gather's index.
  let lastAxisId = channelIndices.rank - 1;

  let newChannelCount = depth / groupCount;

  let x = channelIndices.reshape( [ groupCount, newChannelCount ] );
  x = x.transpose( [ 1, 0 ] );
  x = x.reshape( [ depth ] );

  return x.split( groupCount, lastAxisId );
});



globalThis.dataTensor3dArray = dataTensor3dArray;

globalThis.cnnShuffle_by_ConcatReshapeTransposeReshapeSplit = by_ConcatReshapeTransposeReshapeSplit();
globalThis.cnnShuffle_by_ConcatGather = by_ConcatGather();
globalThis.cnnShuffle_by_SplitSplitConcatConcat = by_SplitSplitConcatConcat();
