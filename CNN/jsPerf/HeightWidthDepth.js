export { HeightWidthDepth_Base as Base };

import * as PartTime from "../PartTime.js";
import * as NeuralNets_ShareInput from "../Neural/Nets_ShareInput.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * A test set.
 */
class HeightWidthDepth_Base {

  /**
   * @param {number} height      image height
   * @param {number} width       image width
   * @param {number} depth       image channel count
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete}  progressToAdvance
   *   Increase this when every time advanced. It will be initialized to zero when decoder starting.
   *
   * @param {ValueMax.Receiver.Base}  progressReceiver
   *   Every time the progress is advanced, progressReceiver.setValueMax( progressToYield ) will be called.
   */
  constructor( height, width, depth, progressToYield, progressToAdvance, progressReceiver ) {

    let canvasChannelCount = this.canvasChannelCount = 4;

    this.height = height;
    this.width = width;
    this.depth = depth;

    let depthwiseChannelMultiplierBlock0Step0 = depth / canvasChannelCount;

    this.progressToYield = progressToYield;
    this.progressToAdvance = progressToAdvance;
    this.progressReceiver = progressReceiver;

//!!! Since source is canvas, the channel count should be the same as the canvas.
//    this.valueCount = height * width * depth;
    this.valueCount = height * width * canvasChannelCount;

    this.targetSize = [ 1, 1 ]; // to 1x1. The final output always has height x width = 1 x 1 (i.e. only one pixel per channel)
    let targetHeight = this.targetSize[ 0 ];

    // The filter size for achieving target size in one step.
    let filterHeight_OneStep =      ( height - this.targetSize[ 0 ] ) + 1;
    let filterWidth_OneStep =       ( width - this.targetSize[ 1 ] ) + 1;

//!!! Change to create from canvas.
//     this.dataTensor3d = tf.tidy( () => {
//       let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
// //!!! Since source is canvas, the channel count should be the same as the canvas.
// //      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
//       let dataTensor3d = dataTensor1d.reshape( [ height, width, canvasChannelCount ] );
//       return dataTensor3d;
//     });

    let inChannels =        depth;
    let channelMultiplier = 1;

    // TestCanvas
    this.testCnavas = document.createElement( "canvas" );
    this.testCnavas.height = height;
    this.testCnavas.width = width;

    // [ stepCountPerBlock, bChannelShuffler, pointwise1ChannelCountRate, strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0,
    // bBias, strActivationName ]
    this.testNeuralNetsSpecTable = [
//      [  0, false, 1, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
//      [  0, false, 1, "Conv", filterHeight_OneStep,                                   200,  true,     "cos" ],

//      [  0, false, 1, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
      [  3, false, 1, "Conv",                    2,                                       1,  true,     "cos" ],  // MobileNetV1
      [  3, false, 2, "Conv",                    2,                                       1, false,     "cos" ],  // MobileNetV2 without bias
      [  3, false, 2, "Conv",                    2,                                       1,  true,     "cos" ],  // MobileNetV2
      [  3,  true, 1, "Conv",                    2,                                       1, false,     "cos" ],  // ShuffleNetV2 without bias
      [  3,  true, 1, "Conv",                    2,                                       1,  true,     "cos" ],  // ShuffleNetV2

//      [  0, false, 1, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
      [  3, false, 1, "Conv",                    3,                                       1,  true,     "cos" ],  // MobileNetV1
      [  3, false, 2, "Conv",                    3,                                       1, false,     "cos" ],  // MobileNetV2 without bias
      [  3, false, 2, "Conv",                    3,                                       1,  true,     "cos" ],  // MobileNetV2
      [  3,  true, 1, "Conv",                    3,                                       1, false,     "cos" ],  // ShuffleNetV2 without bias
      [  3,  true, 1, "Conv",                    3,                                       1,  true,     "cos" ],  // ShuffleNetV2

//      [  0, false, 1, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
      [  3, false, 1, "Conv",                    5,                                       1,  true,     "cos" ],  // MobileNetV1
      [  3, false, 2, "Conv",                    5,                                       1, false,     "cos" ],  // MobileNetV2 without bias
      [  3, false, 2, "Conv",                    5,                                       1,  true,     "cos" ],  // MobileNetV2
      [  3,  true, 1, "Conv",                    5,                                       1, false,     "cos" ],  // ShuffleNetV2 without bias
      [  3,  true, 1, "Conv",                    5,                                       1,  true,     "cos" ],  // ShuffleNetV2

//      [  0, false, 1, "Conv",                    7, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
      [  3, false, 1, "Conv",                    7,                                       1,  true,     "cos" ],  // MobileNetV1
      [  3, false, 2, "Conv",                    7,                                       1, false,     "cos" ],  // MobileNetV2 without bias
      [  3, false, 2, "Conv",                    7,                                       1,  true,     "cos" ],  // MobileNetV2
      [  3,  true, 1, "Conv",                    7,                                       1, false,     "cos" ],  // ShuffleNetV2 without bias
      [  3,  true, 1, "Conv",                    7,                                       1,  true,     "cos" ],  // ShuffleNetV2

//      [  0, false, 1, "Conv",                    9, depthwiseChannelMultiplierBlock0Step0,  true,     "cos" ],
      [  3, false, 1, "Conv",                    9,                                       1,  true,     "cos" ],  // MobileNetV1
      [  3, false, 2, "Conv",                    9,                                       1, false,     "cos" ],  // MobileNetV2 without bias
      [  3, false, 2, "Conv",                    9,                                       1,  true,     "cos" ],  // MobileNetV2
      [  3,  true, 1, "Conv",                    9,                                       1, false,     "cos" ],  // ShuffleNetV2 without bias
      [  3,  true, 1, "Conv",                    9,                                       1,  true,     "cos" ],  // ShuffleNetV2
    ];

//!!! Change to create one and test one.
    // Create test filters.
    this.testNeuralNetsArray = this.testNeuralNetsSpecTable.map( ( filtersSpec, i ) => {
      let testNeuralNets = new NeuralNets_ShareInput.Base();
      let config = new NeuralNets_ShareInput.Config( height, width, canvasChannelCount, ...filtersSpec );
      testNeuralNets.init( config );
      return testNeuralNets;
    });

    // Initialize progress accumulator.

    // "+3" for test_FromPixels, test_ResizeNearestNeighbor and test_ResizeBilinear.
    // "*2" for compiling (with assert) and profiling.
    progressToAdvance.total = ( this.testNeuralNetsSpecTable.length + 3 ) * 2;
    progressToAdvance.accumulation = 0;
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      tf.dispose( this.dataTensor3d );
      this.dataTensor3d = null;
    }

