export { SplitGatherConcat };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 *
 */
class SplitGatherConcat extends Recyclable.Root {

  /**
   * Used as default Embedding.SplitGatherConcat provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.SplitGatherConcat.Pool", SplitGatherConcat, SplitGatherConcat.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    SplitGatherConcat.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    SplitGatherConcat.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {

!!! ...unfinished... (2022/07/17)

  }

  /** @override */
  disposeResources() {

!!! ...unfinished... (2022/07/17)

    super.disposeResources();
  }


}
