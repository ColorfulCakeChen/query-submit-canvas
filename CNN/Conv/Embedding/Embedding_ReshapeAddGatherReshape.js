export { ReshapeAddGatherReshape };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 *
 */
class ReshapeAddGatherReshape extends Recyclable.Root {

  /**
   * Used as default Embedding.ReshapeAddGatherReshape provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.ReshapeAddGatherReshape.Pool", ReshapeAddGatherReshape, ReshapeAddGatherReshape.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    ReshapeAddGatherReshape.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    ReshapeAddGatherReshape.setAsConstructor_self.call( this );
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
