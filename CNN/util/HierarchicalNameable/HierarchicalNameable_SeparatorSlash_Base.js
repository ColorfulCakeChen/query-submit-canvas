export { HierarchicalNameable_SeparatorSlash_Base as SeparatorSlash_Base };
export { SeparatorSlash_Root };

import * as Pool from "../../util/Pool.js";
import { Base } from "./HierarchicalNameable_Base.js";

/**
 * Just like HierarchicalNameable_Base, but with "/" (slash) as
 * nameJoinSeparator.
 *
 * @see HierarchicalNameable_Base
 */
let HierarchicalNameable_SeparatorSlash_Base
  = ( ParentClass = Object ) => class HierarchicalNameable_SeparatorSlash_Base
      extends Base( ParentClass ) {

  /**
   * Used as default HierarchicalNameable.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root(
    "HierarchicalNameable.SeparatorSlash.Base.Pool",
    HierarchicalNameable_SeparatorSlash_Base,
    HierarchicalNameable_SeparatorSlash_Base.setAsConstructor );

  /**
   */
  constructor( parentNameable, name, ...restArgs ) {
    super( parentNameable, name, ".", ...restArgs );
    HierarchicalNameable_SeparatorSlash_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( parentNameable, name, ...restArgs ) {
    super.setAsConstructor( parentNameable, name, ".", ...restArgs );
    HierarchicalNameable_SeparatorSlash_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Nothing to do.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}


/**
 * Almost the same as HierarchicalNameable_SeparatorSlash_Base class except its
 * parent class is fixed to object. In other words, caller can not specify the
 * parent class of HierarchicalNameable.Root (so it is named "Root" which can
 * not have parent class).
 */
class SeparatorSlash_Root extends HierarchicalNameable_SeparatorSlash_Base() {
}
