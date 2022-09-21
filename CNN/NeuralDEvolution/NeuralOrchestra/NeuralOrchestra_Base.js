export { NeuralOrchestra_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";

/**
 * Orchestrate neural networks with differential evolution.
 *
 *
 * @member {string} weightsSpreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights. Every worker will
 * load weights from the spreadsheet to initialize one neural network.
 *
 * @member {string} weightsAPIKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 */
class NeuralOrchestra_Base extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralOrchestra.Base.Pool",
    NeuralOrchestra_Base, NeuralOrchestra_Base.setAsConstructor );

  /** */
  constructor( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {
    super();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {
    super.setAsConstructor();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {

    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      weightsSpreadsheetId, weightsAPIKey );

    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by(
      nNeuralWorker_ModeId );
  }

  /** @override */
  disposeResources() {
    this.workerProxies_dispose();
    this.evolutionVersusSummary_dispose();

    super.disposeResources();
  }

  /** */
  workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }

  /** */
  evolutionVersusSummary_dispose() {
    if ( this.evolutionVersusSummary ) {
      this.evolutionVersusSummary.disposeResources_and_recycleToPool();
      this.evolutionVersusSummary = null;
    }
  }

  /** Load all differential evolution versus weights ranges. */
  async evolutionVersusSummary_load_async() {

    this.evolutionVersusSummary.rangeArray_load_async();

//!!! ...unfinished... (2022/09/21)


  }

}
