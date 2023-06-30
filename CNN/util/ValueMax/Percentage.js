export { ValueMax_Percentage_Base as Base };
export { ValueMax_Percentage_Concrete as Concrete };
export { ValueMax_Percentage_Aggregate as Aggregate };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";

/**
 * The base class for representing valuePercentage as number between [0, 100]
 * inclusive. Acceptable by Receiver.Base.
 *
 *   - The maxPercentage always returns 100.
 *   - The valuePercentage returns number between [ 0, 100 ] inclusive.
 *
 * @member {Percentage.Base} parent
 *   The direct parent Percentage.Base of this Percentage.Base.
 *
 * @member {number} weight
 *   The weight of this Percentage.Base. It is used when calculated parent's
 * .valuePercentage. Default is 1.
 */
class ValueMax_Percentage_Base extends Recyclable.Root {

  /**
   * Used as default ValueMax.Percentage.Base provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Base.Pool",
    ValueMax_Percentage_Base, ValueMax_Percentage_Base.setAsConstructor );

  /**
   *
   */
  constructor( weight = 1 ) {
    super();
    ValueMax_Percentage_Base.setAsConstructor_self.call( this, weight );
  }

  /** @override */
  static setAsConstructor( weight = 1 ) {
    super.setAsConstructor();
    ValueMax_Percentage_Base.setAsConstructor_self.call( this,  weight );
    return this;
  }

  /** @override */
  static setAsConstructor_self( weight) {
    this.parent = null;
    this.weight = weight;
  }

  /** @override */
  disposeResources() {

    // In theory, here should remove this child object from parent (i.e.
    // Aggregate) so that the parent will not dispose (and recycle) this child
    // object once again. In fact, however, this is an expensive action
    // (because a linear search should be done. So, the better choice is to
    // dispose the whole tree from root object by caller to avoid this problem.
    //
    //if ( this.parent ) {
    //  if ( this.parent instanceof ValueMax_Percentage_Aggregate ) {
    //    // Do nothing currently.
    //  }
    //}

    this.weight = undefined;
    this.parent = undefined;
    super.disposeResources();
  }

  /**
   * @return {Percentage.Base}
   *   The root Percentage.Base of the whole Percentage hierarchy. The root's
   * .valuePercentage represents the whole percentage.
   */
  root_get() {
    if ( this.parent )
      return this.parent.root_get();
    return this; // If no parent, this is the root.
  }

  /**
   * This method will call parent's .valuePercentage_cached_invalidate().
   *
   * Sub-class should override this method and invalidate
   * .valuePercentage_cached (i.e. let it become undefined). 
   */
  valuePercentage_cached_invalidate() {
    if ( this.parent )
      this.parent.valuePercentage_cached_invalidate();
  }

  /**
   * @return {number} Always 0. Sub-class should override this method.
   */
  get treeDepth() {
    return 0;
  }

  /**
   * Dummy.
   * @return {number} Always 0. Sub-class should override this method.
   */
  get valuePercentage() {
    return 0;
  }

  /**
   * @return {number} Always 100. Sub-class should NOT override this method.
   */
  get maxPercentage() {
    return 100;
  }
}


/**
 * Collect value and max and represents them as percentage.
 *
 * The Concrete.maxPercentage always returns 100. The Concrete.valuePercentage
 * returns number between [ 0, 100 ] inclusive.
 *
 * @member {number} value
 *   A positive number between [ 0, max ]. Usually, caller will increase it.
 *
 * @member {number} max
 *   A positive number indicates the maximum value of this.value.
 */
class ValueMax_Percentage_Concrete extends ValueMax_Percentage_Base {

  #value;
  #max;

  #valuePercentage_cached;

  /**
   * Used as default ValueMax.Percentage.Concrete provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Concrete.Pool",
    ValueMax_Percentage_Concrete,
    ValueMax_Percentage_Concrete.setAsConstructor );

  /**
   * @param {number} max
   *   The possible maximum value of this.value. If negative, indicates not
   * initialized. This is different from maxPercentage. The maxPercentage is
   * always 100. The this.max, however, could be zero or any positive value.
   *   - If .max is negative, the valuePercentage will always be 0
   *       (to avoid Aggregate.valuePercentage immediately 100).
   *   - If .max is zero, the valuePercentage will always be 100 (to avoid
   *       divide by zero and avoid Aggregate.valuePercentage never 100).
   */
  constructor( max = -1, weight = 1 ) {
    super( weight );
    ValueMax_Percentage_Concrete.setAsConstructor_self.call( this, max );
  }

  /** @override */
  static setAsConstructor( max = -1, weight = 1 ) {
    super.setAsConstructor( weight );
    ValueMax_Percentage_Concrete.setAsConstructor_self.call( this, max );
    return this;
  }

  /** @override */
  static setAsConstructor_self( max = -1 ) {
    this.#value = 0;
    this.#max = max; // Negative indicates not initialized.
  }

  /** @override */
  disposeResources() {
    this.#valuePercentage_cached = undefined;
    this.#max = undefined;
    this.#value = undefined;
    super.disposeResources();
  }

