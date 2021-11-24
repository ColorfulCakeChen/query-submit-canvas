export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as NameNumberArrayObject_To_Float32Array from "../../util/NameNumberArrayObject_To_Float32Array.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";
import * as TestParams from "./TestParams.js";
import * as PointDepthPoint from "../../Conv/PointDepthPoint.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of the PointDepthPoint.Params's constructor. That is,
 * it has the following data members: channelCount0_pointwise1Before, channelCount1_pointwise1Before, pointwise1ChannelCount,
 * bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
 * bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, bOutput1Requested,
 * bKeepInputTensor. It also has the following properties:
 *   - paramsNumberArrayObject
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of PointDepthPoint.Params's extract().
 * That is, it has the above data members except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 */
class Base extends TestParams.Base {

  /**
   *
   */
//   constructor() {
//     super();
//   }

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.out
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsScattered(
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    bOutput1Requested,
    bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      channelCount0_pointwise1Before,
      channelCount1_pointwise1Before,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
      bOutput1Requested,
      bKeepInputTensor
    };

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightsElementOffsetBegin = 0;
    return this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {object} this.out
   *   An object which has the following data members: channelCount0_pointwise1Before, channelCount1_pointwise1Before, pointwise1ChannelCount,
   * bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
   * bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, bOutput1Requested,
   * bKeepInputTensor.
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightsElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {

    Base.generate_Filters_Biases( this.out, this.in.paramsNumberArrayObject );

    let Float32Array_ByteOffsetBegin = new NameNumberArrayObject_To_Float32Array.Base();
    Float32Array_ByteOffsetBegin.setByConcat( Base.paramsNameOrderArray, this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    return this;
  }

  /**
   * @override
   */
  onBefore_Yield() {
    // For testing not start at the offset 0.
    let weightsElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }

  /**
   * @override
   */
  onAfter_Yield() {
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @param {number} inputImageHeight
   *   The height of the input image.
   *
   * @param {number} inputImageWidth
   *   The width of the input image.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator( inputImageHeight, inputImageWidth ) {
    this.inputImageHeight = inputImageHeight;
    this.inputImageWidth = inputImageWidth;

//!!! ...unfinished... (2021/07/27) When pad is "same", it should test more filter size.
    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    let depthwiseFilterMaxSize = Math.min( this.inputImageHeight, this.inputImageWidth );

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.valueOutMinMax = {
      pointwiseChannelCount: [ 0, 3 - 1 ],

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( undefined )) for speeding up testing.
//      Bias: undefined,
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

//      ActivationId: undefined,
//       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      channelCount0_pointwise1Before: [
        PointDepthPoint.Params.channelCount0_pointwise1Before.valueDesc.range.min,
        PointDepthPoint.Params.channelCount0_pointwise1Before.valueDesc.range.min + 4 - 1
      ],

      // Test all named values plus two more un-named values.
      channelCount1_pointwise1Before: [
        ValueDesc.channelCount1_pointwise1Before.Singleton.range.min,
        ValueDesc.channelCount1_pointwise1Before.Singleton.range.min
          + ValueDesc.channelCount1_pointwise1Before.Singleton.integerToNameMap.size + 2 - 1
      ],

      depthwise_AvgMax_Or_ChannelMultiplier: [
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.min,
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.min + 5 - 1
      ],

//!!! ...(2021/10/06 Temp Remarked) WASM seems not correct when ( depthwiseFilterHeight == 1 )
//      depthwiseFilterHeight: [ 1, depthwiseFilterMaxSize ],
      depthwiseFilterHeight: [ 2, depthwiseFilterMaxSize ],

      depthwiseStridesPad: undefined,
//       depthwiseStridesPad: [
//         PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.min,
//         PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.max
//       ],

//      bOutput1Requested: undefined,
      bOutput1Requested: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

      bKeepInputTensor: undefined,
//      bKeepInputTensor: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ChannelCount, this.valueOutMinMax.pointwiseChannelCount ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise21Bias,        this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ActivationId, this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bOutput1Requested,       this.valueOutMinMax.bOutput1Requested ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise1Bias,         this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ActivationId,  this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.channelCount0_pointwise1Before,
                                                                                      this.valueOutMinMax.channelCount0_pointwise1Before ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.channelCount1_pointwise1Before,
                                                                                      this.valueOutMinMax.channelCount1_pointwise1Before ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier,
                                                                                      this.valueOutMinMax.depthwise_AvgMax_Or_ChannelMultiplier ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseFilterHeight,   this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseStridesPad,     this.valueOutMinMax.depthwiseStridesPad ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bDepthwiseBias,          this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseActivationId,   this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ChannelCount,  this.valueOutMinMax.pointwiseChannelCount ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bKeepInputTensor,        this.valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

  /**
   * @return {number[]}
   *   Return a number array.
   */
  static generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax ) {
//!!! (2021/07/20 Temp Remarked) Fix to non-random to simplify debug.
    return RandTools.generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax );
//    return RandTools.generate_numberArray( elementCount, 0, 0 );
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
      let filtersArray = Base.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray[ 0 ] = filtersArray;

      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = Base.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
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
      let filtersArray = Base.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray[ 0 ] = filtersArray; // Note: if AVG or MAX pooling, depthwise.numberArrayArray[ 0 ] will be undefined.
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = Base.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray[ 1 ] = biasesArray;
      }
    }

    return result;
  }

  /**
   *
   * @param {object} paramsAll
   *   An object which must have all the following data members: channelCount0_pointwise1Before, channelCount1_pointwise1Before,
   * pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
   * depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
   * bOutput1Requested, inputTensorCount. They will be used to modify io_paramsNumberArrayObject.
   *
   * @param {object} io_paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsInArrayOrder[] elements.
   */
  static generate_Filters_Biases( paramsAll, io_paramsNumberArrayObject ) {

    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH                   // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    //    TWO_INPUTS_CONCAT_POINTWISE21_INPUT1     // (-3) (ShuffleNetV2's body/tail)
    //
    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    //    ONE_INPUT_TWO_DEPTHWISE                  // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))


    // Pointwise1
    let pointwise1;
    {
//!!! (2021/11/24 Remarked)
// double channelCount0_pointwise1Before and pointwise1ChannelCount in paramsAll and io_paramsNumberArrayObject (if existed)
// (instead of half filters weights).
// But use original channelCount0_pointwise1Before and pointwise1ChannelCount to generate filters weights.
//
//     let channelCount0_pointwise1Before = paramsAll.channelCount0_pointwise1Before;
//
//     // In ShuffleNetV2_ByMobileNetV1's body/tail, only need the lower half input of pointwise1's filters.
//     if ( ( paramsAll.channelCount1_pointwise1Before // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
//               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
//        ) {
//       channelCount0_pointwise1Before = Math.ceil( channelCount0_pointwise1Before / 2 );
//     }
//
// //!!! (2021/11/23 Remarked)
// //    let pointwise1 = Base.generate_pointwise_filters_biases( paramsAll.channelCount0_pointwise1Before,
//     let pointwise1 = Base.generate_pointwise_filters_biases( channelCount0_pointwise1Before,
//       paramsAll.pointwise1ChannelCount, paramsAll.bPointwise1Bias );

      let channelCount0_pointwise1Before_original = paramsAll.channelCount0_pointwise1Before;
      let pointwise1ChannelCount_original = paramsAll.pointwise1ChannelCount;

      // In ShuffleNetV2_ByMobileNetV1's body/tail:
      //   - Double channelCount0_pointwise1Before and pointwise1ChannelCount in paramsAll and io_paramsNumberArrayObject (if existed).
      //   - But use original channelCount0_pointwise1Before and pointwise1ChannelCount to generate filters weights.
      //
      // The reason is that PointDepthPoint will only extract half filters weights of channelCount0_pointwise1Before and
      // pointwise1ChannelCount in this case.
      //
      if ( ( paramsAll.channelCount1_pointwise1Before // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
         ) {

        let channelCount0_pointwise1Before_doubled = channelCount0_pointwise1Before_original * 2;
        let pointwise1ChannelCount_doubled = pointwise1ChannelCount_original * 2;

        paramsAll.channelCount0_pointwise1Before = channelCount0_pointwise1Before_doubled;
        paramsAll.pointwise1ChannelCount = pointwise1ChannelCount_doubled;

        if ( io_paramsNumberArrayObject[ PointDepthPoint.Params.channelCount0_pointwise1Before.paramName ] )
          io_paramsNumberArrayObject[ PointDepthPoint.Params.channelCount0_pointwise1Before.paramName ] = channelCount0_pointwise1Before_doubled;

        if ( io_paramsNumberArrayObject[ PointDepthPoint.Params.pointwise1ChannelCount.paramName ] )
          io_paramsNumberArrayObject[ PointDepthPoint.Params.pointwise1ChannelCount.paramName ] = pointwise1ChannelCount_doubled;
      }

      pointwise1 = Base.generate_pointwise_filters_biases( channelCount0_pointwise1Before_original,
        pointwise1ChannelCount_original, paramsAll.bPointwise1Bias );

      io_paramsNumberArrayObject.pointwise1Filters = pointwise1.numberArrayArray[ 0 ];
      io_paramsNumberArrayObject.pointwise1Biases =  pointwise1.numberArrayArray[ 1 ];
    }

    // Depthwise1
    let depthwise1 = Base.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

    io_paramsNumberArrayObject.depthwise1Filters = depthwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.depthwise1Biases =  depthwise1.numberArrayArray[ 1 ];

    // Depthwise2
    let depthwise2;
    {
      // In ShuffleNetV2's head.
      if (   ( paramsAll.channelCount1_pointwise1Before // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
                 == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE )
          || ( paramsAll.channelCount1_pointwise1Before // (-4) (ShuffleNetV2_ByMobileNetV1's head)
                 == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
         ) {
        depthwise2 = Base.generate_depthwise_filters_biases( paramsAll.channelCount0_pointwise1Before, // Use input0.
          paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight,
          paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

        io_paramsNumberArrayObject.depthwise2Filters = depthwise2.numberArrayArray[ 0 ];
        io_paramsNumberArrayObject.depthwise2Biases =  depthwise2.numberArrayArray[ 1 ];

      // no depthwise2.
      } else {
        io_paramsNumberArrayObject.depthwise2Filters = io_paramsNumberArrayObject.depthwise2Biases = undefined;
      }
    }

    // Concat
    let pointwise2_inputChannelCount = depthwise1.outputChannelCount;
    {
      if (   ( paramsAll.channelCount1_pointwise1Before // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
                 == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE )
          || ( paramsAll.channelCount1_pointwise1Before // (-4) (ShuffleNetV2_ByMobileNetV1's head)
                 == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
         ) {
        pointwise2_inputChannelCount += depthwise2.outputChannelCount; // Add the channel count of the branch of the first input image.

      // (> 0) Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_XXX  (simplified ShuffleNetV2's tail)
      } else if ( paramsAll.channelCount1_pointwise1Before > 0 ) {
        pointwise2_inputChannelCount += paramsAll.channelCount1_pointwise1Before; // Add the channel count of the second input image.
      }
    }

    // Pointwise21
    let pointwise21 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
      paramsAll.pointwise21ChannelCount, paramsAll.bPointwise21Bias );

    io_paramsNumberArrayObject.pointwise21Filters = pointwise21.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise21Biases =  pointwise21.numberArrayArray[ 1 ];

    // Pointwise22
    {
      let pointwise22ChannelCount;

      // In ShuffleNetV2's body/tail, there is always no pointwise22.
      if (   ( paramsAll.channelCount1_pointwise1Before // (-3) (ShuffleNetV2's body/tail)
                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
          || ( paramsAll.channelCount1_pointwise1Before // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
         ) {
        pointwise22ChannelCount = 0;

      } else { // Otherwise, pointwise22 is output1 directly.
        if ( paramsAll.bOutput1Requested ) { // If output1 is requested, pointwise22's output channel count is the same as pointwise21's.
          pointwise22ChannelCount = paramsAll.pointwise21ChannelCount;
        }
      }

      let bPointwise22Bias = paramsAll.bPointwise21Bias; // pointwise22's bias flag should always be the same as pointwise21's.

      let pointwise22 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise22ChannelCount, bPointwise22Bias );

      io_paramsNumberArrayObject.pointwise22Filters = pointwise22.numberArrayArray[ 0 ];
      io_paramsNumberArrayObject.pointwise22Biases =  pointwise22.numberArrayArray[ 1 ];
    }
  }

}

/**
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of PointDepthPoint.initer().
 */
Base.paramsNameOrderArray = [
  PointDepthPoint.Params.channelCount0_pointwise1Before.paramName,
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
  PointDepthPoint.Params.bOutput1Requested.paramName,

  PointDepthPoint.Params.bKeepInputTensor.paramName,
  
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
