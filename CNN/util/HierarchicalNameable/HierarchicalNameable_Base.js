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
 *
 * @member {HierarchicalNameable.Base} parentNameable
 *   The parent (nameable) object contains this object. It is only referenced
 * (NOT owned) by this object. It will NOT be released by this object.
 *
 * @member {Set} childrenNameableSet
 *   All direct children HierarchicalNameable objects. They are only referenced
 * by this .childrenNameableSet container (i.e. they will not be released by
 * iterating this .childrenNameableSet container). Mainly used for invalidate
 * their .#nameString_recursively_cache.
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

    this.#parentNameable = parentNameable;

    // Re-use children container (if exists), but ensure it is empty.
    if ( this.#childrenNameableSet )
      this.#childrenNameableSet.clear();
    else
      this.#childrenNameableSet = new Set();

    this.#name = name;
    this.#nameJoinSeparator = nameJoinSeparator;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {
    this.name_related_cache_clear();

    this.#nameJoinSeparator = undefined;
    this.#name = undefined;

    // Just nullify them. Do not release them here.
    //
    // Note: Keep the container (i.e. not set to undefined) to reduce memory
    //       re-allocation.
    if ( this.#childrenNameableSet )
      this.#childrenNameableSet.clear();

    this.#parentNameable = undefined; // Just nullify it. Do not release it.

    super.disposeResources();
  }

//!!! (2025/06/11 Remarked) seems not necessary.
//   /**
//    * Clear all .#xxxString_Xxx_cache to null so that they will be
//    * re-created. Usually, call this method if this or some parents' names
//    * are changed.
//    */
//   name_related_cache_clear() {
//     this.#nameString_cache = undefined;
//     this.#nameString_recursively_cache = undefined;
//     this.#nameJoinSeparatorString_cache = undefined;
//   }

  /**
   *
   * @param {string} originalName
   *   The original string will be used as prefix.  
   *
   * @param {string} extraName
   *   - If null or undefined, the originalName will be returned.
   *   - If provided, it will be appended to the end of originalName
   *       with .nameJoinSeparatorString.
   *
   * @return {string}
   *   A string either originalName or originalName with separator and
   * extraName.
   */
  helper_join_extraName( originalName, extraName ) {
    if ( ( extraName !== undefined ) && ( extraName !== null ) ) {
      const joinSeparator = this.nameJoinSeparatorString;
      const modifiedName = `${originalName}${joinSeparator}${extraName}`;
      return modifiedName;
    }
    return originalName;
  }

  /**
   * Clear .#nameString_recursively_cache of this object and all children
   * nameable objects (directly and indirectly).
   */
  nameString_recursively_invalidate_recursively() {
    this.#nameString_recursively_cache = undefined;

    const childrenNameableSet = this.#childrenNameableSet;
    for ( let childNameable of childrenNameableSet.values() ) {
      childNameable.nameString_recursively_invalidate_recursively();
    }
  }

  /**
   * 
   */
  childrenNameableSet_add( nameable ) {
    this.#childrenNameableSet.add( nameable );
  }

  /**
   * 
   */
  childrenNameableSet_remove( nameable ) {
    this.#childrenNameableSet.delete( nameable );
  }


  set parentNameable( parentNameableNew ) {
    if ( this.#parentNameable === parentNameableNew )
      return;

    const parentOld = this.#parentNameable;
    if ( parentOld ) {
      parentOld.childrenNameableSet_remove( this );
    }

    this.#parentNameable = parentNameableNew;
    if ( parentNameableNew ) {
      parentNameableNew.childrenNameableSet_add( this );
    }

    this.nameString_recursively_invalidate_recursively();
  }

  get parentNameable() { return this.#parentNameable; }


  set name( nameNew ) {
    if ( this.#name === nameNew )
      return;
    this.#name = nameNew;
    this.#nameString_cache = undefined;
    this.nameString_recursively_invalidate_recursively();
  }

  get name() { return this.#name; }


  set nameJoinSeparator( nameJoinSeparatorNew ) {
    if ( this.#nameJoinSeparator === nameJoinSeparatorNew )
      return;
    this.#nameJoinSeparator = nameJoinSeparatorNew;
    this.#nameJoinSeparatorString_cache = undefined;
    this.nameString_recursively_invalidate_recursively();
  }

  get nameJoinSeparator() { return this.#nameJoinSeparator; }


  /**
   * @return {string}
   *   A string representing .name even if it does not exist (i.e. null or
   * undefined).
   */
  get nameString() {
    if ( this.#nameString_cache )
      return this.#nameString_cache;

    const name = this.#name; 
    if ( ( name !== undefined ) && ( name !== null ) ) {
      // Note: workable even if not a string (e.g. number or object).
      this.#nameString_cache = name.toString();

    } else {
      // Because null and undefined do not have .toString() to be called,
      // return default NoName in this case.
      this.#nameString_cache = Root.defaultParams.NoNameString;
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
    const parent = this.#parentNameable;
    if ( parent )
      return parent.nameString;
    return Root.defaultParams.emptyString;
  }

  /**
   * @return {string}
   *   A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) with every parent's (not this
   * object's) joinSeparator. If no parent, return an empty string.
   */
  get parentNameString_recursively() {
    const parent = this.#parentNameable;
    if ( parent ) {
      // Note1: Let parent's (not this object's) joinSeparator be used.
      // Note2: Also let parent create itself's name cache recursively.
      const parentNames = parent.nameString_recursively;
      return parentNames;
    }
    return Root.defaultParams.emptyString;
  }

  /**
   * @return {string}
   *   A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   */
  get nameJoinSeparatorString() {
    if ( this.#nameJoinSeparatorString_cache )
      return this.#nameJoinSeparatorString_cache;

    const nameJoinSeparator = this.#nameJoinSeparator; 
    if (   ( nameJoinSeparator !== undefined )
        && ( nameJoinSeparator !== null ) ) {
      // Note: workable even if not a string (e.g. number or object).
      this.#nameJoinSeparatorString_cache
        = nameJoinSeparator.toString();

    } else {
      // Because null and undefined do not have .toString() to be called,
      // return default joinSeparator in this case.
      this.#nameJoinSeparatorString_cache
        = Root.defaultParams.nameJoinSeparator;
    }
    return this.#nameJoinSeparatorString_cache;
  }


  #parentNameable;
  #childrenNameableSet;

  #name;
  #nameJoinSeparator;

  /**
   * The string of this object's name.
   *
   * It is a cache which only collect name once. Set it to null if wanting to
   * re-collect name (e.g. .name is changed).
   */
  #nameString_cache;

  /**
   * A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) and this object's name.
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

}


/**
 * Almost the same as HierarchicalNameable.Base class except its parent class is
 * fixed to Object. In other words, caller can not specify the parent
 * class of HierarchicalNameable.Root (so it is named "Root" which can not have
 * parent class).
 */
class Root extends HierarchicalNameable_Base() {

  /**
   * The default parameters shared by all kinds of
   * HierarchicalNameable_Base( Xxx ) classes.
   */
  static defaultParams = {

    // Default separator: no separator.
    nameJoinSeparator: "",

    // A constant string used when there is no name.
    NoNameString: "(No name)",

    // A constant empty string.
    emptyString: "",
  };

}
