export { Embedding_TestParams_Base as Base };

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
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 */
class Embedding_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Embedding_TestParams.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_TestParams.Base.Pool",
    Embedding_TestParams_Base,
    Embedding_TestParams_Base.setAsConstructor );

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
    this.out = Embedding.ParamsBase.Pool.get_or_create_by();

    // Every output channel's value bounds.
    this.out_boundsArray = FloatValue.BoundsArray.Pool.get_or_create_by();
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

    this.out = Embedding.ParamsBase.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );

    // So that all parameters are by specified (none is by evolution).
    Object.assign( this.in, this.out );

    let weightElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayObject_ParamsOut(
      weightElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in_weights
   *   - this.out.inferencedParams
   *   - this.out_boundsArray
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map
   * from a string name (e.g. parameter name) to a number array. The name
   * should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {Embedding.ParamsBase} this.out
   *   An object which will be the final result of Embedding.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the
   * result inputWeightArray. The this.in.byteOffsetBegin will be
   * ( 4 * weightElementOffsetBegin ).
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
      tableChannelCountPerInputChannel
        = ( embeddingParams.channelMultiplier - 1 );
      outChannelSubBegin = 1;
    } else {
      tableChannelCountPerInputChannel = embeddingParams.channelMultiplier;
      outChannelSubBegin = 0;
    }

    // let tableElementCountPerInputChannel
    //   = embeddingParams.vocabularyCountPerInputChannel
    //       * tableChannelCountPerInputChannel;

    let tableChannelCountAll
      = embeddingParams.input_channelCount * tableChannelCountPerInputChannel;

    // Generate look-up table of every input channel.
    this.in.paramsNumberArrayObject.length
      = embeddingParams.input_channelCount;

    this.out_boundsArray.length
      = embeddingParams.inferencedParams.output_channelCount;
    this.out_boundsArray.set_all_by_PositiveInfinity_NegativeInfinity();

    let outChannelBegin = 0;
    for ( let inChannel = 0;
      inChannel < embeddingParams.input_channelCount; ++inChannel ) {

      this.fill_object_property_numberArray( this.in.paramsNumberArrayObject,
        inChannel,
        embeddingParams.vocabularyCountPerInputChannel, // (height)
        1,                                              // (width)
        tableChannelCountPerInputChannel                // (channelCount)
      );

      let vocabularyElementArray
        = this.in.paramsNumberArrayObject[ inChannel ];

      { // Find out every output channel's value bounds.
        let vocabularyElementIndex = 0;
        for ( let vocabularyId = 0;
          vocabularyId < embeddingParams.vocabularyCountPerInputChannel;
          ++vocabularyId ) {

          let outChannel = outChannelBegin;

          if ( embeddingParams.bEmbedVocabularyId ) {
            this.out_boundsArray.enlarge_one_byN( outChannel, vocabularyId );
            ++outChannel;
          }

          for ( let outChannelSub = outChannelSubBegin;
            outChannelSub < embeddingParams.channelMultiplier;
            ++outChannelSub ) {

            let vocabularyElement
              = vocabularyElementArray[ vocabularyElementIndex ];
            ++vocabularyElementIndex;

            this.out_boundsArray.enlarge_one_byN(
              outChannel, vocabularyElement );
            ++outChannel;
          }
        }
      }

      { // Verify every output channel's value bounds.
        let bBoundsOk = true;
        let vocabularyElementIndex = 0;
        for ( let vocabularyId = 0;
          vocabularyId < embeddingParams.vocabularyCountPerInputChannel;
          ++vocabularyId ) {

          let outChannel = outChannelBegin;

          if ( embeddingParams.bEmbedVocabularyId ) {
            bBoundsOk &&= this.out_boundsArray.is_one_contain_N(
              outChannel, vocabularyId );
            if ( !bBoundsOk )
              throw Error( `Embedding_TestParams.Base`
                + `.set_byParamsNumberArrayObject_ParamsOut(): `
                + `vocabularyId=${vocabularyId} `
                + `should be in bounds `
                + `[ ${this.out_boundsArray.lowers[ outChannel ]}, `
                + `${this.out_boundsArray.uppers[ outChannel ]} ].`
              );

            ++outChannel;
          }

          for ( let outChannelSub = outChannelSubBegin;
            outChannelSub < embeddingParams.channelMultiplier;
            ++outChannelSub ) {

            let vocabularyElement
              = vocabularyElementArray[ vocabularyElementIndex ];
            ++vocabularyElementIndex;

            let tableChannel = outChannelSub - outChannelSubBegin;
            bBoundsOk &&= this.out_boundsArray.is_one_contain_N(
              outChannel, vocabularyElement );
            bBoundsOk &&= this.out_boundsArray.is_one_in_LowerUpper(
              outChannel,
              vocabularyElementArray.boundsArray_byChannel.lowers[ tableChannel ],
              vocabularyElementArray.boundsArray_byChannel.uppers[ tableChannel ] );
            if ( !bBoundsOk )
              throw Error( `Embedding_TestParams.Base`
                + `.set_byParamsNumberArrayObject_ParamsOut(): `
                + `vocabularyId=${vocabularyId}, `
                + `vocabularyElementArray=[ ${vocabularyElementArray} ], `
                + `vocabularyElementArray[ ${outChannel} ]=${vocabularyElement} `
                + `should be in bounds `
                + `[ ${this.out_boundsArray.lowers[ outChannel ]}, `
                + `${this.out_boundsArray.uppers[ outChannel ]} ] `
                + `and bounds `
                + `[ ${vocabularyElementArray.boundsArray_byChannel.lowers[ tableChannel ]}, `
                + `${vocabularyElementArray.boundsArray_byChannel.uppers[ tableChannel ]} ].`
              );

            ++outChannel;
          }
        }
      }

      outChannelBegin += embeddingParams.channelMultiplier;
    }

    // Pack all parameters, look-up tables weights into a (pre-allocated and
    // re-used) NumberArray.
    this.in_weights.set_byConcat(
      Embedding_TestParams_Base.paramsNameOrderArray_Basic,
      this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    return this;
  }

  /** Fill this.out.inferencedParams according to this.out */
  generate_out_inferencedParams() {
    this.out.inferencedParams_create();
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
    // Skip a random un-used element count.
    let weightElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 );

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
   *   Yield this object itself. The returned object (it is this object itself)
   * should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    // Restrict some parameter's large kinds. Otherwise, too many combination
    // will be generated.
    let valueOutMinMax = this.valueOutMinMax = {
      input_height: [ 1, 5 ],
      input_width: [ 1, 5 ],

      input_channelCount: [
        1, //Embedding.Params.input_channelCount.valueDesc.range.min,
        4
      ],

      channelMultiplier: [
        1, //Embedding.Params.channelMultiplier.valueDesc.range.min,
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
    // Note: The order of these element could be adjusted to change testing
    //       order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Embedding.Params.input_height,
        valueOutMinMax.input_height ),
      new TestParams.ParamDescConfig( Embedding.Params.input_width,
        valueOutMinMax.input_width ),
      new TestParams.ParamDescConfig( Embedding.Params.input_channelCount,
        valueOutMinMax.input_channelCount ),
      new TestParams.ParamDescConfig( Embedding.Params.channelMultiplier,
        valueOutMinMax.channelMultiplier ),
      new TestParams.ParamDescConfig( Embedding.Params.vocabularyCountPerInputChannel,
        valueOutMinMax.vocabularyCountPerInputChannel ),
      new TestParams.ParamDescConfig( Embedding.Params.bEmbedVocabularyId,
        valueOutMinMax.bEmbedVocabularyId ),
      new TestParams.ParamDescConfig( Embedding.Params.bKeepInputTensor,
        valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Embedding_TestParams_Base.ParamsGenerator.call( this,
      paramDescConfigArray );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the
 * parameter extracting order of Embedding.initer().
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
