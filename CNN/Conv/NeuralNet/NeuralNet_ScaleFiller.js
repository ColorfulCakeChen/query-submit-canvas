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
   */
  constructor( target_height, target_width, target_channelCount ) {
    this.target_height = target_height;
    this.target_width = target_width;
    this.target_channelCount = target_channelCount;

    this.target_shape = [ target_height, target_width, target_channelCount ];
    this.target_shape_height_width = [ target_height, target_width ];
  }

  /**
   * Almost the same as .createTensor_by_scale_fill_asyncGenerator() but the
   * source data must have the same shape as target tensor.
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
    alignmentMarkValueArrayArray, previous_output_Int32ArrayArray
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
    let scale_fill_asyncGenerator = this.createTensor_by_scale_fill_asyncGenerator(
      source_TypedArray, source_height, source_width,
      bTwoTensors,
      feedbackShape,
      alignmentMarkValueArrayArray, previous_output_Int32ArrayArray
    );

    yield* scale_fill_asyncGenerator;
  }

  /**
   *
   * Note:
   *
   * It is highly recommended to use this method without scaling to reduce
   * data transferring between CPU and GPU.
   *
   * - Suggested usage:
   *   - Use Canvas Context drawImage() to scale. (operates on GPU directly)
   *   - Downloads data from GPU to CPU. (getImageData())
   *   - Call this method:
   *     - Fill alignment mark and feedback (i.e. previous time output).
   *     - Uploads data from CPU to GPU to create tensor.
   *
   * - Not suggested usage:
   *   - Downloads data from GPU to CPU. (getImageData())
   *   - Call this method:
   *     - Uploads data from CPU to GPU to scale tensor.
   *     - Downloads data from GPU to CPU for filling alignment mark and
   *         feedback (i.e. previous time output).
   *     - Uploads data from CPU to GPU to create tensor.
   *
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
   * @param {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
   *   An array with two non-negative integer arrays representing every neural
   * network personating which alignment currently. Every non-negative integer
   * array's .length should be the same as .input_channelCount becasue it
   * represents a pixel.
   *
   *   - If ( feedbackShape == null ), alignmentMarkValueArrayArray will be
   *       ignored.
   *
   *   - If ( feedbackShape != null ):
   *
   *     - If ( alignmentMarkValueArrayArray == null ) or
   *         ( alignmentMarkValueArrayArray.length == 0 ), there will be no
   *         alignment mark value be filled into target tensor.
   *
   *     - If ( alignmentMarkValueArrayArray != null ) and
   *         ( alignmentMarkValueArrayArray.length > 0 ):
   *
   *       - If ( bTwoTensors == false ), alignmentMarkValueArrayArray.length
   *           must be 1.
   *
   *       - If ( bTwoTensors ==  true ), alignmentMarkValueArrayArray.length
   *           must be 2.
   *
   *   - Usage example: in a OX (connect-three) game:
   *     - ( alignmentMarkValueArrayArray[ 0 ] == [ 0, 0, 0, 255 ] ) means
   *         neural network 0 personates O side currently.
   *     - ( alignmentMarkValueArrayArray[ 1 ] == [ 255, 255, 255, 255 ) means
   *         neural network 1 personates X side currently.
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
   */
  async* createTensor_by_scale_fill_asyncGenerator(
    source_TypedArray, source_height, source_width,
    bTwoTensors,
    feedbackShape,
    alignmentMarkValueArrayArray, previous_output_Int32ArrayArray
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

    if ( source_channelCount != this.target_channelCount )
      throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
        + `source_size_per_channel ( `
        + `= source_TypedArray.length / ( source_height * source_width ) ` 
        + `= ${source_valueCount} / ( ${source_height} * ${source_width} ) `
        + `= ${source_valueCount} / ( ${source_size_per_channel} ) `
        + `= ${source_channelCount} ) `
        + `should be the same as `
        + `target_channelCount ( ${this.target_channelCount} ).`
      );

    // 1.2 How many tensors will be yielded.
    let tensorCount;
    if ( bTwoTensors )
      tensorCount = 2;
    else
      tensorCount = 1;

    // 1.3 Whether needs scale the source image to fit into the target tensor.
    let bScale;
    if (   ( source_height == this.target_height )
        && ( source_width == this.target_width ) ) {
      bScale = false;
    } else {
      bScale = true;
    }

    // 1.4 Whether needs fill extra information into the target tensor.
    //
    // If has feedbackShape and has either alignmentMarkValue or
    // previous_output, it is necessary to fill something into target tensor.
    let bFill = false;

    const alignmentMarkValueArrayArray_nonEmpty
      = ( alignmentMarkValueArrayArray )
          && ( alignmentMarkValueArrayArray.length > 0 );

    const previous_output_Int32ArrayArray_nonEmpty
      = ( previous_output_Int32ArrayArray )
          && ( previous_output_Int32ArrayArray.length > 0 );

    if ( feedbackShape ) {

      // 1.4.1
      if ( alignmentMarkValueArrayArray_nonEmpty ) {
        if ( alignmentMarkValueArrayArray.length != tensorCount )
          throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
            + `alignmentMarkValueArrayArray.length ( `
            + `${alignmentMarkValueArrayArray.length} ) `
            + `should be either 0 or the same as `
            + `tensorCount ( ${tensorCount} ).`
          );
        
        bFill = true;
      }

      // 1.4.2
      if ( previous_output_Int32ArrayArray_nonEmpty ) {
        if ( previous_output_Int32ArrayArray.length != tensorCount )
          throw Error( `NeuralNet_ScaleFiller.${funcNameInMessage}(): `
            + `previous_output_Int32ArrayArray.length ( `
            + `${previous_output_Int32ArrayArray.length} ) `
            + `should be the same as `
            + `tensorCount ( ${tensorCount} ).`
          );

        // Can not have null previous output.
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

    // Otherwise, no filling because of no feedbackShape.
    }

    // 2.
    let sourceTensorInt32;
    try {
      if ( bScale ) {

//!!! ...unfinished... (2023/05/25)
// If source_TypedArray is Uint8ClampedArray with ( input_channelCount == 4 ),
// call .createTensor_by_scale_PixelData() instead. (need create a temp ImageData.)
// The reason is .createTensor_by_scale_PixelData() faster than
// .createTensor_by_scale_TypedArray().
//
//!!! ...unfinished... (2023/05/26)
// .createImageData_by_scale_Uint8ClampedArray() or
// .createTensor_by_scale_TypedArray()
      
        // Scale image (do it only once).
        sourceTensorInt32
          = NeuralNet_ScaleFiller.createTensor_by_scale_TypedArray(
              source_TypedArray,
              source_height, source_width, source_channelCount,
              this.target_shape_height_width );

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
            if ( alignmentMarkValueArrayArray_nonEmpty )
              feedbackShape.set_implicit_input_by_alignmentMarkValueArray(
                sourceInt32Array, alignmentMarkValueArrayArray[ i ] );
            if ( previous_output_Int32ArrayArray_nonEmpty )
              feedbackShape.set_implicit_input_by_previousOutputTypedArray(
                sourceInt32Array, previous_output_Int32ArrayArray[ i ] );
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

            // Note:
            //
            // Even if this is the final yield, sourceTensorInt32 should still
            // be cloned (i.e. should not be cleared to null or disposed).
            // Otherwise, sourceTypedArrayAsyncFunction() can not download
            // .data() when called. (For example, in NeuralWorker_Body
            // .TWO_WORKER__TWO_NET__step0_TypedArray_process(). )
            let targetTensorInt32 = sourceTensorInt32.clone();

            yield [ targetTensorInt32, sourceTypedArrayAsyncFunction ];
          }

        }

      } else { // No Scale.

        let sourceTypedArrayAsyncFunction
          = async () => source_TypedArray;

        if ( bFill ) { // 2.2.1 No Scale, Fill.

          for ( let i = 0; i < tensorCount; ++i ) {
            if ( alignmentMarkValueArrayArray_nonEmpty )
              feedbackShape.set_implicit_input_by_alignmentMarkValueArray(
                source_TypedArray, alignmentMarkValueArrayArray[ i ] );
            if ( previous_output_Int32ArrayArray_nonEmpty )
              feedbackShape.set_implicit_input_by_previousOutputTypedArray(
                source_TypedArray, previous_output_Int32ArrayArray[ i ] );
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
   * Create a tensor3d from source (e.g. canvas). Its size will be confirmed
   * (by scaling) to this neural network's acceptable input [ height, width ].
   *
   *
   * Note1: It is more recommended to use CanvasRenderingContext2D.drawImage()
   *        to scale image than this method. The reason is:
   * 
   *          - CanvasRenderingContext2D.drawImage() operates on GPU directly.
   *            - .drawImage( Canvas ) is fastest (even faster than
   *              .drawImage( ImageData ) ).
   * 
   *          - This method downloads data from GPU to CPU for creating tensor.
   *              And then, uploads data from CPU to GPU to scale tensor.
   *
   * Note2: According to testing, in backend "webgl", this method:
   *   - faster than .createTensor_by_scale_TypedArray().
   *       But this method can only handle image (i.e. not any shape tensor).
   *
   * Note3: According to performance testing, in backend "webgl", the method
   *        list from fast to slow are:
   *   - .createImageData_by_scale_Canvas( HTMLCanvasElement | OffscreenCanvas )
   *   - .createTensor_by_scale_PixelData( OffscreenCanvas )
   *   - .createTensor_by_scale_PixelData( HTMLCanvasElement )
   *   - .createImageData_by_scale_ImageData()
   *   - .createImageData_by_scale_Uint8ClampedArray()
   *   - .createTensor_by_scale_PixelData( ImageData )
   *   - .createTensor_by_scale_TypedArray()
   *
   *
   *
   * @param {ImageData|ImageBitmap|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} source_PixelData
   *   The image or canvas which provides image (as RGBA 4-channels Uint8 data).
   *
   * @param {number} source_channelCount
   *   The channel count of the source_PixelData. It will also be
   * target_channelCount.
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target tensor.
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will be guaranteed as
   * int32. Otherwise, the dtype of the returned tf.tensor3d may be int32 or
   * float32 (if resized). This is useful if the result will be used by an
   * embedding layer (which only accepts integer input). Default is true.
   *
   * @return {tf.tensor3d}
   *   Return a (possible int32) tensor3d whose shape is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ],
   * source_channelCount ].
   */
  static createTensor_by_scale_PixelData(
    source_PixelData,
    source_channelCount,
    target_shape_height_width,
    bForceInt32 = true ) {

    //!!! ...unfinished... (2022/08/15) What about .fromPixelsAsync() ?

    // Note: For image coming from canvas, the tf.browser.fromPixels() handle a
    //       RGBA 4 channels faster than RGB 3 channels input.
    let source_Tensor = tf.browser.fromPixels(
      source_PixelData, source_channelCount ); // dtype will be int32.

    // If the size ( height x width ) is as expected, use it directly.
    if (   ( source_Tensor.shape[ 0 ] == target_shape_height_width[ 0 ] ) // target_height
        && ( source_Tensor.shape[ 1 ] == target_shape_height_width[ 1 ] ) // target_width
       )
      return source_Tensor; // (Note: dtype will still be int32.)

    // Otherwise, resize to the default size (height x width) which is the input
    // image size used for training the neural network.
    //
    return NeuralNet_ScaleFiller.createTensor_by_scale_Tensor(
      source_Tensor,
      target_shape_height_width,
      bForceInt32
    );
  }

  /**
   * According to testing, in backend "webgl":
   *   - This is the slowest method for scaling data.
   *   - It is far more slower than other .createXxx_by_scale_Xxx() methods.
   *   - But this method can handle tf.tensor3d with any channel count. Other
   *       methods can only handle image (i.e. ( channelCount == 4 )).
   *
   *
   * @param {Uint8ClampedArray|Int32Array} source_TypedArray
   *   An unsigned integer TypedArray. For example, ImageData.data which is
   * coming from a canvas.
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {number} source_channelCount
   *   The channel count of the source_TypedArray. It should equal to
   * ( source_TypedArray / source_height / source_width ).
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target tensor.
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will be guaranteed as
   * int32. Otherwise, the dtype of the returned tf.tensor3d may be int32 or
   * float32 (because of resizing). This is useful if the result will be used
   * by an embedding layer (which only accepts integer input). Default is true.
   *
   * @param {tf.tensor3d}
   *   Return an int32 tensor3d whose shape is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ],
   * source_channelCount ].
   */
  static createTensor_by_scale_TypedArray(
    source_TypedArray,
    source_height, source_width, source_channelCount,
    target_shape_height_width,
    bForceInt32 = true ) {

    let source_shape = [ source_height, source_width, source_channelCount ];
    let source_TensorInt32
      = tf.tensor3d( source_TypedArray, source_shape, "int32" );

    // Resize to the target size (height x width) which is the input image
    // size used for training the neural network.
    return NeuralNet_ScaleFiller.createTensor_by_scale_Tensor(
      source_TensorInt32,
      target_shape_height_width,
      bForceInt32
    );
  }

  /**
   * Used by the following methods internally:
   *   - .createTensor_by_scale_PixelData()
   *   - .createTensor_by_scale_TypedArray()
   *
   *
   * @param {tf.tensor3d} source_Tensor
   *   The source tensor to be scaled. It will be disposed by this method.
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target tensor.
   *
   * @param {boolean} bForceInt32
   *   If true, the dtype of the returned tf.tensor3d will be guaranteed as
   * int32. Otherwise, the dtype of the returned tf.tensor3d may be int32 or
   * float32 (because of resizing). This is useful if the result will be used
   * by an embedding layer (which only accepts integer input). Default is true.
   *
   * @return {tf.tensor3d}
   *   Return a (possible int32) tf.tensor3d whose shape is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ],
   * source_Tensor.shape[ 2 ] ].
   */
  static createTensor_by_scale_Tensor(
    source_Tensor,
    target_shape_height_width,
    bForceInt32 = true ) {

    let scaledSourceTensorFloat32;
    try {

      // Note:
      //
      // ( alignCorners == false ) and ( halfPixelCenters == true ) could
      // get scaling result similar to CanvasRenderingContext2D.drawImage().
      //
      const alignCorners = false;
      const halfPixelCenters = true;

      scaledSourceTensorFloat32 = tf.image.resizeBilinear(
        source_Tensor, target_shape_height_width,
        alignCorners, halfPixelCenters
      );

    } catch ( e ) {
      //debugger;
      throw e; // e.g. out of (GPU) memory.

    } finally {
      source_Tensor.dispose();
    }

    if ( !bForceInt32 )
      return scaledSourceTensorFloat32;

    // Convert to int32 if required. (Note: The dtype of tf.image.resizeXxx()'s
    // result is float32.)
    try {
      let scaledSourceTensorInt32 = scaledSourceTensorFloat32.cast( "int32" );
      return scaledSourceTensorInt32;

    } catch ( e ) {
      //debugger;
      throw e; // e.g. out of (GPU) memory.

    } finally {
      scaledSourceTensorFloat32.dispose();
    }
  }

  /**
   * Scale image by OffscreenCanvas from Canvas (or OffscreenCanvas) directly.
   *
   * This method is:
   *   - the fastest method.
   *   - far more faster than:
   *     - .createImageData_by_scale_ImageData()
   *     - .createTensor_by_scale_PixelData()
   *     - .createTensor_by_scale_TypedArray()
   *
   *
   * @param {HTMLCanvasElement|OffscreenCanvas} source_Canvas
   *   A canvas used as source data.
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target ImageData.
   *
   * @param {ImageData}
   *   Return an ImageData whose shape [ height, width, channelCount ] is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ], 4 ].
   */
  static createImageData_by_scale_Canvas(
    source_Canvas,
    target_shape_height_width
  ) {
    const source_height = source_Canvas.height;
    const source_width = source_Canvas.width;

    const target_height = target_shape_height_width[ 0 ];
    const target_width = target_shape_height_width[ 1 ];

    let target_offscreenCanvas
      = new OffscreenCanvas( target_width, target_height );

    // Note: "webgl" Rendering Context does not have .drawImage(),
    //       .getImageData(), .putImageData().
    let target_offscreenCanvas_ctx = target_offscreenCanvas.getContext( "2d" );
    target_offscreenCanvas_ctx.drawImage( source_Canvas,
      0, 0, source_width, source_height,
      0, 0, target_width, target_height
    );

    let target_ImageData = offscreenCanvas_ctx.getImageData(
      0, 0, target_width, target_height );

    return target_ImageData;
  }

  /**
   * This method calls .createImageData_by_scale_ImageData() internally.
   *
   *
   * @param {Uint8ClampedArray} source_Uint8ClampedArray
   *   An Uint8ClampedArray. For example, ImageData.data which is
   * coming from a canvas. Its .length must equal to
   * ( source_height * source_width * 4 ). It is viewed as
   * ( source_channelCount == 4 ).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_Uint8ClampedArray.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_Uint8ClampedArray.
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target ImageData.
   *
   * @param {ImageData}
   *   Return an ImageData whose shape is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ],
   * source_channelCount ].
   */
  static createImageData_by_scale_Uint8ClampedArray(
    source_Uint8ClampedArray,
    source_height, source_width,
    target_shape_height_width
  ) {

    let source_ImageData = new ImageData(
      source_Uint8ClampedArray, source_height, source_width );

    let target_ImageData
      = NeuralNet_ScaleFiller.createImageData_by_scale_ImageData(
          source_ImageData, target_shape_height_width );

    return target_ImageData;
  }

  /**
   * Scale image by OffscreenCanvas from ImageData.
   *
   * This method is:
   *   - slower than .createImageData_by_scale_Canvas()
   *   - comparable to .createTensor_by_scale_PixelData() and
   *       .createTensor_by_scale_TypedArray()
   *
   *
   * @param {ImageData} source_ImageData
   *   An ImageData used as source data.
   *
   * @param {number[]} target_shape_height_width
   *   A number array as [ target_height, target_width ] describing the shape
   * of the target ImageData.
   *
   * @param {ImageData}
   *   Return an ImageData whose shape [ height, width, channelCount ] is
   * [ target_shape_height_width[ 0 ], target_shape_height_width[ 1 ], 4 ].
   */
  static createImageData_by_scale_ImageData(
    source_ImageData,
    target_shape_height_width
  ) {
    const source_height = source_ImageData.height;
    const source_width = source_ImageData.width;

    let source_offscreenCanvas;
    {
      source_offscreenCanvas
        = new OffscreenCanvas( source_width, source_height );

      let source_offscreenCanvas_ctx
        = source_offscreenCanvas.getContext( "2d" );

      source_offscreenCanvas_ctx.putImageData( source_ImageData, 0, 0 );
    }

    let target_offscreenCanvas;
    let target_ImageData;
    {
      const target_height = target_shape_height_width[ 0 ];
      const target_width = target_shape_height_width[ 1 ];

      target_offscreenCanvas
        = new OffscreenCanvas( target_width, target_height );

      let target_offscreenCanvas_ctx
        = target_offscreenCanvas.getContext( "2d" );

      // Draw with scaling.
      target_offscreenCanvas_ctx.drawImage( source_offscreenCanvas,
        0, 0, source_width, source_height,
        0, 0, target_width, target_height
      );

      target_ImageData = target_offscreenCanvas_ctx.getImageData(
        0, 0, target_width, target_height );
    }

    return target_ImageData;
  }

}
