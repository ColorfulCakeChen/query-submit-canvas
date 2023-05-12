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
 *   -  0: IMPLICIT_INPUT__NONE
 *   -  1: IMPLICIT_INPUT__NONE___OUTPUT_AS_INPUT_VALUE_RANGE
 *   -  2: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK
 *   -  3: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK___OUTPUT_AS_INPUT_VALUE_RANGE
 *   -  4: IMPLICIT_INPUT__FILL_PRREVIOUS_TIME_OUTPUT
 *   -  5: IMPLICIT_INPUT__FILL_ALIGNNNNNMENT_MARK__FILL_PRREVIOUS_TIME_OUTPUT
 *
 */
class NeuralNet_ImplicitInputMode extends Int {

  constructor() {
    super( 0, 3,
      {
        ONE_WORKER__TWO_NET:
          new NeuralNet_ImplicitInputMode.Info( 0,
            "ONE_WORKER__TWO_NET",          1, 2, undefined ),

        TWO_WORKER__TWO_NET__APPLY:
          new NeuralNet_ImplicitInputMode.Info( 1,
            "TWO_WORKER__TWO_NET__APPLY",   2, 2,      true ),

        TWO_WORKER__TWO_NET__APPLIER:
          new NeuralNet_ImplicitInputMode.Info( 2,
            "TWO_WORKER__TWO_NET__APPLIER", 2, 2,     false ),

        ONE_WORKER__ONE_NET:
          new NeuralNet_ImplicitInputMode.Info( 3,
            "ONE_WORKER__ONE_NET",          1, 1, undefined ),
      }
    );
  }


  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of NeuralNet_ImplicitInputMode.
   * (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   - If true, there will be extra space in the input image for filling
   *       alignment mark and/or previous time output.
   *
   *     - .inferencedParams.implicit_input_Xxx will be non-zero.
   *
   *     - In this case, the .output_asInputValueRange should also be true so
   *         that the previous time output is suitable for feedback.
   *
   *   - If false, there will be no extra space in the input image for filling
   *       alignment mark and/or previous time output.
   *
   *     - .inferencedParams.implicit_input_Xxx will be 0.
   *
   */
  static has_implicit_input_get( nNeuralNet_ImplicitInputModeId ) {
    let info = NeuralNet_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralNet_ImplicitInputModeId );
    if ( info )
      return info.v;
    return NaN;
  }
 
  /**
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The numeric identifier of NeuralNet_ImplicitInputMode.
   * (NeuralWorker.Mode.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   If true, restrict output value to the (neural network) input value range
   * (i.e. non-negative integer which can be used in embedding looking up). This
   * is useful if the output will be used as the recurrent feedback of the next
   * time input. It should be true if ( has_implicit_input == true ).
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
 *
 *
 * @member {boolean} bFillPreviousOutput
 *
 *
 * @member {boolean} has_implicit_input
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *     - In this case, the .output_asInputValueRange should also be true so
 *         that the previous time output is suitable for feedback.
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
 * time input. It should be true if ( has_implicit_input == true ).
 *
 */
NeuralNet_ImplicitInputMode.Info
  = class NeuralNet_ImplicitInputMode_Info extends Int.Info {

  /**
   *
   * @param {number} nNeuralNet_ImplicitInputModeId
   *   The neural worker mode id (NeuralNet.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug
   * message. This is why it is a string (so that it will not be twisted by
   * JavaScript codes compressor).
   *
   */
  constructor( nNeuralNet_ImplicitInputModeId, nameForMessage,
    has_implicit_input, output_asInputValueRange
  ) {
    super( nNeuralNet_ImplicitInputModeId, nameForMessage );

    this.workerCount = workerCount;
    this.has_implicit_input = has_implicit_input;
    this.output_asInputValueRange = output_asInputValueRange;
  }

}


/** The only one NeuralNet.ImplicitInputMode instance. */
NeuralNet_ImplicitInputMode.Singleton = new NeuralNet_ImplicitInputMode;
