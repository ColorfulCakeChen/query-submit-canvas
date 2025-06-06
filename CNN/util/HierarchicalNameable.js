export { HierarchicalNameable_Base as Base, Root };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";

/**
 * Represents an object which:
 *
 *   - has itself name (so that it is nameable).
 *
 *   - could have parentNameable which must be also a kind of
 *       HierarchicalNameable_Base (so that nameable recursively).
 *
 * All the .name of this object and every parent HierarchicalNameable
 * (recursively) compose a name path.
 *
 *
 * @member {HierarchicalNameable.Base} parentNameable
 *   The parent (nameable) object contains this object. It is only referenced
 * (NOT owned) by this object. It will NOT be released by this object.
 *
 * @member {string} name
 *   The name string of this object.
 *
 * @member {string} nameJoinSeparator
 *   The separator string used when composing .name_recursively and
 * .parentName_recursively.
 *
 *
 * @member {string} name_recursively
 *   A string composed of all the names of all parent Nameable (recursively
 * until null (or undefined) encountered) and this object .name. If
 * .name_recursively_cache exists, return it. Otherwise, create and return
 * it.
 *
 *
 * @member {string} parentName
 *   The name string of the direct parent nameable. If .parentNameable does
 * not exist, return an empty string.
 *
 * @member {string} parentName_recursively
 *   A string composed of all the names of all parent Nameable (recursively
 * until null (or undefined) encountered). If .parentName_recursively_cache
 * exists, return it. Otherwise, create and return it. 
 *
!!! *
 * @member {string} parentNameArray_recursively_cache
 *   A string array contains all the names of all parent Nameable (recursively
 * until null (or undefined) encountered). It is a cache which only collect
 * parent names once. Set it to null if wanting to re-collect all parent names
 * (e.g. some parents' names are changed).
 *
 *
 * @member {string} parentNameArray_recursively
 *
 * @member {string} name_prefixWith_parentName_Recursively_cached
//      get name_prefixWith_parentName_Recursively_cached (concatenated with all container name)
 *
 * @member {string} name_recursively_cached
//      get name_recursively() { cached }
 */
let HierarchicalNameable_Base
  = ( ParentClass = Object ) => class HierarchicalNameable_Base
      extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default HierarchicalNameable.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "HierarchicalNameable.Base.Pool",
    HierarchicalNameable_Base, HierarchicalNameable_Base.setAsConstructor );

//!!! ...unfinshed... (2025/06/05)
// Define class HierarchicalNameable_Base {
//      parentNameable (to parent HierarchicalNameable_Base)
//      name
//      get name_prefixWith_parentName_Recursively_cached (concatenated with all container name)
//      get name_recursively() { cached }
//      get name_of_parent() { direct parent name }
//      get name_of_parent_recursively() { cached }
// }
// Let Operation, Block(_Reference), Stage(_Reference), NeuralNet(_Reference)
// iherits from HierarchicalNameable_Base.
//
// Add name, containerBlock ?
// get name_prefixWith_ContainerName_Recursively_cached (concatenated with all container name)

  /**
   */
  constructor( parentNameable, name, ...restArgs ) {

    // All other arguments passed to parent class's constructor.
    super( ...restArgs );
    HierarchicalNameable_Base.setAsConstructor_self.call( this,
      parentNameable, name, ...restArgs );
  }

  /** @override */
  static setAsConstructor( parentNameable, name, ...restArgs ) {
    super.setAsConstructor.apply( this, restArgs );
    OperationHierarchicalNameable_Base_Base.setAsConstructor_self.call( this,
      parentNameable, name, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( parentNameable, name, ...restArgs ) {
    this.parentNameable = parentNameable;
    this.name = name;
  }

  /**
   * The .parentNameable and .name will be set to null.
   *
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {
    this.name = null;
    this.parentNameable = null; // Just nullify it. Do not release it.

    this.nameString_cache_clear();

    super.disposeResources();
  }

//!!! ...unfinshed... (2025/06/05)
// Define class HierarchicalNameable_Base {
//      get name_prefixWith_parentName_Recursively_cached (concatenated with all container name)
//      get name_recursively() { cached }
//      get name_of_parent() { direct parent name }
//      get name_of_parent_recursively() { cached }
// }

  /**
   * 
   */
//  get name

  /**
   * Clear .#name_recursively_cache and .#parentName_recursively_cache to
   * null so that they will be re-created. Usually, call this method if this
   * or some parents' names are changed.
   */
  nameString_cache_clear() {
    this.#parentName_recursively_cache = null;
    this.#name_recursively_cache = null;
  }


  /**
   * A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered). It is a cache which only collect
   * parent names once. Set it to null if wanting to re-collect all parent
   * names (e.g. some parents' names are changed).
   */
  #parentName_recursively_cache;

  /**
   * A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) and this object .name. It is a
   * cache which only collect all names once. Set it to null if wanting to
   * re-collect all names (e.g. this or some parents' names are changed).
   */
  #name_recursively_cache;

}


/**
 * Almost the same as HierarchicalNameable.Base class except its parent class is
 * fixed to object. In other words, caller can not specify the parent
 * class of HierarchicalNameable.Root (so it is named "Root" which can not have
 * parent class).
 */
class Root extends HierarchicalNameable_Base() {
}
