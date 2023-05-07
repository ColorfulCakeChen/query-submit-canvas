export { NeuralNet_ScaleFiller as ScaleFiller };

import { FeedbackShape as NeuralNet_FeedbackShape }
  from "./NeuralNet_FeedbackShape.js";


/**
 * A helper class for preparing input tensor of a neural network.
 *
 *
 *
 * @member {number} target_height
 *   The height (in pixels) of the target image.
 *
 * @member {number} target_width
 *   The width (in pixels) of the target image.
 *
 * @member {number} target_channelCount
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
class NeuralNet_ScaleFiller {

  /**
   *
   *
   */
  constructor( target_height, target_width, target_channelCount ) {
    this.target_height = target_height;
    this.target_width = target_width;
    this.target_channelCount = target_channelCount;

    this.target_shape = [ target_height, target_width, target_channelCount ];
    this.target_shape_height_width = [ target_height, target_width ];

//!!! ...unfinished.... (2023/05/05)
//     this.feedbackShape = NeuralNet_FeedbackShape();
//     this.feedbackShape.init(
//       explicit_input_height, explicit_input_width, explicit_input_channelCount,
//       feedback_valueCount
//     );

  }

//!!! ...unfinished... (2023/05/01)
// Perhaps, should use Canvas Context's drawImage() to scale the source.
// So that GPU-CPU transferring could be reduced.

