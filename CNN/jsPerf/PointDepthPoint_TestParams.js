export { TestParams, Base };

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
 * it has the following data members: inputFloat32Array, byteOffsetBegin, channelCount1_pointwise1Before, pointwise1ChannelCount,
 * bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
 * bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, pointwise22ChannelCount,
 * bPointwise22Bias, pointwise22ActivationId. It also has the following properties:
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *   - weights
 *   - channelCount0_pointwise1Before
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

//!!! ...unfinished... (2021/06/09) channelCount0_pointwise1Before should also be randomly tested (e.g. between 3 - 5).

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.in.weights
   *   - this.in.channelCount0_pointwise1Before
   *   - this.out
   *
   * @return {TestParams}
   *   Return this object self.
   */
  set_By_ParamsScattered(
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId
  ) {
    let paramsNumberArrayObject = {};
    let paramsOut = {
      channelCount1_pointwise1Before,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
      pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId
    };

    Object.assign( this.in, paramsOut ); // So that all parameters are by specified (none is by evolution).

    return this.set_By_ParamsNumberArrayMap_ParamsOut( channelCount0_pointwise1Before, paramsNumberArrayObject, paramsOut );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.in.weights
   *   - this.in.channelCount0_pointwise1Before
   *   - this.out
   *
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of the first input image.
   *
   * @param {object} io_paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   *
   * @param {object} paramsOut
   *   An object which has the following data members: channelCount1_pointwise1Before, pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias. This object will be recorded in this.out directly.
   *
   * @return {TestParams}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( channelCount0_pointwise1Before, io_paramsNumberArrayObject, paramsOut ) {
    this.in.channelCount0_pointwise1Before = channelCount0_pointwise1Before;
    this.out = paramsOut;

    TestParams.generate_Filters_Biases( channelCount0_pointwise1Before, paramsOut, io_paramsNumberArrayObject );

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
   * @param {object} paramsAll
   *   An object which must have all the following data members: channelCount1_pointwise1Before, pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias, inputTensorCount. They will be used to modify io_paramsNumberArrayObject.
   *
   * @param {object} io_paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of TestParams.paramsInArrayOrder[] elements.
   */
  static generate_Filters_Biases( channelCount0_pointwise1Before, paramsAll, io_paramsNumberArrayObject ) {

    // Pointwise1
    let pointwise1 = TestParams.generate_pointwise_filters_biases( channelCount0_pointwise1Before,
      paramsAll.pointwise1ChannelCount, paramsAll.bPointwise1Bias );

    io_paramsNumberArrayObject.pointwise1Filters = pointwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise1Biases =  pointwise1.numberArrayArray[ 1 ];

    // Depthwise1
    let depthwise1 = TestParams.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

    io_paramsNumberArrayObject.depthwise1Filters = depthwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.depthwise1Biases =  depthwise1.numberArrayArray[ 1 ];

    // Depthwise2
    let depthwise2;
    if ( paramsAll.channelCount1_pointwise1Before
           == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_TWO_DEPTHWISE ) { // (-2) (simplified ShuffleNetV2's head)

      depthwise2 = TestParams.generate_depthwise_filters_biases( channelCount0_pointwise1Before, // Use input0.
        paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

      io_paramsNumberArrayObject.depthwise2Filters = depthwise2.numberArrayArray[ 0 ];
      io_paramsNumberArrayObject.depthwise2Biases =  depthwise2.numberArrayArray[ 1 ];
    } else {
      io_paramsNumberArrayObject.depthwise2Filters = io_paramsNumberArrayObject.depthwise2Biases = undefined;
    }

    // Concat
    let pointwise2_inputChannelCount = depthwise1.outputChannelCount;
    {
      // (-2) (simplified ShuffleNetV2's head)
      if ( paramsAll.channelCount1_pointwise1Before == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_TWO_DEPTHWISE ) {
        pointwise2_inputChannelCount += depthwise2.outputChannelCount; // Add the channel count of the branch of the first input image.

      // (> 0) Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_XXX  (simplified ShuffleNetV2's tail)
      } else if ( paramsAll.channelCount1_pointwise1Before > 0 ) {
        pointwise2_inputChannelCount += paramsAll.channelCount1_pointwise1Before; // Add the channel count of the second input image.
      }
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
  PointDepthPoint.Params.channelCount1_pointwise1Before.paramName,
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
  
  "pointwise1Filters",
  "pointwise1Biases",

  "depthwise1Filters",
  "depthwise1Biases",

  "depthwise2Filters",
  "depthwise2Biases",

  "pointwise21Filters",
  "pointwise21Biases",

  "pointwise22Filters",
  "pointwise22Biases",
];


/**
 * Responsible for generating TestParams.
 */
class Base {

//!!! ...unfinished... (2021/07/11) channelCount0_pointwise1Before  should also be included when permuteParamRecursively.

  /**
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of the first input image.
   *
   */
  constructor( channelCount0_pointwise1Before ) {
    this.channelCount0_pointwise1Before = channelCount0_pointwise1Before;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.maxKindsRestrict = {
//      PerParameter: 5,
      Pointwise:    3,

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( maxKinds == 0 )) for speeding up testing.
//!!! (2021/07/20 Temp Remarked) Fix to none to simplify debug.
//       Bias:         0,
//       ActivationId: 0,
      Bias:         1,
      ActivationId: 1,

      channelCount1_pointwise1Before: 5,
      depthwise_AvgMax_Or_ChannelMultiplier: 5,

//!!! (2021/07/09 Remarked) when pad is "valid", it seems that depthwise (avg/max pooling)'s filter size could not be larger than input image size?
//      depthwiseFilterHeight: undefined,
      depthwiseFilterHeight: 3,

      depthwiseStridesPad: undefined,
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    this.paramDescConfigArray = [

      { paramDesc: PointDepthPoint.Params.pointwise21ChannelCount,               maxKinds: this.maxKindsRestrict.Pointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise21Bias,                      maxKinds: this.maxKindsRestrict.Bias },
      { paramDesc: PointDepthPoint.Params.pointwise21ActivationId,               maxKinds: this.maxKindsRestrict.ActivationId },
      { paramDesc: PointDepthPoint.Params.pointwise22ChannelCount,               maxKinds: this.maxKindsRestrict.Pointwise },
      { paramDesc: PointDepthPoint.Params.bPointwise22Bias,                      maxKinds: this.maxKindsRestrict.Bias },
      { paramDesc: PointDepthPoint.Params.pointwise22ActivationId,               maxKinds: this.maxKindsRestrict.ActivationId },

      { paramDesc: PointDepthPoint.Params.bPointwise1Bias,                       maxKinds: this.maxKindsRestrict.Bias },
      { paramDesc: PointDepthPoint.Params.pointwise1ActivationId,                maxKinds: this.maxKindsRestrict.ActivationId },

      { paramDesc: PointDepthPoint.Params.channelCount1_pointwise1Before,        maxKinds: this.maxKindsRestrict.channelCount1_pointwise1Before },

      { paramDesc: PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier, maxKinds: this.maxKindsRestrict.depthwise_AvgMax_Or_ChannelMultiplier },
      { paramDesc: PointDepthPoint.Params.depthwiseFilterHeight,                 maxKinds: this.maxKindsRestrict.depthwiseFilterHeight },
      { paramDesc: PointDepthPoint.Params.depthwiseStridesPad,                   maxKinds: this.maxKindsRestrict.depthwiseStridesPad },
      { paramDesc: PointDepthPoint.Params.bDepthwiseBias,                        maxKinds: this.maxKindsRestrict.Bias },
      { paramDesc: PointDepthPoint.Params.depthwiseActivationId,                 maxKinds: this.maxKindsRestrict.ActivationId },

      { paramDesc: PointDepthPoint.Params.pointwise1ChannelCount,                maxKinds: this.maxKindsRestrict.Pointwise },
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
        this.channelCount0_pointwise1Before, this.paramsNumberArrayObject, this.result.out );

      yield this.result;
      return; // Stop this recusive. Back-track to another parameters combination.
    }

    let nextParamDescConfigIndex = currentParamDescConfigIndex + 1;

    let paramDescConfig = this.paramDescConfigArray[ currentParamDescConfigIndex ];
    let paramDesc = paramDescConfig.paramDesc;
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( undefined, paramDescConfig.maxKinds ) ) {

      //!!! (2021/07/06 Temp Debug) Check the algorithm might be wrong.
      //if ( paramDesc.valueDesc.range.adjust( pair.valueInput ) != pair.valueOutput )
      //  debugger;

      this.result.out[ paramDesc.paramName ] = pair.valueOutput;

      // Randomly place the parameter directly or in weights array.
//!!! (2021/07/19 Temp Remarked)
      let dice = Math.random();
//      let dice = 0;
      if ( dice < 0.5 ) {
        // Try parameter value assigned directly (i.e. by specifying).      
        this.result.in[ paramDesc.paramName ] = pair.valueInput;
        yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      } else {
        // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
        this.result.in[ paramDesc.paramName ] = null;
        this.paramsNumberArrayObject[ paramDesc.paramName ] = [ pair.valueInput ];
        yield *this.permuteParamRecursively( nextParamDescConfigIndex );

        this.paramsNumberArrayObject[ paramDesc.paramName ] = undefined; // So that it could be re-tried as by-specifying when backtracking.
      }
    }
  }

}
