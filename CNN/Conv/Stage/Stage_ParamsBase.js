export { Stage_ParamsBase as ParamsBase };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { InferencedParams } from "./Stage_InferencedParams.js";

/**
 *
 */
 class Stage_ParamsBase extends Recyclable.Root {

  /**
   * Used as default Stage.ParamsBase provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.ParamsBase.Pool", Stage_ParamsBase, Stage_ParamsBase.setAsConstructor );

  /**
   */
  constructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    bPointwise2ActivatedAtStageEnd,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor
  ) {
    super();
    Stage_ParamsBase.setAsConstructor_self.call( this,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      bPointwise2ActivatedAtStageEnd,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    bPointwise2ActivatedAtStageEnd,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    Stage_ParamsBase.setAsConstructor_self.call( this,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      bPointwise2ActivatedAtStageEnd,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    bPointwise2ActivatedAtStageEnd,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor
  ) {
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;
    this.nConvStageTypeId = nConvStageTypeId;
    this.blockCountRequested = blockCountRequested;
    this.bPointwise1 = bPointwise1;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterWidth;
    this.bPointwise2ActivatedAtStageEnd = bPointwise2ActivatedAtStageEnd;
    this.nSqueezeExcitationChannelCountDivisor = nSqueezeExcitationChannelCountDivisor;
    this.nActivationId = nActivationId;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.InferencedParams_dispose();

    this.sourceHeight = undefined;
    this.sourceWidth = undefined;
    this.sourceChannelCount = undefined;
    this.nConvStageTypeId = undefined;
    this.blockCountRequested = undefined;
    this.bPointwise1 = undefined;
    this.depthwiseFilterHeight = undefined;
    this.depthwiseFilterWidth = undefined;
    this.bPointwise2ActivatedAtStageEnd = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.nActivationId = undefined;
    this.bKeepInputTensor = undefined;

    super.disposeResources();
  }

  /** Release .inferencedParams */
  InferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /** Create .inferencedParams */
  InferencedParams_create() {
    this.InferencedParams_dispose();
    this.inferencedParams = Stage.InferencedParams.Pool.get_or_create_by(
      this.sourceHeight, this.sourceWidth, this.sourceChannelCount,
      this.nConvStageTypeId,
      this.blockCountRequested,
      this.depthwiseFilterHeight, this.depthwiseFilterWidth
    );
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId( this.nConvStageTypeId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.nActivationId );
  }

  /** @override */
  toString() {
    let str =
        `sourceHeight=${this.sourceHeight}, sourceWidth=${this.sourceWidth}, `
      + `sourceChannelCount=${this.sourceChannelCount}, `

      + `nConvStageTypeId=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `

      + `blockCountRequested=${this.blockCountRequested}, `
      + `bPointwise1=${this.bPointwise1}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `

      + `bPointwise2ActivatedAtStageEnd=${this.bPointwise2ActivatedAtStageEnd}, `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `nActivationName=${this.nActivationName}(${this.nActivationId}), `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `

      + `${this.inferencedParams}`
    ;

    return str;
  }

}
