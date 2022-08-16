/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker. It is not an importable module.
 *
 */

// In module (non-classic) web worker, static import is available. But at the same time, importScripts() will not be avbailable.
// For solving this problem, using classic (non-module) web worker so that tensorflow.js can be loaded by importScripts().
// At the same time, using dynamic import() to load ourselves module because import() can be used in classic (non-module) script.
//
//import * as Net from "./Net.js";

/**
 * The implementation of a neural network web worker.
 *
 */
class WorkerBody {

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker should be 0.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {string} weightsSpreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights. Every worker will load weights from the spreadsheet to initialize one neural network.
   *
   * @param {string} weightsAPIKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
   */
  init( workerId = 0, tensorflowJsURL, neuralNetConfig, weightsSpreadsheetId, weightsAPIKey ) {

    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsSpreadsheetId = weightsSpreadsheetId;
    this.weightsAPIKey = weightsAPIKey;

    let bKeepInputTensor = false; // Because every web worker will copy the input, there is not necessary to keep input.

//!!! ...unfinished... global scope ? report progress ?

    // If a specific library module does not existed, all libraries might have not yet been loaded. (i.e. this is the first time WorkerBody.init() is called.)
    if ( !globalThis.NeuralNetProgress ) {

      globalThis.NeuralNetProgress = await import( "./NetProgress.js" ); // Load progress library in globalThis.ValueMax scope dynamically.

      this.initProgress = new NeuralNetProgress.InitProgress(); // The progress object could be created only after the progress library has been loaded.
      this.initProgress.libraryDownload.total = 3; // There are 3 libraries should be loaded: NetProgress, tensorflow.js, NeuralNet.

      this.initProgress.weightsDownload.total = 1; // There are ??? 1 weights file will be loaded.

//!!! How to know this? According to neural net architecture? It will be known only after it has been downloaded.
      this.initProgress.weightsParse.total = 10000; // There are ??? weights will be parsed.

//!!! It seems that the libraryDownload and weightsDownload should not be included.
// Because the weightsParse.total is unknown when downloading library and weights, it not possible to set total of every progress at one time.


      ++this.initProgress.libraryDownload.accumulation; // The library NetProgress has been loaded.

//!!! ...unfinished... inform WorkerProxy progress changed.

      importScripts( tensorflowJsURL ); // Load tensorflow javascript library in global scope.
      ++this.initProgress.libraryDownload.accumulation; // The library tensorflow.js has been loaded.

      globalThis.NeuralNet = await import( "./Net.js" ); // Load neural network library in globalThis.NeuralNet scope dynamically.
      ++this.initProgress.libraryDownload.accumulation; // The library NeuralNet has been loaded.
    }

//!!! ...unfinished... the neuralNetConfig is still class NeuralNet.Config? Otherwise, the create_ScaledSourceTensor_from_PixelData() will be lost.

    this.neuralNet = new NeuralNet.Base();
    this.neuralNet.init( neuralNetConfig, bKeepInputTensor );

//!!! ...unfinished... 
    // Download and parse neural network weights. Also report downloading and parsing progress.

//       this.initProgress.weightsDownload;
//       this.initProgress.weightsParse;

  }

  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeTensors();
      this.neuralNet = null;
    }

//!!!??? calling close() when the next worker disposed ?
    close();
  }

//!!! Regular Expression for get text inside html table markup:
//
//  /(?<=<table[^>]*>.*)(?<=>)[^<]+(?=<)(?=.*</table>)/g
//
// It can be used to parsing weights data from Google Sheets published html. Problem: safari browser does not support lookbehind regular expression.

