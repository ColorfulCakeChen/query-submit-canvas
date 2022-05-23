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
 * @param {object} container
 *   An object which may be a container or not. If container has method values(), it will be assumed to return an iterator. This
 * function will visit every element by the iterator. If the element still has method values(), they will be visit recursively.
 * If the element does not have method values(), the element will be yielded by this generator.
 *
 * @return {iterator)
 *   Return an iterator object that contains all values of all containers (recursively).
 */
function* values_recursively( container ) {
  if ( container.values instanceof Function ) {
    for ( let element of container.values() ) {
      yield* values_recursively( element ); // Try it. Perhaps it also a container.
    }
  } else {
    yield container; // Since not a container (i.e. just an element), yield it.
  }
}
