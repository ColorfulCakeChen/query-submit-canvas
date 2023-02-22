export { ValueMax_Receiver_Base as Base, HTMLProgress };

/** Do nothing when receives value, max and done. */
class ValueMax_Receiver_Base {
  /**
   * @param {number} value The current value.
   * @param {number} max   The maximum value.
   */
  setValueMax( value, max ) {}

  /**
   * @return {number} The current value.
   */
  getValue() {}

  /**
   * @param {number} value The current value.
   */
  setValue( value ) {}

  /**
   * @return {number} The maximum value.
   */
  getMax() {}

  /**
   * @param {number} max   The maximum value.
   */
  setMax( max ) {}

  /**
   * Inform the process is done.
   * @param {any} doneValue Any value.
   */
  informDone( doneValue ) {}
}

/** Dummy receiver which discards all information. */
ValueMax_Receiver_Base.dummy = new ValueMax_Receiver_Base();

/**
 * Report progress to HTMLProgressElement.
 */
class HTMLProgress extends ValueMax_Receiver_Base {

  /**
   * @param {HTMLProgressElement} htmlProgress
   *   The HTMLProgressElement for reporting progress. can not null.
   */
  constructor( htmlProgress ) {
    super();
    this.htmlProgress = htmlProgress;
  }

  /**
   * Set HTMLProgressElement.value and HTMLProgressElement.max to
   * valueMax.valuePercentage and valueMax.maxPercentage.
   */
  setValueMax_by_ValueMaxObject( valueMax ) {
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

  /** @override */
  getValue() {
    return this.htmlProgress.value;
  }

  /**
   * Set HTMLProgressElement.value to value.
   * @param {number} value The current value.
   */
  setValue( value ) {
    this.htmlProgress.value = value;
  }

  /** @override */
  getMax() {
    return this.htmlProgress.max;
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
 *   Return the shared ProgressReceiver.ValueMax_Receiver_Base.dummy, If not found.
 */
HTMLProgress.createByTitle_or_getDummy = function (htmlProgressTitle) {
  if (htmlProgressTitle) {
    let htmlProgress = document.querySelector(`progress[title="${htmlProgressTitle}"]`);
    if (htmlProgress)
      return new HTMLProgress(htmlProgress);
  }
  return Base.dummy;
}
