export { NeuralNet_FeedbackToInput_from as FeedbackToInput_from };
export { NeuralNet_FeedbackToInput_Area as FeedbackToInput_Area };
export { NeuralNet_FeedbackToInput as FeedbackToInput };

/**
 * Describe value count and (viewed as) pixel count of a neural network's
 * previous output (i.e. feedback).
 *
 *
 * @member {number} from_valueCount_original
 *   The feedback (i.e. the neural network's previous time output) has how
 * many values.
 *
 * @member {number} from_valueCount_expanded
 *   (= .from_valueCount_original * .height_multiplier * .width_multiplier)
 *
 *
 * @member {number} from_pixelCount_original
 *   The .from_valueCount_original will be viewed as how many input pixels
 * (without multiplied by .height_multiplier and .width_multiplier).
 *
 * @member {number} from_pixelCount_expanded
 *   The .from_valueCount_original will be viewed as how many input pixels
 * (with multiplied by .height_multiplier and .width_multiplier).
 *
 */
class NeuralNet_FeedbackToInput_from {

  from_valueCount_original;
  from_valueCount_expanded;

  from_pixelCount_original;
  from_pixelCount_expanded;

  /** @override */
  toString() {
    let str =
        `from_valueCount_original=${this.from_valueCount_original}, `
      + `from_valueCount_expanded=${this.from_valueCount_expanded}, `
      + `from_pixelCount_original=${this.from_pixelCount_original}, `
      + `from_pixelCount_expanded=${this.from_pixelCount_expanded}`
      ;
    return str;
  }

}


/**
 * Describe a cuboid in the neural network's input for filling the previous
 * output (i.e. feedback) to the next time input.
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
 * @member {number} to_pixelCount_original
 *   (= .height_pixelCount_original * .width_pixelCount_original). It should be
 * greater than or equal to .from_pixelCount_original.
 *
 * @member {number} to_pixelCount_expanded
 *   (= .height_pixelCount_expanded * .width_pixelCount_expanded). It should be
 * greater than or equal to .from_pixelCount_expanded. This is the pixel count
 * on the implicit input area.
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
class NeuralNet_FeedbackToInput_Area extends NeuralNet_FeedbackToInput_from {

  height_multiplier;
  width_multiplier;

  to_pixelCount_original;
  to_pixelCount_expanded;

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

  /** @override */
  toString() {
    let str = `${super.toString()}, `
      + `height_multiplier=${this.height_multiplier}, `
      + `width_multiplier=${this.width_multiplier}, `

      + `to_pixelCount_original=${this.to_pixelCount_original}, `
      + `to_pixelCount_expanded=${this.to_pixelCount_expanded}, `

      + `height_pixelCount_original=${this.height_pixelCount_original}, `
      + `height_pixelCount_expanded=${this.height_pixelCount_expanded}, `
      + `height_with_gap_pixelCount_expanded=${this.height_with_gap_pixelCount_expanded}, `

      + `width_pixelCount_original=${this.width_pixelCount_original}, `
      + `width_pixelCount_expanded=${this.width_pixelCount_expanded}, `
      + `width_with_gap_pixelCount_expanded=${this.width_with_gap_pixelCount_expanded}, `

      + `gap_height_pixelCount_original=${this.gap_height_pixelCount_original}, `
      + `gap_height_pixelCount_expanded=${this.gap_height_pixelCount_expanded}, `

      + `gap_width_pixelCount_original=${this.gap_width_pixelCount_original}, `
      + `gap_width_pixelCount_expanded=${this.gap_width_pixelCount_expanded}`
      ;
    return str;
  }

  /**
   * Log the .feedbackShape as table.
   *
   * @param {string} headerPrefix
   *   It will be used as the header of table log.
   */
  TableLog_FeedbackToInput_Area( headerPrefix ) {
    console.groupCollapsed( headerPrefix );

!!! ...unfinished... (2025/08/01)
    const str = ``

        `from_valueCount_original=${this.from_valueCount_original}, `
      + `from_valueCount_expanded=${this.from_valueCount_expanded}, `
      + `from_pixelCount_original=${this.from_pixelCount_original}, `
      + `from_pixelCount_expanded=${this.from_pixelCount_expanded}`


      + `multiplier ( height, width ) = ( `
        + `${this.height_multiplier}, ${this.width_multiplier} ),\n`

      + `to_pixelCount ( original, expanded ) = ( `
        +`${this.to_pixelCount_original}, ${this.to_pixelCount_expanded} ),\n`

      + `height_pixelCount ( original, expanded, expanded_with_gap ) = ( `
        + `${this.height_pixelCount_original}, `
        + `${this.height_pixelCount_expanded}, `
        + `${this.height_with_gap_pixelCount_expanded} ),\n`

      + `width_pixelCount ( original, expanded, expanded_with_gap ) = ( `
        + `${this.width_pixelCount_original}, `
        + `${this.width_pixelCount_expanded}, `
        + `${this.width_with_gap_pixelCount_expanded} ),\n`

      + `gap_height_pixelCount_original=${this.gap_height_pixelCount_original}, `
      + `gap_height_pixelCount_expanded=${this.gap_height_pixelCount_expanded}, `

      + `gap_width_pixelCount_original=${this.gap_width_pixelCount_original}, `
      + `gap_width_pixelCount_expanded=${this.gap_width_pixelCount_expanded}`


!!!      
      + `input ( height, width, channelCount ) = ( `
        + `${this.input_height}, `
        + `${this.input_width}, `
        + `${this.input_channelCount} ), `
      + `( pixelCount, valueCount, width_valueCount ) = ( `
        + `${this.input_pixelCount}, `
        + `${this.input_valueCount},`
        + `${this.input_width_valueCount} ),\n`

      + `implicit_input ( height, width, channelCount ) = ( `
        + `${this.implicit_input_height}, `
        + `${this.implicit_input_width}, `
        + `${this.implicit_input_channelCount} ), `
      + `( pixelCount, valueCount ) = ( `
        + `${this.implicit_input_pixelCount}, `
        + `${this.implicit_input_valueCount} ),\n`

      + `explicit_input ( height, width, channelCount ) = ( `
        + `${this.explicit_input_height}, `
        + `${this.explicit_input_width}, `
        + `${this.explicit_input_channelCount} ), `
      + `( pixelCount, valueCount ) = ( `
        + `${this.explicit_input_pixelCount}, `
        + `${this.explicit_input_valueCount} ),\n`

!!!
      ;

    console.log( str );

    console.groupEnd();
  }
}


