export { init, testCorrectness, disposeTensors };

//import * as Weights from "../Unpacker/Weights.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as RandTools from "../util/RandTools.js";
//import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test depthwise-pointwise-bias and fused convolution.
 *
 * @see {@link }
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

//     this.valueCount = height * width * depth;
//     this.concatenatedShape = [ height, width, depth ];

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

    this.filters_list = new Array( 3 );
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


    // Larger input image for performance testing.
    let inputTensorCount = 1;
    this.testPerformance_NumberImageArray = new Array( inputTensorCount );
    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor3dArray = new Array( inputTensorCount );

      let shape = [ this.height, this.width, this.depth ];
      let length = tf.util.sizeFromShape( shape );

      for ( let i = 0; i < dataTensor3dArray.length; ++i ) {
        let numberBegin = ( i * length );
        let numberEnd = numberBegin + length;

        let t = tf.range( numberBegin, numberEnd, 1 );
        let dataTensor3d = tf.reshape( t, shape );
        dataTensor3dArray[ i ] = dataTensor3d;
      }

      return dataTensor3dArray;
    });

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


//!!! ...unfinished...
  test_depthwise_bias_pointwise_bias() {
    let t0, t1;
    t0 = tf.depthwiseConv2d( this.dataTensor3dArray[ 0 ], this.depthwiseFilters, this.strids, this.pad );
    t1 = tf.add( t0, this.depthwiseBiases ); t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilters, this.strids, this.pad ); t1.dispose();
    t1 = tf.add( t0, this.pointwiseBiases ); t0.dispose();
    t1.dispose();
  }

  test_Avg_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_Avg_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_Max_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_Max_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_DConv_2_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_DConv_2_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS() {
    let outputTensor3dArray = [];
    this.block_DConv_2_COS.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_32_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.block_DConv_32_bias_COS_P128_bias.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_P128_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.block_P128_bias_COS_P128_bias.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }


  // Testing whether the results of different implementation are the same.
  testCorrectness() {
    // After correctness testing done, create all Block for performance testing.
    this.fusedConv_PerformanceTest_init();
  }

}

function init() {
  //console.log("jsPerf_Block.js, init()");

  disposeTensors();

  let depth = 4;

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
  globalThis.testSet = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

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
