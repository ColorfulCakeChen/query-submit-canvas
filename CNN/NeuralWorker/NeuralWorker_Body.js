// import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueMax from "../util/ValueMax.js";
import * as AsyncWorker from "../util/AsyncWorker.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import { tensorflowJsURL } from "./NeuralWorker/NeuralWorker_Common.js";

importScripts( tensorflowJsURL ); // Load tensorflow.js library in global scope.

/**
 * The implementation of a neural network web worker.
 *
 */
class NeuralWorker_Body extends AsyncWorker.Body {

  /** */
  constructor() {
    super(); // register callback for handling messages sent from NeuralWorker_Proxy.
  }

//!!! ...unfinished... (2022/09/18)
// need handle two neural network in one web worker.

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
   * @param {Object[]} neuralNetParamsBase
   *   An array of object. Every element is an object looks like NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer[]} weightArrayBuffer
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
        this.neuralNetArray.clear();
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
        sourceTensor = tf.zeros( this.neuralNet.input_shape, "int32" );
        outputTensor = this.neuralNet.apply( sourceTensor );
  
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

    let neuralNet = this.neuralNetArray[ neuralNetIndex ];
    const arrayIndex_rowStrides = neuralNet.input_width * neuralNet.input_channelCount;

    let arrayIndex_rowBegin = 0, arrayIndex = 0;
    for ( let y = 0; y < markHeight; ++y ) {
      for ( let x = 0; x < markWidth; ++x ) {
        for ( let c = 0; c < neuralNet.input_channelCount; ++c ) {
          imageInt32Array[ arrayIndex ] = this.alignmentMarkValue;
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
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed.
   *
   *   - Its shape needs not match this.neuralNet's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the correct
   *       shape before passed into the neural network.
   *
   *   - This usually is called for the 1st web worker in chain. The scaled Int32Array
   *       will be transferred back to WorkerProxy for the 2nd web worker.
   *
   *   - The scale Int32Array will be filled by alignment mark, and then converted into
   *       tensor3d, and then processed by neural network.
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: { value: Int32Array,
   * transferableObjectArray: [ Int32Array.buffer ] }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNet's
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: { value: Float32Array,
   * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNet.output_channelCount.
   */
  async* ImageData_scale_fork_fill_process( sourceImageData ) {

    // 1. Scale image.
    let scaledSourceTensor;
    let scaledInt32Array;
    try {
      scaledSourceTensor = this.neuralNet.create_ScaledSourceTensor_from_PixelData(
        sourceImageData,
        true // ( bForceInt32 == true )
      );

      scaledInt32Array = scaledSourceTensor.dataSync();

    } catch ( e ) {
      console.error( e );
      //debugger;
      scaledInt32Array = new Int32Array(); // Yield an empty Int32Array, if failed.

    } finally {
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }
    }

    yield {  // Post back to WorkerProxy.
      value: scaledInt32Array,
      transferableObjectArray: [ scaledInt32Array.buffer ]
    };

    // 2. Process image by neural network.
    const bFill = true;
    let Int32Array_processor = Int32Array_fillable_process( scaledInt32Array, bFill );
    let result = yield* Int32Array_processor;
    return result;
  }

//!!! (2022/09/18 Remarked)
// Because yield must before return, it seems not possible to transfer back without
// waiting downloading completely.
//
//   /**
//    *
//    * @param {ImageData} sourceImageData
//    *   The source image data to be processed.
//    *
//    *   - Its shape needs not match this.neuralNet's [ input_height,
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
//    * representing the scaled image data whose shape is this.neuralNet's
//    * [ input_height, input_width, input_channelCount ].
//    *
//    * @yield {Float32Array}
//    *   Resolve to { done: true, value: { value: Float32Array,
//    * transferableObjectArray: [ Float32Array.buffer ] }. The value is a Float32Array
//    * representing the neural network's result whose channel count is
//    * this.neuralNet.output_channelCount.
//    */
//   async* ImageData_scale_fork_process( sourceImageData ) {
//
//     // 1. Scale image.
//     let scaledSourceTensor;
//     let scaledInt32Array;
//     try {
//       scaledSourceTensor = this.neuralNet.create_ScaledSourceTensor_from_PixelData(
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
//     } catch ( e ) {
//       console.error( e );
//       //debugger;
//       scaledInt32Array = new Int32Array(); // Yield an empty Int32Array, if failed.
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
//     let Int32Array_processor = Int32Array_fillable_process( scaledInt32Array, bFill );
//     let result = yield* Int32Array_processor;
//     return result;
//   }

  /**
   *
   * @param {Int32Array} sourceInt32Array
   *   The source image data to be processed.
   *
   *   - Its shape must match this.neuralNet's [ input_height, input_width,
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
   * this.neuralNet.output_channelCount.
   */
  async* Int32Array_fillable_process( sourceInt32Array, bFill ) {

    let sourceTensor3d;
    let outputTensor;
    let outputFloat32Array;
    try {
      if ( bFill ) {
        NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
          this, scaledInt32Array );
      }

      sourceTensor3d = tf.tensor3d(
        scaledInt32Array, this.neuralNet.input_shape, "int32"
      );

      outputTensor = this.neuralNet.apply( sourceTensor3d );
      outputFloat32Array = outputTensor.dataSync();

    } catch ( e ) {
      console.error( e );
      //debugger;
      outputFloat32Array = new Float32Array(); // Return an empty Float32Array, if failed.

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network. For avoiding
      // memory leak (e.g. some exception when .apply()), release it again.
      if ( sourceTensor3d ) {
        sourceTensor3d.dispose();
        sourceTensor3d = null;
      }
    }

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape needs not match this.neuralNet's
   * [ input_height, input_width, input_channelCount ] because it will be scaled to
   * the correct shape before passed into the neural network.
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
   * this.neuralNet.output_channelCount.
   */
  async* ImageData_scale_forkable_process( sourceImageData, bFork ) {

    let scaledSourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {

      // 1. Scale image.
      scaledSourceTensor = this.neuralNet.create_ScaledSourceTensor_from_PixelData(
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
      outputTensor = this.neuralNet.apply( scaledSourceTensor );
      outputFloat32Array = outputTensor.dataSync();

    } catch ( e ) {
      console.error( e );
      //debugger;
      outputFloat32Array = new Float32Array(); // Return an empty Float32Array, if failed.

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