//!!! Regular Expression for get text inside html table data (with or without div) markup:
//
//  let r = RegExp( "<td[^>]*>(?:<div[^>]*>)?([^<]*)(?:</div>)?</td>", "g" );
//  let extractedLinesByCells = String( sourceHTMLText ).replace( r, "$1\n" );
//
// The capture group 1 is one cell of one column of google sheet.

  /**
   * Convert source image data to tensor3d, scale it, transfer scaled source typed-array back to WorkerProxy, compute neural network,
   * pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed. The size should be [ sourceImageData.height, sourceImageData.width ]
   * = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ] ]. And it should RGBA 4 channels.
   */
  imageData_transferBack_processTensor( processingId, sourceImageData ) {

    // Create (scaled) source image so that then neural network can process it.
    //
    // Usually, only the first web worker ( workerId == 0 ) is responsible for scaling the source image data to default size.
    // After that, all other web worker received the already scaled typed-array.
    //
    // The reason why not use source ImageData directly is that the next web worker could re-create tensor3d more effficiently.
    //
    // ImageData uses Uint8ClampedArray internally. If it is past directly, the next web worker needs create tensor3d by fromPixel()
    // which internally converts twice: from Uint8ClampedArray to Int32Array and from Int32Array to tensor3d.
    //
    // If passing typed-array (Float32Array), the next web worker could use it to re-create tensord3d directly.
    let scaledSourceTensor = this.neuralNetConfig.create_ScaledSourceTensor_from_PixelData( sourceImageData );

//!!! ...unfinished... If the this.neuralNetConfig (which is past through web worker message) is not real NeuralNet.Config, the following should be used.
//    let scaledSourceTensor = NeuralNet.Config.create_ScaledSourceTensor_from_PixelData.call( this.neuralNetConfig, sourceImageData );

    // Download the scaledSourceTensor as typed-array (asynchronously), and transfer it back to WorkerProxy (and inform WorkerController).
    //
    // The reason why it is done asynchronously is for not blocking the following computation of neural network.
    this.transferBackSourceScaledTensorAsync( processingId, scaledSourceTensor );

    // At the same time (the scaled source typed-array data is transferring back to WorkerProxy and then WorkerController), this worker is
    // still computing the neural network parallelly.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Transfer scaled source typed-array data back to WorkerProxy, re-create source tensor, compute neural network, pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   */
  typedArray_transferBack_processTensor( processingId, sourceTypedArray ) {
    let shape = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ];

    // Re-create (scaled) source tensor.
    //
    // This should be done before calling transferBackSourceTypedArray() which will transfer (not copy) the sourceTypedArray and invalid it.
    let scaledSourceTensor = tf.tensor3d( sourceTypedArray, shape );

    // Transfer (not copy) the sourceTypedArray back to WorkerProxy). This will invalid sourceTypedArray.
    this.transferBackSourceTypedArray( processingId, sourceTypedArray );

    // At the same time (the sourceTypedArray is transferring back to WorkerProxy and then WorkerController), this worker is still computing
    // the neural network parallelly.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Re-create source tensor, compute neural network, pass result back to WorkerProxy.
   *
   * It will not transfer source back to WorkerProxy. This is different from typedArray_TransferBack_processTensor().
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   */
  typedArray_processTensor( processingId, sourceTypedArray ) {
    let shape = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ];
    let scaledSourceTensor = tf.tensor3d( sourceTypedArray, shape ); // Re-create (scaled) source tensor.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Compute neural network, and pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {tf.tensor3d} scaledSourceTensor
   *   The source tensor3d to be processed. The scaledSourceTensor.shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   * This tensor will be disposed when processing is done.
   */
  processTensorAndDispose( processingId, scaledSourceTensor ) {

    // Note: scaledSourceTensor will be dispose because this.neuralNet is initialized with ( bKeepInputTensor == false ).
    let resultTensor3d = this.neuralNet.apply_and_destroy_or_keep( scaledSourceTensor, true );

    let resultTypedArray = resultTensor3d.dataSync(); // Download synchronously (because here is web worker).
    resultTensor3d.dispose(); // The result tensor should also be disposed.

    // Pass the output of neural network to WorkerProxy (and inform WorkerController).
    let message = { command: "processTensorResult", workerId: this.workerId, processingId: processingId, resultTypedArray: resultTypedArray };
    postMessage( message, [ message.resultTypedArray.buffer ] );
  }

  /**
   * Download the scaledSourceTensor as typed-array (Float32Array) asynchronously. Transfer the typed-array back to WorkerProxy
   * (and inform WorkerController) so that it can be past to next web worker.
   *
   * @param {number} processingId
   *   The id of this processing. It is used by WorkerProxy to found back corresponding promise.
   *
   * @param {tf.tensor3d} scaledSourceTensor
   *   The scaled source tensor3d generated by processImageData().
   */
  async transferBackSourceScaledTensorAsync( processingId, scaledSourceTensor ) {
    let sourceTypedArray = await scaledSourceTensor.data(); // Download scaled source tensor3d as typed-array (Float32Array) asynchronously.
    this.transferBackSourceTypedArray( processingId, sourceTypedArray );
  }

  /**
   * Transfer source typed-array back to WorkerProxy (and inform WorkerController) so that it can be past to next web worker.
   *
   * @param {number} processingId
   *   The id of this processing. It is used by WorkerProxy to found back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-array past to processTypedArray(). This will become invalid after this call because it will be transferred (not
   * copied) back to WorkerProxy.
   */
  transferBackSourceTypedArray( processingId, sourceTypedArray ) {
    let message = { command: "transferBackSourceTypedArray", workerId: this.workerId, processingId: processingId, sourceTypedArray: sourceTypedArray };
    postMessage( message, [ message.sourceTypedArray.buffer ] );
  }

//!!! ...unfinished... How to know and set total of the following:
//       this.initProgress.libraryDownload;
//       this.initProgress.weightsDownload;
//       this.initProgress.weightsParse;

//       this.initProgress.libraryDownload.total = 3; // There are 3 libraries should be loaded: NetProgress, tensorflow.js, NeuralNet.
//       this.initProgress.libraryDownload.accumulation = 0;

  /** Inform WorkerProxy to set total of every progress of initProgress. */
  reportInitProgress_setTotal() {
    let message = { command: "reportInitProgress", subCommand: "setTotal", workerId: this.workerId,
      libraryDownload: this.initProgress.libraryDownload.total,
      weightsDownload: this.initProgress.weightsDownload.total,
      weightsParse: this.initProgress.weightsParse.total,
    };
    postMessage( message );
  }

  /** Inform WorkerProxy to reset initProgress. */
  reportInitProgress_restAccumulation() {
    let message = { command: "reportInitProgress", subCommand: "restAccumulation", workerId: this.workerId };
    postMessage( message );
  }

  /** Inform WorkerProxy to advance initProgress.libraryDownload. */
  reportInitProgress_libraryDownload() {
//    let message = { command: "initProgress_libraryDownload", workerId: this.workerId, total: this.initProgress.libraryDownload.total, accumulation: this.initProgress.libraryDownload.accumulation };
//    let message = { command: "initProgress_libraryDownload", workerId: this.workerId, initProgress: this.initProgress.libraryDownload };
    let message = { command: "reportInitProgress", subCommand: "libraryDownload", workerId: this.workerId, total: this.initProgress.libraryDownload.total, accumulation: this.initProgress.libraryDownload.accumulation };
    postMessage( message );
  }
}



