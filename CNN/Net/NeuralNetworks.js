import * as NeuralNetwork from "./NeuralNetwork.js";

export { Base };

/**
 * There are many neural networks inside. The apply() feeds the same input to the these different neural networks.
 *
 * @member {string} name
 *   This test filters' name.
 *
 * @member {number[]} totalChannelExpansionFactor
 *   The final output of this neural network will have ( totalChannelExpansionFactor * sourceChannelCount ) channel count.
 *
 * @member {number[]} sourceImageHeightWidth
 *   The size (i.e. [ height, width ]) of the source image. When apply() is called, the source image will be extracted from the sourceCanvas
 * and be resized to this size. The neural network receives this resized source image.
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
   * @see Blocks.init 
   */
  init(
    sourceHeight, sourceChannelCount,
    stepCountPerBlock,
    bChannelShuffler,
    pointwise1ChannelCountRate,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName,
    neuralNetworkCount,
    bWebWorker
  ) {

    this.disposeTensors();

    this.neuralNetworkArray = new Array( neuralNetworkCount );
    for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
      let neuralNetwork = new NeuralNetwork.Base();
      neuralNetwork.init(
        sourceHeight, sourceChannelCount,
        stepCountPerBlock,
        bChannelShuffler,
        pointwise1ChannelCountRate,
        strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName,
        neuralNetworkCount
      );

      this.neuralNetworkArray[ i ] = neuralNetwork;
    }

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
   * @param {boolean} bReturn
   *   If true, the result tensors will be returned. Otherwise, the result tensors will be disposed.
   *
   * @return {tf.tensor4d[]}
   *   If ( bReturn == true ), return array of the result tensor. Otheriwse, the result tensors will be disposed and nothing will be returned.
   */
  apply( sourceCanvas, bReturn ) {

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

    // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceImage) except the returning tensor.
    let sourceImageTensor = tf.browser.fromPixels( sourceCanvas, sourceImageChannelCount );

    // Resize source image to a default size (height x width) which is used when training the neural network.
    let scaledSourceImageTensor = tf.image.resizeBilinear( sourceImageTensor, this.sourceImageHeightWidth, true ); // alignCorners = true
    sourceImageTensor.dispose();

//!!! ...unfinished...
// here should convert sourceImageData to tensor, get typed-array (so that the receiver worker could convert to tensor again without re-construct typed-array),
// transfer it to a web worker. Then, the web worker do the following fromPixels(), ... etc.
//
//     scaledSourceImageTensor.data().then( ( typedArray ) => {
//       let message = [ values: typedArray, shape: scaledSourceImageTensor.shape, dtype: scaledSourceImageTensor ];
//       worker.postMessage( message, [ message.values.data.buffer ] );
//     });

//!!! the following will dispose the scaledSourceImageTensor before the above codes get typed-array for another web worker.

//???
    let resultArray;
    if ( bReturn )
      resultArray = new Array( this.neuralNetworkArray.length );

    let neuralNetwork;
    for ( let i = 0; i < this.neuralNetworkArray.length; ++i ) {
      neuralNetwork = this.neuralNetworkArray[ i ];
      let t = neuralNetwork.apply_and_destroy_or_keep( scaledSourceImageTensor );

      if ( bReturn )
        resultArray[ i ] = t;
      else
        t.dispose();
    }

    if ( bReturn )
      return resultArray;
    else
      return null;
  }

}
