export { Stage_ParamsBase as ParamsBase };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Block from "../Block.js";
import { InferencedParams } from "./Stage_InferencedParams.js";

/**
 * Convolution stage parameters.
 *
 * @member {InferencedParams} inferencedParams
 *   The inferenced parameters of this stage parameters.
 *
 */
 class Stage_ParamsBase extends Recyclable.Root {

  /**
   * Used as default Stage.ParamsBase provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Stage.ParamsBase.Pool",
    Stage_ParamsBase );

  /**
   */
  constructor(
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor,
    bTableLog
  ) {
    super();
    this.#setAsConstructor_self(
      input_height, input_width, input_channelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor,
      bTableLog
    );
  }

  /** @override */
  setAsConstructor(
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor,
    bTableLog
  ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      input_height, input_width, input_channelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor,
      bTableLog
    );
  }

  /**  */
  #setAsConstructor_self(
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor,
    bTableLog
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.nConvStageTypeId = nConvStageTypeId;
    this.blockCountRequested = blockCountRequested;
    this.bPointwise1 = bPointwise1;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterWidth;
    this.nSqueezeExcitationChannelCountDivisor
      = nSqueezeExcitationChannelCountDivisor;
    this.nActivationId = nActivationId;
    this.bKeepInputTensor = bKeepInputTensor;
    this.bTableLog = bTableLog;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bTableLog = undefined;
    this.bKeepInputTensor = undefined;
    this.nActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bPointwise1 = undefined;
    this.blockCountRequested = undefined;
    this.nConvStageTypeId = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    super.disposeResources();
  }

  /** Release .inferencedParams */
  inferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /** Create .inferencedParams */
  inferencedParams_create() {
    this.inferencedParams_dispose();
    this.inferencedParams = InferencedParams.Pool.get_or_create_by( this );
  }

  /**
   * @return {boolean}
   *   Return true, if .inferencedParams will create .blockParamsArray
   */
  inferencedParams_blockParamsArray_needed() {
    return true;
  }

  /**
   * @return {Block.ParamsBase|Block.Params}
   *   Return which block parameter class should be used by InferencedParams.
   */
  BlockParamsClass_get() {
    return Block.ParamsBase;
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId(
      this.nConvStageTypeId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton
      .getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId(
      this.nActivationId );
  }

  /** @override */
  toString() {
    let str =
        `input_height=${this.input_height}, input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `

      + `nConvStageTypeId=${this.nConvStageTypeName}`
        + `(${this.nConvStageTypeId}), `

      + `blockCountRequested=${this.blockCountRequested}, `
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `nActivationName=${this.nActivationName}(${this.nActivationId}), `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `bTableLog=${this.bTableLog}, `

      + `inferencedParams={ ${this.inferencedParams} }`
    ;

    return str;
  }

}
