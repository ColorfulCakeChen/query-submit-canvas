export { DEvolution_VersusResultSender_SingleEventName as SingleEventName };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import { Base as DEvolution_VersusResultSender_Base }
  from "./DEvolution_VersusResultSender_Base.js";

/**
 * 
 *
 *
 * @member {string} measurementId
 *   The measurement id of stream of property of Google Analytics v4.
 *
 * @member {string} apiSecret
 *   The measurement api secret of stream of property of Google Analytics v4.
 */
class DEvolution_VersusResultSender_SingleEventName
  extends DEvolution_VersusResultSender_Base {

  /**
   * Used as default DEvolution.VersusResultSender.SingleEventName
   * provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "DEvolution.VersusResultSender.SingleEventName.Pool",
    DEvolution_VersusResultSender_SingleEventName,
    DEvolution_VersusResultSender_SingleEventName.setAsConstructor );

  /** */
  constructor( clientId, measurementId, apiSecret ) {
    super( clientId );
    this.#setAsConstructor_self( measurementId, apiSecret );
  }

  /** @override */
  setAsConstructor( clientId, measurementId, apiSecret ) {
    super.setAsConstructor( clientId );
    this.#setAsConstructor_self( measurementId, apiSecret );
  }

  /**  */
  #setAsConstructor_self( measurementId, apiSecret ) {
    this.measurementId = measurementId;
    this.apiSecret = apiSecret;
  }

  /** @override */
  disposeResources() {
    this.apiSecret = undefined;
    this.measurementId = undefined;
    super.disposeResources();
  }

  /**
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id.
   *
   * @param {number} n1_0_p1
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  post_by_versusId_NegativeZeroPositive( versusId, n1_0_p1 ) {

    // (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
    let versusIdString = versusId.versusIdString;

    // Every versus result viewed as purchasing an item.
    //   - itemName is versus id
    //   - quantity is -1 or 0 or +1 representing versus result.
    //
    // Q1: Why send item_name (rather than item_id)?
    // A1: For report viewing convenience. Because in Google Analytics Report
    //     UI, the default e-commerce report uses itemName (not itemId).
    //
    // Q2: Why send quantity (rather than price)?
    // A2: According to experiment, The Google Analytics Data report's
    //     itemRevenue only works if ( quantity, price, currency ) all provided
    //     (and some floating-point accumulation error might be introduced).
    //     However, report's itemsPurchased only needs ( quantity ) and no
    //     floating-point accumulation error (because it is an integer).
    //
    let itemVersusResult = {
      // item_name must be a string even if its content is number.
      item_name: versusIdString.toString(),

      // quantity must be a number.
      quantity: Number.parseInt( n1_0_p1 ),
    };

    let eventPurchase = {
      name: "purchase",
      params: { items: [ itemVersusResult ] }
    };

    this.post_by_measurementId_apiSecret_event(
      this.measurementId, this.apiSecret, eventPurchase );
  }

}
