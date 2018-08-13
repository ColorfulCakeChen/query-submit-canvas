
var SeparableConv2d = {};

SeparableConv2d.Params = class {
  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   */ 
  constructor(integerWeights, weightIndexBegin) {
    this.weightIndexBegin = weightIndexBegin;
    this.weightIndexEnd =   weightIndexBegin + SeparableConv2d.ParamNames.length;

    if ( this.weightIndexEnd > integerWeights.length )
      return;

    SeparableConv2d.ParamNames.forEach( ( paramName, i ) => this[ paramName ] = integerWeights[ weightIndexBegin + i ] );
  }
}

SeparableConv2d.ParamNames = ["filterHeight", "filterWidth", "channelMultiplier", "dilationHeight", "dilationWidth", "outChannels"];


/**
 * The CNN filter for depthwise, pointwise and bias.
 */
SeparableConv2d.Filter = class {

  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number}       weightValueOffset  The value will be subtracted from the integer weight value.
   * @param {number}       weightValueDivisor Divide the integer weight value by this value for converting to floating-point number.
   * @param {number[]}     shape              The filter shape (element count for every dimension).
   */ 
  constructor(integerWeights, weightIndexBegin, weightValueOffset, weightValueDivisor, shape) {
    this.shape =            shape;
    this.weightCount =      shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue );
    this.weightIndexBegin = weightIndexBegin;
    this.weightIndexEnd =   weightIndexBegin + this.weightCount;  // Exclusive. As the next filter's begin.

    if ( this.weightIndexEnd > integerWeights.length ) {
      return; // No filter when shape is too large.
    }

    function integerToFloat(integerWeight) {
      return ( integerWeight - weightValueOffset ) / weightValueDivisor;
    }

    let byteOffset = Float32Array.BYTES_PER_ELEMENT * this.weightIndexBegin;
    this.filter =    new Float32Array( integerWeights.buffer(), byteOffset, this.weightCount ); // Share the underlying array buffer.
    this.filter.map( integerToFloat ); // Convert weight to floating-point number.
  }
}


/**
 *
 */
SeparableConv2d.Layer = class {

  /**
   * @param {Float32Array} integerWeights     An Float32Array whose values are all integers.
   * @param {number}       weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number}       weightValueOffset  The value will be subtracted from the integer weight value.
   * @param {number}       weightValueDivisor Divide the integer weight value by this value for converting to floating-point number.
   * @param {number}       inChannels         The input channel count.
   */ 
  constructor(integerWeights, weightIndexBegin, weightValueOffset, weightValueDivisor, inChannels) {
    this.integerWeights =   integerWeights;
    this.weightIndexBegin = weightIndexBegin;

    this.params = new SeparableConv2d.Params(integerWeights, weightIndexBegin);
    this.depthwise = new SeparableConv2d.Filter(
      integerWeights, this.params.weightIndexEnd, weightValueOffset, weightValueDivisor,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] );

    this.pointwise = new SeparableConv2d.Filter(
      integerWeights, this.depthwise.weightIndexEnd, weightValueOffset, weightValueDivisor,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] );

    this.bias = new SeparableConv2d.Filter(
      integerWeights, this.pointwise.weightIndexEnd, weightValueOffset, weightValueDivisor,
      [1, 1, this.params.outChannels] );

    this.weightIndexEnd = this.bias.weightIndexEnd;
  }

  /**
   * 
   * @param  {string[]} encodedStringArray     Every string is an encoded entity.
   * @param  {number}   encodedWeightCharCount Every weight is encoded as string with this length. (e.g. 5 )
   * @param  {number}   encodedWeightBase      Every weight is encoded by this base number. (e.g. 2 or 10 or 16 or 36) 
   * @param  {number}   weightValueOffset      The value will be subtracted from the integer weight value.
   * @param  {number}   weightValueDivisor     Divide the integer weight value by this value for converting to floating-point number.
   * @return {Object[]} Decoded entity for separableConv2d(). Every entity is an array of SeparableConv2dLayer.
   */
  static StringArrayToSeparableConv2dEntities(
    encodedStringArray, encodedWeightCharCount, encodedWeightBase, weightValueOffset, weightValueDivisor) {

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
        let layer = new SeparableConv2d.Layer(integerWeights, weightIndex, weightValueOffset, weightValueDivisor, inChannels);	
        theEntity.push(layer);		
        inChannels =  layer.params.outChannels;  /* The next layer's input channel count is the previous layer's output channel count. */
        weightIndex = layer.weightIndexEnd;
      }
      return theEntity;
    });

    return theEntities;
  }

}
