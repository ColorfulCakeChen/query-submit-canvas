export { assertAllPoolZero };

import * as Pool from "../../util/Pool.js";

//!!! (2022/06/24 Remarked) Use Pool.All[] instead.
// import * as ValueMax from "../../util/ValueMax.js";
// import * as TensorPlaceholder from "../../Conv/TensorPlaceholder.js";
// import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
// import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
// import * as Depthwise from "../../Conv/Depthwise.js";
// import * as Pointwise from "../../Conv/Pointwise.js";
// import * as Operation from "../../Conv/Operation.js";
// import * as ChannelShuffler from "../../Conv/ChannelShuffler.js";
// import * as Block from "../../Conv/Block.js";
// import * as NumberImage from "./NumberImage.js"; 

//!!! ...unfinished... (2022/06/24)
// Could they resister themselves by their constructor?
//
//!!! (2022/06/24 Remarked) Use Pool.All[] instead.
// let poolClassArray = [
//   Pool.Array,
//   ValueMax.Percentage.BasePool.Singleton );
//   ValueMax.Percentage.ConcretePool.Singleton );
//   ValueMax.Percentage.AggregatePool.Singleton );
//   TensorPlaceholder.BasePool.Singleton );
//   ActivationEscaping.ScaleBoundsArrayPool.Singleton );
//       assertPoolZero( BoundsArraySet.InputsOutputsPool.Singleton );
//       assertPoolZero( BoundsArraySet.ConvBiasActivationPool.Singleton );
//       assertPoolZero( BoundsArraySet.DepthwisePool.Singleton );
//       assertPoolZero( BoundsArraySet.PointwisePool.Singleton );
//       assertPoolZero( Depthwise.ChannelPartInfoPool.Singleton );
//       assertPoolZero( Depthwise.FiltersBiasesPartInfoPool.Singleton );
//       assertPoolZero( Pointwise.ChannelPartInfoPool.Singleton );
//       assertPoolZero( Pointwise.FiltersBiasesPartInfoPool.Singleton );
//       assertPoolZero( Operation.RootPool.Singleton );
//       assertPoolZero( Operation.TwinArrayPool.Singleton );
//       assertPoolZero( Operation.AddTwoTensorsPool.Singleton );
//       assertPoolZero( Operation.MultiplyTwoTensorsPool.Singleton );
//       assertPoolZero( Operation.ConcatShuffleSplitPool.Singleton );
//       assertPoolZero( Operation.ConcatAlongAxisId2Pool.Singleton );
//       assertPoolZero( Operation.DepthwisePool.Singleton.Singleton );
//       assertPoolZero( Operation.Depthwise_SameWhenPassThroughPool.Singleton );
//       assertPoolZero( Operation.Depthwise_ConstantWhenPassThroughPool.Singleton );
//       assertPoolZero( Operation.PointwisePool.Singleton );
//       assertPoolZero( Operation.Pointwise_SameWhenPassThroughPool.Singleton );
//       assertPoolZero( Operation.Pointwise_ConstantWhenPassThroughPool.Singleton );
//
// //!!! ...unfinished... (2022/06/23) ChannelShuffler.Xxx.Pool.Singleton???
// //      assertPoolZero( ChannelShuffler.Pool.Singleton );
//
//       assertPoolZero( Block.Pool.Singleton );
//       assertPoolZero( NumberImage.Pool.Singleton );


/**
 *
 *
 * @param {Pool.Base} pool
 *   The pool object to be asserted.
 *
 */
function assertPoolZero( prefixMsg, pool ) {
  tf.util.assert( ( pool.issuedCount == 0 ),
    `${prefixMsg}: memory leak: `
      + `pool ( ${pool.poolName} )'s issuedCount ( ${pool.issuedCount} ) should be zero.` );
}

/**
 *
 */
function assertAllPoolZero( prefixMsg ) {
  for ( let i = 0; i < Pool.All.length; ++i ) {
    let pool = Pool.All[ i ];
    assertPoolZero( prefixMsg, pool );
  }
}
