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
 * (i.e. feedback_valueCount_per_alignment) Usually, it is half of the
 * (previous time) output channel count of a neural network because a neural
 * network generates two alignments' outputs in one time.
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
 * @member {number[]} block_position_leftArrayArray
 *   The array of array of left position in input image for every
 * feedback_to_input block.
 *
 *   - block_position_leftArrayArray[ 0 ][ 0 ]
 *       is the left position for the feedback block of neural network 0 when
 *       it personates alignment 0.
 *
 *   - block_position_leftArrayArray[ 0 ][ 1 ]
 *       is the left position for the feedback block of neural network 0 when
 *       it personates alignment 1.
 *
 *   - block_position_leftArrayArray[ 1 ][ 0 ]
 *       is the left position for the feedback block of neural network 1 when
 *       it personates alignment 0.
 *
 *   - block_position_leftArrayArray[ 1 ][ 1 ]
 *       is the left position for the feedback block of neural network 1 when
 *       it personates alignment 1.
 *
 * @member {number[]} block_position_topArrayArray
 *   The array of array of top position in input image for every feedback_to_input
 * block.
 *
 *   - block_position_topArrayArray[ 0 ][ 0 ]
 *       is the top position for the feedback block of neural network 0 when
 *       it personates alignment 0.
 *
 *   - block_position_topArrayArray[ 0 ][ 1 ]
 *       is the top position for the feedback block of neural network 0 when
 *       it personates alignment 1.
 *
 *   - block_position_topArrayArray[ 1 ][ 0 ]
 *       is the top position for the feedback block of neural network 1 when
 *       it personates alignment 0.
 *
 *   - block_position_topArrayArray[ 1 ][ 1 ]
 *       is the top position for the feedback block of neural network 1 when
 *       it personates alignment 1.
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

    const funcNameInMessage = "init";


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

    // 3. Four (or two) times the implicit input pixel count along height (if
    //    exists) and width.
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

    // 5.2 If the (next time) explicit input is 2d, the feedback (as implicit
    //     input) should also be 2d and placed at left most of the (next time)
    //     explicit input.
    } else {

      // 5.2.1 Prefer the square feedback shape because it fairly expresses
      //       the correlation along height and width.
      this.height_pixelCount_per_alignment
        = this.width_pixelCount_per_alignment
        = Math.ceil( Math.sqrt( this.pixelCount_per_alignment ) );

      // 5.2.2 But, if the (next time) explicit input has not enough height
      //       to contain the square shape of feedback, use rectangle shape.
      if ( this.height_pixelCount_per_alignment > explicit_input_height ) {

        this.height_pixelCount_per_alignment = explicit_input_height;

        this.width_pixelCount_per_alignment = Math.ceil(
          this.pixelCount_per_alignment / explicit_input_height );
      }
    }

    this.height_with_gap_pixelCount_per_alignment
      = this.height_pixelCount_per_alignment + this.block_gap_height;

    this.width_with_gap_pixelCount_per_alignment
      = this.width_pixelCount_per_alignment + this.block_gap_width;

    // 6. Determine .height_blockCount and .width_blockCount
    //
    // Try arrange feedback blocks along input height.
    {
      let explicit_input_height_with_gap
        = explicit_input_height + this.block_gap_height;

      this.height_blockCount = Math.floor(
        explicit_input_height_with_gap
          / this.height_with_gap_pixelCount_per_alignment );

      // Arranging two feedback blocks of the same one neural network in either
      // the same row or the same column.
      switch ( this.height_blockCount ) {
        // All four feedback blocks in the same row.
        case 1: break; // Do nothing.

        // Every two feedback blocks (of one neural networks) in the same row.
        case 2: break; // Do nothing.

        // Do not arrange two feedback blocks of a neural network in different
        // row or column. Force every two blocks (of one neural networks) in
        // the same row.
        case 3:
          this.height_blockCount = 2;
          break;

        // All four feedback blocks in the same column.
        case 4: break; // Do nothing.

        default:
          throw Error( `NeuralNet_FeedbackToInput.${funcNameInMessage}(): `
            + `this.height_blockCount ( ${this.height_blockCount} ) `
            + `should be either 1 or 2 or 4.`
          );
          break;
      }

      this.width_blockCount = Math.ceil(
        this.blockCount / this.height_blockCount );
    }

!!!
    // 7. The array of position ( left, top ) in input image for every
    //    feedback_to_input block.
    {
      if ( this.block_position_leftArrayArray )
        this.block_position_leftArrayArray.length = this.blockCount;
      else
        this.block_position_leftArrayArray = new Array( this.blockCount );

      if ( this.block_position_topArrayArray )
        this.block_position_topArrayArray.length = this.blockCount;
      else
        this.block_position_topArrayArray = new Array( this.blockCount );

      let i = 0;
      for ( let h = 0; h < this.height_blockCount; ++h ) {
        for ( let w = 0; w < this.width_blockCount; ++w ) {
          this.block_position_leftArrayArray[ i ]
            = ( h * this.height_blockCount ) + ( w * this.width_blockCount );
        }
      }
    }

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