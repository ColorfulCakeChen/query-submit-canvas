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
 * The implementation of a neural network web worker. It may own one or two
 * neural network(s).
 *
 * @member {integer[]} alignmentMarkValueArray
 *   An array of values representing every neural network is playing which
 * alignment currently.
 *
 *   - If it is null or undefined, it means not to fill alignment mark and
 *       feedback information (i.e. previous time output of the neural network)
 *       into source TypedArray when .TypedArray_process_async() is called.
 *
 *   - Otherwise, its length should be the same as this.neuralNetArray.length
 *
 * @member {boolean} alignmentMarkValueArray_nonEmpty
 *   Return true, if .alignmentMarkValueArray is null or undefined or
 * ( .alignmentMarkValueArray.length == 0 ).
 *
 */
export default class NeuralWorker_Body extends AsyncWorker.Body {

  /** */
  constructor() {

    // register callback for handling messages sent from NeuralWorker_Proxy.
    super();

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

    this.ScaleFiller = undefined;
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
    this.ScaleFiller = undefined;

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

    this.ScaleFiller = undefined;

    // 2. Create every neural network.
    let progress;
    try {
      let bAllOk = true;
      for ( let i = 0; i < neuralNetParamsBaseArray.length; ++i ) {
        let neuralNetParamsBase = neuralNetParamsBaseArray[ i ];
        let weightArrayBuffer = weightArrayBufferArray[ i ];

        // Create NeuralNet_ScaleFiller.
        if ( this.ScaleFiller ) {
          if (   ( neuralNetParamsBase.inferencedParams.input_height
                     != this.ScaleFiller.target_height )
              || ( neuralNetParamsBase.inferencedParams.input_width
                     != this.ScaleFiller.target_width )
              || ( neuralNetParamsBase.inferencedParams.input_channelCount
                     != this.ScaleFiller.target_channelCount ) )

            throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
              + `neuralNetParamsBase[ ${i} ].inferencedParams' `
              + `( input_height, input_width, input_channelCount ) = ( `
              + `${neuralNetParamsBase.input_height}, `
              + `${neuralNetParamsBase.input_width}, `
              + `${neuralNetParamsBase.input_channelCount} ) `
              + `should be the same as another neuralNetParamsBase's ( `
              + `${this.ScaleFiller.target_height}, `
              + `${this.ScaleFiller.target_width}, `
              + `${this.ScaleFiller.target_channelCount} ). `
              + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }.`
            );

        } else {
          this.ScaleFiller = new NeuralNet.ScaleFiller(
            neuralNetParamsBase.inferencedParams.input_height,
            neuralNetParamsBase.inferencedParams.input_width,
            neuralNetParamsBase.inferencedParams.input_channelCount
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

  get alignmentMarkValueArray_nonEmpty() {
    if (   ( this.alignmentMarkValueArray )
        && ( this.alignmentMarkValueArray.length > 0 ) )
      return true;
    return false;
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network is playing which
   * alignment currently.
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
    const funcNameInMessage = "alignmentMarkValueArray_set";

    if ( ( markValueArray ) && ( markValueArray.length > 0 ) ) { // 1.

      if ( !this.neuralNetArray )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `should be called after `
          + `NeuralWorker_Body.NeuralNetArray_create() has done.`
        );

      if ( markValueArray.length != this.neuralNetArray.length )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `markValueArray.length ( ${markValueArray.length} ) `
          + `should be either 0 or the same as `
          + `.neuralNetCount ( ${this.neuralNetArray.length} ).`
        );

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

  /**
   * Process input image data by all (suppose two) neural networks in this web
   * worker.
   *
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET (0)
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         the 1st neural network, upload to GPU and process it.
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         the 2nd neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape must match this.neuralNet[ n ]'s [ input_height,
   *       input_width, input_channelCount ].
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
   * @yield {Float32Array[] | Int32Array[]}
   *   Resolve to { done: true, value: { value: [ TypedArray, TypedArray ],
   * transferableObjectArray: [ TypedArray.buffer, TypedArray.buffer ] }.
   * The value is an array of TypedArray representing all neural networks'
   * result whose length is this.neuralNetArray[].output_channelCount.
   * The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* ONE_WORKER__TWO_NET__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArrayArray ) {

    const funcNameInMessage = "ONE_WORKER__TWO_NET__TypedArray_process";

    let resultFloat32ArrayPromiseArray
      = new Array( this.neuralNetArray.length );

    {
      const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be true.

      // Even if there are two neural networks, their .feedbackShape should be
      // the same. So, just use the 1st neural network's feedbackShape.
      const feedbackShape = this.neuralNetArray[ 0 ].feedbackShape;

      let createTensor_asyncGenerator
        = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
            source_TypedArray, source_height, source_width,
            bTwoTensors,
            feedbackShape,
            this.alignmentMarkValueArray, previous_output_TypedArrayArray
          );

      try {
        for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
          let neuralNet = this.neuralNetArray[ i ];

          let outputTensor;
          try {

            // 1. Prepare source tensor of every neural network.
            //
            // Scaling, filling alignment mark and feedback information (i.e.
            // previous time output), and then create source tensor.

            let done_value_sourceTensor_Promise
              = createTensor_asyncGenerator.next();

            let done_value_sourceTensor
              = await done_value_sourceTensor_Promise;

            if ( done_value_sourceTensor.done )
              throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
                + `workerId=${this.workerId}, done_value_sourceTensor.done `
                + `( ${done_value_sourceTensor.done} ) `
                + `should be false.`
              );

            let [ sourceTensor, sourceTypedArrayAsyncFunction ]
              = done_value_sourceTensor.value;

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
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLY (1)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER (2)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back to
   *         WorkerProxy.
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         this neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape must match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ].
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
  async* TWO_WORKER__TWO_NET__step0_TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__step0_TypedArray_process";

    const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be false.

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    const feedbackShape = this.neuralNetArray[ neuralNetIndex ].feedbackShape;

    let createTensor_asyncGenerator
      = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
          source_TypedArray, source_height, source_width,
          bTwoTensors,
          feedbackShape,
          this.alignmentMarkValueArray, previous_output_TypedArrayArray
        );

    let outputTensor;
    let outputFloat32Array;
    try {

      // 1. Prepare source tensor of the neural network.
      //
      // Scaling, filling alignment mark and feedback information (i.e.
      // previous time output), and then create source tensor.

      let done_value_sourceTensor_Promise
        = createTensor_asyncGenerator.next();

      let done_value_sourceTensor
        = await done_value_sourceTensor_Promise;

      if ( done_value_sourceTensor.done )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `workerId=${this.workerId}, done_value_sourceTensor.done `
          + `( ${done_value_sourceTensor.done} ) `
          + `should be false.`
        );

      let [ sourceTensor, sourceTypedArrayAsyncFunction ]
        = done_value_sourceTensor.value;

      // 2. Process image by neural network.

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
        let scaledInt32Array = await sourceTypedArrayAsyncFunction();
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
        let scaledInt32Array = await sourceTypedArrayAsyncFunction();
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
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLY (1)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER (2)
   *     - The 2nd worker calls this method.
   *
   *   - One web worker. Every worker has one neural network. (inference usage)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET (3)
   *     - The only one worker calls this method.
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         this neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape must match this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ].
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length is
   * this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  async* TWO_WORKER__TWO_NET__step1_TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__step1_TypedArray_process";

    const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be false.

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    const feedbackShape = this.neuralNetArray[ neuralNetIndex ].feedbackShape;

    let createTensor_asyncGenerator
      = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
          source_TypedArray, source_height, source_width,
          bTwoTensors,
          feedbackShape,
          this.alignmentMarkValueArray, previous_output_TypedArrayArray
        );

    let outputTensor;
    let outputFloat32ArrayPromise;
    try {

      // 1. Prepare source tensor of the neural network.
      //
      // Scaling, filling alignment mark and feedback information (i.e.
      // previous time output), and then create source tensor.

      let done_value_sourceTensor_Promise
        = createTensor_asyncGenerator.next();

      let done_value_sourceTensor
        = await done_value_sourceTensor_Promise;

      if ( done_value_sourceTensor.done )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `workerId=${this.workerId}, done_value_sourceTensor.done `
          + `( ${done_value_sourceTensor.done} ) `
          + `should be false.`
        );

      let [ sourceTensor, sourceTypedArrayAsyncFunction ]
        = done_value_sourceTensor.value;

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

!!! ...unfinished... (2023/05/11)

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
