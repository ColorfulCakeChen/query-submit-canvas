import * as PartTime from "./PartTime.js";
import * as ValueMax from "./ValueMax.js";

export {StringArrayToEntities, Layer};

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
        encodedWeight += encodedChar;

      collectedCharCount++;
      if (collectedCharCount < encodedWeightCharCount)
        continue; // Collect characters for one weight.

      collectedCharCount = 0;

      integerWeights[ weightIndex ] = parseInt(encodedWeight, encodedWeightBase); // Decode as integer.
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

    let byteOffset = integerWeights.byteOffset;
    let entity = [], inChannels = 4; // Suppose the first layer's input channel count is always RGBA 4 channels.

    while ( byteOffset < integerWeights.byteLength ) {

      let layer = new Layer(integerWeights, byteOffset, inChannels, integerToFloat);	
      if (layer.isValid()) {	// Only collect valid layer.
        entity.push(layer);
        progressToAdvance.accumulation += layer.weightByteCount;
        inChannels = layer.params.outChannels;  // The next layer's input channel count is the previous layer's output channel count.
        byteOffset = layer.byteOffsetEnd;
      } else { // Discard invalid layer. Progress skip to the end of the weight array.
        progressToAdvance.accumulation += ( integerWeights.byteLength - byteOffset );
        byteOffset = integerWeights.byteLength; // For stopping the loop.
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

/**
 * A CNN layer contains three filters: depthwise, pointwise and bias.
 */
class Layer {

  /**
   * @param {Float32Array} integerWeights  A Float32Array whose values are all integers.
   * @param {number}       byteOffsetBegin The position to start to decode from the integerWeights.
   * @param {number}       inChannels      The input channel count.
   * @param {Function}     integerToFloat  A function which input an integer and return a floating-point number.
   */ 
  constructor(integerWeights, byteOffsetBegin, inChannels, integerToFloat) {

    this.params = new Layer.Params(integerWeights, byteOffsetBegin);
    if ( !this.params.isValid() )
      return;

    this.depthwise = new Layer.Filter(
      integerWeights, this.params.byteOffsetEnd,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier], integerToFloat );

    if ( !this.depthwise.isValid() )
      return;

    this.pointwise = new Layer.Filter(
      integerWeights, this.depthwise.byteOffsetEnd,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels], integerToFloat );

    if ( !this.pointwise.isValid() )
      return;

    this.bias = new Layer.Filter(
      integerWeights, this.pointwise.byteOffsetEnd,
      [1, 1, this.params.outChannels], integerToFloat );
  }

  isValid() {
    if ( this.bias )
      if ( this.bias.isValid() )
        return true;
    return false;
  }

  get byteOffsetBegin() { return this.params.byteOffsetBegin; }
  get byteOffsetEnd()   { return this.bias.byteOffsetEnd; }
}

/**
 * A class for the CNN layer parameters.
 */
Layer.Params = class {
  /**
   * @param {Float32Array} integerWeights   A Float32Array whose values are all integers.
   * @param {number}       byteOffsetBegin  The position to start to decode from the integerWeights.
   */ 
  constructor(integerWeights, byteOffsetBegin) {
    this.integerWeights =  integerWeights;
    this.byteOffsetBegin = byteOffsetBegin;
  }

  isValid()               { return ( this.byteOffsetEnd <= this.integerWeights.byteLength ) ? true : false; }
  get byteOffsetEnd()     { return this.byteOffsetBegin + ( this.weightCount * Float32Array.BYTES_PER_ELEMENT ); }

  get weightCount()       { return 6; }

  get filterHeight()      { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 0 ])); }
  get filterWidth()       { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 1 ])); }
  get channelMultiplier() { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 2 ])); }
  get dilationHeight()    { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 3 ])); }
  get dilationWidth()     { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 4 ])); }
  get outChannels()       { return Math.abs(Math.trunc(this.integerWeights[ this.weightIndexBegin + 5 ])); }
}

/**
 * A class for the CNN (depthwise, pointwise and bias) filter.
 */
Layer.Filter = class {

  /**
   * There will be no filter (this.filter undefined and ( isValid() == false )) when shape is too large (or NaN).
   *
   * @param {Float32Array} integerWeights  A Float32Array whose values are all integers.
   * @param {number}       byteOffsetBegin The position to start to decode from the integerWeights.
   * @param {number[]}     shape           The filter shape (element count for every dimension). The shape.length is dimension.
   * @param {Function}     integerToFloat  A function which input an integer and return a floating-point number.
   */ 
  constructor(integerWeights, byteOffsetBegin, shape, integerToFloat) {
    this.shape =           shape;
    let weightCount =      shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue );
    let weightByteCount =  weightCount * Float32Array.BYTES_PER_ELEMENT;
    let byteOffsetEnd =    byteOffsetBegin + weightByteCount;  // Exclusive. As the next filter's begin.

    if ( byteOffsetEnd <= integerWeights.byteLength ) {
      let byteOffset = integerWeights.byteOffset + byteOffsetBegin;
      this.filter = new Float32Array( integerWeights.buffer, byteOffset, weightCount ); // Share the underlying array buffer.
      this.filter.forEach((element, i, array) => array[ i ] = integerToFloat(element)); // Convert weight to floating-point number.
    } else {
      // No filter when shape is too large (or NaN).
    }
  }

  isValid()              { return ( this.filter ) ? true : false; }
  get byteOffsetBegin()  { return this.filter.byteOffset; }
  get byteOffsetEnd()    { return this.byteOffsetBegin + this.weightByteCount; }
  get weightByteCount()  { return this.filter.byteLength; }
  get weightCount()      { return this.filter.length; }

}
