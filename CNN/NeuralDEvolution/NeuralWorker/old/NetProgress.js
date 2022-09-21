import * as ValueMax from "../ValueMax.js";

export { InitProgress, InitProgressAll };

/**
 * Aggregate initialization progress of one web worker.
 * Including: download tensorflow and neural network library, download neural network weights, parse neural network weights.
 */
class InitProgress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading tensorflow and neural network library.
      new ValueMax.Percentage.Concrete(), // Increased when downloading neural network weights.
      new ValueMax.Percentage.Concrete(), // Increased when parsing neural network weights.
    ];

    super( children );
    [ this.libraryDownload, this.weightsDownload, this.weightsParse ] = children;
  }
}

/**
 * Aggregate initialization progress of two workers.
 */
class InitProgressAll extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new InitProgress(), // Increased when web worker 1 initializing.
      new InitProgress(), // Increased when web worker 2 initializing.
    ];

    super( children );
    [ this.worker1, this.worker2 ] = children;
  }
}
