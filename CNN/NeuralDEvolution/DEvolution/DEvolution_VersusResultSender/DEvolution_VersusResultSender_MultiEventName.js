export { DEvolution_VersusResultSender_MultiEventName as MultiEventName };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import { Base as DEvolution_VersusResultSender_Base }
  from "./DEvolution_VersusResultSender_Base.js";

/**
 * 
 *
 * 
 */
class DEvolution_VersusResultSender_MultiEventName
  extends DEvolution_VersusResultSender_Base {

  /**
   * Used as default DEvolution.VersusResultSender.MultiEventName
   * provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "DEvolution.VersusResultSender.MultiEventName.Pool",
    DEvolution_VersusResultSender_MultiEventName,
    DEvolution_VersusResultSender_MultiEventName.setAsConstructor );

  /** */
  constructor( clientId, measurementId_apiSecret_array_array ) {
    super( clientId, measurementId_apiSecret_array_array );
    DEvolution_VersusResultSender_MultiEventName
      .setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( clientId, measurementId_apiSecret_array_array ) {
    super.setAsConstructor( clientId, measurementId_apiSecret_array_array );
    DEvolution_VersusResultSender_MultiEventName
      .setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /**
   * A (re-used) dummy event object (with correct event name, but without
   * any content) represents the entityNo's versus result (lose, draw, win).
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id. The versusId.entityNo should between
   * [ 0, 8 ] because Google Analytics v4 Measurement Protocol has 29 different
   * event names. So there are at most 9 (= Math.floor( 29 / 3 ) ) entities could
   * be represented.
   *
   * @param {number} n1_0_p1
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   *
   * @return {object}
   *   Return an event object (looked up from .eventObjectTable[]) representing the
   * versusId.entityNo and n1_0_p1 (-1 or 0 or +1). Its event name
   * is important (and its event content is not important).
   */
  static eventObject_get_by_versusId_NegativeZeroPositive(
    versusId, n1_0_p1 ) {

    // Ensure it is an integer between [ -1, +1 ].
    n1_0_p1
      = Math.min( Math.max( -1, Math.trunc( n1_0_p1 ) ), 1 );

    const entityNo = versusId.entityNo; // An integer between [ 0, 8 ].
    const NegativeZeroPositiveKinds = 3; // ( -1, 0, +1 ) have 3 kinds.
    const number_0_1_2 = n1_0_p1 + 1; // An integer between [ 0, 2 ].

    // The array index into eventObjectTable[].
    let eventObjectTableIndex
      = ( entityNo * NegativeZeroPositiveKinds ) + number_0_1_2;

    // A (re-used) event object (with correct event name, without any content)
    // represents the entityNo's versus result (lose, draw, win).
    let eventObject = DEvolution_VersusResultSender_MultiEventName
      .eventObjectTable[ eventObjectTableIndex ];

    return eventObject;
  }

  /**
   * Every versusId.entityNo and every n1_0_p1 (-1 or 0 or +1) will
   * use an different event name (and its event content is not important).
   *
   * Note: The versusId.measurementId and versusId.apiSecret will be used.
   *
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id. The versusId.entityNo should between
   * [ 0, 8 ] because Google Analytics v4 Measurement Protocol has 29 different
   * event names. So there are at most 9 (= Math.floor( 29 / 3 ) ) entities could
   * be represented.
   *
   * @param {number} n1_0_p1
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  post_by_versusId_NegativeZeroPositive(
    versusId, n1_0_p1 ) {

    const eventObject = DEvolution_VersusResultSender_MultiEventName
      .eventObject_get_by_versusId_NegativeZeroPositive(
        versusId, n1_0_p1 );

    this.post_by_measurementId_apiSecret_event(
      versusId.measurementId, versusId.apiSecret, eventObject );
  }

  /**
   * Every versusId.entityNo and every n1_0_p1 (-1 or 0 or +1) will
   * use an different event name (and its event content is not important).
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} apiSecret
   *   The measurement api secret of stream of property of Google Analytics v4.
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id. The versusId.entityNo should between
   * [ 0, 8 ] because Google Analytics v4 Measurement Protocol has 29 different
   * event names. So there are at most 9 (= Math.floor( 29 / 3 ) ) entities could
   * be represented.
   *
   * @param {number} n1_0_p1
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  post_by_measurementId_apiSecret_versusId_NegativeZeroPositive(
    measurementId, apiSecret, versusId, n1_0_p1 ) {

    const eventObject = DEvolution_VersusResultSender_MultiEventName
      .eventObject_get_by_versusId_NegativeZeroPositive(
        versusId, n1_0_p1 );

    this.post_by_measurementId_apiSecret_event(
      measurementId, apiSecret, eventObject );
  }

  /**
   * Every versusId.entityNo and every n1_0_p1 (-1 or 0 or +1) will
   * use an different event name (and its event content is not important).
   *
   * The apiSecret will be looked up from .measurementId_to_apiSecret_map
   *
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id. The versusId.entityNo should between
   * [ 0, 8 ] because Google Analytics v4 Measurement Protocol has 29 different
   * event names. So there are at most 9 (= Math.floor( 29 / 3 ) ) entities could
   * be represented.
   *
   * @param {number} n1_0_p1
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  post_by_measurementId_versusId_NegativeZeroPositive(
    measurementId,  versusId, n1_0_p1 ) {

    const eventObject = DEvolution_VersusResultSender_MultiEventName
      .eventObject_get_by_versusId_NegativeZeroPositive(
        versusId, n1_0_p1 );

    this.post_by_measurementId_event(
      measurementId, eventObject );
  }

}

/**
 * Every entity (in a versus) uses 3 event names to represent: parent lose,
 * draw, offspring win.
 */
DEvolution_VersusResultSender_MultiEventName.eventObjectTable = [

  // Entity 0
  { name: "add_payment_info", params: { items: [] } },  // parent lose offspring
  { name: "add_shipping_info", params: { items: [] } }, // parent draw offspring
  { name: "add_to_cart", params: { items: [] } },       // parent win offspring

  // Entity 1
  { name: "add_to_wishlist", params: { items: [] } },   // parent lose offspring
  { name: "begin_checkout", params: { items: [] } },    // parent draw offspring
  { name: "earn_virtual_currency", params: {} },        // parent win offspring

  // Entity 2
  { name: "generate_lead", params: {} },                // parent lose offspring
  { name: "join_group", params: {} },                   // parent draw offspring
  { name: "level_up", params: {} },                     // parent win offspring

  // Entity 3
  { name: "login", params: {} },                        // parent lose offspring
  { name: "post_score", params: {} },                   // parent draw offspring
  { name: "purchase", params: { items: [] } },          // parent win offspring

  // Entity 4
  { name: "refund", params: { items: [] } },            // parent lose offspring
  { name: "remove_from_cart", params: { items: [] } },  // parent draw offspring
  { name: "search", params: {} },                       // parent win offspring

  // Entity 5
  { name: "select_content", params: {} },               // parent lose offspring
  { name: "select_item", params: { items: [] } },       // parent draw offspring
  { name: "select_promotion", params: { items: [] } },  // parent win offspring

  // Entity 6
  { name: "share", params: {} },                        // parent lose offspring
  { name: "sign_up", params: {} },                      // parent draw offspring
  { name: "spend_virtual_currency", params: {} },       // parent win offspring

  // Entity 7
  { name: "tutorial_begin" },                           // parent lose offspring
  { name: "tutorial_complete" },                        // parent draw offspring
  { name: "unlock_achievement", params: {} },           // parent win offspring

  // Entity 8
  { name: "view_cart", params: { items: [] } },         // parent lose offspring
  { name: "view_item", params: { items: [] } },         // parent draw offspring
  { name: "view_item_list", params: { items: [] } },    // parent win offspring

  // Entity 9
  // { name: "view_promotion", params: { items: [] } },
  // { name: "view_search_results", params: { items: [] } },
];
