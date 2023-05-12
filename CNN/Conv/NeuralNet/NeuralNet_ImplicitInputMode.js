export { NeuralNet_ImplicitInputMode as ImplicitInputMode };

import { Int } from "../../Unpacker/ValueDesc/ValueDesc_Base.js";


//!!! ...unfinished... (2023/05/12)
// alignmentMarkValueArray can NOT be placed here because
// alignemt mark value should be changable during the lifetime
// of a neural network.


//!!! ...unfinished... (2023/05/12)

/** Describe id, range, name of NeuralNet_ImplicitInputMode.
 *
 * Convert number value into integer between [ 0, 5 ] representing neural
 * network's implicit input mode:
 *
 *   -  0: IMPLICIT_INPUT__NONE___OUTPUT__AS_NORMAL
 *   -  1: IMPLICIT_INPUT__NONE___OUTPUT__AS_INPUT_VALUE_RANGE
 *   -  2: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_NORMAL
 *   -  3: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_INPUT_VALUE_RANGE
 *   -  4: IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT
 *   -  5: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT
 *
 */
class NeuralNet_ImplicitInputMode extends Int {

  constructor() {
    super( 0, 5,
      {
        IMPLICIT_INPUT__NONE___OUTPUT__AS_NORMAL:
          new NeuralNet_ImplicitInputMode.Info( 0,
            "IMPLICIT_INPUT__NONE___OUTPUT__AS_NORMAL",
            false, false, false ),

        IMPLICIT_INPUT__NONE___OUTPUT__AS_INPUT_VALUE_RANGE:
          new NeuralNet_ImplicitInputMode.Info( 1,
            "IMPLICIT_INPUT__NONE___OUTPUT__AS_INPUT_VALUE_RANGE",
            false, false,  true ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_NORMAL:
          new NeuralNet_ImplicitInputMode.Info( 2,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_NORMAL",
             true, false,  false ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_INPUT_VALUE_RANGE:
          new NeuralNet_ImplicitInputMode.Info( 3,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_INPUT_VALUE_RANGE",
             true, false,  true ),

        IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT:
          new NeuralNet_ImplicitInputMode.Info( 4,
            "IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT",
            false,  true,  true ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT:
          new NeuralNet_ImplicitInputMode.Info( 5,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT",
             true,  true,  true ),

      }
    );
  }


  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralNet_ImplicitInputMode.Info.bFillAlignmentMark of the mode
   * id.
   */
  static bFillAlignmentMark_get( nNeuralNet_ImplicitInputModeId ) {
    let info = NeuralNet_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralNet_ImplicitInputModeId );
    if ( info )
      return info.bFillAlignmentMark;
    return NaN;
  }

  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralNet_ImplicitInputMode.Info.bFillPreviousTimeOutput of the
   * mode id.
   */
  static bFillPreviousTimeOutput_get( nNeuralNet_ImplicitInputModeId ) {
    let info = NeuralNet_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralNet_ImplicitInputModeId );
    if ( info )
      return info.bFillPreviousTimeOutput;
    return NaN;
  }

  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralNet_ImplicitInputMode.Info.has_implicit_input of the mode
   * id.
   */
  static has_implicit_input_get( nNeuralNet_ImplicitInputModeId ) {
    let info = NeuralNet_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralNet_ImplicitInputModeId );
    if ( info )
      return info.has_implicit_input;
    return NaN;
  }

  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralNet_ImplicitInputMode.Info.output_asInputValueRange of the
   * mode id.
   */
   static output_asInputValueRange_get( nNeuralNet_ImplicitInputModeId ) {
    let info = NeuralNet_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralNet_ImplicitInputModeId );
    if ( info )
      return info.output_asInputValueRange;
    return NaN;
  }

}


/**
 *
 *
 * @member {boolean} bFillAlignmentMark
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       alignment mark.
 *
 * @member {boolean} bFillPreviousTimeOutput
 *   - If true, there will be extra space in the input image for filling
 *       previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *     - In this case, the .output_asInputValueRange should also be true so
 *         that the previous time output is suitable for feedback.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       previous time output.
 *
 * @member {boolean} has_implicit_input
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be 0.
 *
 * @member {boolean} output_asInputValueRange
 *   If true, restrict output value to the (neural network) input value range
 * (i.e. non-negative integer which can be used in embedding looking up). This
 * is useful if the output will be used as the recurrent feedback of the next
 * time input. It should be true if ( bFillPreviousTimeOutput == true ).
 *
 */
NeuralNet_ImplicitInputMode.Info
  = class NeuralNet_ImplicitInputMode_Info extends Int.Info {

  /**
   *
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug
   * message. This is why it is a string (so that it will not be twisted by
   * JavaScript codes compressor).
   *
   */
  constructor( nNeuralNet_ImplicitInputModeId, nameForMessage,
    bFillAlignmentMark, bFillPreviousTimeOutput, output_asInputValueRange
  ) {
    super( nNeuralNet_ImplicitInputModeId, nameForMessage );

    this.bFillAlignmentMark = bFillAlignmentMark;
    this.bFillPreviousTimeOutput = bFillPreviousTimeOutput;
    this.output_asInputValueRange = output_asInputValueRange;

    if ( bFillPreviousTimeOutput && !output_asInputValueRange )
      throw Error( 'NeuralNet_ImplicitInputMode.Info.constructor(): '
        + `When `
        + `bFillPreviousTimeOutput ( ${bFillPreviousTimeOutput} ) `
        + `is true, `
        + `output_asInputValueRange ( ${output_asInputValueRange} ) `
        + `should also be true.`
      );
  }

  get has_implicit_input() {
    if ( this.bFillAlignmentMark )
      return true;
    if ( this.bFillPreviousTimeOutput )
      return true;
    return false;
  }

}


/** The only one NeuralNet.ImplicitInputMode instance. */
NeuralNet_ImplicitInputMode.Singleton = new NeuralNet_ImplicitInputMode;
