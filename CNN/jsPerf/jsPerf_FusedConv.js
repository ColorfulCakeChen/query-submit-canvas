export { init, testCorrectness, disposeTensors };

//import * as Weights from "../Unpacker/Weights.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as RandTools from "../util/RandTools.js";
//import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test depthwise-pointwise-bias and fused convolution.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/19042/5/colorfulcakechen-cnn-fusedconv-3f0e5262d8d8ce216b0e9d5c}
 */

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   */
  constructor( height, width, depth ) {

    this.disposeTensors();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.inputShape = [ this.height, this.width, this.depth ];
    this.inputWithBiasShape = [ this.height, this.width, ( this.depth + 1 ) ]; // extra channel as bias.

    this.inputChannelCount = depth;
    this.outputChannelCount = depth;
    this.channelMultiplier = 1;
    this.strids = 1;
    this.pad = "same";

    this.depthwiseFilterHeight = 3;
    this.depthwiseFilterWidth = 3;
    this.depthwiseFiltersShape = [ this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.inputChannelCount, this.channelMultiplier ];
    this.depthwiseBiasesShape = [ this.inputChannelCount * this.channelMultiplier ];

    this.pointwiseFilterHeight = 1;
    this.pointwiseFilterWidth = 1;
    this.pointwiseFiltersShape = [ this.pointwiseFilterHeight, this.pointwiseFilterWidth, this.inputChannelCount, this.outputChannelCount ];
    this.pointwiseBiasesShape = [ this.outputChannelCount ];

    this.fusedConvFiltersShape = [ this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.inputChannelCount, this.outputChannelCount ];
    this.fusedConvBiasesShape = [ this.outputChannelCount ];

    this.fusedConvWithBiasFiltersShape = [ // extra channel as bias.
      this.depthwiseFilterHeight, this.depthwiseFilterWidth, ( this.inputChannelCount + 1 ), ( this.outputChannelCount + 1 ) ];
  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.fusedConv_PerformanceTest_release();
  }

  fusedConv_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeTensors();

    const randomOffsetMin = -10;
    const randomOffsetMax = +10;

    this.filters_list = new Array( 4 );
    this.biases_list = new Array( 3 );


    this.depthwiseFilters = this.filters_list[ 0 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.depthwiseFiltersShape ), randomOffsetMin, randomOffsetMax ),
      this.depthwiseFiltersShape );

    this.depthwiseBiases = this.biases_list[ 0 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.depthwiseBiasesShape ), randomOffsetMin, randomOffsetMax ),
      this.depthwiseBiasesShape );


    this.pointwiseFilters = this.filters_list[ 1 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.pointwiseFiltersShape ), randomOffsetMin, randomOffsetMax ),
      this.pointwiseFiltersShape );

    this.pointwiseBiases = this.biases_list[ 1 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.pointwiseBiasesShape ), randomOffsetMin, randomOffsetMax ),
      this.pointwiseBiasesShape );


    this.fusedConvFilters = this.filters_list[ 2 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.fusedConvFiltersShape ), randomOffsetMin, randomOffsetMax ),
      this.fusedConvFiltersShape );

    this.fusedConvBiases = this.biases_list[ 2 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.fusedConvBiasesShape ), randomOffsetMin, randomOffsetMax ),
      this.fusedConvBiasesShape );


    this.fusedConvWithBiasFilters = this.filters_list[ 3 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.fusedConvWithBiasFiltersShape ), randomOffsetMin, randomOffsetMax ),
      this.fusedConvWithBiasFiltersShape );


    // Larger input image for performance testing.
    this.dataTensor3dArray = new Array( 2 );

    this.inputImage = this.dataTensor3dArray[ 0 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.inputShape ), randomOffsetMin, randomOffsetMax ),
      this.inputShape );

    this.inputWithBiasImage = this.dataTensor3dArray[ 1 ] = tf.tensor(
      RandTools.generate_numberArray( tf.util.sizeFromShape( this.inputWithBiasShape ), randomOffsetMin, randomOffsetMax ),
      this.inputWithBiasShape );
  }

  fusedConv_PerformanceTest_release() {
    if ( this.filters_list ) {
      tf.dispose( this.filters_list );
      this.filters_list = null;
    }

    if ( this.biases_list ) {
      tf.dispose( this.biases_list );
      this.biases_list = null;
    }
  }


  test_depthwise_bias_pointwise_bias() {
    let t0, t1;
    t0 = tf.depthwiseConv2d( this.inputImage, this.depthwiseFilters, this.strids, this.pad );
    t1 = tf.add( t0, this.depthwiseBiases ); t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilters, this.strids, this.pad ); t1.dispose();
    t1 = tf.add( t0, this.pointwiseBiases ); t0.dispose();
    t1.dispose();
  }

  test_depthwise_pointwise_bias() {
    let t0, t1;
    t0 = tf.depthwiseConv2d( this.inputImage, this.depthwiseFilters, this.strids, this.pad );
    t1 = tf.conv2d( t0, this.pointwiseFilters, this.strids, this.pad ); t0.dispose();
    t0 = tf.add( t1, this.pointwiseBiases ); t1.dispose();
    t0.dispose();
  }

  test_fusedConv_bias() {
    let t0, t1;
    t0 = tf.conv2d( this.inputImage, this.fusedConvFilters, this.strids, this.pad );
    t1 = tf.add( t0, this.fusedConvBiases ); t0.dispose();
    t1.dispose();
  }

  test_fusedConvWithBias() {
    let t0 = tf.conv2d( this.inputWithBiasImage, this.fusedConvWithBiasFilters, this.strids, this.pad );
    t0.dispose();
  }


  // Testing whether the results of different implementation are the same.
  testCorrectness() {
    // After correctness testing done, create all Block for performance testing.
    this.fusedConv_PerformanceTest_init();
  }

}

function init() {
  //console.log("jsPerf_FusedConv.js, init()");

  disposeTensors();

  let depth = 2 * 1024; //8; //4;

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
//  globalThis.testSet = new HeightWidthDepth( 108, 192, depth ); // height, width, depth
  globalThis.testSet = new HeightWidthDepth( 1, 1, depth ); // height, width, depth

  globalThis.testSet_All = [
    globalThis.testSet
  ];
}

function testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    testSet.testCorrectness();
  }
}

function disposeTensors() {
  if ( globalThis.testSet_All ) {
    for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
      let testSet = globalThis.testSet_All[ i ];
      if ( testSet )
        testSet.disposeTensors();
    }

    globalThis.testSet_All = null;
  }

  globalThis.testSet
    = null;
}
