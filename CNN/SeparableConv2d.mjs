import * as PartTime from "./PartTime.mjs";
import * as ValueMaxDone from "./ValueMaxDone.mjs";

export {Parser, Layer};

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

  encodedWeightCharCount = max(1, encodedWeightCharCount); /* At least one character for a weight. */

  /**
   * @param {integer} integerWeight The integer which will be converted to floating-point number by subtract and divide.
   * @return The floating-point number.
   */
  function integerToFloat(integerWeight) {
    return ( integerWeight - weightValueOffset ) / weightValueDivisor;
  }

  function* entitiesGenerator() {
    const suspendWeightCount = 1000; /* Everytime scanning so many weights, yield for releasing CPU time. */
    let progress = { value: 0, max: 0 };

    for (let encodedString of encodedStringArray) { /* Estimate maximum volume for progress reporting. */
      progress.max += encodedString.length;
      let encodedWeightCount = Math.ceil(encodedString.length / encodedWeightCharCount);
      progress.max += encodedWeightCount;
    }

    let entityCount = encodedStringArray.length;
    let entities =    new Array(entityCount);

    yield progress; /* Report initial progress after first time memory allocation. */

    let totalScanedCharCount = 0;
    for (let i = 0; i < encodedStringArray.length; ++i) {
      let encodedString = encodedStringArray[ i ];
      let encodedWeightCount = Math.ceil(encodedString.length / encodedWeightCharCount);
      let integerWeights = new Float32Array( encodedWeightCount );

      let collectedCharCount = 0;
      let encodedWeight;
      let weightIndex = 0;
      let weightIndexAfterYield = 0;

      for (let encodedChar of encodedString) {
        totalScanedCharCount++;

        if (0 == collectedCharCount)
          encodedWeight = encodedChar;
        else
          encodedWeight += encodedChar;

        collectedCharCount++;
        if (collectedCharCount < encodedWeightCharCount)
          continue; /* Collect characters for one weight. */

        collectedCharCount = 0;
 
        integerWeights[ weightIndex ] = parseInt(encodedWeight, encodedWeightBase); /* Decode as integer. */
        weightIndex++;
        weightIndexAfterYield++;

        if (weightIndexAfterYield >= suspendWeightCount) { /* Every suspendWeightCount, release CPU time. */
          progress.value = totalScanedCharCount;
          yield progress;
          weightIndexAfterYield = 0;
        }
      }

      progress.value = totalScanedCharCount;
      yield progress; /* After weights of one entity converted to integer, release CPU time. */

      let totalScanedWeightCount = 0;


//!!! ...unfinished...
    let theEntities = integerWeightsArray.map( integerWeights => {
      let theEntity = [], weightIndex = 0, inChannels = 4; /* Suppose the first layer's input channel count is always RGBA 4 channels. */
      while ( weightIndex < integerWeights.length ) {
        let layer = new SeparableConv2d.Layer(integerWeights, weightIndex, inChannels, integerToFloat);	
        theEntity.push(layer);		
        inChannels =  layer.params.outChannels;  /* The next layer's input channel count is the previous layer's output channel count. */
        weightIndex = layer.weightIndexEnd;
      }
      return theEntity;
    });

      entity.push(layer);
      
      entities.push(entity);
      progress.value = totalScanedCharCount + totalScanedWeightCount;
      yield progress; /* After weights of one entity converted to layer, release CPU time. */


    }


//!!! ...unfinished...

//!!! ...unfinished...

    // RegExp for extracting an encoded weight from the encoded string. (e.g. /(.{5})/g )
    let encodedWeightMatchRegExp = new RegExp("(.{" + encodedWeightCharCount + "})", "g");
    let integerWeightsArray = Array.from(encodedStringArray, str => {
      let encodedWeights = str.match(encodedWeightMatchRegExp);       // Split string.
      let integerWeights = new Float32Array( encodedWeights.length );
      encodedWeights.forEach( ( element, i ) => { integerWeights[ i ] = parseInt(element, encodedWeightBase); } ); // Decode as integer.
      return integerWeights;
    } );

    let theEntities = integerWeightsArray.map( integerWeights => {
      let theEntity = [], weightIndex = 0, inChannels = 4; /* Suppose the first layer's input channel count is always RGBA 4 channels. */
      while ( weightIndex < integerWeights.length ) {
        let layer = new SeparableConv2d.Layer(integerWeights, weightIndex, inChannels, integerToFloat);	
        theEntity.push(layer);		
        inChannels =  layer.params.outChannels;  /* The next layer's input channel count is the previous layer's output channel count. */
        weightIndex = layer.weightIndexEnd;
      }
      return theEntity;
    });

  }


  let progressReceiver = ValueMaxDone.HTMLProgress.createByTitle_or_getDummy(this.htmlProgressTitle);
  let theEntitiesGenerator = entitiesGenerator(encodedStringArray);
  let p = PartTime.forOf(theEntitiesGenerator, (valueMax) => {
    progressReceiver.setValueMax(valueMax); /* Report progress to UI. */
  }).then((doneValue) => {
    progressReceiver.informDone(doneValue); /* Inform UI progress done. */
    return this.entities;
  });
  return p;
}

