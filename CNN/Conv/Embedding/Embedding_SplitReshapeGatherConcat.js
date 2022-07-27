export { SplitReshapeGatherConcat };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 *
 */
class SplitReshapeGatherConcat extends Recyclable.Root {

  /**
   * Used as default Embedding.SplitReshapeGatherConcat provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.SplitReshapeGatherConcat.Pool", SplitReshapeGatherConcat, SplitReshapeGatherConcat.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    SplitReshapeGatherConcat.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    SplitReshapeGatherConcat.setAsConstructor_self.call( this );
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
