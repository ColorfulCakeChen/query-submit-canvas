export { delayedValue, sleep };
export { Promise_create_by_addEventListener_once };
export { Promise_create_by_setTimeout };
export { prepend_asyncGenerator };
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
 * @return {Promise}
 *   Return a newly created Promise. It will be settled by the eventCallback
 * (by calling resolveFunc or rejectFunc).
 */
function Promise_create_by_addEventListener_once(
  eventTarget, eventType, eventCallback, thisArg, options ) {

  let executor = Promise_create_by_addEventListener_once_executor.bind( null,
    eventTarget, eventType, eventCallback, thisArg, options );

  return new Promise( executor );
}


/**
 *
 * @param {integer} delayMilliseconds
 *   The delay time (in milliseconds) when the (returned) promise will be resolved.
 *
 * @param {function} timeoutCallback
 *    The event handler function for the event name. It should accept parameters
 * ( resolveFunc, rejectFunc, value ). The resolveFunc and rejectFunc come from
 * the returned Promise. The values come from the parameters of this 
 * Promise_create_by_setInterval() function.
 *
 * @param {any} thisArg
 *    The "this" value when binding timeoutCallback with
 * ( thisArg, resolveFunc, rejectFunc ).
 *
 * @param {any[]} values
 *   The values which will be passed into the timeoutCallback when the timer
 * expires (if the timer has not been canceled by .cancelTimer()).
 *
 * @return {Promise}
 *   Return a newly created Promise. It will be settled by the timeoutCallback
 * (by calling resolveFunc or rejectFunc). The returned Promise will have the
 * following properties:
 *   - .resolve(): Call it to resolve the promise.
 *   - .reject(): Call it to reject the promise.
 *   - .timeoutId: could be used to call clearTimeout().
 *   - .cancelTimer(): Call it (without any parameter) to cancel the timer.
 */
function Promise_create_by_setTimeout(
  delayMilliseconds, timeoutCallback, thisArg, ...values ) {

  let resolveFunc, rejectFunc;
  let timeoutId;

  let p = new Promise( ( resolve, reject ) => {
    resolveFunc = resolve;
    rejectFunc = reject;
    timeoutId = setTimeout(
      timeoutCallback.bind( thisArg, resolve, reject ),
      delayMilliseconds, ...values );
  } );

  p.resolve = resolveFunc;
  p.reject = rejectFunc;

  p.timeoutId = timeoutId;
  p.cancelTimer = clearTimeout.bind( null, timeoutId );

  return p;
}

/**
 * Prepend the specified promise to the specified async generator. It looks
 * like push the promise back to the async generator.
 *
 *
 * @param {Promise} prependNextPromise
 *   A promise which will resolves to an object { done, value }.
 *
 *   - If resolved to { done: false, value }, the value will be yielded. And
 *       then the asyncGenerator will be used to continue to yield.
 *
 *   - If resolved to { done: true, value }, the value will be returned. And
 *       then the asyncGenerator will be ignored totally.
 *
 * @param {AsyncGenerator} asyncGenerator
 *   An asynchronous generator which will be used to after prependNextPromise
 * resolved to { done: false, value }.
 */
async function* prepend_asyncGenerator( prependNextPromise, asyncGenerator ) {
  let prependNext = await prependNextPromise;
  if ( prependNext.done )
    return prependNext.value;
  else
    yield prependNext.value;

  let result = yield* asyncGenerator;
  return result;
}


/** */
function forOf_timeoutCallback() {
  
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
async function forOf( generator, callback, callbackDone, delayMilliseconds = 0 ) {
  let sleepPromise;
  let generatorNext;
  let r;
  do {
    sleepPromise = sleep( delayMilliseconds );
    await sleepPromise;
  
    generatorNext = generator.next();

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
    } else {
      callback( r.value );
    }

  } while ( !r.done );

  return ( r.value );
}

//!!! (2023/03/21 Remarked) Old Codes. Replaced by async function.
// function forOf( generator, callback, callbackDone, delayMilliseconds = 0 ) {
//
//   function promiseTimeout() {
//     return new Promise( ( resolve, reject ) => {
//       setTimeout( async () => {
//         try {
//           let generatorNext = generator.next();
//           let r;
//
//           // If generatorNext is a promise (i.e. the generator is an async generator).
//           // Wait it resolved, then process it as sync generator.
//           if ( generatorNext instanceof Promise ) {
//             r = await generatorNext;
//
//           // Otherwise, the generator is a sync generator, process the generatorNext.
//           } else {
//             r = generatorNext;
//           }
//
//           if ( r.done ) {
//             callbackDone( r.value );
//             resolve( r.value );
//           } else {
//             callback( r.value );
//             resolve( promiseTimeout() );
//           }
//
//         } catch ( reason ) {
//           reject( reason );
//         }
//
//       }, delayMilliseconds );
//     } );
//   }
//
//   return promiseTimeout();
// }
