export { TableLogger_Base as Base };

// import * as Pool from "./Pool.js";
// import * as Recyclable from "./Recyclable.js";

/**
 * A helper class for log object as table.
 *
 *
 * @member {number} characterCountPerField
 *   Every returned string should be padded so that its length is just
 * so many characters.
 *
 * @member {number} digitCountAfterDecimalPoint
 *   Every returned string (if its original value is a number) should be
 * formatted as so many digits after its decimal point.
 *
 * @member {string} joinSeparator
 *   The separator string when call Array.join() to generate one line (one
 * row) of the table log.
 *
 *
 * @member {string[]} workingStringArray
 *   A helper string Array. It will be used as the working buffer (so that
 * array recreation is reduced and performance might be improved).
 */
class TableLogger_Base {

  /**
   *
   */
  constructor(
    characterCountPerField
      = TableLogger_Base.defaultParams.characterCountPerField,

    digitCountAfterDecimalPoint
      = TableLogger_Base.defaultParams.digitCountAfterDecimalPoint,

    joinSeparator
      = TableLogger_Base.defaultParams.joinSeparator
  ) {

    this.characterCountPerField = characterCountPerField;
    this.digitCountAfterDecimalPoint = digitCountAfterDecimalPoint;
    this.joinSeparator = joinSeparator;
    this.workingStringArray = new Array();
  }
    
  /**
   * @param {tf.tensor3d} aTensor3d
   *   An single tf.tensor3d to be logged to console as a table.
   */
  log_tensor3d_along_depth( aTensor3d ) {
    const funcNameInMessage = "log_tensor3d";

    const shape = aTensor3d.shape;
    if ( shape.length != 3 )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aTensor3d.shape ( [ ${shape} ] ) should be `
        + `Array with ( .length == 3 )`
      );

    const [ height, width, depth ] = shape;
    const dataArray = aTensor3d.dataSync();
    this.log_array_as_image_along_depth( dataArray, height, width, depth );
  }

  /**
   * Log a number array (viewed as an 2d image with multiple channels) as a
   * table.
   *
   * For human reading easierly, it is logged by channel (i.e. along the
   * depth). The 0th channel is logged first. And then, the 1st channel,
   * the 2nd channel, ...
   *
   *
   * @param {number[]} dataArray
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
  log_array_as_image_along_depth( dataArray, height, width, depth ) {
    const funcNameInMessage = "log_array_as_image";

    const length = height * width * depth;
    if ( aDataArray.length != length )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aDataArray.length ( ${aDataArray.length} ) `
        + `should be ( ${length} ) for shape `
        + `( height, width, depth ) = ( ${height}, ${width}, ${depth} ).`
      );

    const characterCountPerField = this.characterCountPerField;
    const digitCountAfterDecimalPoint = this.digitCountAfterDecimalPoint;
    const joinSeparator = this.joinSeparator;

    const workingStringArray = this.workingStringArray;

    // Log every channel (i.e. along the depth) because this format is easier
    // for human reading.

    let elementValue;
    let elementIndex;
    for ( let c = 0; c < depth; ++c, ++i ) {
      elementIndex = c;

      for ( let y = 0; y < height; ++y ) {
        workingStringArray.length = 0;

        for ( let x = 0; x < width; ++x, elementIndex += width ) {
          elementValue = dataArray[ elementIndex ];

          workingStringArray.push(
            elementValue
              .toFixed( digitCountAfterDecimalPoint )
              .padStart( characterCountPerField )
          );
        }

        const oneLine = workingStringArray.join( joinSeparator );
        console.log( oneLine );
      }

      console.log( "" ); // Separate every channel by one empty line.
    }

//!!! ...untested... (2025/06/03)

  }

}


/**
 * Parameters for TableLog_Xxx().
 */
TableLogger_Base.defaultParams = {

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
