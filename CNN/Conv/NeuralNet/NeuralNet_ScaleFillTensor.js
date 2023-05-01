export { NeuralNet_ScaleFillTensor as ScaleFillTensor };

/**
 * A helper class for preparing input tensor of a neural network.
 *
 */
class NeuralNet_ScaleFillTensor {

  /** */
  constructor() {

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
   * @param {number} source_channelCount
   *
   *
   */
  scale_fill_tensor(
    source_TypedArray,
    source_height, source_width, //source_channelCount,
    target_height, target_width, target_channelCount,

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

    let source_channelCount = source_valueCount / source_size_per_channel;

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
    if (   ( source_height != target_height )
        || ( source_width != target_width ) ) {

      let source_shape = [ source_height, source_width, source_channelCount ];
      let sourceTensor = tf.tensor3d( source_TypedArray, source_shape, "int32" );

//!!! ...unfinished... (2023/05/01)
// should scale


      // Otherwise, resize to the default size (height x width) which is the input
      // image size used for training the neural network.
      //
      let scaledSourceTensorFloat32;
      try {
        scaledSourceTensorFloat32 = tf.image.resizeBilinear(
          sourceTensor, this.input_height_width_array,
          true // ( alignCorners = true ) for visual image resizing.
        );
      } catch ( e ) {
        throw e; // e.g. out of (GPU) memory.
      } finally {
        sourceTensor.dispose();
      }

      if ( !bForceInt32 )
        return scaledSourceTensorFloat32;

      // Convert to int32 if necessary. (Note: The dtype of tf.image.resizeXxx()'s
      // result is float32.)
      try {
        let scaledSourceTensorInt32 = scaledSourceTensorFloat32.cast( "int32" );
        return scaledSourceTensorInt32;
      } catch ( e ) {
        throw e; // e.g. out of (GPU) memory.
      } finally {
        scaledSourceTensorFloat32.dispose();
      }

    }


//!!! ...unfinished... (2023/05/01)

  }

}
