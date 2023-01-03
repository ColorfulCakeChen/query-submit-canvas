export { DEvolution_VersusSubmitter_MultiMeasurementId as MultiMeasurementId };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import { Base as DEvolution_VersusSubmitter_Base }
  from "./DEvolution_VersusSubmitter_Base.js";

/**
 * 
 *
 * 
 * @member {string} client_id
 *   The client id when sending measurement protocol.
 *
 * @member {string[][]} measurementId_apiSecret_array_array
 *   An array of string array. Every string array should have two elements as
 * [ measurement_id, api_secret ] for the streams of property of Google Analytics v4.
 */
class DEvolution_VersusSubmitter_MultiMeasurementId
  extends DEvolution_VersusSubmitter_Base {

  /**
   * Used as default DEvolution.VersusSubmitter.MultiMeasurementId
   * provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "DEvolution.VersusSubmitter.MultiMeasurementId.Pool",
    DEvolution_VersusSubmitter_MultiMeasurementId,
    DEvolution_VersusSubmitter_MultiMeasurementId.setAsConstructor );

  /** */
  constructor( client_id, measurementId_apiSecret_array_array ) {
    super( client_id );
    DEvolution_VersusSubmitter_MultiMeasurementId
      .setAsConstructor_self.call( this,
        measurementId_apiSecret_array_array );
  }

  /** @override */
  static setAsConstructor( client_id, measurementId_apiSecret_array_array ) {
    super.setAsConstructor( client_id );
    DEvolution_VersusSubmitter_MultiMeasurementId
      .setAsConstructor_self.call( this,
        measurementId_apiSecret_array_array );
    return this;
  }

  /** @override */
  static setAsConstructor_self( measurementId_apiSecret_array_array ) {
    this.measurementId_apiSecret_map = new Map(
      measurementId_apiSecret_array_array );
  }

  /** @override */
  disposeResources() {
    this.measurementId_apiSecret_map = undefined;
    super.disposeResources();
  }

  /**
   * The api_secret will be looked up from .measurementId_apiSecret_map
   *
   * @param {string} measurement_id
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {object} postBodyObject
   *   An object which will be converted to string by JSON.stringify() and then
   * be sent to server by HTTP POST method.
   */
  post_by_measurementId_bodyObject(
    measurement_id, postBodyObject ) {

    let api_secret = this.measurementId_apiSecret_map.get( measurement_id );

    DEvolution_VersusSubmitter_Base.post_by_measurementId_apiSecret_bodyObject(
      measurement_id, api_secret, postBodyObject );
  }

}
