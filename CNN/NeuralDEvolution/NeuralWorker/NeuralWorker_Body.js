// import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as AsyncWorker from "../../util/AsyncWorker.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import { tensorflowJsURL } from "./NeuralWorker_Common.js";

//!!! ...unfinished... (2023/03/22)
// What if failed when:
//   - library (tensorflow.js) downloading

/**
 * The implementation of a neural network web worker. It may own one or two neural
 * network(s).
 *
 */
export default class NeuralWorker_Body extends AsyncWorker.Body {

  /** */
  constructor() {
    super(); // register callback for handling messages sent from NeuralWorker_Proxy.

    if ( !NeuralWorker_Body.tensorflowJs_imported ) {

      // Q1: Why not importScripts() at global scope?
      // A1: So that NeruralWorker_Proxy could prefetch this NeuralWorker_Body.
      //
      // If it is placed at global scope, NeruralWorker_Proxy will be failed
      // to prefetch this NeuralWorker_Body because importScripts() can not be
      // called in javascript module (where NeruralWorker_Proxy usually reside
      // in).
      //
      //
      // Q2: Why NeruralWorker_Proxy needs prefetch this NeuralWorker_Body?
      // A2: So that this NeuralWorker_Body.js can be placed in disk cache.
      //     So that NeuralWorker_Body can be created even if Internet
      //     disconnected.
      //

      importScripts( tensorflowJsURL ); // Load tensorflow.js library.

      // Prevent from import tensorflow.js many times.
      NeuralWorker_Body.tensorflowJs_imported = true;

      this.tensorMemoryBefore = tf.memory();
    }
  }

  /** @override */
  async* disposeResources() {

    this.alignmentMarkValueArray_dispose();
    this.NeuralNetArray_dispose();

    // Detect tensor memory leak.
    if ( this.tensorMemoryBefore !== undefined ) {
      let tensorMemoryAfter = tf.memory();

      if ( tensorMemoryAfter.numBytes != this.tensorMemoryBefore.numBytes ) {
        let msg = `NeuralWorker_Body.disposeResources(): `
          + `workerId=${this.workerId}, `
          + `tensorMemoryAfter.numBytes (${tensorMemoryAfter.numBytes}) != `
          + `tensorMemoryBefore.numBytes (${tensorMemoryBefore.numBytes})`;

        console.error( msg );
        debugger;

        // (2023/04/20 Remarked) It seems not feasible to throw exception
        // during disposing resources.
        //throw Error( msg );
      }

      this.tensorMemoryBefore = undefined;
    }

    this.ScaleFill = undefined;
    this.workerId = undefined;

    yield *super.disposeResources();
  }

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first
   * worker should be 0.
   *
   * @param {string} backendName
   *   Specify which backend should be used by tensorflow.js library.
   */
  async* initWorker( workerId, backendName ) {

    // Clear resources.
    {
      if ( this.alignmentMarkValueArray )
        this.alignmentMarkValueArray.length = 0; // default is NO_FILL.

      if ( this.neuralNetArray )
        this.neuralNetArray.clear(); // Release old neural networks.
    }

    this.workerId = workerId;
    this.ScaleFill = undefined;

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
//
// Perhaps, needs a life-cycle manager to handle them gracefully.

    return { value: bInitOk };
  }

