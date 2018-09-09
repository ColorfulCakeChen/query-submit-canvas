
/** namespace about receiving progress informing. */
export {Base, HTMLProgress};

/** The skeleton of progress receiver.  */
class Base {
  init(maxVolume) {}
  advance(advancedVolume) {}
  done() {}
}

/** Dummy progress receiver which discards all information. */
Base.dummy = new Base();

/**
 * Report progress to HTMLProgressElement.
 *
 * init() will set HTMLProgressElement.value to 0 and set HTMLProgressElement.max to parameter maxVolume.
 * advanced() will set HTMLProgressElement.value to ( HTMLProgressElement.value + generator.next().value ).
 * done() will call HTMLProgressElement.onclick().
 * 
 * @param {HTMLProgressElement} htmlProgress The HTMLProgressElement for reporting progress. can not null.
 */
class HTMLProgress extends Base {
  constructor(htmlProgress) { this.htmlProgress = htmlProgress; }
  init(maxVolume)           { this.htmlProgress.value = 0; this.htmlProgress.max = maxVolume; }
  advance(advancedVolume)   { this.htmlProgress.value += advancedVolume; }
  done()                    { this.htmlProgress.dispatchEvent(new Event("click")); }
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
      return new SeparableConv2d.ProgressReceiver.HTMLProgress(htmlProgress);
  }
  return SeparableConv2d.ProgressReceiver.Base.dummy;
}
