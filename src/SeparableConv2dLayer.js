/**
 *
 */
class SeparableConv2dLayer {

  /**
   * @param {number[]} integerWeights     An integer array (1D).
   * @param {number}   weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number}   weightValueOffset  The value will be subtracted from the integer weight value.
   * @param {number}   weightValueDivisor Divide the integer weight value by this value for converting to floating-point number.
   * @param {number}   inChannels         The input channel count.
   */ 
  constructor(integerWeights, weightIndexBegin, weightValueOffset, weightValueDivisor, inChannels) {
    this.weightIndexBegin = weightIndex;
    this.params = {};
    this.depthwise = {weightIndexBegin: weightIndex + SeparableConv2dLayer.ParamNames.length};
    this.pointwise = {};
    this.bias = {};

    function integerToFloat(integerWeight) {
      return ( integerWeight - weightValueOffset ) / weightValueDivisor;
    }

    if ( weightIndex >= integerWeights.length ) {
      return;
    }

    if ( this.depthwise.weightIndexBegin >= integerWeights.length ) {
      return;
    }

    for ( let i = 0; i < SeparableConv2dLayer.ParamNames.length; ++i ) {
      this.params[ SeparableConv2dLayer.ParamNames[i] ] = integerWeights[weightIndex+i]; }

    this.depthwise.weightCount = this.params.filterHeight * this.params.filterWidth * inChannels * this.params.channelMultiplier;
    this.depthwise.shape =       [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier];
    this.pointwise.weightCount = inChannels * this.params.channelMultiplier * this.params.outChannels;
    this.pointwise.shape =       [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels];
    this.bias.weightCount =      this.params.outChannels;
    this.bias.shape =            [1, 1, this.params.outChannels];

    this.depthwise.weightIndexEnd =   this.depthwise.weightIndexBegin + this.depthwise.weightCount;
    this.pointwise.weightIndexBegin = this.depthwise.weightIndexEnd;
    this.pointwise.weightIndexEnd =   this.pointwise.weightIndexBegin + this.pointwise.weightCount;
    this.bias.weightIndexBegin =      this.pointwise.weightIndexEnd;
    this.bias.weightIndexEnd =        this.bias.weightIndexBegin + this.bias.weightCount;

    if ( this.depthwise.weightIndexEnd >= integerWeights.length) {
      return;
    }
    this.depthwise.filter = integerWeights.slice(this.depthwise.weightIndexBegin, this.depthwise.weightIndexEnd).map( integerToFloat );

    if ( this.pointwise.weightIndexEnd >= integerWeights.length) {
      return;
    }
    this.pointwise.filter = integerWeights.slice(this.pointwise.weightIndexBegin, this.pointwise.weightIndexEnd).map( integerToFloat );

    if ( this.bias.weightIndexEnd >= integerWeights.length) {
      return;
    }
    this.bias.filter = integerWeights.slice(this.bias.weightIndexBegin, this.bias.weightIndexEnd).map( integerToFloat );
  }

  /**
   * 
   * @param  {string[]} encodedStringArray       Every string is an encoded entity.
   * @param  {RegExp}   encodedWeightMatchRegExp RegExp for extracting an encoded weight from the encoded string. (e.g. /(.{5})/g )
   * @param  {number}   encodedWeightBase        Every weight is encoded by this base number. (e.g. 2 or 10 or 16 or 36) 
   * @param  {number}   weightValueOffset        The value will be subtracted from the integer weight value.
   * @param  {number}   weightValueDivisor       Divide the integer weight value by this value for converting to floating-point number.
   * @return {Object[]} Decoded entity for separableConv2d(). Every entity is an array of SeparableConv2dLayer.
   */
  static StringArrayToSeparableConv2dEntities(
    encodedStringArray, encodedWeightMatchRegExp, encodedWeightBase, weightValueOffset, weightValueDivisor) {

    let integerWeightsArray = Array.from(encodedStringArray,
          str => { str.match(encodedWeightMatchRegExp).map(element=>parseInt(element,encodedWeightBase)) } );

    let theEntities = integerWeightsArray.map( integerWeights => {
      let theEntity = [], weightIndex = 0, inChannels = 4; /* Suppose the first layer's input channel count is always RGBA 4 channels. */
      while ( weightIndex < integerWeights.length ) {
        let layer = new SeparableConv2dLayer(integerWeights, weightIndex, weightValueOffset, weightValueDivisor, inChannels);	
        theEntity.push(layer);		
        inChannels =  layer.params.outChannels;  /* The next layer's input channel count is the previous layer's output channel count. */
        weightIndex = layer.bias.weightIndexEnd;
      }
      return theEntity;
    });

    return theEntities;
  }

}

SeparableConv2dLayer.ParamNames = ["filterHeight", "filterWidth", "channelMultiplier", "dilationHeight", "dilationWidth", "outChannels"];
