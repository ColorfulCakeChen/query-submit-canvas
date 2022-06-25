export { ShuffleInfo };
export { ShuffleInfoPool };

import * as Pool from "../../../util/Pool.js";
import { ShuffleInfo as ChannelShuffler_ShuffleInfo } from "../ChannelShuffler_ShuffleInfo.js";

/**
 *
 */
class ShuffleInfo extends ChannelShuffler_ShuffleInfo {

  constructor( concatenatedShape, outputGroupCount ) {
    super( concatenatedShape, outputGroupCount );
  }

//!!! (2022/06/25 Remarked) Inherits from Recyclable.Base instead.
//   /**
//    * After calling this method, this object should be viewed as disposed and should not be operated again.
//    *
//    * Sub-class should override this method for recycling to its pool (and NEVER call super.disposeResources_and_recycleToPool()).
//    */
//   disposeResources_and_recycleToPool() {
//     this.disposeResources();
//     ShuffleInfoPool.Singleton.recycle( this );
//   }

  /**
   * Permute the input tensor by reshape-transpose-reshape.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor}
   *   A shuffled tensor. Its size is the same as concatenatedTensor but its last dimension is shuffled.
   */
  reshapeTransposeReshape_dispose_finally( concatenatedTensor ) {
    let t1 = concatenatedTensor.reshape( this.intermediateShape );

    try {
      let t2 = t1.transpose( this.transposePermutation );

      try {
        return t2.reshape( this.concatenatedShape );

      } finally {
        t2.dispose();
      }

    } finally {
      t1.dispose();
    }
  }

  reshapeTransposeReshape_dispose_direct( concatenatedTensor ) {
    let t1 = concatenatedTensor.reshape( this.intermediateShape );

    let t2 = t1.transpose( this.transposePermutation );
    t1.dispose();

    let t3 = t2.reshape( this.concatenatedShape );
    t2.dispose();

    return t3;
  }

  reshapeTransposeReshape_tidy( concatenatedTensor ) {
    return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshape", () => {
      return concatenatedTensor
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape );
    });
  }

  /**
   * Permute and split the input tensor by reshape-transpose-reshape-split.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenatedTensor, but their
   * last dimensions are shuffled.
   */
  reshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally( concatenatedTensor ) {
    let t = this.reshapeTransposeReshape_dispose_finally( concatenatedTensor );

    try {
      return t.split( this.outputGroupCount, this.lastAxisId );

    } finally {
      t.dispose();
    }
  }

  reshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct( concatenatedTensor ) {
    let t = this.reshapeTransposeReshape_dispose_direct( concatenatedTensor );

    try {
      return t.split( this.outputGroupCount, this.lastAxisId );

    } finally {
      t.dispose();
    }
  }

  reshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally( concatenatedTensor ) {
    let t = this.reshapeTransposeReshape_dispose_finally( concatenatedTensor );

    let tArray = t.split( this.outputGroupCount, this.lastAxisId );
    t.dispose();

    return tArray;
  }

  reshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct( concatenatedTensor ) {
    let t = this.reshapeTransposeReshape_dispose_direct( concatenatedTensor );

    let tArray = t.split( this.outputGroupCount, this.lastAxisId );
    t.dispose();

    return tArray;
  }

  reshapeTransposeReshapeSplit_dispose_finally( concatenatedTensor ) {
    let t1 = concatenatedTensor.reshape( this.intermediateShape );

    try {
      let t2 = t1.transpose( this.transposePermutation );

      try {
        let t3 = t2.reshape( this.concatenatedShape );

        try {
          return t3.split( this.outputGroupCount, this.lastAxisId );

        } finally {
          t3.dispose();
        }

      } finally {
        t2.dispose();
      }

    } finally {
      t1.dispose();
    }
  }

  reshapeTransposeReshapeSplit_dispose_direct( concatenatedTensor ) {
    let t1 = concatenatedTensor.reshape( this.intermediateShape );

    let t2 = t1.transpose( this.transposePermutation );
    t1.dispose();

    let t3 = t2.reshape( this.concatenatedShape );
    t2.dispose();

    let tArray = t3.split( this.outputGroupCount, this.lastAxisId );
    t3.dispose();

    return tArray;
  }

  reshapeTransposeReshapeSplit_tidy( concatenatedTensor ) {
    return tf.tidy( "ChannelShuffler.ShuffleInfo.reshapeTransposeReshapeSplit", () => {
      return concatenatedTensor
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape )
        .split( this.outputGroupCount, this.lastAxisId );
    });
  }

  /**
   * Concatenate and permute the input tensor by concat-reshape-transpose-reshape.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor}
   *   A shuffled tensor. Its total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatReshapeTransposeReshape_dispose_direct_call( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let t = this.reshapeTransposeReshape( concatenatedTensor );
    concatenatedTensor.dispose();

    return t;
  }

  /**
   * Concatenate, permute and split the input tensor by concat-reshape-transpose-reshape-split.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct_call_dispose_direct( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct_call_dispose_direct( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_dispose_finally( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_dispose_finally( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally_call_dispose_direct( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_dispose_direct( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_dispose_direct( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_dispose_direct( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally_call_tidy( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      return this.reshapeTransposeReshapeSplit_tidy( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct_call_tidy( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let tArray = this.reshapeTransposeReshapeSplit_tidy( concatenatedTensor );
    concatenatedTensor.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_dispose_finally( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    try {
      let t1 = concatenatedTensor.reshape( this.intermediateShape );

      try {
        let t2 = t1.transpose( this.transposePermutation );

        try {
          let t3 = t2.reshape( this.concatenatedShape );

          try {
            return t3.split( this.outputGroupCount, this.lastAxisId );

          } finally {
            t3.dispose();
          }

        } finally {
          t2.dispose();
        }

      } finally {
        t1.dispose();
      }

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatReshapeTransposeReshapeSplit_dispose_direct( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.lastAxisId );

    let t1 = concatenatedTensor.reshape( this.intermediateShape );
    concatenatedTensor.dispose();

    let t2 = t1.transpose( this.transposePermutation );
    t1.dispose();

    let t3 = t2.reshape( this.concatenatedShape );
    t2.dispose();

    let tArray = t3.split( this.outputGroupCount, this.lastAxisId );
    t3.dispose();

    return tArray;
  }

  concatReshapeTransposeReshapeSplit_tidy( tensorArray ) {
    return tf.tidy( "ChannelShuffler.ShuffleInfo.concatReshapeTransposeReshapeSplit", () => {
      return tf.concat( tensorArray, this.lastAxisId )
        .reshape( this.intermediateShape )
        .transpose( this.transposePermutation )
        .reshape( this.concatenatedShape )
        .split( this.outputGroupCount, this.lastAxisId );
    });
  }

}


/**
 * Providing ChannelShuffler.PerformanceTest.ShuffleInfo
 *
 */
class ShuffleInfoPool extends Pool.Root {

  constructor() {
    super( "ChannelShuffler.PerformanceTest.ShuffleInfoPool", ShuffleInfo, ShuffleInfo.setAsConstructor );
  }

}

/**
 * Used as default ChannelShuffler.PerformanceTest.ShuffleInfo provider for conforming to Recyclable interface.
 */
ShuffleInfo.Pool = new ShuffleInfoPool();

