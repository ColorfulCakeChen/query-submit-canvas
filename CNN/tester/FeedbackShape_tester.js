export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/** */
class TestCase {

  /** */
  constructor( testCaseId, feedbackShape,
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {
    this.testCaseId = testCaseId;
    this.feedbackShape = feedbackShape;

    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;
    this.feedback_valueCount_per_alignment = feedback_valueCount_per_alignment;

    this.to_valueArray = new Array();

    this.from_output_valueArrayArray = new Array();
    this.from_output_valueArrayArray[ 0 ] = new Array();
    this.from_output_valueArrayArray[ 1 ] = new Array();

    //!!! (2023/04/28 Remarked) Use Uint32Array instead.
    //this.nextInputArray = new Array();
  }

  /** */
  test() {
    const funcNameInMessage = "test";

    const feedbackShape = this.feedbackShape;
    feedbackShape.init(
      this.explicit_input_height,
      this.explicit_input_width,
      this.explicit_input_channelCount,
      this.feedback_valueCount_per_alignment
    );

    this.from_value_offset_per_neuralNet = Math.ceil(
      Math.log10( feedbackShape.perNeuralNet.from_valueCount_expanded ) );

    // Because neuralNetIndex is 0 or 1, multiplying 10 can always exceed
    // any from_value (i.e. any feedback value).
    this.explcit_input_value_base_positive
      = this.from_value_offset_per_neuralNet * 10;

    // from_output_valueArray
    {
      for ( let neuralNetIndex = 0;
        neuralNetIndex < feedbackShape.neuralNetCount; ++neuralNetIndex ) {

        let from_output_valueArray
          = this.from_output_valueArrayArray[ neuralNetIndex ];
      
        from_output_valueArray.length
          = feedbackShape.perNeuralNet.from_valueCount_original;

        const area_from_valueCount_original
          = feedbackShape.area.from_valueCount_original;

        const from_value_base_positive
          = this.from_value_offset_per_neuralNet * neuralNetIndex;

        // all positive integers (for alignment 0)
        for ( let i = 0; i < area_from_valueCount_original; ++i ) {
          from_output_valueArray[ i ] = i + 1 + from_value_base_positive;
        }

        // all negative integers (for alignment 1)
        const twiceLength = 2 * area_from_valueCount_original;
        for ( let i = area_from_valueCount_original; i < twiceLength; ++i ) {
          from_output_valueArray[ i ]
            = ( area_from_valueCount_original - i ) - 1 - from_value_base_positive;
        }

        // In normal, it should not have this part.
        for ( let i = twiceLength; i < from_output_valueArray.length; ++i ) {
          from_output_valueArray[ i ] = 0; // zero.
        }
      }
    }

    this.test_properties();
    this.test_valueArray_get();
    this.test_set_implicit_input();
  }

  /** */
  test_properties() {
    const funcNameInMessage = "testProperties";

    // explicit_input: height, width, channelCount, pixelCount, valueCount
    const explicit_input_height
      = ( this.explicit_input_height > 0 ) ? this.explicit_input_height : 1;
    this.assert_FeedbackShape( "explicit_input_height", explicit_input_height );

    const explicit_input_width
      = ( this.explicit_input_width > 0 ) ? this.explicit_input_width : 1;
    this.assert_FeedbackShape( "explicit_input_width", explicit_input_width );

    const explicit_input_channelCount
      = ( this.explicit_input_channelCount > 0 ) ? this.explicit_input_channelCount : 1;
    this.assert_FeedbackShape( "explicit_input_channelCount", explicit_input_channelCount );

    const explicit_input_pixelCount
      = explicit_input_height * explicit_input_width;
    this.assert_FeedbackShape( "explicit_input_pixelCount", explicit_input_pixelCount );

    const explicit_input_valueCount
      = explicit_input_pixelCount * explicit_input_channelCount;
    this.assert_FeedbackShape( "explicit_input_valueCount", explicit_input_valueCount );

    //
    const neuralNetCount = 2;
    this.assert_FeedbackShape( "neuralNetCount", neuralNetCount );

    const alignmentCount_per_neuralNet = 2;
    this.assert_FeedbackShape( "alignmentCount_per_neuralNet",
      alignmentCount_per_neuralNet );

    const areaCount = neuralNetCount * alignmentCount_per_neuralNet;
    this.assert_FeedbackShape( "areaCount", areaCount );

    // multiplier
    let area_height_multiplier = 2;
    let area_width_multiplier = 2;
    {
      if ( explicit_input_height == 1 ) {
        area_height_multiplier = 1;
      }

      this.assert_Area( "height_multiplier", area_height_multiplier );
      this.assert_Area( "width_multiplier", area_width_multiplier );
    }

    // gap
    const area_gap_height_pixelCount_original = 1;
    this.assert_Area( "gap_height_pixelCount_original",
      area_gap_height_pixelCount_original );

    const area_gap_width_pixelCount_original = 1;
    this.assert_Area( "gap_width_pixelCount_original",
      area_gap_width_pixelCount_original );
  
    const area_gap_height_pixelCount_expanded
      = area_gap_height_pixelCount_original * area_height_multiplier;
    this.assert_Area( "gap_height_pixelCount_expanded",
      area_gap_height_pixelCount_expanded );
  
    const area_gap_width_pixelCount_expanded
      = area_gap_width_pixelCount_original * area_width_multiplier;
    this.assert_Area( "gap_width_pixelCount_expanded",
      area_gap_width_pixelCount_expanded );
  
    // from_valueCount_original
    const area_from_valueCount_original
      = ( this.feedback_valueCount_per_alignment > 0 )
          ? this.feedback_valueCount_per_alignment : 1;
    this.assert_Area( "from_valueCount_original", area_from_valueCount_original );

    const perNeuralNet_from_valueCount_original
      = area_from_valueCount_original * alignmentCount_per_neuralNet;
    this.assert_perNeuralNet( "from_valueCount_original",
      perNeuralNet_from_valueCount_original );

    const allNeuralNets_from_valueCount_original
      = perNeuralNet_from_valueCount_original * neuralNetCount;
    this.assert_allNeuralNets( "from_valueCount_original",
      allNeuralNets_from_valueCount_original );

    // from_valueCount_expanded
    const area_from_valueCount_expanded = area_from_valueCount_original
      * area_height_multiplier * area_width_multiplier;
    this.assert_Area( "from_valueCount_expanded", area_from_valueCount_expanded );

    const perNeuralNet_from_valueCount_expanded
      = area_from_valueCount_expanded * alignmentCount_per_neuralNet;
    this.assert_perNeuralNet( "from_valueCount_expanded",
      perNeuralNet_from_valueCount_expanded );

    const allNeuralNets_from_valueCount_expanded
      = perNeuralNet_from_valueCount_expanded * neuralNetCount;
    this.assert_allNeuralNets( "from_valueCount_expanded",
      allNeuralNets_from_valueCount_expanded );

    // from_pixelCount_original
    const area_from_pixelCount_original = Math.ceil(
      area_from_valueCount_original / explicit_input_channelCount );
    this.assert_Area( "from_pixelCount_original", area_from_pixelCount_original );

    const perNeuralNet_from_pixelCount_original
      = area_from_pixelCount_original * alignmentCount_per_neuralNet;
    this.assert_perNeuralNet( "from_pixelCount_original",
      perNeuralNet_from_pixelCount_original );

    const allNeuralNets_from_pixelCount_original
      = perNeuralNet_from_pixelCount_original * neuralNetCount;
    this.assert_allNeuralNets( "from_pixelCount_original",
      allNeuralNets_from_pixelCount_original );

    // from_pixelCount_expanded
    const area_from_pixelCount_expanded = area_from_pixelCount_original
      * area_height_multiplier * area_width_multiplier;
    this.assert_Area( "from_pixelCount_expanded", area_from_pixelCount_expanded );

    const perNeuralNet_from_pixelCount_expanded
      = area_from_pixelCount_expanded * alignmentCount_per_neuralNet;
    this.assert_perNeuralNet( "from_pixelCount_expanded",
      perNeuralNet_from_pixelCount_expanded );

    const allNeuralNets_from_pixelCount_expanded
      = perNeuralNet_from_pixelCount_expanded * neuralNetCount;
    this.assert_allNeuralNets( "from_pixelCount_expanded",
      allNeuralNets_from_pixelCount_expanded );

    // to height and width
    let area_height_pixelCount_original;
    let area_height_pixelCount_expanded;
    let area_width_pixelCount_original;
    let area_width_pixelCount_expanded;
    {
      {
        area_height_pixelCount_original
          = Math.ceil( Math.sqrt( area_from_pixelCount_original ) );

        area_height_pixelCount_expanded
          = area_height_pixelCount_original * area_height_multiplier;

        if ( area_height_pixelCount_expanded <= explicit_input_height ) { // square shape.
          area_width_pixelCount_original = area_height_pixelCount_original

        } else { // rectangle shape.
          area_height_pixelCount_original = Math.floor(
            explicit_input_height / area_height_multiplier );

          area_height_pixelCount_expanded
            = area_height_pixelCount_original * area_height_multiplier;

          area_width_pixelCount_original = Math.ceil(
            area_from_pixelCount_original / area_height_pixelCount_original );
        }
      }

      area_width_pixelCount_expanded
        = area_width_pixelCount_original * area_width_multiplier;

      this.assert_Area( "height_pixelCount_original", area_height_pixelCount_original );
      this.assert_Area( "height_pixelCount_expanded", area_height_pixelCount_expanded );
      this.assert_Area( "height_pixelCount_expanded",
        area_height_pixelCount_original * area_height_multiplier );

      this.assert_Area_GE( "height_pixelCount_expanded", 1 );
      this.assert_Area_LE( "height_pixelCount_expanded", explicit_input_height );

      this.assert_Area( "width_pixelCount_original", area_width_pixelCount_original );
      this.assert_Area( "width_pixelCount_expanded", area_width_pixelCount_expanded );
      this.assert_Area( "width_pixelCount_expanded",
        area_width_pixelCount_original * area_width_multiplier );

      this.assert_Area_GE( "width_pixelCount_expanded", 1 );
    }

    // to height_with_gap and width_with_gap
    const area_height_with_gap_pixelCount_expanded
      = area_height_pixelCount_expanded + area_gap_height_pixelCount_expanded;
    this.assert_Area( "height_with_gap_pixelCount_expanded",
      area_height_with_gap_pixelCount_expanded );

    const area_width_with_gap_pixelCount_expanded
      = area_width_pixelCount_expanded + area_gap_width_pixelCount_expanded;
    this.assert_Area( "width_with_gap_pixelCount_expanded",
      area_width_with_gap_pixelCount_expanded );

    // to_pixel
    const area_to_pixelCount_original
      = area_height_pixelCount_original * area_width_pixelCount_original;

    const area_to_pixelCount_expanded
      = area_height_pixelCount_expanded * area_width_pixelCount_expanded;
    {
      this.assert_Area( "to_pixelCount_original", area_to_pixelCount_original );
      this.assert_Area( "to_pixelCount_expanded", area_to_pixelCount_expanded );

      this.assert_Area_GE( "to_pixelCount_original", 1 );
      this.assert_Area_GE( "to_pixelCount_expanded", 1 );

      // target area should be greater than or equal to source.
      this.assert_Area_LE( "from_pixelCount_original", area_to_pixelCount_original );
      this.assert_Area_LE( "from_pixelCount_expanded", area_to_pixelCount_expanded );
    }

    // height_areaCount and width_areaCount
    let height_areaCount = Math.floor(
      ( explicit_input_height + area_gap_height_pixelCount_expanded ) 
        / area_height_with_gap_pixelCount_expanded );
    {
      if ( height_areaCount >= areaCount )
        height_areaCount = areaCount;
      else if ( height_areaCount >= neuralNetCount )
        height_areaCount = neuralNetCount;
      else
        height_areaCount = 1;

      this.assert_FeedbackShape( "height_areaCount", height_areaCount );
    }

    const width_areaCount = Math.ceil( areaCount / height_areaCount );
    this.assert_FeedbackShape( "width_areaCount", width_areaCount );

    this.assert_FeedbackShape_GE( "height_areaCount", 1 );
    this.assert_FeedbackShape_GE( "width_areaCount", 1 );

    this.assert_FeedbackShape_LE( "height_areaCount", areaCount );
    this.assert_FeedbackShape_LE( "width_areaCount", areaCount );

    // ( height_areaCount * width_areaCount ) should be areaCount.
    this.assert_FeedbackShape( "areaCount", height_areaCount * width_areaCount );

    // height_with_internal_gap and width_with_internal_gap
    const height_with_internal_gap_pixelCount_expanded
      = ( height_areaCount * area_height_with_gap_pixelCount_expanded )
          - area_gap_height_pixelCount_expanded;
    this.assert_FeedbackShape( "height_with_internal_gap_pixelCount_expanded",
      height_with_internal_gap_pixelCount_expanded );
    this.assert_FeedbackShape_LE( "height_with_internal_gap_pixelCount_expanded",
      explicit_input_height );

    const width_with_internal_gap_pixelCount_expanded
      = ( width_areaCount * area_width_with_gap_pixelCount_expanded )
          - area_gap_width_pixelCount_expanded;
    this.assert_FeedbackShape( "width_with_internal_gap_pixelCount_expanded",
      width_with_internal_gap_pixelCount_expanded );


    // implicit_input: height, width, channelCount, pixelCount, valueCount
    const implicit_input_height = explicit_input_height;
    this.assert_FeedbackShape( "implicit_input_height", implicit_input_height );
    this.assert_FeedbackShape_LE( "height_with_internal_gap_pixelCount_expanded",
      implicit_input_height );

    const implicit_input_width
      = width_areaCount * area_width_with_gap_pixelCount_expanded;
    this.assert_FeedbackShape( "implicit_input_width", implicit_input_width );
    this.assert_FeedbackShape_LE( "width_with_internal_gap_pixelCount_expanded",
      implicit_input_width );

    const implicit_input_channelCount = explicit_input_channelCount;
    this.assert_FeedbackShape( "implicit_input_channelCount",
      implicit_input_channelCount );

    const implicit_input_pixelCount
      = implicit_input_height * implicit_input_width;
    this.assert_FeedbackShape( "implicit_input_pixelCount",
      implicit_input_pixelCount );
    this.assert_FeedbackShape_GE( "implicit_input_pixelCount",
      allNeuralNets_from_pixelCount_expanded );

    const implicit_input_valueCount
      = implicit_input_pixelCount * implicit_input_channelCount;
    this.assert_FeedbackShape( "implicit_input_valueCount",
      implicit_input_valueCount );
    this.assert_FeedbackShape_GE( "implicit_input_valueCount",
      allNeuralNets_from_valueCount_expanded );

    // input: height, width, width_valueCount, channelCount, pixelCount, valueCount
    const input_height = explicit_input_height;
    this.assert_FeedbackShape( "input_height", implicit_input_height );

    const input_width = implicit_input_width + explicit_input_width;
    this.assert_FeedbackShape( "input_width", input_width );

    const input_channelCount = explicit_input_channelCount;
    this.assert_FeedbackShape( "input_channelCount", input_channelCount );

    const input_width_valueCount = input_width * input_channelCount;
    this.assert_FeedbackShape( "input_width_valueCount", input_width_valueCount );

    const input_pixelCount = input_height * input_width;
    this.assert_FeedbackShape( "input_pixelCount", input_pixelCount );

    const input_valueCount = input_pixelCount * input_channelCount;
    this.assert_FeedbackShape( "input_valueCount", input_valueCount );

    // area_position
    {
      const heightUnit = area_height_with_gap_pixelCount_expanded;
      const widthUnit = area_width_with_gap_pixelCount_expanded;

      this.assert_area_position_leftArrayArray( 0, 0, 0 );
      this.assert_area_position_topArrayArray(  0, 0, 0 );

      if ( height_areaCount == 1 ) {
        this.assert_area_position_leftArrayArray( 0, 1, widthUnit );
        this.assert_area_position_topArrayArray(  0, 1, 0 );

        this.assert_area_position_leftArrayArray( 1, 0, widthUnit * 2 );
        this.assert_area_position_topArrayArray(  1, 0, 0 );

        this.assert_area_position_leftArrayArray( 1, 1, widthUnit * 3 );
        this.assert_area_position_topArrayArray(  1, 1, 0 );

      } else if ( height_areaCount == 2 ) {
        this.assert_area_position_leftArrayArray( 0, 1, widthUnit );
        this.assert_area_position_topArrayArray(  0, 1, 0 );

        this.assert_area_position_leftArrayArray( 1, 0, 0 );
        this.assert_area_position_topArrayArray(  1, 0, heightUnit );

        this.assert_area_position_leftArrayArray( 1, 1, widthUnit );
        this.assert_area_position_topArrayArray(  1, 1, heightUnit );

      } else if ( height_areaCount == 4 ) {
        this.assert_area_position_leftArrayArray( 0, 1, 0 );
        this.assert_area_position_topArrayArray(  0, 1, heightUnit );

        this.assert_area_position_leftArrayArray( 1, 0, 0 );
        this.assert_area_position_topArrayArray(  1, 0, heightUnit * 2 );

        this.assert_area_position_leftArrayArray( 1, 1, 0 );
        this.assert_area_position_topArrayArray(  1, 1, heightUnit * 3 );

      } else {
        throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
          + `height_areaCount ( ${height_areaCount} ) `
          + `should be either 1 or 2 or 4. `
          + `{ ${this} }.`
        );
      }
    }
  }

