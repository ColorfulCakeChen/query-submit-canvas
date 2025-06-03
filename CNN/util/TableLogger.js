export { TableLogger_Base as Base };

// import * as Pool from "./Pool.js";
// import * as Recyclable from "./Recyclable.js";

/**
 *
 */
class TableLogger_Base {

  /**
   * @param {tf.tensor3d} aTensor3d
   *   An single tf.tensor3d to be logged to console.
   */
  static log_tensor3d( aTensor3d ) {
    const funcNameInMessage = "log_tensor3d";

    const shape = aTensor3d.shape;
    if ( shape.length != 3 )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aTensor3d.shape ( [ ${shape} ] ) should be `
        + `Array with ( .length == 3 )`
      );

    const [ height, width, depth ] = shape;
    const dataArray = aTensor3d.dataSync();

    let elementValue;
    let i = 0;
    for ( let y = 0; y < height; ++y ) {
      for ( let x = 0; x < width; ++x ) {
        for ( let c = 0; c < depth; ++c, ++i ) {
          elementValue = dataArray[ i ];

//!!! ...unfinished... (2025/06/03)


        }
      }
    }

  }


  /**
   * @param {number[]} aDataArray
   *   A 1d (one-dimension) number array to be logged to console.
   *
   * @param {number} height
   *   The number array will be interpreted as an image with height.
   *
   * @param {number} width
   *   The number array will be interpreted as an image with width.
   *
   * @param {number} depth
   *   The number array will be interpreted as an image with depth.
   */
  static log_array_as_image( aDataArray, height, width, depth ) {
    const funcNameInMessage = "log_array_as_image";

    const length = height * width * depth;
    if ( aDataArray.length != length )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aDataArray.length ( ${aDataArray.length} ) `
        + `should be ( ${length} ) for `
        + `( height, width, depth ) = ( ${height}, ${width}, ${depth} ).`
      );

    const [ height, width, depth ] = shape;
    const dataArray = aTensor3d.dataSync();

    let elementValue;
    let i = 0;
    for ( let y = 0; y < height; ++y ) {
      for ( let x = 0; x < width; ++x ) {
        for ( let c = 0; c < depth; ++c, ++i ) {
          elementValue = dataArray[ i ];

//!!! ...unfinished... (2025/06/03)


        }
      }
    }

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
