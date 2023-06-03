export { NeuralNet_FeedbackShape as FeedbackShape };

import { FeedbackToInput as NeuralNet_FeedbackToInput }
  from "./NeuralNet_FeedbackToInput.js";

/**
 *
 *
 *
 *
 * 1. Feedback placing
 *
 * Where to place recurrent feedback information (i.e. previous time output) in
 * the next time input?
 *
 *
 * 1.1 From convolution operation's point of view:
 *
 *   - Neighbor pixels of the same channel can be moved to different channel
 *       of the same pixel by pointwise and then depthwise convolution filter.
 *
 *   - Different channel of the same pixel can also be moved to neighbor pixels
 *       of the same channel by depthwise and then pointwise convolution filter.
 *
 *   - So, it seems both feasible to place recurrent feedback information
 *       either on the neighbor pixels of the same channel or on the different
 *       channel of the same pixel.
 *
 *
 * 1.2 From information dimension's point of view:
 *
 *   - Neighbor pixels on the same channel has two dimensions information
 *       (top-bottom, left-right).
 *
 *   - Different channels of the same pixel has only one dimension (front-rear).
 *
 *   - So, it seems better a little to place recurrent feedback information as
 *       on the neighbor pixels of the same channel.
 *
 *
 * 1.3 From image's point of view:
 *
 *   - Channels are originally used to represent the relevant information of
 *       the same pixel.
 *
 *   - So, it should view the previous output as channels group. For example,
 *     - Suppose: Only 6 output values are needed, and per pixel has 4 channel.
 *     - Then: 24 (= 6 * 4 ) values should be outputted.
 *       - Element 0, 4, 8, 12, 16, 20 are explicit output values.
 *       - Element 1, 2, 3 are implicit output values of element 0.
 *       - Element 5, 6, 7 are implicit output values of element 4.
 *       - ...
 *     - Both explicit and implicit output values are used as recurrent
 *         feedback information.
 *
 *
 * 2. Explicit/Implicit Input/Output
 *
 *   - Input: It is all the data which will be sent to and processed by a
 *       neural network.
 *
 *     - Explicit input: It is a part of the input which is visible to user.
 *
 *     - Implicit input: It is a part of the input which is not visible to
 *         user.
 *
 *       - For example, the left-top corner area of the whole screen image. The
 *           area should always be filled with black transparent
 *           ( RGBA = ( 0, 0, 0, 0 ) ).
 *
 *         - In Construct3, because DrawingCanvas must be the same position and
 *             size as viewport (to prevent from painting postion and scale
 *             skewed), keeping the left-top corner area unused is a practical
 *             way to provide implicit input area.
 *
 *         - In Construct3, the implicit input area could be achieved by
 *             DrawingCanvas.clearRect() with black transparent
 *             ( RGBA = ( 0, 0, 0, 0 ) ).
 *
 *           - Q: Why not use blend mode "Copy" to draw a black transparent
 *                ( RGBA = ( 0, 0, 0, 0 ) ) rectangle object inside
 *                DrawingCanvas at the implicit input area?
 *
 *           - A: If there is objects with blend mode "Additive"
 *                (e.g. Particles) inside DrawingCanvas, they seems can not be
 *                masked out by any other objects. The reason seems that these
 *                objects will always be painted at the last.
 *
 *       - Its main usage is to place the alignement mark (for letting neural
 *           network know who it personates currently) and the feedback
 *           information (i.e. the previous time output of the neural network).
 *
 *       - Note: Implicit input will contain not only alignment mark and the
 *           (previous time) implicit output but also the (previous time)
 *           explicit output.
 *
 *   - Output: It is all the data which is outputted by the neural network.
 *
 *     - Explicit output: It is a part of the output which is visible to user.
 *       - For example, the keyboard pressing simulation.
 *
 *     - Implicit output: It is a part of the output which is not visible to
 *         user.
 *
 *       - For example, the reason of the keyboard pressing simulation.
 *
 *       - It is mainly used as extra data of feedback information in the next
 *           time input.
 *
 *
 * 3. Shape
 *
 *
 * 3.1 Implicit input shape
 *
 * Implicit input data is usually arranged along the height and width because
 * of computation cost.
 *
 *   - Arranging new data along channels (i.e. concatenating original input
 *       image with new channels) needs move the whole input data.
 *
 *   - By contrast, putting new data into part of original input image just
 *       needs move that part.
 *
 *
 * 3.2 Explicit/Implicit output shape
 *
 * Since the output of a convolution neural network (CNN) only has channels
 * (i.e. its height and width is always 1 * 1), the explicit and implicit
 * output data will be arranged as interleaved along the channels.
 *
 * A possible arrangement:
 *
 *   - Every n (= input_channelCount) channels is viewed as an explicit and
 *       implicit output unit.
 *
 *     - That is, every 1 explicit output data will accompany with
 *         ( input_channelCount -  1 ) implicit output data.
 *
 *     - For example, if there are 64 output channels and input channel count
 *         is 4 (i.e. RGBA), there will be 16 (= ( 64 / 4 ) ) explicit output
 *         data. Every 1 explicit output data accompanies with 3 implicit output
 *         data.
 *
 *   - Let an explicit and implicit output unit become a single pixel when
 *       they are filled into the (next time) implicit input (as feedback
 *       information).
 *
 *     - So that the strong correlation between explicit and implicit output
 *         of an unit could be represented by the strong correlation of
 *         channels of a single pixel.
 *
 *
 *
 * @member {number} input_width
 *   The whole input image's width (pixel count).
 *
 * @member {number} input_width_valueCount
 *   The whole input image's width (value count). (Note: Every pixel has
 * .input_channelCount values.) (= input_width * input_channelCount) It
 * is the strides to the next row pixel.
 *
 * @member {number} input_pixelCount
 *   The whole input image's pixel count. (= input_height * input_width)
 *
 * @member {number} input_valueCount
 *   The whole input image's value count. (Note: Every pixel has
 * .input_channelCount values.) (= input_pixelCount * input_channelCount)
 *
 *
 * @member {number} explicit_input_width
 *   The explicit (i.e. user visible) input image's width (pixel count). It is
 * equal to or less than input_width.
 *
 * @member {number} explicit_input_pixelCount
 *   The explicit input image's pixel count
 * (= explicit_input_height * explicit_input_width).
 *
 * @member {number} explicit_input_valueCount
 *   The explicit input image's value count
 * (= explicit_input_pixelCount * input_channelCount).
 * 
 *
 *
 */
