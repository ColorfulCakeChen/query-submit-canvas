export { Base };

//import * as ParamDesc from "../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";

class Base {

  constructor() {
    // All the parameters to be tried.
    this.paramDescArray = [
      PointDepthPoint.Params.pointwise1ChannelCount,
      PointDepthPoint.Params.bPointwise1Bias,
      PointDepthPoint.Params.pointwise1ActivationId,
      PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier,
      PointDepthPoint.Params.depthwiseFilterHeight,
      PointDepthPoint.Params.depthwiseStridesPad,
      PointDepthPoint.Params.bDepthwiseBias,
      PointDepthPoint.Params.depthwiseActivationId,
      PointDepthPoint.Params.pointwise21ChannelCount,
      PointDepthPoint.Params.bPointwise21Bias,
      PointDepthPoint.Params.pointwise21ActivationId,
      PointDepthPoint.Params.pointwise22ChannelCount,
      PointDepthPoint.Params.bPointwise22Bias,
      PointDepthPoint.Params.pointwise22ActivationId,
      PointDepthPoint.Params.inputTensorCount,
    ];

  }

  /**
   *
   *
   *
   *
   * @yield {object}
   *   Yield an object { in, out } which has two sub-objects. The "in" sub-object's data members represent every parameters of the
   * PointDepthPoint.Params's constructor. That is, it has the following data members: inputFloat32Array, byteOffsetBegin,
   * pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
   * depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
   * pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId, inputTensorCount. The "out" sub-object's data members represent
   * the "should-be" result of PointDepthPoint.Params's extract(). That is, it has the above data members except inputFloat32Array,
   * byteOffsetBegin.
   *
   */
  * ParamsGenerator() {

    this.paramsInArray = [];
    this.result = { in: {}, out: {} };
    
//!!! ...unfinished... (2021/05/25)
    yield *this.permuteParamRecursively( 0 );
  }

  /**
   * This method will modify this.result and this.paramsInArray. It also calls itself recursively to permute all parameters.
   *
   * @param {number} currentIndex
   *   The index into the this.paramDescArray[]. It represents the current parameter to be tried.
   *
   * @yield {object}
   *   Every time one kind of parameters' combination is generated, this method will yield an object { in, out } which has two sub-objects.
   * The "in" sub-object's data members represent every parameters of the PointDepthPoint.Params's constructor. The "out" sub-object's data
   * members represent the "should-be" result of PointDepthPoint.Params's extract().
   *
   */
  * permuteParamRecursively( currentIndex ) {

    if ( currentIndex >= this.paramDescArray.length ) { // All parameters are tried to one kind of combination.
//!!! ...unfinished... (2021/05/25)
    
//     paramsInArray, paramsOutArray,
//     pointwise1FiltersArray, pointwise1BiasesArray,
//     depthwiseFiltersArray, depthwiseBiasesArray,
//     pointwise21FiltersArray, pointwise21BiasesArray,
//     pointwise22FiltersArray, pointwise22BiasesArray,

      let numberArrayArray = Base.generate_Filters_Biases( this.result.in );

      let Float32Array_ByteOffsetBegin = Base.concat_NumberArray_To_Float32Array( numberArrayArray );
      this.result.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
      this.result.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

      yield this.result;
      return;
    }

    let nextIndex = currentIndex + 1;

//!!! ...unfinished... (2021/05/25)
    let paramDesc = this.paramDescArray[ currentIndex ];
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator() ) {
      this.result.out[ paramDesc.paramName ] = pair.valueOutput;

      // Try parameter value assigned directly (i.e. by specifying).      
      this.result.in[ paramDesc.paramName ] = pair.valueInput;
      yield *this.permuteParamRecursively( nextIndex );

      // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
      this.result.in[ paramDesc.paramName ] = null;
      this.paramsInArray.push( pair.valueInput );
      yield *this.permuteParamRecursively( nextIndex );
    }

  }


  /**
   * @param {object}
   *   An object which has the following data members: 
   * pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
   * depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
   * pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId, inputTensorCount.
   *
   * @return {number[][]}
   *   Return an array. Every element of the array is a number array. At most, it may look like [ pointwise1FiltersArray,
   * pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray,
   * pointwise22FiltersArray, pointwise22BiasesArray ]. But it may not have so many elements because some may not exist. So, it may
   * be an array with zero element.
   */
  static generate_Filters_Biases( params ) {
    
    let numberArrayArray = [];

    params

//!!! ...unfinished... (2021/05/26)
    let numberArrayArray = [
      pointwise1FiltersArray, pointwise1BiasesArray,
      depthwiseFiltersArray, depthwiseBiasesArray,
      pointwise21FiltersArray, pointwise21BiasesArray,
      pointwise22FiltersArray, pointwise22BiasesArray,
    ];

    return numberArrayArray;
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
    this.weightsElementOffsetBegin = ValueRange.Same.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.
    let result = {
      weightsByteOffsetBegin: this.weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used byte count.
    };

    // Prepare weights source and offset into array. So that they can be accessed by loop.
    let weightsTotalLength = result.weightsElementOffsetBegin;
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

      for ( let i = 0; i < weightsSourceArray.length; ++i ) { // Concatenate this.weights into a Float32Array.
        result.weightsFloat32Array.set( weightsSourceArray[ i ].weights, weightsSourceArray[ i ].offset );
      }
    }

    return result;
  }

}
