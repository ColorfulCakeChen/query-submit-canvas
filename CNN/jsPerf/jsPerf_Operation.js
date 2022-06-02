export { testCorrectness };

//import * as RandTools from "../util/RandTools.js";
import * as TensorPlaceholder from "../Conv/TensorPlaceholder.js";
import * as Operation from "../Conv/Operation.js";

/**
 * For testing Operation.Base.
 *
 */
class Case {

  /**
   * @param {number} caseId  The id of this test case.
   */
  constructor( caseId, bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.caseId = caseId;

    let input0;
    if ( bInput0 )
      input0 = new TensorPlaceholder.Base();

    let input1;
    if ( bInput1 )
      input1 = new TensorPlaceholder.Base();

    this.operation = new Operation.Base( input0, input1, outputTensorCount );
    this.operation.setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 );

    tf.tidy( () => {

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of imageSourceBag and channelShufflerPool.

      if ( input0 )
        input0.realTensor = tf.randomNormal( Case.testTensorShape );

      if ( input1 )
        input1.realTensor = tf.randomNormal( Case.testTensorShape );

      this.operation.apply();

//!!! ...unfinished... (2022/06/02)

      let memoryInfo_apply_after = tf.memory();

      tf.util.assert( ( memoryInfo_apply_after.numTensors == memoryInfo_apply_before.numTensors ),
        `jsPerf_Operation.Case() memory leak. `
          + `( this.caseId == ${this.caseId} ). `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${memoryInfo_apply_before.numTensors} `
       );
    });


//!!! ...unfinished... (2022/06/02)
}

Case.testTensorShape = [ 1 ];


function testCorrectness() {

//!!! ...unfinished... (2022/06/02)
//   let casesArray = [
//     new Case(  0, [  1,  2 ], [  3,  4 ],  5, [  3,  3 ], [  4,  6 ], [  3,  8 ], [   5,  10 ] ),
/
//   ];

  let bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1;
  let caseId = 0;
  for ( let nInput0 = 0; nInput0 <= 1; ++nInput0 ) {
    for ( let nInput1 = 0; nInput1 <= 1; ++nInput1 ) {
      for ( let outputTensorCount = 0; outputTensorCount <= 2; ++outputTensorCount ) {
        for ( let nKeepInputTensor0 = 0; nKeepInputTensor0 <= 1; ++nKeepInputTensor0 ) {
          for ( let nKeepInputTensor1 = 0; nKeepInputTensor1 <= 1; ++nKeepInputTensor1 ) {

            bInput0 = ( nInput0 != 0 );
            bInput1 = ( nInput1 != 0 );
            bKeepInputTensor0 = ( nKeepInputTensor0 != 0 );
            bKeepInputTensor1 = ( nKeepInputTensor1 != 0 );

            let testCase = new Case( caseId, bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1 );

            ++caseId;
          }
        }
      }
    }
  }
}
