import * as NeuralNetwork from "./NeuralNetwork.js";

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
   * @param {number} neuralNetworkCount
   *   Create how many neural networks.
   *
//!!! should use ( strActivationName == "cos" ) and ( bBias == false ) to achieve bias-by-naturally.

   * @param {boolean} bBiasByConstChannel
   *   If true, arrange channel and filter with constant value to achieve bias. This will take more memory (for pre-make filters)
   * but may improve performance (because tf.add() is removed).
   *
   * @param {boolean} bWebWorker
   *   If true, neural network will executed inside a web worker.
   *
   * @see NeuralNetwork.init 
   */
  init(
    sourceHeight, sourceWidth, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName,
    neuralNetworkCount,
    bWebWorker
  ) {

    this.disposeTensors();

    neuralNetworkCount = neuralNetworkCount | 1; // At least, one neural network.

    let bKeepInputTensor = true; // Must keep input tensor from disposing. So that the input can be shared across all neural networks.

    this.neuralNetworkArray = new Array( neuralNetworkCount );
    for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
      let neuralNetwork = new NeuralNetwork.Base();
      neuralNetwork.init(
        sourceHeight, sourceWidth, sourceChannelCount,
        stepCountPerBlock,
        bChannelShuffler,
        pointwise1ChannelCountRate,
        strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName,
        bKeepInputTensor
      );

      this.neuralNetworkArray[ i ] = neuralNetwork;
    }

    // Assume all neural networks process the same size [ height, width ] input. So that the input can be shared (i.e. extracted once, processed multiple times).
    let neuralNetwork0 = this.neuralNetworkArray[ 0 ];
    this.sourceImageHeightWidth = neuralNetwork0.sourceImageHeightWidth;

//!!! ...unfinished...
    this.bWebWorker = bWebWorker;

  }

  disposeTensors() {
    if ( this.neuralNetworkArray ) {
      for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
        let neuralNetwork = this.neuralNetworkArray[ i ];
        neuralNetwork.disposeTensors();
      }
      this.neuralNetworkArray = null;
    }
  }

  /**
   * @param {HTMLCanvasElement} sourceCanvas
   *   The canvas which provides image.
   *
   * @param {tf.tensor3d[]} resultArray
   *   If ( resultArray != null ), all result (new) tensors will be return inside this array. If ( resultArray == null ), all result tensors
   * will be disposed and nothing will be returned. No matter in which case, all other intermediate tensors were disposed.
   */
  apply( sourceCanvas, resultArray ) {

    let sourceImageChannelCount = 4; // tf.browser.fromPixels() handles RGBA 4 channels faster than RGB 3 channels.

//!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.
//     let ctx = sourceCanvas.getContext( '2d' );
//     let sourceImageData = ctx.getImageData( 0, 0, sourceCanvas.width, sourceCanvas.height );
//
//     // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceImage) except the returning tensor.
//     let sourceImageTensor = tf.browser.fromPixels( sourceImageData, sourceImageChannelCount );
//
//     // Resize source image to a default size (height x width) which is used when training the neural network.
//     let t = tf.image.resizeBilinear( sourceImageTensor, this.sourceImageHeightWidth, true ); // alignCorners = true
//     sourceImageTensor.dispose();

    // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceTensor) except the returning tensor.
    let sourceTensor = tf.browser.fromPixels( sourceCanvas, sourceImageChannelCount );

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

    let neuralNetwork;

    if ( resultArray ) {
      resultArray.length = this.neuralNetworkArray.length; // Re-allocate array.
      for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
        neuralNetwork = this.neuralNetworkArray[ i ];
        let t = neuralNetwork.apply_and_destroy_or_keep( scaledSourceTensor, true );
        resultArray[ i ] = t;
      }
    } else {
      for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
        neuralNetwork = this.neuralNetworkArray[ i ];
        neuralNetwork.apply_and_destroy_or_keep( scaledSourceTensor, false ); // The input tensor will NOT be disposed here, so that it can be shared.
        // Since ( bReturn == false ), the neural network will not have returned value. So there is not necessary to handle it.
      }
    }

    scaledSourceTensor.dispose();  // After all neural network done, destroy the input tensor.

    return resultArray;
  }

}
