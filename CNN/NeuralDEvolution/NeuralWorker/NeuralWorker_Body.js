// import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as AsyncWorker from "../../util/AsyncWorker.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import { tensorflowJsURL } from "./NeuralWorker_Common.js";

importScripts( tensorflowJsURL ); // Load tensorflow.js library in global scope.

/**
 * The implementation of a neural network web worker. It may own one or two neural
 * network.
 *
 */
class NeuralWorker_Body extends AsyncWorker.Body {

  /** */
  constructor() {
    super(); // register callback for handling messages sent from NeuralWorker_Proxy.
  }

  /** @override */
  async* disposeResources() {
    if ( this.alignmentMarkValueArray ) {
      this.alignmentMarkValueArray.disposeResources_and_recycleToPool();
      this.alignmentMarkValueArray = null;
    }

    this.NeuralNetArray_dispose();
    this.workerId = undefined;
    yield *super.disposeResources();
  }

  /** Release the neural network. */
  NeuralNetArray_dispose() {
    if ( this.neuralNetArray ) {
      this.neuralNetArray.disposeResources_and_recycleToPool();
      this.neuralNetArray = null;
    }
  }

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker
   * should be 0.
   *
   * @param {string} backendName
   *   Specify which backend should be used by tensorflow.js library.
   */
  async* initWorker( workerId, backendName ) {
    this.workerId = workerId;

    let bInitOk = true;

    await tf.ready(); // Ensure tf.getBackend() workable.

    let currentBackendName = tf.getBackend();
    if ( currentBackendName != backendName ) {
      let setBackendOkPromise = tf.setBackend( backendName );
      let setBackendOk = await setBackendOkPromise;
      bInitOk = setBackendOk;
    }

//!!! ...unfinished... (2022/09/15)
// What if failed when:
//   - library (tensorflow.js) downloading
//   - worker starting (also a kind of library downloading)
//   - versus downloading
//   - versus result sending
//
// Perhaps, needs a life-cycle manager to handle them gracefully.

    return { value: bInitOk };
  }

