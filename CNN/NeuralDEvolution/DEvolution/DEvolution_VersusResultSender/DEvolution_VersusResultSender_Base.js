export { DEvolution_VersusResultSender_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";

/**
 * The base class for DEvolution.VersusResultSender.Xxx
 *
 * @member {string} clientId
 *   The client id when sending measurement protocol.

//!!! ...unfinished... (2023/02/05)

 * @member {Map} measurementId_to_apiSecret_map
 *   A Map from measurementId (string) to apiSecret (string). It may not exist.
 * If it exists, it is used only by .post_by_measurementId_eventArray() and
 * .post_by_measurementId_event() for looking up apiSecret of the specified
 * measurementId of the streams of property of Google Analytics v4.
 */
class DEvolution_VersusResultSender_Base extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusResultSender.Base provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusResultSender.Base.Pool",
    DEvolution_VersusResultSender_Base,
    DEvolution_VersusResultSender_Base.setAsConstructor );

  /** */
  constructor( clientId ) {
    super();
    DEvolution_VersusResultSender_Base.setAsConstructor_self.call( this,
      clientId );
  }

  /** @override */
  static setAsConstructor( clientId ) {
    super.setAsConstructor();
    DEvolution_VersusResultSender_Base.setAsConstructor_self.call( this,
      clientId );
    return this;
  }

  /** @override */
  static setAsConstructor_self( clientId ) {
    this.clientId = clientId;
  }

  /** @override */
  disposeResources() {
    if ( this.measurementId_to_apiSecret_map )
      this.measurementId_to_apiSecret_map = undefined;

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
    let url = `${DEvolution_VersusResultSender_Base.urlBase}?measurement_id=${
      measurementId}&api_secret=${apiSecret}`;

    return url;
  }

  /**
   * Note: If failed (e.g. Internet disconnected), the result may not be sent
   *       but caller of this method will not know that and will not be
   *       affected because the exception is thrown asynchronously.
   *
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

    let url = DEvolution_VersusResultSender_Base.createMeasurementUrl(
      measurementId, apiSecret );

    let postBodyString = JSON.stringify( postBodyObject );
    let options = {
      method: "POST",
      body: postBodyString
    };

    // Note: The sending is asynchronous. So, even if it is failed (i.e.
    //       throws exception (e.g. because internet didsconnected)),
    //       the outside caller will not be informed and will not be affected.
    fetch( url, options );
  }


  /**
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} apiSecret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @param {object[]} eventArray
   *   An array of Google Analytics v4 measurement protocol event objects which
   * will be embeded into a post body object, be converted to string by
   * JSON.stringify() and then be sent to server by HTTP POST method.
   */
  post_by_measurementId_apiSecret_eventArray(
    measurementId, apiSecret, eventArray ) {

    let postBody = {
      // clientId must be a string even if its content is number.
      // (e.g. "XXXXXXXXXX.YYYYYYYYYY")
      client_id: this.clientId.toString(),

      // Because this information is not personalized.
      non_personalized_ads: true,

      events: eventArray
    };

    DEvolution_VersusResultSender_Base
      .post_by_measurementId_apiSecret_bodyObject(
        measurementId, apiSecret, postBody );
  }

  /**
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} apiSecret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @param {object} event
   *   A Google Analytics v4 measurement protocol event object which will
   * be embeded into a post body object, be converted to string by
   * JSON.stringify() and then be sent to server by HTTP POST method.
   */
  post_by_measurementId_apiSecret_event( measurementId, apiSecret, event ) {
    this.post_by_measurementId_apiSecret_eventArray(
      measurementId, apiSecret, [ event ] );
  }


  /**
   * (Re-)create .measurementId_to_apiSecret_map
   *
   * @param {string[][]} measurementId_apiSecret_array_array
   *   An array of string array. Every string array should have two elements as
   * [ measurementId, apiSecret ] for the streams of property of Google
   * Analytics v4.
   */
  measurementId_to_apiSecret_map_create(
    measurementId_apiSecret_array_array ) {

    this.measurementId_to_apiSecret_map = new Map(
      measurementId_apiSecret_array_array );
  }

  /**
   * The apiSecret will be looked up from .measurementId_to_apiSecret_map
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {object[]} eventArray
   *   An array of Google Analytics v4 measurement protocol event objects which
   * will be embeded into a post body object, be converted to string by
   * JSON.stringify() and then be sent to server by HTTP POST method.
   */
  post_by_measurementId_eventArray( measurementId, eventArray ) {
    let apiSecret = this.measurementId_to_apiSecret_map.get( measurementId );
    this.post_by_measurementId_apiSecret_eventArray(
      measurementId, apiSecret, eventArray );
  }

  /**
   * The apiSecret will be looked up from .measurementId_to_apiSecret_map
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {object} event
   *   A Google Analytics v4 measurement protocol event object which will
   * be embeded into a post body object, be converted to string by
   * JSON.stringify() and then be sent to server by HTTP POST method.
   */
  post_by_measurementId_event( measurementId, event ) {
    this.post_by_measurementId_eventArray( measurementId, [ event ] );
  }

}

DEvolution_VersusResultSender_Base.urlBase
  = "https://www.google-analytics.com/mp/collect";
