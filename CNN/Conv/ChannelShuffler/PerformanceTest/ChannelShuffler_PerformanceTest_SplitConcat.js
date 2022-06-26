export { SplitConcat };

import * as Pool from "../../../util/Pool.js";
import { SplitConcat as ChannelShuffler_SplitConcat } from "../ChannelShuffler_SplitConcat.js";

/**
 *
 */
class SplitConcat extends ChannelShuffler_SplitConcat {

  /**
   * Used as default ChannelShuffler.PerformanceTest.SplitConcat provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelShuffler.PerformanceTest.SplitConcatPool", SplitConcat, SplitConcat.setAsConstructor );

  constructor( concatenatedShape, outputGroupCount ) {
    super( concatenatedShape, outputGroupCount );
    SplitConcat.setAsConstructor_self.call( this, concatenatedShape, outputGroupCount );
  }

  /** @override */
  static setAsConstructor( concatenatedShape, outputGroupCount ) {
    super.setAsConstructor( concatenatedShape, outputGroupCount );
    SplitConcat.setAsConstructor_self.call( this, concatenatedShape, outputGroupCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( concatenatedShape, outputGroupCount ) {
  }

  /** @override */
  disposeResources() {
   super.disposeResources();
  }

  splitConcat_tidy( tensorArray ) {
    return tf.tidy( "ChannelShuffler.SplitConcat.splitConcat", () => {

      // Become local variables for reducing access time.
      let lastAxisId = this.shuffleInfo.lastAxisId;
      let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;

      // Every element will be a single channel tensor3d.
      let singleChannelTensorArray = this.singleChannelTensorArray; // Use shared pre-allocate memory for speeding up.
      singleChannelTensorArray.length = 0; // Empty the array.

      // Split every group (a multiple channels tensor3d) into many single channel tensor3d.
      for ( let tensor of tensorArray ) {
        singleChannelTensorArray.push( ...tensor.split( channelCountPerGroup, lastAxisId ) );
      }

      // An array for many single channel tensor3d of one group.
      //
      // Shared and re-used multiple times to reduce memory re-allocation.
      let tensorArrayForOneGroup = this.tensorArrayForOneGroup;

      // shuffle and split by concat (one operation achieves two operations).
      return this.shuffledChannelIndicesArray.map( ( shuffledChannelIndices ) => {
//!!! Using a loop instead. (to reduce function call overhead)
//         shuffledChannelIndices.forEach( ( channelIndex, i ) => {
//           tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ channelIndex ];
//         });

//!!! Use for-of instead. (to reduce array member access overhead)
//         let arrayLength = tensorArrayForOneGroup.length;
//         for ( let i = 0; i < arrayLength; ++i ) {
//           // The shuffledChannelIndices[ i ] is channelIndex.
//           tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ shuffledChannelIndices[ i ] ];
//         }

        // Using for-of could be a better method.
        //
        // If using shuffledChannelIndices.forEach(), there is a function call overhead.
        // If using for ( i = 0; ... ) and shuffledChannelIndices[ i ], there is a array member access overhead.
        let i = 0;
        for ( let channelIndex of shuffledChannelIndices ) {
          tensorArrayForOneGroup[ i ] = singleChannelTensorArray[ channelIndex ];
          ++i;
        }

        return tf.concat( tensorArrayForOneGroup, lastAxisId );
      });
    });
  }

}

