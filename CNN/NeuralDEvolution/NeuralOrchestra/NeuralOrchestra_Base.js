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
 * @member {number} nNeuralWorker_ModeId
 *   The numeric identifier of neural worker mode (i.e.
 * NeuralWorker.Mode.Singleton.Ids.Xxx).
 *
 */
class NeuralOrchestra_Base extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralOrchestra.Base.Pool",
    NeuralOrchestra_Base, NeuralOrchestra_Base.setAsConstructor );

  /** */
  constructor( weightsSpreadsheetId, weightsAPIKey ) {
    super();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey ) {
    super.setAsConstructor();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    weightsSpreadsheetId, weightsAPIKey ) {

    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      weightsSpreadsheetId, weightsAPIKey );

    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.workerProxies_dispose();
    this.evolutionVersusSummary_dispose();

    super.disposeResources();
  }

  get weightsSpreadsheetId() {
    return this.evolutionVersusSummary.weightsSpreadsheetId;
  }

  get weightsAPIKey( ) {
    return this.evolutionVersusSummary.weightsAPIKey;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies.nNeuralWorker_ModeId;
  }

  get backendName() {
    return this.workerProxies.backendName;
  }

  /** */
  workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }

  /**
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBaseArray
   *   An array of configurations for the neural network to be created. These
   * configurations (exclude the array) will be owned (i.e. kept and destroyed)
   * by this NeuralWorker.Proxy.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element  will be interpreted
   * as Float32Array.
   *
   * 
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  async workerProxies_init_async() {

    // 1. Try backend "webgl" first.
    //
    // Backend "webgl" has best performance with one web worker (NO_FILL).
    //
    let initOkPromise = this.workerProxies.init_async( "webgl",
      NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL // (0) 
    );
 
    let initOk = await initOkPromise;
    if ( initOk ) {

//!!! ...unfinished... (2022/09/26)
// should create dummy neural networks in all web worker.
// So that WebGL shaders could be compiled in advance.

      return true;
    }

    // 2. If "webgl" failed, try backend "cpu".
    //
    // Backend "cpu" has best performance with two web workers (NO_FILL) by .applier().
    //
    initOkPromise = this.workerProxies.init_async( "cpu",
      NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER // (5) 
    );
  
    initOk = await initOkPromise;
    return initOk;
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
