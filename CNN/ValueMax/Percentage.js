export {Base, Concrete, Aggregate};

/**
 * The base class for representing progress as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The max() always returns 100. The value() returns number berween [0, 100] inclusive.
 */
class Base {
  /**
   * Dummy.
   * @return Always return 0. Sub-class should override this method.
   */
  get value() {
    return 0;
  }

  /** @return Always is 100. */
  get max() {
    return 100;
  }
}

/**
 * Aggregate all progress and represents them as percentag. Acceptable by Receiver.Base.
 *
 * The max() always returns 100. The value() returns number berween [0, 100] inclusive.
 */
class Concrete extends Base {
  constructor() {
    super();
    this.accumulation = 0;
    this.total = 0;
  }

  /**
   * @return The progress as number between [0, 100] inclusive.
   */
  get value() {
    if (this.total <= 0)
      return 0; // Return zero if the total is illegal.

    let accumulation = max(0, min(this.accumulation, this.total)); // Restrict between [0, total].
    let percentage = ( accumulation / this.total ) * 100;
    return percentage;
  }
}

/**
 * Aggregate all children progress and represents them as percentag.
 */
class Aggregate extends Base {
  /**
   * @param {Percentage.Base[]} children An array of Percentage which will be aggregate.
   */
  constructor(children = []) {
    super();
    this.childProgressParts = children;
  }

  /**
   * @param {Percentage.Base} progressPart Another Progress.Percentage object.
   */
  addChild(progressPart) {
    this.childProgressParts.push(progressPart);
  }

  /**
   * @return The average of all children progress as number between [0, 100] inclusive.
   */
  get value() {
    let valueSum = 0, maxSum = 0;

    for (let progressPart of this.childProgressParts) {
      if (!progressPart)
        continue;

      let partMax = progressPart.max();
      if (partMax <= 0)
        continue; // Skip illegal progress.

      let partValue = progressPart.value();
      partValue = max(0, min(partValue, partMax)); // Restrict between [0, partMax].

      valueSum += partValue;
      maxSum += partMax;
    }

    if (maxSum <= 0)
      return 0; // Return zero if the total is illegal.

    let percentage = ( valueSum / maxSum ) * 100;
    return percentage;
  }

}
