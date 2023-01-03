export { DEvolution_VersusSubmitter_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";

/**
 * The base class for DEvolution.VersusSubmitter.Xxx
 *
 * @member {string} clientId
 *   The client id when sending measurement protocol.
 */
class DEvolution_VersusSubmitter_Base extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusSubmitter.Base provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusSubmitter.Base.Pool",
    DEvolution_VersusSubmitter_Base,
    DEvolution_VersusSubmitter_Base.setAsConstructor );

  /** */
  constructor( clientId ) {
    super();
    DEvolution_VersusSubmitter_Base.setAsConstructor_self.call( this,
      clientId );
  }

  /** @override */
  static setAsConstructor( clientId ) {
    super.setAsConstructor();
    DEvolution_VersusSubmitter_Base.setAsConstructor_self.call( this,
      clientId );
    return this;
  }

  /** @override */
  static setAsConstructor_self( clientId ) {
    this.clientId = clientId;
  }

  /** @override */
  disposeResources() {
    this.clientId = undefined;
    super.disposeResources();
  }

  /**
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} apiSecret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @return {string}
   *   The URL for sending to Google Analytics v4 measurement protocol.
   */
  static createMeasurementUrl( measurementId, apiSecret ) {
    let url = `${DEvolution_VersusSubmitter_Base.urlBase}?measurement_id=${
      measurementId}&api_secret=${apiSecret}`;

    return url;
  }

  /**
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} apiSecret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @param {object} postBodyObject
   *   An object which will be converted to string by JSON.stringify() and then
   * be sent to server by HTTP POST method.
   */
  static post_by_measurementId_apiSecret_bodyObject(
    measurementId, apiSecret, postBodyObject ) {

    let url = DEvolution_VersusSubmitter_Base.createMeasurementUrl(
      measurementId, apiSecret );

    let postBodyString = JSON.stringify( postBodyObject );
    let options = {
      method: "POST",
      body: postBodyString
    };

    fetch( url, options );
  }

}

DEvolution_VersusSubmitter_Base.urlBase
  = "https://www.google-analytics.com/mp/collect";
