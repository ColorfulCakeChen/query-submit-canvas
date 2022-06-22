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
   * @param {number} caseId      The id of this test case.
   * @param {Class} classTested  Operation.Base or Operation.TwinArray
   */
  constructor( caseId, classTested, bInput0, bInput1, outputTensorCount, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.caseId = caseId;

    this.assertPrefix = `jsPerf_Operation.Case( this.caseId == ${this.caseId} )`;

    try {

      tf.util.assert( ( TensorPlaceholder.BasePool.Singleton.issuedCount == 0 ),
        `${this.assertPrefix}: memory leak. `
          + `beginning issued TensorPlachodler count ( ${TensorPlaceholder.BasePool.Singleton.issuedCount} ) `
          + `should be 0.`
      );

      TensorPlaceholder.BasePool.Singleton.sessionCall( () => {

        let input0;
        if ( bInput0 )
          input0 = TensorPlaceholder.BasePool.Singleton.get_or_create_by();

        let input1;
        if ( bInput1 )
          input1 = TensorPlaceholder.BasePool.Singleton.get_or_create_by();

        let TensorPlaceholderPool_issuedCount_before = TensorPlaceholder.BasePool.Singleton.issuedCount;

        this.operation = new classTested( input0, input1, outputTensorCount );
        this.operation.setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 );

        tf.tidy( () => {

          let memoryInfo_apply_before = tf.memory(); // Test memory leakage of .apply.

          let numTensors_delta = 0;
          if ( input0 ) {
            input0.realTensor = tf.randomNormal( Case.testTensorShape );
            ++numTensors_delta;

            if ( !bKeepInputTensor0 )
              --numTensors_delta;
          }

          if ( input1 ) {
            input1.realTensor = tf.randomNormal( Case.testTensorShape );
            ++numTensors_delta;

            if ( !bKeepInputTensor1 )
              --numTensors_delta;
          }

          this.operation.apply();

          if ( !bInput0 && !bInput1 ) { // If no inputs, outputs should always be null.

            if ( this.operation.output0 )
              this.assert_property_equal( "operation", "output0", "realTensor", null );
            if ( this.operation.output1 )
              this.assert_property_equal( "operation", "output1", "realTensor", null );

          } else {
            numTensors_delta += outputTensorCount;
          }

          let memoryInfo_apply_after = tf.memory();

          let numTensors_predicted = ( memoryInfo_apply_before.numTensors + numTensors_delta );
          tf.util.assert( ( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + numTensors_delta ) ),
            `${this.assertPrefix}: memory leak. `
              + `result tensor count (${memoryInfo_apply_after.numTensors}) `
              + `should be ( ${numTensors_predicted} ) = ( ${memoryInfo_apply_before.numTensors} + ${numTensors_delta} ).`
          );

          this.operation.TensorPlaceholder_nullify_inputs_dispose_outputs();

          let TensorPlaceholderPool_issuedCount_after = TensorPlaceholder.BasePool.Singleton.issuedCount;

          tf.util.assert( ( TensorPlaceholderPool_issuedCount_after == TensorPlaceholderPool_issuedCount_before ),
            `${this.assertPrefix}: memory leak. `
              + `result issued TensorPlachodler count ( ${TensorPlaceholderPool_issuedCount_after} ) `
              + `should be ( ${TensorPlaceholderPool_issuedCount_before} ).`
          );

    //!!! ...unfinished... (2022/06/04)
    // aTensorPlaceholder.height, aTensorPlaceholder.width,
    //         aTensorPlaceholder.channelCount, aTensorPlaceholder.channelCount_lowerHalf, aTensorPlaceholder.channelCount_higherHalf,
    //         aTensorPlaceholder.scaleBoundsArray

        });

      });

    } catch ( e ) {
      tf.util.assert( false,
        `${this.assertPrefix}: exception. `
          + `${e}.`
      );
      throw e;
    }
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

    tf.util.assert( thisValue == rhsValue, `jsPerf_Operation.`
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
