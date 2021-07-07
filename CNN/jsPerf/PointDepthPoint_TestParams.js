export { Base };

//import * as ParamDesc from "../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of the parameter.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of the PointDepthPoint.Params's constructor. That is,
 * it has the following data members: inputFloat32Array, byteOffsetBegin, pointwise1ChannelCount, bPointwise1Bias,
 * pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias,
 * depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, pointwise22ChannelCount,
 * bPointwise22Bias, pointwise22ActivationId, inputTensorCount. It also has the following properties:
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *   - weights
 *   - channelCount1_pointwise1Before
 *   - channelCount2_pointwise1Before
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of PointDepthPoint.Params's extract().
 * That is, it has the above data members except inputFloat32Array, byteOffsetBegin.
 *
 */
class TestParams {

  constructor() {
    this.id = -1;
    this.in = {};
    this.out = {};
  }

//!!! ...unfinished... (2021/06/09) channelCount1_pointwise1Before and channelCount2_pointwise1Before should also be random
// tested (e.g. between 3 - 5).

  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.in.weights
   *   - this.in.channelCount1_pointwise1Before
   *   - this.in.channelCount2_pointwise1Before
   *   - this.out
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount2_pointwise1Before
   *   The channel count of the second input image.
   *
   * @return {TestParams}
   *   Return this object self.
   */
  set(
    channelCount1_pointwise1Before, channelCount2_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
    inputTensorCount
  ) {

    let paramsOut = {
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
      pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
      inputTensorCount
    };

    return this.set_By_ParamsInArray_ParamsOut( channelCount1_pointwise1Before, channelCount2_pointwise1Before, null, paramsOut );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.in.weights
   *   - this.in.channelCount1_pointwise1Before
   *   - this.in.channelCount2_pointwise1Before
   *   - this.out
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount2_pointwise1Before
   *   The channel count of the second input image.
   *
   * @param {number[]} paramsInArray
   *   A number array which will be concatenated in front of the number array of filters and biases.
   *
   * @param {object} paramsOut
   *   An object which has the following data members: pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. This object will be recorded in this.out directly.
   *
   * @return {TestParams}
   *   Return this object self.
   */
  set_By_ParamsInArray_ParamsOut( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsInArray, paramsOut ) {
    this.in.channelCount1_pointwise1Before = channelCount1_pointwise1Before;
    this.in.channelCount2_pointwise1Before = channelCount2_pointwise1Before;
    this.out = paramsOut;

    let filters_biases = TestParams.generate_Filters_Biases( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsOut );

    // In front of the filters and biases, there should be the parameters by evolution.
    filters_biases.numberArrayArray.unshift( paramsInArray );

    let Float32Array_ByteOffsetBegin = TestParams.concat_NumberArray_To_Float32Array( filters_biases.numberArrayArray );
    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    // The original (non-concatenated) filters and biases should also be returned.
    this.in.weights = filters_biases.numberArrayObject;

    return this;
  }

  /**
   * @return {number[]}
   *   Return a number array.
   */
  static generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax ) {
    let numberArray = [ ... new Array( elementCount ).keys() ].map(
      x => x + ValueRange.Same.getRandomIntInclusive( randomOffsetMin, randomOffsetMax ) );
    return numberArray;
  }

  /**
   * @param {number} inputChannelCount
   *   The channel count of the pointwise convolution's input.
   *
   * @param {number} outputChannelCount
   *   The channel count of the pointwise convolution's output. If ( outputChannelCount <= 0 ), means this pointwise convolution does not exist.
   *
   * @param {boolean} bBias
   *   If true, the returned array will contain a number array as the bias' weight values. If ( outputChannelCount <= 0 ), this will be ignored.
   *
   * @return {object}
   *   Return an object { outputChannelCount, numberArrayArray }. The outputChannelCount is the channel count of this pointwise operation.
   * The numberArrayArray is an array. Its every element is a number array. At most, numberArrayArray will contain two number array and
   * look like [ pointwiseFiltersArray, pointwiseBiasesArray ]. But it may also be no element (i.e. an empty array).
   */
  static generate_pointwise_filters_biases( inputChannelCount, outputChannelCount, bBias ) {
    let result = {
      outputChannelCount: inputChannelCount, // If this pointwise operation does not exist, default outputChannelCount will be inputChannelCount.
      numberArrayArray: []
    };

    if ( outputChannelCount > 0 ) {
      result.outputChannelCount = outputChannelCount;

      let filtersWeightsRandomOffset = { min: -100, max: +100 };
      let filtersWeightsCount = inputChannelCount * outputChannelCount;
      let filtersArray = TestParams.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray.push( filtersArray );

      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = TestParams.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray.push( biasesArray );
      }
    }

