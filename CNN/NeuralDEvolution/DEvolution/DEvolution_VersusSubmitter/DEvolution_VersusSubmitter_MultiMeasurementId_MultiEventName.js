export { DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
  as MultiMeasurementId_MultiEventName };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import { MultiMeasurementId as DEvolution_VersusSubmitter_MultiMeasurementId }
  from "./DEvolution_VersusSubmitter_MultiMeasurementId.js";

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
class DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
  extends DEvolution_VersusSubmitter_MultiMeasurementId {

  /**
   * Used as default DEvolution.VersusSubmitter.MultiMeasurementId_MultiEventName
   * provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "DEvolution.VersusSubmitter.MultiMeasurementId_MultiEventName.Pool",
    DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName,
    DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName.setAsConstructor );

  /** */
  constructor( clientId, measurementId_apiSecret_array_array ) {
    super( clientId, measurementId_apiSecret_array_array );
    DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
      .setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( clientId, measurementId_apiSecret_array_array ) {
    super.setAsConstructor( clientId, measurementId_apiSecret_array_array );
    DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
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
   * Every versusId.entityNo and every nNegativeZeroPositive (-1 or 0 or +1) will use
   * an different event name (and its event content is not important).
   *
   * The apiSecret will be looked up from .measurementId_apiSecret_map
   *
   * @param {string} measurementId
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {DEvolution.VersusId} versusId
   *   The differential evolution versus id.
   *
   * @param {number} nNegativeZeroPositive
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  post_by_measurementId_versusId_NegativeZeroPositive(
    measurementId, versusId, nNegativeZeroPositive ) {

//!!! ...unfinished... (2023/01/03)

    // An integer between [ 0, 4 ].
    let entityNo = versusId.entityNo;

    // An integer between [ 0, 2 ].
    let number_0_1_2 = nNegativeZeroPositive + 1;

    let eventObjectTableIndex = entityNo * ( number_0_1_2 + 1 );

    // (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
    //let versusIdString = versusId.versusIdString;

    let eventObject = DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
      .eventObjectTable[ eventObjectTableIndex ];

    this.post_by_measurementId_event(
      measurementId, eventObject );
  }

}

DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName
  .eventObjectTable = [

  // Entity 0
  { name: "add_payment_info", params: { items: [] } },  // parent lose offspring
  { name: "add_shipping_info", params: { items: [] } }, // parent draw offspring
  { name: "add_to_cart", params: { items: [] } },

  // Entity 1
  { name: "add_to_wishlist", params: { items: [] } },   // parent lose offspring
  { name: "begin_checkout", params: { items: [] } },    // parent draw offspring
  { name: "earn_virtual_currency", params: {} },

  // Entity 2
  { name: "generate_lead", params: {} },                // parent lose offspring
  { name: "join_group", params: {} },                   // parent draw offspring
  { name: "level_up", params: {} },

  // Entity 3
  { name: "login", params: {} },                        // parent lose offspring
  { name: "post_score", params: {} },
  { name: "purchase", params: { items: [] } },

  // Entity 4
  { name: "refund", params: { items: [] } },            // parent lose offspring
  { name: "remove_from_cart", params: { items: [] } },
  { name: "search", params: {} },

  // Entity 5
  { name: "select_content", params: {} },               // parent lose offspring
  { name: "select_item", params: { items: [] } },
  { name: "select_promotion", params: { items: [] } },

  // Entity 6
  { name: "share", params: {} },                        // parent lose offspring
  { name: "sign_up", params: {} },
  { name: "spend_virtual_currency", params: {} },

  // Entity 7
  { name: "tutorial_begin" },                           // parent lose offspring
  { name: "tutorial_complete" },
  { name: "unlock_achievement", params: {} },

  // Entity 8
  { name: "view_cart", params: { items: [] } },         // parent lose offspring
  { name: "view_item", params: { items: [] } },
  { name: "view_item_list", params: { items: [] } },

  // Entity 9
  // { name: "view_promotion", params: { items: [] } },
  // { name: "view_search_results", params: { items: [] } },
];
