
function ScriptLoader_createPromise( url, isModule, htmlElementId ) {
  if ( htmlElementId ) {
    let scriptElement = document.getElementById( htmlElementId );
    if ( scriptElement )
      return Promise.resolve();
  }

  console.log( "Loading \"" + url + "\"" );
  return new Promise( ( resolve, reject ) => {
    let attributes
      = { src: url, onload: e => resolve(e), onerror: e => reject(e) };

    if ( isModule )
      attributes.type = "module";

    if ( htmlElementId )
      attributes.id = htmlElementId;

    document.head.appendChild( Object.assign(
      document.createElement( "script" ), attributes ) );
  });
}

/**
 * A name and a binded function.
 */
class NameFunc {
  constructor( name, f ) {
    this.name = name;
    this.f = f;
  }
}

class Tester {
  /**
   *
   * @param {number} c_base  Define the less channel count.
   * @param {number} c_more  Define the more channel count.
   */
  constructor( inputHeight, inputWidth, c_base = 4, c_more = 5 ) {
    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.c_base = c_base;
    this.c_more = c_more;
  }

  prepareTensors() {
    let inputHeight = this.inputHeight;
    let inputWidth = this.inputWidth;

    let c_base = this.c_base;
    let c_more = this.c_more;
    
    this.x_cB = tf.randomNormal([ inputHeight, inputWidth, c_base ]);
    this.x_cB2 = tf.randomNormal([ inputHeight, inputWidth, c_base ]);
    this.x_cN = tf.randomNormal([ inputHeight, inputWidth, c_more ]);

//     this.c_broadcast_none = tf.randomNormal( [ inputHeight, inputWidth, c_base ] );
//     this.c_broadcast_channel = tf.randomNormal( [ inputHeight, inputWidth, 1 ] );
//     this.c_broadcast_height_width = tf.randomNormal( [ 1, 1, c_base ] );

    this.bias1_base = tf.randomNormal([ 1, 1, c_base ]);
    this.bias2_base = tf.randomNormal([ 1, 1, c_base ]);
    this.bias1_broadcast_base
      = this.bias1_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );
    this.bias2_broadcast_base
      = this.bias2_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );

    this.mean_base = tf.randomNormal([ 1, 1, c_base ]);
    this.variance_base = tf.randomNormal([ 1, 1, c_base ]);
    this.offset_base = tf.randomNormal([ 1, 1, c_base ]);
    this.scale_base = tf.randomNormal([ 1, 1, c_base ]);

    this.mean_broadcast_base
      = this.mean_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );
    this.variance_broadcast_base
      = this.variance_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );
    this.offset_broadcast_base
      = this.offset_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );
    this.scale_broadcast_base
      = this.scale_base.broadcastTo( [ inputHeight, inputWidth, c_base ] );

    this.pointwiseFilter_cBm1 = tf.randomNormal( [ 1, 1, c_base, c_base ] );
    this.pointwiseFilter_cBm2 = tf.randomNormal( [ 1, 1, c_base, ( c_base * 2 ) ] );
    this.pointwiseFilter_c2Bm1 = tf.randomNormal( [ 1, 1, ( c_base * 2 ), ( c_base * 2 ) ] );

    this.pointwiseFilter_cNm1 = tf.randomNormal( [ 1, 1, c_more, c_more ] );
    this.pointwiseFilter_cNm2 = tf.randomNormal( [ 1, 1, c_more, ( c_more * 2 ) ] );

    this.pointwiseFilter_cBcN = tf.randomNormal( [ 1, 1, c_base, c_more ] );
    this.pointwiseFilter_cNcB = tf.randomNormal( [ 1, 1, c_more, c_base ] );

    this.depthwiseFilter_cBm1_3x3 = tf.randomNormal( [ 3, 3, c_base, 1 ] );
    this.depthwiseFilter_cBm2_3x3 = tf.randomNormal( [ 3, 3, c_base, 2 ] );

    this.depthwiseFilter_cNm1_3x3 = tf.randomNormal( [ 3, 3, c_more, 1 ] );
    this.depthwiseFilter_cNm2_3x3 = tf.randomNormal( [ 3, 3, c_more, 2 ] );

    this.depthwiseFilter_cBm1_1x1 = tf.randomNormal( [ 1, 1, c_base, 1 ] );
    this.depthwiseFilter_cBm2_1x1 = tf.randomNormal( [ 1, 1, c_base, 2 ] );

    this.depthwiseFilter_cNm1_1x1 = tf.randomNormal( [ 1, 1, c_more, 1 ] );
    this.depthwiseFilter_cNm2_1x1 = tf.randomNormal( [ 1, 1, c_more, 2 ] );
  }

