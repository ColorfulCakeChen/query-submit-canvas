const x = tf.randomNormal([2000, 2000, 4]);
//const b = tf.randomNormal([2000, 2000, 4]);
//const b = tf.randomNormal([2000, 2000, 1]);
const b = tf.randomNormal([1, 1, 4]);

function timesFunc( f ) {
  let times = 100; //10 * 1000;
  let y;
  for ( let i = 0; i < times; ++i ) {
    y = f();
    y.dispose();
  }
}

let testFuncArray = [
  tf.sin,
  tf.asin,
  tf.cos,
  tf.acos,
  tf.tan,
  tf.tanh,
  tf.sigmoid,
  tf.relu,
  tf.relu6,
  tf.log,
  tf.log1p,
  tf.exp,
  tf.expm1,
  tf.add,
  tf.softplus,
  tf.reciprocal,
];

async function testByBackend( backendName ) {
  console.log( `backend = ${backendName}` );
  await tf.setBackend( backendName );

  for ( let i = 0; i < testFuncArray.length; ++i ) {
    let testFunc = testFuncArray[ i ];
    let testFuncBind = testFunc.bind( null, x, b );
    let testFuncTimes = timesFunc.bind( null, testFuncBind );

    const time = await tf.time( testFuncTimes );
    console.log( `${testFunc.name}, kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
  }
}

//await testByBackend( "cpu" );
await testByBackend( "webgl" );
