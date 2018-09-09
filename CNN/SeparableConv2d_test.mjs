import * as SeparableConv2d from "SeparableConv2d.mjs";

window.addEventListener("load", function(event) {

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

var theEntities = SeparableConv2d.Layer.StringArrayToSeparableConv2dEntities(
      [strEncodedWeights], encodedWeightCharCount, encodedWeightBase, weightValueOffset, weightValueDivisor );

var entity = theEntities[ 0 ];
var layer = entity[ 0 ];
tf.util.assert(
  layer.params.filterHeight == intParams[0],
  `layer.params.filterHeight ${layer.params.filterHeight} != ${intParams[0]}`);

tf.util.assert(
  layer.params.filterWidth == intParams[1], `layer.params.filterWidth ${layer.params.filterWidth} != ${intParams[1]}`);

tf.util.assert(
  layer.params.channelMultiplier == intParams[2], `layer.params.channelMultiplier ${layer.params.channelMultiplier} != ${intParams[2]}`);

tf.util.assert(
  layer.params.dilationHeight == intParams[3], `layer.params.dilationHeight ${layer.params.dilationHeight} != ${intParams[3]}`);

tf.util.assert(
  layer.params.dilationWidth == intParams[4], `layer.params.dilationWidth ${layer.params.dilationWidth} != ${intParams[4]}`);

tf.util.assert(
  layer.params.outChannels == intParams[5], `layer.params.outChannels ${layer.params.outChannels} != ${intParams[5]}`);


var theDepthwiseShape = [intParams[0], intParams[1], inChannels, intParams[2]];
tf.util.assert(
  tf.util.arraysEqual(layer.depthwise.shape, theDepthwiseShape),
  `layer.depthwise.shape ${layer.depthwise.shape} != ${theDepthwiseShape}`);

tf.util.assert(
  tf.util.arraysEqual(layer.depthwise.filter, intDepthwiseFilter),
  `layer.depthwise.filter ${layer.depthwise.filter} != ${intDepthwiseFilter}`);


var thePointwiseShape = [1, 1, inChannels * intParams[2], intParams[5]];
tf.util.assert(
  tf.util.arraysEqual(layer.pointwise.shape, thePointwiseShape),
  `layer.pointwise.shape ${layer.pointwise.shape} != ${thePointwiseShape}`);

tf.util.assert(
  tf.util.arraysEqual(layer.pointwise.filter, intPointwiseFilter),
  `layer.pointwise.filter ${layer.pointwise.filter} != ${intPointwiseFilter}`);


var theBiasShape = [1, 1, intParams[5]];
tf.util.assert(
  tf.util.arraysEqual(layer.bias.shape, theBiasShape),
  `layer.bias.shape ${layer.bias.shape} != ${theBiasShape}`);

tf.util.assert(
  tf.util.arraysEqual(layer.bias.filter, intBias),
  `layer.bias.filter ${layer.bias.filter} != ${intBias}`);

  });