  /**
   * @param {Object[]} neuralNetParamsBaseArray
   *   An array of object. Every element is an object looks like NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element  will be interpreted
   * as Float32Array.
   *
   * @yield {boolean}
   *   - Yield { done: true, value: { value: true } }, if success.
   *   - Yield { done: true, value: { value: false } }, if failed.
   */
  async* NeuralNetArray_create( neuralNetParamsBaseArray, weightArrayBufferArray ) {

    // 0. Prepare container for all neural networks.
    {
      if ( this.neuralNetArray )
        this.neuralNetArray.clear(); // Release old neural networks.
      else
        this.neuralNetArray = Recyclable.OwnerArray.Pool.get_or_create_by();

      this.neuralNetArray.length = neuralNetParamsBaseArray.length;
    }

    // 2. Create every neural network.
    let progress;
    try {
      let bAllOk = true;
      for ( let i = 0; i < neuralNetParamsBaseArray.length; ++i ) {
        let neuralNetParamsBase = neuralNetParamsBaseArray[ i ];
        let weightArrayBuffer = weightArrayBufferArray[ i ];

        let inputWeightArray;
        {
          let weightElementOffsetBegin = 0;
          let byteOffset
            = weightElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT;

          let byteLength = Math.floor(
            weightArrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT );

          let aFloat32Array
            = new Float32Array( weightArrayBuffer, byteOffset, byteLength );

          // Ensure there is no NaN value in the weight array. (Force NaN to 0.)
          inputWeightArray
            = Weights.Base.ValueBounds.Float32Array_RestrictedClone( aFloat32Array );
        }

        // In web worker, the input of neural network will not be used by others. Force
        // the neural network release its input tensor.
        neuralNetParamsBase.bKeepInputTensor = false;

        let neuralNetParams = NeuralNet.Params.get_or_create_by_NeuralNetParamsBase(
          neuralNetParamsBase );

        progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
        let neuralNet = NeuralNet.Base.Pool.get_or_create_by();
        let bInitOk = neuralNet.init( progress, inputWeightArray, 0, neuralNetParams );

        if ( false == bInitOk )
          throw Error( `NeuralWorker_Body.NeuralNet_create(): `
            + `Failed to initialize neuralNetArray[ ${i} ] object. `
            + `Progress ( ${progress.valuePercentage} ). `
            + `${neuralNetParams}`
          );

        progress.disposeResources_and_recycleToPool();
        progress = null;
  
        bAllOk = bAllOk && bInitOk;
        this.neuralNetArray[ i ] = neuralNet;

        // (2022/09/17 Remarked) For Debug.
        // {
        //   let strWeightCountInfo = neuralNet.toString_WeightCount();
        //   let logMsg = `NeuralWorker_Body.NeuralNet_create(): ${strWeightCountInfo}.`;
        //   console.log( logMsg );
        // }
      }

      // compiling shaders if backend is webgl.
      NeuralWorker_Body.NeuralNetArray_dryRun_ifWebGL.call( this );

      if ( bAllOk )
        return { value: true };
      else
        return { value: false };

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.NeuralNetArray_create(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( progress ) {
        progress.disposeResources_and_recycleToPool();
        progress = null;
      }
    }
  }

  /**
   * If backend is webgl, run the nueral network once for compiling shaders. This could
   * improve performance for the real run.
   */
  static NeuralNetArray_dryRun_ifWebGL() {
    let backendName = tf.getBackend();
    if ( backendName != "webgl" )
      return; // Only WebGL needs compile shaders.

    let neuralNet;
    let sourceTensor;
    let outputTensor;
    for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
      try {
        neuralNet = this.neuralNetArray[ i ];
        sourceTensor = tf.zeros( neuralNet.input_shape, "int32" );
        outputTensor = neuralNet.apply( sourceTensor );

      } catch ( e ) {
        let errorMsg = `NeuralWorker_Body.NeuralNetArray_dryRun_ifWebGL(): `
          + `workerId=${this.workerId}. ${e}`;
        console.error( errorMsg );
        //debugger;
        throw e;

      } finally {
        if ( outputTensor ) {
          outputTensor.dispose();
          outputTensor = null;
        }
  
        // In theory, it should already have been released by neural network. For
        // avoiding memory leak (e.g. some exception when .apply()), release it again.
        if ( sourceTensor ) {
          sourceTensor.dispose();
          sourceTensor = null;
        }
      }
    }
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network playing which alignment.
   * For example, in a OX (connect-three) game:
   *   - ( markValueArray[ 0 ] == 0 ) means neural network 0 plays O side currently.
   *   - ( markValueArray[ 1 ] == 255 ) means neural network 1 plays X side currently.
   *
   * @yield {boolean}
   *   - Yield { done: true, value: { value: true } }.
   */
  async* alignmentMarkArray_setValue( markValueArray ) {

    // 0. Prepare container for all neural networks' mark value.
    {
      if ( this.alignmentMarkValueArray )
        this.alignmentMarkValueArray.length = markValueArray.length;
      else
        this.alignmentMarkValueArray
          = Recyclable.Array.Pool.get_or_create_by( markValueArray.length );
    }

    // 1. Copy the alignment mark values.
    for ( let i = 0; i < this.alignmentMarkValueArray.length; ++i ) {
      this.alignmentMarkValueArray[ i ] = markValueArray[ i ];
    }

    return { value: true };
  }


//!!! ...unfinished... (2022/09/18)
// Perhaps, alignment mark filling could also fill some of the previous result of
// this neural network. (i.e. become recurrent neural network.)

  /**
   * This method will fill some part of the image by alignment mark value so that the
   * neural network could distunguish which alignment it represents.
   * 
   * Usually, this method should be called Before converting Int32Array to tf.tensor.
   *
   * @param {integer} neuralNetIndex
   *   Which neural network's alignment mark value will be used.
   *
   * @param {Int32Array} imageInt32Array
   *   It is viewed as an image whose size ( height, width, channelCount ) should match
   * this.neuralNet's [ input_height, input_width, input_channelCount ].
   */
  static alignmentMark_fillTo_Image_Int32Array( neuralNetIndex, imageInt32Array ) {

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

    const alignmentMarkValue = this.alignmentMarkValueArray[ neuralNetIndex ];

    let neuralNet = this.neuralNetArray[ neuralNetIndex ];
    const arrayIndex_rowStrides = neuralNet.input_width * neuralNet.input_channelCount;

    let arrayIndex_rowBegin = 0, arrayIndex = 0;
    for ( let y = 0; y < markHeight; ++y ) {
      for ( let x = 0; x < markWidth; ++x ) {
        for ( let c = 0; c < neuralNet.input_channelCount; ++c ) {
          imageInt32Array[ arrayIndex ] = alignmentMarkValue;
          ++arrayIndex;
        }
      }
      arrayIndex_rowBegin += arrayIndex_rowStrides;
      arrayIndex = arrayIndex_rowBegin;
    }
  }

//!!! ...unfinished... (2022/09/18)
// NeuralWorker seems possible workable without filling alignment mark.
// Let neural network always output twice channels. For example,
//   - The neural network output 100 channels.
//   - The channel [ 0, 49 ] are used if the neural network representing alignment 1.
//   - The channel [ 50, 99 ] are used if the neural network representing alignment 2.
//
// Because WorkerProxy knows every neural network's alignment, it chooses the
// correct part (i.e. channel 0 - 49 or 50 - 99) should be used for every neural network.
//
// The advantage is worker 1 could continue to compute without waiting for Int32Array
// to be downloaded completely.
//
// Even, if worker 2 also does image scaling by itself (i.e. accepts ImageData instead
// of Int32Array), worker 1 could just post back the original source ImageData without
// downloading any Int32Array.
//
//!!! ...unfinished... (2022/09/18)
// should also test, if do these 2 neural network in only one worker.
// How about their performance?


  /**
   * Process input image data by all (suppose two) neural networks in this web worker.
   *
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__FILL (0)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL (1)
   *
   *   - If ( bFill == true ), alignment mark filling.
   *     - The worker will download scaled Int32Array from GPU memory.
   *     - Fill alignment mark of the 1st neural network, upload and process it.
   *     - Fill alignment mark of the 2nd neural network, upload and process it.
   *
   *   - If ( bFill == false ), no alignment mark filling.
   *     - The worker needs not wait for downloading scaled Int32Array from GPU memory.
   *         and needs not upload alignment mark filled Int32Array to GPU.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing alignment B.
   *
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed.
   *
   *   - Its shape needs not match this.neuralNet's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the correct
   *       shape before passed into the neural network.
   *
   * @param {boolean} bFill
   *   If true, the source Int32Array will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @yield {Float32Array[]}
   *   Resolve to { done: true, value: { value: [ Float32Array, Float32Array ],
   * transferableObjectArray: [ Float32Array.buffer, Float32Array.buffer ] }. The value
   * is an array of Float32Array representing all neural networks' result whose channel
   * count is this.neuralNetArray[].output_channelCount.
   */
  async* ImageData_scale_once_process_multiple( sourceImageData, bFill ) {

    let resultValueArray = new Array( this.neuralNetArray.length );
    let resultTransferableObjectArray = new Array( this.neuralNetArray.length );

    // Ensure all tensors be released, even if .apply() has exception.
    tf.tidy( () => {
      let scaledSourceTensor; // Only kept if need not fill alignment mark.
      try {

        let scaledInt32Array; // Only used if need fill alignment mark.
        for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
          let neuralNet = this.neuralNetArray[ i ];

          // 1. Scale image (only do it once).
          if (   ( !bFill && !scaledSourceTensor )
              || (  bFill && !scaledInt32Array )
            ) {
            try {
              scaledSourceTensor= neuralNet.create_ScaledSourceTensor_from_PixelData(
                sourceImageData,
                true // ( bForceInt32 == true )
              );

              if ( bFill ) {
                scaledInt32Array = scaledSourceTensor.dataSync();
              }

            } catch ( e ) {
              let errorMsg = `NeuralWorker_Body.ImageData_scale_once_process_multiple(): `
                + `workerId=${this.workerId}. ${e}`;
              console.error( errorMsg );
              //debugger;
              throw e;

            } finally {
              // If need fill alignment mark, the source tensor will be re-created for
              // every neural network, the scaled source tensor needs not be kept.
              if ( bFill && scaledSourceTensor ) {
                scaledSourceTensor.dispose();
                scaledSourceTensor = null;
              }
            }
          }

          // 2. Process image by neural network.
          let sourceTensor;
          let outputTensor;
          try {

            // 2.1 Prepare source tensor of every neural network.

            // 2.1.1 Fill alignment mark and create new source tensor.
            if ( bFill ) {
              NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
                this, i, scaledInt32Array );

              sourceTensor = tf.tensor(
                scaledInt32Array, neuralNet.input_shape, "int32" );

            // 2.1.2 Clone the scaled source tensor since no need fill alignment mark.
            } else {
              sourceTensor = scaledSourceTensor.clone();
            }

            // 2.2 Process source tensor. (The sourceTensor will be released (in theroy).)
            outputTensor = neuralNet.apply( sourceTensor );

            // 2.3 Record result.
            resultValueArray[ i ] = outputTensor.dataSync();
            resultTransferableObjectArray[ i ] = resultValueArray[ i ].buffer;

          } catch ( e ) {
            let errorMsg = `NeuralWorker_Body.ImageData_scale_once_process_multiple(): `
              + `workerId=${this.workerId}. ${e}`;
            console.error( errorMsg );
            //debugger;
            throw e;

          } finally {
            if ( outputTensor ) {
              outputTensor.dispose();
              outputTensor = null;
            }
          }
        }

      } catch ( e ) {
        let errorMsg = `NeuralWorker_Body.ImageData_scale_once_process_multiple(): `
          + `workerId=${this.workerId}. ${e}`;
        console.error( errorMsg );
        //debugger;
        throw e;

      } finally {
        if ( scaledSourceTensor ) {
          scaledSourceTensor.dispose();
          scaledSourceTensor = null;
        }
      }
    } );

