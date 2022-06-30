export { testCorrectness };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
import * as TensorPlaceholder from "../Conv/TensorPlaceholder.js";
import * as Operation from "../Conv/Operation.js";
import * as Pool_Asserter from "./Ref/Pool_Asserter.js"; 

/**
 * For testing Operation.Base.
 *
 */
class Case {

  /**
   * @param {number} caseId      The id of this test case.
   * @param {Class} classTested  Operation.Base or Operation.TwinArray
   */
  constructor( caseId, classTested, bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.caseId = caseId;
    this.classTested = classTested;
    this.bInput0 = bInput0;
    this.bInput1 = bInput1;
    this.outputTensorCount = outputTensorCount;
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;

    this.assertPrefix = `jsPerf_Operation.Case( this.caseId == ${this.caseId} )`;

    try {

      Pool_Asserter.assert_Pool_issuedCount_same_after_as_before(
        "jsPerf_Operation.Case()",
        Pool.All.sessionCall, Pool.All, // The "this" when calling Pool.All.sessionCall().
        Case.test_sessionCall_internal, this, // The "this" when calling Case.test_sessionCall_internal().
      );

    } catch ( e ) {
      throw Error( `${this.assertPrefix}: exception. `
        + `${e}`
      );
    }
  }

  /**
   * @param {Case} this
   *   The test case object.
   */
  static test_sessionCall_internal() {

    if ( this.bInput0 )
      this.input0 = TensorPlaceholder.Base.Pool.get_or_create_by();

    if ( this.bInput1 )
      this.input1 = TensorPlaceholder.Base.Pool.get_or_create_by();

//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//    let TensorPlaceholderPool_issuedCount_before = TensorPlaceholder.Base.Pool.issuedCount;

    this.operation = this.classTested.Pool.get_or_create_by( this.input0, this.input1, this.outputTensorCount );
    this.operation.setKeepInputTensor( this.bKeepInputTensor0, this.bKeepInputTensor1 );

    tf.tidy( Case.test_tidy_internal.bind( this ) );
    
//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//     let TensorPlaceholderPool_issuedCount_after = TensorPlaceholder.Base.Pool.issuedCount;
//
//     if ( TensorPlaceholderPool_issuedCount_after != TensorPlaceholderPool_issuedCount_before )
//       throw Error( `${this.assertPrefix}: memory leak. `
//         + `result issued TensorPlachodler count ( ${TensorPlaceholderPool_issuedCount_after} ) `
//         + `should be ( ${TensorPlaceholderPool_issuedCount_before} ).`
//       );
  }

  /**
   * @param {Case} this
   *   The test case object.
   */
  static test_tidy_internal() {

    let memoryInfo_apply_before = tf.memory(); // Test memory leakage of .apply.

    let numTensors_delta = 0;
    if ( this.input0 ) {
      this.input0.realTensor = tf.randomNormal( Case.testTensorShape );
      ++numTensors_delta;

      if ( !this.bKeepInputTensor0 )
        --numTensors_delta;
    }

    if ( this.input1 ) {
      this.input1.realTensor = tf.randomNormal( Case.testTensorShape );
      ++numTensors_delta;

      if ( !this.bKeepInputTensor1 )
        --numTensors_delta;
    }

    this.operation.apply();

    if ( !this.bInput0 && !this.bInput1 ) { // If no inputs, outputs should always be null.

      if ( this.operation.output0 )
        this.assert_property_equal( "operation", "output0", "realTensor", null );
      if ( this.operation.output1 )
        this.assert_property_equal( "operation", "output1", "realTensor", null );

    } else {
      numTensors_delta += this.outputTensorCount;
    }

    let memoryInfo_apply_after = tf.memory();

    let numTensors_predicted = ( memoryInfo_apply_before.numTensors + numTensors_delta );
    if ( memoryInfo_apply_after.numTensors != ( memoryInfo_apply_before.numTensors + numTensors_delta ) )
      throw Error( `${this.assertPrefix}: memory leak. `
        + `result tensor count (${memoryInfo_apply_after.numTensors}) `
        + `should be ( ${numTensors_predicted} ) = ( ${memoryInfo_apply_before.numTensors} + ${numTensors_delta} ).`
      );

    //!!! (2022/06/30 Remarked) Since caller uses .sessionCall(), it is not necessary release here.
    //this.operation.disposeResources_and_recycleToPool();
  }

  assert_property_equal( strPropertyName0, strPropertyName1, strPropertyName2, rhsValue ) {
    let strWholeName = `Case( caseId = ${this.caseId} ).${strPropertyName0}`;

    let thisValue = this[ strPropertyName0 ];

    if ( strPropertyName1 != undefined ) {
      thisValue = thisValue[ strPropertyName1 ];
      strWholeName += strPropertyName1;
    }

    if ( strPropertyName2 != undefined ) {
      thisValue = thisValue[ strPropertyName2 ];
      strWholeName += strPropertyName2;
    }

    if ( thisValue != rhsValue )
      throw Error( `jsPerf_Operation.`
        + `${strWholeName} ( ${thisValue} ) should be ( ${rhsValue} ).` );
  }
}

Case.testTensorShape = [ 1 ];


function testCorrectness() {

  let classOperationRoot = Operation.Root;
  let classOperationTwinArray = Operation.TwinArray;
  let classTestedArray = [ classOperationRoot, classOperationTwinArray ];

  let caseId = -1;
  let bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1;

  for ( let classIndex = 0; classIndex < classTestedArray.length; ++classIndex ) {
    let classTested = classTestedArray[ classIndex ];

    for ( let nInput0 = 0; nInput0 <= 1; ++nInput0 ) {
      for ( let nInput1 = 0; nInput1 <= 1; ++nInput1 ) {
        for ( let outputTensorCount = 0; outputTensorCount <= 2; ++outputTensorCount ) {
          for ( let nKeepInputTensor0 = 0; nKeepInputTensor0 <= 1; ++nKeepInputTensor0 ) {
            for ( let nKeepInputTensor1 = 0; nKeepInputTensor1 <= 1; ++nKeepInputTensor1 ) {

              ++caseId;

              bInput0 = ( nInput0 != 0 );
              bInput1 = ( nInput1 != 0 );

              //!!! (2022/06/02 Remarked) It could be supported. Just get null as result.
              //if ( !bInput0 && !bInput1 )
              //  continue; // Operation should have at least one input.

              bKeepInputTensor0 = ( nKeepInputTensor0 != 0 );
              bKeepInputTensor1 = ( nKeepInputTensor1 != 0 );

              let testCase = new Case( caseId, classTested, bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1 );
            }
          }
        }
      }
    }
  }
}
