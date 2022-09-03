export { Devolution_VersusSubmitter as VersusSubmitter };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { VersusId } from "../../util/DEvolution_VersusId.js";

//!!! ...unfinished... (2022/09/03)
// For measurement protocol.
// Perhaps,
//   - trancactionId = `t${versusId}`
//   - itemId = versusId
//

/**
 * 
 */
class Devolution_VersusSubmitter extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusSubmitter provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusSubmitter.Pool",
    Devolution_VersusSubmitter, Devolution_VersusSubmitter.setAsConstructor );

  /** */
  constructor( api_secret, measurement_id ) {
    super();
    Devolution_VersusSubmitter.setAsConstructor_self.call( this,
      api_secret, measurement_id );
  }

  /** @override */
  static setAsConstructor( api_secret, measurement_id ) {
    super.setAsConstructor();
    Devolution_VersusSubmitter.setAsConstructor_self.call( this,
      api_secret, measurement_id );
    return this;
  }

  /** @override */
  static setAsConstructor_self( api_secret, measurement_id ) {
    this.api_secret = api_secret;
    this.measurement_id = measurement_id;
  }

  /** @override */
  disposeResources() {
    this.measurement_id = undefined;
    this.api_secret = undefined;
    super.disposeResources();
  }


}
