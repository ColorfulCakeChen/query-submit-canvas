export { tester };

//import * as RandTools from "../util/RandTools.js";
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
  }

  /** */
  test() {
    const funcNameInMessage = "test";

    this.feedbackShape.init(
      this.explicit_input_height,
      this.explicit_input_width,
      this.explicit_input_channelCount,
      this.feedback_valueCount_per_alignment
    );

    this.testProperties();

//!!! ...unfinished... (2023/04/26)
  }

  testProperties() {

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
    this.assert_ToInput( "neuralNetCount", neuralNetCount );

    const alignmentCount_per_neuralNet = 2;
    this.assert_ToInput( "alignmentCount_per_neuralNet", alignmentCount_per_neuralNet );

    const areaCount = neuralNetCount * alignmentCount_per_neuralNet;
    this.assert_ToInput( "areaCount", areaCount );

//!!! ...unfinished... (2023/04/26)
// height_areaCount, width_areaCount
// area_position_leftArrayArray, area_position_topArrayArray


    //
    let area_height_multiplier = 2;
    let area_width_multiplier = 2;
    {
      if ( explicit_input_height == 1 ) {
        area_height_multiplier = 1;
      }

      this.assert_Area( "height_multiplier", area_height_multiplier );
      this.assert_Area( "width_multiplier", area_width_multiplier );
    }

    //
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
  
    //
    const area_valueCount_original
      = ( this.feedback_valueCount_per_alignment > 0 )
          ? this.feedback_valueCount_per_alignment : 1;
    this.assert_Area( "from_valueCount_original", area_valueCount_original );

    const valueCount_original_per_neural_network
      = area_valueCount_original * alignmentCount_per_neuralNet;
    this.assert_ToInput( "valueCount_original_per_neural_network",
      valueCount_original_per_neural_network );

    const area_valueCount_expanded = area_valueCount_original
      * area_height_multiplier * area_width_multiplier;
    this.assert_Area( "from_valueCount_expanded", area_valueCount_expanded );

    //
    const area_from_pixelCount_original = Math.ceil(
      area_valueCount_original / explicit_input_channelCount );
    this.assert_Area( "from_pixelCount_original", area_from_pixelCount_original );

    const area_from_pixelCount_expanded = area_pixelCount_original
      * area_height_multiplier * area_width_multiplier;
    this.assert_Area( "from_pixelCount_expanded", area_from_pixelCount_expanded );

    // 
    let area_height_pixelCount_original;
    let area_height_pixelCount_expanded;
    let area_width_pixelCount_original;
    let area_width_pixelCount_expanded;
    {
      if ( explicit_input_height == 1 ) {
        area_height_pixelCount_original = 1;
        area_height_pixelCount_expanded = 1;
        area_width_pixelCount_original = area_pixelCount_original;
        area_width_pixelCount_expanded = area_pixelCount_original;

      } else {

//!!! ...unfinished... (2023/04/26)

      }

      this.assert_Area( "height_pixelCount_original", area_height_pixelCount_original );
      this.assert_Area( "height_pixelCount_expanded", area_height_pixelCount_expanded );
      this.assert_Area( "width_pixelCount_original", area_width_pixelCount_original );
      this.assert_Area( "width_pixelCount_expanded", area_width_pixelCount_expanded );


      {
        let area_to_pixelCount_original
          = area_height_pixelCount_original * area_width_pixelCount_original;

        let area_to_pixelCount_expanded
          = area_height_pixelCount_expanded * area_width_pixelCount_expanded;

        this.assert_Area( "to_pixelCount_original", area_to_pixelCount_original );
        this.assert_Area( "to_pixelCount_expanded", area_to_pixelCount_expanded );

        this.assert_Area_LE( "from_pixelCount_original", area_to_pixelCount_original );
        this.assert_Area_LE( "from_pixelCount_expanded", area_to_pixelCount_expanded );
      }

//!!! ...unfinished... (2023/04/26)
    }

    //

//!!! ...unfinished... (2023/04/26)


    // implicit_input: height, width, channelCount, pixelCount, valueCount
    const implicit_input_height = explicit_input_height;
    this.assert_FeedbackShape( "implicit_input_height", implicit_input_height );

//!!! ...unfinished... (2023/04/26) implicit_input_width
//     const implicit_input_width = ???;
//     this.assert_FeedbackShape( "implicit_input_width", implicit_input_width );

    const implicit_input_channelCount = explicit_input_channelCount;
    this.assert_FeedbackShape( "implicit_input_channelCount", implicit_input_channelCount );

//!!! ...unfinished... (2023/04/26) implicit_input_width
//     const implicit_input_pixelCount
//       = implicit_input_height * implicit_input_width;
//     this.assert_FeedbackShape( "implicit_input_pixelCount", implicit_input_pixelCount );
//
//     const implicit_input_valueCount
//       = implicit_input_pixelCount * implicit_input_channelCount;
//     this.assert_FeedbackShape( "implicit_input_valueCount", implicit_input_valueCount );


    // input: height, width, width_valueCount, channelCount, pixelCount, valueCount
    const input_height = explicit_input_height;
    this.assert_FeedbackShape( "input_height", implicit_input_height );

//!!! ...unfinished... (2023/04/26) input_width
//     const input_width = implicit_input_width + explicit_input_width;
//     this.assert_FeedbackShape( "input_width", input_width );
//
//     const input_width_valueCount = input_width * input_channelCount;
//     this.assert_FeedbackShape( "input_width_valueCount", input_width_valueCount );

    const input_channelCount = explicit_input_channelCount;
    this.assert_FeedbackShape( "input_channelCount", input_channelCount );

//!!! ...unfinished... (2023/04/26) input_width
//     const input_pixelCount = input_height * input_width;
//     this.assert_FeedbackShape( "input_pixelCount", input_pixelCount );
//
//     const input_valueCount = input_pixelCount * input_channelCount;
//     this.assert_FeedbackShape( "input_valueCount", input_valueCount );


//!!! ...unfinished... (2023/04/26)

  }

  assert_Area_LE( propertyName, value ) {
    this.assert_LE( "test", this.feedbackShape.toInput, "area", propertyName, value );
  }

  assert_Area( propertyName, value ) {
    this.assert( "test", this.feedbackShape.toInput, "area", propertyName, value );
  }

  assert_ToInput( propertyName, value ) {
    this.assert( "test", this.feedbackShape, "toInput", propertyName, value );
  }

  assert_FeedbackShape( propertyName, value ) {
    this.assert( "test", this, "feedbackShape", propertyName, value );
  }

  assert_LE( funcNameInMessage, parentObject, objectName, propertyName, value ) {
    let lhs = parentObject[ objectName ][ propertyName ];
    if ( !( lhs < value ) )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `testCaseId=${this.testCaseId}, `
        + `${objectName}.${propertyName} ( ${lhs} ) `
        + `should be less than or equal to ( ${value} ).`
      );
  }

  assert( funcNameInMessage, parentObject, objectName, propertyName, value ) {
    let lhs = parentObject[ objectName ][ propertyName ];
    if ( lhs != value )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `testCaseId=${this.testCaseId}, `
        + `${objectName}.${propertyName} ( ${lhs} ) should be ( ${value} ).`
      );
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

    this.explicit_input_height_MinMax = new MinMax( 0, 10 );
    this.explicit_input_width_MinMax = new MinMax( 0, 10 );
    this.explicit_input_channelCount_MinMax = new MinMax( 0, 10 );
    this.feedback_valueCount_per_alignment_MinMax = new MinMax( 0, 100 );

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
  const countPerYield = 500;
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