if ( globalThis.document ) {
  return; // In main document context (Not in worker context). Do nothing. (Should not happen)

// In worker context. Register message handler.

globalThis.onmessage = function( e ) {
  let message = e.data;

  switch ( message.command ) {
    case "init": //{ command: "init", workerId, tensorflowJsURL, neuralNetConfig, weightsSpreadsheetId, weightsAPIKey };
      globalThis.workerBody = new WorkerBody();
      globalThis.workerBody.init(
        message.workerId, message.tensorflowJsURL, message.neuralNetConfig, message.weightsSpreadsheetId, message.weightsAPIKey );
      break;

    case "disposeWorker": //{ command: "disposeWorker" };
      globalThis.workerBody.disposeWorker();
      break;

    case "imageData_transferBack_processTensor": //{ command: "imageData_transferBack_processTensor", processingId, sourceImageData };
      globalThis.workerBody.imageData_transferBack_processTensor( message.processingId, message.sourceImageData );
      break;

    case "typedArray_transferBack_processTensor": //{ command: "typedArray_transferBack_processTensor", processingId, sourceTypedArray };
      globalThis.workerBody.typedArray_transferBack_processTensor( message.processingId, message.sourceTypedArray );
      break;

    case "typedArray_processTensor": //{ command: "typedArray_processTensor", processingId, sourceTypedArray };
      globalThis.workerBody.typedArray_processTensor( message.processingId, message.sourceTypedArray );
      break;
  }
}
