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

    this.comparedShape = { toInput: { area: {} } };
    const comparedShape = this.comparedShape;
    const toInput = comparedShape.toInput;
    const area = toInput.area;

//!!! ...unfinished... (2023/04/26)
    // explicit_input: height, width, channelCount, pixelCount, valueCount

    comparedShape.explicit_input_height
      = ( this.explicit_input_height > 0 ) ? this.explicit_input_height : 1;
    this.assert_FeedbackShape( "explicit_input_height" );

    comparedShape.explicit_input_width
      = ( this.explicit_input_width > 0 ) ? this.explicit_input_width : 1;
    this.assert_FeedbackShape( "explicit_input_width" );

    comparedShape.explicit_input_channelCount
      = ( this.explicit_input_channelCount > 0 ) ? this.explicit_input_channelCount : 1;
    this.assert_FeedbackShape( "explicit_input_channelCount" );

    comparedShape.explicit_input_pixelCount
      = comparedShape.explicit_input_height * comparedShape.explicit_input_width;
    this.assert_FeedbackShape( "explicit_input_pixelCount" );

    comparedShape.explicit_input_valueCount
      = comparedShape.explicit_input_pixelCount
          * comparedShape.explicit_input_channelCount;
    this.assert_FeedbackShape( "explicit_input_valueCount" );


    //
    area.valueCount_original
      = ( this.feedback_valueCount_per_alignment > 0 )
          ? this.feedback_valueCount_per_alignment : 1;
    this.assert_Area( "valueCount_original" );

    toInput.valueCount_original_per_neural_network = area.valueCount_original * 2;
    this.assert_ToInput( "valueCount_original_per_neural_network" );


    // implicit_input: height, width, channelCount, pixelCount, valueCount

    comparedShape.implicit_input_height = comparedShape.explicit_input_height;
    this.assert_FeedbackShape( "implicit_input_height" );

//!!! ...unfinished... (2023/04/26) implicit_input_width
    comparedShape.implicit_input_width = ???;
    this.assert_FeedbackShape( "implicit_input_width" );

    comparedShape.implicit_input_channelCount
      = comparedShape.explicit_input_channelCount;
    this.assert_FeedbackShape( "implicit_input_channelCount" );

    comparedShape.implicit_input_pixelCount
      = comparedShape.implicit_input_height * comparedShape.implicit_input_width;
    this.assert_FeedbackShape( "implicit_input_pixelCount" );

    comparedShape.implicit_input_valueCount
      = comparedShape.implicit_input_pixelCount
          * comparedShape.implicit_input_channelCount;
    this.assert_FeedbackShape( "implicit_input_valueCount" );

//!!! ...unfinished... (2023/04/26)
// input_height, input_width, input_width_valueCount, input_channelCount 
// input_valueCount, input_pixelCount
//
// implicit_Xxx, implicit_input_pixelCount, implicit_input_valueCount

  }

  assert_Area( propertyName ) {
    let value = this.comparedShape.toInput.area[ propertyName ];
    this.assert( "test", this.feedbackShape.toInput, "area", propertyName, value );
  }

  assert_ToInput( propertyName ) {
    let value = this.comparedShape.toInput[ propertyName ];
    this.assert( "test", this.feedbackShape, "toInput", propertyName, value );
  }

  assert_FeedbackShape( propertyName ) {
    let value = this.comparedShape[ propertyName ];
    this.assert( "test", this, "feedbackShape", propertyName, value );
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
