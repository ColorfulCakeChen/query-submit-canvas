export { MultiLayerMap_Base as Base };

import * as MapTools from "./MapTools.js";

/**
 * A map whose value is also a map (except the most leaf node). The most leaf node's value is any object which caller could
 * creates.
 *
 */
class MultiLayerMap_Base {

  /**
   *
   */
  constructor() {
    this.map = new Map();
  }

  /**
   *
   *
   * @param {function} pfnCreate
   *   This parameter (i.e. arguments[ 0 ]) should be a function. When specified keys (i.e. arguments[] except arguments[ 0 ]) is
   * not found, this function will be called with these parameters. The function pfnCreate() should return a object which will
   * be recorded as the keys' corresponding value.
   *
   * @param {Object} thisArg
   *   The "this" value provided when calling to function pfnCreate.
   *
   * @param {any} keys
   *   Except arguments[ 0 ] (i.e. pfnCreate) and arguments[ 1 ] (i.e. thisArg), all other parameters (i.e. ( arguments[ 2 ],
   * arguments[ 3 ], ..., arguments[ arguments.length - 1 ] ) ) will be used as keys of every map layer. At least, one key parameter
   * (i.e. arguments[ 2 ]) should be provided. All other keys (i.e. arguments[ 3 ], ..., arguments[ arguments.length - 1 ] ) are
   * optional.
   *
   * @return {any}
   *   All keys except the last key (i.e. arguments[ arguments.length - 1 ] ) will be used to search next layer map. The last
   * key's corresponding value:
   *
   *   - If exists (i.e. not undefined), it will be returned.
   *
   *   - Otherwise, the function (pfnCreate)() will be called with all these same parameters to create a new object. The newly
   *     created object will be recorded as the leaf object of the keys. And it will be returned.
   *
   */
  get_or_create_by_arguments1_etc( pfnCreate, thisArg, ...keys ) {

    if ( arguments.length < 3 )
      throw Error( `MultiLayerMap.Base.get_or_create_by_arguments1_etc(): `
        + `arguments.length ${arguments.length} must >= 3. `
        + `At least, pfnCreate and thisArg and key1 should be provided.` );

    if ( keys.length <= 0 )
      return undefined; // This operation can not work.

    let lastKeyIndex = keys.length - 1;

    // Search the last container.
    let container = this.map;
    for ( let i = 0; i < lastKeyIndex; ++i ) {
      let key = keys[ i ];
      container = MapTools.get_or_create( container, key, Map );
    }

    // Confirm the leaf value.
    let lastKey = keys[ lastKeyIndex ];
    let resultObject = container.get( lastKey );
    if ( resultObject == undefined ) {
      resultObject = pfnCreate.apply( thisArg, keys ); // Create new object (without this but) with all specified keys.
      container.set( lastKey, resultObject ); // Record it.
    }

    return resultObject;
  }

  /**
   * @return {iterator)
   *   Return an iterator object that contains all values of all layer maps.
   */
  * values() {
    yield* MapTools.values_recursively( this.map );
  }

  /**
   * Visit all leaf objects.
   *
   * @param {function} pfn
   *   A function to be called for every leaf value.
   *
   * @param {Object} thisArg
   *   The "this" value provided when calling to function pfn.
   */
  visit_all_values_and_call( pfn, thisArg ) {
    for ( let leafObject of this.values() ) {
      pfn.call( thisArg, leafObject );
    }
  }

  /**
   * Removes all elements (including all sub-map and all leaf object).
   */
  clear() {
    this.map.clear();
  }

}
