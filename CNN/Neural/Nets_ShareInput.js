import * as Net from "./Net.js";
import * as WorkerController from "./WorkerController.js";

export { Config } from "./Net.js";
export { Base };

/**
 * There are many neural networks inside. The apply() feeds the same input to the these different neural networks.
 *
 *
 * @member {number[]} sourceImageHeightWidth
 *   The size (i.e. [ height, width ]) of the source image. When apply() is called, the source image will be extracted from the sourceCanvas
 * and be resized to this size. Every neural network receives this resized source image.
 */
class Base {

  /**
   * @param {Net.Config} neuralNetConfig
   *   The configuration of this neural network.
   *
   * @param {number} neuralNetCount
   *   Create how many neural networks.
   *
   * @param {boolean} bWebWorker
   *   If true, neural network will executed inside a web worker.
   *
   * @see Net.Base.init 
   */
  init(
    neuralNetConfig,
    neuralNetCount,
    bWebWorker
  ) {
    neuralNetCount = neuralNetCount | 1; // At least, one neural network.

    this.disposeTensors();

    this.neuralNetConfig = neuralNetConfig;
    this.bWebWorker = bWebWorker;

    this.sourceImageChannelCount = 4; // tf.browser.fromPixels() handles RGBA 4 channels faster than RGB 3 channels.

    if ( bWebWorker ) {
//!!! ...unfinished...
      let totalWorkerCount = neuralNetCount;
      let weightsURL = "???";

      let workerController = this.workerController = new WorkerController.Base(); // Create the controller of web workers.
      workerController.init( neuralNetConfig, totalWorkerCount, weightsURL );     // Create all web workers.

    } else {

      let bKeepInputTensor = true; // Must keep input tensor from disposing. So that the input can be shared across all neural networks.

      this.neuralNetArray = new Array( neuralNetCount );
      for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
        let neuralNet = new Net.Base();
        neuralNet.init(
          neuralNetConfig,
          bKeepInputTensor
        );

        this.neuralNetArray[ i ] = neuralNet;
      }
      
      // Assume all neural networks process the same size [ height, width ] input. So that the input can be shared (i.e. extracted once, processed multiple times).
      let neuralNet0 = this.neuralNetArray[ 0 ];
      this.sourceImageHeightWidth = neuralNet0.sourceImageHeightWidth;
    }

  }

  disposeTensors() {
    if ( this.neuralNetArray ) {
      for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
        let neuralNet = this.neuralNetArray[ i ];
        neuralNet.disposeTensors();
      }
      this.neuralNetArray = null;
    }

    if ( this.workerController ) {
      this.workerController.disposeWorkers();
      this.workerController = null;
    }
  }

  /**
   * @param {HTMLCanvasElement} sourceCanvas
   *   The canvas which provides image.
   *
   * @param {tf.tensor3d[]} resultArray
   *   If ( resultArray != null ), all result (new) tensors will be filled into this array. This could reduce the array memory
   * re-allocation and improve performance. If ( resultArray == null ), all result tensors will be disposed and nothing will be
   * returned. No matter in which case, all other intermediate tensors were disposed.
   *
   * @return {tf.tensor3d[]} Return the resultArray.
   */
  apply_sync( sourceCanvas, resultArray ) {

    if ( this.bWebWorker ) {

//!!! ...unfinished... calling apply_async() and wait them done.

    } else {

  //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.
  //     let ctx = sourceCanvas.getContext( '2d' );
  //     let sourceImageData = ctx.getImageData( 0, 0, sourceCanvas.width, sourceCanvas.height );
  //
  //     // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceImage) except the returning tensor.
  //     let sourceImageTensor = tf.browser.fromPixels( sourceImageData, this.sourceImageChannelCount );
  //
  //     // Resize source image to a default size (height x width) which is used when training the neural network.
  //     let t = tf.image.resizeBilinear( sourceImageTensor, this.sourceImageHeightWidth, true ); // alignCorners = true
  //     sourceImageTensor.dispose();

      // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceTensor) except the returning tensor.
      let sourceTensor = tf.browser.fromPixels( sourceCanvas, this.sourceImageChannelCount );

      // Resize source image to a default size (height x width) which is used when training the neural network.
      let scaledSourceTensor = tf.image.resizeBilinear( sourceTensor, this.sourceImageHeightWidth, true ); // ( alignCorners = true ) for visual image resizing.
      sourceTensor.dispose();

  //!!! ...unfinished...
  // here should convert sourceImageData to tensor, get typed-array (so that the receiver worker could convert to tensor again without re-construct typed-array),
  // transfer it to a web worker. Then, the web worker do the following fromPixels(), ... etc.
  //
  //     scaledSourceTensor.data().then( ( typedArray ) => {
  //       let message = [ values: typedArray, shape: scaledSourceTensor.shape, dtype: scaledSourceTensor ];
  //       worker.postMessage( message, [ message.values.data.buffer ] );
  //     });

  //!!! the following will dispose the scaledSourceTensor before the above codes get typed-array for another web worker.

      // No matter whether resultArray is null, the input tensor will NOT be disposed by any neural network (so that can be shared between them).

      let neuralNet;

      if ( resultArray ) {
        resultArray.length = this.neuralNetArray.length; // Re-allocate array.
        for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
          neuralNet = this.neuralNetArray[ i ];
          let t = neuralNet.apply_and_destroy_or_keep( scaledSourceTensor, true );
          resultArray[ i ] = t;
        }
      } else {
        for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
          neuralNet = this.neuralNetArray[ i ];
          neuralNet.apply_and_destroy_or_keep( scaledSourceTensor, false ); // The input tensor will NOT be disposed here, so that it can be shared.
          // Since ( bReturn == false ), the neural network will not have returned value. So there is not necessary to handle it.
        }
      }

      scaledSourceTensor.dispose();  // After all neural network done, destroy the input tensor.

      return resultArray;
    }
  }


  /**
   * @param {HTMLCanvasElement} sourceCanvas
   *   The canvas which provides image.
   *
   * @param {tf.tensor3d[]} resultArray
   *   If ( resultArray != null ), all result (new) tensors will be filled into this array. This could reduce the array memory
   * re-allocation and improve performance. If ( resultArray == null ), all result tensors will be disposed and nothing will be
   * returned. No matter in which case, all other intermediate tensors were disposed.
   *
   * @return {Promise} Return a promise which resolves with the resultArray.
   */
  async apply_async( sourceCanvas, resultArray ) {

    if ( this.bWebWorker ) {

//!!! ...unfinished...

  //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.
      let ctx = sourceCanvas.getContext( '2d' );
      let sourceImageData = ctx.getImageData( 0, 0, sourceCanvas.width, sourceCanvas.height );

//!!!???
      this.workerController.processTensor( sourceImageData, resultArray );

      // Promise.allSettled( [ ... ] );

//!!!
//       // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceImage) except the returning tensor.
//       let sourceImageTensor = tf.browser.fromPixels( sourceImageData, this.sourceImageChannelCount );
//  
//       // Resize source image to a default size (height x width) which is used when training the neural network.
//       let t = tf.image.resizeBilinear( sourceImageTensor, this.sourceImageHeightWidth, true ); // alignCorners = true
//       sourceImageTensor.dispose();

//!!!
//       // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceTensor) except the returning tensor.
//       let sourceTensor = tf.browser.fromPixels( sourceCanvas, this.sourceImageChannelCount );

//       // Resize source image to a default size (height x width) which is used when training the neural network.
//       let scaledSourceTensor = tf.image.resizeBilinear( sourceTensor, this.sourceImageHeightWidth, true ); // ( alignCorners = true ) for visual image resizing.
//       sourceTensor.dispose();

  //!!! ...unfinished...
  // here should convert sourceImageData to tensor, get typed-array (so that the receiver worker could convert to tensor again without re-construct typed-array),
  // transfer it to a web worker. Then, the web worker do the following fromPixels(), ... etc.
  //
  //     scaledSourceTensor.data().then( ( typedArray ) => {
  //       let message = [ values: typedArray, shape: scaledSourceTensor.shape, dtype: scaledSourceTensor ];
  //       worker.postMessage( message, [ message.values.data.buffer ] );
  //     });

    } else {

//!!! ...unfinished... This is still synchronous

      // Not in web worker mode. Calling apply_sync(), waiting for it done, and resolving promise.
      return new Promise( ( resolve, reject ) => {
        this.apply_sync( sourceCanvas, resultArray );
        resolve( resultArray );
      });
    }
  }

}