//     /** Try pointwise-SIGMOID to achieve implicit bias. This is slower than pointwise_cBm1_add_SIGMOID().*/
//     function pointwise_cBcN_SIGMOID_pointwise_cNcB_SIGMOID() {
//       let t0 = tf.conv2d( x_cB, pointwiseFilter_cBcN, 1, "valid" );
//
//       let t1 = tf.sigmoid( t0 );
//       t0.dispose();
//
//       t0 = tf.conv2d( t1, pointwiseFilter_cNcB, 1, "valid" );
//       t1.dispose();
//
//       t1 = tf.sigmoid( t0 );
//       t0.dispose();
//
//       return t1;
//     }
//
//     /** Try explicit bias. */
//     function pointwise_cBm1_add_SIGMOID() {
//       let t0 = tf.conv2d( x_cB, pointwiseFilter_cBm1, 1, "valid" );
//
//       let t1 = tf.add( t0, c_broadcast_height_width );
//       t0.dispose();
//
//       t0 = tf.sigmoid( t1 );
//       t1.dispose();
//
//       return t0;
//     }

  /** Try pointwise-bias-SIGMOID-depthwise-pointwise-bias-SIGMOID with less channels. */
  pointwise_cBm1_bias_SIGMOID_depthwise_pointwise_cBm1_bias_SIGMOID() {
    let t0, t1;
    t0 = tf.conv2d( this.x_cB, this.pointwiseFilter_cBm1, 1, "valid" );
    t1 = tf.add( t0, this.bias1_base );                                      t0.dispose();
    t0 = tf.sigmoid( t1 );                                                   t1.dispose();
    t1 = tf.depthwiseConv2d( t0, this.depthwiseFilter_cBm1_3x3, 1, "same" ); t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilter_cBm1, 1, "valid" );             t1.dispose();
    t1 = tf.add( t0, this.bias2_base );                                      t0.dispose();
    t0 = tf.sigmoid( t1 );                                                   t1.dispose();
    return t0;
  }

  /** Try pointwise-bias-SIGMOID-depthwise-pointwise-bias-SIGMOID with less channels and already broadcast bias. */
  pointwise_cBm1_bias_SIGMOID_depthwise_pointwise_cBm1_bias_SIGMOID_already_broadcast() {
    let t0, t1;
    t0 = tf.conv2d( this.x_cB, this.pointwiseFilter_cBm1, 1, "valid" );
    t1 = tf.add( t0, this.bias1_broadcast_base );                            t0.dispose();
    t0 = tf.sigmoid( t1 );                                                   t1.dispose();
    t1 = tf.depthwiseConv2d( t0, this.depthwiseFilter_cBm1_3x3, 1, "same" ); t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilter_cBm1, 1, "valid" );             t1.dispose();
    t1 = tf.add( t0, this.bias2_broadcast_base );                            t0.dispose();
    t0 = tf.sigmoid( t1 );                                                   t1.dispose();
    return t0;
  }

  /** Try pointwise-SIGMOID-depthwise_SIGMOID-pointwise-SIGMOID with more channels. */
  pointwise_cNm1_SIGMOID_depthwise_SIGMOID_pointwise_cNm1_SIGMOID() {
    let t0, t1;
    t0 = tf.conv2d( this.x_cN, this.pointwiseFilter_cNm1, 1, "valid" );
    t1 = tf.sigmoid( t0 );                                                   t0.dispose();
    t0 = tf.depthwiseConv2d( t1, this.depthwiseFilter_cNm1_3x3, 1, "same" ); t1.dispose();
    t1 = tf.sigmoid( t0 );                                                   t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilter_cNm1, 1, "valid" );             t1.dispose();
    t1 = tf.sigmoid( t0 );                                                   t0.dispose();
    return t1;
  }

  /** Try depthwise-pointwise-SIGMOID with ( pad = valid ) and ( channelMultiplier = 2 ) and less channels. */
  depthwise_cBm2_pointwise_c2Bm1_SIGMOID_padValid() {
    let t0, t1;
    t0 = tf.depthwiseConv2d( this.x_cB, this.depthwiseFilter_cBm2_3x3, 1, "valid" );
    t1 = tf.conv2d( t0, this.pointwiseFilter_c2Bm1, 1, "valid" );            t0.dispose();
    t0 = tf.sigmoid( t1 );                                                   t1.dispose();
    return t0;
  }

  /** Try depthwise-SIGMOID-pointwise-SIGMOID and less channels. */
  depthwise_cBm2_SIGMOID_pointwise_c2Bm1_SIGMOID() {
    let t0, t1;
    t0 = tf.depthwiseConv2d( this.x_cB, this.depthwiseFilter_cBm2_3x3, 1, "same" );
    t1 = tf.sigmoid( t0 );                                                   t0.dispose();
    t0 = tf.conv2d( t1, this.pointwiseFilter_c2Bm1, 1, "valid" );            t1.dispose();
    t1 = tf.sigmoid( t0 );                                                   t0.dispose();
    return t1;
  }

  add_sigmoid_cB() {
    let t0 = tf.add( this.x_cB, this.bias1_base );
    let t1 = tf.sigmoid( t0 );
    t0.dispose();
    return t1;
  }

  add_relu6_cB() {
    let t0 = tf.add( this.x_cB, this.bias1_base );
    let t1 = tf.relu6( t0 );
    t0.dispose();
    return t1;
  }

