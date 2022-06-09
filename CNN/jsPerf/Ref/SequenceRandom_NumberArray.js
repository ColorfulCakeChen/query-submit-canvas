export { Bag };

import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as RandTools from "../../util/RandTools.js";

/**
 * A pool for number array which is created with sequence and randomized offset. It could reduce re-creating them of same parameters
 * again and again to improve performance.
 *
 */
class Bag extends MultiLayerMap.Base {

  /**
   *
   * @param {number} nCountPerSameSpec
   *   For the same specification, provide how many different result number array (and randomly select them).
   */
  constructor( nCountPerSameSpec = 10 ) {
    super();
    this.nRandSpecIdMin = 0;
    this.nRandSpecIdMax = Math.max( 0, nCountPerSameSpec - 1 );
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

    return this.get_or_create_by_arguments1_etc(
      ( elementCount, randomOffsetMin, randomOffsetMax, nRandSpecId ) => {
        // Note: nRandSpecId is not used when generating number array.
        return RandTools.generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax );
      },
      elementCount, randomOffsetMin, randomOffsetMax, nRandSpecId );
  }

}