  /**
   * @return {number} Always 1.
   * @override
   */
  get treeDepth() {
    return 1;
  }

  get value() {
    return this.#value;
  }

  /**
   * Set .value (and invalidate .valuePercentage_cached).
   *
   * @param {number} newValue
   *   The new .value. default is 0.
   *
   * @return {number}
   *   Return the adjusted value.
   */
  set value( newValue = 0 ) {
    this.#value = newValue;
    this.valuePercentage_cached_invalidate();
  }

  /**
   * Set .value as .max (and invalidate .valuePercentage_cached).
   *
   * @return {number}
   *   Return the adjusted value (i.e. this.max).
   */
  value_set_as_max() {
    return this.value = this.#max;
  }

  /**
   * Add advancedValue to .value (and invalidate .valuePercentage_cached).
   *
   * @param {number} advancedValue
   *   Add how many to .value. default is 1.
   *
   * @return {number}
   *   Return the adjusted value.
   */
  value_advance( advancedValue = 1 ) {
    this.#value += advancedValue;
    this.valuePercentage_cached_invalidate();
    return this.#value;
  }

  get max() {
    return this.#max;
  }

  /**
   * Set .max (and invalidate .valuePercentage_cached).
   *
   * @param {number} newMax
   *   The new .max. default is 1000.
   *
   * @return {number}
   *   Return the adjusted max value.
   */
  set max( newMax = 1000 ) {
    this.#max = newMax;
    this.valuePercentage_cached_invalidate();
  }

  /**
   * Set .value and .max (and invalidate .valuePercentage_cached).
   *
   * @param {number} newValue
   *   The new .value. default is 0.
   *
   * @param {number} newMax
   *   The new .max. default is 1000.
   */
  value_max_set( newValue = 0, newMax = 1000 ) {
    this.#value = newValue;
    this.#max = newMax;
    this.valuePercentage_cached_invalidate();
  }

  /**
   * Invalidate .valuePercentage_cached (i.e. let it become undefined). This
   * method will call parent's .valuePercentage_cached_invalidate().
   * @override
   */
  valuePercentage_cached_invalidate() {
    this.#valuePercentage_cached = undefined;
    super.valuePercentage_cached_invalidate();
  }

