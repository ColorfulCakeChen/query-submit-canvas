/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker.
 * It is not an importable module.
 *
 * In module (non-classic) web worker, static import is available. But at the same
 * time, importScripts() will not be avbailable. For solving this problem, using
 * classic (non-module) web worker so that tensorflow.js can be loaded by
 * importScripts(). At the same time, using dynamic import() to load ourselves module
 * because import() can be used in classic (non-module) script.
 */

/**
 * The implementation of a neural network web worker.
 *
 */
class NeuralWorker_Body {


  /** @override */
  disposeResources() {
    this.disposeWorker();
    //super.disposeResources();
  }

  /** */
  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeResources();
      this.neuralNet = null;
    }

//!!! ...unfinished... (2022/09/08) also MessagePort.close().

//!!!??? calling close() when the next worker disposed ?
    close();
  }

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker
   * should be 0.
   *
   * @param {string} tensorflowJsURL
   *   The URL of tensorflow javascript library. Every worker will load the library
   * from the URL.
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The configuration of the neural network to be created by web worker.
   */
  async initAsync( workerId = 0, tensorflowJsURL, neuralNetParamsBase ) {

    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetParamsBase = neuralNetParamsBase;

//!!! ...unfinished... (2022/09/09) should be set in neuralNetParamsBase.
    // Because every web worker will copy the input, there is not necessary to keep input.
    let bKeepInputTensor = false;

    await this.globalModules_initAsync(); // Load libraries in global scope.

//!!! ...unfinished... (2022/09/09) Report init done to NeuralWorker_Proxy

  }

  /** Load ourselves libraries dynamically. */
  async globalModules_initAsync() {
    importScripts( this.tensorflowJsURL ); // Load tensorflow.js library in global scope.

    globalThis.Pool = await import( "../util/Pool.js" );
    globalThis.Recyclable = await import( "../util/Recyclable.js" );
    //globalThis.GSheets = await import( "../util/GSheets.js" );
    globalThis.ValueMax = await import( "../util/ValueMax.js" );
    //globalThis.RandTools = await import( "../util/RandTools.js" );
    //globalThis.FloatValue = await import( "../Unpacker/FloatValue.js" );
    //globalThis.ValueDesc = await import( "../Unpacker/ValueDesc.js" );
    globalThis.Weights = await import( "../Unpacker/Weights.js" );
    globalThis.NeuralNet = await import( "../Conv/NeuralNet.js" );
  }

  /**
   * @param {Object} neuralNetParamsBase
   *   An object look like NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer} weightArrayBuffer
   *   The neural network's weights. It will be interpreted as Float32Array.
   */
  async neuralNet_createAsync( neuralNetParamsBase, weightArrayBuffer ) {
    try {
      let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

      let inputWeightArray;
      {
        let weightElementOffsetBegin = 0;
        let byteOffset
          = weightElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT;

        let byteLength = Math.floor(
          weightArrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT );

        let aFloat32Array = new Float32Array( weightArrayBuffer, byteOffset, byteLength );

        // Ensure there is no NaN value in the weight array. (Force NaN to 0.)
        inputWeightArray
          = Weights.Base.ValueBounds.Float32Array_RestrictedClone( aFloat32Array );
      }

      let neuralNetParams = NeuralNet.Params.Pool.get_or_create_by(
        neuralNetParamsBase.input_height,
        neuralNetParamsBase.input_width,
        neuralNetParamsBase.input_channelCount,
        neuralNetParamsBase.vocabularyChannelCount,
        neuralNetParamsBase.vocabularyCountPerInputChannel,
        neuralNetParamsBase.nConvStageTypeId,
        neuralNetParamsBase.blockCountTotalRequested,
        neuralNetParamsBase.output_channelCount,
        neuralNetParamsBase.bKeepInputTensor
      );

      let neuralNet = this.neuralNet = NeuralNet.Base.Pool.get_or_create_by();
      let bInitOk = neuralNet.init( progress, inputWeightArray, 0, neuralNetParams );

//!!! ...unfinished... (2022/09/08)
// if backend is webgl, the nueral network should be run once for compiling shader.

      if ( false == bInitOk )
        throw Error( `NeuralWorker_Body.neuralNet_loadAsync(): `
          + `Failed to initialize neuralNet object. `
          + `Progress ( ${progress.valuePercentage} ). `
          + `${neuralNetParams}`
        );

      progress.disposeResources_and_recycleToPool();
      progress = null;

      console.log( `NeuralWorker_Body.neuralNet_loadAsync(): `
        + `tensorWeightCount = { `
        + `Extracted: ${neuralNet.tensorWeightCountExtracted}, `
        + `Total: ${neuralNet.tensorWeightCountTotal} }, `
        + `stageCount=${neuralNet.stageCount}, `
        + `blockCountTotal=${neuralNet.blockCountTotal}, `
        + `stageLast_shape=`
          + `( ${neuralNet.stageLast_output_height}, `
          + `${neuralNet.stageLast_output_width}, `
          + `${neuralNet.stageLast_output_channelCount} ), `
        + `output_shape=`
          + `( ${neuralNet.output_height}, ${neuralNet.output_width}, `
          + `${neuralNet.output_channelCount} ).`
      );

//!!! ...unfinished... (2022/09/09) Report neuralNet_create() done to NeuralWorker_Proxy.

    } catch ( e ) {
      // debugger;
      // console.log( e );
      throw e;
    }
  }

