export { TableLogger_Base as Base };

// import * as Pool from "./Pool.js";
// import * as Recyclable from "./Recyclable.js";

/**
 *
 */
class TableLogger_Base {

  /**
   * @param {tf.tensor} aTensor
   *   An single tensor to be logged to console.
   */
  static TableLog_tensor( aTensor ) {
    const shape = aTensor.shape;
    let dataArray = aTensor.dataSync();

    for ( )
  }

}


/**
 * Parameters for TableLog_Xxx().
 */
TableLogger_Base.TableLog_params = {

  // When no header prefix is needed, this string could be used.
  headerPrefixEmpty: "",

  // The width of a column of the table log.
  characterCountPerField: 20,

  // How many digits (after the decimal point) should be displayed when
  // outputting a number to the table log.
  digitCountAfterDecimalPoint: 10,

  // The separator string when call Array.join() to generate one line (one
  // row) of the table log.
  joinSeparator: " ",
};