  /**
   * @param {Object[]} neuralNetParamsBaseArray
   *   An array of object. Every element is an object looks like
   * NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element  will be
   * interpreted as Float32Array.
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and
   * logged to console.
   *
   * @yield {boolean}
   *   - Yield { done: true, value: { value: true } }, if succeeded.
   *   - Yield { done: true, value: { value: false } }, if failed.
   */
  async* NeuralNetArray_create(
    neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime ) {

    const funcNameInMessage = "NeuralNetArray_create";

    // 0. Prepare container for all neural networks.
    {
      if ( this.neuralNetArray )
        this.neuralNetArray.clear(); // Release old neural networks.
      else
        this.neuralNetArray = Recyclable.OwnerArray.Pool.get_or_create_by();

      this.neuralNetArray.length = neuralNetParamsBaseArray.length;
    }

    this.ScaleFill = undefined;

    // 2. Create every neural network.
    let progress;
    try {
      let bAllOk = true;
      for ( let i = 0; i < neuralNetParamsBaseArray.length; ++i ) {
        let neuralNetParamsBase = neuralNetParamsBaseArray[ i ];
        let weightArrayBuffer = weightArrayBufferArray[ i ];

        // Create NeuralNet_ScaleFill.
        if ( this.ScaleFill ) {
          if (   ( this.ScaleFill.target_height
                     != neuralNetParamsBase.input_height )
              || ( this.ScaleFill.target_width
                     != neuralNetParamsBase.input_width )
              || ( this.ScaleFill.target_channelCount
                     != neuralNetParamsBase.input_channelCount ) )

            throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
              + `neuralNetParamsBase[ ${i} ]'s `
              + `( input_height, input_width, input_channelCount ) = ( `
              + `${neuralNetParamsBase.input_height}, `
              + `${neuralNetParamsBase.input_width}, `
              + `${neuralNetParamsBase.input_channelCount} ) `
              + `should be the same as another neuralNetParamsBase's ( `
              + `${this.ScaleFill.target_height}, `
              + `${this.ScaleFill.target_width}, `
              + `${this.ScaleFill.target_channelCount} ). `
              + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }.`
            );

        } else {
          this.ScaleFill = new NeuralNet.ScaleFill(
            neuralNetParamsBase.input_height,
            neuralNetParamsBase.input_width,
            neuralNetParamsBase.input_channelCount
          );
        }

        let inputWeightArray;
        {
          let weightElementOffsetBegin = 0;
          let byteOffset
            = weightElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT;

          let byteLength = Math.floor(
            weightArrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT );

          let aFloat32Array
            = new Float32Array( weightArrayBuffer, byteOffset, byteLength );

          // Ensure there is no NaN value in the weight array.
          // (Force NaN to 0.)
          inputWeightArray = Weights.Base.ValueBounds
            .Float32Array_RestrictedClone( aFloat32Array );
        }

        // In web worker, the input of neural network will not be used by
        // others. Force the neural network release its input tensor.
        neuralNetParamsBase.bKeepInputTensor = false;

        let neuralNetParams = NeuralNet.Params
          .get_or_create_by_NeuralNetParamsBase( neuralNetParamsBase );

        progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

        // Note: Put into this.neuralNetArray[] so that it could be released
        //       even if it's init failed and throw exception.
        let neuralNet = this.neuralNetArray[ i ]
          = NeuralNet.Base.Pool.get_or_create_by();

        let bInitOk = neuralNet.init( progress,
          inputWeightArray, 0, neuralNetParams );

        if ( false == bInitOk ) {

          // Note1: Because neuralNetParams has been destroyed by
          //        NeuralNet.Base.init(), log neuralNetParamsBase instead.
          //
          // Note2: Because neuralNetParamsBase looks like (but not)
          //        NeuralNet.ParamsBase, call .toString explicitly.
          let strNeuralNetParamsBase = NeuralNet.ParamsBase.prototype
            .toString.call( neuralNetParamsBase );

          throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
            + `Failed to initialize neuralNetArray[ ${i} ] object. `
            + `progress.valuePercentage=${progress.valuePercentage}, `
            + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }, `
            + `neuralNet={ ${neuralNet} }.`
          );
        }

        progress.disposeResources_and_recycleToPool();
        progress = null;
  
        bAllOk = bAllOk && bInitOk;

        // If need log dry-run time, also log neural network weight count.
        if ( bLogDryRunTime ) {
          let strWeightCountInfo = neuralNet.toString_WeightCount();
          let logMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
            + `${strWeightCountInfo}.`;
          console.log( logMsg );
        }
      }

      // Compile shaders and upload tensor to GPU if backend is webgl.
      NeuralWorker_Body.NeuralNetArray_compileShaders_uploadTensors_ifWebGL
        .call( this, bLogDryRunTime );

