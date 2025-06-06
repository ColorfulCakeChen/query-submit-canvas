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
 *   The separator string used when composing .nameString_recursively.
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

!!! ...unfinished... (2025/06/06)
// Perhaps, only define nameJoinSeparator in the root nameable.
// It seems not necessary to define it at every level of the hierarchy.
//
// Or, define class HierarchicalNameable_SeparatorDot_Base,
// HierarchicalNameable_SeparatorSlash_Base

  /**
   */
  constructor(
    parentNameable, name, nameJoinSeparator, ...restArgs ) {

    // All other arguments passed to parent class's constructor.
    super( ...restArgs );
    HierarchicalNameable_Base.setAsConstructor_self.call( this,
      parentNameable, name, nameJoinSeparator, ...restArgs );
  }

  /** @override */
  static setAsConstructor(
    parentNameable, name, nameJoinSeparator, ...restArgs ) {

    super.setAsConstructor( ...restArgs );
    OperationHierarchicalNameable_Base_Base.setAsConstructor_self.call( this,
      parentNameable, name, nameJoinSeparator, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    parentNameable, name, nameJoinSeparator, ...restArgs ) {

    this.parentNameable = parentNameable;
    this.name = name;
    this.nameJoinSeparator = nameJoinSeparator;
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
    this.nameString_cache_clear();

    this.nameJoinSeparator = null;
    this.name = null;
    this.parentNameable = null; // Just nullify it. Do not release it.

    super.disposeResources();
  }

  /**
   * Clear .#xxxString_Xxx_cache to null so that they will be
   * re-created. Usually, call this method if this or some parents' names
   * are changed.
   */
  nameString_cache_clear() {
    this.#nameJoinSeparatorString_cache = null;
    this.#nameString_cache = null;
    this.#nameString_recursively_cache = null;
    this.#parentNameString_recursively_cache = null;
  }

  /**
   * @return {string}
   *   A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   */
  get nameJoinSeparatorString() {
    if ( this.#nameJoinSeparatorString_cache )
      return this.#nameJoinSeparatorString_cache;

    let joinSeparatorString;

    // Because null and undefined do not have .toString() to be called,
    // return default joinSeparator in this case.
    const nameJoinSeparator = this.nameJoinSeparator; 
    if (   ( nameJoinSeparator === undefined )
        || ( nameJoinSeparator === null ) ) {
      joinSeparatorString
        = HierarchicalNameable_Base.defaultParams.nameJoinSeparator;
      return joinSeparatorString;
    }

    // As long as it is not null or undefined, return its string. This is
    // workable even if it is not a string (e.g. number or object).
    joinSeparatorString = this.#nameJoinSeparatorString_cache
      = nameJoinSeparator.toString();
    return joinSeparatorString;
  }

  /**
   * @return {string}
   *   A string representing .name even if it does not exist (i.e. null or
   * undefined).
   */
  get nameString() {
    if ( this.#nameString_cache )
      return this.#nameString_cache;

    // Because null and undefined do not have .toString() to be called,
    // return default NoName in this case.
    const name = this.name; 
    if ( ( name === undefined ) || ( name === null ) ) {
      const NoNameString
        = HierarchicalNameable_Base.defaultParams.NoNameString;
      return NoNameString;
    }

    // As long as it is not null or undefined, return its string. This is
    // workable even if the it is not a string (e.g. number or object).
    const nameString = this.#nameString_cache = name.toString();
    return nameString;
  }

  /**
   * @return {string}
   *   A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) and this object .name. If
   * .#name_recursively_cache exists, return it. Otherwise, create and return
   * it.
   */
  get nameString_recursively() {
    if ( this.#nameString_recursively_cache )
      return this.#nameString_recursively_cache;

    const nameString = this.nameString;

    const parent = this.parentNameable;
    if ( parent ) {

      // So that parent will use itself's (not this object's) joinSeparator.
      const parentNames = parent.nameString_recursively;

//!!!
      const joinSeparator = this.nameJoinSeparatorString;

      this.#nameString_recursively_cache
        = `${parentNames}${joinSeparator}${nameString}`;

      return this.#nameString_recursively_cache;

    } else { // No parent, return this object's name (without separator).
      this.#nameString_recursively_cache = nameString;
      return this.#nameString_recursively_cache;
    }
  }

  /**
   * @return {string}
   *   The name string of the direct parent nameable.
   */
  get parentNameString() {
    const parent = this.parentNameable;
    if ( parent )
      return parent.nameString;
    const NoNameString = HierarchicalNameable_Base.defaultParams.NoNameString;
    return NoNameString;
  }

  /**
   * @return {string}
   *   A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) with every parent's (not this
   * object's) joinSeparator.
   *   - If .#parentName_recursively_cache exists, it will be returned
   *       directly. Otherwise, it will be created and returned. 
   *   - If no parent, return an empty string.
   */
  get parentNameString_recursively() {

//!!! ...unfinished... (2025/06/06)
// .#parentNameString_recursively_cache seems not necessary
// because it has been cached in parent's nameString_recursively.

    if ( this.#parentNameString_recursively_cache )
      return this.#parentNameString_recursively_cache;

    const parent = this.parentNameable;
    if ( parent ) {

      // Note1: Let parent's (not this object's) joinSeparator be used.
      // Note2: Also let parent create itself's cache recursively.
      this.#parentNameString_recursively_cache
        = parent.nameString_recursively;

    } else {
      this.#parentNameString_recursively_cache = "";
    }

    return this.#parentNameString_recursively_cache;
  }


  /**
   * The string of this object .name.
   *
   * It is a cache which only collect name once. Set it to null if wanting to
   * re-collect name (e.g. .name is changed).
   */
  #nameString_cache;

  /**
   * A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) and this object .name.
   *
   * It is a cache which only collect all names once. Set it to null if wanting
   * to re-collect all names (e.g. this or some parents' names are changed).
   */
  #nameString_recursively_cache;

  /**
   * A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) with every parent's (not this
   * object's) joinSeparator.
   * 
   * It is a cache which only collect parent names once. Set it to null if
   * wanting to re-collect all parent names (e.g. some parents' names are
   * changed).
   */
  #parentNameString_recursively_cache;


  /**
   * 
   */
  static defaultParams = {

    // Default separator.
    nameJoinSeparator: "_",

    // A constant string used when there is no name.
    NoNameString: "(No name)",

  };

}


/**
 * Almost the same as HierarchicalNameable.Base class except its parent class is
 * fixed to object. In other words, caller can not specify the parent
 * class of HierarchicalNameable.Root (so it is named "Root" which can not have
 * parent class).
 */
class Root extends HierarchicalNameable_Base() {
}
