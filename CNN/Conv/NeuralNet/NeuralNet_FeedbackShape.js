export { NeuralNet_FeedbackShape as FeedbackShape };

import { FeedbackToInput as NeuralNet_FeedbackToInput }
  from "./NeuralNet/NeuralNet_FeedbackToInput.js";

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
 *
 *

//!!! ...unfinished... (2023/04/17)

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
 * .input_channelCount values.) (= input_width * input_channelCount)
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
 * equal to necessary of .feedbackToInput.
 *
 * @member {number} implicit_input_valueCount
 *   The implicit (i.e. feedback from previous output) input image's value count
 * (= implicit_input_pixelCount * input_channelCount).
 *
 *
 * @member {NeuralNet.FeedbackToInput} feedbackToInput
 *   The information about putting feedback into implicit input.
 *
 *
 *
 */
class NeuralNet_FeedbackShape {

//!!! ...unfinished... (2023/04/17)
  /**
   *
   */
  constructor() {

  }


  get input_height() {
    return this.feedbackToInput?.input_height;
  }

  get input_channelCount() {
    return this.feedbackToInput?.input_channelCount;
  }


  get explicit_input_height() {
    return this.feedbackToInput?.explicit_input_height;
  }

  get explicit_input_channelCount() {
    return this.feedbackToInput?.explicit_input_channelCount;
  }


  get implicit_input_height() {
    return this.feedbackToInput?.implicit_input_height;
  }

  get implicit_input_width() {
    return this.feedbackToInput?.implicit_input_width;
  }
 
  get implicit_input_channelCount() {
    return this.feedbackToInput?.implicit_input_channelCount;
  }

  get implicit_input_pixelCount() {
    return this.feedbackToInput?.implicit_input_pixelCount;
  }

  get implicit_input_valueCount() {
    return this.feedbackToInput?.implicit_input_pixelCount;
  }


  /**
   *
   */
  init(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment,
  ) {

    // 1. Ensure positive integer.
    this.explicit_input_width = explicit_input_width
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_width );

    // 2. Information for feedback to input.
    if ( !this.feedbackToInput ) {
      this.feedbackToInput = new NeuralNet_FeedbackToInput(
        explicit_input_height,
        explicit_input_channelCount,
        feedback_valueCount_per_alignment
      );

    } else {
      this.feedbackToInput.init(
        explicit_input_height,
        explicit_input_channelCount,
        feedback_valueCount_per_alignment
      );
    }

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
    input_TypedArray,
    previous_output_Int32ArrayArray
  ) {

    const funcNameInMessage = "set_implicit_input_by_previous_output";

    // 1. Check (next time) input shape.
    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount `
        + `( ${this.input_valueCount} ).`
      );

    // 2. Check (previous time) output shape.

    // Note: ( this.feedbackToInput.neuralNetCount == 2 )
    if ( previous_output_Int32ArrayArray.length
           != this.feedbackToInput.neuralNetCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray.length `
        + `( ${previous_output_Int32ArrayArray.length} ) `
        + `should be the same as `
        + `.feedbackToInput.neuralNetCount ( `
        + `${this.feedbackToInput.neuralNetCount} ).`
      );

    if ( previous_output_Int32ArrayArray[ 0 ].length
           != this.feedbackToInput.valueCount_original_per_neural_network )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 0 ].length `
        + `( ${previous_output_Int32ArrayArray[ 0 ].length} ) `
        + `should be the same as `
        + `.feedbackToInput.valueCount_original_per_neural_network `
        + `( ${this.feedbackToInput.valueCount_original_per_neural_network} ).`
      );

    if ( previous_output_Int32ArrayArray[ 1 ].length
           != this.feedbackToInput.valueCount_original_per_neural_network )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 1 ].length `
        + `( ${previous_output_Int32ArrayArray[ 1 ].length} ) `
        + `should be the same as `
        + `.feedbackToInput.valueCount_original_per_neural_network `
        + `( ${this.feedbackToInput.valueCount_original_per_neural_network} ).`
      );

