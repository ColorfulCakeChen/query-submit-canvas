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

//!!! (2021/07/08 Remarked) seems not used.
//   /**
//    * Fills the following proterties:
//    *   - this.in.inputFloat32Array
//    *   - this.in.byteOffsetBegin
//    *   - this.in.weights
//    *   - this.in.channelCount1_pointwise1Before
//    *   - this.in.channelCount2_pointwise1Before
//    *   - this.out
//    *
//    * @param {number} channelCount1_pointwise1Before
//    *   The channel count of the first input image.
//    *
//    * @param {number} channelCount2_pointwise1Before
//    *   The channel count of the second input image.
//    *
//    * @return {TestParams}
//    *   Return this object self.
//    */
//   set(
//     channelCount1_pointwise1Before, channelCount2_pointwise1Before,
//     pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
//     depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
//     pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
//     pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
//     inputTensorCount
//   ) {

//     let paramsOut = {
//       pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
//       depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
//       pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
//       pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
//       inputTensorCount
//     };

//     return this.set_By_ParamsInArray_ParamsOut( channelCount1_pointwise1Before, channelCount2_pointwise1Before, null, paramsOut );
//   }
 
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
   * @param {Map<ParamName,number[]>} io_paramsNumberArrayMap
   *   Pass in a map. The result will be put into this map. It is map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.

//!!! (2021/07/08 Remarked)
//   * @param {number[]} paramsInArray
//   *   A number array which will be concatenated in front of the number array of filters and biases.
   *
   * @param {object} paramsOut
   *   An object which has the following data members: pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. This object will be recorded in this.out directly.
   *
   * @return {TestParams}
   *   Return this object self.
   */