class NeuralNet_FeedbackShape extends NeuralNet_FeedbackToInput {

  /**
   *
   */
  constructor() {
    super();
  }

  /**
   * @see NeuralNet_FeedbackToInput.init
   */
  init(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount
  ) {

    // 1. Ensure positive integer.
    this.explicit_input_width = explicit_input_width
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_width );

    // 2. Information for feedback to input.
    super.init(
      explicit_input_height,
      explicit_input_channelCount,
      feedback_valueCount
    );

    // 3.
    this.explicit_input_pixelCount
      = this.explicit_input_height * this.explicit_input_width;

    this.explicit_input_valueCount
      = this.explicit_input_pixelCount * this.input_channelCount;

    // 4.
    this.input_width = this.implicit_input_width + this.explicit_input_width;
    this.input_width_valueCount = this.input_width * this.input_channelCount;

    this.input_pixelCount = this.input_height * this.input_width;
    this.input_valueCount = this.input_pixelCount * this.input_channelCount;
  }

  /**
   * Call .implicit_input_set_by_alignmentMarkValueArray() and
   * .implicit_input_set_by_previousOutputTypedArray().
   *
   *
   * @param {Uint8ClampedArray|Int32Array} input_TypedArray
   *   The (next time) input of the pair of neural networks. Usually, it is
   * integer typed array. It should large enough to contain both implicit and
   * explicit input.
   *
   * @param {Uint8ClampedArray|Int32Array|number[]} alignmentMarkValueArray
   *   A non-negative integer array (as a pixel) representing the neural
   * network personating which alignment currently. Its .length should be the
   * same as .input_channelCount becasue it represents a pixel.
   *
   * @param {Int32Array} previous_output_Int32Array
   *   The (previous time) output of the neural networks.
   */
  implicit_input_set_by_alignmentMarkValueArray_previousOutputTypedArray(
    input_TypedArray, alignmentMarkValueArray, previous_output_Int32Array ) {

    this.implicit_input_set_by_alignmentMarkValueArray(
      input_TypedArray, alignmentMarkValueArray );

    this.implicit_input_set_by_previousOutputTypedArray(
      input_TypedArray, previous_output_Int32Array
    );
  }

  /**
   * Fill the alignment mark values to the next time input. All pixels
   * (including every channels) inside implicit input area 0 will be filled
   * with the alignment mark values.
   *
   *
   * @param {Uint8ClampedArray|Int32Array} input_TypedArray
   *   The (next time) input of the pair of neural networks. Usually, it is
   * integer typed array. It should large enough to contain both implicit and
   * explicit input.
   *
   * @param {Uint8ClampedArray|Int32Array|number[]} alignmentMarkValueArray
   *   A non-negative integer array (as a pixel) representing the neural
   * network personating which alignment currently. Its .length should be the
   * same as .input_channelCount becasue it represents a pixel.
   */
  implicit_input_set_by_alignmentMarkValueArray(
    input_TypedArray, alignmentMarkValueArray ) {

    const funcNameInMessage = "implicit_input_set_by_alignmentMarkValueArray";

    // Q: Why fill an area pixels? Why not just fill ( 1 * 1 ) pixel?
    // A: NeuralNet mainly uses ( 3 * 3 ) depthwise filter.
    //
    //   - If alignment mark just occupies ( 1 * 1 ) pixel, it could only be
    //       detected by a special depthwise filter.
    //
    //   - If alignment mark occupies ( 3 * 3 ) pixel, it could be detected by
    //       most kinds of depthwise filter easily.
    //

    const input_channelCount = this.input_channelCount;
    const area = this.area;

    // 1. Check (next time) input shape.
    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount ( ${this.input_valueCount} ).`
      );

    // 2. Check alignment mark value array shape.
    if ( alignmentMarkValueArray.length != input_channelCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `alignmentMarkValueArray.length `
        + `( ${alignmentMarkValueArray.length} ) `
        + `should be the same as `
        + `input_channelCount ( ${input_channelCount} ).`
      );

    // 3.
    const input_width_valueCount = this.input_width_valueCount;
    const area_height_pixelCount_original = area.height_pixelCount_original;
    const area_height_multiplier = area.height_multiplier;
    const area_width_pixelCount_original = area.width_pixelCount_original;
    const area_width_multiplier = area.width_multiplier;

    // 4. Fill alignment mark value to the next time input.
    let to_valueIndex = 0;

    // 4.1
    const areaIndex = 0; // Area 0 is for filling alignment mark.
    {
      let area_position_left = this.area_position_leftArray[ areaIndex ];
      let area_position_top = this.area_position_topArray[ areaIndex ];

      let to_valueIndex_y_begin
        = ( ( area_position_top * this.input_width ) + area_position_left )
            * input_channelCount;

      // 4.2
      for ( let y = 0; y < area_height_pixelCount_original; ++y ) {

        // 4.3
        for ( let y_multiplier = 0;
          y_multiplier < area_height_multiplier; ++y_multiplier ) {

          to_valueIndex = to_valueIndex_y_begin;

          // 4.4
          for ( let x = 0; x < area_width_pixelCount_original; ++x ) {

            // 4.5
            for ( let x_multiplier = 0;
              x_multiplier < area_width_multiplier; ++x_multiplier ) {

              // 4.6
              for ( let c = 0; c < input_channelCount; ++c ) {
                input_TypedArray[ to_valueIndex ]
                  = alignmentMarkValueArray[ c ];
                ++to_valueIndex;
              } // c

            } // x_multiplier
          } // x

          to_valueIndex_y_begin += input_width_valueCount;
        } // y_multiplier
      } // y
    } // areaIndex
  }

  /**
   * Fill the previous time output (i.e. feedback) to the next time input. The
   * pixels (including channels of partial pixel) which inside input area but
   * outside previous output will be filled with zero.
   *
   *
   * @param {Uint8ClampedArray|Int32Array} input_TypedArray
   *   The (next time) input of the pair of neural networks. Usually, it is
   * integer typed array. It should large enough to contain both implicit and
   * explicit input.
   *
   * @param {Int32Array} previous_output_Int32Array
   *   The (previous time) output of the neural networks.
   *
   */
  implicit_input_set_by_previousOutputTypedArray(
    input_TypedArray, previous_output_Int32Array ) {

    const funcNameInMessage = "implicit_input_set_by_previousOutputTypedArray";

    const input_channelCount = this.input_channelCount;
    const area = this.area;

    // 1. Check (next time) input shape.
    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount ( ${this.input_valueCount} ).`
      );

    // 2. Check (previous time) output shape.
    if ( previous_output_Int32Array.length != area.from_valueCount_original )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32Array.length `
        + `( ${previous_output_Int32Array.length} ) `
        + `should be the same as `
        + `area.from_valueCount_original `
        + `( ${area.from_valueCount_original} ).`
      );

    // 3.
    const input_width_valueCount = this.input_width_valueCount;
    //const areaCount = this.areaCount;
    const area_height_pixelCount_original = area.height_pixelCount_original;
    const area_height_multiplier = area.height_multiplier;
    const area_width_pixelCount_original = area.width_pixelCount_original;
    const area_width_multiplier = area.width_multiplier;

    const area_from_valueCount_original = area.from_valueCount_original;
    const area_from_valueCount_expanded = area.from_valueCount_expanded;

    // 4. Fill previous time output (i.e. feedback) to the next time input.
    let to_valueIndex = 0;

    // 4.1
    let from_valueIndex_y_begin = 0;
    let from_valueIndex_x_begin;
    let from_valueIndex = 0;

    const areaIndex = 1; // Area 1 is for filling feedback.
    {
      let area_position_left = this.area_position_leftArray[ areaIndex ];
      let area_position_top = this.area_position_topArray[ areaIndex ];

      let to_valueIndex_y_begin
        = ( ( area_position_top * this.input_width ) + area_position_left )
            * input_channelCount;

      let from_valueCount_original_remained_y_begin
        = area_from_valueCount_original;

      let from_valueCount_original_remained_x_begin;
      let from_valueCount_original_remained = area_from_valueCount_original;

      // 4.2
      for ( let y = 0; y < area_height_pixelCount_original; ++y ) {

        // 4.3
        for ( let y_multiplier = 0;
          y_multiplier < area_height_multiplier; ++y_multiplier ) {

          from_valueIndex_x_begin = from_valueIndex_y_begin;

          from_valueCount_original_remained_x_begin
            = from_valueCount_original_remained_y_begin;

          to_valueIndex = to_valueIndex_y_begin;

          // 4.4
          for ( let x = 0; x < area_width_pixelCount_original; ++x ) {

            // Handle the last pixel which comes from feedback.
            //
            // Note: It is the same for the same x (even if different
            //       x_multiplier). But, it may appear many times in
            //       different y_multiplier of the same y.
            let channelCount_to_copy; // channels to copy from feedback.
            {
              if ( input_channelCount
                      > from_valueCount_original_remained_x_begin ) {
                channelCount_to_copy // not enough feedback values.
                  = from_valueCount_original_remained_x_begin;
              } else {
                channelCount_to_copy = input_channelCount;
              }
            }

            // 4.5
            for ( let x_multiplier = 0;
              x_multiplier < area_width_multiplier; ++x_multiplier ) {

              from_valueIndex = from_valueIndex_x_begin;

              from_valueCount_original_remained
                = from_valueCount_original_remained_x_begin;

              // 4.6

              // 4.6.1 Copy output values as feedback in input values.
              let c = 0;
              for ( ; c < channelCount_to_copy; ++c ) {
                let from_value = previous_output_Int32Array[ from_valueIndex ];
                input_TypedArray[ to_valueIndex ] = from_value;

                ++from_valueIndex;
                --from_valueCount_original_remained;

                ++to_valueIndex;
              } // c

              // 4.6.2
              // Fill zero for
              //   - channels exceeding area.from_valueCount_expanded, and
              //   - pixels exceeding area.from_pixelCount_expanded.
              for ( ; c < input_channelCount; ++c ) {
                input_TypedArray[ to_valueIndex ] = 0;
                ++to_valueIndex;
              } // c

            } // x_multiplier

            from_valueIndex_x_begin += input_channelCount;

            from_valueCount_original_remained_x_begin
              -= channelCount_to_copy;
          } // x

          to_valueIndex_y_begin += input_width_valueCount;
        } // y_multiplier

        from_valueIndex_y_begin = from_valueIndex_x_begin;

        from_valueCount_original_remained_y_begin
          = from_valueCount_original_remained_x_begin;
      } // y

      // Note: Checking here (instead of in the channel c loop) for avoiding
      //       performance reducing too much.
      {
        if ( from_valueCount_original_remained < 0 )
          throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
            + `from_valueCount_original_remained ( `
            + `${from_valueCount_original_remained} ) `
            + `should be non-negative.`
          );
      }

      // Because area_from_valueCount_original may not be divisible by
      // input_channelCount, the incremental from_valueIndex_y_begin is
      // not usable here. So, assign area_from_valueCount_original to it
      // directly. 
      from_valueIndex_y_begin = area_from_valueCount_original;
    } // areaIndex
  }

  /**
   * Extract every 1st channel of pixels of the previous time output values.
   * Every .input_channelCount values are viewed as a pixel.
   *
   *
   * @param {number[]|TypedArray} to_valueArray
   *   The extracted values will be filled into this number array (or
   * TypedArray).
   *
   * @param {Float32Array|Int32Array} from_output_valueArray
   *   A number array (or TypedArray) to be extracted information from. It is
   * usually the output TypedArray of a neural network.
   *
   * @param {number} from_output_pixelIndexBegin
   *   The pixel index to begin extracting. It is a non-negative integer between
   * [ 0, ( from_output_valueArray.length / this.input_channelCount ) ).
   *   - Every .input_channelCount values (in from_output_valueArray) is viewed
   *       as a feedback pixel.
   *   - The first channel of every pixel will be extracted.
   *   - All other channels of every pixel will be ignored.
   *
   * @param {number} from_output_pixelCount
   *   The pixel count to be extracted. It is a non-negative integer and
   * ( from_output_pixelIndexBegin + from_output_pixelCount ) must be between
   * [ 0, ( from_output_valueArray.length / this.input_channelCount ) ).
   */
  valueArray_get_from_output_valueArray_1st_channel(
    to_valueArray, from_output_valueArray,
    from_output_pixelIndexBegin, from_output_pixelCount
  ) {

    const funcNameInMessage = "valueArray_get_from_output_valueArray_1st_channel";

    // 1.
    const from_output_valueCount = Math.floor( from_output_valueArray.length );
    const input_channelCount = this.input_channelCount;

    // 2.
    const from_output_pixelCountMax
      = Math.ceil( from_output_valueCount / input_channelCount );

    // 3.

    // 3.1
    // from_output_pixelIndexBegin should be non-negative.
    if ( !( from_output_pixelIndexBegin >= 0 ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) `
        + `should be greater than or equal to 0.`
      );

    // from_output_pixelIndexBegin should not exceed available pixels.
    if ( !( from_output_pixelIndexBegin < from_output_pixelCountMax ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) `
        + `should be less than or equal to `
        + `( from_output_valueArray.length / this.input_channelCount ) = `
        + `( ${from_output_valueArray.length} / ${input_channelCount} ) = `
        + `( ${from_output_pixelCountMax} ).`
      );

    // 3.2
    // from_output_pixelCount should be non-negative.
    if ( !( from_output_pixelCount >= 0 ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelCount ( ${from_output_pixelCount} ) `
        + `should be greater than or equal to 0.`
      );

    // from_output_pixelCount should not exceed available pixels.
    let from_output_pixelIndexEnd
      = from_output_pixelIndexBegin + from_output_pixelCount;

    if ( !( from_output_pixelIndexEnd <= from_output_pixelCountMax ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexEnd ( ${from_output_pixelIndexEnd} ) = ( `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) + `
        + `from_output_pixelCount ( ${from_output_pixelCount} ) ) `
        + `should be less than or equal to `
        + `( from_output_valueArray.length / this.input_channelCount ) = `
        + `( ${from_output_valueArray.length} / ${input_channelCount} ) = `
        + `( ${from_output_pixelCountMax} ).`
      );

    // 4.
    let from_output_pixelIndex = from_output_pixelIndexBegin;

    const from_output_valueIndexBase = 0;
    let from_output_valueIndex = from_output_valueIndexBase
      + ( from_output_pixelIndex * input_channelCount );

    // 5. Extract all the 1st channel values of all specified pixels of the
    //    previous time output of a neural network.

    to_valueArray.length = from_output_pixelCount;

    for ( let i = 0; i < to_valueArray.length; ++i ) {
      let pixel_channel_1st = from_output_valueArray[ from_output_valueIndex ];
      to_valueArray[ i ] = pixel_channel_1st;

      ++from_output_pixelIndex;
      from_output_valueIndex += input_channelCount;
    }
  }

  /**
   *
   * @param {Uint8ClampedArray|Int32Array} input_TypedArray
   *   The (next time) input of the pair of neural networks. Usually, it is
   * integer typed array. It should large enough to contain both implicit and
   * explicit input.
   *
   * @param {Uint8ClampedArray|Int32Array|number[]} pixelValueArray
   *   A non-negative integer array (as a pixel). Its .length should be
   * the same as .input_channelCount becasue it represents a pixel.
   *
   * @return {boolean}
   *   Return true, if every pixel (including every channels) inside implicit
   * input area is filled with the pixel values.
   */
  implicit_input_is_by_pixel( input_TypedArray, pixelValueArray ) {
    const funcNameInMessage = "implicit_input_is_by_pixel";

    const input_channelCount = this.input_channelCount;

    // 1. Check (next time) input shape.
    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount ( ${this.input_valueCount} ).`
      );

    // 2. Check pixel value array shape.
    if ( pixelValueArray.length != input_channelCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `pixelValueArray.length `
        + `( ${pixelValueArray.length} ) `
        + `should be the same as `
        + `input_channelCount ( ${input_channelCount} ).`
      );

    // 3.
    //const input_width = this.input_width;
    const input_width_valueCount = this.input_width_valueCount;

    const implicit_input_height = this.implicit_input_height;
    const implicit_input_width = this.implicit_input_width;

    // 4. Check every target value of the next time input.
    let to_valueIndex = 0;

    // 4.1
    {
      let area_position_left = 0;
      let area_position_top = 0;

      let to_valueIndex_y_begin
        = ( ( area_position_top * this.input_width ) + area_position_left )
            * input_channelCount;

//!!! ...unfinished... (2023/06/03)

      // 4.2
      for ( let y = 0; y < implicit_input_height; ++y ) {
        to_valueIndex = to_valueIndex_y_begin;

        // 4.3
        for ( let x = 0; x < implicit_input_width; ++x ) {

          // 4.4
          for ( let c = 0; c < input_channelCount; ++c ) {
            if ( input_TypedArray[ to_valueIndex ] != pixelValueArray[ c ] )
              return false;

            ++to_valueIndex;
          } // c
        } // x

        to_valueIndex_y_begin += input_width_valueCount;
      } // y
    }

    return true;
  }

  /** @override */
  toString() {
    let str = `${super.toString()}, `
      + `explicit_input_width=${this.explicit_input_width}, `

      + `explicit_input_pixelCount=${this.explicit_input_pixelCount}, `
      + `explicit_input_valueCount=${this.explicit_input_valueCount}, `

      + `input_width=${this.input_width}, `
      + `input_width_valueCount=${this.input_width_valueCount}, `

      + `input_pixelCount=${this.input_pixelCount}, `
      + `input_valueCount=${this.input_valueCount}`
      ;
    return str;
  }

}
