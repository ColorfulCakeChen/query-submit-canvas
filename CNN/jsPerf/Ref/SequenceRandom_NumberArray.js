export { Bag };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as RandTools from "../../util/RandTools.js";

/**
 * A pool for number array which is created with sequence and randomized offset. It could reduce re-creating them of same parameters
 * again and again to improve performance.
 *
 */
class Bag extends Recyclable.Base( MultiLayerMap.Base ) {

  /**
   * Used as default SequenceRandom_NumberArray.Bag provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "SequenceRandom_NumberArray.Bag.Pool", Bag, Bag.setAsConstructor );

  /**
   *
   * @param {number} nCountPerSameSpec
   *   For the same specification, provide how many different result number array (and randomly select them).
   */
  constructor( nCountPerSameSpec = 10 ) {
    super();
    Bag.setAsConstructor_self.call( this, nCountPerSameSpec );
  }

  /** @override */
  static setAsConstructor( nCountPerSameSpec = 10 ) {
    super.setAsConstructor();
    Bag.setAsConstructor_self.call( this, nCountPerSameSpec );
    return this;
  }

  /** @override */
  static setAsConstructor_self( nCountPerSameSpec = 10 ) {
    this.nRandSpecIdMin = 0;
    this.nRandSpecIdMax = Math.max( 0, nCountPerSameSpec - 1 );
  }

  /** @override */
  disposeResources() {
    this.clear();
    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let numberArray of this.values() ) {
      numberArray.disposeResources_and_recycleToPool();
    }
    super.clear();
  }

  /**
   * Similar to Base.ensure_object_property_numberArray_length_filled(). But the property will be a shared number array. Its value
   * may be shared with other caller.
   *
   * This may have better performance because of number array re-using (instead of re-generating).
   *
   *
   * @param {object} io_object        The object to be checked and modified.
   * @param {string} propertyName     The property io_object[ propertyName ] will be ensured as a number array.
   * @param {number} elementCount     The property io_object[ propertyName ].length will be ensured as elementCount.
   * @param {number} randomOffsetMin  The random number offet lower bound.
   * @param {number} randomOffsetMax  The random number offet upperer bound.
   */
  get_by_elementCount_randomOffsetMin_randomOffsetMax( elementCount, randomOffsetMin = 0, randomOffsetMax = 0 ) {
    let nRandSpecId = RandTools.getRandomIntInclusive( this.nRandSpecIdMin, this.nRandSpecIdMax );
    return this.get_or_create_by_arguments1_etc( Bag.create_by, this,
      elementCount, randomOffsetMin, randomOffsetMax, nRandSpecId );
  }

  /**
   */
  static create_by( elementCount, randomOffsetMin, randomOffsetMax, nRandSpecId ) {

    // For debug.
    //if ( Number.isNaN( elementCount ) ) {
    //  debugger;
    //}

    let numberArray = Recyclable.Array.Pool.get_or_create_by( elementCount );

    // Note: nRandSpecId is not used when generating number array.
    RandTools.fill_numberArray( numberArray, randomOffsetMin, randomOffsetMax );
    return numberArray;
  }

}
