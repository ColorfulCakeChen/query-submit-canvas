export { tester };

import * as FloatValue from "../Unpacker/FloatValue.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as Weights from "../Unpacker/Weights.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as BatchIdCalculator from "./Ref/BatchIdCalculator.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
//import * as NumberImage from "./Ref/NumberImage.js"; 
import * as Block from "../Conv/Block.js";

/** */
function *testerCases( progressParent ) {
  const funcNameInMessage = "testerCases";

  let testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

!!! ...unfinished... (2025/06/19)

  progressToAdvance.value_advance();
  yield progressRoot;
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "FloatValue_ScaleTranslate testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressCases = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

!!! ...unfinished... (2025/06/19)


  let progress_Weights_Float32Array_RestrictedClone = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_ValueRange_valueInputOutputGenerator = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerCases( progressCases );

  // 2.
  yield *tester_Weights_Float32Array_RestrictedClone(
    progress_Weights_Float32Array_RestrictedClone );

  // 3.
  yield *tester_ValueRange_valueInputOutputGenerator(
    progress_ValueRange_valueInputOutputGenerator );

  console.log( "FloatValue_ScaleTranslate testing... Done." );
}
