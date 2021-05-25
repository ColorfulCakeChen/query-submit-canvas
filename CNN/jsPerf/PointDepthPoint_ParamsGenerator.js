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

//!!! ...unfinished... (2021/05/24)
//     paramsInArray, paramsOutArray,
//     pointwise1FiltersArray, pointwise1BiasesArray,
//     depthwiseFiltersArray, depthwiseBiasesArray,
//     pointwise21FiltersArray, pointwise21BiasesArray,
//     pointwise22FiltersArray, pointwise22BiasesArray,

    let paramsInArray = [];
    let result = { in: {}, out: {} };

//!!! ...unfinished... (2021/05/24)
    for ( let pointwise1ChannelCount of PointDepthPoint.Params.pointwise1ChannelCount.range.valueInputOutputGenerator() ) {

      result.out.pointwise1ChannelCount( pointwise1ChannelCount.valueOutput );

      paramsInArray.push( pointwise1ChannelCount.valueInput );
      result.in.pointwise1ChannelCount = null;


      paramsInArray.pop();
      result.in.pointwise1ChannelCount = pointwise1ChannelCount.valueInput;
    }

    PointDepthPoint.Params.bPointwise1Bias.range;
    PointDepthPoint.Params.pointwise1ActivationId.range;
    PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.range;
    PointDepthPoint.Params.depthwiseFilterHeight.range;
    PointDepthPoint.Params.depthwiseStridesPad.range;
    PointDepthPoint.Params.bDepthwiseBias.range;
    PointDepthPoint.Params.depthwiseActivationId.range;
    PointDepthPoint.Params.pointwise21ChannelCount.range;
    PointDepthPoint.Params.bPointwise21Bias.range;
    PointDepthPoint.Params.pointwise21ActivationId.range;
    PointDepthPoint.Params.pointwise22ChannelCount.range;
    PointDepthPoint.Params.bPointwise22Bias.range;
    PointDepthPoint.Params.pointwise22ActivationId.range;
    PointDepthPoint.Params.inputTensorCount.range;

//!!! ...unfinished... (2021/05/24)

  }

}
