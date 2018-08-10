/**
 *
 */
class SeparableConv2dLayer {

  /**
   * @param {number[]} integerWeights     An integer array (1D).
   * @param {number}   weightIndexBegin   The position to start to decode from the integerWeights.
   * @param {number}   weightValueOffset  The value will be subtracted from the integer weight value.
   * @param {number}   weightValueDivisor Divide the integer weight value by this value for converting to floating-point number.
   */ 
  constructor(integerWeights, weightIndexBegin, weightValueOffset, weightValueDivisor) {
    this.weightIndexBegin = weightIndex;
    this.params = {};
    this.depthwiseFilter = {weightIndexBegin: weightIndex + SeparableConv2dLayer.ParamNames.length};
    this.pointwiseFilter = {};

    if ( weightIndex >= integerWeights.length ) {
      return;
    }

    if ( this.depthwiseFilter.weightIndexBegin >= integerWeights.length ) {
      return;
    }

    for ( let i = 0; i < SeparableConv2dLayer.ParamNames.length; ++i ) {
      this.params[ SeparableConv2dLayer.ParamNames[i] ] = integerWeights[weightIndex+i]; }

    this.depthwiseFilter.weightCount = this.params.filterHeight * this.params.filterWidth * inChannels * this.params.channelMultiplier;
    this.pointwiseFilter.weightCount = inChannels * this.params.channelMultiplier * this.params.outChannels;

    this.depthwiseFilter.weightIndexEnd = this.depthwiseFilter.weightIndexBegin + this.depthwiseFilter.weightCount;
    if ( this.depthwiseFilter.weightIndexEnd >= integerWeights.length) {
      return;
    }
    this.depthwiseFilter = integerWeights.slice(this.depthwiseFilter.weightIndexBegin, this.depthwiseFilter.weightIndexEnd)
      .map( integerWeight => ( integerWeight - weightValueOffset ) / weightValueDivisor );

    this.pointwiseFilter.weightIndexBegin = this.depthwiseFilter.weightIndexEnd;
    this.pointwiseFilter.weightIndexEnd =   this.pointwiseFilter.weightIndexBegin + this.pointwiseFilter.weightCount;
    if ( this.pointwiseFilter.weightIndexEnd >= integerWeights.length) {
      return;
    }

    this.pointwiseFilter = integerWeights.slice(this.pointwiseFilter.weightIndexBegin, this.pointwiseFilter.weightIndexEnd)
      .map( integerWeight => ( integerWeight - weightValueOffset ) / weightValueDivisor );
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
        let layer = new SeparableConv2dLayer(integerWeights, weightIndex, weightValueOffset, weightValueDivisor);	
        theEntity.push(layer);		
        inChannels =  layer.params.outChannels;  /* The next layer's input channel count is the previous layer's output channel count. */
        weightIndex = layer.pointwiseFilter.weightIndexEnd;
      }
      return theEntity;
    });

    return theEntities;
  }

}

SeparableConv2dLayer.ParamNames = ["filterHeight", "filterWidth", "channelMultiplier", "dilationHeight", "dilationWidth", "outChannels"];
