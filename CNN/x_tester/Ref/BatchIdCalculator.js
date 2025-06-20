export { BatchIdCalculator_Base as Base };

/**
 *
 */
class BatchIdCalculator_Base {
  
  /**
   * @param {number} totalCount
   *   Total test cast count.
   *
   * @param {number} batchMessageInterval
   *   Every so many test cases, display a message.
   */
  constructor(
    totalCount,
    batchMessageInterval = ( 50 * 1000 ) ) {

    this.totalCount = totalCount;
    this.id_max = totalCount - 1;

    this.batchMessageInterval = batchMessageInterval;
    this.lastBatchId = -1;
  }

  /**
   * @param {number} count
   *   An integer to be logged to console.
   */
  displayTotalCount( count ) {
    const idMax = count - 1;
    console.log( `${tf.getBackend()}, `
      + `testParams, `
      + `totalCount ( ${this.totalCount} )` );
  }

  /**
   * @return {boolean}
   *   Return true, if a batch id section is displayed. Return false, if there
   * is no new batch id section should be displayed.
   */
  checkAndDisplay( currentTestParamsId ) {
    const batchMessageInterval = this.batchMessageInterval;

    let currentBatchId
      = ( currentTestParamsId
            - ( currentTestParamsId % batchMessageInterval ) )
        / batchMessageInterval;

    if ( this.lastBatchId == currentBatchId )
      return false;

    let beginTestParamsId = ( this.lastBatchId + 1 ) * batchMessageInterval;
    let endTestParamsId = ( currentBatchId + 1 ) * batchMessageInterval - 1;

    if ( endTestParamsId > this.id_max )
      endTestParamsId = this.id_max; // Do not exceed maximun id.

    console.log( `${tf.getBackend()}, `
      + `testParams.id between `
      + `[${beginTestParamsId} - ${endTestParamsId}] ...` );

    this.lastBatchId = currentBatchId;
    return true;
  }
}