    // Release test filters.
    if ( this.testNeuralNetsArray ) {
      this.testNeuralNetsArray.forEach( ( testNeuralNets, i ) => {
        testNeuralNets.disposeTensors();
      });
      this.testNeuralNetsArray = null;
    }

    this.testNeuralNetsSpecTable = null;
  }

  // Test from-pixels
  test_FromPixels( bReturn ) {
    return tf.tidy( () => {
      let t = tf.browser.fromPixels( this.testCnavas, 4 );  // 4 channels.
      if ( bReturn )
        return t;
    });
  }

  // Test rsize-nearest-neighbor
  test_ResizeNearestNeighbor( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.resizeNearestNeighbor( this.targetSize, true );
      if ( bReturn )
        return t;
    });
  }

//!!! ...unfinished...
// resize 1/2 v.s. tf.pool( windowShape = [ 2, 2 ], poolingType = “avg”, pad = “valid”, dilations = 1, strides = 2 )
  // Test rsize-bilinear 
  test_ResizeBilinear( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.resizeBilinear( this.targetSize, true );
      if ( bReturn )
        return t;
    });
  }

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d(
                this.depthwiseConv_3x3.depthwiseConvFiltersTensor4dArray[ 0 ], 2, "same" );
      if ( bReturn )
        return t;
    });
  }

  /** Advance the progressToAdvance, and report progressToYield to progressReceiver. */
  * progressAdvanceYield() {
    ++this.progressToAdvance.accumulation;
    yield this.progressToYield;
  }

  /**
   * Generate all test cases' performance profile.
   * Testing whether the results of different implementation are the same.
   *
   * @yield {ValueMax.Percentage.Aggregate or Object[]}
   *   Yield ( value = progressToYield ) when ( done = false ).
   *   Yield ( value = array of profile infomation { title, backendName, newBytes, newTensors, peakBytes, kernelMs, wallMs } ) when ( done = true ).
   */
  async * profilesGenerator() {
    let resultProfiles = [];

    // First pass is for letting tensorflow's kernel to compile the codes.
    // Second pass is for performance profiling.

    if ( !this.dataTensor3d )
      this.dataTensor3d = tf.browser.fromPixels( this.testCnavas, this.canvasChannelCount );

    let tensor_FromPixels;
    {
      tensor_FromPixels = this.test_FromPixels( true );
      yield* this.progressAdvanceYield();

      if ( 3 != tensor_FromPixels.rank )
        throw Error( `${tensor_FromPixels.rank} != 3` );  // tensor3d

      if ( tensor_FromPixels.shape[ 0 ] != this.height )
        throw Error( `fromPixels Height ${tensor_FromPixels.shape[ 0 ]} != ${this.height}` );

      if ( tensor_FromPixels.shape[ 1 ] != this.width )
        throw Error( `fromPixels Width ${tensor_FromPixels.shape[ 1 ]} != ${this.width}` );

      if ( tensor_FromPixels.shape[ 2 ] != 4 ),
        throw Error( `fromPixels Depth ${tensor_FromPixels.shape[ 2 ]} != 4` );  // 4 channels.

      tensor_FromPixels.dispose();
    }

    let tensor_ResizeNearestNeighbor, tensor_ResizeBilinear;
    {
//      let quarterTensor_3x3_Stride2 =             this.test_DepthwiseConv2d_3x3_Stride2( true );
      tensor_ResizeNearestNeighbor =   this.test_ResizeNearestNeighbor( true );
      yield* this.progressAdvanceYield();

      tensor_ResizeBilinear =          this.test_ResizeBilinear( true );
      yield* this.progressAdvanceYield();

//       if ( !tf.util.arraysEqual( quarterTensor_11x11.shape, quarterTensor_3x3_Stride2.shape ) )
//         throw Error( `DepthwiseConv2d_11x11_MultiStep() != DepthwiseConv2d_3x3_Stride2()` );
//
//       if ( !tf.util.arraysEqual( quarterTensor_3x3_Stride2.shape, quarterTensor_ResizeBilinear.shape ) )
//         throw Error( `DepthwiseConv2d_3x3_Stride2() != ResizeBilinear()` );

      if ( !tf.util.arraysEqual( tensor_ResizeBilinear.shape, tensor_ResizeNearestNeighbor.shape ) )
        throw Error( `ResizeBilinear() != ResizeNearestNeighbor()` );

      tensor_ResizeNearestNeighbor.dispose();
      tensor_ResizeBilinear.dispose();
    }

    // All test filters should generate same size result.
    let tensorArray = [];
    for ( let i = 0; i < this.testNeuralNetsArray.length; ++i ) {
      let testNeuralNets = this.testNeuralNetsArray[ i ];

      testNeuralNets.apply_sync( this.testCnavas, tensorArray );
      let t = tensorArray[ 0 ];  // Assume only one neural network.

      let originalChannelCount = ( t.shape[ 2 ] / testNeuralNets.neuralNetworkArray[ 0 ].totalChannelExpansionFactor );

      if ( !tf.util.arraysEqual(
             [ t.shape[ 0 ], t.shape[ 1 ], originalChannelCount ], tensor_ResizeBilinear.shape ) )
        throw Error( `Shape ${testNeuralNets.name}() != ResizeBilinear()` );

      t.dispose();

      yield* this.progressAdvanceYield();
    }


    // The above codes also compiles the codes.
    // Since the codes compiled, their execute time can be tested now.

    resultProfiles.push( await this.logProfile( "FromPixels", this.test_FromPixels.bind( this ) ) );
    yield* this.progressAdvanceYield();

    resultProfiles.push( await this.logProfile( "ResizeNearestNeighbor", this.test_ResizeNearestNeighbor.bind( this ) ) );
    yield* this.progressAdvanceYield();

    resultProfiles.push( await this.logProfile( "ResizeBilinear", this.test_ResizeBilinear.bind( this ) ) );
    yield* this.progressAdvanceYield();

    // All test filters in array.
    for ( let i = 0; i < this.testNeuralNetsArray.length; ++i ) {
      let testNeuralNets = this.testNeuralNetsArray[ i ];

      // Note: Do not return the result tensor so that need not to dispose them.
      resultProfiles.push(
        await this.logProfile(
          testNeuralNets.neuralNetworkArray[ 0 ].structure, testNeuralNets.apply_sync.bind( testNeuralNets, this.testCnavas, null ) ) );

      yield* this.progressAdvanceYield();
    }

//!!! ...unfinshed... Using console.time() to measure async function execution time.

    if ( this.dataTensor3d ) {
      tf.dispose( this.dataTensor3d );
      this.dataTensor3d = null;
    }

    return resultProfiles;
  }

  /**
   * Collect all test cases' performance profile.
   *
   * @return {Object[]}
   *   Return array of profile infomation { title, backendName, newBytes, newTensors, peakBytes, kernelMs, wallMs }.
   */
  async generateProfiles() {
    let tensorMemoryBefore = tf.memory();

    let generator = this.profilesGenerator();

    let delayMilliseconds = 0;
    let resultProfiles = await PartTime.forOf(
      generator,
      ( valueMax ) => { this.progressReceiver.setValueMax( valueMax ); }, // Report progress to UI.
      delayMilliseconds
    );

    this.progressReceiver.informDone(); // Inform UI progress done.

    let tensorMemoryAfter = tf.memory();

    // Detect memory leak.
    if ( tensorMemoryAfter.numBytes != tensorMemoryBefore.numBytes )
      throw Error(
        `tensorMemoryAfter.numBytes (${tensorMemoryAfter.numBytes}) != tensorMemoryBefore.numBytes (${tensorMemoryBefore.numBytes})` );

    return resultProfiles;
  }

  /**
   * @return {Object}
   *   Return profile infomation { title, backendName, newBytes, newTensors, peakBytes, kernelMs, wallMs }.
   */
  async logProfile( title, func ) {

    // Get backend name before the following promise. Otherwise, it may be changed when the function been executed.
    let backendName = tf.getBackend();

    let profile = await tf.profile( func );
    let time = await tf.time( func );

    console.log(
       `${title} (${backendName}): `

     + `newBytes: ${profile.newBytes}, `
     + `newTensors: ${profile.newTensors}, `
     + `peakBytes: ${profile.peakBytes}, `
//     + `byte usage over all kernels: ${profile.kernels.map(k => k.totalBytesSnapshot)}, `

     + `kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);

    let resultProfile = {
      title: title,
      backendName: backendName,
      newBytes: profile.newBytes,
      newTensors: profile.newTensors,
      peakBytes: profile.peakBytes,
      kernelMs: time.kernelMs,
      wallMs: time.wallMs
    };

    return resultProfile;
  }
}
