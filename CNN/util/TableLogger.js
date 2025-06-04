export { TableLogger_Base as Base };

// import * as Pool from "./Pool.js";
// import * as Recyclable from "./Recyclable.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";

/**
 * A helper class for log object as table.
 *
 *
 * @member {string} headerPrefixEmpty
 *   When no header prefix is needed, this string could be used.
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
 * @member {string} fieldJoinSeparator
 *   The separator string (between field) when call Array.join() to generate
 * one line (one row) of the table log.
 *
 * @member {string} lineJoinSeparator
 *   The separator string (between line) when call Array.join() to generate
 * all lines of the table log.
 *
 *
 * @member {string[]} headerFields
 *   A helper string Array for generating one line of log table header. Every
 * element represents one field of a log table header line. It will be used as
 * the working buffer (so that array recreation is reduced and performance
 * might be improved).
 *
 * @member {string[]} bodyFields
 *   A helper string Array for generating one line of log table body. Every
 * element represents one field of a log table body line. It will be used as
 * the working buffer (so that array recreation is reduced and performance
 * might be improved).
 *
 * @member {string[]} tableLines
 *   A helper string Array for generating the whole log table. Every element
 * represents one line of the log table. It will be used as the working buffer
 * (so that array recreation is reduced and performance might be improved).
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

    fieldJoinSeparator
      = TableLogger_Base.defaultParams.fieldJoinSeparator,

    lineJoinSeparator
      = TableLogger_Base.defaultParams.lineJoinSeparator
  ) {

    this.headerPrefixEmpty = TableLogger_Base.defaultParams.headerPrefixEmpty;

    this.characterCountPerField = characterCountPerField;
    this.digitCountAfterDecimalPoint = digitCountAfterDecimalPoint;
    this.fieldJoinSeparator = fieldJoinSeparator;
    this.lineJoinSeparator = lineJoinSeparator;

    this.headerFields = new Array();
    this.bodyFields = new Array();
    this.tableLines = new Array();
  }

  /**
   * @param {tf.tensor3d} aTensor3d
   *   An single tf.tensor3d to be logged to console as a table.
   *
   * @param {string} imageHeaderPrefix
   *   A string will be logged before the image header.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} imageScaleBoundsArray
   *   The element value bounds (per channel) of the dataArray number array
   * (viewed as 2d image with multiple channels). It can be null (or
   * undefined).
   */
  log_tensor3d_along_depth(
    aTensor3d,
    imageHeaderPrefix,
    imageScaleBoundsArray ) {

    const funcNameInMessage = "log_tensor3d_along_depth";

    const shape = aTensor3d.shape;
    if ( shape.length != 3 )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `aTensor3d.shape ( [ ${shape} ] ) should be `
        + `Array with ( .length == 3 )`
      );

    const [ height, width, depth ] = shape;
    const dataArray = aTensor3d.dataSync();
    this.log_array_as_image_along_depth(
      dataArray,
      height, width, depth,
      imageHeaderPrefix,
      imageScaleBoundsArray );
  }

  /**
   * Log a number array (viewed as 2d image with multiple channels) as a
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
   *
   * @param {string} imageHeaderPrefix
   *   A string will be logged before the image header.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} imageScaleBoundsArray
   *   The element value bounds (per channel) of the dataArray number array
   * (viewed as 2d image with multiple channels). It can be null (or
   * undefined).
   */
  log_array_as_image_along_depth(
    dataArray,
    height, width, depth,
    imageHeaderPrefix,
    imageScaleBoundsArray
  ) {

    const funcNameInMessage = "log_array_as_image_along_depth";

    const elementCount = height * width * depth;
    if ( dataArray.length != elementCount )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `dataArray.length ( ${dataArray.length} ) `
        + `should be ( ${elementCount} ) for shape `
        + `( height, width, depth ) = ( ${height}, ${width}, ${depth} ).`
      );

    const boundsArray = imageScaleBoundsArray?.boundsArray;
    const scaleArraySet = imageScaleBoundsArray?.scaleArraySet;

    const {
      characterCountPerField,
      digitCountAfterDecimalPoint,
      fieldJoinSeparator,
      lineJoinSeparator
    } = this;

    const bodyFields = this.bodyFields;
    const tableLines = this.tableLines;

    tableLines.length = 0;

    const imageHeader = `${imageHeaderPrefix}: image `
      + `( height, width, depth ) = ( ${height}, ${width}, ${depth} )`;
    tableLines.push( imageHeader );

    // Log every channel (i.e. along the depth) because this format is easier
    // for human reading.

    let elementIndex;
    let elementValue;
    let valueString;

    for ( let c = 0; c < depth; ++c ) {

      // Separate every channel by channel header (with channel index
      // and { [ lower, upper ], .do.scale, .undo.scale }).
      let channelHeader;
      {
        const indentCount = 2;
        const indentPrefix = "".repeat( indentCount );

        channelHeader = `${indentPrefix}channel (depth) ${c}:`;
        if ( imageScaleBoundsArray ) {
          const lower = boundsArray.lowers[ c ];
          const upper = boundsArray.uppers[ c ];

          const lowerString = lower
            .toFixed( digitCountAfterDecimalPoint );
          const upperString = upper
            .toFixed( digitCountAfterDecimalPoint );

          const scaleDo = scaleArraySet.do.scales[ c ];
          const scaleUndo = scaleArraySet.undo.scales[ c ];

          const scaleDoString = scaleDo
            .toFixed( digitCountAfterDecimalPoint );
          const scaleUndoString = scaleUndo
            .toFixed( digitCountAfterDecimalPoint );

          channelHeader += ` `
            + `[ ${lowerString}, ${upperString} ] = `
            + `[ lower, upper ], `
            + `{ ${scaleDoString}, ${scaleUndoString} } = `
            + `{ do.scale, undo.scale }`

//!!! (2025/06/04 Remarked) try compact table log channel format.
            // + `[ .lower, .upper ] = [ ${lowerString}, ${upperString} ], `
            // + `.do.scale=${scaleDoString}, `
            // + `.undo.scale=${scaleUndoString}`

            ;
        }

        tableLines.push( channelHeader );
      }

      elementIndex = c;

      for ( let y = 0; y < height; ++y ) {
        bodyFields.length = 0;

        for ( let x = 0; x < width; ++x, elementIndex += depth ) {
          elementValue = dataArray[ elementIndex ];

          valueString
            = elementValue
                .toFixed( digitCountAfterDecimalPoint )
                .padStart( characterCountPerField );

          bodyFields.push( valueString );
        }

        const oneLine = bodyFields.join( fieldJoinSeparator );
        tableLines.push( oneLine );
      }
    }

    // Log all lines in one time to avoid logging too quickily. (If log too
    // quickly, some log will be abbreviated.)
    const tableText = tableLines.join( lineJoinSeparator );
    console.log( tableText );
  }

}


/**
 * Default parameters for TableLog_Xxx().
 */
TableLogger_Base.defaultParams = {

  // When no header prefix is needed, this string could be used.
  headerPrefixEmpty: "",

  // The width of a column of the table log.
  characterCountPerField: 20,

  // How many digits (after the decimal point) should be displayed when
  // outputting a number to the table log.
  digitCountAfterDecimalPoint: 10,

  // The separator string (between field) when call Array.join() to generate
  // one line (one row) of the table log.
  fieldJoinSeparator: " ",

  // The separator string (between line) when call Array.join() to generate
  // all lines of the table log.
  lineJoinSeparator: "\n",
};


/**
 * A static singleton TableLogger object.
 */
TableLogger_Base.Singleton = new TableLogger_Base(
  TableLogger_Base.defaultParams.characterCountPerField,
  TableLogger_Base.defaultParams.digitCountAfterDecimalPoint,
  TableLogger_Base.defaultParams.fieldJoinSeparator,
  TableLogger_Base.defaultParams.lineJoinSeparator,
);
