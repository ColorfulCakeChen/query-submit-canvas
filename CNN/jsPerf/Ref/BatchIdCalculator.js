export { Base };

/**
 *
 */
class Base {
  
  /**
   * @param {number} batchMessageInterval
   *   Every so many test cases, display a message.
   */
  constructor( batchMessageInterval = ( 50 * 1000 ) ) {
    this.batchMessageInterval = batchMessageInterval;
    this.lastBatchId = -1;
  }

  checkAndDisplay( currentTestParamsId ) {
    const batchMessageInterval = this.batchMessageInterval;

    let currentBatchId = ( currentTestParamsId - ( currentTestParamsId % batchMessageInterval ) ) / batchMessageInterval;
    if ( this.lastBatchId != currentBatchId ) {
      let beginTestParamsId = ( this.lastBatchId + 1 ) * batchMessageInterval;
      let endTestParamsId = ( currentBatchId + 1 ) * batchMessageInterval - 1;

      console.log( `${tf.getBackend()}, `
        + `testParams.id between [${beginTestParamsId} - ${endTestParamsId}] ...` );

      this.lastBatchId = currentBatchId;
    }
  }
}