      if ( bAllOk )
        return { value: true };
      else
        return { value: false };

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
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
   * If backend is webgl, run the nueral network once for compiling shaders
   * and uploading tensors to GPU. This could improve performance for the
   * real run.
   *
   * Note:
   *
   *   - The shader compilation will happend in main thread (i.e. UI worker)
   *       even if the neural network runs at non-main web worker (i.e. here).
   *       That is, the compiling always blocks the UI worker.
   *
   *   - The tensorflow.js library will cache the compilied shaders for the
   *       same operations with the same input/output tensor shape. (Note:
   *       They should be in the same web worker. Different web worker uses
   *       itself cache.)
   *
   *   - Even the sharder has been compiled (i.e. operations with the same
   *       input/output tensor shape have been used before), this dry-run will
   *       still improve performance for later real run because the neural
   *       network's filters' tensors will be uploaded to GPU.
   *
   * So, it might be suggested that:
   *
   *   - At UI worker (i.e. not here) during game splash screen displaying:
   * 
   *     - Create NeuralWorker.Proxies and inform all web workers create all
   *         dummy neural networks (with the same NeuralNet.Params which will
   *         be use later in the real run).
   *
   *     - This method will be called and it will compile shaders (in every
   *         web workers). Although, the UI worker will always be blocked but
   *         it has lesser hurt because the UI now is displaying a splash
   *         screen (i.e. users has already expected the UI will be blocked).
   *
   *   - Later when real run:
   * 
   *     - Inform all web workers create all real neural networks.
   *
   *     - This method will be called but the UI will not be blocked (because
   *         WebGL shaders have been compiled during game splash screen
   *         displaying).
   *
   *       - This method is still worth to be called (although no WebGL
   *           sharders needs to be compiled), because it will upload the
   *           neural network's filters' tensors to GPU.
   *
   *       - Note1: The created neural network must have same input/output
   *           tenser shape.
   *
   *       - Note2: The same one NeuralWorker.Proxies and NeuralWorker.Proxy
   *           and NeuralWorker.Body should be used. If the NeuralWorker.Body
   *           are created every time, the shaders will be re-compiled again
   *           and again.)
   *
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and
   * logged to console.
   */
  static NeuralNetArray_compileShaders_uploadTensors_ifWebGL( bLogDryRunTime ) {
    let backendName = tf.getBackend();
    if ( backendName != "webgl" )
      return; // Only WebGL needs compile shaders.

    const funcNameInMessage
      = "NeuralNetArray_compileShaders_uploadTensors_ifWebGL";

//!!! (2023/04/30 Remarked) Every operations should have try-finally to release tensors.
//    tf.tidy( () => {

    {
      let neuralNet;
      let sourceTensor;
      let outputTensor;
      for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
        try {
          neuralNet = this.neuralNetArray[ i ];

          if ( bLogDryRunTime ) {
            const nDryRunTimes = 2;
            let timeElapsedArray = new Array( nDryRunTimes );
            for ( let j = 0; j < nDryRunTimes; ++j ) {
              sourceTensor = tf.zeros( neuralNet.input_shape, "int32" );

              let timeBegin = Date.now();
              outputTensor = neuralNet.apply( sourceTensor );
              let timeEnd = Date.now();
              let timeElapsed = timeEnd - timeBegin;
              timeElapsedArray[ j ] = timeElapsed;
            }
            console.log( `NeuralWorker_Body.${funcNameInMessage}(): `
              + `workerId=${this.workerId}, neuralNetIndex=${i}, `
              + `timeElapsed0=${timeElapsedArray[ 0 ]}, `
              + `timeElapsed1=${timeElapsedArray[ 1 ]}`
            );

          } else {
            sourceTensor = tf.zeros( neuralNet.input_shape, "int32" );
            outputTensor = neuralNet.apply( sourceTensor );
          }

        } catch ( e ) {
          let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
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
    }

//!!! (2023/04/30 Remarked) Every operations should have try-finally to release tensors.
//    } );
  }

  /** Release the neural network. */
  NeuralNetArray_dispose() {
    if ( this.neuralNetArray ) {
      this.neuralNetArray.disposeResources_and_recycleToPool();
      this.neuralNetArray = null;
    }
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network playing which
   * alignment.
   *   - It could be null or undefined or ( markValueArray.length == 0 ) to
   *       clear .alignmentMarkValueArray for not filling alignment mark into
   *       source TypedArray. (i.e. NO _FILL)
   *
   *   - For example, in a OX (connect-three) game:
   *     - ( markValueArray[ 0 ] == 0 ) means neural network 0 plays O side
   *         currently.
   *     - ( markValueArray[ 1 ] == 255 ) means neural network 1 plays X side
   *         currently.
   *
   * @yield {boolean}
   *   - Yield { done: true, value: { value: true } }.
   */
  async* alignmentMarkValueArray_set( markValueArray ) {

    if ( ( markValueArray ) && ( markValueArray.length > 0 ) ) { // 1.

      // 1.1 Prepare container for all neural networks' mark value.
      {
        if ( this.alignmentMarkValueArray )
          this.alignmentMarkValueArray.length = markValueArray.length;
        else
          this.alignmentMarkValueArray
            = Recyclable.Array.Pool.get_or_create_by( markValueArray.length );
      }

      // 1.2 Copy the alignment mark values.
      for ( let i = 0; i < this.alignmentMarkValueArray.length; ++i ) {
        this.alignmentMarkValueArray[ i ] = markValueArray[ i ];
      }

    } else { // 2.
      if ( this.alignmentMarkValueArray )
        this.alignmentMarkValueArray.length = 0;
    }

    return { value: true };
  }

  /** Release the alignmentMarkValueArray. */
  alignmentMarkValueArray_dispose() {
    if ( this.alignmentMarkValueArray ) {
      this.alignmentMarkValueArray.disposeResources_and_recycleToPool();
      this.alignmentMarkValueArray = null;
    }
  }


//!!! ...unfinished... (2022/09/18)
// Perhaps, alignment mark filling could also fill some of the previous result of
// this neural network. (i.e. become recurrent neural network.)

  /**
   * This method will fill some part of the image by alignment mark value so
   * that the neural network could distinguish which alignment it represents.
   * 
   * Usually, this method should be called Before converting Int32Array to
   * tf.tensor.
   *
   * @param {integer} neuralNetIndex
   *   Which neural network's alignment mark value will be used.
   *
   * @param {Int32Array} imageInt32Array
   *   It is viewed as an image whose size ( height, width, channelCount )
   * should match this.neuralNet's shape [ input_height, input_width,
   * input_channelCount ].
   */
  static alignmentMark_fillTo_Image_Int32Array(
    neuralNetIndex, imageInt32Array ) {


//!!! ...unfinished... (2023/04/30)
// Perhaps, should double as ( 6 * 6 ) for being shrinked to half ( 3 * 3 )
// by neural network stage's block0.

    // Q: Why fill top-left ( 3 * 3 ) pixels? Why not just fill top-left
    //      ( 1 * 1 ) pixel?
    // A: NeuralNet mainly uses ( 3 * 3 ) depthwise filter.
    //
    //   - If alignment mark just occupies ( 1 * 1 ) pixel, it could only be
    //       detected by a special depthwise filter.
    //
    //   - If alignment mark occupies ( 3 * 3 ) pixel, it could be detected by
    //       most kinds of depthwise filter easily.
    //
    const markHeight = 3;
    const markWidth = 3;

    const alignmentMarkValue = this.alignmentMarkValueArray[ neuralNetIndex ];

    let neuralNet = this.neuralNetArray[ neuralNetIndex ];
    const arrayIndex_rowStrides
      = neuralNet.input_width * neuralNet.input_channelCount;

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

  /**
   * Process input image data by all (suppose two) neural networks in this web
   * worker.
   *
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__FILL (0)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL (1)
   *
   *   - If ( bFill == true ), alignment mark filling.
   *     - The worker will download scaled Int32Array from GPU memory.
   *     - Fill alignment mark of the 1st neural network, upload and process it.
   *     - Fill alignment mark of the 2nd neural network, upload and process it.
   *
   *   - If ( bFill == false ), no alignment mark filling.
   *     - The worker needs not wait for downloading scaled Int32Array from GPU
   *         memory and needs not upload alignment mark filled Int32Array to
   *         GPU.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing
   *           alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing
   *           alignment B.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNet[ n ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array[] | Int32Array[]} previous_output_TypedArrayArray
   *   An array [ TypedArray, TypedArray ] representing the previous time
   * output of the (pair of) neural network(s).
   *
   * @param {boolean} bFill
   *   If true, the source_TypedArray will be filled by alignment mark before
   * be converted to tensor3d. If false, it will be converted to tensor3d
   * directly without filling alignment mark.
   *
   * @yield {Float32Array[] | Int32Array[]}
   *   Resolve to { done: true, value: { value: [ TypedArray, TypedArray ],
   * transferableObjectArray: [ TypedArray.buffer, TypedArray.buffer ] }.
   * The value is an array of TypedArray representing all neural networks'
   * result whose length is this.neuralNetArray[].output_channelCount.
   * The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* ONE_WORKER__ONE_SCALE__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArrayArray,
    bFill ) {

    const funcNameInMessage = "ONE_WORKER__ONE_SCALE__TypedArray_process";

    let resultFloat32ArrayPromiseArray
      = new Array( this.neuralNetArray.length );

    {
//!!! ...unfinished... (2023/05/04)
// Perhaps, no longer need bFill flags.
// According to this.alignmentMarkValueArray and previous_output_TypedArrayArray
// whether are all null, determine whether needs fill automatically.
//
// If so,
//   - the .TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process()
//     and .TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process()
//     should be combined into one method.
//
//   - Neural network should not see other neural network's previous time
//       output.
//
//     - When neural network 0 computes, never fill neural network 1's previous
//         time output as feedback.
//
//     - When neural network 1 computes, never fill neural network 0's previous
//         time output as feedback.
//

//!!! ...unfinished... (2023/05/04)
      let alignmentMarkValueArray;
      if ( bFill ) {
        alignmentMarkValueArray = this.alignmentMarkValueArray;
        //previous_output_Int32ArrayArray = ???;
      }

      let bTwoTensors = ( this.neuralNetArray.length > 1 );
      let createTensor_asyncGenerator
        = this.ScaleFill.createTensor_by_scale_fill_asyncGenerator(
            source_TypedArray, source_height, source_width,
            bTwoTensors,
            alignmentMarkValueArray, previous_output_TypedArrayArray
          );

      try {
        for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
          let neuralNet = this.neuralNetArray[ i ];

          let sourceTensor;
          let outputTensor;
          try {

            // 1. Prepare source tensor of every neural network.
            //
            // Scaling, filling alignment mark and feedback information (i.e.
            // previous time output), and then create source tensor.
            {
              let done_value_sourceTensorPromise
                = createTensor_asyncGenerator.next();

              let done_value_sourceTensor
                = await done_value_sourceTensorPromise;

              if ( done_value_sourceTensor.done )
                throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
                  + `workerId=${this.workerId}, done_value_sourceTensor.done `
                  + `( ${done_value_sourceTensor.done} ) `
                  + `should be false.`
                );;

              sourceTensor = done_value_sourceTensor.value;
            }

            // 2. Process source tensor. (The sourceTensor will be released
            //    (in theroy).)
            outputTensor = neuralNet.apply( sourceTensor );

            // 3. Record result promise.
            //
            // Because downloading from GPU to CPU is slow, continue to compute
            // the next neural network after downloading started.
            // 
            resultFloat32ArrayPromiseArray[ i ] = outputTensor.data();

          } catch ( e ) {
            let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
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
        let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
          + `workerId=${this.workerId}. ${e}`;
        console.error( errorMsg );
        //debugger;
        throw e;

      } finally {
        // Ensure all intermediate tensors are released.
        if ( createTensor_asyncGenerator ) {
          createTensor_asyncGenerator.return();
          createTensor_asyncGenerator = null;
        }
      }
    }

    // 4. Wait for all downloading from GPU to CPU completely.
    let resultFloat32ArrayArray
      = await Promise.all( resultFloat32ArrayPromiseArray );

    let resultTransferableObjectArray
      = new Array( resultFloat32ArrayArray.length );

    for ( let i = 0; i < resultFloat32ArrayArray.length; ++i ) {
      resultTransferableObjectArray[ i ]
        = resultFloat32ArrayArray[ i ].buffer;
    }

    return {
      value: resultFloat32ArrayArray,
      transferableObjectArray: resultTransferableObjectArray
    };
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER (3)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back
   *       to WorkerProxy.
   *
   *   - Fill alignment mark of this neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 1st web worker in chain. The scaled
   *       Int32Array will be transferred back to WorkerProxy for the 2nd
   *       web worker.
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bApply_or_Applier
   *   - If true, use neuralNet.apply().
   *   - If false, use neuralNet.applier().
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: { value: Int32Array,
   * transferableObjectArray: [ Int32Array.buffer ] }. The value is an
   * Int32Array representing the scaled image data whose shape is
   * this.neuralNet[ 0 ]'s [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length is
   * this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process";

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

      //!!! (2023/05/01 Remarked) Use await instead.
      //scaledInt32Array = scaledSourceTensor.dataSync();
      scaledInt32Array = await scaledSourceTensor.data();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }

//!!! ...unfinished... (2023/05/01)
// call createTensor_by_scale_fill_asyncGenerator().return()
// to ensure all intermediate tensors are released.

    }

    // 2. Process image by neural network.
    let sourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {
      NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
        this, neuralNetIndex, scaledInt32Array );

      sourceTensor
        = tf.tensor( scaledInt32Array, neuralNet.input_shape, "int32" );

      // 2.1 Solution 1: Use neuralNet.apply().
      if ( bApply_or_Applier ) {
        outputTensor = neuralNet.apply( sourceTensor );

        // Because downloading from GPU to CPU is slow, start downloading
        // before posting scaledInt32Array back to WorkerProxy (i.e. another
        // slow action).
        let outputFloat32ArrayPromise = outputTensor.data();

        // Post back to WorkerProxy. (Note: the scaledInt32Array will be
        // destroyed.)
        //
        // Note: Ideally, the scaledInt32Array posting-back should be done
        //       before neuralNet.apply(). However, that will happen exception
        //       (says the ArrayBuffer has been detached). So, do it after
        //       neuralNet.apply().
        yield {
          value: scaledInt32Array,
          transferableObjectArray: [ scaledInt32Array.buffer ]
        };

        outputFloat32Array = await outputFloat32ArrayPromise;

      // 2.2 Solution 2: Use neuralNet.applier().
      } else {
        let applier = neuralNet.applier( sourceTensor );
        let applierNext = applier.next(); // NeuralNet sets progress to 0.
        applierNext = applier.next(); // NeuralNet processes embedding.

        // Post back to WorkerProxy. (Note: the scaledInt32Array will be
        // destroyed.)
        //
        // Note: Ideally, the scaledInt32Array posting-back should be done
        //       before neuralNet.apply(). However, that will happen exception
        //       (says the ArrayBuffer has been detached). So, do it after
        //       first operation (i.e. embedding) completely.
        yield {
          value: scaledInt32Array,
          transferableObjectArray: [ scaledInt32Array.buffer ]
        };

        // Because posting back to WorkerProxy is slow, continue to compute
        // neural network (i.e. another slow action) when posting back.
        while ( !applierNext.done ) {
          applierNext = applier.next();
        }
        outputTensor = applierNext.value;

        let outputFloat32ArrayPromise = outputTensor.data();
        outputFloat32Array = await outputFloat32ArrayPromise;
      }

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network.
      // For avoiding memory leak (e.g. some exception is thrown when
      // .apply()), release it again.
      if ( sourceTensor ) {
        sourceTensor.dispose();
        sourceTensor = null;
      }

//!!! ...unfinished... (2023/05/01)
      // Ensure all intermediate tensors are released.
      if ( createTensor_asyncGenerator ) {
        createTensor_asyncGenerator.return();
        createTensor_asyncGenerator = null;
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
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY (4)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back
   *       to WorkerProxy.
   *
   *   - No Fill alignment mark of this neural network, no upload to GPU,
   *       just process the scaled tensor directly.
   *
   * 
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It will not be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 1st web worker in chain. The scaled
   *       Int32Array will be transferred back to WorkerProxy for the 2nd web
   *       worker.
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bApply_or_Applier
   *   - If true, use neuralNet.apply().
   *   - If false, use neuralNet.applier().
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: { value: Int32Array,
   * transferableObjectArray: [ Int32Array.buffer ] }. The value is an
   * Int32Array representing the scaled image data whose shape is
   * this.neuralNet[ 0 ]'s [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length
   * is this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process";

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    let scaledSourceTensor;
    let outputTensor;
    let outputFloat32Array;
    try {
      // 1. Scale image.
      scaledSourceTensor = neuralNet.create_ScaledSourceTensor_from_PixelData(
        sourceImageData,
        true // ( bForceInt32 == true )
      );

      // Because downloading from GPU to CPU is slow, start downloading
      // scaledInt32Array before computing the neural network (i.e. another
      // slow action).
      let scaledInt32ArrayPromise = scaledSourceTensor.data();

      // 2. Process image by neural network.
      let outputFloat32ArrayPromise;

      // 2.1 Solution 1: Use neuralNet.apply().
      if ( bApply_or_Applier ) {
        outputTensor = neuralNet.apply( scaledSourceTensor );

        // Because downloading from GPU to CPU is slow, start downloading
        // outputFloat32Array before posting scaledInt32Array back to
        // WorkerProxy (i.e. another slow action).
        outputFloat32ArrayPromise = outputTensor.data();

        // Post back to WorkerProxy. (Note: the scaledInt32Array will be
        // destroyed.)
        //
        // Note: After the neuralNet.apply(), the scaledInt32Array should have
        //       been downloaded completely.
        let scaledInt32Array = await scaledInt32ArrayPromise;
        yield {
          value: scaledInt32Array,
          transferableObjectArray: [ scaledInt32Array.buffer ]
        };

      // 2.2 Solution 2: Use neuralNet.applier().
      } else {
        let applier = neuralNet.applier( scaledSourceTensor );
        let applierNext = applier.next(); // NeuralNet sets progress to 0.
        applierNext = applier.next(); // NeuralNet processes embedding.

        // Post back to WorkerProxy. (Note: the scaledInt32Array will be
        // destroyed.)
        //
        // Note: After the neuralNet's embedding, the scaledInt32Array may
        //       have been downloaded completely.
        let scaledInt32Array = await scaledInt32ArrayPromise;
        yield {
          value: scaledInt32Array,
          transferableObjectArray: [ scaledInt32Array.buffer ]
        };

        // Because posting back to WorkerProxy is slow, continue to compute
        // neural network (i.e. another slow action) when posting back.
        while ( !applierNext.done ) {
          applierNext = applier.next();
        }
        outputTensor = applierNext.value;

        outputFloat32ArrayPromise = outputTensor.data();
      }

      // Note: After scaledInt32Array posting-back, the outputFloat32Array
      //       should have been downloaded completely.
      outputFloat32Array = await outputFloat32ArrayPromise;

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network.
      // For avoiding memory leak (e.g. some exception is thrown when
      // .apply()), release it again.
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }

//!!! ...unfinished... (2023/05/01)
      // Ensure all intermediate tensors are released.
      if ( createTensor_asyncGenerator ) {
        createTensor_asyncGenerator.return();
        createTensor_asyncGenerator = null;
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
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER (3)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY (4)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5)
   *     - The 2nd worker calls this method.
   *
   *   - (may or may not) Fill alignment mark of this neural network, upload to
   *       GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 2nd web worker in chain. The web worker
   *       will accept a scaled Int32Array which is returned from the 1st web
   *       worker's first yield of .TypedArray_process_asyncGenerator().
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bFill
   *   If true, the source_TypedArray will be filled by alignment mark before
   * be converted to tensor3d. If false, it will be converted to tensor3d
   * directly without filling alignment mark.
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length is
   * this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* TWO_WORKER__TWO_NET__ONE_SCALE__step1_TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bFill ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__ONE_SCALE__step1_TypedArray_process";

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    let sourceTensor;
    let outputTensor;
    let outputFloat32ArrayPromise;
    try {
      // 1. Prepare source tensor.
      if ( bFill ) {
        NeuralWorker_Body.alignmentMark_fillTo_Image_Int32Array.call(
          this, neuralNetIndex, scaledInt32Array );
      }

      sourceTensor
        = tf.tensor( scaledInt32Array, neuralNet.input_shape, "int32" );

      // 2. Process image by neural network.
      outputTensor = neuralNet.apply( sourceTensor );
      outputFloat32ArrayPromise = outputTensor.data();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network.
      // For avoiding memory leak (e.g. some exception is thrown when
      // .apply()), release it again.
      if ( sourceTensor ) {
        sourceTensor.dispose();
        sourceTensor = null;
      }

//!!! ...unfinished... (2023/05/01)
      // Ensure all intermediate tensors are released.
      if ( createTensor_asyncGenerator ) {
        createTensor_asyncGenerator.return();
        createTensor_asyncGenerator = null;
      }
    }

    let outputFloat32Array = await outputFloat32ArrayPromise;

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL (6)
   *     - Both workers call this metohd.
   *       - The 1st worker uses ( bFork == true ).
   *       - The 2nd worker uses ( bFork == false ).
   *
   *   - Both workers scale source image data by themselves.
   *     - Advantage: The 1st worker needs not wait for downloading scaled
   *         Int32Array from GPU memory.
   *     - Disadvantage: The source image data is scaled twice.
   *
   *   - No alignment mark filling.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing
   *           alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing
   *           alignment B.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bFork
   *   Whether sent the source_TypedArray back to WorkerProxy.
   *
   *   - If true, the source_TypedArray will be sent back to WorkerProxy as an
   *       TypedArray. This is used for the 1st worker.
   *
   *   - If false, the source_TypedArray will not be sent. This is used for the
   *       2nd worker.
   *
   * @yield {Uint8ClampedArray|Uint16Array|Uint32Array|Int32Array}
   *   Resolve to { done: false, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is an
   * TypedArray which is just the (non-scaled) source_TypedArray.
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length is
   * this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* TWO_WORKER__TWO_SCALE__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bFork ) {

    const funcNameInMessage = "TWO_WORKER__TWO_SCALE__TypedArray_process";

    let scaledSourceTensor;
    let outputTensor;
    let outputFloat32ArrayPromise;
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


//!!! ...unfinished... (2023/04/30)
// What about FILL or NO_FILL?

      // 2. Process image by neural network.
      outputTensor = neuralNet.apply( scaledSourceTensor );
      outputFloat32ArrayPromise = outputTensor.data();

    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;

    } finally {
      if ( outputTensor ) {
        outputTensor.dispose();
        outputTensor = null;
      }

      // In theory, it should already have been released by neural network.
      // For avoiding memory leak (e.g. some exception is thrown when
      // .apply()), release it again.
      if ( scaledSourceTensor ) {
        scaledSourceTensor.dispose();
        scaledSourceTensor = null;
      }

//!!! ...unfinished... (2023/05/01)
      // Ensure all intermediate tensors are released.
      if ( createTensor_asyncGenerator ) {
        createTensor_asyncGenerator.return();
        createTensor_asyncGenerator = null;
      }
    }

    let outputFloat32Array = await outputFloat32ArrayPromise;

    return {
      value: outputFloat32Array,
      transferableObjectArray: [ outputFloat32Array.buffer ]
    };
  }

}

/** If true, tensorflow.js has been loaded. */
NeuralWorker_Body.tensorflowJs_imported = false;