/**
 * Information for placing feedback (i.e. previous (explicit and implicit)
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
 * @member {number} areaCount
 *   There are how many filling areas be put in the (next time) input for a
 * neural network. It is always 2.
 *   - One for alignment mark of the neural network.
 *   - The other for feedback (i.e. previous time output) of the neural
 *       network.
 *
 * @member {number} height_areaCount
 *   There are how many feedback areas along the height in the (next time)
 * input.
 *
 * @member {number} width_areaCount
 *   There are how many feedback areas along the width in the (next time)
 * input.
 *
 *
 * @member {number} height_with_internal_gap_pixelCount_expanded
 *   The pixel count along height of all areas (including gap between them).
 *
 * @member {number} width_with_internal_gap_pixelCount_expanded
 *   The pixel count along width of all areas (including gap between them).
 *
 *
 * @member {number[]} area_position_leftArray
 *   The array of left position in input image for every feedback_to_input
 * area. ( area_position_leftArray[ alignment_or_feedback ] )
 *
 *   - area_position_leftArray[ 0 ]
 *       is the left position for the alignment mark area of neural network.
 *
 *   - area_position_leftArray[ 1 ]
 *       is the left position for the feedback area of neural network.
 *
 * @member {number[]} area_position_topArray
 *   The array of top position in input image for every feedback_to_input
 * area. ( area_position_topArray[ alignment_or_feedback ] )
 *
 *   - area_position_topArray[ 0 ]
 *       is the top position for the alignment mark area of neural network.
 *
 *   - area_position_topArray[ 1 ]
 *       is the top position for the feedback area of neural network.
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
   * @param {number} feedback_valueCount
   *   The feedback (i.e. the neural network's previous time output) has how
   * many values.
   */
  init(
    explicit_input_height,
    explicit_input_channelCount,
    feedback_valueCount
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

    area.from_valueCount_original = feedback_valueCount
      = NeuralNet_FeedbackToInput.ensure_positive_integer(
          feedback_valueCount );

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

    // 2.3 There are 2 filling areas (alignment mark and feedback) per neural
    //     network.
    this.areaCount = 2;

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

    // 4.1 Every input_channelCount feedback values as an implicit input pixel.
    area.from_pixelCount_original = Math.ceil(
      area.from_valueCount_original / this.input_channelCount );

    area.from_pixelCount_expanded = area.from_pixelCount_original
      * area.height_multiplier * area.width_multiplier;

    // 5. Determine feedback_to_input area shape.

    // 5.1
    {
      // 5.1.1 Prefer the square feedback shape because it fairly expresses
      //       the correlation along height and width.
      {
        area.height_pixelCount_original
          = area.width_pixelCount_original
          = Math.ceil( Math.sqrt( area.from_pixelCount_original ) );

        area.height_pixelCount_expanded
          = area.height_pixelCount_original * area.height_multiplier;
      }

      // 5.1.2 But, if the (next time) explicit input has not enough height
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

    // 5.2
    area.height_with_gap_pixelCount_expanded
      = area.height_pixelCount_expanded + area.gap_height_pixelCount_expanded;

    area.width_with_gap_pixelCount_expanded
      = area.width_pixelCount_expanded + area.gap_width_pixelCount_expanded;

    // 5.3
    area.to_pixelCount_original
      = area.height_pixelCount_original * area.width_pixelCount_original;

    area.to_pixelCount_expanded
      = area.height_pixelCount_expanded * area.width_pixelCount_expanded;

    // 6. Determine .height_areaCount and .width_areaCount
    //
    // Try arrange feedback areas along input height.
    {
      let explicit_input_height_with_gap
        = explicit_input_height + area.gap_height_pixelCount_expanded;

      this.height_areaCount = Math.floor(
        explicit_input_height_with_gap
          / area.height_with_gap_pixelCount_expanded );

      // 6.1 Arranging two filling areas of the same one neural network in
      //     either the same row or the same column.
      {
        // 6.1.1 All two feedback areas in the same column.
        if ( this.height_areaCount >= this.areaCount ) { // >= 2
          this.height_areaCount = this.areaCount;

        // 6.1.2 All four feedback areas in the same row.
        } else { // >= 1
          this.height_areaCount = 1;
        }
      }

      // 6.2
      this.width_areaCount = Math.ceil(
        this.areaCount / this.height_areaCount );
    }

    this.height_with_internal_gap_pixelCount_expanded
      = ( this.height_areaCount * area.height_with_gap_pixelCount_expanded )
          - area.gap_height_pixelCount_expanded; // bottom area needs not gap.

    this.width_with_internal_gap_pixelCount_expanded
      = ( this.width_areaCount * area.width_with_gap_pixelCount_expanded )
          - area.gap_width_pixelCount_expanded; // right area needs not gap.

    // 7.

    // Note: .implicit_input_width is different from
    //       .width_with_internal_gap_pixelCount_expanded because
    //       right-most area still needs gap to distinguishing from explicit
    //       input pixels.
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
   * @param {number} this.areaCount
   * @param {number[]} this.area_position_leftArray
   * @param {number[]} this.area_position_topArray
   */
  static area_position_create() {

    // 1.
    if ( this.area_position_leftArray )
      this.area_position_leftArray.length = this.areaCount;
    else
      this.area_position_leftArray = new Array( this.areaCount );

    // 2.
    if ( this.area_position_topArray )
      this.area_position_topArray.length = this.areaCount;
    else
      this.area_position_topArray = new Array( this.areaCount );
  }

  /**
   * @param {NeuralNet_FeedbackToInput} this
   * @param {NeuralNet_FeedbackToInput_Area} this.area
   * @param {number} this.height_areaCount
   * @param {number} this.width_areaCount
   * @param {number[]} this.area_position_leftArray
   * @param {number[]} this.area_position_topArray
   */
  static area_position_fill() {
    const area = this.area;

    const area_width_with_gap_pixelCount_expanded
      = area.width_with_gap_pixelCount_expanded;

    const area_height_with_gap_pixelCount_expanded
      = area.height_with_gap_pixelCount_expanded;

    const area_position_leftArray = this.area_position_leftArray;
    const area_position_topArray = this.area_position_topArray;

    // Create all ( left, top ) coordinates.
    let i = 0;
    for ( let height_area_index = 0;
      height_area_index < this.height_areaCount;
      ++height_area_index ) {

      for ( let width_area_index = 0;
        width_area_index < this.width_areaCount;
        ++width_area_index ) {

        area_position_leftArray[ i ] = ( width_area_index
          * area_width_with_gap_pixelCount_expanded );

        area_position_topArray[ i ] = ( height_area_index
          * area_height_with_gap_pixelCount_expanded );

        ++i;
      }
    }
  }


  /** @override */
  toString() {
    let str =
        `explicit_input_height=${this.explicit_input_height}, `
      + `explicit_input_channelCount=${this.explicit_input_channelCount}, `

      + `implicit_input_height=${this.implicit_input_height}, `
      + `implicit_input_width=${this.implicit_input_width}, `
      + `implicit_input_channelCount=${this.implicit_input_channelCount}, `

      + `implicit_input_pixelCount=${this.implicit_input_pixelCount}, `
      + `implicit_input_valueCount=${this.implicit_input_valueCount}, `

      + `input_height=${this.input_height}, `
      + `input_channelCount=${this.input_channelCount}, `

      + `areaCount=${this.areaCount}, `
      + `height_areaCount=${this.height_areaCount}, `
      + `width_areaCount=${this.width_areaCount}, `

      + `height_with_internal_gap_pixelCount_expanded=`
        + `${this.height_with_internal_gap_pixelCount_expanded}, `
      + `width_with_internal_gap_pixelCount_expanded=`
        + `${this.width_with_internal_gap_pixelCount_expanded}, `

      + `area={ ${this.area} }, `

      + `area_position_leftArray=[ ${this.area_position_leftArray} ], `
      + `area_position_topArray=[ ${this.area_position_topArray} ]`
      ;
    return str;
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