    return result;
  }

  /**
   * @param {number} inputChannelCount
   *   The channel count of the depthwise convolution's input.
   *
   * @param {boolean} bBias
   *   If true, the returned array will contain a number array as the bias' weight values. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ),
   * this will be ignored.
   *
   * @return {object}
   *   Return an object { outputChannelCount, numberArrayArray }. The outputChannelCount is the channel count of this depthwise operation.
   * The numberArrayArray is an array. Its every element is a number array. At most, numberArrayArray will contain two number array and
   * look like [ depthwiseFiltersArray, depthwiseBiasesArray ]. But it may also be no element (i.e. an empty array).
   */
  static generate_depthwise_filters_biases(
    inputChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bBias ) {

    let result = {
      outputChannelCount: inputChannelCount, // If this depthwise operation does not exist, default outputChannelCount will be inputChannelCount.
      numberArrayArray: []
    };

    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      result.outputChannelCount = inputChannelCount * depthwise_AvgMax_Or_ChannelMultiplier;

      let filtersWeightsRandomOffset = { min: -100, max: +100 };
      let depthwiseFilterWidth = depthwiseFilterHeight;
      let filtersWeightsCount = result.outputChannelCount * ( depthwiseFilterHeight * depthwiseFilterWidth );
      let filtersArray = TestParams.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray.push( filtersArray );
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = TestParams.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray.push( biasesArray );
      }
    }

    return result;
  }

  /**
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount2_pointwise1Before
   *   The channel count of the second input image.
   *
   * @param {object} params
   *   An object which has the following data members:  pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount.
   *
   * @return {number[][]}
   *   Return an object { numberArrayObject, numberArrayArray }. The numberArrayObject is an object which may or may not have the
   * following properties: pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
   * pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray. The numberArrayArray is an array.
   * Every element of the array is a number array (i.e. the above number array). At most, it may look like [ pointwise1FiltersArray,
   * pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray,
   * pointwise22FiltersArray, pointwise22BiasesArray ]. But it may not have so many elements because some may not exist. So, it may
   * be an array with zero element.
   */
  static generate_Filters_Biases( channelCount1_pointwise1Before, channelCount2_pointwise1Before, params ) {
    let result = { numberArrayObject: {}, numberArrayArray: [] };

    // Pointwise1
    let pointwise1 = TestParams.generate_pointwise_filters_biases( channelCount1_pointwise1Before,
      params.pointwise1ChannelCount, params.bPointwise1Bias );

    result.numberArrayObject.pointwise1Filters = pointwise1.numberArrayArray[ 0 ];
    result.numberArrayObject.pointwise1Biases = pointwise1.numberArrayArray[ 1 ];
    result.numberArrayArray.push( ...pointwise1.numberArrayArray );

    // Depthwise
    let depthwise = TestParams.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      params.depthwise_AvgMax_Or_ChannelMultiplier, params.depthwiseFilterHeight, params.depthwiseStridesPad, params.bDepthwiseBias );

    result.numberArrayObject.depthwiseFilters = depthwise.numberArrayArray[ 0 ];
    result.numberArrayObject.depthwiseBiases = depthwise.numberArrayArray[ 1 ];
    result.numberArrayArray.push( ...depthwise.numberArrayArray );

    // Concat
    let pointwise2_inputChannelCount = depthwise.outputChannelCount;
    if ( params.inputTensorCount > 1 ) {
      pointwise2_inputChannelCount += channelCount2_pointwise1Before; // Add the channel count of the second input image.
    }

    // Pointwise21
    let pointwise21 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      params.pointwise21ChannelCount, params.bPointwise21Bias );

    result.numberArrayObject.pointwise21Filters = pointwise21.numberArrayArray[ 0 ];
    result.numberArrayObject.pointwise21Biases = pointwise21.numberArrayArray[ 1 ];
    result.numberArrayArray.push( ...pointwise21.numberArrayArray );

    // Pointwise22
    let pointwise22 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      params.pointwise22ChannelCount, params.bPointwise22Bias );

    result.numberArrayObject.pointwise22Filters = pointwise22.numberArrayArray[ 0 ];
    result.numberArrayObject.pointwise22Biases = pointwise22.numberArrayArray[ 1 ];
    result.numberArrayArray.push( ...pointwise22.numberArrayArray );

    return result;
  }

  /**
   *
   * @param {number[][]} numberArrayArray
   *   An array. Its elements are number array.
   *
   * @return {object}
   *   Return an object { weightsFloat32Array, weightsByteOffsetBegin }. The weightsFloat32Array (as a Float32Array) is the concatenation
   * of the numberArrayArray. The weightsByteOffsetBegin is a random offset inside weightsFloat32Array.
   */
  static concat_NumberArray_To_Float32Array( numberArrayArray ) {

    // For testing not start at the offset 0.
    let weightsElementOffsetBegin = ValueRange.Same.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.
    let result = {
      weightsByteOffsetBegin: weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT, // Skip the un-used byte count.
    };

    // Prepare weights source and offset into array. So that they can be accessed by loop.
    let weightsTotalLength = weightsElementOffsetBegin;
    let weightsSourceArray = [];
    for ( let i = 0; i < numberArrayArray.length; ++i ) {
      let numberArray = numberArrayArray[ i ];
      if ( numberArray ) {
        weightsSourceArray.push( { offset: weightsTotalLength, weights: numberArray } );
        weightsTotalLength += numberArray.length;
      }
    }

    // Concatenate all number array into a Float32Array.
    result.weightsFloat32Array = new Float32Array( weightsTotalLength );
    {
      for ( let i = 0; i < result.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        result.weightsFloat32Array[ i ] = -i;
      }

      for ( let i = 0; i < weightsSourceArray.length; ++i ) { // Concatenate all number array into a Float32Array.
        result.weightsFloat32Array.set( weightsSourceArray[ i ].weights, weightsSourceArray[ i ].offset );
      }
    }

    return result;
  }

}


