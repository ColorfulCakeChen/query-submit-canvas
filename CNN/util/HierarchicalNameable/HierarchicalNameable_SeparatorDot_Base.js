export { HierarchicalNameable_SeparatorDot_Base as SeparatorDot_Base };
export { SeparatorDot_Root };

import * as Pool from "../../util/Pool.js";
import { Base } from "./HierarchicalNameable_Base.js";

/**
 * Just like HierarchicalNameable_Base, but with "." (dot) as
 * nameJoinSeparator.
 *
 * @see HierarchicalNameable_Base
 */
let HierarchicalNameable_SeparatorDot_Base
  = ( ParentClass = Object ) => class HierarchicalNameable_SeparatorDot_Base
      extends Base( ParentClass ) {

  /**
   * Used as default HierarchicalNameable.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root(
    "HierarchicalNameable.SeparatorDot.Base.Pool",
    HierarchicalNameable_SeparatorDot_Base,
    HierarchicalNameable_SeparatorDot_Base.setAsConstructor );

  /**
   */
  constructor( parentNameable, name, ...restArgs ) {
    super( parentNameable, ".", name, ...restArgs );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( parentNameable, name, ...restArgs ) {
    super.setAsConstructor( parentNameable, ".", name, ...restArgs );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Nothing to do.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}


/**
 * Almost the same as HierarchicalNameable_SeparatorDot_Base class except its
 * parent class is fixed to object. In other words, caller can not specify the
 * parent class of HierarchicalNameable.Root (so it is named "Root" which can
 * not have parent class).
 */
class SeparatorDot_Root extends HierarchicalNameable_SeparatorDot_Base() {
}