  /** */
  test_valueArray_get() {
    const funcNameInMessage = "test_valueArray_get";

    const feedbackShape = this.feedbackShape;
    const input_channelCount = feedbackShape.input_channelCount;

    const area_from_pixelCount_original
      = feedbackShape.area.from_pixelCount_original;

    const neuralNetIndex = 0;
    const from_output_valueArray
      = this.from_output_valueArrayArray[ neuralNetIndex ];
    const from_value_base_positive
      = this.from_value_offset_per_neuralNet * neuralNetIndex;

    const tryTestCount = 10;

    for ( let alignmentIndex = 0;
      alignmentIndex < feedbackShape.alignmentCount_per_neuralNet;
      ++alignmentIndex ) {

      for ( let testCount = 0; testCount < tryTestCount; ++testCount ) {

        let from_output_pixelIndexBegin = RandTools.getRandomIntInclusive(
          0, area_from_pixelCount_original - 1 );

        //!!! (2023/04/28 Remarked) Too many to test.
        // for ( let from_output_pixelIndexBegin = 0;
        //   from_output_pixelIndexBegin < area_from_pixelCount_original;
        //   ++from_output_pixelIndexBegin )
        {
          const pixelCountMax
            = area_from_pixelCount_original - from_output_pixelIndexBegin;

          let from_output_pixelCount
            = RandTools.getRandomIntInclusive( 0, pixelCountMax );

          //!!! (2023/04/28 Remarked) Too mant to test.
          // for ( let from_output_pixelCount = 0;
          //   from_output_pixelCount < pixelCountMax;
          //   ++from_output_pixelCount )
          {
            feedbackShape.valueArray_get_from_output_valueArray_1st_channel(
              this.to_valueArray, from_output_valueArray,
              alignmentIndex, from_output_pixelIndexBegin, from_output_pixelCount
            );

            if ( this.to_valueArray.length != from_output_pixelCount )
              throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                + `to_valueArray.length ( ${this.to_valueArray.length} ) `
                + `should be the same as `
                + `from_output_pixelCount ( ${from_output_pixelCount} ). `
                + `{ ${this} }.`
              );

            if ( alignmentIndex == 0 ) {
              // should be all positive continuous integers.
              let expectedValue
                = ( from_output_pixelIndexBegin * input_channelCount ) + 1
                    + from_value_base_positive;

              for ( let i = 0; i < this.to_valueArray.length; ++i ) {
                if ( this.to_valueArray[ i ] != expectedValue )
                  throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                    + `to_valueArray[ ${i} ]=${this.to_valueArray[ i ]} `
                    + `should be ( ${expectedValue} ). `
                    + `{ ${this} }.`
                  );
                expectedValue += input_channelCount;
              }

            } else if ( alignmentIndex == 1 ) {
              // should be all negative continuous integers.
              let expectedValue
                = - ( from_output_pixelIndexBegin * input_channelCount ) - 1
                    - from_value_base_positive;

              for ( let i = 0; i < this.to_valueArray.length; ++i ) {
                if ( this.to_valueArray[ i ] != expectedValue )
                  throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                    + `to_valueArray[ ${i} ]=${this.to_valueArray[ i ]} `
                    + `should be ( ${expectedValue} ). `
                    + `{ ${this} }.`
                  );
                expectedValue -= input_channelCount;
              }

            } else {
              throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                + `alignmentIndex ( ${alignmentIndex} ) `
                + `should be either 0 or 1. `
                + `{ ${this} }.`
              );
            }
          }
        }
      }
    }
  }

  /** */
  test_set_implicit_input() {
    const funcNameInMessage = "test_set_implicit_input";

    const feedbackShape = this.feedbackShape;
    const input_channelCount = feedbackShape.input_channelCount;

    if (   !this.nextInputArray
        || ( this.nextInputArray.length != feedbackShape.input_valueCount ) )
      this.nextInputArray = new Uint32Array( feedbackShape.input_valueCount );
    else
      this.nextInputArray.fill( 0 );

    this.nextInputArray_explicit_fill();

    // fill implicit input.
    feedbackShape.set_implicit_input_by_previous_output(
      this.nextInputArray, this.from_output_valueArrayArray );

    this.nextInputArray_explicit_check();
    this.nextInputArray_implicit_check();
  }

  /** */
  nextInputArray_explicit_fill() {
    const to_inputArray = this.nextInputArray;

    const feedbackShape = this.feedbackShape;
    const input_height = feedbackShape.input_height;
    const input_width = feedbackShape.input_width;
    const input_channelCount = feedbackShape.input_channelCount;

    const input_width_valueCount = feedbackShape.input_width_valueCount;
    const implicit_input_width = feedbackShape.implicit_input_width;
    const explicit_input_width = feedbackShape.explicit_input_width;

    const explcit_input_value_base_positive
      = this.explcit_input_value_base_positive;

    // explicit input is at the right of the implicit input.
    let explicit_to_valueIndex_y_begin
      = ( implicit_input_width * input_channelCount );

    let to_value = explcit_input_value_base_positive;
    let to_valueIndex;
    for ( let y = 0; y < input_height; ++y ) {
      to_valueIndex = explicit_to_valueIndex_y_begin;

      for ( let x = 0; x < explicit_input_width; ++x ) {
        for ( let c = 0; c < input_channelCount; ++c ) {
          to_inputArray[ to_valueIndex ] = to_value;

          ++to_value;
          ++to_valueIndex;
        }
      }

      explicit_to_valueIndex_y_begin += input_width_valueCount;
    }
  }

  /** */
  nextInputArray_explicit_check() {
    const funcNameInMessage = "nextInputArray_explicit_check";

    const to_inputArray = this.nextInputArray;

    const feedbackShape = this.feedbackShape;
    const input_height = feedbackShape.input_height;
    const input_width = feedbackShape.input_width;
    const input_channelCount = feedbackShape.input_channelCount;

    const input_width_valueCount = feedbackShape.input_width_valueCount;
    const implicit_input_width = feedbackShape.implicit_input_width;
    const explicit_input_width = feedbackShape.explicit_input_width;

    const explcit_input_value_base_positive
      = this.explcit_input_value_base_positive;

    // explicit input is at the right of the implicit input.
    let explicit_to_valueIndex_y_begin
      = ( implicit_input_width * input_channelCount );

    let to_value = explcit_input_value_base_positive;
    let to_valueIndex;
    for ( let y = 0; y < input_height; ++y ) {
      to_valueIndex = explicit_to_valueIndex_y_begin;

      for ( let x = 0; x < explicit_input_width; ++x ) {
        for ( let c = 0; c < input_channelCount; ++c ) {
          if ( to_inputArray[ to_valueIndex ] != to_value )
            throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
              + `to_inputArray[ ${to_valueIndex} ]=`
              + `${to_inputArray[ to_valueIndex ]} `
              + `should be ( ${to_value} ). `
              + `{ ${this} }.`
            );

          ++to_value;
          ++to_valueIndex;
        }
      }

      explicit_to_valueIndex_y_begin += input_width_valueCount;
    }
  }

  /** */
  nextInputArray_implicit_check() {
    const funcNameInMessage = "nextInputArray_implicit_check";

    const to_inputArray = this.nextInputArray;

    const feedbackShape = this.feedbackShape;
    const input_height = feedbackShape.input_height;
    const input_width = feedbackShape.input_width;
    const input_channelCount = feedbackShape.input_channelCount;

    const input_width_valueCount = feedbackShape.input_width_valueCount;
    const implicit_input_width = feedbackShape.implicit_input_width;
    //const explicit_input_width = feedbackShape.explicit_input_width;

    const area_from_valueCount_original
      = feedbackShape.area.from_valueCount_original;


    const area_height_pixelCount_original
      = feedbackShape.area.height_pixelCount_original;

    const area_width_pixelCount_original
      = feedbackShape.area.width_pixelCount_original;

    const area_width_valueCount_original
      = area_width_pixelCount_original * input_channelCount;


    const area_width_pixelCount_expanded
      = feedbackShape.area.width_pixelCount_expanded;

    const area_width_valueCount_expanded
      = area_width_pixelCount_expanded * input_channelCount;


    const area_height_multiplier = feedbackShape.area.height_multiplier;
    const area_width_multiplier = feedbackShape.area.width_multiplier;

    const neuralNetCount = feedbackShape.neuralNetCount;
    const alignmentCount_per_neuralNet = feedbackShape.alignmentCount_per_neuralNet;

//!!! ...unfinished... (2023/04/28) check implicit input

    for ( let neuralNetIndex = 0;
      neuralNetIndex < neuralNetCount; ++neuralNetIndex ) {

      const from_output_valueArray
        = this.from_output_valueArrayArray[ neuralNetIndex ];

      const area_position_leftArray
        = feedbackShape.area_position_leftArrayArray[ neuralNetIndex ];

      const area_position_topArray
        = feedbackShape.area_position_topArrayArray[ neuralNetIndex ];

      for ( let alignmentIndex = 0;
        alignmentIndex < alignmentCount_per_neuralNet; ++alignmentIndex ) {

        const from_valueIndex_base
          = ( area_from_valueCount_original * alignmentIndex );

        const area_position_left = area_position_leftArray[ alignmentIndex ];
        const area_position_top = area_position_topArray[ alignmentIndex ];

//!!!
        const to_valueIndex_base
          = ( ( area_position_top * input_width ) + area_position_left )
              * input_channelCount;

        for ( let y = 0; y < area_height_pixelCount_original; ++y ) {
          const from_valueIndex_base_y = ( y * area_width_valueCount_original );

          for ( let y_multiplier = 0;
            y_multiplier < area_height_multiplier; ++y_multiplier ) {

            const to_valueIndex_base_y
              = ( ( y * area_height_multiplier ) + y_multiplier )
                  * area_width_valueCount_expanded;

            for ( let x = 0; x < area_width_pixelCount_original; ++x ) {
              const from_valueIndex = from_valueIndex_base
                + from_valueIndex_base_y + ( x * input_channelCount );

              for ( let x_multiplier = 0;
                x_multiplier < area_width_multiplier; ++x_multiplier ) {

                const to_valueIndex_base_x
                  = ( ( x * area_width_multiplier ) + x_multiplier )
                      * input_channelCount;

                const to_valueIndex = to_valueIndex_base_y + to_valueIndex_base_x;
    
                if ( from_valueIndex > area_from_valueCount_original ) {
                  if ( to_inputArray[ to_valueIndex ] != 0 )
                    throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                      + `to_inputArray[ ${to_valueIndex} ]=`
                      + `${to_inputArray[ to_valueIndex ]} `
                      + `should be ( 0 ). `
                      + `{ ${this} }.`
                    );

                } else {
                  if ( to_inputArray[ to_valueIndex ]
                         != from_output_valueArray[ from_valueIndex ] )
                    throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
                      + `to_inputArray[ ${to_valueIndex} ]=`
                      + `${to_inputArray[ to_valueIndex ]} `
                      + `should be the same as`
                      + `from_output_valueArray[ ${from_valueIndex} ]=`
                      + `${from_output_valueArray[ from_valueIndex ]}. `
                      + `{ ${this} }.`
                    );
                }

//!!! ...unfinished... (2023/04/28)
                  
              }
            }
          }
        }

      }
    }

