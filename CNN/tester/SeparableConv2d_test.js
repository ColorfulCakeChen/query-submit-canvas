import * as ScriptLoader from "../ScriptLoader.js";
import * as SeparableConv2d from "../SeparableConv2d.js";


window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.2").then(test); });

function test() {
  console.log("Hi! test()");

  var inChannels = 4;

  var intParams = [
      2,   3,   2,    7,   6,   3 ];

  var intDepthwiseFilter = [
    111, 112, 113,  114, 115, 116,   121, 122, 123,  124, 125, 126,
    211, 212, 213,  214, 215, 216,   221, 222, 223,  224, 225, 226,
    311, 312, 313,  314, 315, 316,   321, 322, 323,  324, 325, 326,
    411, 412, 413,  414, 415, 416,   421, 422, 423,  424, 425, 426 ];

  var intPointwiseFilter = [
    1151, 1152, 1153, 1154, 1155, 1156, 1157, 1158,
    1251, 1252, 1253, 1254, 1255, 1256, 1257, 1258,
    1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358 ];

  var intBias = [
    2171, 2172, 2173 ];

  var integerWeights = intParams.concat( intDepthwiseFilter, intPointwiseFilter, intBias );

  var encodedWeightBase = 36;
  var encodedWeightCharCount = 5;
  var encodedWeights = integerWeights.map(
        integerWeight => integerWeight.toString(encodedWeightBase).padStart(encodedWeightCharCount, "0") );
  var strEncodedWeights = "".concat(...encodedWeights);

  // For converting to the integer itself.
  var weightValueOffset = 0;
  var weightValueDivisor = 1;

  var p = SeparableConv2d.StringArrayToEntities(
        [strEncodedWeights], encodedWeightCharCount, encodedWeightBase, weightValueOffset, weightValueDivisor )
  .then(theEntities => {
    var entity = theEntities[ 0 ];
    var layer = entity[ 0 ];
    if ( layer.params.filterHeight != intParams[0] )
      throw Error( `layer.params.filterHeight ${layer.params.filterHeight} != ${intParams[0]}` );

    if ( layer.params.filterWidth != intParams[1] )
      throw Error( `layer.params.filterWidth ${layer.params.filterWidth} != ${intParams[1]}` );

    if ( layer.params.channelMultiplier != intParams[2] )
      throw Error( `layer.params.channelMultiplier ${layer.params.channelMultiplier} != ${intParams[2]}` );

    if ( layer.params.dilationHeight != intParams[3] )
      throw Error( `layer.params.dilationHeight ${layer.params.dilationHeight} != ${intParams[3]}` );

    if ( layer.params.dilationWidth != intParams[4] )
      throw Error( `layer.params.dilationWidth ${layer.params.dilationWidth} != ${intParams[4]}` );

    if ( layer.params.outChannels != intParams[5] )
      throw Error( `layer.params.outChannels ${layer.params.outChannels} != ${intParams[5]}` );


    var theDepthwiseShape = [intParams[0], intParams[1], inChannels, intParams[2]];
    if ( !tf.util.arraysEqual(layer.depthwise.shape, theDepthwiseShape) )
      throw Error( `layer.depthwise.shape ${layer.depthwise.shape} != ${theDepthwiseShape}` );

    if ( !tf.util.arraysEqual(layer.depthwise.weights, intDepthwiseFilter) )
      throw Error( `layer.depthwise.weights ${layer.depthwise.weights} != ${intDepthwiseFilter}` );


    var thePointwiseShape = [1, 1, inChannels * intParams[2], intParams[5]];
    if ( !tf.util.arraysEqual(layer.pointwise.shape, thePointwiseShape) )
      throw Error(  `layer.pointwise.shape ${layer.pointwise.shape} != ${thePointwiseShape}` );

    if ( !tf.util.arraysEqual(layer.pointwise.weights, intPointwiseFilter) )
      throw Error( `layer.pointwise.weights ${layer.pointwise.weights} != ${intPointwiseFilter}` );


    var theBiasShape = [1, 1, intParams[5]];
    if ( !tf.util.arraysEqual(layer.bias.shape, theBiasShape) )
      throw Error(  `layer.bias.shape ${layer.bias.shape} != ${theBiasShape}` );

    if ( !tf.util.arraysEqual(layer.bias.weights, intBias) )
      throw Error( `layer.bias.weights ${layer.bias.weights} != ${intBias}` );
  });

  {  // Test fixedParams.
    let intParams2 = intParams.map( v => v + 10 ); 
    let layerParams = new SeparableConv2d.Layer.Params( integerWeights, 0, intParams2, 0 );
    if ( !tf.util.arraysEqual(layerParams.weights, intParams2) )
      throw Error( `layerParams.weights ${layerParams.weights} != ${intParams2}` );
  }

  console.log("test() done.");
}
