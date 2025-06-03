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
    TableLogger_Base.log_array_as_image( dataArray, height, width, depth );
  }


  /**
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
   *
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {number} digitCountAfterDecimalPoint
   *   Every returned string (if its original value is a number) should be
   * formatted as so many digits after its decimal point.
   *
   * @param {string} joinSeparator
   *   The separator string when call Array.join() to generate one line (one
   * row) of the table log.
   *
   * @param {string[]} io_workingStringArray
   *   A helper string Array. If provided (i.e. not undefined), it will be
   * used as the working buffer (so that array recreation is reduced and
   * performance might be improved). If undefined, a new string array will
   * be created and discarded.
   */
  static log_array_as_image(
    dataArray,
    height, width, depth,

    characterCountPerField,
    digitCountAfterDecimalPoint,
    joinSeparator,

    io_workingStringArray = new Array()
  ) {
    const funcNameInMessage = "log_array_as_image";

    const length = height * width * depth;
    if ( aDataArray.length != length )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aDataArray.length ( ${aDataArray.length} ) `
        + `should be ( ${length} ) for shape `
        + `( height, width, depth ) = ( ${height}, ${width}, ${depth} ).`
      );

    // Log every channel (i.e. along the depth) because this format is easier
    // for human reading.

//    const 
    let elementValue;
    let elementIndex;
    for ( let c = 0; c < depth; ++c, ++i ) {
      elementIndex = c;

      for ( let y = 0; y < height; ++y ) {
        io_workingStringArray.length = 0;

        for ( let x = 0; x < width; ++x, elementIndex += width ) {
          elementValue = dataArray[ elementIndex ];

          io_workingStringArray.push(
            elementValue
              .toFixed( digitCountAfterDecimalPoint )
              .padStart( characterCountPerField )
          );
        }

        const oneLine = io_workingStringArray.join( joinSeparator );
        console.log( oneLine );

//!!! ...unfinished... (2025/06/03)

      }
    }

  }

!!!

//!!! ...untested... (2025/05/28)
  /**
   * Log .input0, .input1, .output0, .output1 of this object as a table.
   *
   * @param {string[]} io_workingStringArray0
   *   A helper string Array. If provided (i.e. not undefined), it will be
   * used as the working buffer (so that array recreation is reduced and
   * performance might be improved). If undefined, a new string array will
   * be created.
   *
   * @param {string[]} io_workingStringArray1
   *   A helper string Array. If provided (i.e. not undefined), it will be
   * used as the working buffer (so that array recreation is reduced and
   * performance might be improved). If undefined, a new string array will
   * be created.
   */
  TableLog_header_body(
    io_workingStringArray0 = new Array(),
    io_workingStringArray1 = new Array()
  ) {
    // 1.
    {
      const headerPrefix_input0 = ".input0";
      InputsOutputs.helper_TableLog_ScaleBoundsArray(
        this.input0, headerPrefix_input0,
        io_workingStringArray0, io_workingStringArray1 );
    }

    // 2.
    if ( this.input1 ) {
      const headerPrefix_input1 = ".input1";
      InputsOutputs.helper_TableLog_ScaleBoundsArray(
        this.input1, headerPrefix_input1,
        io_workingStringArray0, io_workingStringArray1 );
    }

    // 3.
    {
      const headerPrefix_output0 = ".output0";
      InputsOutputs.helper_TableLog_ScaleBoundsArray(
        this.output0, headerPrefix_output0,
        io_workingStringArray0, io_workingStringArray1 );
    }

    // 4.
    if ( this.output1 ) {
      const headerPrefix_output1 = ".output1";
      InputsOutputs.helper_TableLog_ScaleBoundsArray(
        this.output1, headerPrefix_output1,
        io_workingStringArray0, io_workingStringArray1 );
    }
  }

!!!
//!!! ...untested... (2025/05/28)
  /**
   * Return strings for all the values displayed in one line (i.e. one row)
   * when logging this object as a table.
   *
   * @param {String[]} out_stringArray
   *   The output string array. All the returned values (i.e. every column of
   * one row) should be pushed at its end (in order).
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {number} digitCountAfterDecimalPoint
   *   Every returned string (if its original value is a number) should be
   * formatted as so many digits after its decimal point.
   *
   * @param {number} rowIndex
   *   Which line of the log table should be returned. It is an integer index
   * into .lowers[] and .uppers[].
   */
  TableLog_body_appendColumns( out_stringArray,
    characterCountPerField,
    digitCountAfterDecimalPoint,
    rowIndex
   ) {
    out_stringArray.push(
      this.lowers[ rowIndex ]
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField ),
      this.uppers[ rowIndex ]
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField )
    );
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
