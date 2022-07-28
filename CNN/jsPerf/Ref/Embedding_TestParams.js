export { Embedding_TestParams_Base as Base };
export { Out };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TestParams from "./TestParams.js";
import * as Embedding from "../../Conv/Embedding.js";

/**
 *
 */
class Out extends Recyclable.Root {

  /**
   * Used as default Embedding_TestParams.Out provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_TestParams.Out.Pool", Out, Out.setAsConstructor );

  /**
   */
  constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    super();
    Out.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    Out.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.channelMultiplier = channelMultiplier;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.InferencedParams_dispose();

    this.bKeepInputTensor = undefined;
    this.bEmbedVocabularyId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.channelMultiplier = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    super.disposeResources();
  }

  /** Release .inferencedParams */
  InferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /**  */
  generate_inferencedParams() {
    this.InferencedParams_dispose();
    this.inferencedParams = Embedding.InferencedParams.Pool.get_or_create_by(
      this.input_height, this.input_width, this.input_channelCount,
      this.channelMultiplier, this.vocabularyCountPerInputChannel, this.bEmbedVocabularyId
    );
  }

  /** @override */
  toString() {
    let strDescription = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `channelMultiplier=${this.channelMultiplier}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `${this.inferencedParams}`
    ;
    return strDescription;
  }

}


/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 */
class Embedding_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Embedding_TestParams.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_TestParams.Base.Pool",
    Embedding_TestParams_Base, Embedding_TestParams_Base.setAsConstructor );

  /**
   */
  constructor( id ) {
    super( id );
    Embedding_TestParams_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( id ) {
    super.setAsConstructor( id );
    Embedding_TestParams_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.out = Out.Pool.get_or_create_by();
    this.out_boundsArray = FloatValue.BoundsArray.Pool.get_or_create_by(); // Every output channel's value bounds.
  }

  /** @override */
  disposeResources() {
    if ( this.out_boundsArray ) {
      this.out_boundsArray.disposeResources_and_recycleToPool();
      this.out_boundsArray = null;
    }

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    super.disposeResources();
  }

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in
   *   - this.in_weights
   *   - this.out
   *   - this.out_boundsArray
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsScattered(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = Out.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in_weights
   *   - this.out.inferencedParams
   *   - this.out_boundsArray
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {Embedding_TestParams.Out} this.out
   *   An object which will be the final result of Embedding.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result inputWeightArray.
   * The this.in.byteOffsetBegin will be ( 4 * weightElementOffsetBegin ).
   *
   * @return {Embedding_TestParams_Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin = 0 ) {
    let embeddingParams = this.out;

    this.generate_out_inferencedParams();

    let tableChannelCountPerInputChannel;
    let outChannelSubBegin;
    if ( embeddingParams.bEmbedVocabularyId ) {
      tableChannelCountPerInputChannel = ( embeddingParams.channelMultiplier - 1 );
      outChannelSubBegin = 1;
    } else {
      tableChannelCountPerInputChannel = embeddingParams.channelMultiplier;
      outChannelSubBegin = 0;
    }
  
    let tableElementCountPerInputChannel
      = embeddingParams.vocabularyCountPerInputChannel * tableChannelCountPerInputChannel;

    let tableChannelCountAll
      = embeddingParams.input_channelCount * tableChannelCountPerInputChannel;

    // Generate look-up table of every input channel.
    this.in.paramsNumberArrayObject.length = embeddingParams.input_channelCount;

    this.out_boundsArray.length = embeddingParams.output_channelCount;
    this.out_boundsArray.set_all_by_PositiveInfinity_NegativeInfinity();

    let outChannelIndex = 0;
    for ( let inChannelIndex = 0; inChannelIndex < embeddingParams.input_channelCount; ++inChannelIndex ) {

      this.fill_object_property_numberArray( this.in.paramsNumberArrayObject,
        inChannelIndex, tableElementCountPerInputChannel );

      let vocabularyElementIndex = 0;
      for ( let vocabularyId = 0; vocabularyId < embeddingParams.vocabularyCountPerInputChannel; ++vocabularyId ) {

        if ( embeddingParams.bEmbedVocabularyId ) {
          this.out_boundsArray.enlarge_one_byN( outChannelIndex, vocabularyId );
          ++outChannelIndex;
        }
    
        // Every output channel's value bounds.
        for ( let outChannelSub = outChannelSubBegin; outChannelSub < channelMultiplier; ++outChannelSub) {
          let vocabularyElement = this.in.paramsNumberArrayObject[ vocabularyElementIndex ];
          ++vocabularyElementIndex;

          this.out_boundsArray.enlarge_one_byN( outChannelIndex, vocabularyElement );
          ++outChannelIndex;
        }
      }
    }

    // Pack all parameters, look-up tables weights into a (pre-allocated and re-used) NumberArray.
    this.in_weights.set_byConcat(
      Embedding_TestParams_Base.paramsNameOrderArray_Basic, this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    return this;
  }

  /** Fill this.out.inferencedParams according to this.out */
  generate_out_inferencedParams() {
    this.out.generate_inferencedParams();
  }

  /**
   * @override
   */
  onYield_isLegal() {
    return true;
  }

  /**
   * @override
   */
  onYield_before() {

    // For testing not start at the offset 0.
    let weightElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin );
  }

  /**
   * @override
   */
  onYield_after() {
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    let valueOutMinMax = this.valueOutMinMax = {
      input_height: [ 3, 3 ],
      input_width: [ 4, 5 ],

      input_channelCount: [
        Embedding.Params.input_channelCount.valueDesc.range.min,
        4
      ],

      channelMultiplier: [
        Embedding.Params.channelMultiplier.valueDesc.range.min,
        4
      ],

      vocabularyCountPerInputChannel: [
        256, //Embedding.Params.vocabularyCountPerInputChannel.valueDesc.range.min,
        257
      ],

      bEmbedVocabularyId: [
        Embedding.Params.bEmbedVocabularyId.valueDesc.range.min,
        Embedding.Params.bEmbedVocabularyId.valueDesc.range.max
      ],

      // bKeepInputTensor: undefined,
      bKeepInputTensor: [
        Embedding.Params.bKeepInputTensor.valueDesc.range.min,
        Embedding.Params.bKeepInputTensor.valueDesc.range.max
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Embedding.Params.input_height,                   valueOutMinMax.input_height ),
      new TestParams.ParamDescConfig( Embedding.Params.input_width,                    valueOutMinMax.input_width ),
      new TestParams.ParamDescConfig( Embedding.Params.input_channelCount,             valueOutMinMax.input_channelCount ),
      new TestParams.ParamDescConfig( Embedding.Params.channelMultiplier,              valueOutMinMax.channelMultiplier ),
      new TestParams.ParamDescConfig( Embedding.Params.vocabularyCountPerInputChannel, valueOutMinMax.vocabularyCountPerInputChannel ),
      new TestParams.ParamDescConfig( Embedding.Params.bEmbedVocabularyId,             valueOutMinMax.bEmbedVocabularyId ),
      new TestParams.ParamDescConfig( Embedding.Params.bKeepInputTensor,               valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Embedding_TestParams_Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

  /**
   * Fill an object's property as a number array.
   *
   * Similar to Base.ensure_object_property_numberArray_length_filled(). But the property will be a shared number array. Its value
   * may be shared with other caller.
   *
   * This may have better performance because of number array re-using (instead of re-generating).
   *
   *
   * @param {object} io_object            The object to be checked and modified.
   * @param {string|numner} propertyName  The property io_object[ propertyName ] will be ensured as a number array.
   * @param {number} elementCount         The property io_object[ propertyName ].length will be ensured as elementCount.
   *
   */
  fill_object_property_numberArray( io_object, propertyName, elementCount ) {
    super.ensure_object_property_numberArray_length_existed( io_object, propertyName,
      elementCount,
      TestParams.Base.weightsRandomOffset.min, TestParams.Base.weightsRandomOffset.max,
      TestParams.Base.weightsDivisorForRemainder
    );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Embedding.initer().
 */
Embedding_TestParams_Base.paramsNameOrderArray_Basic = [
  Embedding.Params.input_height.paramName,
  Embedding.Params.input_width.paramName,
  Embedding.Params.input_channelCount.paramName,
  Embedding.Params.channelMultiplier.paramName,
  Embedding.Params.vocabularyCountPerInputChannel.paramName,
  Embedding.Params.bEmbedVocabularyId.paramName,
  Embedding.Params.bKeepInputTensor.paramName,
];
