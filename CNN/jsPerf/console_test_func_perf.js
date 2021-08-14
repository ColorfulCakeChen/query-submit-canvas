
/**
 * A name and a binded function.
 */
class NameFunc {
  constructor( name, f ) {
    this.name = name;
    this.f = f;
  }
}

const x_c4 = tf.randomNormal([1000, 1000, 4]);
const x_c5 = tf.randomNormal([1000, 1000, 5]);

const c_broadcast_none = tf.randomNormal([1000, 1000, 4]);
const c_broadcast_channel = tf.randomNormal([1000, 1000, 1]);
const c_broadcast_height_width_channel = tf.randomNormal([1, 1, 4]);

let depthwiseFilter_cm1 = tf.randomNormal( [ 3, 3, 5, 5 ] );
let depthwiseFilter_cm2 = tf.randomNormal( [ 3, 3, 5, 10 ] );
let pointwiseFilter_cm1 = tf.randomNormal( [ 1, 1, 5, 5 ] );
let pointwiseFilter_cm2 = tf.randomNormal( [ 1, 1, 5, 10 ] );

function timesFunc( f ) {
  let times = 10; //10 * 1000;
  let y;
  for ( let i = 0; i < times; ++i ) {
    y = f();
    y.dispose();
  }
}

let testFuncArray = [
  new NameFunc( "sin", tf.sin.bind( null, x_c4 ) ),
//  new NameFunc( "asin", tf.asin.bind( null, x_c4 ) ),
  new NameFunc( "cos", tf.cos.bind( null, x_c4 ) ),
//  new NameFunc( "acos", tf.acos.bind( null, x_c4 ) ),
//  new NameFunc( "tan", tf.tan.bind( null, x_c4 ) ),
  new NameFunc( "tanh", tf.tanh.bind( null, x_c4 ) ),
  new NameFunc( "sigmoid", tf.sigmoid.bind( null, x_c4 ) ),
  new NameFunc( "relu", tf.relu.bind( null, x_c4 ) ),
  new NameFunc( "relu6", tf.relu6.bind( null, x_c4 ) ),
  new NameFunc( "log", tf.log.bind( null, x_c4 ) ),
  new NameFunc( "log1p", tf.log1p.bind( null, x_c4 ) ),
  new NameFunc( "exp", tf.exp.bind( null, x_c4 ) ),
  new NameFunc( "expm1", tf.expm1.bind( null, x_c4 ) ),
  new NameFunc( "softplus", tf.softplus.bind( null, x_c4 ) ),
  new NameFunc( "reciprocal", tf.reciprocal.bind( null, x_c4 ) ),

  new NameFunc( "add_broadcast_none", tf.add.bind( null, x_c4, c_broadcast_none ) ),
  new NameFunc( "add_broadcast_channel", tf.add.bind( null, x_c4, c_broadcast_channel ) ),
  new NameFunc( "add_broadcast_height_width_channel", tf.add.bind( null, x_c4, c_broadcast_height_width_channel ) ),

  new NameFunc( "pointwise_1x1x4_cm1_strides1_padValid", tf.conv2d.bind( null, x_c4, pointwiseFilter_cm1, 1, "valid" ) ),
  new NameFunc( "pointwise_1x1x4_cm2_strides1_padValid", tf.conv2d.bind( null, x_c4, pointwiseFilter_cm2, 1, "valid" ) ),

  new NameFunc( "pointwise_1x1x5_cm1_strides1_padValid", tf.conv2d.bind( null, x_c5, pointwiseFilter_cm1, 1, "valid" ) ),
  new NameFunc( "pointwise_1x1x5_cm2_strides1_padValid", tf.conv2d.bind( null, x_c5, pointwiseFilter_cm2, 1, "valid" ) ),

  new NameFunc( "depthwise_3x3x4_cm1_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_cm1, 1, "same" ) ),
  new NameFunc( "depthwise_3x3x4_cm1_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_cm1, 2, "same" ) ),
  new NameFunc( "depthwise_3x3x4_cm2_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_cm2, 1, "same" ) ),
  new NameFunc( "depthwise_3x3x4_cm2_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_cm2, 2, "same" ) ),

  new NameFunc( "depthwise_3x3x5_cm1_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c5, depthwiseFilter_cm1, 1, "same" ) ),
  new NameFunc( "depthwise_3x3x5_cm1_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c5, depthwiseFilter_cm1, 2, "same" ) ),
  new NameFunc( "depthwise_3x3x5_cm2_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c5, depthwiseFilter_cm2, 1, "same" ) ),
  new NameFunc( "depthwise_3x3x5_cm2_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c5, depthwiseFilter_cm2, 2, "same" ) ),
];

async function testByBackend( backendName ) {
  console.log( `backend = ${backendName}` );
  await tf.setBackend( backendName );

  for ( let i = 0; i < testFuncArray.length; ++i ) {
    let testNameFunc = testFuncArray[ i ];
    let testFuncTimes = timesFunc.bind( null, testNameFunc.f );

    const time = await tf.time( testFuncTimes );
    console.log( `${testNameFunc.name}, `
      + `kernelMs: ${time.kernelMs.toFixed( 3 )}, `
      + `wallTimeMs: ${time.wallMs.toFixed( 3 )}`);
  }
}

//await testByBackend( "cpu" );
await testByBackend( "webgl" );