//!!! ...unfinished.... (2023/05/05)
// Perhaps, let scale do outside (e.g. by Canvas context drawImage()).
// So that here can check source image size whether equal to
// ( implicit + explicit ) size.

  /**
   * Almost the same as .createTensor_by_scale_fill_asyncGenerator() but the
   * source data must has the same shape as target tensor.
   *
   * If they are different, it is suggested to pre-scale source by Canvas
   * Context's drawImage() before calling this method. The advantage are:
   *
   *   - GPU-CPU transferring could be reduced.
   *
   *     - Context.drawImage() operates in GPU directly.
   *
   *     - tf.image.resizeBilinear() needs upload source data from CPU to GPU.
   *
   *   - Here can check source image size whether equal to target
   *        (= implicit + explicit ) size.
   *
   *
   */
  async* createTensor_by_fill_asyncGenerator(
    source_TypedArray, source_height, source_width,
    bTwoTensors,
    feedbackShape,
    alignmentMarkValueArray,
    previous_output_Int32ArrayArray
  ) {
    const funcNameInMessage = "createTensor_by_fill_asyncGenerator";

    // 1. source data must has the same shape as target tensor.
    if (   ( source_height != this.target_height )
        || ( source_width != this.target_width ) )
      throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
        + `( source_height, source_width ) = `
        + `( ${source_height}, ${source_width} ) ` 
        + `should be the same as `
        + `( target_height, target_width ) = `
        + `( ${this.target_height}, ${this.target_width} ).` 
      );

    // 2.
    yield* NeuralNet_ScaleFiller.createTensor_by_scale_fill_asyncGenerator
      .call( this,
        source_TypedArray, source_height, source_width,
        bTwoTensors,
        feedbackShape,
        alignmentMarkValueArray,
        previous_output_Int32ArrayArray
      );
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
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {boolean} bTwoTensors
   *   - If true, two tensors will be generated and returned.
   *   - If false, one tensor will be generated and returned.
   *
   * @param {NeuralNet_FeedbackShape} feedbackShape
   *   If not null, it will be used to fill alignment mark value and feedback
   * (i.e. previous time output) into target tensor. Otherwise, there will be
   * no alignment mark value and feedback be filled into target tensor.
   *
   * @param {integer[]} alignmentMarkValueArray
   *   An array of values representing every neural network personating which
   * alignment.
   *
   *   - If ( feedbackShape == null ), alignmentMarkValueArray will be ignored.
   *
   *   - If ( feedbackShape != null ):
   *
   *     - If ( alignmentMarkValueArray == null ) or
   *         ( alignmentMarkValueArray.length == 0 ), there will be no alignment
   *         mark value be filled into target tensor.
   *
   *     - If ( alignmentMarkValueArray != null ) and
   *         ( alignmentMarkValueArray.length > 0 ):
   *       - If ( bTwoTensors == false ), alignmentMarkValueArray.length must be 1.
   *       - If ( bTwoTensors ==  true ), alignmentMarkValueArray.length must be 2.
   *
   *   - Usage example: in a OX (connect-three) game:
   *     - ( alignmentMarkValueArray[ 0 ] == 0 ) means neural network 0
   *         personates O side currently.
   *     - ( alignmentMarkValueArray[ 1 ] == 255 ) means neural network 1
   *         personates X side currently.
   *
   * @param {Int32Array[]} previous_output_Int32ArrayArray
   *   Every neural network's previous time output which will be used as
   * feedback values.
   *
   *   - If ( feedbackShape == null ), previous_output_Int32ArrayArray will be
   *       ignored.
   *
   *   - If ( feedbackShape != null ):
   *
   *     - If ( previous_output_Int32ArrayArray == null ) or
   *         ( previous_output_Int32ArrayArray.length == 0 ), there will be
   *         no feedback values be filled into target tensor.
   *
   *     - If ( previous_output_Int32ArrayArray != null ) and
   *         ( previous_output_Int32ArrayArray.length > 0 ):
   *
   *       - If ( bTwoTensors == false ),
   *           previous_output_Int32ArrayArray.length must be 1 and
   *           previous_output_Int32ArrayArray[ 0 ] must be non-null.
   *
   *       - If ( bTwoTensors ==  true ),
   *           previous_output_Int32ArrayArray.length must be 2 and both
   *           previous_output_Int32ArrayArray[ 0 ] and
   *           previous_output_Int32ArrayArray[ 1 ] must be non-null.
   *
   * @yield {Promise( [ tf.tensor3d, sourceTypedArrayAsyncFunction ] )}
   *   Yield a promise resolves to { done: false, value: [ tf.tensor3d,
   * sourceTypedArrayAsyncFunction ] } for every target tensor.
   *
   *   - The value[ 0 ] is a tf.tensor3d which has been scaled (if necessary)
   *       so that its shape is the same as this.target_shape and has been
   *       filled with alignmentMarkValue (if exists) and
   *       previous_output_Int32Array (if exists). The outside caller is
   *       responsible for destroying this returned tensor.
   *
   *   - The value[ 1 ] is an async function. The function returned a Promise
   *       resolves to the value[ 0 ]'s source TypedArray data (which is scaled
   *       and filled with alignmentMarkValue and previous_output_Int32Array).
   *
   * @yield {Promise( undefined )}
   *   Yield a promise resolves to { done: true, value: undefined }.
   *
   *
   *
   */
  static async* createTensor_by_scale_fill_asyncGenerator(
    source_TypedArray, source_height, source_width,
    bTwoTensors,
    feedbackShape,
    alignmentMarkValueArray,
    previous_output_Int32ArrayArray
  ) {
    const funcNameInMessage = "createTensor_by_scale_fill_asyncGenerator";

    // 1.

    // 1.1 source shape

    const source_size_per_channel = source_height * source_width;
    const source_valueCount = source_TypedArray.length;

    if ( ( source_valueCount % source_size_per_channel ) != 0 )
      throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
        + `source_TypedArray.length ( ${source_valueCount} ) ` 
        + `should be divisible by `
        + `source_size_per_channel ( `
        + `= source_height * source_width `
        + `= ${source_height} * ${source_width} `
        + `= ${source_size_per_channel} ).`
      );

    const source_channelCount = source_valueCount / source_size_per_channel;

    if ( source_channelCount != target_channelCount )
      throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
        + `source_size_per_channel ( `
        + `= source_TypedArray.length / ( source_height * source_width ) ` 
        + `= ${source_valueCount} / ( ${source_height} * ${source_width} ) `
        + `= ${source_valueCount} / ( ${source_size_per_channel} ) `
        + `= ${source_channelCount} ) `
        + `should be the same as `
        + `target_channelCount ( ${target_channelCount} ).`
      );

    // 1.2
    let tensorCount;
    if ( bTwoTensors )
      tensorCount = 2;
    else
      tensorCount = 1;

    // 1.3 Whether needs fill extra information into the target tensor.
    //
    // If has feedbackShape and has either alignmentMarkValue or
    // previous_output, it is necessary to fill something into target tensor.
    let bFill = false;

    const alignmentMarkValueArray_nonEmpty
      = ( alignmentMarkValueArray ) && ( alignmentMarkValueArray.length > 0 );

    const previous_output_Int32ArrayArray_nonEmpty
      = ( previous_output_Int32ArrayArray )
          && ( previous_output_Int32ArrayArray.length > 0 );

    if ( feedbackShape ) {

      if ( alignmentMarkValueArray_nonEmpty ) {
        if ( alignmentMarkValueArray.length != tensorCount )
          throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
            + `alignmentMarkValueArray.length ( `
            + `${alignmentMarkValueArray.length} ) `
            + `should be either 0 or the same as `
            + `tensorCount ( ${tensorCount} ).`
          );
        
        bFill = true;
      }

      if ( previous_output_Int32ArrayArray_nonEmpty ) {
        if ( previous_output_Int32ArrayArray.length != tensorCount )
          throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
            + `previous_output_Int32ArrayArray.length ( `
            + `${previous_output_Int32ArrayArray.length} ) `
            + `should be the same as `
            + `tensorCount ( ${tensorCount} ).`
          );

        for ( let i = 0; i < tensorCount; ++i ) {
          if ( previous_output_Int32ArrayArray[ i ] == null )
            throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
              + `previous_output_Int32ArrayArray[ ${i} ] ( `
              + `${previous_output_Int32ArrayArray[ i ]} ) `
              + `should not be null or undefined.`
            );
        }

        bFill = true;
      }
    }


