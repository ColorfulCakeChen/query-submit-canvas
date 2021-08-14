
/**
 * A name and a binded function.
 */
class NameFunc {
  constructor( name, f ) {
    this.name = name;
    this.f = f;
  }
}


let f = tf.tensor( [ 1, 1, 1, 10E20 ], [ 2, 2, 1, 1 ] );
//let f = tf.tensor( [ 0, 0, 0, 0 ], [ 2, 2, 1, 1 ] );
let strides = 1;
let pad = "same";
let y = tf.depthwiseConv2d( x, f, strides, pad );
y.print();


const x = tf.randomNormal([2000, 2000, 4]);
const c_broadcast_none = tf.randomNormal([2000, 2000, 4]);
const c_broadcast_channel = tf.randomNormal([2000, 2000, 1]);
const c_broadcast_height_width_channel = tf.randomNormal([1, 1, 4]);

let depthwiseFilter = tf.randomNormal( [ 3, 3, 4, 4 ] );
let pointwiseFilter = tf.randomNormal( [ 1, 1, 4, 4 ] );

function timesFunc( f ) {
  let times = 100; //10 * 1000;
  let y;
  for ( let i = 0; i < times; ++i ) {
    y = f();
    y.dispose();
  }
}

let testFuncArray = [
  new NameFunc( "sin", tf.sin.bind( null, x ) ),
//  new NameFunc( "asin", tf.asin.bind( null, x ) ),
  new NameFunc( "cos", tf.cos.bind( null, x ) ),
//  new NameFunc( "acos", tf.acos.bind( null, x ) ),
//  new NameFunc( "tan", tf.tan.bind( null, x ) ),
  new NameFunc( "tanh", tf.tanh.bind( null, x ) ),
  new NameFunc( "sigmoid", tf.sigmoid.bind( null, x ) ),
  new NameFunc( "relu", tf.relu.bind( null, x ) ),
  new NameFunc( "relu6", tf.relu6.bind( null, x ) ),
  new NameFunc( "log", tf.log.bind( null, x ) ),
  new NameFunc( "log1p", tf.log1p.bind( null, x ) ),
  new NameFunc( "exp", tf.exp.bind( null, x ) ),
  new NameFunc( "expm1", tf.expm1.bind( null, x ) ),
  new NameFunc( "softplus", tf.softplus.bind( null, x ) ),
  new NameFunc( "reciprocal", tf.reciprocal.bind( null, x ) ),

  new NameFunc( "add_broadcast_none", tf.add.bind( null, x, c_broadcast_none ) ),
  new NameFunc( "add_broadcast_channel", tf.add.bind( null, x, c_broadcast_channel ) ),
  new NameFunc( "add_broadcast_height_width_channel", tf.add.bind( null, x, c_broadcast_height_width_channel ) ),

  new NameFunc( "depthwise_3x3x4_strides1_padSame", tf.depthwiseConv2d.bind( null, x, depthwiseFilter, 1, "same" ) ),
  new NameFunc( "pointwise_1x1x1_strides1_padValid", tf.conv2d.bind( null, x, pointwiseFilter, 1, "valid" ) ),
];

async function testByBackend( backendName ) {
  console.log( `backend = ${backendName}` );
  await tf.setBackend( backendName );

  for ( let i = 0; i < testFuncArray.length; ++i ) {
    let testNameFunc = testFuncArray[ i ];
    let testFuncTimes = timesFunc.bind( null, testNameFunc.f );

    const time = await tf.time( testFuncTimes );
    console.log( `${testNameFunc.name}, kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
  }
}

//await testByBackend( "cpu" );
await testByBackend( "webgl" );