//!!! ...unfinished... (2022/09/08)
  /**
   * @param {number} markValue
   *   A value representing which alignment this neural network plays currently.
   * For example, in a OX (connect-three) game:
   *   - ( markValue == 0 ) means this neural network plays O side currently.
   *   - ( markValue == 255 ) means this neural network plays X side currently.
   */
  alignmentMark_setValue( markValue ) {
    this.alignmentMarkValue = markValue;
  }

  /**
   * @param {Uint8Array} imageUint8Array
   *   It is viewed as an image whose size ( height, width, channelCount ) could be
   * processed by this neural network. This method will fille some part of the image
   * by .alignmentMarkValue so that this neural network could distunguish which
   * alignment it represents.
   */
  alignmentMark_fillToImage( imageUint8Array ) {

    // Q: Why fill top-left ( 3 * 3 ) pixels? Why not just fill top-left ( 1 * 1 ) pixel?
    // A: NeuralNet mainly uses ( 3 * 3 ) depthwise filter.
    //
    //      - If alignment mark just occupies ( 1 * 1 ) pixel, it could only be detected
    //          a special depthwise filter.
    //
    //      - If alignment mark occupies ( 3 * 3 ) pixel, it could be detected by most
    //          kinds of depthwise filter easily.
    //
    const markHeight = 3;
    const markWidth = 3;

//!!! ...unfinished... (2022/09/08)
// Before converting Uint8Array to tf.tensor, a mark (representing this neural network)
// should be put at a fixed position in the image (e.g. the first pixel) so that
// this neural network could know what its alignment is.

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

//!!! ...unfinished... (2022/08/25)
// Perhaps, use ImageBitmap (transferred object) to transfer image between web worker.
// i.e. using tf.browser.fromPixelsAsync( canvas )
//
// A: No. It is slower to create tf.tensor from ImageBitmap. Use ImageData is faster.
//

  /**
   * Convert source image data to tensor3d, scale it, transfer scaled source
   * typed-array back to WorkerProxy, compute neural network, pass result back
   * to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing result so
   * that WorkerProxy could find out corresponding promise.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed. The size should be [ sourceImageData.height,
   * sourceImageData.width ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ] ]. And it should RGBA 4 channels.
   */
  imageData_transferBack_processTensor( processingId, sourceImageData ) {

//!!! ...unfinished... (2022/09/08)
// Before converting Uint8Array to tf.tensor, a mark (representing this neural network)
// should be put at a fixed position in the image (e.g. the first pixel) so that
// this neural network could know what its alignment is.
//
//    this.alignmentMark_fillToImage( ??? );

    // Create (scaled) source image so that then neural network can process it.
    //
    // Usually, only the first web worker ( workerId == 0 ) is responsible for
    // scaling the source image data to default size. After that, all other web
    // worker received the already scaled typed-array.
    //
    // The reason why not use source ImageData directly is that the next web worker
    // could re-create tensor3d more effficiently.
    //
    // ImageData uses Uint8ClampedArray internally. If it is past directly, the next
    // web worker needs create tensor3d by fromPixels() which internally converts
    // twice: from Uint8ClampedArray to Int32Array and from Int32Array to tensor3d.
    //
    // If passing typed-array (Float32Array), the next web worker could use it to
    // re-create tensord3d directly.
    //
    let scaledSourceTensor
      = this.neuralNetConfig.create_ScaledSourceTensor_from_PixelData( sourceImageData );

//!!! ...unfinished... If the this.neuralNetConfig (which is past through web worker message) is not real NeuralNet.Config, the following should be used.
//    let scaledSourceTensor = NeuralNet.Config.create_ScaledSourceTensor_from_PixelData.call( this.neuralNetConfig, sourceImageData );

    // Download the scaledSourceTensor as typed-array (asynchronously), and transfer it back to WorkerProxy (and inform WorkerProxies).
    //
    // The reason why it is done asynchronously is for not blocking the following computation of neural network.
    this.transferBackSourceScaledTensorAsync( processingId, scaledSourceTensor );

    // At the same time (the scaled source typed-array data is transferring back to WorkerProxy and then WorkerProxies), this worker is
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

//!!! ...unfinished... (2022/09/08)
// Before converting Uint8Array to tf.tensor, a mark (representing this neural network)
// should be put at a fixed position in the image (e.g. the first pixel) so that
// this neural network could know what its alignment is.
//
//    this.alignmentMark_fillToImage( ??? );

    let shape = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ];

    // Re-create (scaled) source tensor.
    //
    // This should be done before calling transferBackSourceTypedArray() which will transfer (not copy) the sourceTypedArray and invalid it.
    let scaledSourceTensor = tf.tensor3d( sourceTypedArray, shape );

    // Transfer (not copy) the sourceTypedArray back to WorkerProxy). This will invalid sourceTypedArray.
    this.transferBackSourceTypedArray( processingId, sourceTypedArray );

    // At the same time (the sourceTypedArray is transferring back to WorkerProxy and then WorkerProxies), this worker is still computing
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

    // Pass the output of neural network to WorkerProxy (and inform WorkerProxies).
    let message = { command: "processTensorResult", workerId: this.workerId, processingId: processingId, resultTypedArray: resultTypedArray };
    postMessage( message, [ message.resultTypedArray.buffer ] );
  }

  /**
   * Download the scaledSourceTensor as typed-array (Float32Array) asynchronously. Transfer the typed-array back to WorkerProxy
   * (and inform WorkerProxies) so that it can be past to next web worker.
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
   * Transfer source typed-array back to WorkerProxy (and inform WorkerProxies) so that it can be past to next web worker.
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



// In main document context (Not in worker context). Do nothing. (Should not happen)
if ( globalThis.document )
  return;

// In worker context. Register message handler.

//!!! ...unfinished... (2022/08/25)
// Perhaps, use specific MessageChannel for every command so that the command string
// is no longer necessary.

globalThis.onmessage = function( e ) {
  let message = e.data;

  switch ( message.command ) {
    case "init": //{ command: "init", workerId, tensorflowJsURL };
      globalThis.workerBody = new WorkerBody();
      globalThis.workerBody.initAsync( message.workerId, message.tensorflowJsURL );
      break;

    case "neuralNet_create": //{ command: "neuralNet_create", neuralNetParamsBase, weightArrayBuffer };
      globalThis.workerBody.neuralNet_createAsync(
        message.workerId, message.neuralNetParamsBase, message.weightArrayBuffer );
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