//!!! ...unfinished... (2023/04/28)
// const from_value_base_positive
//   = this.from_value_offset_per_neuralNet * neuralNetIndex;

    // const area_from_pixelCount_original
    //   = feedbackShape.area.from_pixelCount_original;


  }

  assert_Area_LE( propertyName, value ) {
    this.assert_LE( "test", this.feedbackShape, "area", propertyName, value );
  }

  assert_Area_GE( propertyName, value ) {
    this.assert_GE( "test", this.feedbackShape, "area", propertyName, value );
  }

  assert_Area( propertyName, value ) {
    this.assert( "test", this.feedbackShape, "area", propertyName, value );
  }

  assert_perNeuralNet( propertyName, value ) {
    this.assert( "test", this.feedbackShape, "perNeuralNet", propertyName, value );
  }

  assert_allNeuralNets( propertyName, value ) {
    this.assert( "test", this.feedbackShape, "allNeuralNets", propertyName, value );
  }

  assert_area_position_leftArrayArray( arrayIndex0, arrayIndex1, value ) {
    this.assert( "test", this.feedbackShape.area_position_leftArrayArray,
      arrayIndex0, arrayIndex1, value );
  }

  assert_area_position_topArrayArray( arrayIndex0, arrayIndex1, value ) {
    this.assert( "test", this.feedbackShape.area_position_topArrayArray,
      arrayIndex0, arrayIndex1, value );
  }

  assert_FeedbackShape_LE( propertyName, value ) {
    this.assert_LE( "test", this, "feedbackShape", propertyName, value );
  }

  assert_FeedbackShape_GE( propertyName, value ) {
    this.assert_GE( "test", this, "feedbackShape", propertyName, value );
  }

  assert_FeedbackShape( propertyName, value ) {
    this.assert( "test", this, "feedbackShape", propertyName, value );
  }

  assert_LE( funcNameInMessage, parentObject, objectName, propertyName, value ) {
    let lhs = parentObject[ objectName ][ propertyName ];
    if ( !( lhs <= value ) )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `${objectName}.${propertyName} ( ${lhs} ) `
        + `should be less than or equal to ( ${value} ). `
        + `{ ${this} }.`
      );
  }

  assert_GE( funcNameInMessage, parentObject, objectName, propertyName, value ) {
    let lhs = parentObject[ objectName ][ propertyName ];
    if ( !( lhs >= value ) )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `${objectName}.${propertyName} ( ${lhs} ) `
        + `should be greater than or equal to ( ${value} ). `
        + `{ ${this} }.`
      );
  }

  assert( funcNameInMessage, parentObject, objectName, propertyName, value ) {
    let lhs = parentObject[ objectName ][ propertyName ];
    if ( lhs != value )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `${objectName}.${propertyName} ( ${lhs} ) should be ( ${value} ). `
        + `{ ${this} }.`
      );
  }

  toString() {
    let str = `testCaseId=${this.testCaseId}, `
      + `explicit_input_height=${this.explicit_input_height}, `
      + `explicit_input_width=${this.explicit_input_width}, `
      + `explicit_input_channelCount=${this.explicit_input_channelCount}, `
      + `feedback_valueCount_per_alignment=${this.feedback_valueCount_per_alignment}`
      ;
    return str;
  }
}

