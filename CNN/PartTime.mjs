import * as ProgressReceiver from "./ProgressReceiver.mjs";

export {forOf};

/**
 * Periodically call generator.next() by setTimeout() until ( generator.next().done == true ). The generator
 * will generate in part-time.
 *
 * When ( generator.next().done == false ), the generator.next().value should be a number.
 *
 * For the first time ( generator.next().done == false ), the generator.next().value should be a positive number
 * represents the maximum progress volume. The HTMLProgressElement.max will be set to this first value. The
 * HTMLProgressElement.value will be set to 0.
 *
 * After that, everytime ( generator.next().done == false ), the generator.next().value should be a number
 * represents the advanced progress volume. The HTMLProgressElement.value will be set to
 * ( HTMLProgressElement.value + generator.next().value ).
 *
 * Finally, when ( generator.next().done == true ), the promise will resolve with the last time
 * ( generator.next().value ) and the HTMLProgressElement.onclick() will be called for informing. 
 *
 * @param {function}  generator         The generator.next() will be called periodically until done.
 * @param {string}    htmlProgressTitle The title of HTMLProgressElement. If null, no progress reporting.
 * @param {integer}   delayMilliseconds The delay time when setTimeout(). Default 0.
 *
 * @return A promise resolved with the ( generator.next().value ) when ( generator.next().done == true ).
 */
function forOf(generator, htmlProgressTitle, delayMilliseconds = 0) {

  let progressReceiver = ProgressReceiver.HTMLProgress.createByTitle_or_getDummy(htmlProgressTitle);

  function promiseTimeout() {
    return new Promise( (resolve, reject) => {
      setTimeout(() => {
        let result = generator.next();   /* Advance and the get the increased progress volume. */
        if (result.done) {               /* All done. Resolved. Report to UI by click event. */
          resolve(result.value);
          progressReceiver.done();
        } else {
          progressReceiver.advance(result.value); /* Report advanced progress to UI. */
          resolve(promiseTimeout());     /* Schedule the next run. */ 
        }
      }, delayMilliseconds);
    });
  }

  let firstResult = generator.next();       /* Get the maximum progress volume. */
  progressReceiver.init(firstResult.value);
  return promiseTimeout();                 /* Schedule the next run. */
}
