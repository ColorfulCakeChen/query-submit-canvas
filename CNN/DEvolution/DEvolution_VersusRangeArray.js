export { DEvolution_VersusRangeArray as VersusRangeArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as GSheets from "../util/GSheets.js";

/**
 * Differential evolution information downloading range list.
 *.
 */
class DEvolution_VersusRangeArray extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusRangeArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusRangeArray.Pool",
    DEvolution_VersusRangeArray, DEvolution_VersusRangeArray.setAsConstructor );

  /** */
  constructor() {
    super();
    DEvolution_VersusRangeArray.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    DEvolution_VersusRangeArray.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2022/08/27)

    super.disposeResources();
  }

}