//!!! ...unfinished... (2023/04/23)

    // 3. Fill previous time output (i.e. feedback) to next time input.
    let to_valueIndex = 0;

    // 3.1
    // Note: ( this.feedbackToInput.neuralNetCount == 2 )
    for ( let neuralNetIndex = 0;
      neuralNetIndex < this.feedbackToInput.neuralNetCount;
      ++neuralNetIndex ) {

      let previous_output_Int32Array
        = previous_output_Int32ArrayArray[ neuralNetIndex ];

      let area_position_leftArray
        = this.feedbackToInput.area_position_leftArrayArray[ neuralNetIndex ];

      let area_position_topArray
        = this.feedbackToInput.area_position_topArrayArray[ neuralNetIndex ];

      // 3.2
      let from_valueIndex = 0;

      // Note: ( this.feedbackToInput.alignmentCount_per_neuralNet == 2 )
      for ( let alignmentIndex = 0;
        alignmentIndex < this.feedbackToInput.alignmentCount_per_neuralNet;
        ++alignmentIndex ) {

        let from_valueIndex_y_begin = from_valueIndex;

        let area_position_left = area_position_leftArray[ alignmentIndex ];
        let area_position_top = area_position_topArray[ alignmentIndex ];

        let to_valueIndex_y_begin
          = ( ( area_position_top * this.input_width ) + area_position_left )
              * this.input_channelCount;

//!!! ...unfinished... (2023/04/25)
        let from_pixelCount_cur = 0;
        let from_valueCount_cur = 0;
        let to_pixelCount_cur = 0;
        let to_valueCount_cur = 0;

        for ( let from_y = 0;
          from_y < this.feedbackToInput.area.height_pixelCount_original;
          ++from_y ) {

          for ( let y_multiplier = 0;
            y_multiplier < this.feedbackToInput.area.height_multiplier;
            ++y_multiplier ) {

            from_valueIndex = from_valueIndex_y_begin;
            to_valueIndex = to_valueIndex_y_begin;

            for ( let from_x = 0;
              from_x < this.feedbackToInput.area.width_pixelCount_original;
              ++from_x ) {

              let from_valueIndex_x_begin = from_valueIndex;

              for ( let x_multiplier = 0;
                x_multiplier < this.feedbackToInput.area.width_multiplier;
                ++x_multiplier ) {

                from_valueIndex = from_valueIndex_x_begin;

                for ( let c = 0; c < this.feedbackToInput.input_channelCount; ++c ) {

                  let from_value = previous_output_Int32Array[ from_valueIndex ];
                  input_TypedArray[ to_valueIndex ] = from_value;

                  ++to_valueIndex;
                  ++from_valueIndex;

//!!! ...unfinished... (2023/04/24)
// if has reached .area.valueCount_expanded but not
// .area.pixelCount_expanded, should fill zero.
//
// if has reached .area.pixelCount_expanded, break early.
//
                } // c
              } // x_multiplier
            } // from_x

//!!! ...unfinished... (2023/04/23)
            to_valueIndex_y_begin += this.input_width_valueCount;
          } // y_multiplier
        } // from_y
      }
    }

  }

