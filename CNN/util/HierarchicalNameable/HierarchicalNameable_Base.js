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
 * @member {string} nameJoinSeparator
 *   The separator string used when composing .nameString_recursively.
 *
 * @member {string} name
 *   The name string of this object.
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
    parentNameable, nameJoinSeparator, name, ...restArgs ) {

    // All other arguments passed to parent class's constructor.
    super( ...restArgs );
    this.#setAsConstructor_self(
      parentNameable, nameJoinSeparator, name );
  }

  /** @override */
  setAsConstructor(
    parentNameable, nameJoinSeparator, name, ...restArgs ) {

    super.setAsConstructor( ...restArgs );
    this.#setAsConstructor_self(
      parentNameable, nameJoinSeparator, name );
  }

  /**  */
  #setAsConstructor_self(
    parentNameable, nameJoinSeparator, name ) {

    this.#parentNameable = parentNameable;
    if ( parentNameable ) {
      parentNameable.#childrenNameableSet_add_internal( this );
    }

    // Re-use children container (if exists), but ensure it is empty.
    if ( this.#childrenNameableSet )
      this.#childrenNameableSet.clear();
    else
      this.#childrenNameableSet = new Set();

    this.#nameJoinSeparator = nameJoinSeparator;
    this.#name = name;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {

//!!! (2025/06/11 Remarked) seems not necessary.
//    this.name_related_cache_clear();

    { // Clear name related caches.
      this.#nameJoinSeparatorString_cache = undefined;
      this.#nameString_cache = undefined;
      this.#nameString_recursively_cache = undefined;
    }

    const childrenNameableSet = this.#childrenNameableSet;
    if ( childrenNameableSet ) {
      // const funcNameInMessage = "disposeResources";
      //
      // (2025/06/13 Remarked) Become bypassing this object to parent.
      //
      // // All children nameable objects should be detached before releasing
      // // this nameable object.
      // //
      // // Note: Usually, this means they should be released before releasing
      // //       this.
      // const childrenNameableCount = childrenNameableSet.size;
      // if ( childrenNameableCount > 0 ) {
      //   throw Error( `HierarchicalNameable_Base.${funcNameInMessage}(): `
      //     + `.#childrenNameableSet.size ( ${childrenNameableCount} ) `
      //     + `should be 0. `
      //     + `All children nameable objects should be detached `
      //     + `before releasing this nameable object.`
      //   );
      // }
      //
      // // Just nullify them. Do not release them here.
      // //
      // // Note: Keep the container (i.e. not set to undefined) to reduce
      // //       memory re-allocation.
      // childrenNameableSet.clear();

      // Since this nameable object will be released, let all children
      // nameable objects (although there should be none at best) belong to
      // this object's parent (i.e. bypass this object).
      //
      // (2025/06/13 Modified)
      this.#childrenNameableSet_bypass_internal();
    }

    // Detach from parent nameable object since this nameable object will
    // be released.
    //
    // Just nullify it. Do not release it here.
    this.parentNameable_set( undefined );

    // Clear .#name after children and parent clearing. The reason is to
    // provide more information for debug if children checking assertion
    // failed.
    this.#name = undefined;
    this.#nameJoinSeparator = undefined;

    super.disposeResources();
  }

//!!! (2025/06/11 Remarked) seems not necessary.
//   /**
//    * Clear all .#xxxString_Xxx_cache to null so that they will be
//    * re-created. Usually, call this method if this or some parents' names
//    * are changed.
//    */
//   name_related_cache_clear() {
//     this.#nameJoinSeparatorString_cache = undefined;
//     this.#nameString_cache = undefined;
//     this.#nameString_recursively_cache = undefined;
//   }


  /**
   * Clear .#nameString_recursively_cache of this object and all children
   * nameable objects (directly and indirectly).
   *
   * Usually, it is called when this nameable object's parent or name or
   * separator is changed.
   */
  nameString_recursively_invalidate_recursively() {
    this.#nameString_recursively_cache = undefined;

    const childrenNameableSet = this.#childrenNameableSet;
    for ( let childNameable of childrenNameableSet.values() ) {
      childNameable.nameString_recursively_invalidate_recursively();
    }
  }


  /**
   * @return {HierarchicalNameable.Base}
   *   Return the root nameable object of this nameable object. The root is
   * the nameable object without parent nameable.
   */
  rootNameable_get() {
    const parent = this.#parentNameable;
    if ( parent )
      return parent.rootNameable_get();
    else
      return this; // No parent, then this is the root.
  }


  parentNameable_set( parentNameableNew ) {
    if ( this.#parentNameable === parentNameableNew )
      return;

    // Detect (and prevent from) circularly self reference.
    //
    // This checking should be done:
    //   - before changing parent. So that the .disposeResources() could still
    //       work correctly with the legal (old) parent.
    //   - before calling .nameString_recursively_invalidate_recursively(). So
    //      that the calling stack will not overflow if circularly self
    //      reference happened.
    {
      const funcNameInMessage = "parentNameable_set";

      let parent = parentNameableNew;
      while ( parent ) {
        if ( parent === this )
          throw Error( `HierarchicalNameable_Base.${funcNameInMessage}(): `
            + `A hierarchical nameable object `
            + `should not become itself's ancestor. `
            + `( ${this} )`
          );
        parent = parent.#parentNameable;
      }
    }

    const parentOld = this.#parentNameable;
    if ( parentOld ) { // Remove from the old parent.
      parentOld.#childrenNameableSet_remove_internal( this );
    }

    this.#parentNameable = parentNameableNew;
    if ( parentNameableNew ) { // Add into the new parent.
      parentNameableNew.#childrenNameableSet_add_internal( this );
    }

    this.nameString_recursively_invalidate_recursively();
  }

  parentNameable_get() { return this.#parentNameable; }


  /**
   * @return {string}
   *   The name string of the direct parent nameable. If no parent, return an
   * empty string.
   */
  parentNameString_get() {
    const parent = this.#parentNameable;
    if ( parent )
      return parent.nameString_get();
    return Root.defaultParams.emptyString;
  }

  /**
   * @return {string}
   *   A string composed of all the names of all parent Nameable (recursively
   * until null (or undefined) encountered) with every parent's (not this
   * object's) joinSeparator. If no parent, return an empty string.
   */
  parentNameString_recursively_get() {
    const parent = this.#parentNameable;
    if ( parent ) {
      // Note1: Let parent's (not this object's) joinSeparator be used.
      // Note2: Also let parent create itself's name cache recursively.
      const parentNames = parent.nameString_recursively_get();
      return parentNames;
    }
    return Root.defaultParams.emptyString;
  }


  nameJoinSeparator_set( nameJoinSeparatorNew ) {
    if ( this.#nameJoinSeparator === nameJoinSeparatorNew )
      return;
    this.#nameJoinSeparator = nameJoinSeparatorNew;
    this.#nameJoinSeparatorString_cache = undefined;
    this.nameString_recursively_invalidate_recursively();
  }

  nameJoinSeparator_get() { return this.#nameJoinSeparator; }

  /**
   * Call this method if wanting to use this nameable object's separator to
   * join two strings.
   *
   * It does NOT modify any data members of this nameable object.
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
  nameJoinSeparator_join( originalName, extraName ) {
    if ( ( extraName !== undefined ) && ( extraName !== null ) ) {
      const joinSeparator = this.nameJoinSeparatorString_get();
      const modifiedName = `${originalName}${joinSeparator}${extraName}`;
      return modifiedName;
    }
    return originalName;
  }

  /**
   * @return {string}
   *   A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   */
  nameJoinSeparatorString_get() {
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


  name_set( nameNew ) {
    if ( this.#name === nameNew )
      return;
    this.#name = nameNew;
    this.#nameString_cache = undefined;
    this.nameString_recursively_invalidate_recursively();
  }

  name_get() { return this.#name; }


  /**
   * @return {string}
   *   A string representing .name even if it does not exist (i.e. null or
   * undefined).
   */
  nameString_get() {
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
  nameString_recursively_get() {
    if ( this.#nameString_recursively_cache )
      return this.#nameString_recursively_cache;

    const nameString = this.nameString_get();

    const parent = this.#parentNameable;
    if ( parent ) {

      // Q: Why not use .parentNameString_recursively_get() directly?
      // A: To avoid re-check whether parent exists.
      const parentNames = parent.nameString_recursively_get();

      const joinSeparator = this.nameJoinSeparatorString_get();
      this.#nameString_recursively_cache
        = `${parentNames}${joinSeparator}${nameString}`;

    } else { // No parent, return this object's name (without separator).
      this.#nameString_recursively_cache = nameString;
    }
    return this.#nameString_recursively_cache;
  }


  #parentNameable;
  #childrenNameableSet;

  #nameJoinSeparator;
  #name;


  /**
   * A string representing .nameJoinSeparator even if it does not exist
   * (i.e. null or undefined).
   *
   * It is a cache which only be collected once. Set it to null if wanting to
   * re-collect it (e.g. .nameJoinSeparator is changed).
   */
  #nameJoinSeparatorString_cache;

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


  /** (Internally called when setting parentNameable.) */
  #childrenNameableSet_add_internal( nameable ) {
    this.#childrenNameableSet.add( nameable );
  }

  /** (Internally called when setting parentNameable.) */
  #childrenNameableSet_remove_internal( nameable ) {
    this.#childrenNameableSet.delete( nameable );
  }

  /**
   * Let all (direct) children nameable objects' parent nameable object become
   * this object's parent nameable object (i.e. bypass this nameable object).
   *
   * (Internally called when setting parentNameable.)
   */
  #childrenNameableSet_bypass_internal() {
    const funcNameInMessage = "childrenNameableSet_bypass_internal";

    const parentNameable = this.#parentNameable;
    const childrenNameableSet = this.#childrenNameableSet;

    for ( let childNameable of childrenNameableSet.values() ) {

      // Only this object's child could be modified.
      if ( childNameable.#parentNameable !== this ) {
        throw Error( `HierarchicalNameable_Base.${funcNameInMessage}(): `
          + `childNameable.#parentNameable ( ${childNameable.#parentNameable} ) `
          + `should be this ( ${this} ).`
        );
      }

      childNameable.parentNameable_set( parentNameable );
    }
  }

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
