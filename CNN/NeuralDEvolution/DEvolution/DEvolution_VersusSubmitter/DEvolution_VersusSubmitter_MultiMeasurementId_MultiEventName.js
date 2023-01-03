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


//!!! ...unfinished... (2023/01/03)

}
