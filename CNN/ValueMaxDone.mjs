export {Base, HTMLProgress};

/** Do nothing when receives value, max and done. */
class Base {
  /**
   * Handle current value and maximum value.
   * @param {object} valueMax An object with property value and max. e.g. { value: 20, max: 100 }
   */
  setValueMax(valueMax) {}

  /**
   * Inform the process is done.
   * @param {any} doneValue Any value.
   */
  informDone(doneValue) {}
}

/** Dummy receiver which discards all information. */
Base.dummy = new Base();

/**
 * Report progress to HTMLProgressElement.
 *
 * init() will 
 * advanced() will set HTMLProgressElement.value to ( HTMLProgressElement.value + generator.next().value ).
 * done() will 
 * 
 * 
 */
class HTMLProgress extends Base {
  /** @param {HTMLProgressElement} htmlProgress The HTMLProgressElement for reporting progress. can not null. */
  constructor(htmlProgress) {
    this.htmlProgress = htmlProgress;
  }

  /** Set HTMLProgressElement.value and HTMLProgressElement.max to valueMax.value and valueMax.max. */
  setValueMax(valueMax) {
    this.htmlProgress.value = valueMax.value;
    this.htmlProgress.max = valueMax.max;
  }

  /** Call HTMLProgressElement.onclick(). */
  informDone(doneValue) {
    this.htmlProgress.dispatchEvent(new Event("click"));
  }
}

/**
 * @param {string} htmlProgressTitle The title of HTMLProgressElement.
 * @return
 *   Return a new ProgressReceiver.HTMLProgress, if found.
 *   Return the shared ProgressReceiver.Base.dummy, If not found.
 */
HTMLProgress.createByTitle_or_getDummy = function (htmlProgressTitle) {
  if (htmlProgressTitle) {
    let htmlProgress = document.querySelector(`progress[title="${htmlProgressTitle}"]`);
    if (htmlProgress)
      return new HTMLProgress(htmlProgress);
  }
  return Base.dummy;
}
