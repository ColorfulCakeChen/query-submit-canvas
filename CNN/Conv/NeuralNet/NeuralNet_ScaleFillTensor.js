export { NeuralNet_ScaleFillTensor as ScaleFillTensor };

/**
 * A helper class for preparing input tensor of a neural network.
 *
 *
 *
 * @param {number} target_height
 *   The height (in pixels) of the target image.
 *
 * @param {number} target_width
 *   The width (in pixels) of the target image.
 *
 * @param {number} target_channelCount
 *   The channel count of the target image.
 *
 * @member {number} target_shape
 *  An array as [ target_height, target_width, target_channelCount ]. It is the
 * input image size used for training the neural network.
 *
 * @member {number} target_shape_height_width
 *  An array as [ target_height, target_width ]. It is similar to .target_shape
 * but without target_channelCount.
 *
 */
class NeuralNet_ScaleFillTensor {

  /**
   *
   *
   */
  constructor(
    target_height, target_width, target_channelCount,

  ) {
    this.target_height = target_height;
    this.target_width = target_width;
    this.target_channelCount = target_channelCount;

    this.target_shape = [ target_height, target_width, target_channelCount ];
    this.target_shape_height_width = [ target_height, target_width ];
  }

  /**
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray. For example, ImageData.data which is
   * coming from a canvas. Note that it may be modified by filling with
   * alignment mark and feedback information (i.e. previous time output of the
   * neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source image. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source image. For example,
   * ImageData.width.
   *
   * @param {integer} alignmenrMarkValue
   *   An integer value representing the neural network playing which
   * alignment. If undefined, there will be no alignmenrMarkValue be filled
   * into target tensor. For example, in a OX (connect-three) game:
   *   - ( alignmenrMarkValue == 0 ) means neural network 0 plays O side
   *       currently.
   *   - ( alignmenrMarkValue == 255 ) means neural network 1 plays X side
   *       currently.
   *

//!!! ...unfinished... (2023/05/01)
// The shape of previous_output_Int32ArrayArray depends on whether
// a neural network generates output of one or two alignments.

   * @param {Int32Array[]} previous_output_Int32ArrayArray
   *   The (previous time) output of the pair of neural networks. If null or
   * undefined, there will be no feedback information be filled into target
   * tensor.
   *
   *
   *
   */
  scale_fill_tensor(
    source_TypedArray, source_height, source_width,
    previous_output_Int32ArrayArray

  ) {
    const funcNameInMessage = "scale_fill_tensor";

    // 1.
    const source_size_per_channel = source_height * source_width;
    const source_valueCount = source_TypedArray.length;

    if ( ( source_valueCount % source_size_per_channel ) != 0 )
      throw Error( `NeuralNet_ScaleFillTensor.${funcNameInMessage}(): `
        + `source_TypedArray.length ( ${source_valueCount} ) ` 
        + `should be divisible by `
        + `source_size_per_channel ( `
        + `= source_height * source_width `
        + `= ${source_height} * ${source_width} `
        + `= ${source_size_per_channel} ).`
      );

    const source_channelCount = source_valueCount / source_size_per_channel;

    if ( source_channelCount != target_channelCount )
      throw Error( `NeuralNet_ScaleFillTensor.${funcNameInMessage}(): `
        + `source_size_per_channel ( `
        + `= source_TypedArray.length / ( source_height * source_width ) ` 
        + `= ${source_valueCount} / ( ${source_height} * ${source_width} ) `
        + `= ${source_valueCount} / ( ${source_size_per_channel} ) `
        + `= ${source_channelCount} ) `
        + `should be the same as `
        + `target_channelCount ( ${target_channelCount} ).`
      );

    // Whether needs fill extra information into the target tensor.
    let bFill;
    if (   ( alignmenrMarkValue == undefined )
        && ( previous_output_Int32ArrayArray == undefined ) ) {
      bFill = false;
    } else {
      bFill = true;
    }

//!!! ...unfinished... (2023/05/01)


    // 2. Scale
    let scaledSourceTensorInt32;
    if (   ( source_height == this.target_height )
        && ( source_width == this.target_width ) ) {

      scaledSourceTensorInt32 = ???;

    } else {
      let source_shape = [ source_height, source_width, source_channelCount ];
      let sourceTensorInt32
        = tf.tensor3d( source_TypedArray, source_shape, "int32" );

      // Resize to the target size (height x width) which is the input image
      // size used for training the neural network.
      let scaledSourceTensorFloat32;
      try {
        scaledSourceTensorFloat32 = tf.image.resizeBilinear(
          sourceTensorInt32, this.target_shape_height_width,
          true // ( alignCorners = true ) for visual image resizing.
        );
      } catch ( e ) {
        //debugger;
        throw e; // e.g. out of (GPU) memory.
      } finally {
        sourceTensorInt32.dispose();
      }

      // Convert to int32. (Note: The dtype of tf.image.resizeXxx()'s result
      // is float32.)
      try {
        scaledSourceTensorInt32 = scaledSourceTensorFloat32.cast( "int32" );
      } catch ( e ) {
        //debugger;
        throw e; // e.g. out of (GPU) memory.
      } finally {
        scaledSourceTensorFloat32.dispose();
      }
    }


//!!! ...unfinished... (2023/05/01)

  }

}
