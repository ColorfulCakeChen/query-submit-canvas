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
 * .input_channelCount values.)
 *
 * @member {number} input_channelCount
 *   The whole input image's channel count.
 *
 * @member {number} input_pixelCount
 *   The whole input image's pixel count.
 *
 * @member {number} input_valueCount
 *   The whole input image's value count. (Note: Every pixel has
 * .input_channelCount values.)
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
 *
 * @member {number} implicit_input_height
 *   The implicit (i.e. feedback from previous output) input image's height
 * (pixel count). It is equal to or less than input_height.
 *
 * @member {number} implicit_input_width
 *   The implicit (i.e. feedback from previous output) input image's width
 * (pixel count). It is equal to or less than input_width.
 *
 * @member {number} implicit_input_channelCount
 *   The implicit (i.e. feedback from previous output) input image's channel
 * count. It is always equal to input_channelCount.
 *
 *
 * @member {number} feedback_valueCount_per_alignment
 *   The feedback (of an alignement of a neural network) has how many values.
 * Usually, it is half of the (previous time) output channel count of a
 * neural network because a neural network generates two alignments' outputs in
 * one time.
 *
 * @member {number} feedback_valueCount_per_neural_network
 *   The feedback (of both alignements of a neural network) has how many values.
 * Usually, it is the (previous time) output channel count of a neural network.
 * It is two times of .feedback_valueCount_per_alignment because a neural
 * network generates two alignments' outputs in one time.
 *
 * @member {number} feedback_to_input_pixelCount_original_per_alignment
 *   The .feedback_valueCount_per_alignment will be viewed as how many input
 * pixels (without multiplied by .feedback_to_input_height_multiplier and
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_pixelCount_per_alignment
 *   The .feedback_valueCount_per_alignment will be viewed as how many input
 * pixels (with multiplied by .feedback_to_input_height_multiplier and
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_height_pixelCount_per_alignment
 *   The height (in pixel count) of .feedback_to_input_pixelCount_per_alignment.
 *
 * @member {number} feedback_to_input_width_pixelCount_per_alignment
 *   The width (in pixel count) of .feedback_to_input_pixelCount_per_alignment.
 *
 * @member {number} feedback_to_input_height_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input height. It is mainly used to
 * confront neural network's stage's block0's halving height.
 *
 * @member {number} feedback_to_input_width_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input width. It is mainly used to
 * confront neural network's stage's block0's halving width.
 *
 * @member {number} feedback_to_input_blockCount
 *   There are how many feedback blocks be put in the (next time) input. It is
 * always 4. Because:
 *   - There are two neural networks (in a versus pair).
 *   - There two alignments per two neural network.
 *   - So, there are 4 (= 2 * 2) feedback information blocks.
 *
 * @member {number} feedback_to_input_height_blockCount
 *   There are how manys feedback blocks along the height in the (next time)
 * input.
 *
 * @member {number} feedback_to_input_width_blockCount
 *   There are how manys feedback blocks along the width in the (next time)
 * input.
 *
 * @member {number} feedback_to_input_block_gap_height_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (without multiplied by
 * .feedback_to_input_height_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_height
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (with multiplied by
 * .feedback_to_input_height_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_width_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (without multiplied by
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_width
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (with multiplied by
 * .feedback_to_input_width_multiplier).
 *
 * @member {number[]} feedback_to_input_leftArray
 *   The array of left position of input for every feedback_to_input block.
 *
 * @member {number[]} feedback_to_input_topArray
 *   The array of top position of input for every feedback_to_input block.
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

//!!! ...unfinished... (2023/04/17)
  /**
   *
   */
  init(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment,


  ) {

    // 1. Ensure positive integer.

    this.explicit_input_height = explicit_input_height
      = NeuralNet_FeedbackShape.ensure_positive_integer(
          explicit_input_height );

    this.explicit_input_width = explicit_input_width
      = NeuralNet_FeedbackShape.ensure_positive_integer(
          explicit_input_width );

    this.explicit_input_channelCount = explicit_input_channelCount
      = NeuralNet_FeedbackShape.ensure_positive_integer(
          explicit_input_channelCount );

    this.feedback_valueCount_per_alignment = feedback_valueCount_per_alignment
      = NeuralNet_FeedbackShape.ensure_positive_integer(
          feedback_valueCount_per_alignment );

    // 2.

    // 2.1 Keep input channel count.
    //
    // Since implicit input data will be arranged along the height and width,
    // the explicit and implicit input channel count should always be the same
    // as input_channelCount.
    this.input_channelCount
      = this.implicit_input_channelCount
      = this.explicit_input_channelCount;

    // 2.2 Keep input height.
    //
    // Because input may be 1d data (e.g. text or voice), change input height
    // will make them meaningless. So, do not change input height.
    this.input_height
      = this.implicit_input_height
      = this.explicit_input_height;

    // 2.3
    this.feedback_valueCount_per_neural_network
      = this.feedback_valueCount_per_alignment * 2;

    // 2.4 feedback_to_input block information.

    // 2.4.1 There are 4 (= 2 * 2) feedback information blocks.
    //
    // There are two neural networks (in a versus pair).
    // There two alignments per two neural network.
    this.feedback_to_input_blockCount = 2 * 2;

    // 2.4.2 At least 1 gap between different feedback information blocks and
    //          explicit input.
    this.feedback_to_input_block_gap_height_original = 1;
    this.feedback_to_input_block_gap_width_original = 1;

    // 2.4.3 The array of position ( left, top ) of input for every
    //       feedback_to_input block.
    {
      if ( this.feedback_to_input_leftArray )
        this.feedback_to_input_leftArray.length
          = this.feedback_to_input_blockCount
      else
        this.feedback_to_input_leftArray
          = new Array( this.feedback_to_input_blockCount );

      if ( this.feedback_to_input_topArray )
        this.feedback_to_input_topArray.length
          = this.feedback_to_input_blockCount;
      else
        this.feedback_to_input_topArray
          = new Array( this.feedback_to_input_blockCount );
    }

    // 3. Determine implicit input pixel count.

    // 3.1 Every input_channelCount feedback values as an implicit input pixel.
    this.feedback_to_input_pixelCount_original_per_alignment = Math.ceil(
      feedback_valueCount_per_alignment / this.input_channelCount );

    // 3.2 Four (or two) times the implicit input pixel count along height (if
    //     exists) and width.
    //
    // Because neural network's stage's block0 will make the input image as
    // half or quarter (i.e. half it along height and width (by strides = 2)),
    // two or four times feedback pixel count to compensate the lost.

    // 3.2.1 If input is 1d data (e.g. text or voice), neural network's stage's
    //       block0 will not (in fact, can not) make the height half (i.e. only
    //       input width will be halven). So, double the feedback pixel count
    //       is enough.
    if ( explicit_input_height == 1 ) {
      this.feedback_to_input_height_multiplier = 1;
      this.feedback_to_input_width_multiplier = 2;

    // 3.2.2 If input is 2d data (e.g. image), use four times the feedback
    //       pixel count to confront neural network's stage's block0's making
    //       a quarter.
    } else {
      this.feedback_to_input_height_multiplier = 2;
      this.feedback_to_input_width_multiplier = 2;
    }

    this.feedback_to_input_pixelCount_per_alignment
      = this.feedback_to_input_pixelCount_original_per_alignment
          * this.feedback_to_input_height_multiplier
          * this.feedback_to_input_width_multiplier;

    // feedback_to_input blocks' gaps should also be enlarged.
    {
      this.feedback_to_input_block_gap_height
        = this.feedback_to_input_block_gap_height_original
            * this.feedback_to_input_height_multiplier;

      this.feedback_to_input_block_gap_width
        = this.feedback_to_input_block_gap_width_original
            * this.feedback_to_input_width_multiplier;
    }

    // 4. Determine feedback_to_input block shape.

    // 4.1 If the (next time) explicit input is 1d, the feedback (as implicit
    //     input) should also be 1d and prefix (i.e. at the left most of) the
    //     (next time) explicit input.
    if ( explicit_input_height == 1 ) {

//!!! ...unfinished... (2023/04/21)

      this.feedback_to_input_height_pixelCount_per_alignment = 1;
      this.feedback_to_input_width_pixelCount_per_alignment
        = this.feedback_to_input_pixelCount_per_alignment;

      // Since input has no extra height to contain more feedback_to_input
      // blocks, it is only possible to place 1 feedback_to_input block along
      // the height.
      this.feedback_to_input_height_blockCount = 1;

    // 4.2 If the (next time) explicit input is 2d, the feedback (as implicit
    //     input) should also be 2d and placed at left most of the (next time)
    //     explicit input.
    } else {

//!!! ...unfinished... (2023/04/21)

      // Prefer the square feedback shape because it fairly expresses the
      // correlation along height and width.
      this.feedback_to_input_height_pixelCount_per_alignment
        = this.feedback_to_input_width_pixelCount_per_alignment
        = Math.ceil(
            Math.sqrt( this.feedback_to_input_pixelCount_per_alignment ) );

      // 4.3 But, if the (next time) explicit input has not enough height to
      //     contain the square shape of feedback, use rectangle shape.
      if ( this.feedback_to_input_height_pixelCount_per_alignment
             > explicit_input_height ) {

        this.feedback_to_input_height_pixelCount_per_alignment
           = explicit_input_height;

        this.feedback_to_input_width_pixelCount_per_alignment = Math.ceil(
          this.feedback_to_input_pixelCount_per_alignment
            / explicit_input_height );

        // Since input has no extra height to contain more feedback_to_input
        // blocks, it is only possible to place 1 feedback_to_input block along
        // the height.
        this.feedback_to_input_height_blockCount = 1;

      } else {

//!!! ...unfinished... (2023/04/21)
// Try arrange these square along input height.

        this.feedback_to_input_height_blockCount = ???;

      }
    }

//!!! ...unfinished... (2023/04/22)
// What if can not divisible? (e.g. 4 / 3 )
    this.feedback_to_input_width_blockCount
      = this.feedback_to_input_blockCount
          / this.feedback_to_input_height_blockCount;

//!!! ...unfinished... (2023/04/21)
// two alignments of two neural network.
// There are 4 (= 2 * 2) feedback information blocks.

//!!! ...unfinished... (2023/04/22)
// Need gaps ( 1 * multiplier ) pixels between:
//   - implicit and explicit input data.
//   - feedback of different alignment and neural network.

//!!! ...unfinished... (2023/04/21)

    // 4.4
    this.implicit_input_height = height_2d;
    this.implicit_input_width = width_2d;


//!!! ...unfinished... (2023/04/21)
// this.implicit_input_height
// this.implicit_input_width
// this.input_width
// this.feedback_to_input_height_pixelCount_per_alignment
// this.feedback_to_input_width_pixelCount_per_alignment


    this.implicit_input_pixelCount_per_alignment
      = this.implicit_input_height * this.implicit_input_width;

//!!! ...unfinished... (2023/04/19)
// implicit input values are feedback values.
    this.input_width_valueCount = this.input_width * this.input_channelCount;

    this.input_pixelCount = this.input_height * this.input_width;
    this.input_valueCount = this.input_pixelCount * this.input_channelCount;

  }

//!!! ...unfinished... (2023/04/22)
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

//!!! ...unfinished... (2023/04/22)

    if ( input_TypedArray.length != this.input_valueCount )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) `
        + `should be the same as `
        + `.input_valueCount `
        + `( ${this.input_valueCount} ).`
      );

//!!! ...unfinished... (2023/04/22)
    if ( previous_output_Int32ArrayArray.length != 2 )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray.length `
        + `( ${previous_output_Int32ArrayArray.length} ) should be 2.`
      );

    if ( previous_output_Int32ArrayArray[ 0 ].length
           != this.feedback_valueCount_per_neural_network )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 0 ].length `
        + `( ${previous_output_Int32ArrayArray[ 0 ].length} ) `
        + `should be the same as `
        + `.feedback_valueCount_per_neural_network `
        + `( ${this.feedback_valueCount_per_neural_network} ).`
      );

    if ( previous_output_Int32ArrayArray[ 1 ].length
           != this.feedback_valueCount_per_neural_network )
      throw Error( `NeuralNet_FeedbackShape.${funcNameInMessage}(): `
        + `previous_output_Int32ArrayArray[ 1 ].length `
        + `( ${previous_output_Int32ArrayArray[ 1 ].length} ) `
        + `should be the same as `
        + `.feedback_valueCount_per_neural_network `
        + `( ${this.feedback_valueCount_per_neural_network} ).`
      );


//!!! ...unfinished... (2023/04/22)

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



  /**
   * 
   * @param {number} v
   *   The number to be restriced to a positive integer.
   *
   * @return {number}
   *   Return a positive integer (i.e. at least 1) which is greater than or
   * equal to v.
   */
  static ensure_positive_integer( v ) {
    return Math.ceil( Math.max( 1, v ) );
  }

}


/**
 * Information for placing feedback (i.e. previous explicit and implicit
 * output) to (implicit) input.
 *
 *
 * @member {number} feedback_to_input_pixelCount_original_per_alignment
 *   The .feedback_valueCount_per_alignment will be viewed as how many input
 * pixels (without multiplied by .feedback_to_input_height_multiplier and
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_pixelCount_per_alignment
 *   The .feedback_valueCount_per_alignment will be viewed as how many input
 * pixels (with multiplied by .feedback_to_input_height_multiplier and
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_height_pixelCount_per_alignment
 *   The height (in pixel count) of .feedback_to_input_pixelCount_per_alignment.
 *
 * @member {number} feedback_to_input_width_pixelCount_per_alignment
 *   The width (in pixel count) of .feedback_to_input_pixelCount_per_alignment.
 *
 * @member {number} feedback_to_input_height_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input height. It is mainly used to
 * confront neural network's stage's block0's halving height.
 *
 * @member {number} feedback_to_input_width_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input width. It is mainly used to
 * confront neural network's stage's block0's halving width.
 *
 * @member {number} feedback_to_input_blockCount
 *   There are how many feedback blocks be put in the (next time) input. It is
 * always 4. Because:
 *   - There are two neural networks (in a versus pair).
 *   - There two alignments per two neural network.
 *   - So, there are 4 (= 2 * 2) feedback information blocks.
 *
 * @member {number} feedback_to_input_height_blockCount
 *   There are how manys feedback blocks along the height in the (next time)
 * input.
 *
 * @member {number} feedback_to_input_width_blockCount
 *   There are how manys feedback blocks along the width in the (next time)
 * input.
 *
 * @member {number} feedback_to_input_block_gap_height_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (without multiplied by
 * .feedback_to_input_height_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_height
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (with multiplied by
 * .feedback_to_input_height_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_width_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (without multiplied by
 * .feedback_to_input_width_multiplier).
 *
 * @member {number} feedback_to_input_block_gap_width
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (with multiplied by
 * .feedback_to_input_width_multiplier).
 *
 * @member {number[]} feedback_to_input_leftArray
 *   The array of left position of input for every feedback_to_input block.
 *
 * @member {number[]} feedback_to_input_topArray
 *   The array of top position of input for every feedback_to_input block.
 *
 *
 *
 */
class NeuralNet_Feedback_to_Input {

}
