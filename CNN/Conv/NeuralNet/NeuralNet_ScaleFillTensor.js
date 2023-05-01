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

//!!! ...unfinished... (2023/05/01)
// Perhaps, should use Canvas Context's drawImage() to scale the source.
// So that GPU-CPU transferring could be reduced.

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
   * @param {integer[]} alignmentMarkValueArray
   *   An array of values representing every neural network playing which
   * alignment. If null or undefined, there will be no alignment mark value be
   * filled into target tensor. For example, in a OX (connect-three) game:
   *   - ( alignmentMarkValueArray[ 0 ] == 0 ) means neural network 0 plays O
   *       side currently.
   *   - ( alignmentMarkValueArray[ 1 ] == 255 ) means neural network 1 plays X
   *       side currently.
   *

//!!! ...unfinished... (2023/05/01)
// The shape of previous_output_Int32ArrayArray depends on whether
// a neural network generates output of one or two alignments.

   * @param {Int32Array[]} previous_output_Int32ArrayArray
   *   The (previous time) output of the pair of neural networks. If null or
   * undefined, there will be no feedback information be filled into target
   * tensor.
   *
   * @yield {Promise( tf.tensor3d )}
   *   Yield a promise resolves to { done: false, value: tf.tensor3d } for
   * every alignmentMarkValue and previous_output_Int32Array.
   *
   * @yield {Promise( undefined )}
   *   Yield a promise resolves to { done: true, value: undefined }.
   *
   *
   *
   */
  async* createTensor_by_scale_fill_asyncGenerator(
    source_TypedArray, source_height, source_width,
    alignmentMarkValueArray,
    previous_output_Int32ArrayArray

  ) {
    const funcNameInMessage = "scale_fill_tensor";

    // 1.

    // 1.1 source shape

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

    // 1.2
    if ( alignmentMarkValueArray.length != 2 )
      throw Error( `NeuralNet_ScaleFillTensor.${funcNameInMessage}(): `
        + `alignmentMarkValueArray.length ( `
        + `= ${alignmentMarkValueArray.length} ) `
        + `should be 2.`
      );

    if ( previous_output_Int32ArrayArray.length != 2 )
      throw Error( `NeuralNet_ScaleFillTensor.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray.length ( `
        + `= ${previous_output_Int32ArrayArray.length} ) `
        + `should be 2.`
      );

    // 1.3 Whether needs fill extra information into the target tensor.
    let bFill;
    if (   ( alignmentMarkValueArray == undefined )
        && ( previous_output_Int32ArrayArray == undefined ) ) {
      bFill = false;
    } else {
      bFill = true;
    }

    // 1.4 Whether needs scale the source image to fit into the target tensor.
    let bScale;
    if (   ( source_height == this.target_height )
        && ( source_width == this.target_width ) ) {
      bScale = false;
    } else {
      bScale = true;
    }

//!!! ...unfinished... (2023/05/01)
    // 2.
    const tensorCount = previous_output_Int32ArrayArray.length;

//     for ( let i = 0; i < tensorCount; ++i ) {

// //!!! ...unfinished... (2023/05/01)
//       yield targetTensorInt32;

//     }


//!!! ...unfinished... (2023/05/01)
    let sourceTensorInt32;
    try {
      if ( bScale ) {

        sourceTensorInt32
          = NeuralNet_ScaleFillTensor.createTensor_by_scale_TypedArray.call(
              this, source_TypedArray, source_height, source_width );

        if ( bFill ) { // 2.1.1 Scale, Fill

          let scaledSourceInt32Array;
          try {
            scaledSourceInt32Array = await sourceTensorInt32.data();
          } catch ( e ) {
            //debugger;
            throw e; // e.g. out of (GPU) memory.
          } finally {
            sourceTensorInt32.dispose();
            sourceTensorInt32 = null;
          }

          for ( let i = 0; i < tensorCount; ++i ) {

//!!! ...unfinished... (2023/05/01)
// Modify scaledSourceInt32Array.

            let targetTensorInt32 = tf.tensor3d( scaledSourceInt32Array,
              this.target_shape, "int32" );

            // Assume the outside caller will dispose the targetTensorInt32.
            yield targetTensorInt32;
          }

        } else { // 2.1.2 Scale, No Fill.

          for ( let i = 0; i < tensorCount; ++i ) {
            let targetTensorInt32;
            if ( i < ( tensorCount - 1 ) ) {
              targetTensorInt32 = sourceTensorInt32.clone();
            } else { // The final yield.
              targetTensorInt32 = sourceTensorInt32;
              sourceTensorInt32 = null;
            }

            // Assume the outside caller will dispose the targetTensorInt32.
            yield targetTensorInt32;
          }

        }

      } else { // No Scale.

        if ( bFill ) { // 2.2.1 No Scale, Fill.

          for ( let i = 0; i < tensorCount; ++i ) {

//!!! ...unfinished... (2023/05/01)
// Modify source_TypedArray directly.

            let targetTensorInt32
              = tf.tensor3d( source_TypedArray, this.target_shape, "int32" );

            // Assume the outside caller will dispose the targetTensorInt32.
            yield targetTensorInt32;
          }

        } else { // 2.2.2 No Scale, No Fill.

          sourceTensorInt32
            = tf.tensor3d( source_TypedArray, this.target_shape, "int32" );

          for ( let i = 0; i < tensorCount; ++i ) {
            let targetTensorInt32;
            if ( i < ( tensorCount - 1 ) ) {
              targetTensorInt32 = sourceTensorInt32.clone();
            } else { // The final yield.
              targetTensorInt32 = sourceTensorInt32;
              sourceTensorInt32 = null;
            }

            // Assume the outside caller will dispose the targetTensorInt32.
            yield targetTensorInt32;
          }
        }

      }

    } catch ( e ) {
      //debugger;
      throw e; // e.g. out of (GPU) memory.

    } finally {
      if ( sourceTensorInt32 ) {
        sourceTensorInt32.dispose();
        sourceTensorInt32 = null;
      }
    }
  }

  /**
   *
   *
   * @param {NeuralNet_ScaleFillTensor} this
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
   * @param {tf.tensor3d}
   *   Return a scaled int32 tensor3d whose depthwise size is [ this.height,
   * this.width ].
   */
  static createTensor_by_scale_TypedArray(
    source_TypedArray, source_height, source_width ) {

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
    let scaledSourceTensorInt32;
    try {
      scaledSourceTensorInt32 = scaledSourceTensorFloat32.cast( "int32" );
    } catch ( e ) {
      //debugger;
      throw e; // e.g. out of (GPU) memory.
    } finally {
      scaledSourceTensorFloat32.dispose();
    }

    return scaledSourceTensorInt32;
  }

}