//   abs_batchNorm_cB() { // Slower than square_batchNorm_cB().
//     let t0 = tf.abs( this.x_cB );
//     let t1 = tf.batchNorm( this.x_cB, this.mean_base, t0, this.offset_base, this.scale_base, 1 ); // varianceEpsilon = 1
//     t0.dispose();
//     return t1;
//   }

//   mul_batchNorm_cB() { // Slower than square_batchNorm_cB().
//     let t0 = tf.mul( this.x_cB, this.x_cB );
//     let t1 = tf.batchNorm( this.x_cB, this.mean_base, t0, this.offset_base, this.scale_base, 1 ); // varianceEpsilon = 1
//     t0.dispose();
//     return t1;
//   }

  square_batchNorm_cB() {
    let t0 = tf.square( this.x_cB );
    let t1 = tf.batchNorm( this.x_cB, this.mean_base, t0, this.offset_base, this.scale_base, 1 ); // varianceEpsilon = 1
    t0.dispose();
    return t1;
  }

  prepare_testFuncArray() {
    let inputHeight = this.inputHeight;
    let inputWidth = this.inputWidth;

    let c_base = this.c_base;
    let c_more = this.c_more;

    this.testFuncArray = [
//       new NameFunc( `sin_c${c_base}`, tf.sin.bind( null, this.x_cB ) ),
//       new NameFunc( "asin", tf.asin.bind( null, this.x_cB ) ),
//       new NameFunc( `cos_c${c_base}`, tf.cos.bind( null, this.x_cB ) ),
//       new NameFunc( "acos", tf.acos.bind( null, this.x_cB ) ),
//       new NameFunc( "tan", tf.tan.bind( null, this.x_cB ) ),
//       new NameFunc( "tanh", tf.tanh.bind( null, this.x_cB ) ),

      new NameFunc( `sigmoid_c${c_base}`, tf.sigmoid.bind( null, this.x_cB ) ),
      new NameFunc( `sigmoid_c${c_more}`, tf.sigmoid.bind( null, this.x_cN ) ),
//      new NameFunc( `relu_c${c_base}`, tf.relu.bind( null, this.x_cB ) ),
//      new NameFunc( `relu6_c${c_base}`, tf.relu6.bind( null, this.x_cB ) ),

//       new NameFunc( "log", tf.log.bind( null, this.x_cB ) ),
//       new NameFunc( "log1p", tf.log1p.bind( null, this.x_cB ) ),
//       new NameFunc( "exp", tf.exp.bind( null, this.x_cB ) ),
//       new NameFunc( "expm1", tf.expm1.bind( null, this.x_cB ) ),
//       new NameFunc( "softplus", tf.softplus.bind( null, this.x_cB ) ),
//       new NameFunc( "reciprocal", tf.reciprocal.bind( null, this.x_cB ) ),

//       new NameFunc( "add_broadcast_none", tf.add.bind( null, this.x_cB, this.c_broadcast_none ) ),
//       new NameFunc( "add_broadcast_channel", tf.add.bind( null, this.x_cB, this.c_broadcast_channel ) ),
//       new NameFunc( "add_broadcast_height_width", tf.add.bind( null, this.x_cB, this.c_broadcast_height_width ) ),

//       new NameFunc( `add_c${c_base}`, tf.add.bind( null, this.x_cB, this.bias1_base ) ),
//       new NameFunc( `add_c${c_base}_already_broadcast`, tf.add.bind( null, this.x_cB, this.bias1_broadcast_base ) ),

//       new NameFunc( `batchNorm_c${c_base}`, tf.batchNorm.bind( null,
//                       this.x_cB, this.mean_base, this.variance_base, this.offset_base, this.scale_base ) ),

      new NameFunc( `add_sigmoid_c${c_base}`, this.add_sigmoid_cB.bind( this ) ),
      new NameFunc( `add_relu6_c${c_base}`, this.add_relu6_cB.bind( this ) ),
//       new NameFunc( `abs_batchNorm_c${c_base}`, this.abs_batchNorm_cB.bind( this ) ),
//       new NameFunc( `mul_batchNorm_c${c_base}`, this.mul_batchNorm_cB.bind( this ) ),
      new NameFunc( `square_batchNorm_c${c_base}`, this.square_batchNorm_cB.bind( this ) ),

//       new NameFunc( `batchNorm_c${c_base}_already_broadcast`,
//                       tf.batchNorm.bind( null,
//                         this.x_cB, this.mean_broadcast_base, this.variance_broadcast_base, this.offset_broadcast_base, this.scale_broadcast_base ) ),

//       new NameFunc( `concat_c${c_base}_bias`, tf.concat.bind( null, [ this.x_cB, this.bias1_broadcast_base ], 2 ) ),
//       new NameFunc( `concat_c${c_base}c${c_base}_bias`, tf.concat.bind( null, [ this.x_cB, this.x_cB2, this.bias1_broadcast_base ], 2 ) ),

//       new NameFunc( `pointwise_c${c_base}c${c_more}_SIGMOID_pointwise_c${c_more}c${c_base}_SIGMOID`,
//                       this.pointwise_cBcN_SIGMOID_pointwise_cNcB_SIGMOID.bind( this ) ),
//       new NameFunc( `pointwise_c${c_base}m1_add_SIGMOID`, this.pointwise_cBm1_add_SIGMOID.bind( this ) ),

//       new NameFunc( `pointwise_c${c_base}m1_bias_SIGMOID_depthwise_pointwise_c${c_base}m1_bias_SIGMOID`,
//                       this.pointwise_cBm1_bias_SIGMOID_depthwise_pointwise_cBm1_bias_SIGMOID.bind( this ) ),
//       new NameFunc( `pointwise_c${c_base}m1_bias_SIGMOID_depthwise_pointwise_c${c_base}m1_bias_SIGMOID_already_broadcast`,
//                       this.pointwise_cBm1_bias_SIGMOID_depthwise_pointwise_cBm1_bias_SIGMOID_already_broadcast.bind( this ) ),
//       new NameFunc( `pointwise_c${c_more}m1_SIGMOID_depthwise_SIGMOID_pointwise_c${c_more}m1_SIGMOID`,
//                       this.pointwise_cNm1_SIGMOID_depthwise_SIGMOID_pointwise_cNm1_SIGMOID.bind( this ) ),
      
//       new NameFunc( `depthwise_c${c_base}m2_pointwise_c${ ( c_base * 2 ) }m1_SIGMOID_padValid`,
//                       this.depthwise_cBm2_pointwise_c2Bm1_SIGMOID_padValid.bind( this ) ),
//       new NameFunc( `depthwise_c${c_base}m2_SIGMOID_pointwise_c${ ( c_base * 2 ) }m1_SIGMOID`,
//                       this.depthwise_cBm2_SIGMOID_pointwise_c2Bm1_SIGMOID.bind( this ) ),


       new NameFunc( `pointwise_1x1x${c_base}_cm1_strides1_padValid`, tf.conv2d.bind( null, this.x_cB, this.pointwiseFilter_cBm1, 1, "valid" ) ),
//       new NameFunc( `pointwise_1x1x${c_more}_cm1_strides1_padValid`, tf.conv2d.bind( null, this.x_cN, this.pointwiseFilter_cNm1, 1, "valid" ) ),

//       new NameFunc( `pointwise_1x1x${c_base}_cm2_strides1_padValid`, tf.conv2d.bind( null, this.x_cB, this.pointwiseFilter_cBm2, 1, "valid" ) ),
//       new NameFunc( `pointwise_1x1x${c_more}_cm2_strides1_padValid`, tf.conv2d.bind( null, this.x_cN, this.pointwiseFilter_cNm2, 1, "valid" ) ),


       new NameFunc( `depthwise_3x3x${c_base}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm1_3x3, 1, "same" ) ),
//       new NameFunc( `depthwise_3x3x${c_more}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm1_3x3, 1, "same" ) ),

//       new NameFunc( `depthwise_3x3x${c_base}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm2_3x3, 1, "same" ) ),
//       new NameFunc( `depthwise_3x3x${c_more}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm2_3x3, 1, "same" ) ),

//       new NameFunc( `depthwise_3x3x${c_base}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm1_3x3, 2, "same" ) ),
//       new NameFunc( `depthwise_3x3x${c_more}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm1_3x3, 2, "same" ) ),

//       new NameFunc( `depthwise_3x3x${c_base}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm2_3x3, 2, "same" ) ),
//       new NameFunc( `depthwise_3x3x${c_more}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm2_3x3, 2, "same" ) ),


//       new NameFunc( `depthwise_1x1x${c_base}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm1_1x1, 1, "same" ) ),
//       new NameFunc( `depthwise_1x1x${c_more}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm1_1x1, 1, "same" ) ),

//       new NameFunc( `depthwise_1x1x${c_base}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm2_1x1, 1, "same" ) ),
//       new NameFunc( `depthwise_1x1x${c_more}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm2_1x1, 1, "same" ) ),

//       new NameFunc( `depthwise_1x1x${c_base}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm1_1x1, 2, "same" ) ),
//       new NameFunc( `depthwise_1x1x${c_more}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm1_1x1, 2, "same" ) ),

//       new NameFunc( `depthwise_1x1x${c_base}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cB, this.depthwiseFilter_cBm2_1x1, 2, "same" ) ),
//       new NameFunc( `depthwise_1x1x${c_more}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, this.x_cN, this.depthwiseFilter_cNm2_1x1, 2, "same" ) ),
    ];
  }

  async testByBackend( backendName ) {
    console.log( `backend = ${backendName}` );
    await tf.setBackend( backendName );

    this.prepareTensors();
    this.prepare_testFuncArray();

    let testTimes = 10; //10 * 1000; // Run how many times for a function.

    function timesFunc( f ) {
      for ( let i = 0; i < testTimes; ++i ) {
        let y = f();
        y.dispose();
      }
    }

    for ( let i = 0; i < this.testFuncArray.length; ++i ) {
      let testNameFunc = this.testFuncArray[ i ];
      let testFuncTimes = timesFunc.bind( null, testNameFunc.f );

      const time = await tf.time( testFuncTimes );

      let kernelMs = time.kernelMs / testTimes;
      let wallMs = time.wallMs / testTimes;

      console.log( `${testNameFunc.name}, `
        + `kernelMs: ${kernelMs.toFixed( 2 )}, `
        + `wallTimeMs: ${wallMs.toFixed( 2 )}`);
    }

  }
}

let wasmUrl = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js";
await ScriptLoader_createPromise( wasmUrl, false, "wasmBackend" );

let inputHeight = 500;
let inputWidth = 500;
let c_base = 4; // Define the less channel count.
let c_more = 5; // Define the more channel count.

let tester = new Tester( inputHeight, inputWidth, c_base, c_more );
//await tester.testByBackend( "wasm" );
//await tester.testByBackend( "cpu" );
await tester.testByBackend( "webgl" );
