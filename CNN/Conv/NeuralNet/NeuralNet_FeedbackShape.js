export { NeuralNet_FeedbackShape as FeedbackShape };

//!!! ...unfinished... (2023/04/16)
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
   * @param {number} input_height
   *   The (next time) input image's height.
   *
   * @param {number} input_width
   *   The (next time) input image's width.
   *
   * @param {number} input_channelCount
   *   The (next time) input image's channel count.
   *
   * @param {number} feedback_valueCount
   *   The feedback (i.e. the previous output) has how many values.
   */
  init(
    input_height, input_width, input_channelCount,
    feedback_valueCount,


  ) {

    this.input_height = input_height = NeuralNet_FeedbackShape
      .ensure_positive_integer( input_height );
    this.input_width = input_width = NeuralNet_FeedbackShape
      .ensure_positive_integer( input_width );
    this.input_channelCount = input_channelCount = NeuralNet_FeedbackShape
      .ensure_positive_integer( input_channelCount );
    this.feedback_valueCount = feedback_valueCount = NeuralNet_FeedbackShape
      .ensure_positive_integer( feedback_valueCount );

//!!! ...unfinished... (2023/04/17)

    // If (next time) input is 1d, feedback should also be 1d and prefix the
    // (next time) input.
    let width_1d = Math.ceil( feedback_valueCount / input_channelCount );

    // If (next time) input is 2d, feedback should also be 2d and at left
    // most of the (next time) input.

    // Prefer square feedback shape.
    let width_2d = Math.ceil( Math.sqrt( width_1d ) );
    let height_2d = width_2d;

    // But, if the (next time) input has not enough height to contain the
    // square shape of feedback, use rectangle shape.
    if ( height_2d > input_height ) {
      width_2d = Math.ceil( width_1d / input_height );
      height_2d = input_height;
    }

//!!! ...unfinished... (2023/04/17)
// two alignments of two neural network.
// There are 4 (= 2 * 2) feedback information.


//!!! ...unfinished... (2023/04/19)
// implicit input values are feedback values.


//!!! ...unfinished... (2023/04/20)
//     this.input_height = ;
//     this.input_width = ;
//     this.input_channelCount = ;

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