/**
 * Responsible for generating TestParams.
 */
class Base {

  /**
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount2_pointwise1Before
   *   The channel count of the second input image.
   */
  constructor( channelCount1_pointwise1Before, channelCount2_pointwise1Before ) {
    this.channelCount1_pointwise1Before = channelCount1_pointwise1Before;
    this.channelCount2_pointwise1Before = channelCount2_pointwise1Before;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.maxKindsPerParameter = 5;

    // All the parameters to be tried.
    //
    // Note1: Because the logic of activation function is simple, it is just randomly tested one (i.e. ( maxKinds == 0 ))
    //        for speeding up testing.
    this.paramDescConfigArray = [
      { paramDesc: PointDepthPoint.Params.pointwise1ChannelCount,                maxKinds: this.maxKindsPerParameter },
      { paramDesc: PointDepthPoint.Params.bPointwise1Bias,                       maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise1ActivationId,                maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier, maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseFilterHeight,                 maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseStridesPad,                   maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.bDepthwiseBias,                        maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseActivationId,                 maxKinds:                        0  },
      { paramDesc: PointDepthPoint.Params.pointwise21ChannelCount,               maxKinds: this.maxKindsPerParameter },
      { paramDesc: PointDepthPoint.Params.bPointwise21Bias,                      maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise21ActivationId,               maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.pointwise22ChannelCount,               maxKinds: this.maxKindsPerParameter },
      { paramDesc: PointDepthPoint.Params.bPointwise22Bias,                      maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise22ActivationId,               maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.inputTensorCount,                      maxKinds:                 undefined },
    ];
  }

  /**
   *
   *
   *
   * @yield {TestParams}
   *   Yield an object PointDepthPoint_TestParams.TestParams.
   */
  * ParamsGenerator() {

    this.paramsInArray = [];
    this.result = new TestParams();

    yield *this.permuteParamRecursively( 0 );
  }

  /**
   * This method will modify this.result and this.paramsInArray. It also calls itself recursively to permute all parameters.
   *
   * @param {number} currentParamDescIndex
   *   The index into the this.paramDescArray[]. It represents the current parameter to be tried.
   *
   * @yield {TestParams}
   *   Every time one kind of parameters' combination is generated, the this.result will be yielded.
   */
  * permuteParamRecursively( currentParamDescConfigIndex ) {

    if ( currentParamDescConfigIndex >= this.paramDescConfigArray.length ) { // All parameters are used to be composed as one kind of combination.
      ++this.result.id;  // Complete one kind of combination.

      this.result.set_By_ParamsInArray_ParamsOut(
        this.channelCount1_pointwise1Before, this.channelCount2_pointwise1Before, this.paramsInArray, this.result.out );

      yield this.result;
      return; // Stop this recusive. Back-track to another parameters combination.
    }

    let nextParamDescConfigIndex = currentParamDescConfigIndex + 1;

//!!! ...unfinished... (2021/07/06) When ( XxxChannelCount == 0 ), whether could skip bias and activation combination?

    let paramDescConfig = this.paramDescConfigArray[ currentParamDescConfigIndex ];
    let paramDesc = paramDescConfig.paramDesc;
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( undefined, paramDescConfig.maxKinds ) ) {

      //!!! (2021/07/06 Temp Debug) Check the algorithm might be wrong.
      //if ( paramDesc.valueDesc.range.adjust( pair.valueInput ) != pair.valueOutput )
      //  debugger;

      this.result.out[ paramDesc.paramName ] = pair.valueOutput;

      // Try parameter value assigned directly (i.e. by specifying).      
      this.result.in[ paramDesc.paramName ] = pair.valueInput;
      yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
      this.result.in[ paramDesc.paramName ] = null;
      this.paramsInArray.push( pair.valueInput );
      yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      this.paramsInArray.pop(); // So that it could be re-tried as by-specifying when backtracking.
    }
  }

}
