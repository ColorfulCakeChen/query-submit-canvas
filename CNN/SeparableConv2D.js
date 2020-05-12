import * as Weights from "./Weights.js";
import * as PartTime from "./PartTime.js";
import * as ValueMax from "./ValueMax.js";

export { Params, Layer, StringArrayToEntities };


/**
 * CNN separable convolution (2D) layer parameters.
 */
class Params extends Weights.Params {

  /**
   * If ( channelMultiplier != null ) and ( outChannels != null ), extract 4 parameters [ dilationHeight,
   * dilationWidth, filterHeight, filterWidth ] from inputFloat32Array or fixedWeights.
   *
   * If ( channelMultiplier == null ) and ( outChannels != null ), extract 5 parameters [ dilationHeight,
   * dilationWidth, filterHeight, filterWidth, channelMultiplier ] from inputFloat32Array or fixedWeights.
   *
   * If ( channelMultiplier != null ) and ( outChannels == null ), extract 5 parameters [ dilationHeight,
   * dilationWidth, filterHeight, filterWidth, outChannels ] from inputFloat32Array or fixedWeights.
   *
   * If ( channelMultiplier == null ) and ( outChannels == null ), extract 6 parameters [ dilationHeight,
   * dilationWidth, filterHeight, filterWidth, channelMultiplier, outChannels ] from inputFloat32Array
   * or fixedWeights.
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null, outChannels = null, fixedWeights = null ) {

//!!! ...unfinished...
// pad mode ?
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    // Except channelMultiplier and outChannels, there are 4 parameters [ dilationHeight, dilationWidth, filterHeight,
    // filterWidth ] need to be extract and convert (to positive integer).
    let parameterCountAtLeast = 4;

    return super.init(
      inputFloat32Array, byteOffsetBegin, parameterCountAtLeast, inChannels, channelMultiplier, outChannels, fixedWeights );
  }

  get dilationHeight()    { return this.weightsModified[ 0 ]; }
  get dilationWidth()     { return this.weightsModified[ 1 ]; }
  get filterHeight()      { return this.weightsModified[ 2 ]; }
  get filterWidth()       { return this.weightsModified[ 3 ]; }
}


/**
 * A CNN layer contains one params (this.params) and three filters: depthwise, pointwise and bias.
 */
class Layer {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number}       byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number}       inChannels
   *   The input channel count.
   *
   * @param {Array} fixedParams
   *   If null, extract 6 parameters from inputFloat32Array. If not null, extract 6 parameters from it instead of
   * inputFloat32Array. If not null, it should have 6 elements: [ filterHeight, filterWidth, channelMultiplier,
   * dilationHeight, dilationWidth, outChannels ].
   *
   * @return {boolean} Return false, if initialization failed.
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, fixedParams = null ) {

    this.params = new Params( inputFloat32Array, byteOffsetBegin, fixedParams );
    if ( !this.params.isValid() )
      return false;

    this.depthwise = new Weights.Base(
      inputFloat32Array, this.params.defaultByteOffsetEnd, null, 0,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwise.isValid() )
      return false;

    this.depthwiseBias = new Weights.Base(
      inputFloat32Array, this.depthwise.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwiseBias.isValid() )
      return false;

    this.pointwise = new Weights.Base(
      inputFloat32Array, this.depthwiseBias.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] );

    if ( !this.pointwise.isValid() )
      return false;

    this.pointwiseBias = new Weights.Base(
      inputFloat32Array, this.pointwise.defaultByteOffsetEnd, null, 0,
      [1, 1, this.params.outChannels] );

    if ( !this.pointwiseBias.isValid() )
      return false;

    return true;
  }

  isValid() {
    if ( this.pointwiseBias )
      if ( this.pointwiseBias.isValid() )
        return true;
    return false;
  }

  get byteOffsetBegin() { return this.params.defaultByteOffsetBegin; }
  get byteOffsetEnd()   { return this.pointwiseBias.defaultByteOffsetEnd; }
}


/** Aggregate all progress about downloading, JSON parsing, characters scanning, and weights scanning.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading from network.
      new ValueMax.Percentage.Concrete(), // Increased when parsing the downloaded data as JSON.
      new ValueMax.Percentage.Concrete(), // Increased when converting characters to weights.
      new ValueMax.Percentage.Concrete()  // Increased when converting weights to layers.
    ];

    super(children);

    [this.download, this.JSONParse, this.CharCount, this.WeightByteCount] = children;
  }
}

/**
 * Parsing and decoding string array to SeparableConv2d entities.
 * 
 * @param  {string[]} encodedStringArray     Every string is an encoded entity.
 * @param  {number}   encodedWeightCharCount Every weight is encoded as string with this length. (e.g. 5 )
 * @param  {number}   encodedWeightBase      Every weight is encoded by this base number. (e.g. 2 or 10 or 16 or 36) 
 * @param  {number}   weightValueOffset      The value will be subtracted from the integer weight value.
 * @param  {number}   weightValueDivisor     Divide the integer weight value by this value for converting to floating-point number.
 *
 * @param  {string}   htmlProgressTitle
 *   The title of HTMLProgressElement for reporting progress and onclick will be called when done. If null, no reporting.
 *
 * @return {Promise} A promise resolved as an Object[] which is the decoded entity for separableConv2d().
 *   The entity is an array of SeparableConv2d.Layer.
 */
