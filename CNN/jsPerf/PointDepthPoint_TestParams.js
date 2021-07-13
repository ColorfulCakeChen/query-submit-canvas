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
 * it has the following data members: inputFloat32Array, byteOffsetBegin, 

//!!! ...unfinished (2021/07/12) When ( channelCount1_pointwise1Before == 0 ), need depthwise2.
 
 pointwise1ChannelCount, bPointwise1Bias,
 * pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias,
 * depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, pointwise22ChannelCount,
 * bPointwise22Bias, pointwise22ActivationId, inputTensorCount. It also has the following properties:
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *   - weights
 *   - channelCount0_pointwise1Before
 *   - channelCount1_pointwise1Before
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

//!!! ...unfinished... (2021/06/09) channelCount0_pointwise1Before and channelCount1_pointwise1Before should also be random
// tested (e.g. between 3 - 5).

 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.in.weights
   *   - this.in.channelCount0_pointwise1Before
   *   - this.in.channelCount1_pointwise1Before
   *   - this.out
   *
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the second input image.
   *
   * @param {object} io_paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   *
   * @param {object} paramsOut
   *   An object which has the following data members:

//!!! ...unfinished (2021/07/12) When ( channelCount1_pointwise1Before == 0 ), need depthwise2.
   
   pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. This object will be recorded in this.out directly.
   *
   * @return {TestParams}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( channelCount0_pointwise1Before, channelCount1_pointwise1Before, io_paramsNumberArrayObject, paramsOut ) {
    this.in.channelCount0_pointwise1Before = channelCount0_pointwise1Before;
    this.in.channelCount1_pointwise1Before = channelCount1_pointwise1Before;
    this.out = paramsOut;

    TestParams.generate_Filters_Biases( channelCount0_pointwise1Before, channelCount1_pointwise1Before, paramsOut, io_paramsNumberArrayObject );

    let Float32Array_ByteOffsetBegin = TestParams.concat_ParamsNumberArrayObject_To_Float32Array( io_paramsNumberArrayObject );
    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    // The original (non-concatenated) filters and biases should also be returned.
    this.in.weights = io_paramsNumberArrayObject;

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
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the second input image.
   *
   * @param {object} paramsAll
   *   An object which must have all the following data members: pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. They will be used to modify io_paramsNumberArrayObject.
   *
   * @param {object} io_paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   */
  static generate_Filters_Biases( channelCount0_pointwise1Before, channelCount1_pointwise1Before, paramsAll, io_paramsNumberArrayObject ) {

    // Pointwise1
    let pointwise1 = TestParams.generate_pointwise_filters_biases( channelCount0_pointwise1Before,
      paramsAll.pointwise1ChannelCount, paramsAll.bPointwise1Bias );

    io_paramsNumberArrayObject.pointwise1Filters = pointwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise1Biases =  pointwise1.numberArrayArray[ 1 ];

    // Depthwise
    let depthwise = TestParams.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

    io_paramsNumberArrayObject.depthwiseFilters = depthwise.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.depthwiseBiases =  depthwise.numberArrayArray[ 1 ];

//!!! ...unfinished (2021/07/12) When ( channelCount1_pointwise1Before == 0 ), need depthwise2.

    // Concat
    let pointwise2_inputChannelCount = depthwise.outputChannelCount;
    if ( paramsAll.inputTensorCount > 1 ) {
      pointwise2_inputChannelCount += channelCount1_pointwise1Before; // Add the channel count of the second input image.
    }

    // Pointwise21
    let pointwise21 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      paramsAll.pointwise21ChannelCount, paramsAll.bPointwise21Bias );

    io_paramsNumberArrayObject.pointwise21Filters = pointwise21.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise21Biases =  pointwise21.numberArrayArray[ 1 ];

    // Pointwise22
    let pointwise22 = TestParams.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      paramsAll.pointwise22ChannelCount, paramsAll.bPointwise22Bias );

    io_paramsNumberArrayObject.pointwise22Filters = pointwise22.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise22Biases =  pointwise22.numberArrayArray[ 1 ];
  }

  /**
   *
   * @param {object} paramsNumberArrayObject
   *   Pass in an object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   *
   * @return {object}
   *   Return an object { weightsFloat32Array, weightsByteOffsetBegin }. The weightsFloat32Array (as a Float32Array) is the concatenation
   * of the numberArrayArray. The weightsByteOffsetBegin is a random offset inside weightsFloat32Array.
   */
  static concat_ParamsNumberArrayObject_To_Float32Array( paramsNumberArrayObject ) {

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
      let numberArray = paramsNumberArrayObject[ paramName ];
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

//!!! ...unfinished (2021/07/12) When ( channelCount1_pointwise1Before == 0 ), need depthwise2.

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

//!!! ...unfinished... (2021/07/11) channelCount0_pointwise1Before and channelCount1_pointwise1Before should also be included
// when permuteParamRecursively. They should be one of ( channelCount0_pointwise1Before, 0 ) or
// ( channelCount0_pointwise1Before, channelCount1_pointwise1Before ) according to inputTensorCount is 0, 1, or 2.
//

  /**
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of the second input image.
   */
  constructor( channelCount0_pointwise1Before, channelCount1_pointwise1Before ) {
    this.channelCount0_pointwise1Before = channelCount0_pointwise1Before;
    this.channelCount1_pointwise1Before = channelCount1_pointwise1Before;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.maxKindsPerParameter = 5;
    this.maxKindsPointwise = 3;

    // All the parameters to be tried.
    //
    // Note1: Because the logic of activation function is simpler than other, it is just randomly tested one
    //        (i.e. ( maxKinds == 0 )) for speeding up testing.
    //
    // Note2: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    this.paramDescConfigArray = [
      
//!!! ...unfinished (2021/07/12) When ( channelCount1_pointwise1Before == 0 ), need depthwise2.

      { paramDesc: PointDepthPoint.Params.pointwise21ChannelCount,               maxKinds:    this.maxKindsPointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise21Bias,                      maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise21ActivationId,               maxKinds:                         0 },
      { paramDesc: PointDepthPoint.Params.pointwise22ChannelCount,               maxKinds:    this.maxKindsPointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise22Bias,                      maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise22ActivationId,               maxKinds:                         0 },

      { paramDesc: PointDepthPoint.Params.pointwise1ChannelCount,                maxKinds:    this.maxKindsPointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise1Bias,                       maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.pointwise1ActivationId,                maxKinds:                         0 },

      { paramDesc: PointDepthPoint.Params.inputTensorCount,                      maxKinds:                 undefined },

      { paramDesc: PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier, maxKinds: this.maxKindsPerParameter },
//!!! (2021/07/09 Remarked) when pad is "valid", it seems that depthwise (avg/max pooling)'s filter size could not be larger than input image size?
//      { paramDesc: PointDepthPoint.Params.depthwiseFilterHeight,                 maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseFilterHeight,                 maxKinds:                         3 },
      { paramDesc: PointDepthPoint.Params.depthwiseStridesPad,                   maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.bDepthwiseBias,                        maxKinds:                 undefined },
      { paramDesc: PointDepthPoint.Params.depthwiseActivationId,                 maxKinds:                         0 },
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

    this.paramsNumberArrayObject = {}; // All parameters which will be packed into weights array.
    this.result = new TestParams();

    yield *this.permuteParamRecursively( 0 );
  }

  /**
   * This method will modify this.result and this.paramsNumberArrayObject. It also calls itself recursively to permute all parameters.
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
        this.channelCount0_pointwise1Before, this.channelCount1_pointwise1Before, this.paramsNumberArrayObject, this.result.out );

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
      this.paramsNumberArrayObject[ paramDesc.paramName ] = [ pair.valueInput ];
      yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      this.paramsNumberArrayObject[ paramDesc.paramName ] = undefined; // So that it could be re-tried as by-specifying when backtracking.
    }
  }

}
