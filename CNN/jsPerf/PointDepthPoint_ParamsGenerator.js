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
   *   Yield an object. The object's data members represent every parameters of the PointDepthPoint.Params's constructor. That is, it has
   * the following data members: inputFloat32Array, byteOffsetBegin, pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
   * pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId, pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
   * inputTensorCount.
   *
   */
  static *ParamsGenerator() {

//!!! ...unfinished... (2021/05/24)
    for ( let pointwise1ChannelCount of PointDepthPoint.Params.pointwise1ChannelCount.range.valueInputOutputPairGenerator() ) {

      pointwise1ChannelCount.valueInput;
      pointwise1ChannelCount.valueOutput;
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
