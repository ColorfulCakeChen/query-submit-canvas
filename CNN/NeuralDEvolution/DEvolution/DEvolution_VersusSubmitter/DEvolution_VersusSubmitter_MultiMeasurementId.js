export { DEvolution_VersusSubmitter_MultiMeasurementId as MultiMeasurementId };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import { Base as DEvolution_VersusSubmitter_Base }
  from "./DEvolution_VersusSubmitter_Base.js";

/**
 * 
 *
 * 
 * @member {string} clientId
 *   The client id when sending measurement protocol.
 *
 * @member {string[][]} measurementId_apiSecret_array_array
 *   An array of string array. Every string array should have two elements as
 * [ measurementId, apiSecret ] for the streams of property of Google Analytics v4.
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
  constructor( clientId, measurementId_apiSecret_array_array ) {
    super( clientId );
    DEvolution_VersusSubmitter_MultiMeasurementId
      .setAsConstructor_self.call( this,
        measurementId_apiSecret_array_array );
  }

  /** @override */
  static setAsConstructor( clientId, measurementId_apiSecret_array_array ) {
    super.setAsConstructor( clientId );
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
   * The apiSecret will be looked up from .measurementId_apiSecret_map
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {object[]} eventArray
   *   An array of Google Analytics v4 measurement protocol event objects which will
   * be embeded into an post body object, be converted to string by JSON.stringify()
   * and then be sent to server by HTTP POST method.
   */
  post_by_measurementId_eventArray( measurementId, eventArray ) {
    let apiSecret = this.measurementId_apiSecret_map.get( measurementId );
    DEvolution_VersusSubmitter_Base.post_by_measurementId_apiSecret_eventArray(
      measurementId, apiSecret, eventArray );
  }

}
