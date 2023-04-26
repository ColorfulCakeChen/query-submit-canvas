export { NeuralNet_FeedbackToInput_Area as FeedbackToInput_Area };
export { NeuralNet_FeedbackToInput as FeedbackToInput };

/**
 * Describe a cuboid in the neural network's input for filling the previous
 * next output (i.e. feedback) of an alignment of a neural network.
 *
 *
 * @member {number} from_valueCount_original
 *   The feedback (of an alignement of a neural network) has how many values.
 * (i.e. feedback_valueCount_per_alignment) Usually, it is half of the
 * (previous time) output channel count of a neural network because a neural
 * network generates two alignments' outputs in one time.
 *
 * @member {number} from_valueCount_expanded
 *   (= .from_valueCount_original * .height_multiplier * .width_multiplier)
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
 * @member {number} from_pixelCount_original
 *   The .from_valueCount_original will be viewed as how many input pixels (without
 * multiplied by .height_multiplier and .width_multiplier).
 *
 * @member {number} from_pixelCount_expanded
 *   The .from_valueCount_original will be viewed as how many input pixels (with
 * multiplied by .height_multiplier and .width_multiplier).
 *
 *
 * @member {number} height_pixelCount_original
 *   The height (in pixel count) of .from_pixelCount_original. It has not been
 * multiplied by .height_multiplier.
 *
 * @member {number} height_pixelCount_expanded
 *   The height (in pixel count) of .from_pixelCount_expanded. It has been
 * multiplied by .height_multiplier.
 *
 * @member {number} height_with_gap_pixelCount_expanded
 *   ( .height_pixelCount_expanded + .gap_height_pixelCount_expanded ). It has
 * been multiplied by .height_multiplier.
 *
 *
 * @member {number} width_pixelCount_original
 *   The width (in pixel count) of .from_pixelCount_original. It has not been
 * multiplied by .width_multiplier.
 *
 * @member {number} width_pixelCount_expanded
 *   The width (in pixel count) of .from_pixelCount_expanded. It has been
 * multiplied by .width_multiplier.
 *
 * @member {number} width_with_gap_pixelCount_expanded
 *   ( .width_pixelCount_expanded + .gap_width_pixelCount_expanded ). It has
 * been multiplied by .width_multiplier.
 *
 *
 * @member {number} gap_height_pixelCount_original
 *   The gap (for distinguishing from different feedback information areas and
 * explicit input) along the height (without multiplied by .height_multiplier).
 *
 * @member {number} gap_height_pixelCount_expanded
 *   The gap (for distinguishing from different feedback information areas and
 * explicit input) along the height (with multiplied by .height_multiplier).
 *
 *
 * @member {number} gap_width_pixelCount_original
 *   The gap (for distinguishing from different feedback information areas and
 * explicit input) along the width (without multiplied by .width_multiplier).
 *
 * @member {number} gap_width_pixelCount_expanded
 *   The gap (for distinguishing from different feedback information areas and
 * explicit input) along the width (with multiplied by .width_multiplier).
 *
 *
 */
class NeuralNet_FeedbackToInput_Area {

  from_valueCount_original;
  from_valueCount_expanded;

  height_multiplier;
  width_multiplier

  from_pixelCount_original;
  from_pixelCount_expanded;

  height_pixelCount_original;
  height_pixelCount_expanded;
  height_with_gap_pixelCount_expanded;

  width_pixelCount_original;
  width_pixelCount_expanded;
  width_with_gap_pixelCount_expanded;

  // At least 1 gap between different feedback information areas and
  // explicit input.
  gap_height_pixelCount_original = 1;
  gap_width_pixelCount_original = 1;

  get gap_height_pixelCount_expanded() {
    return this.gap_height_pixelCount_original * this.height_multiplier;
  }

