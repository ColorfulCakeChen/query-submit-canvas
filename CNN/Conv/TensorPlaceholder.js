export { Base };
export { BasePool };

import * as Pool from "../util/Pool.js";
import * as ActivationEscaping from "./ActivationEscaping.js";

/**
 * A placeholder for tensor.
 *
 *   - In Operation.TwinArray.operation_append_Xxx(), it is used for tracking a tensor's final operation which should be responsible
 *       for destroying the tensor.
 *
 *   - In operation's .apply(), it is used for transferring tensor to the next sub operation.
 *
 *
 *
 * @member {Operation.Base} finalOperation
 *   The operation uses this tensor at final. It should be responsible for destroying this tensor. If null, this tensor is
 * not used by any operation.
 *
 * @member {tf.tensor} realTensor
 *   The real tensor represented by this placeholder. It is filled dynamically in an operation's apply() method.
 *
 * @member {ActivationEscaping.ScaleBoundsArray} scaleBoundsArray
 *   The element value bounds (per channel) of the tensor. Usually, it is from the output of the previous operation's value bounds
 * set. It will be kept (not cloned) directly. So caller should use them carefully.
 *
 */
class Base {

  /**
   *
   */
  constructor() {
    this.setAsConstructor();
  }

  /**
   * Initialize to empty.
   *
   * @return {Base}
   *   Return the this object.
   */
  setAsConstructor() {
    this.finalOperation = null;
    this.realTensor = null;
    this.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
    return this;
  }

  /**
   * Release the .scaleBoundsArray
   *
   * Usually, this method is not responsible for releasing .finalOperation and .realTensor. They should be handled
   * by the caller of apply().
   */
  disposeResources() {
    if ( this.scaleBoundsArray ) {
      ActivationEscaping.ScaleBoundsArrayPool.Singleton.recycle( this.scaleBoundsArray );
    }

    this.finalOperation = null;
    this.realTensor = null;
    this.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    BasePool.Singleton.recycle( this );
  }

  /**
   *
   * @param {ActivationEscaping.ScaleBoundsArray} scaleBoundsArray  The tensor placeholder's ScaleBoundsArray.
   */
  set_height_width_channelCount_scaleBoundsArray(
    height, width, channelCount, channelCount_lowerHalf, channelCount_higherHalf, scaleBoundsArray ) {
    this.height = height;
    this.width = width;
    this.channelCount = channelCount;
    this.channelCount_lowerHalf = channelCount_lowerHalf;
    this.channelCount_higherHalf = channelCount_higherHalf;
    this.scaleBoundsArray = scaleBoundsArray;
  }

  /**
   * Note: The .finalOperation and .realTensor are not modified by this method.
   *
   * @param {TensorPlaceholder} aTensorPlaceholder
   *   The tensor placeholder's height, width, channelCount, scaleBoundsArray will be used directly (i.e. not cloned) by this
   * tensor placeholder. If null, these properties will be set to undefined.
   */
  set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( aTensorPlaceholder ) {
    if ( aTensorPlaceholder ) {
      this.set_height_width_channelCount_scaleBoundsArray(
        aTensorPlaceholder.height, aTensorPlaceholder.width,
        aTensorPlaceholder.channelCount, aTensorPlaceholder.channelCount_lowerHalf, aTensorPlaceholder.channelCount_higherHalf,
        aTensorPlaceholder.scaleBoundsArray );
    } else {
      this.set_height_width_channelCount_scaleBoundsArray(
        undefined, undefined,
        undefined, undefined, undefined,
        undefined );
    }
  }

  /**
   *
   * @param {TensorPlaceholder} aTensorPlaceholder  The tensor placeholder to be comapred.
   *
   * @return {boolean}
   *   Return true, if this tensor placeholder's height, width, channelCount are the same as aTensorPlaceholder. Note: the
   * .channelCount_lowerHalf and .channelCount_higherHalf are not compared.
   */
  is_height_width_channelCount_same_byTensorPlaceholder( aTensorPlaceholder ) {
    if (   ( this.height != aTensorPlaceholder.height )
        || ( this.width != aTensorPlaceholder.width )
        || ( this.channelCount != aTensorPlaceholder.channelCount )

        //|| ( this.channelCount_lowerHalf != aTensorPlaceholder.channelCount_lowerHalf )
        //|| ( this.channelCount_higherHalf != aTensorPlaceholder.channelCount_higherHalf )
       )
      return false;

    return true;
  }

}


/**
 * Providing TensorPlaceholder.Base
 *
 */
class BasePool extends Pool.Root {

  constructor() {
    super( Base, Base.setAsConstructor );
  }

//!!! (2022/06/22 Remarked) Base.setAsConstructor() should be enough.
//   /**
//    * @param {Base} this
//    *   The TensorPlaceholder.Base object to be initialized.
//    *
//    * @return {Base}
//    *   Return the this object.
//    */
//   static setAsConstructor() {
//     this.setAsConstructor();
//     return this;
//   }

}

/**
 * Used as default TensorPlaceholder.Base provider.
 */
BasePool.Singleton = new BasePool();
