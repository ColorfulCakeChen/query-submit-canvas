export { Base };

import * as MapTools from "../../util/MapTools.js";
import * as RandTools from "../../util/RandTools.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";

/**
 * Dynamically create random image data with specified channelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
 * depthwiseStridesPad. The same image data will be returned when same specification is requested. So that the testing performance
 * could be improved.
 */
class Base {

  /**
   * @param {number} originalHeight The original image's height.
   * @param {number} originalWidth  The original image's width.
   */
  constructor( originalHeight, originalWidth ) {
    this.originalHeight = originalHeight;
    this.originalWidth = originalWidth;
    this.imagesBy_channelCount_filterHeight_stridesPad = new Map(); // Images indexed by [ channelCount, filterHeight, stridesPad ].
    this.tensorsBy_channelCount_filterHeight_stridesPad = new Map();
  }

  /**
   * If ( depthwiseFilterHeight == 1 ) and ( depthwiseStridesPad == 0 ), the original image will be returned. The original
   * image has the size ( originalHeight, originalWidth, channelCount ). Its value is generated randomly.
   *
   *
   * @param {number} channelCount
   *   A positive integer which represents the returned image's depth.
   *
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   An integer represents the returned image should be the original image processed by depthwise convolution filter of this kinds.
   * Its should be in the range of ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.
   *
   * @param {number} depthwiseFilterHeight
   *   An integer represents the returned image should be the original image processed by depthwise convolution filter of this size.
   * Its should be in the range of ValueDesc.depthwiseFilterHeight.Singleton.range.
   *
   * @param {number} depthwiseStridesPad
   *   An integer represents the returned image should be the original image processed by depthwise convolution of this strides and pad.
   * Its should be in the range of ValueDesc.depthwiseStridesPad.Singleton.range.
   *
   * @return {object}
   *   Return an image data with the specified specification. It has the following properties:
   *     - object.height:    Image height
   *     - object.width:     Image width
   *     - object.depth:     Image channel count
   *     - object.dataArray: Image data
   */
  getImage_by( channelCount, depthwise_AvgMax_Or_ChannelMultiplier = 0, depthwiseFilterHeight = 1, depthwiseStridesPad = 0 ) {

    // 1. When no depthwise operation, the original image is returned directly (i.e. will not be shrinked).
    //
    // Because there is not depthwise operation, there is not possible to shrink.
    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      let originalImage = Base.internal_getImage_by.call( this, channelCount );
      return originalImage;
    }

    // 2. Otherwise, return image which is adjusted by depthwise operation.
    let image = Base.internal_getImage_by.call( this, channelCount, depthwiseFilterHeight, depthwiseStridesPad );
    return image;
  }

  /**
   *
   * @return {tf.tensor3d}
   *   Return a tensor with the specified specification.
   */
  getTensor3d_by( channelCount, depthwise_AvgMax_Or_ChannelMultiplier = 0, depthwiseFilterHeight = 1, depthwiseStridesPad = 0 ) {

    // 1. When no depthwise operation, the original image's tensor is returned directly (i.e. will not be shrinked).
    //
    // Because there is not depthwise operation, there is not possible to shrink.
    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      let originalTensor = Base.internal_getTensor3d_by.call( this, channelCount );
      return originalTensor;
    }

    // 2. Otherwise, return image tensor which is adjusted by depthwise operation.
    let tensor = Base.internal_getTensor3d_by.call( this, channelCount, depthwiseFilterHeight, depthwiseStridesPad );
    return tensor;
  }

  /**
   * Similiar to this.getImage_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getImage_by( channelCount, depthwiseFilterHeight = 1, depthwiseStridesPad = 0 ) {

    let imagesBy_filterHeight_stridesPad = MapTools.get_or_create( this.imagesBy_channelCount_filterHeight_stridesPad, channelCount );
    let imagesBy_stridesPad = MapTools.get_or_create( imagesBy_filterHeight_stridesPad, depthwiseFilterHeight );

    let image = imagesBy_stridesPad.get( depthwiseStridesPad );
    if ( image )
      return image; // 1. The requested image has already been created. Re-use it. Return it directly.

    // 2. The requested has not yet existed. It should be created newly.

    // 2.1 The original image is requested.
    if ( ( depthwiseFilterHeight == 1 ) && ( depthwiseStridesPad == 0 ) ) {
      image = { height: this.originalHeight, width: this.originalWidth, depth: channelCount };
      let elementCount = image.height * image.width * image.depth;
      let randomOffsetMin = -200; // Just choosed randomly.
      let randomOffsetMax = +200;
      image.dataArray = RandTools.generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax );

    // 2.2 The shrinked image requested.
    } else {
      let originalImage = Base.internal_getImage_by.call( this, channelCount ); // Use original image to create shrinked image.

      // Borrow the calcDepthwise() function to create an input image which is shrink by specified filter size and strides and pad.
      image = PointDepthPoint_Reference.Base.calcDepthwise(
        originalImage,
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX, // Max Pooling is faster and without filter weights.
        depthwiseFilterHeight,
        depthwiseStridesPad,
        null, false, null, ValueDesc.ActivationFunction.NONE, //depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
        "Base.internal_getImage_by()", ""
      );
    }
    
    imagesBy_stridesPad.set( depthwiseStridesPad, image ); // Cache it.
    return image;
  }

  /**
   * Similiar to this.getTensor3d_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getTensor3d_by( channelCount, depthwiseFilterHeight = 1, depthwiseStridesPad = 0 ) {

    let tensorsBy_filterHeight_stridesPad = MapTools.get_or_create( this.tensorsBy_channelCount_filterHeight_stridesPad, channelCount );
    let tensorsBy_stridesPad = MapTools.get_or_create( tensorsBy_filterHeight_stridesPad, depthwiseFilterHeight );

    let tensor = tensorsBy_stridesPad.get( depthwiseStridesPad );
    if ( tensor )
      return tensor; // 1. The requested tensor has already been created. Re-use it. Return it directly.

    // 2. Create new tensor according to its corresponding image.
    let image = Base.internal_getImage_by.call( this, channelCount, depthwiseFilterHeight, depthwiseStridesPad );
    let shape = [ image.height, image.width, image.depth ];
    tensor = tf.tensor3d( image.dataArray, shape ); // Create new tensor of specified specification.

    tensorsBy_stridesPad.set( depthwiseStridesPad, tensor ); // Cache it.

    return tensor;
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.tensorsBy_channelCount_filterHeight_stridesPad ) {

      for ( let tensor of MapTools.values_recursively( this.tensorsBy_channelCount_filterHeight_stridesPad ) ) {
        tensor.dispose();
      }

      this.tensorsBy_channelCount_filterHeight_stridesPad.clear();
    }
  }

}
