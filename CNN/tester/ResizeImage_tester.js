// (Please paste these codes into tensorflow.js example console to run.)

let wasmUrl = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/dist/tf-backend-wasm.js";
await ScriptLoader_createPromise( wasmUrl, false, "wasmBackend" );

//let bDisplayFailedTensor = true;
let bDisplayFailedTensor = false;
await testAll( bDisplayFailedTensor );

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
      document.createElement("script"), attributes ) );
  });
}

async function testAll( bDisplayFailedTensor ) {
  const inputHeight_max = 4;
  const inputWidth_max = 4;
  const inputDepth_max = 2;
  const dtypeArray = [ "float32", "int32" ];
  const outputHeight_max = 4;
  const outputWidth_max = 4;
  const alignCorners_max = 1;
  const halfPixelCenters_max = 1;
  const resizeOpArray = [ "resizeBilinear", "resizeNearestNeighbor" ];

  let inputInfo = { inputShape: [], inputArray: [] };
  let outputInfo = { size: [] };

  for ( let inputHeight = 2; inputHeight <= inputHeight_max; ++inputHeight )
    for ( let inputWidth = 2; inputWidth <= inputWidth_max; ++inputWidth )
      for ( let inputDepth = 1; inputDepth <= inputDepth_max; ++inputDepth )
        for ( let dtypeIndex = 0; dtypeIndex < dtypeArray.length; ++dtypeIndex ) {

          {
            inputInfo.inputShape[ 0 ] = inputHeight;
            inputInfo.inputShape[ 1 ] = inputWidth;
            inputInfo.inputShape[ 2 ] = inputDepth;
            inputInfo.inputArray.length
              = tf.util.sizeFromShape( inputInfo.inputShape );
            for ( let i = 0; i < inputInfo.inputArray.length; ++i ) {
              inputInfo.inputArray[ i ] = 1 + i;
            }
            inputInfo.dtype = dtypeArray[ dtypeIndex ];
            inputInfo.bDisplayed = false; // Whether this input is showed.
          }

          for ( let outputHeight = 2;
            outputHeight <= outputHeight_max; ++outputHeight )

            for ( let outputWidth = 2;
              outputWidth <= outputWidth_max; ++outputWidth )

              for ( let alignCorners = 0;
                alignCorners < alignCorners_max; ++alignCorners )

                for ( let halfPixelCenters = 0;
                  halfPixelCenters <= halfPixelCenters_max;
                  ++halfPixelCenters )

                  for ( let resizeOpIndex = 0;
                    resizeOpIndex < resizeOpArray.length; ++resizeOpIndex ) {

                    outputInfo.size[ 0 ] = outputHeight;
                    outputInfo.size[ 1 ] = outputWidth;
                    outputInfo.alignCorners = alignCorners;
                    outputInfo.halfPixelCenters = halfPixelCenters;
                    outputInfo.resizeOp = resizeOpArray[ resizeOpIndex ];

                    await test_by_backendName_all(
                      bDisplayFailedTensor, inputInfo, outputInfo );
                  }
        }
    
  console.log( `\ntestAll(), done.` );
}

async function test_by_backendName_all(
  bDisplayFailedTensor, inputInfo, outputInfo ) {

  await test_by_backendName(
    "wasm", bDisplayFailedTensor, inputInfo, outputInfo );

  await test_by_backendName(
    "webgl", bDisplayFailedTensor, inputInfo, outputInfo );
}

/**
 * @return {boolean}
 *   Return true, if the result of specified backed is the same as "cpu"
 * backend.
 */
async function test_by_backendName(
  backendNameToBeTested, bDisplayFailedTensor, inputInfo, outputInfo ) {

  let bOk = true;
  let outputShape_cpu, outputArray_cpu;

  const backendNameArray = [ "cpu", backendNameToBeTested ];
  for ( let backendNameArrayIndex = 0;
    backendNameArrayIndex < backendNameArray.length;
    ++backendNameArrayIndex ) {

    const backendName = backendNameArray[ backendNameArrayIndex ];

    //console.log( `Change to backend "${backendName}"...` );
    await tf.setBackend( backendName );
    //console.log( `backend now is "${tf.getBackend()}".` );

    tf.tidy( () => {
      let inputTensor = tf.tensor(
        inputInfo.inputArray, inputInfo.inputShape, inputInfo.dtype );

      let alignCorners = ( outputInfo.alignCorners != 0 );
      let halfPixelCenters = ( outputInfo.halfPixelCenters != 0 );
      let resultTensor = tf.image[ outputInfo.resizeOp ](
          inputTensor,
          outputInfo.size, alignCorners, halfPixelCenters );

      let backendName = tf.getBackend();

      // Record result of cpu backend for comparison.
      if ( backendName == "cpu" ) {
        outputShape_cpu = resultTensor.shape;
        outputArray_cpu = resultTensor.dataSync();

      } else { // Compare to result of cpu backend.
        let outputArray = resultTensor.dataSync();
        for ( let i = 0; i < outputArray.length; ++i ) {
          let delta = Math.abs( outputArray[ i ] - outputArray_cpu[ i ] );
          if ( delta < 0.001 )
            continue;
          bOk = false;
          break;
        }

        if ( !bOk ) {
          if ( inputInfo.bDisplayed == false ) {
            let inputInfoStr = `input, shape=[ ${inputTensor.shape} ], `
              + `dtype=${inputInfo.dtype}`;

            if ( bDisplayFailedTensor ) {
              console.log( `\n${inputInfoStr}, inputTensor:` );
              inputTensor.print();
            } else {
              console.log( `\n${inputInfoStr}:` );
            }
            inputInfo.bDisplayed = true;
          }

          let testName = `${outputInfo.resizeOp}, `
            + `size=[ ${outputInfo.size[ 0 ]}, ${outputInfo.size[ 1 ]} ], `
            + `alignCorners=${alignCorners}, `
            + `halfPixelCenters=${halfPixelCenters}`;

          console.log( `${testName}. ("${backendName}" failed):` );

          if ( bDisplayFailedTensor ) {
            console.log( `cpu` );
            let resultTensor_cpu
              = tf.tensor( outputArray_cpu, outputShape_cpu );
            resultTensor_cpu.print();

            console.log( `${backendName}` );
            resultTensor.print();
          }
        }
      }
    });
  }
  return bOk;
}
