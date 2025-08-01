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
    Embedding_TestParams_Base );

  /**
   */
  constructor( id ) {
    super( id );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( id ) {
    super.setAsConstructor( id );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
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
    bKeepInputTensor,
    bTableLog
  ) {

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = Embedding.ParamsBase.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor,
      bTableLog
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
    const funcNameInMessage = "set_byParamsNumberArrayObject_ParamsOut";

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

            let vocabularyElementValue
              = vocabularyElementArray[ vocabularyElementIndex ];
            ++vocabularyElementIndex;

            // Note: fround() for all source (i.e. input, filter and bias).
            // (2025/07/05)
            vocabularyElementValue = Math.fround( vocabularyElementValue );

            this.out_boundsArray.enlarge_one_byN(
              outChannel, vocabularyElementValue );
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
              throw Error( `Embedding_TestParams.Base.${funcNameInMessage}(): `
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

            let vocabularyElementValue
              = vocabularyElementArray[ vocabularyElementIndex ];
            ++vocabularyElementIndex;

            // Note: fround() for all source (i.e. input, filter and bias).
            // (2025/07/05)
            vocabularyElementValue = Math.fround( vocabularyElementValue );

            let tableChannel = outChannelSub - outChannelSubBegin;

            bBoundsOk &&= this.out_boundsArray.is_one_contain_N(
              outChannel, vocabularyElementValue );

            if ( !bBoundsOk )
              throw Error( `Embedding_TestParams.Base.${funcNameInMessage}(): `
                + `vocabularyId=${vocabularyId}, `
                + `outChannel=${outChannel}, `
                + `vocabularyElementArray=[ ${vocabularyElementArray} ], `
                + `vocabularyElementArray[ ${vocabularyElementIndex} ]=`
                  + `${vocabularyElementArray[ vocabularyElementIndex ]}, `
                + `vocabularyElementValue=${vocabularyElementValue}, `
                + `should be in bounds `
                + `[ ${this.out_boundsArray.lowers[ outChannel ]}, `
                + `${this.out_boundsArray.uppers[ outChannel ]} ].`
              );

            // Note: This may not be true because this.out_boundsArray is
            //       computed from the extracted vocabularyElementValue which
            //       has been fround().
            //
            // (2025/07/29 Remarked)
            // bBoundsOk &&= this.out_boundsArray.is_one_in_LowerUpper(
            //   outChannel,
            //   vocabularyElementArray.boundsArray_byChannel.lowers[ tableChannel ],
            //   vocabularyElementArray.boundsArray_byChannel.uppers[ tableChannel ] );
            //
            // if ( !bBoundsOk )
            //   throw Error( `Embedding_TestParams.Base.${funcNameInMessage}(): `
            //     + `vocabularyId=${vocabularyId}, `
            //     + `outChannel=${outChannel}, `
            //     + `vocabularyElementArray=[ ${vocabularyElementArray} ], `
            //     + `vocabularyElementArray[ ${vocabularyElementIndex} ]=`
            //       + `${vocabularyElementArray[ vocabularyElementIndex ]}, `
            //     + `vocabularyElementValue=${vocabularyElementValue}, `
            //
            //     + `.out_boundsArray.lowers=[ ${this.out_boundsArray.lowers} ], `
            //     + `.out_boundsArray.uppers=[ ${this.out_boundsArray.uppers} ], `
            //   
            //     + `.out_boundsArray.lowers[ ${outChannel} ]=`
            //       + `${this.out_boundsArray.lowers[ outChannel ]}, `
            //     + `.out_boundsArray.uppers[ ${outChannel} ]=`
            //       + `${this.out_boundsArray.uppers[ outChannel ]}, `
            //
            //     + `should be in bounds `
            //     + `[ ${vocabularyElementArray.boundsArray_byChannel.lowers[ tableChannel ]}, `
            //     + `${vocabularyElementArray.boundsArray_byChannel.uppers[ tableChannel ]} ].`
            //   );

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
   * @return {TestParams.ParamDescConfigAll}
   *   Create and return the configuration for generating testing paramters
   * combinations. It can be used to call .ParamsGenerator().
   */
  ParamDescConfigAll_create() {

    // Restrict some parameter's large kinds. Otherwise, too many combination
    // will be generated.
    let valueOutMinMax = this.valueOutMinMax = {

      input_height: [
        1,
        // 3,
        // 3
        5
      ],

      input_width: [
        1,
        // 3,
        // 3
        5
      ],

      input_channelCount: [
        1, //Embedding.Params.input_channelCount.valueDesc.range.min,
        // 2
        4
      ],

      channelMultiplier: [
        1, //Embedding.Params.channelMultiplier.valueDesc.range.min,
        // 2
        4
      ],

      vocabularyCountPerInputChannel: [
        256, //Embedding.Params.vocabularyCountPerInputChannel.valueDesc.range.min,
        // (2025/06/04 Temp Remarked) For debug.
        257
        // 256
      ],

      bEmbedVocabularyId: [
        Embedding.Params.bEmbedVocabularyId.valueDesc.range.min,
        Embedding.Params.bEmbedVocabularyId.valueDesc.range.max
      ],

      bKeepInputTensor: [
        Embedding.Params.bKeepInputTensor.valueDesc.range.min,
        // Embedding.Params.bKeepInputTensor.valueDesc.range.max
        // Embedding.Params.bKeepInputTensor.valueDesc.range.min
        Embedding.Params.bKeepInputTensor.valueDesc.range.max
      ],

      bTableLog: [
        // (2025/06/03 Temp Remarked) For debug.
        0, 0
        // 1, 1
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these elements could be adjusted to change testing
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
      new TestParams.ParamDescConfig( Embedding.Params.bTableLog,
        valueOutMinMax.bTableLog ),
    ];

    const theParamDescConfigAll
      = new TestParams.ParamDescConfigAll( paramDescConfigArray );

    return theParamDescConfigAll;
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
  Embedding.Params.bTableLog.paramName,
];
