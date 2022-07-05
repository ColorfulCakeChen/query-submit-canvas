export { get_or_create, values_recursively };

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
function get_or_create( containerMap, key, newObjectClass = Map ) {
  let value = containerMap.get( key );
  if ( !value )
    containerMap.set( key, value = new newObjectClass() );
  return value;
}

/**
 * @param {Map} containerMap
 *   A map object which will be visited recursively. This function will visit every element by the containerMap. If its element still
 * is a map object, its elements will be visited recursively. If the element is not a map object, the element will be yielded by this
 * generator.
 *
 * @return {iterator)
 *   Return an iterator object that contains all values of all containers (recursively).
 */
function* values_recursively( containerMap ) {
  if ( containerMap instanceof Map ) {
    for ( let element of containerMap.values() ) {
      yield* values_recursively( element ); // Try it. Perhaps it also a container.
    }
  } else {
    yield containerMap; // Since not a container (i.e. just an element), yield it.
  }
}
