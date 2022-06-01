export { Operation_TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Its output0 and output1 are pointer to the last operation's output0 and output1.
 *
 *
 * @member {function} apply

//!!! ...unfinished... (2022/06/01)

 *
 */
class Operation_TwinArray extends Base() {

  /**
   *
   */
  constructor( inputTensorPlaceholder0, inputTensorPlaceholder1 ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0 );

  }


  clear() {
    

    this.operationArray = new Array();
    
  }


  /**
   * @override
   */
  disposeTensors() {

//!!! ...unfinished... (2022/06/01)
// call disposeTensors( alwaysKeepSet ) for every operation.

    super.disposeTensors();
  }


  /**
   * @override
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {

//!!! ...unfinished... (2022/06/01)
// call setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet ) for every operation?

  }


  /**
   * @override
   */
  apply() {

//!!! ...unfinished... (2022/06/01)
// What if not operation at all when needs or needs not keep-input?

  }

  


  /** @return {number} Sum of operations' tensorWeightCountExtracted. */
  get tensorWeightCountExtracted() {
//!!! ...unfinished... (2022/06/01)
    return 0;
  }


  /** @return {number} Sum of operations' tensorWeightCountTotal. */
  get tensorWeightCountTotal() {
//!!! ...unfinished... (2022/06/01)
    return 0;
  }



}
