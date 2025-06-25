export { TableLogger_Base as Base };

// import * as Pool from "./Pool.js";
// import * as Recyclable from "./Recyclable.js";
import * as FloatValue from "../Unpacker/FloatValue.js";
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
 *
 * @member {string[]} subheaderFields
 *   A helper string Array for generating one line of log table subheader.
 * Every element represents one field of a subheader line. It will be used as
 * the working buffer (so that array recreation is reduced and performance
 * might be improved).
 *
 * @member {string[]} subheaderLines
 *   A helper string Array for generating the subheader of log table. Every
 * element represents one line of the subheader. It will be used as the
 * working buffer (so that array recreation is reduced and performance might
 * be improved).
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

    // Used for channel number header.
    this.channelNumberIndentCount = 2;
    this.channelNumberIndentPrefix = " ".repeat( this.channelNumberIndentCount );
    this.channelNumberDigitCountAfterDecimalPoint = 0; // i.e. integer
    this.channelNumberCharacterCount = 2;

    this.headerFields = new Array();
    this.bodyFields = new Array();
    this.tableLines = new Array();
    this.subheaderFields = new Array();
    this.subheaderLines = new Array();
  }

  /**
   * @param {string} strImageHeaderPrefix
   *   A string will be logged before the image header.
   *
   * @param {string} strSubheader
   *   A string will be logged between image header and data array. If null or
   * undefined, there is no subheader.
   *
   * @param {tf.tensor3d} aTensor3d
   *   An single tf.tensor3d to be logged to console as a table.
   *
   * @param {FloatValue.BoundsArray|ActivationEscaping.ScaleBoundsArray} aBoundsArray_or_aScaleBoundsArray
   *   The element value bounds (per channel) of the dataArray number array
   * (viewed as 2d image with multiple channels). It can be null (or
   * undefined).
   */
  log_tensor3d_along_depth(
    strImageHeaderPrefix,
    strSubheader,
    aTensor3d,
    aBoundsArray_or_aScaleBoundsArray ) {

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
      strImageHeaderPrefix, strSubheader,
      dataArray,
      height, width, depth,
      aBoundsArray_or_aScaleBoundsArray );
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
   * @param {string} strImageHeaderPrefix
   *   A string will be logged before the image header.
   *
   * @param {string} strSubheader
   *   A string will be logged between image header and data array. If null or
   * undefined, there is no subheader.
   *
   * @param {number[]} dataArray
   *   A 1d (one-dimension) number array (which will be viewed as a 3d number
   * array) to be logged to console.
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
   * @param {FloatValue.BoundsArray|ActivationEscaping.ScaleBoundsArray} aBoundsArray_or_aScaleBoundsArray
   *   The element value bounds (per channel) of the dataArray number array
   * (viewed as 2d image with multiple channels). It can be null (or
   * undefined).
   */
  log_array_as_image_along_depth(
    strImageHeaderPrefix,
    strSubheader,
    dataArray,
    height, width, depth,
    aBoundsArray_or_aScaleBoundsArray
  ) {

    const funcNameInMessage
      = "log_array_as_image_along_depth";

    const elementCount = height * width * depth;
    if ( dataArray.length != elementCount )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `dataArray.length ( ${dataArray.length} ) `
        + `should be ( ${elementCount} ) for shape `
        + `( height, width, depth ) = ( ${height}, ${width}, ${depth} ).`
      );

    // Determine bounds array.
    let boundsArray;
    let scaleArraySet;

    let aScaleBoundsArray;
    let aBoundsArray;
    if ( aBoundsArray_or_aScaleBoundsArray
           instanceof ActivationEscaping.ScaleBoundsArray ) {
      aScaleBoundsArray = aBoundsArray_or_aScaleBoundsArray;
      boundsArray = aScaleBoundsArray.boundsArray;
      scaleArraySet = aScaleBoundsArray.scaleArraySet;

    } else if ( aBoundsArray_or_aScaleBoundsArray
                  instanceof FloatValue.BoundsArray ) {
      aBoundsArray = aBoundsArray_or_aScaleBoundsArray;
      boundsArray = aBoundsArray;
    }

    const {
      characterCountPerField,
      digitCountAfterDecimalPoint,
      fieldJoinSeparator,
      lineJoinSeparator,

      channelNumberIndentPrefix,
      channelNumberDigitCountAfterDecimalPoint,
      channelNumberCharacterCount,
    } = this;

    const bodyFields = this.bodyFields;
    const tableLines = this.tableLines;

    tableLines.length = 0;

    const imageHeader = `${strImageHeaderPrefix}: image `
      + `( height, width, depth ) = ( ${height}, ${width}, ${depth} )`;
    tableLines.push( imageHeader );

    if ( strSubheader )
      tableLines.push( strSubheader );

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
        const channelNumber = c
          .toFixed( channelNumberDigitCountAfterDecimalPoint )
          .padStart( channelNumberCharacterCount );

        channelHeader
          = `${channelNumberIndentPrefix}channel ${channelNumber}:`;

        if ( boundsArray ) {
          const lower = boundsArray.lowers[ c ];
          const upper = boundsArray.uppers[ c ];

          const lowerString = lower
            .toFixed( digitCountAfterDecimalPoint );
          const upperString = upper
            .toFixed( digitCountAfterDecimalPoint );

          channelHeader += ` `
            + `[ ${lowerString}, ${upperString} ] = `
            + `[ lower, upper ]`
            ;
        }

        if ( scaleArraySet ) {
          const scaleDo = scaleArraySet.do.scales[ c ];
          const scaleUndo = scaleArraySet.undo.scales[ c ];

          const scaleDoString = scaleDo
            .toFixed( digitCountAfterDecimalPoint );
          const scaleUndoString = scaleUndo
            .toFixed( digitCountAfterDecimalPoint );

          channelHeader += `, `
            + `{ ${scaleDoString}, ${scaleUndoString} } = `
            + `{ do.scale, undo.scale }`
            ;
        }

        tableLines.push( channelHeader );
      }

      elementIndex = c;

      for ( let y = 0; y < height; ++y ) {
        bodyFields.length = 0;

        for ( let x = 0; x < width; ++x, elementIndex += depth ) {
          elementValue = dataArray[ elementIndex ];

          valueString = elementValue
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

  /**
   * (Note: the content of .subheaderFields and .subheaderLines will be destroyed.)
   *
   * @param {number[]} dataArray
   *   A 1d (one-dimension) number array (which will be viewed as a 4d number
   * array with shape [ filterHeight, filterWidth, inChannels,
   * channelMultiplier]) to be logged to console.
   *
   * @param {number} filterHeight
   * @param {number} filterWidth
   * @param {number} inChannels
   * @param {number} channelMultiplier
   *
   * @return {string}
   *   Create and return a string describing a number array (viewed as a
   * depthwise convolution filter).
   */
  subheader_create_for_depthwiseFilters(
    dataArray,
    filterHeight, filterWidth, inChannels, channelMultiplier
  ) {

    const funcNameInMessage = "subheader_create_for_depthwiseFilters";

    const outChannels = inChannels * channelMultiplier;
    const elementCount = filterHeight * filterWidth * outChannels;

    if ( dataArray.length != elementCount )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `dataArray.length ( ${dataArray.length} ) `
        + `should be ( ${elementCount} ) for shape `
        + `[ filterHeight, filterWidth, inChannels, channelMultiplier ] = `
        + `[ ${filterHeight}, ${filterWidth}, ${inChannels}, ${channelMultiplier} ].`
      );

    const {
      characterCountPerField,
      digitCountAfterDecimalPoint,
      fieldJoinSeparator,
      lineJoinSeparator,

      channelNumberIndentPrefix,
      channelNumberDigitCountAfterDecimalPoint,
      channelNumberCharacterCount,
    } = this;

    const subheaderFields = this.subheaderFields;
    const subheaderLines = this.subheaderLines;

    subheaderLines.length = 0;

    // Log every input channel (of every output channel) because this format
    // is easier for human reading.

    let elementIndex;
    let elementValue;
    let valueString;

    let outChannel = 0;
    for ( let inChannel = 0; inChannel < inChannels; ++inChannel ) {

      const strInChannelNumber = inChannel
        .toFixed( channelNumberDigitCountAfterDecimalPoint )
        .padStart( channelNumberCharacterCount );

      for ( let outChannelSub = 0;
        outChannelSub < channelMultiplier;
        ++outChannelSub, ++outChannel ) {

        elementIndex = outChannel;

        // Separate every output channel by channel header (with channel index).
        {
          const strOutChannelNumber = outChannel
            .toFixed( channelNumberDigitCountAfterDecimalPoint )
            .padStart( channelNumberCharacterCount );

          const channelHeader = `${channelNumberIndentPrefix}filter `
            + `input channel ${strInChannelNumber}: `
            + `output channel ${strOutChannelNumber}:`;

          subheaderLines.push( channelHeader );
        }

        for ( let filterY = 0; filterY < filterHeight; ++filterY ) {
          subheaderFields.length = 0;

          for ( let filterX = 0; filterX < filterWidth; ++filterX ) {
            elementValue = dataArray[ elementIndex ];

            valueString = elementValue
              .toFixed( digitCountAfterDecimalPoint )
              .padStart( characterCountPerField );

            subheaderFields.push( valueString );
            elementIndex += outChannels;
          }

          const oneLine = subheaderFields.join( fieldJoinSeparator );
          subheaderLines.push( oneLine );
        }
      }
    }

    const subheader = subheaderLines.join( lineJoinSeparator );
    return subheader;
  }

  /**
   * (Note: the content of .subheaderFields and .subheaderLines will be destroyed.)
   *
   * @param {number[]} dataArray
   *   A 1d (one-dimension) number array (which will be viewed as a 4d number
   * array with shape [ 1, 1, inDepth, outDepth]) to be logged to console.
   *
   * @param {number} inDepth 
   *   The input channel count of the pointwise covolution.
   *
   * @param {number} outDepth 
   *   The output channel count of the pointwise covolution.
   *
   * @return {string}
   *   Create and return a string describing a number array (viewed as a
   * pointwise convolution filter).
   */
  subheader_create_for_pointwiseFilters(
    dataArray, inDepth, outDepth ) {

    const funcNameInMessage = "subheader_create_for_pointwiseFilters";

    const elementCount = inDepth * outDepth;
    if ( dataArray.length != elementCount )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `dataArray.length ( ${dataArray.length} ) `
        + `should be ( ${elementCount} ) for shape `
        + `[ filterHeight, filterWidth, inDepth, outDepth ] = `
        + `[ 1, 1, ${inDepth}, ${outDepth} ].`
      );

    const {
      characterCountPerField,
      digitCountAfterDecimalPoint,
      // fieldJoinSeparator,
      lineJoinSeparator,

      channelNumberIndentPrefix,
      channelNumberDigitCountAfterDecimalPoint,
      channelNumberCharacterCount,
    } = this;

    const subheaderLines = this.subheaderLines;
    subheaderLines.length = 0;

    // Log every input channel (of every output channel) because this format
    // is easier for human reading.

    let elementIndex;
    let elementValue;
    let valueString;

    for ( let outChannel = 0; outChannel < outDepth; ++outChannel ) {
      elementIndex = outChannel;

      // Separate every output channel by channel header (with channel index).
      {
        const strOutChannelNumber = outChannel
          .toFixed( channelNumberDigitCountAfterDecimalPoint )
          .padStart( channelNumberCharacterCount );

        const channelHeader = `${channelNumberIndentPrefix}filter `
          + `output channel ${strOutChannelNumber}:`;

        subheaderLines.push( channelHeader );
      }

      for ( let inChannel = 0; inChannel < inDepth; ++inChannel ) {
        elementValue = dataArray[ elementIndex ];

        valueString = elementValue
          .toFixed( digitCountAfterDecimalPoint )
          .padStart( characterCountPerField );

        subheaderLines.push( valueString );
        elementIndex += outDepth;
      }
    }

    const subheader = subheaderLines.join( lineJoinSeparator );
    return subheader;
  }

  /**
   * (Note: the content of .subheaderFields and .subheaderLines will be destroyed.)
   *
   * @param {number[]} dataArray
   *   A 1d (one-dimension) number array (which will be viewed as a 1d number
   * array) to be logged to console.
   *
   * @param {number} channelCount
   *   How many elements the dataArray has.
   *
   * @return {string}
   *   Create and return a string describing a number array (viewed as the
   * biases for all output channels).
   */
  subheader_create_for_biases(
    dataArray,
    channelCount
  ) {

    const funcNameInMessage = "subheader_create_for_biases";

    const elementCount = channelCount;
    if ( dataArray.length != elementCount )
      throw Error( `TableLogger_Base.${funcNameInMessage}(): `
        + `dataArray.length ( ${dataArray.length} ) `
        + `should be ( ${elementCount} ) for shape `
        + `[ channelCount ] = `
        + `[ ${channelCount} ].`
      );

    const {
      characterCountPerField,
      digitCountAfterDecimalPoint,
      // fieldJoinSeparator,
      lineJoinSeparator,

      channelNumberIndentPrefix,
      channelNumberDigitCountAfterDecimalPoint,
      channelNumberCharacterCount,
    } = this;

    const subheaderLines = this.subheaderLines;
    subheaderLines.length = 0;

    let elementIndex;
    let elementValue;
    let valueString;

    for ( let outChannel = 0; outChannel < channelCount; ++outChannel ) {

      const strOutChannelNumber = outChannel
        .toFixed( channelNumberDigitCountAfterDecimalPoint )
        .padStart( channelNumberCharacterCount );

      elementIndex = outChannel;
      elementValue = dataArray[ elementIndex ];

      valueString = elementValue
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField );

      // Compose channel number and bias value at the same line (for reducing
      // log verbose).
      const channelHeader_value = `${channelNumberIndentPrefix}bias `
        + `channel ${strOutChannelNumber}: ${valueString}`;

      subheaderLines.push( channelHeader_value );
    }

    const subheader = subheaderLines.join( lineJoinSeparator );
    return subheader;
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
