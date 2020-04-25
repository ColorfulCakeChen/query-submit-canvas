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
   */ 
  constructor( inputFloat32Array, byteOffsetBegin, inChannels, fixedParams = null ) {

    this.params = new Layer.Params( inputFloat32Array, byteOffsetBegin, fixedParams );
    if ( !this.params.isValid() )
      return;

    this.depthwise = new Layer.Filter(
      inputFloat32Array, this.params.defaultByteOffsetEnd, null, 0,
      [this.params.filterHeight, this.params.filterWidth, inChannels, this.params.channelMultiplier] );

    if ( !this.depthwise.isValid() )
      return;

    this.pointwise = new Layer.Filter(
      inputFloat32Array, this.depthwise.defaultByteOffsetEnd, null, 0,
      [1, 1, inChannels * this.params.channelMultiplier, this.params.outChannels] );

    if ( !this.pointwise.isValid() )
      return;

    this.bias = new Layer.Filter(
      inputFloat32Array, this.pointwise.defaultByteOffsetEnd, null, 0,
      [1, 1, this.params.outChannels] );
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
 * A class for the CNN (depthwise, pointwise and bias) filter weights.
 */
Layer.Filter = class {

  /**
   * Create Float32Array weights[] over the defaultInput (or privilegeInput) according to the specific
   * byteOffsetBegin, shape, and weightConverter.
   *
   * The defaultInput and privilegeInput can not both be null. If one of them is null, the non-null is used.
   * If both are non-null, the privilegeInput will be used.
   *
   * @param {Float32Array} defaultInput
   *   The default input Float32Array. Its byteOffset will be checked against defaultByteOffsetBegin.
   * Its content will be interpret as weights if privilegeInput is null. Otherwise, its content
   * will be ignored if privilegeInput is not null.
   *
   * @param {number}       defaultByteOffsetBegin
   *   The position to start to decode from the defaultInput. This is relative to the defaultInput.buffer
   * (not to the defaultInput.byteOffset). If this value less than defaultInput.byteOffset, the
   * initialization will fail (i.e. ( isValid() == false ) ).
   *
   * @param {Float32Array} privilegeInput
   *   The privilege input Float32Array. If not null, its content will be interpret as weights and
   * the content of defaultInput will be ignored.
   *
   * @param {number}       privilegeByteOffsetBegin
   *   The position to start to decode from the privilegeInput. This is relative to the privilegeInput.buffer
   * (not to the privilegeInput.byteOffset). If this value less than privilegeInput.byteOffset, the
   * initialization will fail (i.e. ( isValid() == false ) ).
   *
   * @param {number[]}     shape
   *   The filter shape (element count for every dimension). The shape.length is dimension. The initialization will
   * fail (i.e. ( isValid() == false ) ) if shape is too large (or NaN) (exceeds the defaultInput (or, privilegeInput
   * if not null) bounding).
   *
   * @param {Function}     weightConverter
   *   A function which will be applied on every weight (e.g. integerToFloat, or floatToInteger). The result of the
   * function will replace the original value in the weights[] array. If null, there will be no converting.
   */ 
  constructor(
    defaultInput, defaultByteOffsetBegin, privilegeInput, privilegeByteOffsetBegin, shape, weightConverter = null ) {

    this.defaultInput =   defaultInput;
    this.privilegeInput = privilegeInput;
    this.shape =          shape;

    let weightCount =     shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue );
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Exclusive. As the next filter's begin.

    if ( privilegeInput ) {       // privilegeInput first.

      if ( privilegeByteOffsetBegin < privilegeInput.byteOffset )
        return;  // Failed, the privilege beginning position is illegal (less than bounding).

      input =                         privilegeInput;
      this.defaultByteOffsetBegin =
      this.defaultByteOffsetEnd =     defaultByteOffsetBegin;

      byteOffsetBegin =
      this.privilegeByteOffsetBegin = privilegeByteOffsetBegin;

      byteOffsetEnd =
      this.privilegeByteOffsetEnd =   privilegeByteOffsetBegin + weightByteCount;

    } else if ( defaultInput ) {  // defaultInput second.

        if ( defaultByteOffsetBegin < defaultInput.byteOffset )
          return;  // Failed, the default beginning position is illegal (less than bounding).

        input =                         privilegeInput;

        byteOffsetBegin =
        this.defaultByteOffsetBegin =   defaultByteOffsetBegin;

        byteOffsetEnd =
        this.defaultByteOffsetEnd =     defaultByteOffsetBegin + weightByteCount;

        this.privilegeByteOffsetBegin =
        this.privilegeByteOffsetEnd =   privilegeByteOffsetBegin;

    } else {
      return;  // Failed, privilege and default input both are null.
    }

    let legalByteOffsetEnd = input.byteOffset + input.byteLength;

    if ( byteOffsetEnd > legalByteOffsetEnd )
      return;  // Failed, if shape is too large (or NaN).

    // Share the underlying array buffer. But be bounded by the input.byteLength.
    this.weights = new Float32Array( input.buffer, byteOffsetBegin, weightCount );

    if (weightConverter)  // Convert weights.
      this.weights.forEach( ( element, i, array ) => array[ i ] = weightConverter( element ) );
  }

  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }
}

/**
 * A class for the CNN separable convolution (2D) layer parameters.
 */
Layer.Params = class extends Layer.Filter {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. The weights will be convert to positive integer.
   *
   * @param {number}       byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {Array} fixedWeights
   *   If null, extract 6 parameters from inputFloat32Array. If not null, extract 6 parameters from it instead of
   * inputFloat32Array. If not null, it should have 6 elements: [ filterHeight, filterWidth, channelMultiplier,
   * dilationHeight, dilationWidth, outChannels ].
   */
  constructor( inputFloat32Array, byteOffsetBegin, fixedWeights = null ) {

    function toPositiveInteger( v ) {
      return Math.abs( Math.trunc( v ) );
    }

    let privilegeInput;
    if ( fixedWeights )
      privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.

    // Extract 6 weights from inputFloat32Array or fixedWeights, and convert the values to positive integer.
    let parameterCount = 6;
    super( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCount ], toPositiveInteger );
  }

  get filterHeight()      { return this.weights[ 0 ]; }
  get filterWidth()       { return this.weights[ 1 ]; }
  get channelMultiplier() { return this.weights[ 2 ]; }
  get dilationHeight()    { return this.weights[ 3 ]; }
  get dilationWidth()     { return this.weights[ 4 ]; }
  get outChannels()       { return this.weights[ 5 ]; }
}
