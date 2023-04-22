export { NeuralNet_FeedbackToInput as FeedbackToInput };

/**
 * Information for placing feedback (i.e. previous explicit and implicit
 * output) to (implicit) input.
 *
 *
 * @member {number} input_height
 *   The whole input image's height (pixel count).
 *
 * @member {number} input_channelCount
 *   The whole input image's channel count.
 *
 *
 * @member {number} explicit_input_height
 *   The explicit (i.e. user visible) input image's height (pixel count). It is
 * equal to or less than input_height.
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
 * @member {number} implicit_input_channelCount
 *   The implicit (i.e. feedback from previous output) input image's channel
 * count. It is always equal to input_channelCount.
 *
 *
 * @member {number} valueCount_per_alignment
 *   The feedback (of an alignement of a neural network) has how many values.
 * Usually, it is half of the (previous time) output channel count of a
 * neural network because a neural network generates two alignments' outputs in
 * one time.
 *
 * @member {number} valueCount_per_neural_network
 *   The feedback (of both alignements of a neural network) has how many values.
 * Usually, it is the (previous time) output channel count of a neural network.
 * It is two times of .valueCount_per_alignment because a neural
 * network generates two alignments' outputs in one time.
 *
 *
 * @member {number} height_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input height. It is mainly used to
 * confront neural network's stage's block0's halving height.
 *
 * @member {number} width_multiplier
 *   When converting feedback values to implicit input pixels, how many times
 * should be replicated along the implicit input width. It is mainly used to
 * confront neural network's stage's block0's halving width.
 *
 *
 * @member {number} pixelCount_original_per_alignment
 *   The .valueCount_per_alignment will be viewed as how many input pixels
 * (without multiplied by .height_multiplier and .width_multiplier).
 *
 * @member {number} pixelCount_per_alignment
 *   The .valueCount_per_alignment will be viewed as how many input
 * pixels (with multiplied by .height_multiplier and .width_multiplier).
 *
 * @member {number} height_pixelCount_per_alignment
 *   The height (in pixel count) of .pixelCount_per_alignment.
 *
 * @member {number} height_with_gap_pixelCount_per_alignment
 *   ( .height_pixelCount_per_alignment + .block_gap_height )
 *
 * @member {number} width_pixelCount_per_alignment
 *   The width (in pixel count) of .pixelCount_per_alignment.
 *
 * @member {number} width_with_gap_pixelCount_per_alignment
 *   ( .width_pixelCount_per_alignment + .block_gap_width )
 *
 *
 * @member {number} blockCount
 *   There are how many feedback blocks be put in the (next time) input. It is
 * always 4. (Every alignment has exactly one block.) Because:
 *   - There are two neural networks (in a versus pair).
 *   - There two alignments per two neural network.
 *   - So, there are 4 (= 2 * 2) feedback information blocks.
 *
 * @member {number} height_blockCount
 *   There are how manys feedback blocks along the height in the (next time)
 * input.
 *
 * @member {number} width_blockCount
 *   There are how manys feedback blocks along the width in the (next time)
 * input.
 *
 * @member {number} block_gap_height_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (without multiplied by .height_multiplier).
 *
 * @member {number} block_gap_height
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the height (with multiplied by .height_multiplier).
 *
 * @member {number} block_gap_width_original
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (without multiplied by .width_multiplier).
 *
 * @member {number} block_gap_width
 *   The gap (for distinguishing from different feedback information blocks and
 * explicit input) along the width (with multiplied by .width_multiplier).
 *
 * @member {number[]} position_leftArray
 *   The array of left position of input for every feedback_to_input block.
 *
 * @member {number[]} position_topArray
 *   The array of top position of input for every feedback_to_input block.
 *
 *
 *
 */
class NeuralNet_FeedbackToInput {

