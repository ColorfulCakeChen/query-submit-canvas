export { Base };

//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";

class Base {

  constructor() {
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
  static *ParamsGenerator() {

    // All the parameters to be tried.
    let paramDescArray = [
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

//!!! ...unfinished... (2021/05/24)
//     paramsInArray, paramsOutArray,
//     pointwise1FiltersArray, pointwise1BiasesArray,
//     depthwiseFiltersArray, depthwiseBiasesArray,
//     pointwise21FiltersArray, pointwise21BiasesArray,
//     pointwise22FiltersArray, pointwise22BiasesArray,

    let paramsInArray = [];
    let result = { in: {}, out: {} };

//!!! ...unfinished... (2021/05/24)
    for ( let i = 0; i < paramDescArray.length; ++i ) {
      let paramDesc = paramDescArray[ i ];

      for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator() ) {

        result.out[ paramDesc.paramName ]( pair.valueOutput );

        // Try parameter value assigned directly (i.e. by specifying).
        result.in[ paramDesc.paramName ] = null;
        paramsInArray.push( pair.valueInput );

//!!! ...unfinished... (2021/05/25)

        // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
        result.in[ paramDesc.paramName ] = pair.valueInput;
        paramsInArray.pop();
      }


//!!! ...unfinished... (2021/05/24)

  }

  /**
   *
   * @param {ParamDesc.Base[]} paramDescArray
   *   All the parameters to be tried.
   *
   * @param {number} currentIndex
   *   The index into the paramDescArray[]. It represents the current parameter to be tried.
   *
   * @return {???}
   *
   */
  static permuteParams( paramDescArray, currentIndex ) {

    if ( currentIndex >= paramDescArray.length )
      return; // All parameters are tried.

//!!! ...unfinished... (2021/05/25)
    let paramDesc = paramDescArray[ currentIndex ];
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator() ) {

      result.out[ paramDesc.paramName ]( pair.valueOutput );

      paramsInArray.push( pair.valueInput );
      result.in[ paramDesc.paramName ] = null;


      paramsInArray.pop();
      result.in[ paramDesc.paramName ] = pair.valueInput;
    }

  }

}
