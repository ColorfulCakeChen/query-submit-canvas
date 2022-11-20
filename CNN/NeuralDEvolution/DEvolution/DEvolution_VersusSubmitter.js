export { DEvolution_VersusSubmitter as VersusSubmitter };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import { VersusId } from "../../util/DEvolution_VersusId.js";

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
class DEvolution_VersusSubmitter extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusSubmitter provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusSubmitter.Pool",
    DEvolution_VersusSubmitter, DEvolution_VersusSubmitter.setAsConstructor );

  /** */
  constructor( measurement_id, api_secret, client_id ) {
    super();
    DEvolution_VersusSubmitter.setAsConstructor_self.call( this,
      measurement_id, api_secret, client_id );
  }

  /** @override */
  static setAsConstructor( measurement_id, api_secret, client_id ) {
    super.setAsConstructor();
    DEvolution_VersusSubmitter.setAsConstructor_self.call( this,
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

  /**
   *
   * @param {string} versusIdString
   *   The versus id string. (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
   *
   * @param {number} nNegativeZeroPositive
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  send( versusIdString, nNegativeZeroPositive ) {

    let url = `${DEvolution_VersusSubmitter.urlBase}?measurement_id=${
      this.measurement_id}&api_secret=${this.api_secret}`;

    // Every versus result viewed as purchasing an item.
    //   - itemName is versus id
    //   - quantity is -1 or 0 or +1 representing versus result.
    //
    // Q1: Why send item_name (rather than item_id)?
    // A1: For report viewing convenience. Because in Google Analytics Report UI,
    //     the default e-commerce report uses itemName (not itemId).
    //
    // Q2: Why send quantity (rather than price)?
    // A2: According to experiment, The Google Analytics Data report's itemRevenue
    //     only works if ( quantity, price, currency ) all provided (and some
    //     floating-point accumulation error might be introduced). However, report's
    //     itemsPurchased only needs ( quantity ) and no floating-point accumulation
    //     error (because it is an integer).
    //
    let itemVersusResult = {
      item_name: versusIdString,
      quantity: nNegativeZeroPositive,
    };

    let eventPurchase = {
      name: "purchase",
      params: { items: [ itemVersusResult ] }
    };

    let postBody = {
      client_id: this.client_id, // (e.g. "XXXXXXXXXX.YYYYYYYYYY")
      non_personalized_ads: true, // Because this information is not personalized.
      events: [ eventPurchase  ]
    };

    let postBodyString = JSON.stringify( postBody );
    let options = {
      method: "POST",
      body: postBodyString
    };

    fetch( url, options );
  }

}

DEvolution_VersusSubmitter.urlBase = "https://www.google-analytics.com/mp/collect";