    return {
      value: resultValueArray,
      transferableObjectArray: resultTransferableObjectArray
    };
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__FILL (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL (3)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back to
   *         WorkerProxy.
   *
   *   - (may or may not) Fill alignment mark of this neural network, upload to GPU
   *       and process it.
   *
   * 
   * @param {ImageData} sourceImageData
   *   The source image data to be processed.
   *
   *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the correct
   *       shape before passed into the neural network.
   *
   *   - This usually is called for the 1st web worker in chain. The scaled Int32Array
   *       will be transferred back to WorkerProxy for the 2nd web worker.
   *
   *   - The scale Int32Array will be filled by alignment mark, and then converted into
   *       tensor3d, and then processed by neural network.
   *
   * @param {boolean} bFill
   *   If true, the source Int32Array will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: { value: Int32Array,
   * transferableObjectArray: [ Int32Array.buffer ] }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNet[ 0 ]'s
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: { value: Float32Array,
   * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNet[ 0 ].output_channelCount.
   */
  async* ImageData_scale_fork_fillable_process( sourceImageData, bFill ) {
    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    // 1. Scale image.
    let scaledSourceTensor;
    let scaledInt32Array;
    try {
      scaledSourceTensor = neuralNet.create_ScaledSourceTensor_from_PixelData(
        sourceImageData,
        true // ( bForceInt32 == true )
      );

      scaledInt32Array = scaledSourceTensor.dataSync();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.ImageData_scale_fork_fillable_process(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }
    }

    // 2. Process image by neural network.
    let sourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {
      if ( bFill ) {
        NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
          this, neuralNetIndex, scaledInt32Array );
      }

      sourceTensor = tf.tensor( scaledInt32Array, neuralNet.input_shape, "int32" );
      outputTensor = neuralNet.apply( sourceTensor );

      // Because downloading from GPU to CPU is slow, start downloading before
      // posting back to WorkerProxy (i.e. another slow action).
      let outputFloat32ArrayPromise = outputTensor.data();

      // Post back to WorkerProxy. (Note: the scaledInt32Array will be destroyed.)
      //
      // Note: Ideally, the posting-back should be done before neuralNet.apply().
      // However, that will happen exception (says the ArrayBuffer has been detached).
      // So, do it after neuralNet.apply().
      yield {
        value: scaledInt32Array,
        transferableObjectArray: [ scaledInt32Array.buffer ]
      };

      outputFloat32Array = await outputFloat32ArrayPromise;

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.ImageData_scale_fork_fillable_process(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network. For avoiding
      // memory leak (e.g. some exception when .apply()), release it again.
      if ( sourceTensor ) {
        sourceTensor.dispose();
        sourceTensor = null;
      }
    }

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__FILL (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL (3)
   *     - The 2nd worker calls this method.
   *
   *   - (may or may not) Fill alignment mark of this neural network, upload to GPU
   *       and process it.
   *
   *
   * @param {Int32Array} scaledInt32Array
   *   The source image data to be processed.
   *
   *   - Its shape must match this.neuralNet[ 0 ]'s [ input_height, input_width,
   *       input_channelCount ] because it will not be scaled and will be passed into
   *       neural network directly.
   *
   *   - This usually is called for the 2nd web worker in chain. The web worker will
   *       accept a scaled Int32Array which is returned from the 1st web worker's
   *       first yieled of .ImageData_process_asyncGenerator().
   *
   * @param {boolean} bFill
   *   If true, the source Int32Array will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: { value: Float32Array,
   * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNet[ 0 ].output_channelCount.
   */
  async* Int32Array_fillable_process( scaledInt32Array, bFill ) {
    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    let sourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {
      if ( bFill ) {
        NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
          this, neuralNetIndex, scaledInt32Array );
      }

      sourceTensor = tf.tensor( scaledInt32Array, neuralNet.input_shape, "int32" );
      outputTensor = neuralNet.apply( sourceTensor );
      outputFloat32Array = outputTensor.dataSync();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.Int32Array_fillable_process(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network. For avoiding
      // memory leak (e.g. some exception when .apply()), release it again.
      if ( sourceTensor ) {
        sourceTensor.dispose();
        sourceTensor = null;
      }
    }

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

//!!! (2022/09/18 Remarked)
// Because yield must before return, it seems not possible to transfer back without
// waiting downloading completely.
//
//    /**
//     * This method is used for:
//     *   - The 1st worker of two web workers. (Every worker has one neural network.)
//     *     - It will download scaled Int32Array from GPU memory. And post it back to
//     *         WorkerProxy.
//     *     - Continue to process the scale tensor (without waiting for dowloading it
//     *         from GPU because there is no alignment mark filling).
//    *
//    * @param {ImageData} sourceImageData
//    *   The source image data to be processed.
//    *
//    *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
//    *       input_width, input_channelCount ] because it will be scaled to the correct
//    *       shape before passed into the neural network
//    *
//    *   - This usually is called for the 1st web worker in chain. The scale Int32Array
//    *       will be transferred back to WorkerProxy for the 2nd web worker.
//    * 
//    *   - The scale Int32Array will be converted into tensor3d (without filling by
//    *       alignment mark), and then processed by neural network.
//    *
//    * @yield {Int32Array}
//    *   Resolve to { done: false, value: { value: Int32Array,
//    * transferableObjectArray: [ Int32Array.buffer ] }. The value is an Int32Array
//    * representing the scaled image data whose shape is this.neuralNet[ 0 ]'s
//    * [ input_height, input_width, input_channelCount ].
//    *
//    * @yield {Float32Array}
//    *   Resolve to { done: true, value: { value: Float32Array,
//    * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
//    * representing the neural network's result whose channel count is
//    * this.neuralNet[ 0 ].output_channelCount.
//    */
//   async* ImageData_scale_fork_process( sourceImageData ) {
//
//      const neuralNetIndex = 0; // Always use the first neural network.
//      let neuralNet = this.neuralNetArray[ i ];
//
//     // 1. Scale image.
//     let scaledSourceTensor;
//     let scaledInt32Array;
//     try {
//       scaledSourceTensor = neuralNet.create_ScaledSourceTensor_from_PixelData(
//         sourceImageData,
//         true // ( bForceInt32 == true )
//       );
//
// //!!! ...unfinsihed... (2022/09/18)
// // No need to wait for downloading completely because here needs not change its content.
//
//       let scaledInt32ArrayPromise = scaledSourceTensor.data();
//       scaledInt32ArrayPromise.then( scaledInt32Array => {
//
// //!!! ...unfinsihed... (2022/09/18) problem: here can not yield
//         yield {  // Post back to WorkerProxy.
//           value: scaledInt32Array,
//           transferableObjectArray: [ scaledInt32Array.buffer ]
//         };
//
//       } ).catch( errReason => {
//
//       } );
//
//      } catch ( e ) {
//        let errorMsg = `NeuralWorker_Body.ImageData_scale_fork_process(): `
//          + `workerId=${this.workerId}. ${e}`;
//        console.error( errorMsg );
//        //debugger;
//        throw e;
//
//     } finally {
//       if ( scaledSourceTensor ) {
//         scaledSourceTensor.dispose();
//         scaledSourceTensor = null;
//       }
//     }
//
//     yield {  // Post back to WorkerProxy.
//       value: scaledInt32Array,
//       transferableObjectArray: [ scaledInt32Array.buffer ]
//     };
//
//     // 2. Process image by neural network.
//     const bFill = false;
//     let Int32Array_processor = this.Int32Array_fillable_process( scaledInt32Array, bFill );
//     let result = yield* Int32Array_processor;
//     return result;
//   }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_SCALE__NO_FILL (4)
   *     - Both workers call this metohd.
   *       - The 1st worker uses ( bFork == true ).
   *       - The 2nd worker uses ( bFork == false ).
   *
   *   - Both workers scale source image data by themselves.
   *     - Advantage: The 1st worker needs not wait for downloading scaled Int32Array
   *         from GPU memory.
   *     - Disadvantage: The source image data is scaled twice.
   *
   *   - No alignment mark filling.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing alignment B.
   *
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape needs not match
   * this.neuralNet[ 0 ]'s [ input_height, input_width, input_channelCount ] because
   * it will be scaled to the correct shape before passed into the neural network.
   *
   * @param {boolean} bFork
   *   Whether sent the source image data back to WorkerProxy.
   *
   *   - If true, the sourceImageData will be sent back to WorkerProxy as an ImageData.
   *       This is used for 1st worker.
   *
   *   - If false, the sourceImageData will not be sent. This is used for 2nd worker.
   *
   * @yield {ImageData}
   *   Resolve to { done: false, value: { value: ImageData,
   * transferableObjectArray: [ ImageData.data.buffer ] }. The value is an ImageData
   * which is just the (non-scaled) source image data.
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: { value: Float32Array,
   * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNet[ 0 ].output_channelCount.
   */
  async* ImageData_scale_forkable_process( sourceImageData, bFork ) {

    let scaledSourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {
      const neuralNetIndex = 0; // Always use the first neural network.
      let neuralNet = this.neuralNetArray[ neuralNetIndex ];

      // 1. Scale image.
      scaledSourceTensor = neuralNet.create_ScaledSourceTensor_from_PixelData(
        sourceImageData,
        true // ( bForceInt32 == true )
      );

      if ( bFork ) {
        yield {  // Post back to WorkerProxy.
          value: sourceImageData,
          transferableObjectArray: [ sourceImageData.data.buffer ]
        };
      }
  
      // 2. Process image by neural network.
      outputTensor = neuralNet.apply( scaledSourceTensor );
      outputFloat32Array = outputTensor.dataSync();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.ImageData_scale_forkable_process(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network. For avoiding
      // memory leak (e.g. some exception when .apply()), release it again.
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }
    }

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

}

NeuralWorker_Body.Singleton = new NeuralWorker_Body(); // Create worker body.
