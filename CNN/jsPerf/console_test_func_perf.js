
function ScriptLoader_createPromise( url, isModule, htmlElementId ) {
  if ( htmlElementId ) {
    let scriptElement = document.getElementById( htmlElementId );
    if ( scriptElement )
      return Promise.resolve();
  }

  console.log( "Loading \"" + url + "\"" );
  return new Promise( ( resolve, reject ) => {
    let attributes = { src: url, onload: e => resolve(e), onerror: e => reject(e) };

    if ( isModule )
      attributes.type = "module";

    if ( htmlElementId )
      attributes.id = htmlElementId;

    document.head.appendChild( Object.assign( document.createElement("script"), attributes ) );
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

async function testByBackend( backendName ) {
  console.log( `backend = ${backendName}` );
  await tf.setBackend( backendName );

  let c_more = 5; // Define the more channel count.
  let testTimes = 10; //10 * 1000; // Run how many times for a function.

  const x_c4 = tf.randomNormal([1000, 1000, 4]);
  const x_cN = tf.randomNormal([1000, 1000, c_more]);

  const c_broadcast_none = tf.randomNormal([1000, 1000, 4]);
  const c_broadcast_channel = tf.randomNormal([1000, 1000, 1]);
  const c_broadcast_height_width_channel = tf.randomNormal([1, 1, 4]);

  let pointwiseFilter_c4m1 = tf.randomNormal( [ 1, 1, 4, 4 ] );
  let pointwiseFilter_c4m2 = tf.randomNormal( [ 1, 1, 4, 8 ] );

  let pointwiseFilter_cNm1 = tf.randomNormal( [ 1, 1, c_more, c_more ] );
  let pointwiseFilter_cNm2 = tf.randomNormal( [ 1, 1, c_more, ( c_more * 2 ) ] );

  let depthwiseFilter_c4m1_3x3 = tf.randomNormal( [ 3, 3, 4, 4 ] );
  let depthwiseFilter_c4m2_3x3 = tf.randomNormal( [ 3, 3, 4, 8 ] );

  let depthwiseFilter_cNm1_3x3 = tf.randomNormal( [ 3, 3, c_more, c_more ] );
  let depthwiseFilter_cNm2_3x3 = tf.randomNormal( [ 3, 3, c_more, ( c_more * 2 ) ] );

  let depthwiseFilter_c4m1_1x1 = tf.randomNormal( [ 1, 1, 4, 4 ] );
  let depthwiseFilter_c4m2_1x1 = tf.randomNormal( [ 1, 1, 4, 8 ] );

  let depthwiseFilter_cNm1_1x1 = tf.randomNormal( [ 1, 1, c_more, c_more ] );
  let depthwiseFilter_cNm2_1x1 = tf.randomNormal( [ 1, 1, c_more, ( c_more * 2 ) ] );

  function timesFunc( f ) {
    let y;
    for ( let i = 0; i < testTimes; ++i ) {
      y = f();
      y.dispose();
    }
  }

  let testFuncArray = [
//     new NameFunc( "sin", tf.sin.bind( null, x_c4 ) ),
//    new NameFunc( "asin", tf.asin.bind( null, x_c4 ) ),
//     new NameFunc( "cos", tf.cos.bind( null, x_c4 ) ),
//    new NameFunc( "acos", tf.acos.bind( null, x_c4 ) ),
//    new NameFunc( "tan", tf.tan.bind( null, x_c4 ) ),
    new NameFunc( "tanh", tf.tanh.bind( null, x_c4 ) ),
    new NameFunc( "sigmoid", tf.sigmoid.bind( null, x_c4 ) ),
    new NameFunc( `sigmoid_c${c_more}`, tf.sigmoid.bind( null, x_cN ) ),
    new NameFunc( "relu", tf.relu.bind( null, x_c4 ) ),
    new NameFunc( "relu6", tf.relu6.bind( null, x_c4 ) ),
//     new NameFunc( "log", tf.log.bind( null, x_c4 ) ),
//     new NameFunc( "log1p", tf.log1p.bind( null, x_c4 ) ),
//     new NameFunc( "exp", tf.exp.bind( null, x_c4 ) ),
//     new NameFunc( "expm1", tf.expm1.bind( null, x_c4 ) ),
//    new NameFunc( "softplus", tf.softplus.bind( null, x_c4 ) ),
//     new NameFunc( "reciprocal", tf.reciprocal.bind( null, x_c4 ) ),

    new NameFunc( "add_broadcast_none", tf.add.bind( null, x_c4, c_broadcast_none ) ),
    new NameFunc( "add_broadcast_channel", tf.add.bind( null, x_c4, c_broadcast_channel ) ),
    new NameFunc( "add_broadcast_height_width_channel", tf.add.bind( null, x_c4, c_broadcast_height_width_channel ) ),

    new NameFunc( "pointwise_1x1x4_cm1_strides1_padValid", tf.conv2d.bind( null, x_c4, pointwiseFilter_c4m1, 1, "valid" ) ),
    new NameFunc( `pointwise_1x1x${c_more}_cm1_strides1_padValid`, tf.conv2d.bind( null, x_cN, pointwiseFilter_cNm1, 1, "valid" ) ),

    new NameFunc( "pointwise_1x1x4_cm2_strides1_padValid", tf.conv2d.bind( null, x_c4, pointwiseFilter_c4m2, 1, "valid" ) ),
    new NameFunc( `pointwise_1x1x${c_more}_cm2_strides1_padValid`, tf.conv2d.bind( null, x_cN, pointwiseFilter_cNm2, 1, "valid" ) ),


    new NameFunc( "depthwise_3x3x4_cm1_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m1_3x3, 1, "same" ) ),
    new NameFunc( `depthwise_3x3x${c_more}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm1_3x3, 1, "same" ) ),

//     new NameFunc( "depthwise_3x3x4_cm2_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m2_3x3, 1, "same" ) ),
//     new NameFunc( `depthwise_3x3x${c_more}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm2_3x3, 1, "same" ) ),

//     new NameFunc( "depthwise_3x3x4_cm1_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m1_3x3, 2, "same" ) ),
//     new NameFunc( `depthwise_3x3x${c_more}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm1_3x3, 2, "same" ) ),

//     new NameFunc( "depthwise_3x3x4_cm2_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m2_3x3, 2, "same" ) ),
//     new NameFunc( `depthwise_3x3x${c_more}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm2_3x3, 2, "same" ) ),


    new NameFunc( "depthwise_1x1x4_cm1_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m1_1x1, 1, "same" ) ),
    new NameFunc( `depthwise_1x1x${c_more}_cm1_strides1_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm1_1x1, 1, "same" ) ),

    new NameFunc( "depthwise_1x1x4_cm2_strides1_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m2_1x1, 1, "same" ) ),
    new NameFunc( `depthwise_1x1x${c_more}_cm2_strides1_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm2_1x1, 1, "same" ) ),

//     new NameFunc( "depthwise_1x1x4_cm1_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m1_1x1, 2, "same" ) ),
//     new NameFunc( `depthwise_1x1x${c_more}_cm1_strides2_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm1_1x1, 2, "same" ) ),

//     new NameFunc( "depthwise_1x1x4_cm2_strides2_padSame", tf.depthwiseConv2d.bind( null, x_c4, depthwiseFilter_c4m2_1x1, 2, "same" ) ),
//     new NameFunc( `depthwise_1x1x${c_more}_cm2_strides2_padSame`, tf.depthwiseConv2d.bind( null, x_cN, depthwiseFilter_cNm2_1x1, 2, "same" ) ),
  ];


  for ( let i = 0; i < testFuncArray.length; ++i ) {
    let testNameFunc = testFuncArray[ i ];
    let testFuncTimes = timesFunc.bind( null, testNameFunc.f );

    const time = await tf.time( testFuncTimes );
    
    let kernelMs = time.kernelMs / testTimes;
    let wallMs = time.wallMs / testTimes;

    console.log( `${testNameFunc.name}, `
      + `kernelMs: ${kernelMs.toFixed( 2 )}, `
      + `wallTimeMs: ${wallMs.toFixed( 2 )}`);
  }
}

let wasmUrl = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js";
await ScriptLoader_createPromise( wasmUrl, false, "wasmBackend" );

//await testByBackend( "wasm" );
//await testByBackend( "cpu" );
await testByBackend( "webgl" );
