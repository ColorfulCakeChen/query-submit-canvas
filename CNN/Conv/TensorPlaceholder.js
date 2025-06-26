export { TensorPlaceholder_Base as Base };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as TableLogger from "../util/TableLogger.js";
import * as ActivationEscaping from "./ActivationEscaping.js";

/**
 * A placeholder for tensor.
 *
 *   - In Operation.TwinArray.operation_append_Xxx(), it is used for tracking a
 *       tensor's final operation which should be responsible for destroying
 *       the tensor.
 *
 *   - In operation's .apply(), it is used for transferring tensor to the next
 *       sub operation.
 *
 *
 *
 * @member {Operation.Base} finalOperation
 *   The operation uses this tensor at final. It should be responsible for
 * destroying this tensor. If null, this tensor is not used by any operation.
 *
 * @member {tf.tensor} realTensor
 *   The real tensor represented by this placeholder. It is filled dynamically
 * in an operation's apply() method.
 *
 * @member {ActivationEscaping.ScaleBoundsArray} scaleBoundsArray
 *   The element value bounds (per channel) of the tensor. Usually, it is from
 * the output of the previous operation's value bounds set. It will be kept
 * (not cloned) directly. So caller should use them carefully.
 *
 */
class TensorPlaceholder_Base extends Recyclable.Root {

  /**
   * Used as default TensorPlaceholder.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "TensorPlaceholder.Base.Pool",
    TensorPlaceholder_Base );

  /**
   *
   */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor() {
    super.setAsConstructor();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    this.finalOperation = null;
    this.realTensor = null;
    this.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder(
      null );
  }

  /**
   * Release the .scaleBoundsArray
   *
   * Usually, this method is not responsible for releasing .finalOperation and
   * .realTensor. They should be handled by the caller of apply().
   *
   * @override
   */
  disposeResources() {
    this.ScaleBoundsArray_dispose();

    this.finalOperation = null;
    this.realTensor = null;
    this.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder(
      null );

    super.disposeResources();
  }

  /**
   * This method will release current ScaleBoundsArray (if exists) before
   * putting (keeping) the new (specified) ScaleBoundsArray.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} aScaleBoundsArray
   *   This ScaleBoundsArray will be kept directly (without clone).
   */
  ScaleBoundsArray_set_without_clone( aScaleBoundsArray ) {
    this.ScaleBoundsArray_dispose(); // Release old ScaleBoundsArray.
    this.scaleBoundsArray = aScaleBoundsArray;
  }

  /**
   * Release (and recycle) .scaleBoundsArray (if exists).
   */
  ScaleBoundsArray_dispose() {
    if ( this.scaleBoundsArray ) {
      this.scaleBoundsArray.disposeResources_and_recycleToPool();
      this.scaleBoundsArray = null;
    }
  }

  /**
   *
   * @param {ActivationEscaping.ScaleBoundsArray} scaleBoundsArray
   *   The tensor placeholder's ScaleBoundsArray. It will be owned by this
   * TensorPlaceholder. (i.e. This TensorPlaceholder will be responsible for
   * releasing it.)
   */
  set_height_width_channelCount_scaleBoundsArray(
    height, width, channelCount,
    channelCount_lowerHalf, channelCount_higherHalf, scaleBoundsArray ) {

    this.height = height;
    this.width = width;
    this.channelCount = channelCount;
    this.channelCount_lowerHalf = channelCount_lowerHalf;
    this.channelCount_higherHalf = channelCount_higherHalf;

    this.ScaleBoundsArray_set_without_clone( scaleBoundsArray );
  }

  /**
   * Note: The .finalOperation and .realTensor are not modified by this method.
   *
   * @param {TensorPlaceholder} aTensorPlaceholder
   *   The tensor placeholder's height, width, channelCount, scaleBoundsArray
   * will be used directly (i.e. not cloned) by this tensor placeholder. If
   * null, these properties will be set to undefined.
   */
  set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder(
    aTensorPlaceholder ) {

    if ( aTensorPlaceholder ) {
      this.set_height_width_channelCount_scaleBoundsArray(
        aTensorPlaceholder.height,
        aTensorPlaceholder.width,
        aTensorPlaceholder.channelCount,
        aTensorPlaceholder.channelCount_lowerHalf,
        aTensorPlaceholder.channelCount_higherHalf,

        // Note: Because TensorPlaceholder owns the ScaleBoundsArray, it should
        //       be cloned.
        aTensorPlaceholder.scaleBoundsArray?.clone()
      );
    } else {
      this.set_height_width_channelCount_scaleBoundsArray(
        undefined, undefined,
        undefined, undefined, undefined,
        undefined );
    }
  }

  /**
   *
   * @param {TensorPlaceholder} aTensorPlaceholder
   *   The tensor placeholder to be comapred.
   *
   * @return {boolean}
   *   Return true, if this tensor placeholder's height, width, channelCount
   * are the same as aTensorPlaceholder. Note: the .channelCount_lowerHalf and
   * .channelCount_higherHalf are not compared.
   */
  is_height_width_channelCount_same_byTensorPlaceholder( aTensorPlaceholder ) {
    if (   ( this.height != aTensorPlaceholder.height )
        || ( this.width != aTensorPlaceholder.width )
        || ( this.channelCount != aTensorPlaceholder.channelCount )

        //|| ( this.channelCount_lowerHalf
        //       != aTensorPlaceholder.channelCount_lowerHalf )
        //|| ( this.channelCount_higherHalf
        //       != aTensorPlaceholder.channelCount_higherHalf )
       )
      return false;

    return true;
  }

  /**
   * Log .realTensor and .scaleBoundsArray of this object as a table.
   *
   * @param {string} headerPrefix
   *   A string will be logged before the tensor.
   *
   * @param {string} strSubheader
   *   A string will be logged between image header and data array. If null or
   * undefined, there is no subheader.
   */
  TableLog_header_body( headerPrefix, strSubheader ) {
    TableLogger.Base.Singleton.log_tensor3d_along_depth(
      headerPrefix, strSubheader, this.realTensor,
      this.scaleBoundsArray, 
      undefined // no bPassThrough[] info here.
    );
  }

}
