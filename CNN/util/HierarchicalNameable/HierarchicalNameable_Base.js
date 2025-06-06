export { HierarchicalNameable_Base as Base, Root };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

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
  static Pool = new Pool.Root(
    "HierarchicalNameable.Base.Pool",
    HierarchicalNameable_Base,
    HierarchicalNameable_Base.setAsConstructor );

  /**
   */
  constructor(
    parentNameable, name, nameJoinSeparator, ...restArgs ) {

    // All other arguments passed to parent class's constructor.
    super( ...restArgs );
    HierarchicalNameable_Base.setAsConstructor_self.call( this,
      parentNameable, name, nameJoinSeparator );
  }

  /** @override */
  static setAsConstructor(
    parentNameable, name, nameJoinSeparator, ...restArgs ) {

    super.setAsConstructor( ...restArgs );
    OperationHierarchicalNameable_Base_Base.setAsConstructor_self.call( this,
      parentNameable, name, nameJoinSeparator );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    parentNameable, name, nameJoinSeparator ) {

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
    this.name_related_cache_clear();

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
  name_related_cache_clear() {
    this.#nameString_cache = null;
    this.#nameString_recursively_cache = null;
    this.#nameJoinSeparatorString_cache = null;
  }

  /**
   * @return {string}
   *   A string representing .name even if it does not exist (i.e. null or
   * undefined).
   */
  get nameString() {
    if ( this.#nameString_cache )
      return this.#nameString_cache;

    const name = this.name; 
    if ( ( name !== undefined ) && ( name !== null ) ) {
      // Note: workable even if not a string (e.g. number or object).
      this.#nameString_cache = name.toString();

    } else {
      // Because null and undefined do not have .toString() to be called,
      // return default NoName in this case.
      this.#nameString_cache
        = HierarchicalNameable_Base.defaultParams.NoNameString;
    }
    return this.#nameString_cache;
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

      // Q: Why not use this.parentNameString_recursively?
      // A: To avoid re-check whether parent existence.
      const parentNames = parent.nameString_recursively;

      const joinSeparator = this.nameJoinSeparatorString;
      this.#nameString_recursively_cache
        = `${parentNames}${joinSeparator}${nameString}`;

    } else { // No parent, return this object's name (without separator).
      this.#nameString_recursively_cache = nameString;
    }
    return this.#nameString_recursively_cache;
  }

  /**
   * @return {string}
   *   The name string of the direct parent nameable. If no parent, return an
   * empty string.
   */
  get parentNameString() {
    const parent = this.parentNameable;
    if ( parent )
      return parent.nameString;
    return HierarchicalNameable_Base.defaultParams.emptyString;
  }

  /**
   * @return {string}
   *   A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) with every parent's (not this
   * object's) joinSeparator. If no parent, return an empty string.
   */
  get parentNameString_recursively() {
    const parent = this.parentNameable;
    if ( parent ) {
      // Note1: Let parent's (not this object's) joinSeparator be used.
      // Note2: Also let parent create itself's name cache recursively.
      const parentNames = parent.nameString_recursively;
      return parentNames;
    }
    return HierarchicalNameable_Base.defaultParams.emptyString;
  }

  /**
   * @return {string}
   *   A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   */
  get nameJoinSeparatorString() {
    if ( this.#nameJoinSeparatorString_cache )
      return this.#nameJoinSeparatorString_cache;

    const nameJoinSeparator = this.nameJoinSeparator; 
    if (   ( nameJoinSeparator !== undefined )
        && ( nameJoinSeparator !== null ) ) {
      // Note: workable even if not a string (e.g. number or object).
      this.#nameJoinSeparatorString_cache
        = nameJoinSeparator.toString();

    } else {
      // Because null and undefined do not have .toString() to be called,
      // return default joinSeparator in this case.
      this.#nameJoinSeparatorString_cache
        = HierarchicalNameable_Base.defaultParams.nameJoinSeparator;
    }
    return this.#nameJoinSeparatorString_cache;
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
   * A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   *
   * It is a cache which only be collected once. Set it to null if wanting to
   * re-collect it (e.g. .nameJoinSeparator is changed).
   */
  #nameJoinSeparatorString_cache;
  

  /**
   * 
   */
  static defaultParams = {

    // Default separator.
    nameJoinSeparator: "",

    // A constant string used when there is no name.
    NoNameString: "(No name)",

    // A constant empty string.
    emptyString: "",
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
