import * as PartTime from "../PartTime.js";
import * as TestFilters2D from "./TestFilters2D.js";
//import * as TensorTools from "../util/TensorTools.js";

export { Base };

/**
 * A test set.
 */
class Base {

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

    let canvasChannelCount = 4;

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

    // About half, but the difference should be divisable by 2.
//    this.targetSize = [ Math.floor( height / 20 ) * 10, Math.floor( width / 20 ) * 10 ];
    this.targetSize = [ 1, 1 ]; // to 1x1.
    let targetHeight = this.targetSize[ 0 ];

    // The filter size for achieving target size in one step.
    let filterHeight_OneStep =      ( height - this.targetSize[ 0 ] ) + 1;
    let filterWidth_OneStep =       ( width - this.targetSize[ 1 ] ) + 1;

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
//!!! Since source is canvas, the channel count should be the same as the canvas.
//      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, canvasChannelCount ] );
      return dataTensor3d;
    });

    let inChannels =        depth;
    let channelMultiplier = 1;

    // TestCanvas
    this.testCnavas = document.createElement( "canvas" );
    this.testCnavas.height = height;
    this.testCnavas.width = width;

    // [ stepCountPerBlock, bShuffleNetV2, strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName ]
    this.testFiltersSpecTable = [
      [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,    "relu" ],
//       [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,   "relu6" ],
//       [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true, "sigmoid" ],
      [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,    "tanh" ],
      [ 0, false, "Conv", filterHeight_OneStep, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],
      [ 0, false, "Conv", filterHeight_OneStep,                                   200,  true,     "sin" ],

      [ 0, false, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0, false,     "sin" ],
      [ 0, false, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],
      [ 1, false, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],
      [ 1,  true, "Conv",                    2, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],

      [ 0, false, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0, false,     "sin" ],
      [ 0, false, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv",                    3, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],

      [ 0, false, "Conv",                    5, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv",                    5, depthwiseChannelMultiplierBlock0Step0, false,     "sin" ],
      [ 0, false, "Conv",                    5, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv",                    5, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],

      [ 0, false, "Conv",                    7, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv",                    7, depthwiseChannelMultiplierBlock0Step0, false,     "sin" ],
      [ 0, false, "Conv",                    7, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv",                    7, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],

      [ 0, false, "Conv",                    9, depthwiseChannelMultiplierBlock0Step0, false,        "" ],
      [ 0, false, "Conv",                    9, depthwiseChannelMultiplierBlock0Step0, false,     "sin" ],
      [ 0, false, "Conv",                    9, depthwiseChannelMultiplierBlock0Step0,  true,        "" ],
      [ 0, false, "Conv",                    9, depthwiseChannelMultiplierBlock0Step0,  true,     "sin" ],
    ];

    // Create test filters.
    this.testFiltersArray = this.testFiltersSpecTable.map( ( filtersSpec, i ) => {
      let testFilters = new TestFilters2D.Base();
//!!! Since source is canvas, the channel count should be the same as the canvas.
//      testFilters.init( height, depth, targetHeight, ...filtersSpec );
      testFilters.init( height, canvasChannelCount, targetHeight, ...filtersSpec );
      return testFilters;
    });

    // Initialize progress accumulator.
    
    // "+3" for test_FromPixels, test_ResizeNearestNeighbor and test_ResizeBilinear.
    // "*2" for compiling (with assert) and profiling.
    progressToAdvance.total = ( this.testFiltersArray.length + 3 ) * 2;
    progressToAdvance.accumulation = 0;
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      tf.dispose( this.dataTensor3d );
      this.dataTensor3d = null;
    }

    // Release test filters.
    this.testFiltersArray.forEach( ( testFilters, i ) => {
      testFilters.disposeTensors();
    });
    this.testFiltersArray = null;
    this.testFiltersSpecTable = null;
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
   * Testing whether the results of different implementation are the same.
   *
   * @yield {ValueMax.Percentage.Aggregate or Object[]}
   *   Yield ( value = progressToYield ) when ( done = false ).
   *   Yield ( value = array of profile infomation { title, backendName, newBytes, newTensors, peakBytes, kernelMs, wallMs } ) when ( done = true ).
   */
  async * profilesGenerator() {
    let resultProfiles = [];

    let tensor_FromPixels;
    {
      tensor_FromPixels = this.test_FromPixels( true );
      yield* this.progressAdvanceYield();

      tf.util.assert(
        ( 3 == tensor_FromPixels.rank ),
        `${tensor_FromPixels.rank} != 3`);  // tensor3d

      tf.util.assert(
        ( tensor_FromPixels.shape[ 0 ] == this.height ),
        `fromPixels Height ${tensor_FromPixels.shape[ 0 ]} != ${this.height}`);

      tf.util.assert(
        ( tensor_FromPixels.shape[ 1 ] == this.width ),
        `fromPixels Width ${tensor_FromPixels.shape[ 1 ]} != ${this.width}`);

      tf.util.assert(
        ( tensor_FromPixels.shape[ 2 ] == 4 ),
        `fromPixels Depth ${tensor_FromPixels.shape[ 2 ]} != 4`);  // 4 channels.

      tensor_FromPixels.dispose();
    }

    let tensor_ResizeNearestNeighbor, tensor_ResizeBilinear;
    {
//      let quarterTensor_3x3_Stride2 =             this.test_DepthwiseConv2d_3x3_Stride2( true );
      tensor_ResizeNearestNeighbor =   this.test_ResizeNearestNeighbor( true );
      yield* this.progressAdvanceYield();

      tensor_ResizeBilinear =          this.test_ResizeBilinear( true );
      yield* this.progressAdvanceYield();

//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_11x11.shape, quarterTensor_3x3_Stride2.shape ),
//         `DepthwiseConv2d_11x11_MultiStep() != DepthwiseConv2d_3x3_Stride2()`);
//
//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_3x3_Stride2.shape, quarterTensor_ResizeBilinear.shape ),
//         `DepthwiseConv2d_3x3_Stride2() != ResizeBilinear()`);

      tf.util.assert(
        tf.util.arraysEqual( tensor_ResizeBilinear.shape, tensor_ResizeNearestNeighbor.shape ),
        `ResizeBilinear() != ResizeNearestNeighbor()`);

      tensor_ResizeNearestNeighbor.dispose();
      tensor_ResizeBilinear.dispose();
    }

    // All test filters should generate same size result.
    for ( let i = 0; i < this.testFiltersArray.length; ++i ) {
      let testFilters = this.testFiltersArray[ i ];

//!!! Using canvas as source.
//      let t = testFilters.apply( this.dataTensor3d, true );
      let t = testFilters.apply( this.testCnavas, true );

      tf.util.assert(
        tf.util.arraysEqual(
//!!! Now, output channel is the same as input channel count.
          [ t.shape[ 0 ], t.shape[ 1 ], ( t.shape[ 2 ] / testFilters.depthwiseChannelMultiplierBlock0Step0 ) ], tensor_ResizeBilinear.shape ),
//          [ t.shape[ 0 ], t.shape[ 1 ], t.shape[ 2 ] ], tensor_ResizeBilinear.shape ),
        `Shape ${testFilters.name}() != ResizeBilinear()`);

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
    for ( let i = 0; i < this.testFiltersArray.length; ++i ) {
      let testFilters = this.testFiltersArray[ i ];

      // Note: Do not return result tensor so that need not to dispose them.
      resultProfiles.push(
//        await this.logProfile( testFilters.name, testFilters.apply.bind( testFilters, this.dataTensor3d, false ) ) );
        await this.logProfile( testFilters.name, testFilters.apply.bind( testFilters, this.testCnavas, false ) ) );

      yield* this.progressAdvanceYield();
    }

    return resultProfiles;
  }

  /**
   * Testing whether the results of different implementation are the same.
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
    tf.util.assert(
      ( tensorMemoryAfter.numBytes == tensorMemoryBefore.numBytes ),
      `tensorMemoryAfter.numBytes (${tensorMemoryAfter.numBytes}) != tensorMemoryBefore.numBytes (${tensorMemoryBefore.numBytes})`);

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