  get gap_width_pixelCount_expanded() {
    return this.gap_width_pixelCount_original * this.width_multiplier;
  }

}


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
 * @member {number} implicit_input_width
 *   The implicit (i.e. feedback from previous output) input image's width
 * (pixel count).
 *
 * @member {number} implicit_input_channelCount
 *   The implicit (i.e. feedback from previous output) input image's channel
 * count. It is always equal to input_channelCount.
 *
 * @member {number} implicit_input_pixelCount
 *   The implicit (i.e. feedback from previous output) input image's pixel
 * count (= implicit_input_height * implicit_input_width). It is greater than
 * or equal to necessary of feedback.
 *
 * @member {number} implicit_input_valueCount
 *   The implicit (i.e. feedback from previous output) input image's value
 * count (= implicit_input_pixelCount * input_channelCount).
 *
 *
 * @member {number} valueCount_original_per_neural_network
 *   The feedback (of both alignements of a neural network) has how many
 * values. Usually, it is the (previous time) output channel count of a neural
 * network. It is two times of .area.from_valueCount_original because a
 * neural network generates two alignments' outputs in one time.
 *
 *
 * @member {number} neuralNetCount
 *   There are how many neural networks in a versus. It is always 2.
 *
 * @member {number} alignmentCount_per_neuralNet
 *   There are how many alignments in a versus. Every neural network will
 * generates output of all alignments. It is always 2.
 *
 * @member {number} areaCount
 *   There are how many feedback areas be put in the (next time) input. It is
 * always 4. (Every alignment has exactly one area.) Because:
 *   - There are two neural networks (in a versus pair).
 *   - There are two alignments per neural network.
 *   - So, there are 4 (= 2 * 2) feedback information areas.
 *
 * @member {number} height_areaCount
 *   There are how many feedback areas along the height in the (next time)
 * input.
 *
 * @member {number} width_areaCount
 *   There are how many feedback areas along the width in the (next time)
 * input.
 *
 * @member {number[][]} area_position_leftArrayArray
 *   The array of array of left position in input image for every
 * feedback_to_input area.
 *
 *   - area_position_leftArrayArray[ 0 ][ 0 ]
 *       is the left position for the feedback area of neural network 0 when
 *       it personates alignment 0.
 *
 *   - area_position_leftArrayArray[ 0 ][ 1 ]
 *       is the left position for the feedback area of neural network 0 when
 *       it personates alignment 1.
 *
 *   - area_position_leftArrayArray[ 1 ][ 0 ]
 *       is the left position for the feedback area of neural network 1 when
 *       it personates alignment 0.
 *
 *   - area_position_leftArrayArray[ 1 ][ 1 ]
 *       is the left position for the feedback area of neural network 1 when
 *       it personates alignment 1.
 *
 * @member {number[][]} area_position_topArrayArray
 *   The array of array of top position in input image for every
 * feedback_to_input area.
 *
 *   - area_position_topArrayArray[ 0 ][ 0 ]
 *       is the top position for the feedback area of neural network 0 when
 *       it personates alignment 0.
 *
 *   - area_position_topArrayArray[ 0 ][ 1 ]
 *       is the top position for the feedback area of neural network 0 when
 *       it personates alignment 1.
 *
 *   - area_position_topArrayArray[ 1 ][ 0 ]
 *       is the top position for the feedback area of neural network 1 when
 *       it personates alignment 0.
 *
 *   - area_position_topArrayArray[ 1 ][ 1 ]
 *       is the top position for the feedback area of neural network 1 when
 *       it personates alignment 1.
 *
 *
 */
class NeuralNet_FeedbackToInput {

  /**
   *
   */
  constructor() {
  }

  /**
   *
   */
  init(
    explicit_input_height,
    explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {

    //const funcNameInMessage = "init";

    let area;
    {
      if ( !this.area )
        this.area = new NeuralNet_FeedbackToInput_Area();

      area = this.area;
    }

    // 1. Ensure positive integer.

    this.explicit_input_height = explicit_input_height
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_height );

    this.explicit_input_channelCount = explicit_input_channelCount
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          explicit_input_channelCount );

    area.from_valueCount_original = feedback_valueCount_per_alignment
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

    // 2.3 There are 4 (= 2 * 2) feedback information areas.
    //
    // There are two neural networks (in a versus pair).
    // There two alignments per two neural network.
    this.neuralNetCount = 2;
    this.alignmentCount_per_neuralNet = 2;
    this.areaCount = this.neuralNetCount * this.alignmentCount_per_neuralNet;

