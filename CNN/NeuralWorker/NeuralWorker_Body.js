// import * as Pool from "../util/Pool.js";
// import * as Recyclable from "../util/Recyclable.js";
// import * as ValueMax from "../util/ValueMax.js";
import * as AsyncWorker from "../util/AsyncWorker.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import { tensorflowJsURL } from "./NeuralWorker/NeuralWorker_Common.js";

// Load tensorflow.js library in global scope.
importScripts( tensorflowJsURL );

/**
 * The implementation of a neural network web worker.
 *
 */
class NeuralWorker_Body extends AsyncWorker.Body {

  /** */
  constructor() {
    super(); // register callback for handling messages sent from NeuralWorker_Proxy.
  }

  /** @override */
  async* disposeResources() {
    this.NeuralNet_dispose();
    this.workerId = undefined;
    yield *super.disposeResources();
  }

  /** Release the neural network. */
  NeuralNet_dispose() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeResources_and_recycleToPool();
      this.neuralNet = null;
    }
  }

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker
   * should be 0.
   */
  async* initWorker( workerId ) {
    this.workerId = workerId;

//!!! ...unfinished... (2022/09/15)
// What if failed when:
//   - library (tensorflow.js) downloading
//   - worker starting (also a kind of library downloading)
//   - versus downloading
//   - versus result sending
//
// Perhaps, needs a life-cycle manager to handle them gracefully.

    return { value: true };
  }

  /**
   * @param {Object} neuralNetParamsBase
   *   An object looks like NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer} weightArrayBuffer
   *   The neural network's weights. It will be interpreted as Float32Array.
   */
  async* NeuralNet_create( neuralNetParamsBase, weightArrayBuffer ) {

    try {
      this.NeuralNet_dispose();

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
        throw Error( `NeuralWorker_Body.neuralNet_load_async(): `
          + `Failed to initialize neuralNet object. `
          + `Progress ( ${progress.valuePercentage} ). `
          + `${neuralNetParams}`
        );

      progress.disposeResources_and_recycleToPool();
      progress = null;

      {
        let logMsg = `NeuralWorker_Body.neuralNet_load_async(): `
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
      
        console.log( logMsg );
      }

      return { value: true };

    } catch ( e ) {
      console.error( e );
      //debugger;
      return { value: false };
    }
  }

  /**
   * @param {integer} markValue
   *   A value representing which alignment this neural network plays currently.
   * For example, in a OX (connect-three) game:
   *   - ( markValue == 0 ) means this neural network plays O side currently.
   *   - ( markValue == 255 ) means this neural network plays X side currently.
   */
  async* alignmentMark_setValue( markValue ) {
    this.alignmentMarkValue = markValue;
    return { value: true };
  }

  /**
   * @param {Int32Array} imageInt32Array
   *   It is viewed as an image whose size ( height, width, channelCount ) could be
   * processed by this neural network. This method will fille some part of the image
   * by .alignmentMarkValue so that this neural network could distunguish which
   * alignment it represents.
   */
  static alignmentMark_fillToImage( imageInt32Array ) {

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


//!!! ...unfinished... (2022/09/17)

  /**
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the correct
   *       shape before passed into the neural network
   *
   *   - This usually is called for the 1st web worker in chain. The web worker will
   *       transfer back a scaled Int32Array. The scaled Int32Array should be used to
   *       call the next web worker's .Int32Array_process_async().
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator tracking the result of processing. It will yield two
   * times, the 1st is an Int32Array, the 2nd is a Float32Array.
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: Int32Array }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNetParamsBase's
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: Float32Array }. The value is a Float32Array
   * representing the neural network's result whose channe count is
   * this.neuralNetParamsBase.output_channelCount.
   */
   ImageData_process_asyncGenerator( sourceImageData ) {
    return this.createResulter_by_postCommandArgs(
      [ "ImageData_process_asyncGenerator", sourceImageData ],
      [ sourceImageData.data.buffer ]
    );
  }

  /**
   *
   * @param {Int32Array} sourceInt32Array
   *   The source image data to be processed.
   *
   *   - Its shape must match this.neuralNetParamsBase's [ input_height, input_width,
   *       input_channelCount ] because it will not be scaled and will be passed into neural network directly.
   *
   *   - This usually is called for the 2nd web worker in chain. The web worker will
   *       accept a scaled Int32Array which is returned from the 1st web worker's
   *       first yieled of .ImageData_process_asyncGenerator().
   *
   * @return {Promise}
   *   Return a promise resolved to a Float32Array representing the neural network's
   * result whose channe count is this.neuralNetParamsBase.output_channelCount.
   */
  Int32Array_process_async( sourceInt32Array ) {
    return this.createPromise_by_postCommandArgs(
      [ "Int32Array_process_async", sourceInt32Array ],
      [ sourceInt32Array.buffer ]
    );

//!!! ...unfinished... (2022/09/17)

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
// i.e. using tf.browser.fromPixels_async( canvas )
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
    this.transferBackSourceScaledTensor_async( processingId, scaledSourceTensor );

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

    let resultTypedArray = resultTensor3d.dat_async(); // Download synchronously (because here is web worker).
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
  async transferBackSourceScaledTensor_async( processingId, scaledSourceTensor ) {
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
  
}

NeuralWorker_Body.Singleton = new NeuralWorker_Body(); // Create worker body.
