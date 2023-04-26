export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/** */
class TestCase {

  /** */
  constructor( testCaseId, neuralNetFeedbackShape,
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {
    this.testCaseId = testCaseId;
    this.neuralNetFeedbackShape = neuralNetFeedbackShape;

    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;
    this.feedback_valueCount_per_alignment = feedback_valueCount_per_alignment;
  }

  /** */
  async *testerGenerator() {

//!!! ...unfinished... (2023/04/26)
    this.neuralNetFeedbackShape.init(
      this.explicit_input_height,
      this.explicit_input_width,
      this.explicit_input_channelCount,
      this.feedback_valueCount_per_alig
    );

//!!! ...unfinished... (2023/04/26)

  }

  assert_EqualTo( funcNameInMessage, objectName, propertyName, value ) {
//    const funcNameInMessage = "";

    let lhs = this[ objectName ][ propertyName ];
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
  }
}

/** */
class TestCaseArray extends Array {

  /** */
  constructor() {
    this.neuralNetFeedbackShape = new NeuralNet.FeedbackShape();

    this.explicit_input_height_MinMax = new MinMax( 0, 10 );
    this.explicit_input_width_MinMax = new MinMax( 0, 10 );
    this.explicit_input_channelCount_MinMax = new MinMax( 0, 10 );
    this.feedback_valueCount_per_alignment_MinMax = new MinMax( 0, 100 );

    let testCaseId = 0;
    for ( let h = this.explicit_input_height_MinMax.min;
      h < this.explicit_input_height_MinMax.max; ++h ) {

      for ( let w = this.explicit_input_width_MinMax.min;
        w < this.explicit_input_width_MinMax.max; ++w ) {

        for ( let c = this.explicit_input_channelCount_MinMax.min;
          c < this.explicit_input_channelCount_MinMax.max; ++c ) {

          for ( let v = this.feedback_valueCount_per_alignment_MinMax.min;
            v < this.feedback_valueCount_per_alignment_MinMax.max; ++v ) {

            this.push( new TestCase( testCaseId, this.neuralNetFeedbackShape,
              h, w, c, v ) );

            ++testCaseId;
          }
        }
      }
    }
  }

}

//
//
const gTestCaseArray = new TestCaseArray();
{
//!!! ...unfinished... (2023/04/25)
  // gTestCaseArray
  //   .append_by( null, "",        60 * 1000,  true ) // succeeded.
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "NeuralNet.FeedbackShape testing..." );

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( gTestCaseArray.length ) );

  // Try every test case.
  for ( let i = 0; i < gTestCaseArray.length; ++i ) {
    let testCase = gTestCaseArray[ i ];

    let testGenerator = testCase.testGenerator();
    yield* testGenerator;

    progressToAdvance.value_advance();
    yield progressRoot;
  }
  
  if ( progressToAdvance.valuePercentage != 100 )
    throw Error( `FeedbackShape_tester.tester(): `
      + `testCase={ ${testCase.toString()} }, `
      + `progressToAdvance.valuePercentage ( ${progressToAdvance.valuePercentage} ) `
      + `should be 100.` );

  console.log( "NeuralNet.FeedbackShape testing... Done." );
}