    // 2.4
    this.valueCount_original_per_neural_network
      = area.from_valueCount_original * this.alignmentCount_per_neuralNet;

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
      area.height_multiplier = 1;
      area.width_multiplier = 2;

    // 3.2 If input is 2d data (e.g. image), use four times the feedback
    //     pixel count to confront neural network's stage's block0's making
    //     a quarter.
    } else {
      area.height_multiplier = 2;
      area.width_multiplier = 2;
    }

    area.from_valueCount_expanded = area.from_valueCount_original
      * area.height_multiplier * area.width_multiplier;

    // 4. Determine implicit input pixel count.

    // Every input_channelCount feedback values as an implicit input pixel.
    area.from_pixelCount_original = Math.ceil(
      area.from_valueCount_original / this.input_channelCount );

    area.from_pixelCount_expanded = area.from_pixelCount_original
      * area.height_multiplier * area.width_multiplier;

    // 5. Determine feedback_to_input area shape.

    // 5.1 If the (next time) explicit input is 1d, the feedback (as implicit
    //     input) should also be 1d and prefix (i.e. at the left most of) the
    //     (next time) explicit input.
    if ( explicit_input_height == 1 ) {

      area.height_pixelCount_original = 1;
      area.width_pixelCount_original = area.from_pixelCount_original;

      area.height_pixelCount_expanded = 1;
      area.width_pixelCount_expanded = area.from_pixelCount_expanded;

    // 5.2 If the (next time) explicit input is 2d, the feedback (as implicit
    //     input) should also be 2d and placed at left most of the (next time)
    //     explicit input.
    } else {

      // 5.2.1 Prefer the square feedback shape because it fairly expresses
      //       the correlation along height and width.
      {
        area.height_pixelCount_original
          = area.width_pixelCount_original
          = Math.ceil( Math.sqrt( area.from_pixelCount_original ) );

        area.height_pixelCount_expanded
          = area.height_pixelCount_original * area.height_multiplier;
      }

      // 5.2.2 But, if the (next time) explicit input has not enough height
      //       to contain the square shape of feedback, use rectangle shape.
      if ( area.height_pixelCount_expanded > explicit_input_height ) {

        // Ensure .area.height_pixelCount_expanded
        //   - contains factor .area.height_multiplier (i.e. 2) (i.e. is
        //       divisible by .area.height_multiplier), and
        //   - does not exceed explicit_input_height
        //
        // Note: Because explicit_input_height is at least 2 here, the
        //       .area.height_pixelCount_expanded will be also at
        //       least 2 (i.e. not 0 or 1).
        {
          area.height_pixelCount_original
            = Math.floor( explicit_input_height / area.height_multiplier );

          area.height_pixelCount_expanded
            = area.height_pixelCount_original * area.height_multiplier;
        }

        {
          area.width_pixelCount_original = Math.ceil(
            area.from_pixelCount_original / area.height_pixelCount_original );
        }
      }

      area.width_pixelCount_expanded
        = area.width_pixelCount_original * area.width_multiplier;
    }

    area.height_with_gap_pixelCount_expanded
      = area.height_pixelCount_expanded + area.gap_height_pixelCount_expanded;

    area.width_with_gap_pixelCount_expanded
      = area.width_pixelCount_expanded + area.gap_width_pixelCount_expanded;

    // 6. Determine .height_areaCount and .width_areaCount
    //
    // Try arrange feedback areas along input height.
    {
      let explicit_input_height_with_gap
        = explicit_input_height + area.gap_height_pixelCount_expanded;

      this.height_areaCount = Math.floor(
        explicit_input_height_with_gap
          / area.height_with_gap_pixelCount_expanded );

      // 6.1 Arranging two feedback areas of the same one neural network in
      //     either the same row or the same column.
      {
        // 6.1.1 All four feedback areas in the same column.
        if ( this.height_areaCount >= this.areaCount ) { // >= 4
          this.height_areaCount = this.areaCount;

        // 6.1.2 Every two feedback areas (of one neural networks) in the
        //       same row.
        } else if ( this.height_areaCount >= this.neuralNetCount ) { // >= 2

          // Do not arrange two feedback areas of a neural network in
          // different row or column (e.g. ( .height_areaCount == 3 ) or
          // ( .width_areaCount == 3 ) ). Force every two areas (of one neural
          // networks) in the same row.
          this.height_areaCount = this.neuralNetCount;

        // 6.1.3 All four feedback areas in the same row.
        } else { // >= 1
          this.height_areaCount = 1;
        }
      }

      // 6.2
      this.width_areaCount = Math.ceil(
        this.areaCount / this.height_areaCount );
    }

    // 7.
    this.implicit_input_width
      = this.width_areaCount * area.width_with_gap_pixelCount_expanded;

    this.implicit_input_pixelCount
      = this.implicit_input_height * this.implicit_input_width;

    this.implicit_input_valueCount
      = this.implicit_input_pixelCount * this.input_channelCount;

    // 8. Determine every feedback_to_input area's ( left, top ) position
    //    in input image.
    {
      NeuralNet_FeedbackToInput.area_position_create.call( this );
      NeuralNet_FeedbackToInput.area_position_fill.call( this );
    }

  }

  /**
   * @param {NeuralNet_FeedbackToInput} this
   * @param {number} this.neuralNetCount
   * @param {number} this.alignmentCount_per_neuralNet
   * @param {number[][]} this.area_position_leftArrayArray
   * @param {number[][]} this.area_position_topArrayArray
   */
  static area_position_create() {
    // 1.
    // 1.1
    if ( this.area_position_leftArrayArray )
      this.area_position_leftArrayArray.length = this.neuralNetCount;
    else
      this.area_position_leftArrayArray = new Array( this.neuralNetCount );

    // 1.2
    if ( this.area_position_topArrayArray )
      this.area_position_topArrayArray.length = this.neuralNetCount;
    else
      this.area_position_topArrayArray = new Array( this.neuralNetCount );

    // 2.
    for ( let i = 0; i < this.neuralNetCount; ++i ) {

      // 2.1
      if ( this.area_position_leftArrayArray[ i ] )
        this.area_position_leftArrayArray[ i ].length
          = this.alignmentCount_per_neuralNet;
      else
        this.area_position_leftArrayArray[ i ]
          = new Array( this.alignmentCount_per_neuralNet );

      // 2.2
      if ( this.area_position_topArrayArray[ i ] )
        this.area_position_topArrayArray[ i ].length
          = this.alignmentCount_per_neuralNet;
      else
        this.area_position_topArrayArray[ i ]
          = new Array( this.alignmentCount_per_neuralNet );
    }
  }

  /**
   * @param {NeuralNet_FeedbackToInput} this
   * @param {number} this.area
   * @param {number} this.areaCount
   * @param {number} this.height_areaCount
   * @param {number} this.width_areaCount
   * @param {number[][]} this.area_position_leftArrayArray
   * @param {number[][]} this.area_position_topArrayArray
   */
  static area_position_fill() {
    const area = this.area;

    // 1. Create all ( left, top ) coordinates.
    let leftArray = new Array( this.areaCount );
    let topArray = new Array( this.areaCount );
    {
      let i = 0;
      for (
        let height_area_index = 0;
        height_area_index < this.height_areaCount;
        ++height_area_index ) {

        for (
          let width_area_index = 0;
          width_area_index < this.width_areaCount;
          ++width_area_index ) {

          leftArray[ i ] = ( width_area_index
            * area.width_with_gap_pixelCount_expanded );

          topArray[ i ] = ( height_area_index
            * area.height_with_gap_pixelCount_expanded );

          ++i;
        }
      }
    }

    // 2. Distribute all ( left, top ) coordinates to neural networks'
    //    alignments.
    {
      let i = 0;
      for ( let n = 0; n < this.neuralNetCount; ++n ) {

        let area_position_leftArray
          = this.area_position_leftArrayArray[ n ];

        let area_position_topArray
          = this.area_position_topArrayArray[ n ];

        for ( let a = 0; a < this.alignmentCount_per_neuralNet; ++a ) {
          area_position_leftArray[ a ] = leftArray[ i ];
          area_position_topArray[ a ] = topArray[ i ];
  
          ++i;
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
