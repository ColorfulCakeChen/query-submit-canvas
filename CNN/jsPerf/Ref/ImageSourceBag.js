export { ImageSourceBag_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NumberImage from "./NumberImage.js";

/**
 * Dynamically create random image data with specified channelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
 * depthwiseFilterWidth, depthwiseStridesPad. The same image data will be returned when same specification is requested. So that
 * the testing performance could be improved.
 */
class ImageSourceBag_Base extends Recyclable.Root {

  /**
   * Used as default ImageSource.Bag provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ImageSource.Bag.Pool", ImageSourceBag_Base, ImageSourceBag_Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    ImageSourceBag_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    ImageSourceBag_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Images indexed by [ originalHeight, originalWidth, channelCount, filterHeight, filterWidth, stridesPad ].

    if ( !this.images )
      this.images = new MultiLayerMap.Base();

    if ( !this.tensors )
      this.tensors = new MultiLayerMap.Base();
  }

  /** @override */
  disposeResources() {

    {
      for ( let tensor of this.tensors.values() ) {
        tensor.dispose();
      }
      this.tensors.clear();
    }

    {
      for ( let numberImage of this.images.values() ) {
        numberImage.disposeResources_and_recycleToPool();
      }
      this.images.clear();
    }

    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let channelShuffler of this.values() ) {
      channelShuffler.disposeResources_and_recycleToPool();
    }
    super.clear();
  }

  /**
   * If ( depthwiseFilterHeight == 1 ) and ( depthwiseFilterWidth == 1 ) and ( depthwiseStridesPad == 0 ), the original image will be
   * returned. The original image has the size ( originalHeight, originalWidth, channelCount ). Its value is generated randomly.
   *
   *
   * @param {number} originalHeight
   *   A positive integer which represents the returned image's original height.
   *
   * @param {number} originalWidth
   *   A positive integer which represents the returned image's original width.
   *
   * @param {number} channelCount
   *   A positive integer which represents the returned image's depth.
   *
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   An integer represents the returned image should be the original image processed by depthwise convolution filter of this kinds.
   * Its should be in the range of ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.
   *
   * @param {number} depthwiseFilterHeight
   *   An integer represents the returned image should be the original image processed by depthwise convolution filter of this height.
   * Its should be in the range of Block.Params.depthwiseFilterHeight.valueDesc.range.
   *
   * @param {number} depthwiseFilterWidth
   *   An integer represents the returned image should be the original image processed by depthwise convolution filter of this width.
   * Its should be in the range of Block.Params.depthwiseFilterWidth.valueDesc.range.
   *
   * @param {number} depthwiseStridesPad
   *   An integer represents the returned image should be the original image processed by depthwise convolution of this strides and pad.
   * Its should be in the range of ValueDesc.depthwiseStridesPad.Singleton.range.
   *
   * @return {NumberImage.Base}
   *   Return an image data with the specified specification.
   */
  getImage_by(
    originalHeight, originalWidth, channelCount,
    depthwise_AvgMax_Or_ChannelMultiplier = 0, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    // 1. When no depthwise operation, the original image is returned directly (i.e. will not be shrinked).
    //
    // Because there is not depthwise operation, there is not possible to shrink.
    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      let originalImage = ImageSourceBag_Base.internal_getImage_by.call( this, originalHeight, originalWidth, channelCount );
      return originalImage;
    }

    // 2. Otherwise, return image which is adjusted by depthwise operation.
    let image = ImageSourceBag_Base.internal_getImage_by.call( this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

    return image;
  }

  /**
   *
   * @return {tf.tensor3d}
   *   Return a tensor with the specified specification.
   */
  getTensor3d_by(
    originalHeight, originalWidth, channelCount,
    depthwise_AvgMax_Or_ChannelMultiplier = 0, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    // 1. When no depthwise operation, the original image's tensor is returned directly (i.e. will not be shrinked).
    //
    // Because there is not depthwise operation, there is not possible to shrink.
    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      let originalTensor = ImageSourceBag_Base.internal_getTensor3d_by.call( this, originalHeight, originalWidth, channelCount );
      return originalTensor;
    }

    // 2. Otherwise, return image tensor which is adjusted by depthwise operation.
    let tensor = ImageSourceBag_Base.internal_getTensor3d_by.call( this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
    return tensor;
  }

  /**
   * Similiar to this.getImage_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getImage_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    return this.images.get_or_create_by_arguments1_etc( ImageSourceBag_Base.image_createBy, this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
  }

  /** Called when the requested image has not yet existed. */
  static image_createBy(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    let image;

    // 1. The original image is requested.
    if ( ( depthwiseFilterHeight == 1 ) && ( depthwiseFilterWidth == 1 ) && ( depthwiseStridesPad == 0 ) ) {

      image = NumberImage.Base.create_bySequenceRandom( originalHeight, originalWidth, channelCount,
        ImageSourceBag_Base.weightsRandomOffset.min, ImageSourceBag_Base.weightsRandomOffset.max,
        ImageSourceBag_Base.weightsDivisorForRemainder
      );

    // 2. The shrinked image requested.
    } else {

      // Use original image to create shrinked image.
      let originalImage = ImageSourceBag_Base.internal_getImage_by.call( this, originalHeight, originalWidth, channelCount );

      // Borrow the clone_byDepthwise() function to create an input image which is shrinked by specified filter size and strides and pad.
      image = originalImage.clone_byDepthwise_NonPassThrough(
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX, // Max Pooling is faster and without filter weights.
        depthwiseFilterHeight, depthwiseFilterWidth,
        depthwiseStridesPad,
        null, false,  // depthwiseFiltersArray, bDepthwiseBias, 
        null, ValueDesc.ActivationFunction.Singleton.Ids.NONE, // depthwiseBiasesArray, depthwiseActivationId,
        "", "ImageSource.Bag.internal_getImage_by()"
      );
    }

    return image;
  }

  /**
   * Similiar to this.getTensor3d_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getTensor3d_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    return this.tensors.get_or_create_by_arguments1_etc( ImageSourceBag_Base.tensor_createBy, this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
  }

  /** Called when the requested tensor has not yet existed. */
  static tensor_createBy(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad ) {

    let image = ImageSourceBag_Base.internal_getImage_by.call( this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

    let shape = [ image.height, image.width, image.depth ];
    let tensor = tf.tensor3d( image.dataArray, shape ); // Create new tensor of specified specification.
    return tensor;
  }

}


/**
 * Image pixel's every channel value should be in [ 0, 256 ].
 *   - ( weightsRandomOffset.min == 0 ) could avoid generate negative pixel value.
 *   - ( weightsDivisorForRemainder == 256 ) could avoid generate pixel value larger than 255.
 *
 */ 

//!!! (2022/07/14 Temp Remarked) Fixed to non-random to simplify debug.
ImageSourceBag_Base.weightsRandomOffset = { min: 0, max: +200 };
//ImageSourceBag_Base.weightsRandomOffset = { min: -200, max: +200 };
//ImageSourceBag_Base.weightsRandomOffset = { min: 11, max: 11 };
//ImageSourceBag_Base.weightsRandomOffset = { min: -0, max: +0 };

ImageSourceBag_Base.weightsDivisorForRemainder = 256;