//!!! ...unfinished... (2023/04/18)
// Another possible method is:
// Give NeuralNetIndex (0 or 1), AlignmentIndex (0 or 1), outputUsageIndex,
// Return array index of NeuralNet output Float32Array (or Int32Array).

  /**
   * Extract explicit output values by specified alignment index and explicit
   * value index range.
   *
   *
   * @param {number[]|TypedArray} o_toValueArray
   *   The extracted explicit values will be filled into this number array (or
   * TypedArray).
   *
   * @param {Float32Array|Int32Array} fromValueArray
   *   A number array to be extracted information from. It is usually the
   * output TypedArray of a neural network. It is viewed as containing two
   * alignments output values which the neural network could personate.
   *
   *   - fromValueArray[ 0 ] to
   *     fromValueArray[ ( fromValueArray.length / 2 ) - 1 ]:
   *
   *       The (explicit and implicit) output values when the neural network
   *       personates alignment 0.
   *
   *   - fromValueArray[ fromValueArray.length / 2 ] to
   *     fromValueArray[ fromValueArray.length - 1 ]:
   *
   *       The (explicit and implicit) output values when the neural network
   *       personates alignment 1.
   *
   * @param {number} alignmentIndex
   *   An non-negative integer represents which alignment the neural network
   * wants to personate. It should be either 0 or 1.
   *
   * @param {number} explicitValueIndexBegin
   *   The explicit value index (when the neural network personates the
   * specified alignment) to begin extracting. It is a non-negative integer
   * between [ 0, ( ( fromValueArray.length / 2 ) / this.input_channelCount ) )
   * and less than explicitValueIndexEnd.
   *   - Every .input_channelCount elements is a tuple of feedback values.
   *   - The first element of the tuple is the explicit output value.
   *   - All other elements of the tuple are the implicit output values.
   *
   * @param {number} explicitValueIndexEnd
   *   The explicit value index (when the neural network personates the
   * specified alignment) to stop extracting (non-inclusive). It is a
   * non-negative integer between
   * [ 0, ( ( fromValueArray.length / 2 ) / this.input_channelCount ) ).
   * and greater than explicitValueIndexBegin.
   */
  explicitValueArray_get_by_alignmentIndex_explicitValueIndexBegin_explicitValueIndexEnd(
    o_toValueArray,
    fromValueArray, alignmentIndex,
    explicitValueIndexBegin, explicitValueIndexEnd
  ) {

    const funcNameInMessage
      = "explicitValueArray_get_by_alignmentIndex_explicitValueIndexBegin_explicitValueIndexEnd";

    // 1.
    let valueCountPerAlignment = Math.floor( fromValueArray.length / 2 );

    // 2.
    let explicitValueCountPerAlignment
      = Math.floor( valueCountPerAlignment / this.input_channelCount );

    // 3. alignment index should be either 0 or 1.
    let fromValueIndexBase;
    {
      if ( alignmentIndex === 0 )
        fromValueIndexBase = 0;
      else if ( alignmentIndex === 1 )
        fromValueIndexBase = valueCountPerAlignment;
      else
        throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
          + `alignmentIndex ( ${alignmentIndex} ) should be either 0 or 1.`
        );
    }

    // 4.
    let explicitValueIndex = explicitValueIndexBegin;

    // explicitValueIndex should be non-negative.
    if ( !( explicitValueIndexBegin >= 0 ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `explicitValueIndexBegin ( ${explicitValueIndexBegin} ) `
        + `should be greater than or equal to 0.`
      );

    // explicitValueIndex should not exceed available explicit data of the
    // alignment.
    if ( !( explicitValueIndexEnd <= explicitValueCountPerAlignment ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `explicitValueIndexEnd ( ${explicitValueIndexEnd} ) `
        + `should be less than or equal to `
        + `( ( fromValueArray.length / 2 ) / this.input_channelCount ) = `
        + `( ( ${fromValueArray.length} / 2 ) / ${this.input_channelCount} ) = `
        + `( ${explicitValueCountPerAlignment} ).`
      );

    // explicitValueIndexBegin should be less than explicitValueIndexEnd.
    if ( !( explicitValueIndexBegin < explicitValueIndexEnd ) )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `explicitValueIndexBegin ( ${explicitValueIndexBegin} ) `
        + `should be less than `
        + `explicitValueIndexEnd ( ${explicitValueIndexEnd} ).`
      );

    // 5.
    let fromValueIndex
      = fromValueIndexBase + ( explicitValueIndex * this.input_channelCount );

    // 6. Extract every specified explicit values.
    o_toValueArray.length = explicitValueIndexEnd - explicitValueIndexBegin;
    for ( let i = 0; i < o_toValueArray.length; ++i ) {
      let explicitValue = fromValueArray[ fromValueIndex ];
      o_toValueArray[ i ] = explicitValue;

      ++explicitValueIndex;
      fromValueIndex += this.input_channelCount;
    }
  }


//!!! ...unfinished... (2023/04/19)
// feedback_setter()


}
