export { delayedValue, sleep, forOf };

/**
 * A wrapper for setTimeout( , delayMilliseconds ).
 *
 * @param {integer} delayMilliseconds
 *   The delay time (in milliseconds) when the (returned) promise will be resolved.
 *
 * @return {Promise}
 *   Return a promise which will be resolved as specified value after specified
 * milliseconds.
 */
function delayedValue( delayMilliseconds, value ) {
  return new Promise( ( resolve /*, reject*/ ) => {
    setTimeout( () => resolve( value ), delayMilliseconds );
  } );
}

/**
 * A wrapper for setTimeout( , delayMilliseconds ).
 *
 * @param {integer} delayMilliseconds
 *   The delay time (in milliseconds) when the (returned) promise will be resolved.
 *
 * @return {Promise}
 *   Return a promise which will be resolved as undefined after specified
 * milliseconds.
 */
function sleep( delayMilliseconds = 0 ) {
  return delayedValue( delayMilliseconds, undefined );
}

/**
 * Periodically call generator.next() by setTimeout() until
 * ( generator.next().done == true ). The generator will generate in part-time.
 * Just like a for..of loop but executes in part-time.
 *
 * This is a little similar to for-await-of. This could accept synchronus or
 * asynchronus generator, while for-await-of only accepts asynchronus generator.
 *
 *
 * @param {iterator} generator
 *   The generator.next() will be called periodically until done.
 *
 * @param {function} callback
 *   It will be called as callback( generator.next().value ) when
 * ( generator.next().done == false ).
 *
 * @param {function} callbackDone
 *   It will be called as callbackDone( generator.next().value ) when
 * ( generator.next().done == true ).
 *
 * @param {integer} delayMilliseconds
 *   The delay time when schedule the next run. Default 0.
 *
 * @return {Promise}
 *   A promise resolved with the ( generator.next().value ) when
 * ( generator.next().done == true ).
 */
function forOf( generator, callback, callbackDone, delayMilliseconds = 0 ) {

  function promiseTimeout() {
    return new Promise( ( resolve, reject ) => {
      setTimeout( async () => {
        try {
          let generatorNext = generator.next();
          let r;

          // If generatorNext is a promise (i.e. the generator is an async generator).
          // Wait it resolved, then process it as sync generator.
          if ( generatorNext instanceof Promise ) {
            r = await generatorNext;

          // Otherwise, the generator is a sync generator, process the generatorNext.
          } else {
            r = generatorNext;
          }

          if ( r.done ) {
            callbackDone( r.value );
            resolve( r.value );
          } else {
            callback( r.value );
            resolve( promiseTimeout() );
          }

        } catch ( reason ) {
          reject( reason );
        }

      }, delayMilliseconds );
    } );
  }

//!!! (2022/09/24) Use await instead.
//   function promiseTimeout() {
//     return new Promise( ( resolve, reject ) => {
//       setTimeout( () => {
//         let result = generator.next();
//
//         // If the result is a promise (i.e. the generator is an async generator).
//         if ( result instanceof Promise ) {
//           result.then( ( r ) => {  // Wait it resolved, then process it as sync generator.
//             if ( r.done ) {
//               callbackDone( r.value );
//               resolve( r.value );
//             } else {
//               callback( r.value );
//               resolve( promiseTimeout() );
//             }
//           } ).catch( ( reason ) => {
//             debugger;
//
//           } );
//
//         // The generator is a sync generator, process its result.
//         } else {
//           if ( result.done ) {
//             callbackDone( r.value );
//             resolve( result.value );
//           } else {
//             callback( result.value );
//             resolve( promiseTimeout() );
//           }
//         }
//
//       }, delayMilliseconds);
//     });
//   }

  return promiseTimeout();
}
