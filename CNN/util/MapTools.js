export { get_or_create };

/**
 * @param {Map} containerMap
 *   A container which is a Map object.
 *
 * @param {any} key
 *   The key to be searched inside the containerMap.
 *
 * @param {object} newObjectClass
 *   A class object. It is only used to create new value (by default constructor) when the key is not found inside the containerMap.
 *
 * @return {Map}
 *   A Map object.
 *     - If the key is found inside the containerMap, its value (also a Map object) will be returned.
 *     - If the key is not found, a new Map object will be created. It will be recorded into the containerMap, and then be returned.
 */
get_or_create( map, key, newObjectClass = Map ) {
  let value = map.get( key );
  if ( !value )
    map.set( key, value = new newObjectClass() );
  return value;
}
