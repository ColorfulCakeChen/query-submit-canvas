export {forOf};

/**
 * Periodically call generator.next() by setTimeout() until ( generator.next().done == true ). The generator
 * will generate in part-time. Just like a for..of loop but executes in part-time.
 *
 * This seems like for-await-of. This could accept synchronus or asynchronus generator, while for-await-of only accepts asynchronus generator.
 *
 *
 * @param {iterator}  generator         The generator.next() will be called periodically until done.
 * @param {function}  callback          will be called as callback( generator.next().value ) when ( generator.next().done == false ).
 * @param {integer}   delayMilliseconds The delay time when schedule the next run. Default 0.
 *
 * @return A promise resolved with the ( generator.next().value ) when ( generator.next().done == true ).
 */
function forOf( generator, callback, delayMilliseconds = 0 ) {

  function promiseTimeout() {
    return new Promise( ( resolve, reject ) => {
      setTimeout( () => {
        let result = generator.next();

        // If the result is a promise (i.e. the generator is an async generator).
        if ( result instanceof Promise ) {
          result.then( ( r ) => {  // Wait it resolved, then process it as sync generator.
            if ( r.done ) {
              resolve( r.value );
            } else {
              callback( r.value );
              resolve( promiseTimeout() );
            }
          });

        // The generator is a usually sync generator, process its result.
        } else {
          if ( result.done ) {
            resolve( result.value );
          } else {
            callback( result.value );
            resolve( promiseTimeout() );
          }
        }

      }, delayMilliseconds);
    });
  }

  return promiseTimeout();
}
