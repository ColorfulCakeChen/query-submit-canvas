
/**
 * Test different channel shuffle implementation for CNN ShuffleNet.
 *
 * @see {@link https://jsperf.com/colorfulcakechen-cnn-channel-shuffle}
 */


// concat-reshape-transpose-reshape-split
function by_ConcatReshapeTransposeReshapeSplit( dataTensor3dArray ) {
  tf.tidy( () => {
    let groupCount = dataTensor3dArray.length;
    let lastAxisId = dataTensor3dArray[ 0 ].rank - 1;

    let dataTensor3d = tf.concat( dataTensor3dArray, lastAxisId );
 
    let [ h, w, c ] = dataTensor3d.shape;
    let newChannelCount = c / groupCount;

    let x = dataTensor3d.reshape( [ h, w, groupCount, newChannelCount ] );
    x = x.transpose( [ 0, 1, 3, 2 ] );
    x = x.reshape( [ h, w, c] );

    x = x.split( groupCount, lastAxisId );
  });
}

// concat-gather
function by_ConcatGather( dataTensor3dArray ) {
}

// split-split-concat-concat
function by_SplitSplitConcatConcat( dataTensor3dArray ) {
}


let height = 10; // image height
let width = 15;  // image width
let depth = 12;  // image channel count

let valueCount = height * width * depth;

let groupCount = 2; // Split the data into how many groups.

let dataTensor3dArray = tf.tidy( () => {
  let dataTensor1d = tf.linspace(0, valueCount - 1, valueCount);
  let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
  return dataTensor3d.split( groupCount, dataTensor3d.rank - 1 );  // Along the last axis.
});


globalThis.dataTensor3d = dataTensor3d;

globalThis.cnnShuffle_by_ConcatReshapeTransposeReshapeSplit = by_ConcatReshapeTransposeReshapeSplit();
globalThis.cnnShuffle_by_ConcatGather = by_ConcatGather();
globalThis.cnnShuffle_by_SplitSplitConcatConcat = by_SplitSplitConcatConcat();
