export { Base, HTMLProgress };

/** Do nothing when receives value, max and done. */
class Base {
  /**
   * @param {number} value The current value.
   * @param {number} max   The maximum value.
   */
  setValueMax( value, max ) {}

  /**
   * @param {number} value The current value.
   */
  setValue( value ) {}

  /**
   * @param {number} max   The maximum value.
   */
  setMax( max ) {}

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
 */
class HTMLProgress extends Base {
  /** @param {HTMLProgressElement} htmlProgress The HTMLProgressElement for reporting progress. can not null. */
  constructor(htmlProgress) {
    super();
    this.htmlProgress = htmlProgress;
  }

  /** Set HTMLProgressElement.value and HTMLProgressElement.max to valueMax.valuePercentage and valueMax.maxPercentage. */
  setValueMax(valueMax) {
    this.htmlProgress.value = valueMax.valuePercentage;
    this.htmlProgress.max = valueMax.maxPercentage;
  }

  /**
   * Set HTMLProgressElement.value and HTMLProgressElement.max to value and max.
   * @param {number} value The current value.
   * @param {number} max   The maximum value.
   */
  setValueMax( value, max ) {
    this.htmlProgress.value = value;
    this.htmlProgress.max = max;
  }

  /**
   * Set HTMLProgressElement.value to value.
   * @param {number} value The current value.
   */
  setValue( value ) {
    this.htmlProgress.value = value;
  }

  /**
   * HTMLProgressElement.max max.
   * @param {number} max   The maximum value.
   */
  setMax( max ) {
    this.htmlProgress.max = max;
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
