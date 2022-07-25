export { BatchIdCalculator_Base as Base };

/**
 *
 */
class BatchIdCalculator_Base {
  
  /**
   * @param {number} batchMessageInterval
   *   Every so many test cases, display a message.
   */
  constructor( batchMessageInterval = ( 50 * 1000 ) ) {
    this.batchMessageInterval = batchMessageInterval;
    this.lastBatchId = -1;
  }

  /**
   * @return {boolean}
   *   Return true, if a batch id section is displayed. Return false, if there is no new batch id section should be displayed.
   */
  checkAndDisplay( currentTestParamsId ) {
    const batchMessageInterval = this.batchMessageInterval;

    let currentBatchId = ( currentTestParamsId - ( currentTestParamsId % batchMessageInterval ) ) / batchMessageInterval;
    if ( this.lastBatchId == currentBatchId )
      return false;

    let beginTestParamsId = ( this.lastBatchId + 1 ) * batchMessageInterval;
    let endTestParamsId = ( currentBatchId + 1 ) * batchMessageInterval - 1;

    console.log( `${tf.getBackend()}, `
      + `testParams.id between [${beginTestParamsId} - ${endTestParamsId}] ...` );

    this.lastBatchId = currentBatchId;
    return true;
  }
}
