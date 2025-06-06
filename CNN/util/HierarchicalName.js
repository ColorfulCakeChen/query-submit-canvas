export { HierarchicalName_Base as Base, Root };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";

/**
 * An object has name and nameParent (which must be also a kind of
 * HierarchicalName_Base).
 *
 * The all the .name of every nameParent (recursively) and this object compose
 * a name path.
 *
 *
 * @member {HierarchicalName.Base} nameParent
 *   The parent object contains this object. It is only referenced (NOT owned)
 * by this object. It will NOT be released by this object.
 *
 * @member {string} name
 *   The name string of this object.
 */
let HierarchicalName_Base
  = ( ParentClass = Object ) => class HierarchicalName_Base
      extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default HierarchicalName.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "HierarchicalName.Base.Pool",
    HierarchicalName_Base, HierarchicalName_Base.setAsConstructor );

//!!! ...unfinshed... (2025/06/05)
// Define class HierarchicalName_Base {
//      nameParent (to parent HierarchicalName_Base)
//      name
//      get name_prefixWith_parentName_Recursively_cached (concatenated with all container name)
//      get name_recursively() { cached }
//      get name_of_parent() { direct parent name }
//      get name_of_parent_recursively() { cached }
// }
// Let Operation, Block(_Reference), Stage(_Reference), NeuralNet(_Reference)
// iherits from HierarchicalName_Base.
//
// Add name, containerBlock ?
// get name_prefixWith_ContainerName_Recursively_cached (concatenated with all container name)

  /**
   */
  constructor( nameParent, name, ...restArgs ) {

    // All other arguments passed to parent class's constructor.
    super( ...restArgs );
    HierarchicalName_Base.setAsConstructor_self.call( this,
      nameParent, name, ...restArgs );
  }

  /** @override */
  static setAsConstructor( nameParent, name, ...restArgs ) {
    super.setAsConstructor.apply( this, restArgs );
    OperationHierarchicalName_Base_Base.setAsConstructor_self.call( this,
      nameParent, name, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( nameParent, name, ...restArgs ) {
    this.nameParent = nameParent;
    this.name = name;
  }

  /**
   * The .nameParent and .name will be set to null.
   *
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {
    this.name = null;
    this.nameParent = null; // Just nullify it. Do not release it.

    super.disposeResources();
  }

}


/**
 * Almost the same as HierarchicalName.Base class except its parent class is
 * fixed to object. In other words, caller can not specify the parent
 * class of HierarchicalName.Root (so it is named "Root" which can not have
 * parent class).
 */
class Root extends HierarchicalName_Base() {
}