  /**
   * @return {number}
   *   The progress as number between [ 0, 100 ] inclusive.
   *     - Always 0, if this.max is negative.
   *     - Always 100, if this.max is zero.
   *     - Otherwise, return the ratio of ( this.value / this.max ).
   */
  get valuePercentage() {
    if ( this.#valuePercentage_cached != undefined )
      return this.#valuePercentage_cached;

    // If max is negative (i.e. not initialized), return 0 (to avoid
    // Aggregate.valuePercentage become 100 immediately).
    if ( this.#max < 0 )
      return 0;

    // If max is indeed zero, return 100 (to avoid divide by zero and avoid
    // Aggregate.valuePercentage never 100).
    if ( this.#max == 0 )
      return 100;

    // value should be in [ 0, max ].
    let value = this.#value;
    if ( value < 0 )
      throw Error( `ValueMax.Percentage.Concrete.valuePercentage(): `
        + `value ( ${value} ) should >= 0`
      );

    if ( value > this.#max )
      throw Error( `ValueMax.Percentage.Concrete.valuePercentage(): `
        + `value ( ${value} ) should <= max ( ${this.#max} )`
      );

    this.#valuePercentage_cached = ( value / this.#max ) * 100;
    return this.#valuePercentage_cached;
  }
}


/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents
 * them as percentage.
 *
 * @member {Percentage.Base[]} children
 *   An array of Percentage.Base which will be aggregated. Their parent are set
 * to this Percentage.Aggregate.
 */
class ValueMax_Percentage_Aggregate extends ValueMax_Percentage_Base {

  #treeDepth_cached;
  #valuePercentage_cached;

  /**
   * Used as default ValueMax.Percentage.Aggregate provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Aggregate.Pool",
    ValueMax_Percentage_Aggregate,
    ValueMax_Percentage_Aggregate.setAsConstructor );

  /**
   */
  constructor( weight = 1 ) {
    super( weight );
    ValueMax_Percentage_Aggregate.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( weight = 1 ) {
    super.setAsConstructor( weight );
    ValueMax_Percentage_Aggregate.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    //this.#treeDepth_cached = undefined;
    this.children = Recyclable.OwnerArray.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    if ( this.children ) {
      this.children.disposeResources_and_recycleToPool();
      this.children = null;
    }
    this.#treeDepth_cached = undefined;
    this.#valuePercentage_cached = undefined;
    super.disposeResources();
  }

  /**
   *
   * @return {number} Return the most length to the concrete (i.e. leaf) child.
   * @override
   */
  get treeDepth() {
    if ( this.#treeDepth_cached != undefined )
      return this.#treeDepth_cached;

    let treeDepthChildMax = 0;
    for ( let i = 0; i < this.children.length; ++i ) {
      let child = this.children[ i ];
      if ( !child )
        continue;

      let treeDepthChild = child.treeDepth;
      if ( treeDepthChild > 0 ) {
        if ( treeDepthChild > treeDepthChildMax )
          treeDepthChildMax = treeDepthChild;

      } else {
        throw Error( `ValueMax.Percentage.Aggregate.treeDepth(): `
          + `child.treeDepth ( ${treeDepthChild} ) should be positive.`
        );
      }
    }

    this.#treeDepth_cached = treeDepthChildMax + 1;
    return this.#treeDepth_cached;
  }

  /**
   * Append child (and invalidate .valuePercentage_cached).
   *
   * @param {Percentage.Base} child
   *   Another Percentage.Base object. Its parent will be set to this object.
   *
   * @return {Percentage.Base} Return the child for cascading easily.
   */
  child_add( child ) {
    if ( !child )
      return null;

    this.children.push( child );
    child.parent = this;

    this.valuePercentage_cached_invalidate();

    return child;
  }

  /**
   * @param {Percentage.Base} child
   *   The direct child Percentage.Base object to be detached. If found,
   * remove it from this Percentage.Aggregate, clear its .parent (but not
   * dispose it).
   *
   * @return {boolean}
   *   Return true, if succeeded. Return false, if not found.
   */
  child_detach( child ) {
    let bFound = false;

    for ( let i = 0; i < this.children.length; ++i ) {
      if ( child !== this.children[ i ] )
        continue;

      bFound = true;
      child.parent = null;
      this.children.splice( i, 1 );

      this.valuePercentage_cached_invalidate();

      break;
    }

    return bFound;
  }

  /**
   * @param {Percentage.Base} child
   *   The direct child Percentage.Base object to be disposed. If found,
   * remove it from this Percentage.Aggregate, clear its .parent, and
   * dispose it.
   *
   * @return {boolean}
   *   Return true, if succeeded. Return false, if not found.
   */
  child_dispose( child ) {
    if ( this.child_detach( child ) ) {
      child.disposeResources_and_recycleToPool();
      return true;
    }
    return false;
  }

  /**
   *   - Remove all children (clear their .parent, but not dispose them).
   *   - Invalidate .valuePercentage_cached.
   *
   */
  child_detachAll() {

    {
      for ( let i = 0; i < this.children.length; ++i ) {
        let child = this.children[ i ];
        if ( !child )
          continue;

        child.parent = null;
        this.children[ i ] = null;
      }

      this.children.length = 0;
    }

    this.valuePercentage_cached_invalidate();
  }

  /**
   *   - Remove all children (and dispose them).
   *   - Invalidate .valuePercentage_cached.
   *
   */
  child_disposeAll() {
    this.children.clear();
    this.valuePercentage_cached_invalidate();
  }

  /**
   *   - Invalidate .valuePercentage_cached (i.e. let it become undefined).
   *   - Invalidate .#treeDepth_cached (i.e. let it become undefined).
   *   - This method will call parent's .valuePercentage_cached_invalidate().
   *
   * @override
   */
  valuePercentage_cached_invalidate() {
    this.#valuePercentage_cached = undefined;
    this.#treeDepth_cached = undefined;
    super.valuePercentage_cached_invalidate();
  }

  /**
   * @return {number}
   *   The sum of all children's ( valuePercentage / maxPercentage ) as
   * number between [0, 100] inclusive.
   */
  get valuePercentage() {
    if ( this.#valuePercentage_cached != undefined )
      return this.#valuePercentage_cached;

    let valueSum = 0, maxSum = 0;

    // (Note: Use integer array index is faster than iterator (i.e. for-of)).
    //for (let child of this.children) {
    for ( let i = 0; i < this.children.length; ++i ) {
      let child = this.children[ i ];
      if ( !child )
        continue;

      // 1.
      let partMax = child.maxPercentage;
      if ( partMax > 0 ) {

        // 2.
        let partValue = child.valuePercentage;

        // Restrict between [ 0, partMax ].
        partValue = Math.max( 0, Math.min( partValue, partMax ) );

        // 3. Weights
        let partWeight = child.weight;
        if ( partWeight > 0 ) {
          let partMaxWeighted = partWeight * partMax;
          let partValueWeighted = partWeight * partValue;

          // 4. Weighted Sum
          valueSum += partValueWeighted;
          maxSum += partMaxWeighted;

        } else { // illegal weight (should be positive).
          throw Error( `ValueMax.Percentage.Aggregate.valuePercentage(): `
            + `child.weight ( ${partWeight} ) should be positive.`
          );
        }

      } else { // illegal .maxPercentage (should always be 100).
        throw Error( `ValueMax.Percentage.Aggregate.valuePercentage(): `
          + `child.maxPercentage ( ${partMax} ) should be positive (i.e. 100).`
        );
      }
    }

    if ( maxSum > 0 ) {
      // 5. Weighted Average
      this.#valuePercentage_cached = ( valueSum / maxSum ) * 100;

    } else {
      // Return zero if the total max is illegal. (to avoid divide by zero.)
      this.#valuePercentage_cached = 0;
    }

    return this.#valuePercentage_cached;
  }

}