//!!! (2021/07/08 Remarked)
//  set_By_ParamsInArray_ParamsOut( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsInArray, paramsOut ) {
  set_By_ParamsNumberArrayMap_ParamsOut( channelCount1_pointwise1Before, channelCount2_pointwise1Before, io_paramsNumberArrayMap, paramsOut ) {
    this.in.channelCount1_pointwise1Before = channelCount1_pointwise1Before;
    this.in.channelCount2_pointwise1Before = channelCount2_pointwise1Before;
    this.out = paramsOut;

//!!! (2021/07/08 Remarked)
//     let filters_biases = TestParams.generate_Filters_Biases( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsOut );
//
//     // In front of the filters and biases, there should be the parameters by evolution.
//     filters_biases.numberArrayArray.unshift( paramsInArray );
//
//    let Float32Array_ByteOffsetBegin = TestParams.concat_NumberArray_To_Float32Array( filters_biases.numberArrayArray );

    TestParams.generate_Filters_Biases( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsOut, io_paramsNumberArrayMap );

    let Float32Array_ByteOffsetBegin = TestParams.concat_NumberArrayMap_To_Float32Array( io_paramsNumberArrayMap );
    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    // The original (non-concatenated) filters and biases should also be returned.
//!!! (2021/07/08 Remarked)
//    this.in.weights = filters_biases.numberArrayObject;
    this.in.weights = io_numberArrayMap;

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
      result.numberArrayArray[ 0 ] = filtersArray;

      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = TestParams.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray[ 1 ] = biasesArray;
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
      result.numberArrayArray[ 0 ] = filtersArray; // Note: if AVG or MAX pooling, depthwise.numberArrayArray[ 0 ] will be undefined.
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = TestParams.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray[ 1 ] = biasesArray;
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
   * @param {object} paramsAll
   *   An object which must have all the following data members: pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. They will be used to modify io_paramsNumberArrayMap.
   *
   * @param {Map<ParamName,number[]>} io_paramsNumberArrayMap
   *   Pass in a map. The result will be put into this map. It is map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   */
  static generate_Filters_Biases( channelCount1_pointwise1Before, channelCount2_pointwise1Before, paramsAll, io_paramsNumberArrayMap ) {

    // Pointwise1
    let pointwise1 = TestParams.generate_pointwise_filters_biases( channelCount1_pointwise1Before,
      paramsAll.pointwise1ChannelCount, paramsAll.bPointwise1Bias );

    io_paramsNumberArrayMap.set( "pointwise1Filters", pointwise1.numberArrayArray[ 0 ] );
    io_paramsNumberArrayMap.set( "pointwise1Biases",  pointwise1.numberArrayArray[ 1 ] );

    // Depthwise
    let depthwise = TestParams.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

    io_paramsNumberArrayMap.set( "depthwiseFilters", depthwise.numberArrayArray[ 0 ] );
    io_paramsNumberArrayMap.set( "depthwiseBiases",  depthwise.numberArrayArray[ 1 ] );

    // Concat
    let pointwise2_inputChannelCount = depthwise.outputChannelCount;
    if ( paramsAll.inputTensorCount > 1 ) {
      pointwise2_inputChannelCount += channelCount2_pointwise1Before; // Add the channel count of the second input image.
    }

    // Pointwise21
    let pointwise21 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      paramsAll.pointwise21ChannelCount, paramsAll.bPointwise21Bias );

    io_paramsNumberArrayMap.set( "pointwise21Filters", pointwise21.numberArrayArray[ 0 ] );
    io_paramsNumberArrayMap.set( "pointwise21Biases",  pointwise21.numberArrayArray[ 1 ] );

    // Pointwise22
    let pointwise22 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      paramsAll.pointwise22ChannelCount, paramsAll.bPointwise22Bias );

    io_paramsNumberArrayMap.set( "pointwise22Filters", pointwise22.numberArrayArray[ 0 ] );
    io_paramsNumberArrayMap.set( "pointwise22Biases",  pointwise22.numberArrayArray[ 1 ] );
  }

  /**
   *
   * @param {Map<ParamName,number[]>} numberArrayMap
   *   Pass in a map. The result will be put into this map. It is map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   *
   * @return {object}
   *   Return an object { weightsFloat32Array, weightsByteOffsetBegin }. The weightsFloat32Array (as a Float32Array) is the concatenation
   * of the numberArrayArray. The weightsByteOffsetBegin is a random offset inside weightsFloat32Array.
   */
  static concat_NumberArrayMap_To_Float32Array( numberArrayMap ) {

    // For testing not start at the offset 0.
    let weightsElementOffsetBegin = ValueRange.Same.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.
    let result = {
      weightsByteOffsetBegin: weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT, // Skip the un-used byte count.
    };

    // Prepare weights source and offset into array. So that they can be accessed by loop.
    let weightsTotalLength = weightsElementOffsetBegin;
    let weightsSourceArray = [];
    for ( let i = 0; i < TestParams.paramsInArrayOrder.length; ++i ) {
      let paramName = TestParams.paramsInArrayOrder[ i ];
      let numberArray = numberArrayMap.get( paramName );
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
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of PointDepthPoint.initer().
 */
TestParams.paramsInArrayOrder = [
  PointDepthPoint.Params.pointwise1ChannelCount.paramName,
  PointDepthPoint.Params.bPointwise1Bias.paramName,
  PointDepthPoint.Params.pointwise1ActivationId.paramName,
  PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.paramName,
  PointDepthPoint.Params.depthwiseFilterHeight.paramName,
  PointDepthPoint.Params.depthwiseStridesPad.paramName,
  PointDepthPoint.Params.bDepthwiseBias.paramName,
  PointDepthPoint.Params.depthwiseActivationId.paramName,
  PointDepthPoint.Params.pointwise21ChannelCount.paramName,
  PointDepthPoint.Params.bPointwise21Bias.paramName,
  PointDepthPoint.Params.pointwise21ActivationId.paramName,
  PointDepthPoint.Params.pointwise22ChannelCount.paramName,
  PointDepthPoint.Params.bPointwise22Bias.paramName,
  PointDepthPoint.Params.pointwise22ActivationId.paramName,
  PointDepthPoint.Params.inputTensorCount.paramName,
  
  "pointwise1Filters",
  "pointwise1Biases",

  "depthwiseFilters",
  "depthwiseBiases",

  "pointwise21Filters",
  "pointwise21Biases",

  "pointwise22Filters",
  "pointwise22Biases",
];


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
    this.maxKindsPointwise = 3;

    // All the parameters to be tried. The order of these element could be changed to change testing order.
    //
    // Note1: Because the logic of activation function is simpler than other, it is just randomly tested one
    //        (i.e. ( maxKinds == 0 )) for speeding up testing.
    this.paramDescConfigArray = [
      { paramDesc: PointDepthPoint.Params.pointwise1ChannelCount,                maxKinds:    this.maxKindsPointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise1Bias,                       maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise1ActivationId,                maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier, maxKinds: this.maxKindsPerParameter },
      { paramDesc: PointDepthPoint.Params.depthwiseFilterHeight,                 maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseStridesPad,                   maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.bDepthwiseBias,                        maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseActivationId,                 maxKinds:                        0  },
      { paramDesc: PointDepthPoint.Params.pointwise21ChannelCount,               maxKinds:    this.maxKindsPointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise21Bias,                      maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise21ActivationId,               maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.pointwise22ChannelCount,               maxKinds:    this.maxKindsPointwise },
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

//!!! (2021/07/08 Remarked)
//    this.paramsInArray = [];
    this.paramsNumberArrayMap = new Map();
    this.result = new TestParams();

    yield *this.permuteParamRecursively( 0 );
  }

  /**
   * This method will modify this.result and this.paramsNumberArrayMap. It also calls itself recursively to permute all parameters.
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

      this.result.set_By_ParamsNumberArrayMap_ParamsOut(
        this.channelCount1_pointwise1Before, this.channelCount2_pointwise1Before, this.paramsNumberArrayMap, this.result.out );

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
      this.paramsNumberArrayMap.set( paramDesc.paramName, [ pair.valueInput ] );
      yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      this.paramsNumberArrayMap.delete( paramDesc.paramName ); // So that it could be re-tried as by-specifying when backtracking.
    }
  }

}
