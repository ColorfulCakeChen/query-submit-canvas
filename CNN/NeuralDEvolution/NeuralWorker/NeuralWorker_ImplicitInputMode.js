export { NeuralWorker_ImplicitInputMode as ImplicitInputMode };

import { Int } from "../../Unpacker/ValueDesc/ValueDesc_Base.js";

/*
 * Note:
 *
 * This could be a NeuralNet's parameter (instead of NeuralWorker). But that
 * has a little problem.
 *
 * Problem: In NeuralNet testing case, how to test the 
 *          implicit_input_bFillAlignmentMark and
 *          implicit_input_bFillPreviousTimeOutput?
 *
 * Solution1: Let NeuralNet has .TyedArray_process_async() method.
 *
 * Solution2: Let it become NeuralWorker's parameter
 *            NeuralWorker_ImplicitInputMode.
 *
 * Currently, the solution2 is used.
 *
 */

/** Describe id, range, name of NeuralWorker_ImplicitInputMode.
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
class NeuralWorker_ImplicitInputMode extends Int {

  constructor() {
    super( 0, 5,
      {
        IMPLICIT_INPUT__NONE___OUTPUT__AS_NORMAL:
          new NeuralWorker_ImplicitInputMode.Info( 0,
            "IMPLICIT_INPUT__NONE___OUTPUT__AS_NORMAL",
            false, false, false ),

        IMPLICIT_INPUT__NONE___OUTPUT__AS_INPUT_VALUE_RANGE:
          new NeuralWorker_ImplicitInputMode.Info( 1,
            "IMPLICIT_INPUT__NONE___OUTPUT__AS_INPUT_VALUE_RANGE",
            false, false,  true ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_NORMAL:
          new NeuralWorker_ImplicitInputMode.Info( 2,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_NORMAL",
             true, false,  false ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_INPUT_VALUE_RANGE:
          new NeuralWorker_ImplicitInputMode.Info( 3,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT__AS_INPUT_VALUE_RANGE",
             true, false,  true ),

        IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT:
          new NeuralWorker_ImplicitInputMode.Info( 4,
            "IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT",
            false,  true,  true ),

        IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT:
          new NeuralWorker_ImplicitInputMode.Info( 5,
            "IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT",
             true,  true,  true ),
      }
    );
  }


  /**
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralWorker_ImplicitInputMode.Info.implicit_input_bFillAlignmentMark
   * of the mode id.
   */
  static implicit_input_bFillAlignmentMark_get(
    nNeuralWorker_ImplicitInputModeId ) {

    let info = NeuralWorker_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );
    if ( info )
      return info.implicit_input_bFillAlignmentMark;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralWorker_ImplicitInputMode.Info.implicit_input_bFillPreviousTimeOutput
   * of the mode id.
   */
  static implicit_input_bFillPreviousTimeOutput_get(
    nNeuralWorker_ImplicitInputModeId ) {

    let info = NeuralWorker_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );
    if ( info )
      return info.implicit_input_bFillPreviousTimeOutput;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralWorker_ImplicitInputMode.Info.has_implicit_input of the mode
   * id.
   */
  static has_implicit_input_get( nNeuralWorker_ImplicitInputModeId ) {
    let info = NeuralWorker_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );
    if ( info )
      return info.has_implicit_input;
    return NaN;
  }

  /**
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @return {boolean}
   *   Return NeuralWorker_ImplicitInputMode.Info.output_asInputValueRange of the
   * mode id.
   */
   static output_asInputValueRange_get( nNeuralWorker_ImplicitInputModeId ) {
    let info = NeuralWorker_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );
    if ( info )
      return info.output_asInputValueRange;
    return NaN;
  }

}


/**
 *
 *
 * @member {boolean} implicit_input_bFillAlignmentMark
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       alignment mark.
 *
 * @member {boolean} implicit_input_bFillPreviousTimeOutput
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
 * time input. It should be true if
 * ( implicit_input_bFillPreviousTimeOutput == true ).
 *
 */
NeuralWorker_ImplicitInputMode.Info
  = class NeuralWorker_ImplicitInputMode_Info extends Int.Info {

  /**
   *
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug
   * message. This is why it is a string (so that it will not be twisted by
   * JavaScript codes compressor).
   *
   */
  constructor( nNeuralWorker_ImplicitInputModeId, nameForMessage,
    implicit_input_bFillAlignmentMark,
    implicit_input_bFillPreviousTimeOutput,
    output_asInputValueRange
  ) {
    super( nNeuralWorker_ImplicitInputModeId, nameForMessage );

    this.implicit_input_bFillAlignmentMark
      = implicit_input_bFillAlignmentMark;

    this.implicit_input_bFillPreviousTimeOutput
      = implicit_input_bFillPreviousTimeOutput;

    this.output_asInputValueRange = output_asInputValueRange;

    if ( implicit_input_bFillPreviousTimeOutput && !output_asInputValueRange )
      throw Error( 'NeuralWorker_ImplicitInputMode.Info.constructor(): '
        + `When `
        + `implicit_input_bFillPreviousTimeOutput ( `
        + `${implicit_input_bFillPreviousTimeOutput} ) `
        + `is true, `
        + `output_asInputValueRange ( ${output_asInputValueRange} ) `
        + `should also be true.`
      );
  }

  get has_implicit_input() {
    if ( this.implicit_input_bFillAlignmentMark )
      return true;
    if ( this.implicit_input_bFillPreviousTimeOutput )
      return true;
    return false;
  }

}


/** The only one NeuralWorker.ImplicitInputMode instance. */
NeuralWorker_ImplicitInputMode.Singleton = new NeuralWorker_ImplicitInputMode;