  /**
   *
   */
  constructor(
    explicit_input_height,
    explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {
    this.init(
      explicit_input_height,
      explicit_input_channelCount,
      feedback_valueCount_per_alignment );
  }

  /**
   *
   */
  init(
    explicit_input_height,
    explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {

    // 1. Ensure positive integer.

    this.explicit_input_height = explicit_input_height
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_height );

    this.explicit_input_channelCount = explicit_input_channelCount
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_channelCount );

    this.valueCount_per_alignment = feedback_valueCount_per_alignment
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
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
    this.valueCount_per_neural_network
      = this.valueCount_per_alignment * 2;

    // 2.4 feedback_to_input block information.

    // 2.4.1 There are 4 (= 2 * 2) feedback information blocks.
    //
    // There are two neural networks (in a versus pair).
    // There two alignments per two neural network.
    this.blockCount = 2 * 2;

    // 2.4.2 At least 1 gap between different feedback information blocks and
    //          explicit input.
    this.block_gap_height_original = 1;
    this.block_gap_width_original = 1;

    // 2.4.3 The array of position ( left, top ) of input for every
    //       feedback_to_input block.
    {
      if ( this.position_leftArray )
        this.position_leftArray.length = this.blockCount
      else
        this.position_leftArray = new Array( this.blockCount );

      if ( this.position_topArray )
        this.position_topArray.length = this.blockCount;
      else
        this.position_topArray = new Array( this.blockCount );
    }

    // 3. Four (or two) times the implicit input pixel count along height (if
    //     exists) and width.
    //
    // Because neural network's stage's block0 will make the input image as
    // half or quarter (i.e. half it along height and width (by strides = 2)),
    // two or four times feedback pixel count to compensate the lost.

    // 3.1 If input is 1d data (e.g. text or voice), neural network's stage's
    //     block0 will not (in fact, can not) make the height half (i.e. only
    //     input width will be halven). So, double the feedback pixel count
    //     is enough.
    if ( explicit_input_height == 1 ) {
      this.height_multiplier = 1;
      this.width_multiplier = 2;

    // 3.2 If input is 2d data (e.g. image), use four times the feedback
    //     pixel count to confront neural network's stage's block0's making
    //     a quarter.
    } else {
      this.height_multiplier = 2;
      this.width_multiplier = 2;
    }

    // 4. Determine implicit input pixel count.

    // Every input_channelCount feedback values as an implicit input pixel.
    this.pixelCount_original_per_alignment = Math.ceil(
      this.valueCount_per_alignment / this.input_channelCount );

    this.pixelCount_per_alignment
      = this.pixelCount_original_per_alignment
          * this.height_multiplier * this.width_multiplier;

    // 5. Determine feedback_to_input block shape.

    // 5.0 feedback_to_input blocks' gaps should also be enlarged.
    {
      this.block_gap_height
        = this.block_gap_height_original * this.height_multiplier;

      this.block_gap_width
        = this.block_gap_width_original * this.width_multiplier;
    }

    // 5.1 If the (next time) explicit input is 1d, the feedback (as implicit
    //     input) should also be 1d and prefix (i.e. at the left most of) the
    //     (next time) explicit input.
    if ( explicit_input_height == 1 ) {

      this.height_pixelCount_per_alignment = 1;
      this.width_pixelCount_per_alignment = this.pixelCount_per_alignment;

      // Since input has no extra height to contain more feedback_to_input
      // blocks, it is only possible to place 1 feedback_to_input block along
      // the height.
      this.height_blockCount = 1;

    // 5.2 If the (next time) explicit input is 2d, the feedback (as implicit
    //     input) should also be 2d and placed at left most of the (next time)
    //     explicit input.
    } else {

      // Prefer the square feedback shape because it fairly expresses the
      // correlation along height and width.
      this.height_pixelCount_per_alignment
        = this.width_pixelCount_per_alignment
        = Math.ceil( Math.sqrt( this.pixelCount_per_alignment ) );

      // 5.3 But, if the (next time) explicit input has not enough height to
      //     contain the square shape of feedback, use rectangle shape.
      if ( this.height_pixelCount_per_alignment > explicit_input_height ) {

        this.height_pixelCount_per_alignment = explicit_input_height;

        this.width_pixelCount_per_alignment = Math.ceil(
          this.pixelCount_per_alignment / explicit_input_height );
  
        // Since input has no extra height to contain more feedback_to_input
        // blocks, it is only possible to place 1 feedback_to_input block along
        // the height.
        this.height_blockCount = 1;
      }
    }

    this.height_with_gap_pixelCount_per_alignment
      = this.height_pixelCount_per_alignment + this.block_gap_height;

    this.width_with_gap_pixelCount_per_alignment
      = this.width_pixelCount_per_alignment + this.block_gap_width;


    // 6.
    {


    //!!! ...unfinished... (2023/04/21)
    // Try arrange these square along input height.
    
    //!!! ...unfinished... (2023/04/22)
    // this.height_pixelCount_per_alignment
    // this.width_pixelCount_per_alignment
    //
    // this.height_with_gap_pixelCount_per_alignment
    // this.width_with_gap_pixelCount_per_alignment
    
            this.height_blockCount = ???;
    }
 

//!!! ...unfinished... (2023/04/22)
// What if can not divisible? (e.g. 4 / 3 )
    this.width_blockCount
      = this.blockCount / this.height_blockCount;


//!!! ...unfinished... (2023/04/22)
// Need gaps ( 1 * multiplier ) pixels between:
//   - implicit and explicit input data.
//   - feedback of different alignment and neural network.


  }



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
