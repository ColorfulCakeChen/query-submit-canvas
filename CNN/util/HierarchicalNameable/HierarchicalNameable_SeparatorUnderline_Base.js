export { HierarchicalNameable_SeparatorUnderline_Base as SeparatorUnderline_Base };
export { SeparatorUnderline_Root };

import * as Pool from "../../util/Pool.js";
import { Base } from "./HierarchicalNameable_Base.js";

/**
 * Just like HierarchicalNameable_Base, but with "_" (underline) as
 * nameJoinSeparator.
 *
 * @see HierarchicalNameable_Base
 */
let HierarchicalNameable_SeparatorUnderline_Base
  = ( ParentClass = Object ) =>
      class HierarchicalNameable_SeparatorUnderline_Base
        extends Base( ParentClass ) {

  /**
   * Used as default HierarchicalNameable.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root(
    "HierarchicalNameable.SeparatorUnderline.Base.Pool",
    HierarchicalNameable_SeparatorUnderline_Base );

  /**
   */
  constructor( parentNameable, name, ...restArgs ) {
    super( parentNameable, "_", name, ...restArgs );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( parentNameable, name, ...restArgs ) {
    super.setAsConstructor( parentNameable, "_", name, ...restArgs );
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
 * Almost the same as HierarchicalNameable_SeparatorUnderline_Base class except its
 * parent class is fixed to object. In other words, caller can not specify the
 * parent class of HierarchicalNameable.Root (so it is named "Root" which can
 * not have parent class).
 */
class SeparatorUnderline_Root extends HierarchicalNameable_SeparatorUnderline_Base() {
}
