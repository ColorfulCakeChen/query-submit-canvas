export { InferencedParams };

import * as Pool from "../../util/Pool.js";

/**
 * All properties inferenced from Embedding.Params.
 *
 * 
 * @member {number} output_channelCount
 *   Output channel count. It is always depending on channelMultiplier and equals to ( input_channelCount * channelMultiplier ).
 *
 */
class InferencedParams extends Recyclable.Root {

  /**
   * Used as default Embedding.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.InferencedParams.Pool", InferencedParams, InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor( input_channelCount, channelMultiplier ) {
    super();
    InferencedParams.set_inferencedParams_by.call( this,
      input_channelCount, channelMultiplier
    );
  }

  /** @override */
  static setAsConstructor( input_channelCount, channelMultiplier ) {
    super.setAsConstructor();
    InferencedParams.set_inferencedParams_by.call( this,
      input_channelCount, channelMultiplier
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( input_channelCount, channelMultiplier ) {
    InferencedParams.set_inferencedParams_by.call( this,
      input_channelCount, channelMultiplier
    );
  }

  /** @override */
  disposeResources() {
    this.output_channelCount = undefined;
    super.disposeResources();
  }

  /**
   * Determine the following properties:
   *   - this.output_channelCount
   *
   */
  static set_output_channelCount_by( input_channelCount, channelMultiplier ) {
    this.output_channelCount = input_channelCount * channelMultiplier;
  }

  /**
   *
   */
  static set_inferencedParams_by( input_channelCount, channelMultiplier ) {
    InferencedParams.set_output_channelCount.call( this,
      input_channelCount, channelMultiplier
    );
  }

}