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
   *   An unsigned integer TypedArray. It may be modified by filling with
   * alignment mark and feedback information (i.e. previous time output of the
   * neural network).
   *
   * @param {number} source_height
   *
   *
   * @param {number} source_width
   *
   *
???   * @param {number} source_channelCount
   *
   *
   */
  scale_fill_tensor(
    source_TypedArray,
    source_height, source_width, //source_channelCount,

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

    // 2. Scale
    let scaledSourceTensorInt32;
    if (   ( source_height != target_height )
        || ( source_width != target_width ) ) {

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

//!!! ...unfinished... (2023/05/01)

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
