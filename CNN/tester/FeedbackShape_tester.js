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

//!!! ...unfinished... (2023/04/26)
// height_areaCount, width_areaCount
// area_position_leftArrayArray, area_position_topArrayArray


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

//!!! (2023/04/26 Remarked)
// It seems not necessary special case ( explicit_input_height == 1 ).
//       if ( explicit_input_height == 1 ) {
//         area_height_pixelCount_original = 1;
//         area_width_pixelCount_original = area_pixelCount_original;
//
//       } else {
//
//         area_height_pixelCount_original
//           = Math.ceil( Math.sqrt( area_pixelCount_original ) );
//
//         if ( area_height_pixelCount_original <= explicit_input_height ) { // square shape.
//           area_width_pixelCount_original = area_height_pixelCount_original
//
//         } else { // rectangle shape.
//           area_height_pixelCount_original = Math.floor(
//             explicit_input_height / area_height_multiplier );
//
//           area_width_pixelCount_original = Math.ceil(
//             from_pixelCount_original / area_height_pixelCount_original );
//         }
//       }

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

    this.assert_Area_GE( "height_areaCount", 1 );
    this.assert_Area_GE( "width_areaCount", 1 );

    this.assert_Area_LE( "height_areaCount", areaCount );
    this.assert_Area_LE( "width_areaCount", areaCount );

    // ( height_areaCount * width_areaCount ) should be areaCount.
    this.assert_FeedbackShape( "areaCount",
      this.feedbackShape.height_areaCount * this.feedbackShape.width_areaCount );

    if ( ( this.feedbackShape.height_areaCount % 2 ) != 0 )
      throw Error( `FeedbackShape_tester.TestCase.${funcNameInMessage}(): `
        + `.feedbackShape.height_areaCount `
        + `( ${this.feedbackShape.height_areaCount} ) `
        + `should be even number (i.e. divisible by 2). `
        + `{ ${this} }.`
      );

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

//!!! ...unfinished... (2023/04/27)
// implicit_input_pixelCount >= allNeuralNets_from_pixelCount_expanded
// implicit_input_valueCount >= allNeuralNets_from_valueCount_expanded

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
