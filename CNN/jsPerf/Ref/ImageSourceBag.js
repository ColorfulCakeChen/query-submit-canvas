export { Base };

import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NumberImage from "./NumberImage.js";

/**
 * Dynamically create random image data with specified channelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
 * depthwiseFilterWidth, depthwiseStridesPad. The same image data will be returned when same specification is requested. So that
 * the testing performance could be improved.
 */
class Base {

  /**
   */
  constructor() {

    // Images indexed by [ originalHeight, originalWidth, channelCount, filterHeight, filterWidth, stridesPad ].
    this.images = new MultiLayerMap.Base();
    this.tensors = new MultiLayerMap.Base();
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
      let originalImage = Base.internal_getImage_by.call( this, originalHeight, originalWidth, channelCount );
      return originalImage;
    }

    // 2. Otherwise, return image which is adjusted by depthwise operation.
    let image = Base.internal_getImage_by.call( this,
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
      let originalTensor = Base.internal_getTensor3d_by.call( this, originalHeight, originalWidth, channelCount );
      return originalTensor;
    }

    // 2. Otherwise, return image tensor which is adjusted by depthwise operation.
    let tensor = Base.internal_getTensor3d_by.call( this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
    return tensor;
  }

  /**
   * Similiar to this.getImage_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getImage_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

//!!! (2022/05/23 Remarked) Replaced by MultiLayerMap.
//     let imagesBy_originalWidth_channelCount_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( this.imagesBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad, originalHeight );
//
//     let imagesBy_channelCount_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( imagesBy_originalWidth_channelCount_filterHeight_filterWidth_stridesPad, originalWidth );
//
//     let imagesBy_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( imagesBy_channelCount_filterHeight_filterWidth_stridesPad, channelCount );
//
//     let imagesBy_filterWidth_stridesPad = MapTools.get_or_create( imagesBy_filterHeight_filterWidth_stridesPad, depthwiseFilterHeight );
//     let imagesBy_stridesPad = MapTools.get_or_create( imagesBy_filterWidth_stridesPad, depthwiseFilterWidth );
//
//     let image = imagesBy_stridesPad.get( depthwiseStridesPad );
//     if ( image )
//       return image; // 1. The requested image has already been created. Re-use it. Return it directly.
//
//     // 2. The requested has not yet existed. It should be created newly.
//
//     // 2.1 The original image is requested.
//     if ( ( depthwiseFilterHeight == 1 ) && ( depthwiseFilterWidth == 1 ) && ( depthwiseStridesPad == 0 ) ) {
//       let randomOffsetMin = -200; // Just choosed randomly.
//       let randomOffsetMax = +200;
//
//       //!!! (2022/04/21 Remaked) Using Weights.Base.ValueBounds is more like real use case.
//       //let bAutoBounds = true;  // Image pixel channel value bounds are inside the real generated value bounds.
//       let bAutoBounds = false; // Image pixel channel value bounds are inside the default value bounds (i.e. Weights.Base.ValueBounds).
//       image = NumberImage.Base.create_bySequenceRandom( originalHeight, originalWidth, channelCount, randomOffsetMin, randomOffsetMax );
//
//     // 2.2 The shrinked image requested.
//     } else {
//
//       // Use original image to create shrinked image.
//       let originalImage = Base.internal_getImage_by.call( this, originalHeight, originalWidth, channelCount );
//
//       // Borrow the calcDepthwise() function to create an input image which is shrinked by specified filter size and strides and pad.
//       image = originalImage.cloneBy_depthwise(
//         ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX, // Max Pooling is faster and without filter weights.
//         depthwiseFilterHeight, depthwiseFilterWidth,
//         depthwiseStridesPad,
//         null, false,  // depthwiseFiltersArray, bDepthwiseBias, 
//         null, ValueDesc.ActivationFunction.Singleton.Ids.NONE, // depthwiseBiasesArray, depthwiseActivationId,
//         "Base.internal_getImage_by()", ""
//       );
//     }
//
//     imagesBy_stridesPad.set( depthwiseStridesPad, image ); // Cache it.
//     return image;


    return this.images.get_or_create_by_arguments1_etc( Base.image_create_by,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
  }

  /**
   * Similiar to this.getTensor3d_by() but does not consider depthwise_AvgMax_Or_ChannelMultiplier.
   */
  static internal_getTensor3d_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

//!!! (2022/05/23 Remarked) Replaced by MultiLayerMap.
//     let tensorsBy_originalWidth_channelCount_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad, originalHeight );
//
//     let tensorsBy_channelCount_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( tensorsBy_originalWidth_channelCount_filterHeight_filterWidth_stridesPad, originalWidth );
//
//     let tensorsBy_filterHeight_filterWidth_stridesPad
//       = MapTools.get_or_create( tensorsBy_channelCount_filterHeight_filterWidth_stridesPad, channelCount );
//
//     let tensorsBy_filterWidth_stridesPad = MapTools.get_or_create( tensorsBy_filterHeight_filterWidth_stridesPad, depthwiseFilterHeight );
//     let tensorsBy_stridesPad = MapTools.get_or_create( tensorsBy_filterWidth_stridesPad, depthwiseFilterWidth );
//
//     let tensor = tensorsBy_stridesPad.get( depthwiseStridesPad );
//     if ( tensor )
//       return tensor; // 1. The requested tensor has already been created. Re-use it. Return it directly.
//
//     // 2. Create new tensor according to its corresponding image.
//     let image = Base.internal_getImage_by.call( this,
//       originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
//
//     let shape = [ image.height, image.width, image.depth ];
//     tensor = tf.tensor3d( image.dataArray, shape ); // Create new tensor of specified specification.
//
//     tensorsBy_stridesPad.set( depthwiseStridesPad, tensor ); // Cache it.
//     return tensor;