/**
 * A CNN layer contains three filters: depthwise, pointwise and bias.
 */
class Layer {

  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number}       inChannels         The input channel count.
   * @param {Function}     integerToFloat     An function which input an integer and return a floating-point number.
   */ 
  constructor(integerWeights, weightIndexBegin, inChannels, integerToFloat) {
    this.integerWeights =   integerWeights;
    this.weightIndexBegin = weightIndexBegin;

    this.params = new SeparableConv2d.Layer.Params(integerWeights, weightIndexBegin);
    this.depthwise = new SeparableConv2d.Layer.Filter(
      integerWeights, this.params.weightIndexEnd,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier], integerToFloat );

    this.pointwise = new SeparableConv2d.Layer.Filter(
      integerWeights, this.depthwise.weightIndexEnd,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels], integerToFloat );

    this.bias = new SeparableConv2d.Layer.Filter(
      integerWeights, this.pointwise.weightIndexEnd,
      [1, 1, this.params.outChannels], integerToFloat );

    this.weightIndexEnd = this.bias.weightIndexEnd;
  }

}

/**
 * A class for the CNN layer parameters.
 */
Layer.Params = class {
  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   */ 
  constructor(integerWeights, weightIndexBegin) {
    this.weightIndexBegin = weightIndexBegin;
    this.weightIndexEnd =   weightIndexBegin + SeparableConv2d.Layer.ParamNames.length;

    if ( this.weightIndexEnd > integerWeights.length )
      return;

    SeparableConv2d.Layer.ParamNames.forEach( ( paramName, i ) => this[ paramName ] = integerWeights[ weightIndexBegin + i ] );
  }
}

Layer.ParamNames = [
  "filterHeight", "filterWidth", "channelMultiplier", "dilationHeight", "dilationWidth", "outChannels"];

/**
 * A class for the CNN (depthwise, pointwise and bias) filter.
 */
Layer.Filter = class {

  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number[]}     shape              The filter shape (element count for every dimension). The shape.length is dimension.
   * @param {Function}     integerToFloat     An function which input an integer and return a floating-point number.
   */ 
  constructor(integerWeights, weightIndexBegin, shape, integerToFloat) {
    this.shape =            shape;
    this.weightCount =      shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue );
    this.weightIndexBegin = weightIndexBegin;
    this.weightIndexEnd =   weightIndexBegin + this.weightCount;  // Exclusive. As the next filter's begin.

    if ( this.weightIndexEnd > integerWeights.length ) {
      return; // No filter when shape is too large.
    }

    let byteOffset = Float32Array.BYTES_PER_ELEMENT * this.weightIndexBegin;
    this.filter =    new Float32Array( integerWeights.buffer, byteOffset, this.weightCount ); // Share the underlying array buffer.
    this.filter.forEach( ( element, i, array ) => array[ i ] = integerToFloat( element ) ); // Convert weight to floating-point number.
  }
}
