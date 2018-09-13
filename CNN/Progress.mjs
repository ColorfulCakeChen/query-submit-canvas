import * as Receiver from "ValueMaxDone.mjs";
export {Receiver, Percentage};

/** Aggregate all progress and represent by percentag. Acceptable by ValueMaxDone.Base.*/
class Percentage {
  constructor() {
    this.accumulation = 0;
    this.total = 0;
  }

  addSub(progressPart) {
    this.subProgressParts = this.subProgressParts || [];
    this.subProgressParts.push(progressPart);
  }

  get value() {
    let valueSum = 0, maxSum = 0;
    if (this.subProgressParts) { /* Aggregate all sub progress. */
      for (let progressPart of this.subProgressParts) {
        if (!progressPart)
          continue;
        valueSum += progressPart.value();
        maxSum += progressPart.max();
      }
    }

    if (this.total > 0) { /* Avoid divided by zero. */
      valueSum += ( this.accumulation / this.total ) * 100; /* Aggregate self progress. */
      maxSum += 100;
    }

    if (maxSum > 0) { /* Avoid divided by zero. */
      return ( valueSum / maxSum ) * 100;
    }
    return 0; /* Always zero since the total is illegal. */
  }

  get max() {
    return 100;
  }
}