    return this.tensors.get_or_create_by_arguments1_etc( Base.tensor_create_by,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
  }

  /** Called when the requested image has not yet existed. */
  static image_create_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight = 1, depthwiseFilterWidth = 1, depthwiseStridesPad = 0 ) {

    let image;

    // 1. The original image is requested.
    if ( ( depthwiseFilterHeight == 1 ) && ( depthwiseFilterWidth == 1 ) && ( depthwiseStridesPad == 0 ) ) {
      let randomOffsetMin = -200; // Just choosed randomly.
      let randomOffsetMax = +200;

      //!!! (2022/04/21 Remaked) Using Weights.Base.ValueBounds is more like real use case.
      //let bAutoBounds = true;  // Image pixel channel value bounds are inside the real generated value bounds.
      let bAutoBounds = false; // Image pixel channel value bounds are inside the default value bounds (i.e. Weights.Base.ValueBounds).
      image = NumberImage.Base.create_bySequenceRandom( originalHeight, originalWidth, channelCount, randomOffsetMin, randomOffsetMax );

    // 2. The shrinked image requested.
    } else {

      // Use original image to create shrinked image.
      let originalImage = Base.internal_getImage_by.call( this, originalHeight, originalWidth, channelCount );

      // Borrow the calcDepthwise() function to create an input image which is shrinked by specified filter size and strides and pad.
      image = originalImage.cloneBy_depthwise(
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX, // Max Pooling is faster and without filter weights.
        depthwiseFilterHeight, depthwiseFilterWidth,
        depthwiseStridesPad,
        null, false,  // depthwiseFiltersArray, bDepthwiseBias, 
        null, ValueDesc.ActivationFunction.Singleton.Ids.NONE, // depthwiseBiasesArray, depthwiseActivationId,
        "Base.internal_getImage_by()", ""
      );
    }

    return image;
  }

  /** Create new tensor according to its corresponding image. */
  static tensor_create_by(
    originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad ) {

    let image = Base.internal_getImage_by.call( this,
      originalHeight, originalWidth, channelCount, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

    let shape = [ image.height, image.width, image.depth ];
    let tensor = tf.tensor3d( image.dataArray, shape ); // Create new tensor of specified specification.
    return tensor;
  }

  /** Release all tensors. */
  disposeTensors() {

//!!! (2022/05/23 Remarked) Replaced by MultiLayerMap.
//     if ( this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad ) {
//
//       for ( let tensor
//         of MapTools.values_recursively( this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad ) ) {
//
//         tensor.dispose();
//       }
//
//       this.tensorsBy_originalHeight_originalWidth_channelCount_filterHeight_filterWidth_stridesPad.clear();
//     }


//!!! (2022/05/23 Remarked) Replaced by values().
//     if ( this.tensors ) {
//       this.tensors.visit_all_and_call( tensor => {
//         tensor.dispose();
//       } );
//       this.tensors.clear();
//     }

    if ( this.tensors ) {
      for ( let tensor of this.values() ) {
        tensor.dispose();
      }
      this.tensors.clear();
    }

  }

}
