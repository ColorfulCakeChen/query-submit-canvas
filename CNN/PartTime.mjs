/**
 * Periodically call generator.next() by setTimeout() until ( generator.next().done == true ). The generator
 * will generate in part-time. Just like a for..of loop but executes in part-time.
 *
 * @param {function}  callback          will be called as callback( generator.next() ) even if ( generator.next().done == true ).
 * @param {function}  generator         The generator.next() will be called periodically until done.
 * @param {integer}   delayMilliseconds The delay time when setTimeout(). Default 0.
 *
 * @return A promise resolved with the ( generator.next().value ) when ( generator.next().done == true ).
 */
export function forOf(callback, generator, delayMilliseconds = 0) {

  function promiseTimeout() {
    return new Promise( (resolve, reject) => {
      setTimeout(() => {
        let result = generator.next();
        callback(result.value)
        if (result.done) {
          resolve(result.value);
        } else {
          resolve(promiseTimeout());
        }
      }, delayMilliseconds);
    });
  }

  return promiseTimeout();
}
