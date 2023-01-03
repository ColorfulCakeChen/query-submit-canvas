export { DEvolution_VersusSubmitter_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";

/**
 * The base class for DEvolution.VersusSubmitter.Xxx
 *
 * @member {string} client_id
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
  constructor( client_id ) {
    super();
    DEvolution_VersusSubmitter_Base.setAsConstructor_self.call( this,
      client_id );
  }

  /** @override */
  static setAsConstructor( client_id ) {
    super.setAsConstructor();
    DEvolution_VersusSubmitter_Base.setAsConstructor_self.call( this,
      client_id );
    return this;
  }

  /** @override */
  static setAsConstructor_self( client_id ) {
    this.client_id = client_id;
  }

  /** @override */
  disposeResources() {
    this.client_id = undefined;
    super.disposeResources();
  }

  /**
   *
   * @param {string} measurement_id
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} api_secret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @return {string}
   *   The URL for sending to Google Analytics v4 measurement protocol.
   */
  static createMeasurementUrl( measurement_id, api_secret ) {
    let url = `${DEvolution_VersusSubmitter_Base.urlBase}?measurement_id=${
      measurement_id}&api_secret=${api_secret}`;

    return url;
  }

  /**
   *
   * @param {string} measurement_id
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} api_secret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @param {object} bodyObject
   *   An object which will be converted to string by JSON.stringify() and then
   * be sent to server by HTTP POST method.
   */
  static post_by__measurement_id__api_secret__bodyObject(
    measurement_id, api_secret, bodyObject ) {

    let url = DEvolution_VersusSubmitter_Base.createMeasurementUrl(
      measurement_id, api_secret );

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