function StringArrayToEntities(
  encodedStringArray, encodedWeightCharCount, encodedWeightBase, weightValueOffset, weightValueDivisor, htmlProgressTitle) {

  encodedWeightCharCount = Math.max(1, encodedWeightCharCount); /* At least one character for a weight. */

  const suspendWeightCount = 1000; /* Everytime so many weights decoded, yield for releasing CPU time. */
  const suspendLayerCount = 100;   /* Everytime so many layers created, yield for releasing CPU time. */

  /**
   * @param {integer} integerWeight The integer which will be converted to floating-point number by subtract and divide.
   * @return The floating-point number.
   */
  function integerToFloat(integerWeight) {
    return ( integerWeight - weightValueOffset ) / weightValueDivisor;
  }

  /** Input encodedString, yield progress, return integerWeights.
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete}  progressToAdvance
   *   Increase this when every time advanced. It will be initialized to zero when decoder starting.
   */
  function* weightGenerator(encodedString, progressToYield, progressToAdvance) {
    let encodedWeightCount = Math.ceil(encodedString.length / encodedWeightCharCount);
    let integerWeights = new Float32Array( encodedWeightCount );

    let collectedCharCount = 0;
    let encodedWeight;
    let weightIndex = 0;
    let weightIndexAfterYield = 0;

    progressToAdvance.accumulation = 0;

    for (let encodedChar of encodedString) {
      progressToAdvance.accumulation++;

      if (0 == collectedCharCount)
        encodedWeight = encodedChar;
      else
        encodedWeight += encodedChar;  // String concatenate.

      collectedCharCount++;
      if (collectedCharCount < encodedWeightCharCount)
        continue; // Collect characters for one weight.

      collectedCharCount = 0;

     // Decode as integer, and then convert to floating-point number.
      integerWeights[ weightIndex ] = integerToFloat( parseInt(encodedWeight, encodedWeightBase) );
      weightIndex++;
      weightIndexAfterYield++;

      if (weightIndexAfterYield >= suspendWeightCount) { // Every suspendWeightCount, release CPU time.
        yield progressToYield;
        weightIndexAfterYield = 0;
      }
    }

    yield progressToYield; // After weights of one entity converted to integer, release CPU time.
    return integerWeights;
  }

  /** Input integerWeights, yield progress, return entity.
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete}  progressToAdvance
   *   Increase this when every time advanced. It will be initialized to zero when decoder starting.
   */
  function* entityGenerator(integerWeights, progressToYield, progressToAdvance) {
    let layerCountAfterYield = 0;

    progressToAdvance.accumulation = 0;

    let byteOffset = integerWeights.byteOffset; // Bounded by the integerWeights.
    let entity = [], inChannels = 4;            // Suppose the first layer's input channel count is always RGBA 4 channels.

    let legalByteOffsetEnd = integerWeights.byteOffset + integerWeights.byteLength;
    while ( byteOffset < legalByteOffsetEnd ) {

      let layer = new Layer( integerWeights, byteOffset, inChannels );	
      if (layer.isValid()) {	// Only collect valid layer.
        entity.push(layer);
        progressToAdvance.accumulation += layer.weightByteCount;
        inChannels = layer.params.outChannels;  // The next layer's input channel count is the previous layer's output channel count.
        byteOffset = layer.byteOffsetEnd;
      } else { // Discard invalid layer. Progress skip to the end of the weight array.
        progressToAdvance.accumulation += ( integerWeights.byteLength - byteOffset );
        byteOffset = legalByteOffsetEnd; // For stopping the loop.
      }

      layerCountAfterYield++; // Count even if layer invalid, because CPU time is still used.

      if (layerCountAfterYield >= suspendLayerCount) { // Every suspendLayerCount, release CPU time.
        yield progressToYield;
        layerCountAfterYield = 0;
      }
    }

    yield progressToYield; // After weights of one entity converted to layers, release CPU time.
    return entity;
  }

  /** Input encodedStringArray, yield progress, return entities. */
  function* entitiesGenerator() {

    let progress = new Progress();

    /* Estimate maximum volume for progress reporting. Parsing has two pass: one for converting characters to weight,
       another for converting weights to layer. So the total volume is sum of these two. */
    for (let encodedString of encodedStringArray) {
      progress.CharCount.total += encodedString.length;
      let encodedWeightByteCount = Math.ceil(encodedString.length / encodedWeightCharCount) * Float32Array.BYTES_PER_ELEMENT;
      progress.WeightByteCount.total += encodedWeightByteCount;
    }

    let entityCount = encodedStringArray.length;
    let entities =    new Array(entityCount);

    yield progress; /* Report initial progress after maximum volume calculated and first memory block allocated. */

    for (let i = 0; i < encodedStringArray.length; i++) {
      let encodedString = encodedStringArray[ i ];
      let integerWeights = yield* weightGenerator(encodedString, progress, progress.CharCount);
      let entity = yield* entityGenerator(integerWeights, progress, progress.WeightByteCount);
      entities[ i ] = entity;
    }
    return entities;
  }

  let progressReceiver = ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy(this.htmlProgressTitle);
  let theEntitiesGenerator = entitiesGenerator(encodedStringArray);
  let p = PartTime.forOf(theEntitiesGenerator, (valueMax) => {
    progressReceiver.setValueMax(valueMax); /* Report progress to UI. */
  }).then((doneValue) => {
    progressReceiver.informDone(doneValue); /* Inform UI progress done. */
    return doneValue; /* The doneValue will be the entities */
  });
  return p;
}
