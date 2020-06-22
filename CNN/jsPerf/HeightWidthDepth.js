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

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.progressToYield = progressToYield;
    this.progressToAdvance = progressToAdvance;
    this.progressReceiver = progressReceiver;

    this.valueCount = height * width * depth;

    //this.concatenatedShape = [ height, width, depth ];

    // About half, but the difference should be divisable by 2.
//    this.targetSize = [ Math.floor( height / 20 ) * 10, Math.floor( width / 20 ) * 10 ];
    this.targetSize = [ 1, 1 ]; // to 1x1.
    let targetHeight = this.targetSize[ 0 ];

    // The filter size for achieving target size in one step.
    let filterHeight_OneStep =      ( height - this.targetSize[ 0 ] ) + 1;
    let filterWidth_OneStep =       ( width - this.targetSize[ 1 ] ) + 1;

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );
      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let inChannels =        depth;
    let channelMultiplier = 1;

    // [ TestFiltersName, sourceHeight, sourceDepth, targetHeight, filterHeight, strAvgMaxConv, bPointwise ]
    this.testFiltersSpecTable = [
      [ "DAvg_101x101_OneStep",      height, depth, targetHeight, filterHeight_OneStep,  "Avg", false ],
      [ "DAvg_101x101_1x1_OneStep",  height, depth, targetHeight, filterHeight_OneStep,  "Avg",  true ],
      [ "DMax_101x101_OneStep",      height, depth, targetHeight, filterHeight_OneStep,  "Max", false ],
      [ "DConv_101x101_OneStep",     height, depth, targetHeight, filterHeight_OneStep, "Conv", false ],
      [ "DConv_101x101_1x1_OneStep", height, depth, targetHeight, filterHeight_OneStep, "Conv",  true ],

      [ "DAvg_2x2_MultiStep",        height, depth, targetHeight,                    2,  "Avg", false ],
      [ "DMax_2x2_MultiStep",        height, depth, targetHeight,                    2,  "Max", false ],
      [ "DConv_2x2_MultiStep",       height, depth, targetHeight,                    2, "Conv", false ],
      [ "DConv_2x2_1x1_MultiStep",   height, depth, targetHeight,                    2, "Conv",  true ],

      [ "DConv_3x3_MultiStep",       height, depth, targetHeight,                    3, "Conv", false ],
      [ "DConv_6x6_MultiStep",       height, depth, targetHeight,                    6, "Conv", false ],
      [ "DConv_11x11_MultiStep",     height, depth, targetHeight,                   11, "Conv", false ],
    ];

    // Create test filters.
    this.testFiltersArray = this.testFiltersSpecTable.map( ( filtersSpec, i ) => {
      let testFilters = new TestFilters2D.Base();
      testFilters.init( ...filtersSpec );
      return testFilters;
    });

    // Initialize progress accumulator.
    
    // "+2" for test_ResizeNearestNeighbor and test_ResizeBilinear.
    // "*2" for compiling (with assert) and profiling.
    progressToAdvance.total = ( this.testFiltersArray.length + 2 ) * 2;
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

  // Test depthwise convolution (2D) by 3x3 filter with stride 2
  test_DepthwiseConv2d_3x3_Stride2( bReturn ) {
    return tf.tidy( () => {
      let t = this.dataTensor3d.depthwiseConv2d(
                this.depthwiseConv_3x3.depthwiseConvFiltersTensor4dArray[ 0 ], 2, "same" );
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

  /** Advance the progressToAdvance, and report progressToYield to progressReceiver. */
  progressAdvanveReport() {
      ++this.progressToAdvance.accumulation;
      this.progressReceiver.setValueMax( this.progressToYield );
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @return {Object[]}
   *   Return array of profile infomation { title, backendName, newBytes, newTensors, peakBytes, kernelMs, wallMs }.
   */
  async generateProfiles() {
    let resultProfiles = [];

    tf.tidy( () => {

//      let quarterTensor_3x3_Stride2 =             this.test_DepthwiseConv2d_3x3_Stride2( true );
      let quarterTensor_ResizeNearestNeighbor =   this.test_ResizeNearestNeighbor( true );
      this.progressAdvanveReport();

      let quarterTensor_ResizeBilinear =          this.test_ResizeBilinear( true );
      this.progressAdvanveReport();

//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_11x11.shape, quarterTensor_3x3_Stride2.shape ),
//         `DepthwiseConv2d_11x11_MultiStep() != DepthwiseConv2d_3x3_Stride2()`);
//
//       tf.util.assert(
//         tf.util.arraysEqual( quarterTensor_3x3_Stride2.shape, quarterTensor_ResizeBilinear.shape ),
//         `DepthwiseConv2d_3x3_Stride2() != ResizeBilinear()`);

      tf.util.assert(
        tf.util.arraysEqual( quarterTensor_ResizeBilinear.shape, quarterTensor_ResizeNearestNeighbor.shape ),
        `ResizeBilinear() != ResizeNearestNeighbor()`);

      // All test filters should generate same size result.
      this.testFiltersArray.forEach( ( testFilters, i ) => {
        let t = testFilters.apply( this.dataTensor3d, true );

        tf.util.assert(
          tf.util.arraysEqual( t.shape, quarterTensor_ResizeBilinear.shape ),
          `${testFilters.name}() != ResizeBilinear()`);

        t.dispose();

        this.progressAdvanveReport();
      });

    });

    // The above codes also compiles the codes.
    // Since the codes compiled, their execute time can be tested now.

    resultProfiles.push( await this.logProfile( "ResizeNearestNeighbor", this.test_ResizeNearestNeighbor.bind( this ) ) );
    this.progressAdvanveReport();

    resultProfiles.push( await this.logProfile( "ResizeBilinear", this.test_ResizeBilinear.bind( this ) ) );
    this.progressAdvanveReport();

    // All test filters in array.
    for ( let testFilters of this.testFiltersArray ) {
      // Note: Do not return result tensor so that need not to dispose them.
      resultProfiles.push(
        await this.logProfile( testFilters.name, testFilters.apply.bind( testFilters, this.dataTensor3d, false ) ) );

      this.progressAdvanveReport();
    }

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
