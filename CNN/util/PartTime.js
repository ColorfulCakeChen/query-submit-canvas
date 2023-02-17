export { delayedValue, sleep };
export { Promise_create_by_addEventListener_once };
export { forOf };


/**
 * A wrapper for setTimeout( , delayMilliseconds ).
 *
 * @param {integer} delayMilliseconds
 *   The delay time (in milliseconds) when the (returned) promise will be resolved.
 *
 * @param {any} value
 *   The value which will be returned by the resolved promise.
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
 * A wrapper for delayedValue( delayMilliseconds, undefined ).
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


/** Used by Promise_create_by_addEventListener_once() */
const addEventListener_options_once = {
  once : true
};

/** Used by Promise_create_by_addEventListener_once(). */
function Promise_create_by_addEventListener_once_executor(
  eventTarget, eventType, eventCallback, thisArg,
  options = addEventListener_options_once,
  resolve, reject ) {

  options.once = true;
  eventTarget.addEventListener(
    eventType, eventCallback.bind( thisArg, resolve, reject ), options );
}

/**
 *
 * @param {object} eventTarget
 *   An object with .addEventListener() method.
 *
 * @param {string} eventType
 *    The event type of eventCallback. e.g. "loadstart", "progress", "timeout".
 *
 * @param {function} eventCallback
 *    The event handler function for the event name. It should accept parameters
 * ( resolveFunc, rejectFunc, event ). The resolveFunc and rejectFunc come from
 * the returned Promise. The event come from the eventTarget when event of
 * evenType occurred.
 *
 * @param {any} thisArg
 *    The "this" value when binding eventCallback with
 * ( thisArg, resolveFunc, rejectFunc ).
 *
 * @param {object} options
 *    The options when calling eventTarget.addEventListener(). It could be null.
 * No matter whether it is provided, it will always be set forcibly at least the
 * { once: true } so that the eventCallback will only receive event at most once.
 * This is necessary because a Promise could only be settled once. (So, the same
 * event listenr should be re-registered (to gain another Promise) after event
 * triggered if the event is expected to be happened may times.)
 *
 * @param {Promise}
 *   Return a newly created Promise. It will be settled by the eventCallback
 * (by calling resolveFunc or rejectFunc).
 */
function Promise_create_by_addEventListener_once(
  eventTarget, eventType, eventCallback, thisArg, options ) {

  let executor = Promise_create_by_addEventListener_once_executor.bind( null,
    eventTarget, eventType, eventCallback, thisArg, options );

  return new Promise( executor );
}

//!!! ...unfinished... (2023/02/17)





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
