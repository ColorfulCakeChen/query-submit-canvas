
var SeparableConv2d = {};

/**
 * Parser for decoding string array to SeparableConv2d entities.
 */
SeparableConv2d.Parser = class {

  /**
   * 
   * @param  {number}   encodedWeightCharCount Every weight is encoded as string with this length. (e.g. 5 )
   * @param  {number}   encodedWeightBase      Every weight is encoded by this base number. (e.g. 2 or 10 or 16 or 36) 
   * @param  {number}   weightValueOffset      The value will be subtracted from the integer weight value.
   * @param  {number}   weightValueDivisor     Divide the integer weight value by this value for converting to floating-point number.
   * @param  {string}   htmlProgressTitle      The title of HTMLProgressElement for reporting progress. If null, no reporting.
   */
  constructor(encodedWeightCharCount, encodedWeightBase, weightValueOffset, weightValueDivisor, htmlProgressTitle) {
    this.encodedWeightCharCount = encodedWeightCharCount;
    this.encodedWeightBase =      encodedWeightBase;
    this.weightValueOffset =      weightValueOffset;
    this.weightValueDivisor =     weightValueDivisor;
    this.htmlProgressTitle =      htmlProgressTitle;

    this.htmlProgress = null;
    if (htmlProgressTitle) {
      htmlProgress = document.querySelector(`progress[title="${htmlProgressTitle}"]`);
    }
  }

  /**
   * @param {integer} integerWeight The integer which will be converted to floating-point number by subtract and divide.
   * @return The floating-point number.
   */
  integerToFloat(integerWeight) {
    return ( integerWeight - this.weightValueOffset ) / this.weightValueDivisor;
  }

  /**
   * When progress is advanced, call this method to display in UI.
   * @param {integer} advancedVolume The volume which will be added to the HTMLProgressElement.value.
   */
  reportProgressAdvance(advancedVolume) {
    if (this.htmlProgress) {
      this.htmlProgress.value += advancedVolume;
    }
  }

  /**
   * @param {function} promiseTimeoutCallback
   *   The function to be scheduled (by setTimeout()) to execute with two parameters (resolve, reject). Inside the callback,
   *   call resolve() or reject() will resolve or reject the promise.
   *
   * @return A promise for scheduling to run the promiseTimeoutCallback.
   */
  promiseTimeout(promiseTimeoutCallback) {
    return new Promise( (resolve, reject) => {
      setTimeout(promiseTimeoutCallback, 0, resolve, reject);
    });
  }


  /**
   * @param {string[]}            encodedStringArray     Every string is an encoded entity.
   * 
   */
  * memoryGenerator(encodedStringArray) {
    this.entityCount =         encodedStringArray.length;
    this.integerWeightsArray = new Array(encodedStringArray.length);
    for (let i = 0; i < encodedStringArray.length; ++i) {
      yield ( this.integerWeightsArray[ i ] = new Float32Array( encodedStringArray[ i ].length ) );
    }
  }

  /**
   * @param {string}              encodedString The encoded string.
   */
  * ToIntegerWeights(encodedString) {
  }

  /**
   * @param {string[]}            encodedStringArray     Every string is an encoded entity.
   */
  * entityGenerator(encodedStringArray) {
    let theMemoryGenerator = memoryGenerator(encodedStringArray);

    promiseTimeout( (resolve, reject) => {
      for (let integerWeights of theMemoryGenerator) {
//!!! ...unfinished...
        for (??? let entity of theEntityGenerator) {
        }
      }
    });

  }

  /**
   * 
   * @param  {string[]} encodedStringArray     Every string is an encoded entity.
   *
   * @return {Promise} A promise resolved as an Object[] which is the decoded entity for separableConv2d().
   *   The entity is an array of SeparableConv2d.Layer.
   */
  StringArrayToSeparableConv2dEntities(encodedStringArray) {
    let theEntityGenerator = entityGenerator(encodedStringArray);

//!!! ...unfinished...
    promiseTimeout( (resolve, reject) => {
      for (let entity of theEntityGenerator) {
      }
    });

//!!! ...unfinished...

    this.entityCount =            encodedStringArray.length;
    this.integerWeightsArray =    new Array(encodedStringArray.length);

    let integerToFloat = this.integerToFloat.bind(this);

    let p = new Promise( (resolve, reject) => {
      setTimeout(() => {
        // RegExp for extracting an encoded weight from the encoded string. (e.g. /(.{5})/g )
        let encodedWeightMatchRegExp = new RegExp("(.{" + encodedWeightCharCount + "})", "g");
        let integerWeightsArray = Array.from(encodedStringArray, str => {
          let encodedWeights = str.match(encodedWeightMatchRegExp);       // Split string.
          let integerWeights = new Float32Array( encodedWeights.length );
          encodedWeights.forEach( ( element, i ) => { integerWeights[ i ] =  parseInt(element, encodedWeightBase); } ); // Decode as integer.
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

        return theEntities;
      });
    });
    return p;
  }

}

/**
 * A CNN layer contains three filters: depthwise, pointwise and bias.
 */
SeparableConv2d.Layer = class {

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
SeparableConv2d.Layer.Params = class {
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

SeparableConv2d.Layer.ParamNames = [
  "filterHeight", "filterWidth", "channelMultiplier", "dilationHeight", "dilationWidth", "outChannels"];

/**
 * A class for the CNN (depthwise, pointwise and bias) filter.
 */
SeparableConv2d.Layer.Filter = class {

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
