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
 *
 * @member {Object[]} neuralNetParamsBase_Array
 *   An array of object. Every element is an object looks like
 * NeuralNet.ParamsBase. It is kept so that the neural network(s) can be
 * re-created (perhaps, with different part of the weightArrayBuffer).
 *
 * @member {ArrayBuffer[]} weightArrayBuffer_Array
 *   An array of every neural network's weights. Every element (i.e.
 * weightArrayBuffer_Array[ n ] which is a weightArrayBuffer) will be
 * interpreted as Float32Array. It is kept so that the neural network(s) can
 * be re-created (perhaps, with different part of the weightArrayBuffer).
 *
 * @member {number} weightArrayBuffer_elementCount
 *   A positive integer (or zero) represents how many elements (Float32)
 * a weightArrayBuffer (in fact, weightArrayBuffer_Array[ 0 ]) has.
 *
 * @member {number} weightArrayBuffer_partitionCount
 *   A positive integer to view a weightArrayBuffer as how many parts. At
 * least 1. It could be used to create different neural network by using
 * different part of the weightArrayBuffer.
 * 
 * @member {number} weightArrayBuffer_partitionElementCount
 *   A positive integer (or zero) represents how many elements (Float32)
 * one partition of weightArrayBuffer has.
 * 
 * @member {number} weightArrayBuffer_partitionId
 *   An integer between 0 and ( weightArrayBuffer_partitionCount - 1 ) means
 * which part of a weightArrayBuffer is used to create current neural network.
 * 
 * @member {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
 *   An array with two non-negative integer arrays representing every neural
 * network personating which alignment currently. Every non-negative integer
 * array's .length should be the same as .input_channelCount becasue it
 * represents a pixel.
 *
 *   - It could be null or undefined or
 *       ( alignmentMarkValueArrayArray.length == 0 ) for not filling alignment
 *       mark into source TypedArray.
 *
 *   - Otherwise, alignmentMarkValueArrayArray.length should be the same as
 *       this.neuralNetCount
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ), they will be
 *         filled (as alignment marks) into every input of the neural
 *         networks (i.e. source TypedArray).
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ) but you do not
 *         want to fill alignment marks, please call
 *         .alignmentMarkValueArrayArray_set_async( null ) to clear it.
 *
 * @member {boolean} alignmentMarkValueArrayArray_nonEmpty
 *   Return true, if .alignmentMarkValueArrayArray is null or
 * ( .alignmentMarkValueArrayArray.length == 0 ).
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

    this.alignmentMarkValueArrayArray_dispose();

    this.ScaleFiller = undefined;

    this.NeuralNetArray_dispose();

    // Release neural network parameters and weights.
    {
      this.weightArrayBuffer_partitionId = undefined;
      this.weightArrayBuffer_partitionCount = undefined;
      this.weightArrayBuffer_partitionElementCount = undefined;
      this.weightArrayBuffer_elementCount = undefined;
      this.weightArrayBuffer_Array = undefined;
      this.neuralNetParamsBase_Array = undefined;
    }

    // Detect tensor memory leak.
    if ( this.tensorMemoryBefore !== undefined ) {
      let tensorMemoryAfter = tf.memory();

      if ( tensorMemoryAfter.numBytes != this.tensorMemoryBefore.numBytes ) {
        let msg = `NeuralWorker_Body.disposeResources(): `
          + `workerId=${this.workerId}, `
          + `tensorMemoryAfter.numBytes `
          + `(${tensorMemoryAfter.numBytes}) != `
          + `tensorMemoryBefore.numBytes `
          + `(${this.tensorMemoryBefore.numBytes})`;

        console.error( msg );
        debugger;

        // (2023/04/20 Remarked) It seems not feasible to throw exception
        // during disposing resources.
        //throw Error( msg );
      }

      this.tensorMemoryBefore = undefined;
    }

    this.workerId = undefined;

    yield *super.disposeResources();
  }

  /**
   * Modify this.weightArrayBuffer_Array to ensure there is no NaN value in the
   * weight array. (Force NaN to 0.)
   *
   */
  static weightArrayBuffer_Array_ensure_no_NaN() {

    const weightArrayBuffer_Array = this.weightArrayBuffer_Array;
    if ( !weightArrayBuffer_Array )
      return;

    for ( let i = 0; i < weightArrayBuffer_Array.length; ++i ) {
      let weightArrayBuffer = weightArrayBuffer_Array[ i ];
      if ( !weightArrayBuffer )
        continue;

      {
        const weightElementOffsetBegin = 0;
        const byteOffset
          = weightElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT;

        const elementCount = Math.floor(
          weightArrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT );

        const aFloat32Array
          = new Float32Array( weightArrayBuffer, byteOffset, elementCount );

        // Ensure there is no NaN value in the weight array.
        // (Force NaN to 0.)
        const restrictedWeightArray = Weights.Base.ValueBounds
          .Float32Array_RestrictedClone( aFloat32Array );

        weightArrayBuffer_Array[ i ] = restrictedWeightArray.buffer;
      }
    }
  }

  /**
   *
   * Note: The .alignmentMarkValueArrayArray will be cleared.
   *
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

      // Since (re-)initialization, no alignment marks.
      if ( this.alignmentMarkValueArrayArray )
        this.alignmentMarkValueArrayArray.length = 0;

      if ( this.ScaleFiller )
        this.ScaleFiller = undefined;

      if ( this.neuralNetArray )
        this.neuralNetArray.clear(); // Release old neural networks.

      {
        this.weightArrayBuffer_partitionId = undefined;

        this.weightArrayBuffer_partitionCount = undefined;
        this.weightArrayBuffer_partitionElementCount = undefined;

        this.weightArrayBuffer_elementCount = undefined;

        if ( this.weightArrayBuffer_Array )
          this.weightArrayBuffer_Array = undefined;
      }

      if ( this.neuralNetParamsBase_Array )
        this.neuralNetParamsBase_Array = undefined;
    }

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
//
// Perhaps, needs a life-cycle manager to handle them gracefully.

    return { value: bInitOk };
  }



//!!! (Old Codes)
// (2025/05.14 Remarked) Re-written by NeuralNetArray_recreate()
//
//   /**
//    * Note1: The .ScaleFiller will be re-created.
//    * Note2: The .alignmentMarkValueArrayArray will be cleared.
//    *
//    *
//    * @param {Object[]} neuralNetParamsBase_Array
//    *   An array of object. Every element is an object looks like
//    * NeuralNet.ParamsBase.
//    *
//    * @param {ArrayBuffer[]} weightArrayBuffer_Array
//    *   An array of every neural network's weights. Every element will be
//    * interpreted as Float32Array.
//    *
//    * @param {boolean} bLogDryRunTime
//    *   If true, the neural network dry-run time will be measured twice and
//    * logged to console.
//    *
//    * @yield {boolean}
//    *   - Yield { done: true, value: { value: true } }, if succeeded.
//    *   - Yield { done: true, value: { value: false } }, if failed.
//    */
//   async* NeuralNetArray_create(
//     neuralNetParamsBase_Array, weightArrayBuffer_Array, bLogDryRunTime ) {
//
//     const funcNameInMessage = "NeuralNetArray_create";
//
//     // 0.
//
//     // 0.1 Keep neural network parameters and weights so that the neural
//     //     network(s) can be re-created (perhaps, with different part of the
//     //     weightArrayBuffer).
//     this.neuralNetParamsBase_Array = neuralNetParamsBase_Array;
//     this.weightArrayBuffer_Array = weightArrayBuffer_Array;
//
//     // 0.2 Since (re-)creation, no alignment marks.
//     if ( this.alignmentMarkValueArrayArray )
//       this.alignmentMarkValueArrayArray.length = 0;
//
//     // 0.3 Prepare container for all neural networks.
//     {
//       if ( this.neuralNetArray )
//         this.neuralNetArray.clear(); // Release old neural networks.
//       else
//         this.neuralNetArray = Recyclable.OwnerArray.Pool.get_or_create_by();
//
//       this.neuralNetArray.length = neuralNetParamsBase_Array.length;
//     }
//
//     // 0.4
//     this.ScaleFiller = undefined;
//
//     // 1. Create every neural network.
//     let progress;
//     try {
//       let bAllOk = true;
//       for ( let i = 0; i < neuralNetParamsBase_Array.length; ++i ) {
//         let neuralNetParamsBase = neuralNetParamsBase_Array[ i ];
//         let weightArrayBuffer = weightArrayBuffer_Array[ i ];
//
//         let inputWeightArray;
//         {
// //!!! ...unfinished... (2025/05/14)
// // Perhaps, pass weightElementOffsetBegin and weightArrayBuffer.byteLength
// // from caller. (Inside neuralNetParams?)
// //
// // Note1: The weightArrayBuffer_Array should be kept in this NeuralWorker_Body
// // because it is transferred to this NeuralWorker_Body (no longer accessible
// // by NeuralWorker_Proxy). So that it can be used to create another neural
// // network in the future.
// //
// // Note2: Perhaps, re-create neural network when alignmentMark swapping.
// //
//
//           let weightElementOffsetBegin = 0;
//           let byteOffset
//             = weightElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT;
//
//           let elementCount = Math.floor(
//             weightArrayBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT );
//
//           let aFloat32Array
//             = new Float32Array( weightArrayBuffer, byteOffset, elementCount );
//
//           // Ensure there is no NaN value in the weight array.
//           // (Force NaN to 0.)
//           inputWeightArray = Weights.Base.ValueBounds
//             .Float32Array_RestrictedClone( aFloat32Array );
//         }
//
//         // In web worker, the input of neural network will not be used by
//         // others. Force the neural network release its input tensor.
//         neuralNetParamsBase.bKeepInputTensor = false;
//
//         let neuralNetParams = NeuralNet.Params
//           .get_or_create_by_NeuralNetParamsBase( neuralNetParamsBase );
//
//         progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
//
//         // Note: Put into this.neuralNetArray[] so that it could be released
//         //       even if its .init is failed and throws exception.
//         let neuralNet = this.neuralNetArray[ i ]
//           = NeuralNet.Base.Pool.get_or_create_by();
//
//         let bInitOk = neuralNet.init( progress,
//           inputWeightArray, 0, neuralNetParams );
//
//         if ( false == bInitOk ) {
//
//           // Note1: Because neuralNetParams has been destroyed by
//           //        NeuralNet.Base.init(), log neuralNetParamsBase instead.
//           //
//           // Note2: Because neuralNetParamsBase looks like (but not)
//           //        NeuralNet.ParamsBase, call .toString explicitly.
//           let strNeuralNetParamsBase = NeuralNet.ParamsBase.prototype
//             .toString.call( neuralNetParamsBase );
//
//           throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
//             + `Failed to initialize neuralNetArray[ ${i} ] object. `
//             + `progress.valuePercentage=${progress.valuePercentage}, `
//             + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }, `
//             + `neuralNet={ ${neuralNet} }.`
//           );
//         }
//
//         progress.disposeResources_and_recycleToPool();
//         progress = null;
//
//         // Create NeuralNet_ScaleFiller.
//         if ( this.ScaleFiller ) {
//           if (   ( neuralNet.input_height
//                      != this.ScaleFiller.target_height )
//               || ( neuralNet.input_width
//                      != this.ScaleFiller.target_width )
//               || ( neuralNet.input_channelCount
//                      != this.ScaleFiller.target_channelCount ) )
//
//             throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
//               + `neuralNetArray[ ${i} ]'s `
//               + `( input_height, input_width, input_channelCount ) = ( `
//               + `${neuralNet.input_height}, `
//               + `${neuralNet.input_width}, `
//               + `${neuralNet.input_channelCount} ) `
//               + `should be the same as another neuralNet's ( `
//               + `${this.ScaleFiller.target_height}, `
//               + `${this.ScaleFiller.target_width}, `
//               + `${this.ScaleFiller.target_channelCount} ). `
//               + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }.`
//             );
//
//         } else {
//           this.ScaleFiller = new NeuralNet.ScaleFiller(
//             neuralNet.input_height,
//             neuralNet.input_width,
//             neuralNet.input_channelCount
//           );
//         }
//
//         bAllOk = bAllOk && bInitOk;
//
//         // If need log dry-run time, also log neural network weight count.
//         if ( bLogDryRunTime ) {
//           let strWeightCountInfo = neuralNet.toString_WeightCount();
//           let logMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
//             + `${strWeightCountInfo}.`;
//           console.log( logMsg );
//         }
//       }
//
//       // Compile shaders and upload tensor to GPU if backend is webgl.
//       NeuralWorker_Body.NeuralNetArray_compileShaders_uploadTensors_ifWebGL
//         .call( this, bLogDryRunTime );
//
//       if ( bAllOk )
//         return { value: true };
//       else
//         return { value: false };
//
//     } catch ( e ) {
//       let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
//         + `workerId=${this.workerId}. ${e}`;
//       console.error( errorMsg );
//       //debugger;
//       throw e;
//
//     } finally {
//       if ( progress ) {
//         progress.disposeResources_and_recycleToPool();
//         progress = null;
//       }
//     }
//   }


  /**
   * Note1: The .ScaleFiller will be re-created.
   * Note2: The .alignmentMarkValueArrayArray will be cleared.
   *
   *
   * @param {Object[]} neuralNetParamsBase_Array
   *   An array of object. Every element is an object looks like
   * NeuralNet.ParamsBase.
   *
   * @param {ArrayBuffer[]} weightArrayBuffer_Array
   *   An array of every neural network's weights. Every element will be
   * interpreted as Float32Array.
   *
   * @param {number} weightArrayBuffer_partitionCount
   *   A positive integer to view a weightArrayBuffer as how many parts. At
   * least 1. It could be used to create different neural network by using
   * different part of the weightArrayBuffer.
   *
   * @param {number} weightArrayBuffer_partitionId
   *   An integer between 0 and ( weightArrayBuffer_partitionCount - 1 ) means
   * which part of a weightArrayBuffer is used to create current neural network.
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
    neuralNetParamsBase_Array,

    weightArrayBuffer_Array,
    weightArrayBuffer_partitionCount,
    weightArrayBuffer_partitionId,

    bLogDryRunTime ) {

    const funcNameInMessage = "NeuralNetArray_create";

    try {

      // 0.

      // 0.1 Keep neural network parameters and weights so that the neural
      //     network(s) can be re-created (perhaps, with different part of the
      //     weightArrayBuffer).
      this.neuralNetParamsBase_Array = neuralNetParamsBase_Array;

      this.weightArrayBuffer_Array = weightArrayBuffer_Array;

      const weightArrayBuffer_elementCount
        = this.weightArrayBuffer_elementCount
        = Math.floor(
            weightArrayBuffer[ 0 ].byteLength
              / Float32Array.BYTES_PER_ELEMENT );

      {
        weightArrayBuffer_partitionCount
          = Math.trunc( weightArrayBuffer_partitionCount ); // Ensure integer.

        if ( weightArrayBuffer_partitionCount < 1 )
          weightArrayBuffer_partitionCount = 1; // Ensure positive integer.

        this.weightArrayBuffer_partitionCount
          = weightArrayBuffer_partitionCount;

        this.weightArrayBuffer_partitionElementCount = Math.floor(
          weightArrayBuffer_elementCount / weightArrayBuffer_partitionCount );
      }

      // 0.2 Ensure there is no NaN value in the weight array. (Force NaN to 0.)
      NeuralWorker_Body.weightArrayBuffer_Array_ensure_no_NaN.call( this );

      // 0.3 Re-create .ScaleFiller.
      this.ScaleFiller = undefined;

      // 1. Create every neural network.
      let bAllOk = NeuralWorker_Body.NeuralNetArray_recreate.call( this,
        weightArrayBuffer_partitionId, bLogDryRunTime );

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
    }
  }

  /**
   * Note:
   *   - The .neuralNetParamsBase_Array and .weightArrayBuffer_Array (assumed
   *       no NaN) and weightArrayBuffer_partitionXxx will be used to re-create
   *       neural network(s).
   * 
   *   - The created neural network(s) will be placed in this.neuralNetArray[].
   * 
   *   - If .ScaleFiller exists, it will NOT be re-created.
   *     If .ScaleFiller does not exist, it will be created.
   *
   *   - The .alignmentMarkValueArrayArray will NOT be cleared (i.e.
   *       will be kept).
   *
   *
   * @param {number} weightArrayBuffer_partitionId
   *   An integer between 0 and ( weightArrayBuffer_partitionCount - 1 ) means
   * which part of a weightArrayBuffer is used to create current neural network.
   * 
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and
   * logged to console.
   *
   * @return {boolean}
   *   - true, if succeeded.
   *   - false, if failed.
   */
  static NeuralNetArray_recreate(
    weightArrayBuffer_partitionId,
    bLogDryRunTime ) {

    const funcNameInMessage = "NeuralNetArray_recreate";

    // 0.

    // 0.1 Use kept neural network parameters and weights.
    const neuralNetParamsBase_Array = this.neuralNetParamsBase_Array;
    const weightArrayBuffer_Array = this.weightArrayBuffer_Array;

    const weightArrayBuffer_partitionCount
      = this.weightArrayBuffer_partitionCount;

    const weightArrayBuffer_partitionElementCount
      = this.weightArrayBuffer_partitionElementCount

    { // Ensure PartitionId is integer between [ 0, ( PartitionCount - 1 ) ]

      weightArrayBuffer_partitionId
        = Math.trunc( weightArrayBuffer_partitionId );

      if ( weightArrayBuffer_partitionId < 0 )
        weightArrayBuffer_partitionId = 0;

      if ( weightArrayBuffer_partitionId >= weightArrayBuffer_partitionCount )
        weightArrayBuffer_partitionId = weightArrayBuffer_partitionCount - 1;

      this.weightArrayBuffer_partitionId = weightArrayBuffer_partitionId;
    }

    // 0.2 Prepare container for all neural networks.
    {
      if ( this.neuralNetArray )
        this.neuralNetArray.clear(); // Release old neural networks.
      else
        this.neuralNetArray = Recyclable.OwnerArray.Pool.get_or_create_by();

      this.neuralNetArray.length = neuralNetParamsBase_Array.length;
    }

    // 1. Create every neural network.
    let progress;
    try {
      const weightArrayBuffer_elementOffsetBegin
        = weightArrayBuffer_partitionId
            * weightArrayBuffer_partitionElementCount;

      const weightArrayBuffer_byteOffset
        = weightArrayBuffer_elementOffsetBegin
            * Float32Array.BYTES_PER_ELEMENT;


      let bAllOk = true;
      for ( let i = 0; i < neuralNetParamsBase_Array.length; ++i ) {
        let neuralNetParamsBase = neuralNetParamsBase_Array[ i ];
        let weightArrayBuffer = weightArrayBuffer_Array[ i ];

//!!! ...unfinished... (2025/05/14)
// Perhaps, pass weightElementOffsetBegin and weightArrayBuffer.byteLength
// from caller. (Inside neuralNetParams?)
//
// Note: Perhaps, re-create neural network when alignmentMark swapping.
//
        let inputWeightArray = new Float32Array(
          weightArrayBuffer,
          weightArrayBuffer_byteOffset,
          weightArrayBuffer_partitionElementCount );

        // In web worker, the input of neural network will not be used by
        // others. Force the neural network release its input tensor.
        neuralNetParamsBase.bKeepInputTensor = false;

        let neuralNetParams = NeuralNet.Params
          .get_or_create_by_NeuralNetParamsBase( neuralNetParamsBase );

        progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

        // Note: Put into this.neuralNetArray[] so that it could be released
        //       even if its .init is failed and throws exception.
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

        // Create NeuralNet_ScaleFiller.
        if ( this.ScaleFiller ) {
          if (   ( neuralNet.input_height
                     != this.ScaleFiller.target_height )
              || ( neuralNet.input_width
                     != this.ScaleFiller.target_width )
              || ( neuralNet.input_channelCount
                     != this.ScaleFiller.target_channelCount ) )

            throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
              + `neuralNetArray[ ${i} ]'s `
              + `( input_height, input_width, input_channelCount ) = ( `
              + `${neuralNet.input_height}, `
              + `${neuralNet.input_width}, `
              + `${neuralNet.input_channelCount} ) `
              + `should be the same as another neuralNet's ( `
              + `${this.ScaleFiller.target_height}, `
              + `${this.ScaleFiller.target_width}, `
              + `${this.ScaleFiller.target_channelCount} ). `
              + `neuralNetParamsBase={ ${strNeuralNetParamsBase} }.`
            );

        } else {
          this.ScaleFiller = new NeuralNet.ScaleFiller(
            neuralNet.input_height,
            neuralNet.input_width,
            neuralNet.input_channelCount
          );
        }

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
        return true;
      else
        return false;

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
  static NeuralNetArray_compileShaders_uploadTensors_ifWebGL(
    bLogDryRunTime ) {

    let backendName = tf.getBackend();
    if ( backendName != "webgl" )
      return; // Only WebGL needs compile shaders.

    const funcNameInMessage
      = "NeuralNetArray_compileShaders_uploadTensors_ifWebGL";

    try {
      let outputTensor;
      for ( let i = 0; i < this.neuralNetArray.length; ++i ) {
        let neuralNet = this.neuralNetArray[ i ];

        if ( bLogDryRunTime ) {
          const nDryRunTimes = 2;
          let timeElapsedArray = new Array( nDryRunTimes );
          for ( let j = 0; j < nDryRunTimes; ++j ) {
            try {
              let sourceTensor = tf.zeros( neuralNet.input_shape, "int32" );

              let timeBegin = Date.now();
              outputTensor = neuralNet.apply( sourceTensor );
              let timeEnd = Date.now();
              let timeElapsed = timeEnd - timeBegin;
              timeElapsedArray[ j ] = timeElapsed;

            } finally {
              if ( outputTensor ) {
                outputTensor.dispose();
                outputTensor = null;
              }
            }
          }
          console.log( `NeuralWorker_Body.${funcNameInMessage}(): `
            + `workerId=${this.workerId}, neuralNetIndex=${i}, `
            + `timeElapsed0=${timeElapsedArray[ 0 ]}, `
            + `timeElapsed1=${timeElapsedArray[ 1 ]}`
          );

        } else { // ( bLogDryRunTime == false )
          try {
            let sourceTensor = tf.zeros( neuralNet.input_shape, "int32" );
            outputTensor = neuralNet.apply( sourceTensor );
          } finally {
            if ( outputTensor ) {
              outputTensor.dispose();
              outputTensor = null;
            }
          }
        }
      }
    } catch ( e ) {
      let errorMsg = `NeuralWorker_Body.${funcNameInMessage}(): `
        + `workerId=${this.workerId}. ${e}`;
      console.error( errorMsg );
      //debugger;
      throw e;
    }
  }

  /** Release the neural network. */
  NeuralNetArray_dispose() {
    if ( this.neuralNetArray ) {
      this.neuralNetArray.disposeResources_and_recycleToPool();
      this.neuralNetArray = null;
    }
  }

  get alignmentMarkValueArrayArray_nonEmpty() {
    if (   ( this.alignmentMarkValueArrayArray )
        && ( this.alignmentMarkValueArrayArray.length > 0 ) )
      return true;
    return false;
  }


//!!! ...unfinished... (2025/05/14)
// Add alignmentMarkValueArrayArray_swap()
//

  /**
   * The alignmentMarkValueArrayArray will be owned and kept directly.
   *
   * @yield {boolean}
   *   - Yield { done: true, value: { value: true } }.
   */
  async* alignmentMarkValueArrayArray_set( alignmentMarkValueArrayArray ) {
    const funcNameInMessage = "alignmentMarkValueArrayArray_set";

    // 1. non-empty alignment mark value array array.
    if (   ( alignmentMarkValueArrayArray )
        && ( alignmentMarkValueArrayArray.length > 0 ) ) {

      if ( !this.neuralNetArray )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `should be called after `
          + `NeuralWorker_Body.NeuralNetArray_create() has done.`
        );

      if ( alignmentMarkValueArrayArray.length != this.neuralNetArray.length )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `alignmentMarkValueArrayArray.length `
          + `( ${alignmentMarkValueArrayArray.length} ) `
          + `should be either 0 or the same as `
          + `.neuralNetCount ( ${this.neuralNetArray.length} ).`
        );

      // Check the alignment mark value array length.
      const input_channelCount = this.neuralNetArray[ 0 ].input_channelCount;
      for ( let neuralNetIndex = 0;
        neuralNetIndex < alignmentMarkValueArrayArray.length;
        ++neuralNetIndex ) {

        const alignmentMarkValueArrayLength
          = alignmentMarkValueArrayArray[ neuralNetIndex ]?.length;

        if ( alignmentMarkValueArrayLength != input_channelCount )
        throw Error( `NeuralWorker_Body.${funcNameInMessage}(): `
          + `alignmentMarkValueArrayArray[ ${neuralNetIndex} ].length `
          + `( ${alignmentMarkValueArrayLength} ) `
          + `should be the same as `
          + `.input_channelCount ( ${input_channelCount} ).`
        );
      }

      // Hold the received alignment mary value array array directly.
      this.alignmentMarkValueArrayArray = alignmentMarkValueArrayArray;

    } else { // 2. empty alignment mark value array array.
    if ( this.alignmentMarkValueArrayArray )
        this.alignmentMarkValueArrayArray.length = 0;
    }

    return { value: true };
  }

  /** Release the alignmentMarkValueArrayArray. */
  alignmentMarkValueArrayArray_dispose() {
    this.alignmentMarkValueArrayArray = undefined;
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
   *   - If its shape matches this.neuralNet[ n ]'s [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
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
   * output of the (pair of) neural network(s). It could be null which means do
   * not fill feedback (i.e. previous time output) into the source_TypedArray.
   *
   * @yield {Float32Array[] | Int32Array[]}
   *   Resolve to { done: true, value: { value: [ TypedArray, TypedArray ],
   * transferableObjectArray: [ TypedArray.buffer, TypedArray.buffer ] }.
   * The value is an array of TypedArray representing all neural networks'
   * result whose length is this.neuralNetArray[].output_channelCount.
   * The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  async* ONE_WORKER__TWO_NET__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArrayArray ) {

    const funcNameInMessage = "ONE_WORKER__TWO_NET__TypedArray_process";

    let outputTypedArrayPromiseArray
      = new Array( this.neuralNetArray.length );

    const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be true.

    // Even if there are two neural networks, their .feedbackShape should be
    // the same. So, just use the 1st neural network's feedbackShape.
    const feedbackShape = this.neuralNetArray[ 0 ].feedbackShape;

    let createTensor_asyncGenerator
      = this.ScaleFiller.createTensor_by_scale_fill_asyncGenerator(
          source_TypedArray, source_height, source_width,
          bTwoTensors,
          feedbackShape,
          this.alignmentMarkValueArrayArray, previous_output_TypedArrayArray
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
          outputTypedArrayPromiseArray[ i ] = outputTensor.data();

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

    // 4. Wait for all downloading from GPU to CPU completely.
    let outputTypedArrayArray
      = await Promise.all( outputTypedArrayPromiseArray );

    let outputTransferableObjectArray
      = new Array( outputTypedArrayArray.length );

    for ( let i = 0; i < outputTypedArrayArray.length; ++i ) {
      outputTransferableObjectArray[ i ]
        = outputTypedArrayArray[ i ].buffer;
    }

    return {
      value: outputTypedArrayArray,
      transferableObjectArray: outputTransferableObjectArray
    };
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLY (1)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER (2)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back
   *       to WorkerProxy.
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
   *   - If its shape matches this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
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
   *   A TypedArray representing the previous time output of the neural
   * network. It could be null which means do not fill feedback (i.e. previous
   * time output) into the source_TypedArray.
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
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  async* TWO_WORKER__TWO_NET__step0__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__step0__TypedArray_process";

    const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be false.

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    const feedbackShape = this.neuralNetArray[ neuralNetIndex ].feedbackShape;

    let previous_output_TypedArrayArray;
    if ( previous_output_TypedArray )
      previous_output_TypedArrayArray = [ previous_output_TypedArray ];

    let createTensor_asyncGenerator
      = this.ScaleFiller.createTensor_by_scale_fill_asyncGenerator(
          source_TypedArray, source_height, source_width,
          bTwoTensors,
          feedbackShape,
          this.alignmentMarkValueArrayArray, previous_output_TypedArrayArray
        );

    let outputTensor;
    let outputTypedArray;
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
        let outputTypedArrayPromise = outputTensor.data();

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

        outputTypedArray = await outputTypedArrayPromise;

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

        let outputTypedArrayPromise = outputTensor.data();
        outputTypedArray = await outputTypedArrayPromise;
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
      value: outputTypedArray,
      transferableObjectArray: [ outputTypedArray.buffer ]
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
   *   - If its shape matches this.neuralNet[ 0 ]'s [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
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
   *   A TypedArray representing the previous time output of the neural
   * network. It could be null which means do not fill feedback (i.e. previous
   * time output) into the source_TypedArray.
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: { value: TypedArray,
   * transferableObjectArray: [ TypedArray.buffer ] }. The value is a
   * TypedArray representing the neural network's result whose length is
   * this.neuralNet[ 0 ].output_channelCount. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  async* TWO_WORKER__TWO_NET__step1__TypedArray_process(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray ) {

    const funcNameInMessage
      = "TWO_WORKER__TWO_NET__step1__TypedArray_process";

    const bTwoTensors = ( this.neuralNetArray.length > 1 ); // should be false.

    const neuralNetIndex = 0; // Always use the first neural network.
    let neuralNet = this.neuralNetArray[ neuralNetIndex ];

    const feedbackShape = this.neuralNetArray[ neuralNetIndex ].feedbackShape;

    let previous_output_TypedArrayArray;
    if ( previous_output_TypedArray )
      previous_output_TypedArrayArray = [ previous_output_TypedArray ];

    let createTensor_asyncGenerator
      = this.ScaleFiller.createTensor_by_scale_fill_asyncGenerator(
          source_TypedArray, source_height, source_width,
          bTwoTensors,
          feedbackShape,
          this.alignmentMarkValueArrayArray, previous_output_TypedArrayArray
        );

    let outputTensor;
    let outputTypedArrayPromise;
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
      outputTypedArrayPromise = outputTensor.data();

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

    let outputTypedArray = await outputTypedArrayPromise;

    return {
      value: outputTypedArray,
      transferableObjectArray: [ outputTypedArray.buffer ]
    };
  }

}

/** If true, tensorflow.js has been loaded. */
NeuralWorker_Body.tensorflowJs_imported = false;
