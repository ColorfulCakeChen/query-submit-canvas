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
 *       - For example, the whole screen image.
 *
 *     - Implicit input: It is a part of the input which is not visible to
 *         user.
 *       - For example, the image which is arranged outside of the screen.
 *       - Its main usage is to place the feedback information (i.e. the
 *           previous time output).
 *       - Note: Implicit input will contain not only (previous time) implicit
 *           output but also (previous time) explicit output.
 *
 *   - Output: It is all the data which is outputted by the neural network.
 *
 *     - Explicit output: It is a part of the output which is visible to user.
 *       - For example, the keyboard pressing simulation.
 *
 *     - Implicit output: It is a part of the output which is not visible to
 *         user.
 *       - For example, the reason of the keyboard pressing simulation.
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
 *       needs move the part.
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
 * @member {number} input_height
 *   The whole input image's height (pixel count).
 *
 * @member {number} input_width
 *   The whole input image's width (pixel count).
 *
 * @member {number} input_width_valueCount
 *   The whole input image's width (value count). (Note: Every pixel has
 * .input_channelCount values.) (= input_width * input_channelCount) It
 * is the strides to the next row pixel.
 *
 * @member {number} input_channelCount
 *   The whole input image's channel count.
 *
 * @member {number} input_pixelCount
 *   The whole input image's pixel count. (= input_height * input_width)
 *
 * @member {number} input_valueCount
 *   The whole input image's value count. (Note: Every pixel has
 * .input_channelCount values.) (= input_pixelCount * input_channelCount)
 *
 *
 * @member {number} explicit_input_height
 *   The explicit (i.e. user visible) input image's height (pixel count). It is
 * equal to or less than input_height.
 *
 * @member {number} explicit_input_width
 *   The explicit (i.e. user visible) input image's width (pixel count). It is
 * equal to or less than input_width.
 *
 * @member {number} explicit_input_channelCount
 *   The explicit (i.e. user visible) input image's channel count. It is always
 * equal to input_channelCount.
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
 * @member {number} implicit_input_height
 *   The implicit (i.e. feedback from previous output) input image's height
 * (pixel count). It is equal to or less than input_height.
 *
 * @member {number} implicit_input_width
 *   The implicit (i.e. feedback from previous output) input image's width
 * (pixel count).
 *
 * @member {number} implicit_input_channelCount
 *   The implicit (i.e. feedback from previous output) input image's channel
 * count. It is always equal to input_channelCount.
 *
 * @member {number} implicit_input_pixelCount
 *   The implicit (i.e. feedback from previous output) input image's pixel count
 * (= implicit_input_height * implicit_input_width). It is greater than or
 * equal to .allNeuralNets.from_pixelCount_expanded.
 *
 * @member {number} implicit_input_valueCount
 *   The implicit (i.e. feedback from previous output) input image's value count
 * (= implicit_input_pixelCount * input_channelCount). It is greater than or
 * equal to .allNeuralNets.from_valueCount_expanded.
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
   *
   */
  init(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {

    // 1. Ensure positive integer.
    this.explicit_input_width = explicit_input_width
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_width );

    // 2. Information for feedback to input.
    super.init(
      explicit_input_height,
      explicit_input_channelCount,
      feedback_valueCount_per_alignment
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
   * @param {Int32Array[]} previous_output_Int32ArrayArray
   *   The (previous time) output of the pair of neural networks.
   *
   *   - previous_output_Int32ArrayArray[ 0 ]
   *       [ 0 .. ( this.feedback_valueCount_per_alignment - 1 ) ]
   *       is the (previous time) output of neural network 0 when it personates
   *       alignment 0.
   *
   *   - previous_output_Int32ArrayArray[ 0 ]
   *       [ this.feedback_valueCount_per_alignment
   *         .. ( ( 2 * this.feedback_valueCount_per_alignment ) - 1 ) ]
   *       is the (previous time) output of neural network 0 when it personates
   *       alignment 1.
   *
   *   - previous_output_Int32ArrayArray[ 1 ]
   *       [ 0 .. ( this.feedback_valueCount_per_alignment - 1 ) ]
   *       is the (previous time) output of neural network 1 when it personates
   *       alignment 0.
   *
   *   - previous_output_Int32ArrayArray[ 1 ]
   *       [ this.feedback_valueCount_per_alignment
   *         .. ( ( 2 * this.feedback_valueCount_per_alignment ) - 1 ) ]
   *       is the (previous time) output of neural network 1 when it personates
   *       alignment 1.
   *
   */
  set_implicit_input_by_previous_output(
    input_TypedArray, previous_output_Int32ArrayArray ) {

    const funcNameInMessage = "set_implicit_input_by_previous_output";

    const input_channelCount = this.input_channelCount;
    const area = this.area;
    const perNeuralNet = this.perNeuralNet;

    // 1. Check (next time) input shape.
    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount ( ${this.input_valueCount} ).`
      );

    // 2. Check (previous time) output shape.

    // Note: ( this.neuralNetCount == 2 )
    if ( previous_output_Int32ArrayArray.length != this.neuralNetCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray.length `
        + `( ${previous_output_Int32ArrayArray.length} ) `
        + `should be the same as `
        + `.neuralNetCount ( ${this.neuralNetCount} ).`
      );

    if ( previous_output_Int32ArrayArray[ 0 ].length
           != perNeuralNet.from_valueCount_original )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 0 ].length `
        + `( ${previous_output_Int32ArrayArray[ 0 ].length} ) `
        + `should be the same as `
        + `perNeuralNet.from_valueCount_original `
        + `( ${perNeuralNet.from_valueCount_original} ).`
      );

    if ( previous_output_Int32ArrayArray[ 1 ].length
           != perNeuralNet.from_valueCount_original )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 1 ].length `
        + `( ${previous_output_Int32ArrayArray[ 1 ].length} ) `
        + `should be the same as `
        + `perNeuralNet.from_valueCount_original `
        + `( ${perNeuralNet.from_valueCount_original} ).`
      );

    const input_width_valueCount = this.input_width_valueCount;
    const neuralNetCount = this.neuralNetCount;
    const alignmentCount_per_neuralNet = this.alignmentCount_per_neuralNet;
    const area_height_pixelCount_original = area.height_pixelCount_original;
    const area_height_multiplier = area.height_multiplier;
    const area_width_pixelCount_original = area.width_pixelCount_original;
    const area_width_multiplier = area.width_multiplier;

    const area_from_valueCount_original = area.from_valueCount_original;
    const area_from_valueCount_expanded = area.from_valueCount_expanded;

    // 3. Fill previous time output (i.e. feedback) to next time input.
    let to_valueIndex = 0;

    // 3.1
    // Note: ( .neuralNetCount == 2 )
    for ( let neuralNetIndex = 0;
      neuralNetIndex < neuralNetCount; ++neuralNetIndex ) {

      let previous_output_Int32Array
        = previous_output_Int32ArrayArray[ neuralNetIndex ];

      let area_position_leftArray
        = this.area_position_leftArrayArray[ neuralNetIndex ];

      let area_position_topArray
        = this.area_position_topArrayArray[ neuralNetIndex ];

      // 3.2
      let from_valueIndex_y_begin = 0;
      let from_valueIndex_x_begin;
      let from_valueIndex = 0;

      // Note: ( .alignmentCount_per_neuralNet == 2 )
      for ( let alignmentIndex = 0;
        alignmentIndex < alignmentCount_per_neuralNet; ++alignmentIndex ) {

        let area_position_left = area_position_leftArray[ alignmentIndex ];
        let area_position_top = area_position_topArray[ alignmentIndex ];

        let to_valueIndex_y_begin
          = ( ( area_position_top * this.input_width ) + area_position_left )
              * this.input_channelCount;

        let from_valueCount_original_remained_y_begin
          = area_from_valueCount_original;

        let from_valueCount_original_remained_x_begin;
        let from_valueCount_original_remained = area_from_valueCount_original;

//!!! (2023/04/29 Remarked) Not so easily to calc from pixel count remained.
//         let from_pixelCount_original_remained_y_begin = area.from_pixelCount_original;
//         let from_pixelCount_original_remained = area.from_pixelCount_original;

        // 3.3
        for ( let y = 0; y < area_height_pixelCount_original; ++y ) {

          // 3.4
          for ( let y_multiplier = 0;
            y_multiplier < area_height_multiplier; ++y_multiplier ) {

            from_valueIndex_x_begin = from_valueIndex_y_begin;

            from_valueCount_original_remained_x_begin
              = from_valueCount_original_remained_y_begin;
//!!! (2023/04/29 Remarked) Not so easily to calc from pixel count remained.
//             from_pixelCount_original_remained
//               = from_pixelCount_original_remained_y_begin;

            to_valueIndex = to_valueIndex_y_begin;

            // 3.5
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

              // 3.6
              for ( let x_multiplier = 0;
                x_multiplier < area_width_multiplier; ++x_multiplier ) {

                from_valueIndex = from_valueIndex_x_begin;

                from_valueCount_original_remained
                  = from_valueCount_original_remained_x_begin;

                // 3.7

                // 3.7.1 Copy output values as feedback in input values.
                let c = 0;
                for ( ; c < channelCount_to_copy; ++c ) {
                  let from_value = previous_output_Int32Array[ from_valueIndex ];
                  input_TypedArray[ to_valueIndex ] = from_value;

                  ++from_valueIndex;
                  --from_valueCount_original_remained;

                  ++to_valueIndex;
                } // c

                // 3.7.2
                // Fill zero for
                //   - channels exceeding area.from_valueCount_expanded, and
                //   - pixels exceeding area.from_pixelCount_expanded.
                for ( ; c < input_channelCount; ++c ) {
                  input_TypedArray[ to_valueIndex ] = 0;
                  ++to_valueIndex;
                } // c

              } // x_multiplier

//!!! (2023/04/29 Remarked) Not so easily to calc from pixel count remained.
//             --from_pixelCount_original_remained;

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

//!!! (2023/04/29 Remarked) Not so easily to calc from pixel count remained.
//           if ( from_pixelCount_original_remained < 0 )
//             throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
//               + `from_pixelCount_original_remained ( `
//               + `${from_pixelCount_original_remained} ) `
//               + `should be non-negative.`
//             );
        }

        // Because area_from_valueCount_original may not be divisible by
        // input_channelCount, the incremental from_valueIndex_y_begin is
        // not usable here. So, assign area_from_valueCount_original to it
        // directly. 
        from_valueIndex_y_begin = area_from_valueCount_original;
      } // alignmentIndex
    } // neuralNetIndex
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
   * usually the output TypedArray of a neural network. It is viewed as
   * containing two alignments output values which the neural network could
   * personate.
   *
   *   - from_output_valueArray[ 0 ] to
   *     from_output_valueArray[ ( from_output_valueArray.length / 2 ) - 1 ]:
   *
   *       The (explicit and implicit) output values when the neural network
   *       personates alignment 0.
   *
   *   - from_output_valueArray[ from_output_valueArray.length / 2 ] to
   *     from_output_valueArray[ from_output_valueArray.length - 1 ]:
   *
   *       The (explicit and implicit) output values when the neural network
   *       personates alignment 1.
   *
   * @param {number} alignmentIndex
   *   An non-negative integer represents which alignment the neural network
   * wants to personate. It should be either 0 or 1.
   *
   * @param {number} from_output_pixelIndexBegin
   *   The pixel index (when the neural network personates the specified
   * alignment) to begin extracting. It is a non-negative integer between
   * [ 0, ( ( from_output_valueArray.length / 2 ) / this.input_channelCount ) ).
   *   - Every .input_channelCount values (in from_output_valueArray) is viewed
   *       as a feedback pixel.
   *   - The first channel of every pixel will be extracted.
   *   - All other channels of every pixel will be ignored.
   *
   * @param {number} from_output_pixelCount
   *   The pixel count to stop extracting (non-inclusive). It is a non-negative
   * integer and ( from_output_pixelIndexBegin + from_output_pixelCount ) must
   * be between
   * [ 0, ( ( from_output_valueArray.length / 2 ) / this.input_channelCount ) ).
   */
  valueArray_get_from_output_valueArray_1st_channel(
    to_valueArray, from_output_valueArray,
    alignmentIndex, from_output_pixelIndexBegin, from_output_pixelCount
  ) {

    const funcNameInMessage = "valueArray_get_from_output_valueArray_1st_channel";

    // 1.
    if ( ( from_output_valueArray.length % 2 ) != 0 )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_valueArray.length ( ${rom_output_valueArray.length} ) `
        + `should be even number (i.e. divisible by 2).`
      );

    let from_output_valueCountPerAlignment
      = Math.floor( from_output_valueArray.length / 2 );

    // 2.
    let from_output_pixelCountPerAlignment
      = Math.ceil( from_output_valueCountPerAlignment / this.input_channelCount );

    // 3. alignment index should be either 0 or 1.
    let from_output_valueIndexBase;
    {
      if ( alignmentIndex === 0 )
        from_output_valueIndexBase = 0;
      else if ( alignmentIndex === 1 )
        from_output_valueIndexBase = from_output_valueCountPerAlignment;
      else
        throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
          + `alignmentIndex ( ${alignmentIndex} ) should be either 0 or 1.`
        );
    }

    // 4.
    let from_output_pixelIndex = from_output_pixelIndexBegin;

    // 4.1
    // from_output_pixelIndexBegin should be non-negative.
    if ( !( from_output_pixelIndexBegin >= 0 ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) `
        + `should be greater than or equal to 0.`
      );

    // from_output_pixelIndexBegin should not exceed available pixels of the
    // alignment.
    if ( !( from_output_pixelIndexBegin < from_output_pixelCountPerAlignment ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) `
        + `should be less than or equal to `
        + `( ( from_output_valueArray.length / 2 ) / this.input_channelCount ) = `
        + `( ( ${from_output_valueArray.length} / 2 ) / ${this.input_channelCount} ) = `
        + `( ${from_output_pixelCountPerAlignment} ).`
      );

    // 4.2
    // from_output_pixelCount should be non-negative.
    if ( !( from_output_pixelCount >= 0 ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelCount ( ${from_output_pixelCount} ) `
        + `should be greater than or equal to 0.`
      );

    // from_output_pixelCount should not exceed available pixels of the
    // alignment.
    let from_output_pixelIndexEnd
      = from_output_pixelIndexBegin + from_output_pixelCount;

    if ( !( from_output_pixelIndexEnd <= from_output_pixelCountPerAlignment ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `from_output_pixelIndexEnd ( ${from_output_pixelIndexEnd} ) = ( `
        + `from_output_pixelIndexBegin ( ${from_output_pixelIndexBegin} ) + `
        + `from_output_pixelCount ( ${from_output_pixelCount} ) ) `
        + `should be less than or equal to `
        + `( ( from_output_valueArray.length / 2 ) / this.input_channelCount ) = `
        + `( ( ${from_output_valueArray.length} / 2 ) / ${this.input_channelCount} ) = `
        + `( ${from_output_pixelCountPerAlignment} ).`
      );

    // 5.
    let from_output_valueIndex = from_output_valueIndexBase
      + ( from_output_pixelIndex * this.input_channelCount );

    // 6. Extract all the 1st channel values of all specified pixels of the
    //    previous time output of a neural network.

    to_valueArray.length = from_output_pixelCount;

    for ( let i = 0; i < to_valueArray.length; ++i ) {
      let pixel_channel_1st = from_output_valueArray[ from_output_valueIndex ];
      to_valueArray[ i ] = pixel_channel_1st;

      ++from_output_pixelIndex;
      from_output_valueIndex += this.input_channelCount;
    }
  }

}
