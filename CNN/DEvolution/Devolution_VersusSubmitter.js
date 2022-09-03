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
 *
 *
 * @member {string} measurement_id
 *   The measurement id of stream of property of Google Analytics v4.
 *
 * @member {string} api_secret
 *   The measurement api secret of stream of property of Google Analytics v4.
 * 
 * @member {string} client_id
 *   The client id when sending measurement protocol.
 */
class Devolution_VersusSubmitter extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusSubmitter provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusSubmitter.Pool",
    Devolution_VersusSubmitter, Devolution_VersusSubmitter.setAsConstructor );

  /** */
  constructor( measurement_id, api_secret, client_id ) {
    super();
    Devolution_VersusSubmitter.setAsConstructor_self.call( this,
      measurement_id, api_secret, client_id );
  }

  /** @override */
  static setAsConstructor( measurement_id, api_secret, client_id ) {
    super.setAsConstructor();
    Devolution_VersusSubmitter.setAsConstructor_self.call( this,
      measurement_id, api_secret, client_id );
    return this;
  }

  /** @override */
  static setAsConstructor_self( measurement_id, api_secret, client_id ) {
    this.measurement_id = measurement_id;
    this.api_secret = api_secret;
    this.client_id = client_id;
  }

  /** @override */
  disposeResources() {
    this.client_id = undefined;
    this.api_secret = undefined;
    this.measurement_id = undefined;
    super.disposeResources();
  }


}