/** */
class MinMax {
  constructor( min, max ) {
    this.min = min;
    this.max = max;
    this.length = ( this.max - this.min + 1 );
  }
}

/** */
class TestCases {

  /** */
  constructor() {
    this.feedbackShape = new NeuralNet.FeedbackShape();

    this.explicit_input_height_MinMax = new MinMax( 0, 100 );
    this.explicit_input_width_MinMax = new MinMax( 0, 100 );
    this.explicit_input_channelCount_MinMax = new MinMax( 0, 10 );
    this.feedback_valueCount_per_alignment_MinMax = new MinMax( 0, 100 );

    //!!! (2023/04/26 Remarked)
    // this.explicit_input_height_MinMax = new MinMax( 0, 10 );
    // this.explicit_input_width_MinMax = new MinMax( 0, 10 );
    // this.explicit_input_channelCount_MinMax = new MinMax( 0, 10 );
    // this.feedback_valueCount_per_alignment_MinMax = new MinMax( 0, 10 );

    this.length = this.explicit_input_height_MinMax.length
      * this.explicit_input_width_MinMax.length
      * this.explicit_input_channelCount_MinMax.length
      * this.feedback_valueCount_per_alignment_MinMax.length;
  }

  * testCase_generator() {
    let testCaseId = 0;
    for ( let h = this.explicit_input_height_MinMax.min;
      h <= this.explicit_input_height_MinMax.max; ++h ) {

      for ( let w = this.explicit_input_width_MinMax.min;
        w <= this.explicit_input_width_MinMax.max; ++w ) {

        for ( let c = this.explicit_input_channelCount_MinMax.min;
          c <= this.explicit_input_channelCount_MinMax.max; ++c ) {

          for ( let v = this.feedback_valueCount_per_alignment_MinMax.min;
            v <= this.feedback_valueCount_per_alignment_MinMax.max; ++v ) {

            let testCase = new TestCase(
              testCaseId, this.feedbackShape, h, w, c, v );
            yield testCase;

            ++testCaseId;
          }
        }
      }
    }
  }

}

//
//
const gTestCases = new TestCases();

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( `NeuralNet.FeedbackShape testing...` );

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( gTestCases.length ) );

  // Try every test case.
  const countPerYield = 10 * 1000;
  let testCaseGenerator = gTestCases.testCase_generator();
  for ( let testCase of testCaseGenerator ) {
    testCase.test();

    progressToAdvance.value_advance();
    if ( ( testCase.testCaseId % countPerYield ) == 0 )
      yield progressRoot;
  }

  yield progressRoot;

  if ( progressToAdvance.valuePercentage != 100 )
    throw Error( `FeedbackShape_tester.tester(): `
      + `gTestCases.length=${gTestCases.length}, `
      + `progressToAdvance.valuePercentage ( ${progressToAdvance.valuePercentage} ) `
      + `should be 100.` );

  console.log( `NeuralNet.FeedbackShape testing... Done. `
    + `( ${gTestCases.length} cases )` );
}