//!!! ...unfinished.... (2023/05/05)
// Perhaps, let scale do outside (e.g. by Canvas context drawImage()).
// So that here can check source image size whether equal to
// ( implicit + explicit ) size.

    // 1.4 Whether needs scale the source image to fit into the target tensor.
    let bScale;
    if (   ( source_height == this.target_height )
        && ( source_width == this.target_width ) ) {
      bScale = false;
    } else {
      bScale = true;
    }

    // 2.
    let sourceTensorInt32;
    try {
      if ( bScale ) {

        // Scale image (do it only once).
        sourceTensorInt32
          = NeuralNet_ScaleFiller.createTensor_by_scale_TypedArray.call(
              this, source_TypedArray, source_height, source_width );

        if ( bFill ) { // 2.1.1 Scale, Fill

          let sourceInt32ArrayPromise;
          let sourceInt32Array;
          try {
            sourceInt32ArrayPromise = sourceTensorInt32.data();
            sourceInt32Array = await sourceInt32ArrayPromise;
          } catch ( e ) {
            //debugger;
            throw e; // e.g. out of (GPU) memory.
          } finally {
            sourceTensorInt32.dispose();
            sourceTensorInt32 = null;
          }

          let sourceTypedArrayAsyncFunction
            = async () => sourceInt32ArrayPromise;

          for ( let i = 0; i < tensorCount; ++i ) {

//!!! ...unfinished... (2023/05/01)
// Modify scaledSourceInt32Array.
//
//            let alignmentMarkValue = alignmentMarkValueArray[ i ];
//            let previous_output_Int32Array = previous_output_Int32ArrayArray[ i ];

            if ( alignmentMarkValueArray_nonEmpty ) {
              let alignmentMarkValue = alignmentMarkValueArray[ i ];
              feedbackShape.set_implicit_input_by_alignmentMarkValue(
                sourceInt32Array, alignmentMarkValue );
            }

!!! ...unfinished... (2023/05/07)

            if ( previous_output_Int32ArrayArray ) {
              let previous_output_Int32Array
                = previous_output_Int32ArrayArray[ i ];

              if ( previous_output_Int32Array ) {
                this.set_implicit_input_by_previousOutputTypedArray(
                  sourceInt32Array, previous_output_Int32Array
                );
              }
            }

            let targetTensorInt32
              = tf.tensor3d( sourceInt32Array, this.target_shape, "int32" );

            yield [ targetTensorInt32, sourceTypedArrayAsyncFunction ];
          }

        } else { // 2.1.2 Scale, No Fill.

          // The reason why yield a function (instead of a Promise directly)
          // is to ensure .data() (which will consume CPU and memory bandwidth
          // a lot) only be called when necessary.
          let sourceTypedArrayAsyncFunction
            = async () => sourceTensorInt32.data();

          for ( let i = 0; i < tensorCount; ++i ) {
            let targetTensorInt32;
            if ( i < ( tensorCount - 1 ) ) {
              targetTensorInt32 = sourceTensorInt32.clone();
            } else { // The final yield.
              targetTensorInt32 = sourceTensorInt32;
              sourceTensorInt32 = null;
            }
            yield [ targetTensorInt32, sourceTypedArrayAsyncFunction ];
          }

        }

      } else { // No Scale.

        let sourceTypedArrayAsyncFunction
          = async () => source_TypedArray;

        if ( bFill ) { // 2.2.1 No Scale, Fill.

          for ( let i = 0; i < tensorCount; ++i ) {

//!!! ...unfinished... (2023/05/01)
// Modify source_TypedArray directly.
//
//            let alignmentMarkValue = alignmentMarkValueArray[ i ];
//            let previous_output_Int32Array = previous_output_Int32ArrayArray[ i ];

            let targetTensorInt32
              = tf.tensor3d( source_TypedArray, this.target_shape, "int32" );

            yield [ targetTensorInt32, sourceTypedArrayAsyncFunction ];
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
            yield [ targetTensorInt32, sourceTypedArrayAsyncFunction ];
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
   * @param {NeuralNet_ScaleFiller} this
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray. For example, ImageData.data which is
   * coming from a canvas. Note that it may be modified by filling with
   * alignment mark and feedback information (i.e. previous time output of the
   * neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
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
