export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as Operation from "./Operation.js";
//import * as ReturnOrClone from "./ReturnOrClone.js";

/**
 * Embedding (2d) layer parameters.
 */
class Params extends Weights.Params {

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} channelMultiplier
   *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
   * embedding channels. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   */
  constructor( inputFloat32Array, byteOffsetBegin, channelMultiplier ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
      [ Params.channelMultiplier, channelMultiplier ],
    ] );

    super( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  get channelMultiplier() { return this.parameterMapModified.get( Params.channelMultiplier ); }
}


/** Define channelMultiplier value range.
 *
 * At least 1, because channel count 0 is meaningless.
 * Avoid too large vocabulary channel multiplier. Otherwise, performance may be poor.
 */
Params.channelMultiplier = new ParamDesc.Int( "channelMultiplier", 1, 32 );


/**
 * Embedding could achieve non-linear mapping (just like any perceptron). But it is achieved by lookup table (instead
 * of weighted sum, bias and activation function). This implies:
 *   - It may use more (CPU or GPU) memory, but may use less (CPU or GPU) computation.
 *   - It can only achieve channel expansion, and can not achieve channel aggregation. (because no weighted sum)
 *   - It can only represent context-independent (not context-dependent) information. (because no weighted sum)
 *   - It can only handle integer input (i.e. int32, not float32).
 *
 * It is useful as the first layer of text or image processing because their inputs are all integer (e.g. character codes,
 * word indices, color codes, etc). And, the first layer only needs carry context-independent information (and all the other
 * layers after it will produce context-dependent information).
 *
 * This object always accepts tensor3d (dtype = int32).
 *   - The axis 0 is height. (Image height) (Text lines and usually only 1 line.)
 *   - The axis 1 is width. (Image width) (Text length (e.g. character count).)
 *   - The axis 2 is channel. (Image color channel) (Text character code channel and usually only 1 channel.)
 *
 * An embedding layer contains one params (this.params) and inChannels embedding vocabulary tables.
 *   - Every input channel has one embedding vocabulary table.
 *   - Every embedding vocabulary table has vocabularyCountPerInputChannel vocabularies.
 *   - Every vocabulary has channelMultiplier embedding channels.
 *
 *
 *
 * @member {number} vocabularyCountPerInputChannel
 *   Every input channel will have how many vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A four channels), there will be 256
 * vocabularies per input channel because every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 *
 * @member {boolean} bEmbedVocabularyId
 *   If true, one of embedding channels will be an auto-generated vocabulary id (i.e. 0, 1, 2, ...). So only
 * ( channelMultiplier - 1 ) embedding channels will be extracted from inputFloat32Array. The extra vocabulary id
 * channel achieves residual connection. Residual connection means apply_and_destroy_or_keep() will append (concatenate)
 * input to output. Since apply_and_destroy_or_keep()'s input is just vocabulary id (one channel or multiple channels),
 * pre-embedded vocabulary id inside the embedding table acheives the same effect by less computation (but more memory).
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} inChannels
 *   Input channel count.
 *
 * @member {number} channelMultiplier
 *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. It could be viewed as embeddingChannelCountPerInputChannel.
 *
 * @member {number} outChannels
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} destroy_or_keep_input
 *   This is a function pointer to one of destroy_input(), keep_input(). If ( this.bKeepInputTensor == false ),
 * it pointer to destroy_input(). If ( this.bKeepInputTensor == true ), it pointer to keep_input().
 *
 * @member {function} apply_and_destroy_or_keep
 *   Process the input and produce output by looking up the weights of this embedding layer. This is a function pointer
 * to one of keep_input_return_copy(), return_input_directly(), apply_and_destroy_or_keep_SplitGatherConcat().
 * It inputs a tensor3d data (e.g. height-width-color for color image, or 1-width-1 for text) with this.inChannels
 * (e.g. 4 for r-g-b-a, or 1 for text) channels. The inputTensor3d.dtype must be int32 (i.e. can not be float32)
 * so that they can be used as tf.gather()'s indices. If ( this.bKeepInputTensor == false ), the inputTensor3d
 * will be disposed. If ( this.bKeepInputTensor == true ), the inputTensor3d will be kept.
 */
class Base extends Operation.Base() {

  constructor(
//!!! ...unfinished... (2022/05/21)
    inputTensorPlaceholder0,
    inputScaleBoundsArray0 ) {

    super( inputTensorPlaceholder0, null, 1 );

//!!! ...unfinished... (2022/05/21)
    Base.adjust_pfn.call( this );
    Base.setup_BoundsArraySet.call( this, inputScaleBoundsArray0, inputScaleBoundsArray1 );
  }

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {number} inChannels
   *   The input channel count.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks.
   *
   * @param {boolean} bSplitReshapeGatherConcat
   *   If true, the vocabulary table will be built as multiple tf.tensor2d and using split-reshape-gather-concat operation (usually slower).
   * Otherwise, the vocabulary table will be built as one merged longer tf.tensor2d and using add-gather-reshape (usually faster).
   *
   * @param {Params} params
   *   A Params object. The params.extract() will be called to extract parameters.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer(
    progressParent,
    inChannels, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor,
    bSplitReshapeGatherConcat,
    params
  ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1             // for extracting parameters from inputFloat32Array.
      + inChannels  // for extracting vocabulary table of every input channel from inputFloat32Array.
      + inChannels  // for building vocabulary table tensor3d of every input channel.
      + 1           // for building one merged vocabulary table tensor3d for all input channels.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

//!!! ...unfinished...
// squeeze-and-excitation ?

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    this.inChannels = inChannels;

    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
    this.bKeepInputTensor = bKeepInputTensor;
    this.bSplitReshapeGatherConcat = bSplitReshapeGatherConcat;

    if ( bKeepInputTensor )
      this.destroy_or_keep_input = Base.keep_input;
    else
      this.destroy_or_keep_input = Base.destroy_input;

    // 1. Extract parameters.
    if ( !params )
      return false;

    this.byteOffsetEnd = this.byteOffsetBegin = params.defaultByteOffsetBegin;

    if ( !params.extract() )
      return false;

    this.byteOffsetEnd = params.defaultByteOffsetEnd;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. Vocabulary Table Shape
    let vocabularyTableShape_toExtract = null; // Assume no embedding channel.

    let channelMultiplier = this.channelMultiplier = params.channelMultiplier; // The real (adjusted) channelMultiplier. May be specified or extracted.
    this.outChannels = inChannels * channelMultiplier; // The output channel count always depends on channelMultiplier.

    // 2.1 Shortcut operation.
    if ( // If channelMultiplier is illegal (i.e. zero or negative). (may happen by evolution.)
           ( channelMultiplier < 1 )

        // Or, if there is only one output channel per input channel and the only one output channel is just vocabulary id.
        || ( ( channelMultiplier == 1 ) && ( bEmbedVocabularyId ) )
       ) {

      if ( bKeepInputTensor )
        // 2.1.1 For ( channelMultiplier <= 1 ) and ( bKeepInputTensor == true  ), return a copy of input (as output) immediately.        
        this.apply_and_destroy_or_keep = Base.keep_input_return_copy;
      else
        // 2.1.2 For ( channelMultiplier <= 1 ) and ( bKeepInputTensor == false ), return input (as output) immediately.
        this.apply_and_destroy_or_keep = Base.return_input_directly;

    } else { // 2.2 channelMultiplier is positive.

      if ( bSplitReshapeGatherConcat ) {
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_SplitReshapeGatherConcat; // When vocabulary tables are tensor2d.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, channelMultiplier ];
      } else {
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_AddGatherReshape; // When vocabulary table is one merged tensor2d.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, channelMultiplier ];
//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//        this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_SplitGatherConcatReshape; // When vocabulary tables are tensor3d.
//        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, 1, channelMultiplier ];
      }

      if ( bEmbedVocabularyId ) {
        // 2.2.1 If there will be an auto-generated vocabulary id embedding channel, extract one less channels from data.
        // (i.e. the use ( channelMultiplier - 1 ) instead of ( channelMultiplier ).
        vocabularyTableShape_toExtract[ vocabularyTableShape_toExtract.length - 1 ] -= 1;
      } else {
        // 2.2.2 Otherwise, all embedding channels are extracted from data.
      }
    }

    // 3. Extract data of vocabulary tables from inputFloat32Array.
    //
    // If ( channelMultiplier < 1 ) (i.e. ( null == vocabularyTableShape_toExtract ) ), this vocabularyTables[] may not need to be created.
    let vocabularyTables = new Array( inChannels );
    {
      let nextByteOffsetBegin = params.defaultByteOffsetEnd;
      for ( let i = 0; i < inChannels; ++i ) {
        vocabularyTables[ i ] = new Weights.Base( params.defaultInput, nextByteOffsetBegin, vocabularyTableShape_toExtract );
        if ( !vocabularyTables[ i ].extract() )
          return false;  // e.g. input array does not have enough data.
        nextByteOffsetBegin = vocabularyTables[ i ].defaultByteOffsetEnd;

        ++progressToAdvance.value;
        yield progressRoot;  // One vocabulary table extracted. Report progress.
      }

      this.byteOffsetEnd = nextByteOffsetBegin;
      this.tensorWeightCountExtracted += ( this.byteOffsetEnd - params.defaultByteOffsetEnd );
    }

    // 4. Build tensor3d[] (or tensor2d[]) of vocabulary tables.

    // 4.1 If ( channelMultiplier >= 1 ), build tensor3d[] of vocabulary tables.
    if ( vocabularyTableShape_toExtract ) {

      // For tensor2d, the last axis id will be 1.
      // For tensor3d, the last axis id will be 2.
      let concatAxisId = ( vocabularyTableShape_toExtract.length - 1 );

      // Build tf.tensor of vocabulary tables.
      try {
        this.vocabularyTablesTensorArray = new Array( vocabularyTables.length ); // could be tensor3d or tensor2d.

        // 4.1.1

        // Need to prefix vocabulary id channel.
        if ( bEmbedVocabularyId ) {

          // The shape of vocabulary id list (tensor3d or tensor2d) looks almost like the shape of vocabulary table.
          // Except the last dimension is always one.
          let idsTensorShape = vocabularyTableShape_toExtract.slice(); // copy it.
          idsTensorShape[ idsTensorShape.length - 1 ] = 1;

          // Create vocabulary id list. (for concatenating with vocabulary table)
          let numberSequencer = new Array( vocabularyCountPerInputChannel ).keys(); // Generator: 0, 1, 2, ..., ( vocabularyCountPerInputChannel - 1 )
          const idsTensor = tf.tensor( [ ...numberSequencer ], idsTensorShape ); // could be tensor3d or tensor2d.

          try {
            for ( let i = 0; i < vocabularyTables.length; ++i ) {

              // Create an embedding vocabulary table (without vocabulary id).
              const vocabularyTableTensorWithoutIds = tf.tensor( vocabularyTables[ i ].weights, vocabularyTableShape_toExtract ); // 2d or 3d

              try { // Concatenate vocabulary id prefix vocabulary table (as residual connection).
                this.vocabularyTablesTensorArray[ i ] = idsTensor.concat( vocabularyTableTensorWithoutIds, concatAxisId );

              } finally {
                vocabularyTableTensorWithoutIds.dispose();
              }

              ++progressToAdvance.value;
              yield progressRoot;  // One vocabulary table tensor3d built. Report progress.
            }

          } finally {
            idsTensor.dispose();
          }

        } else { // No need to prefix vocabulary id channel.

          for ( let i = 0; i < vocabularyTables.length; ++i ) {
            // Create an embedding vocabulary table (without vocabulary id).
            this.vocabularyTablesTensorArray[ i ] = tf.tensor( vocabularyTables[ i ].weights, vocabularyTableShape_toExtract ); // 2d or 3d

            ++progressToAdvance.value;
            yield progressRoot;  // One vocabulary table tensor2d built. Report progress.
          }
        }

        // 4.1.2 Build one merged longer vocabulary table tensor2d for all input channels.
        {
          if ( !bSplitReshapeGatherConcat ) {
            this.vocabularyTableTensor2d = tf.concat( this.vocabularyTablesTensorArray, 0 );

            tf.dispose( this.vocabularyTablesTensorArray );
            this.vocabularyTablesTensorArray = null;

            // Build a tensor3d for shifting every value of every input channels of inputTensor3d. So that they can be used for
            // indexing the one merged longer vocabulary table tensor2d.
            //
            // Channel                  0: ( channelValue + (                  0 * vocabularyCountPerInputChannel ) )
            // Channel                  1: ( channelValue + (                  1 * vocabularyCountPerInputChannel ) )
            // Channel                  2: ( channelValue + (                  2 * vocabularyCountPerInputChannel ) )
            //   :
            // Channel ( inChannels - 1 ): ( channelValue + ( ( inChannels - 1 ) * vocabularyCountPerInputChannel ) )
            let numberSequencer = new Array( inChannels ).keys(); // Generator: 0, 1, 2, ..., ( inChannels - 1 )
            let channelValueOffset = [ ...numberSequencer ].map( x => x * vocabularyCountPerInputChannel );
            this.channelValueOffsetTensor3d = tf.tensor3d( channelValueOffset, [ 1, 1, inChannels ], "int32" ); // One pixel.
          }

          ++progressToAdvance.value;
          yield progressRoot;  // One merged vocabulary table tensor2s built. Report progress.
        }

      } catch ( e ) {
        return false; // e.g. out of (GPU) memory.
      }

    // 4.2 When ( channelMultiplier < 1 ), there is no need to build this.vocabularyTablesTensor2dArray[].
    } else {
      progressToAdvance.value += inChannels; // Report progress as all vocabulary table tensors built.
      progressToAdvance.value += 1;          // Report progress as one merged vocabulary table tensor built.
      yield progressRoot;
    }

    // 5. Prepare other auxiliary data members.

    // The followings are intermediate temporary arrays. Pre-allocate these array shells (instead of re-allocating every
    // time apply_and_destroy_or_keep()) for improving performance.
    {
      if ( bSplitReshapeGatherConcat ) {
        // For a 4 color (r-g-b-a) channel image, splitCount will be 4.
        //
        // For example, suppose input is a color image (i.e. height-width-color tensor3d). The last
        // axis is a 4 color (r-g-b-a) channel. Splitting along the last axis (the color channel)
        // results in an array [ r, g, b, a ] which has 4 tensor3d (in fact, they should be
        // viewed as tensor1d).
        //
        // This is pre-calculated for improving performance of apply_and_destroy_or_keep().
        this.splitCount = inChannels;

        // For collecting the rank reduced tensor2d (from the splitted inputTensor3d). They will be used to look up vocabulary table.
        this.vocabularyIndicesOneChannelTensor2dArray = new Array( this.splitCount );

        // The first 2 dimension of apply_and_destroy_or_keep()'s inputTensor3d. When the input is splitted and reduce to tensor2d,
        // their shape should be this. It is used for reshape from tensor3d to tensor2d.
        //
        // (Used when vocabulary tables are tensor2d.)
        this.inputTensor2dShape = new Array( 2 );

        // For collecting the results of every looking (vocabulary table) up. They will be concatenated into one tensor3d as
        // apply_and_destroy_or_keep()'s result.
        this.embeddedTensor3dArray = new Array( this.splitCount );

      } else {

        // The 3 dimension of apply_and_destroy_or_keep()'s outputTensor3d. When the input is splitted to tensor3d and the
        // vocabulary tables are tensor3d, the result of tf.gather() will be tensor5d. This shape is used for reshape the
        // output from tensor5d to tensor3d.
        //
        // (Used when vocabulary tables are tensor3d.)
        this.outputTensor3dShape = [ 0, 0, this.outChannels ];

//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//         // For collecting the results of every looking (vocabulary table) up. They will be concatenated into one tensor3d as
//         // apply_and_destroy_or_keep()'s result.
//         this.embeddedTensor3dArray = new Array( this.splitCount );
      }
    }

    this.bValid = true;

    return true; // Initialized successfully.
  }

  /**
   * Initialize this object by calling initer() and advance the generator by loop until done.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   If null, a temporary progress object will be created.
   *
   * @return {boolean}
   *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
   *   Return false if failed (and progressParent.valuePercentage will be less than 100).
   */
  init(
    progressParent,
    inChannels, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor,
    bSplitReshapeGatherConcat,
    params
  ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer(
      progressParent,
      inChannels, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor,
      bSplitReshapeGatherConcat,
      params
    );

    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.vocabularyTablesTensorArray ) {
      tf.dispose( this.vocabularyTablesTensorArray );
      this.vocabularyTablesTensorArray = null;
    }

    if ( this.vocabularyTableTensor2d ) {
      this.vocabularyTableTensor2d.dispose();
      this.vocabularyTableTensor2d = null;
    }

    if ( this.channelValueOffsetTensor3d ) {
      this.channelValueOffsetTensor3d.dispose();
      this.channelValueOffsetTensor3d = null;
    }

    if ( this.embeddedTensor3dArray ) {
      this.embeddedTensor3dArray = null;
    }

    this.tensorWeightCountExtracted = -1;
    this.bValid = false;
  }

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {
    return this.bValid;

//!!! (2021/04/10 Remarked) Do not keep params. Otherwise, the inputFloat32Array will not be released.
//!!! Using this.bValid instead.
//     // If vocabulary table tensor does not exist (so that apply_and_destroy_or_keep() will just return output as input).
//     //
//     // (e.g. channelMultiplier is zero or negative, or ( ( channelMultiplier == 1 ) && ( bEmbedVocabularyId ) ) )
//     if ( null == this.vocabularyTableShape_toExtract ) {
//
//       // The vocabulary tables (from initer()'s inputFloat32Array) should always exist.
//       if ( this.vocabularyTables )
//         if ( this.vocabularyTables[ this.inChannels - 1 ] )
//           if ( this.vocabularyTables[ this.inChannels - 1 ].isValid() )  // the last vocabulary table should be valid.
//             return true;
//
//     // If vocabulary table tensor exists. (e.g. channelMultiplier is positive and ( bEmbedVocabularyId == false )).
//     } else {
//
//       // The tensor2d (or tensor3d) of vocabulary tables should exists.
//       if ( this.vocabularyTablesTensorArray )
//         if ( this.vocabularyTablesTensorArray[ this.inChannels - 1 ] )  // the last vocabulary table should be valid.
//             return true;
//
//       // Or, the one merged longer tensor2d of vocabulary table (and channel value offset tensor3d) should exists.
//       if ( ( this.vocabularyTableTensor2d ) && ( this.channelValueOffsetTensor3d ) )
//         return true;
//     }

//     return false;
  }

  get tensorWeightCountTotal() {
    let weightCount = 0;

    if ( this.vocabularyTablesTensorArray ) {
      for ( let i = 0; i < this.vocabularyTablesTensorArray.length; ++i ) {
        let vocabularyTablesTensor = this.vocabularyTablesTensorArray[ i ];
        if ( vocabularyTablesTensor ) {
          weightCount += tf.util.sizeFromShape( vocabularyTablesTensor.shape );
        }
      }
    }

    if ( this.vocabularyTableTensor2d ) {
      weightCount += tf.util.sizeFromShape( this.vocabularyTableTensor2d.shape );
    }

    if ( this.channelValueOffsetTensor3d ) {
      weightCount += tf.util.sizeFromShape( this.channelValueOffsetTensor3d.shape );
    }

    return weightCount;
  }

  /** Do nothing. */
  static keep_input( inputTensor3d ) {
  }

  /**
   * @param {tf.tensor3d} inputTensor3d
   *   A tensor3d data. It will be disposed.
   */
  static destroy_input( inputTensor3d ) {
    inputTensor3d.dispose();
  }


//!!! ...unfinished... (2022/07/15)
// If ( input_channelCount == 1 ), it needs not split, add, concat. (gather is just enough.)
//

  /**
   * (Used when vocabulary tables are one merged tensor2d. This is faster than SplitReshapeGatherConcat.)
   *
   * Process the input and produce output by looking up the weights of this embedding layer.
   *
   * It should not be called directly. It should be called through this.apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor3d
   *   A tensor3d data (e.g. height-width-color for color image, or 1-width-1 for text) with this.inChannels
   * (e.g. 4 for r-g-b-a, or 1 for text) channels. The inputTensor3d.dtype must be int32 (i.e. can not be float32)
   * so that they can be used as tf.gather()'s indices. If ( this.bKeepInputTensor == false ), this inputTensor3d
   * will be disposed. If ( this.bKeepInputTensor == true ), this inputTensor3d will be kept.
   *
   * @return {tf.tensor3d} The predicted output as tensor3d. Throw exception, if failed (e.g. out of GPU memory).
   */
  static apply_and_destroy_or_keep_AddGatherReshape( inputTensor3d ) {

    // Shifting vocabulary indices of input. (Broadcasting is used.)
    const vocabularyIndicesTensor3d = inputTensor3d.add( this.channelValueOffsetTensor3d );

    this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).

    let outputTensor3dShape = this.outputTensor3dShape; // Use pre-calculated array for improving performance.
    outputTensor3dShape[ 0 ] = inputTensor3d.shape[ 0 ];
    outputTensor3dShape[ 1 ] = inputTensor3d.shape[ 1 ];

    // Gather along the first axis.
    //
    // tensor2d.gather( tensor3d ) results to tensor4d.
    const gatherTensor4d = this.vocabularyTableTensor2d.gather( vocabularyIndicesTensor3d, 0 );
    vocabularyIndicesTensor3d.dispose();

    // Reshape tensor4d to tensor3d.
    const predictTensor3d = gatherTensor4d.reshape( outputTensor3dShape );
    gatherTensor4d.dispose();

    return predictTensor3d;

//!!! ...unfinished... squeeze-and-excitation.
  }

  /**
   * (Used when vocabulary tables are tensor3d.)
   *
   * This is slower than AddGatherReshape. It may due to the splitting and concatenating operation.
   */
  static apply_and_destroy_or_keep_SplitReshapeGatherConcat( inputTensor3d ) {

//!!! ...unfinished... could use gahter, gather, concat instead of split, gather, concat?
//!!! ...unfinished... could use unstack, gather, stack instead of split, gather, concat?
//!!! ...unfinished... could use oneHot, pointwise convolution instead of split, gather, concat?

    // Using pre-allocated array as local variable to improving performance.
    let vocabularyIndicesOneChannelTensor2dArray = this.vocabularyIndicesOneChannelTensor2dArray;

    // Extract vocabulary indices from input.
    {
      // The input is tensor3d, the last axis id (for splitting) is 2 (= 3 - 1).
      //
      // Split along the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
      // In fact, the result is still tensor3d but has only one channel.
      //
      // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ inputTensor3d.shape.length - 1 ] ).
      const oneChannelTensor3dArray = inputTensor3d.split( this.splitCount, 2 );

      this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).

      let inputTensor2dShape = this.inputTensor2dShape; // Use pre-calculated array for improving performance.
      inputTensor2dShape[ 0 ] = inputTensor3d.shape[ 0 ];
      inputTensor2dShape[ 1 ] = inputTensor3d.shape[ 1 ];

      // The splitted of input is still tensor3d but has only one channel. Reshape it to tensor2d so that the
      // resule of tf.gather() will be tensor3d.
      for ( let i = 0; i < oneChannelTensor3dArray.length; ++i ) {
        vocabularyIndicesOneChannelTensor2dArray[ i ] = oneChannelTensor3dArray[ i ].reshape( inputTensor2dShape );
        oneChannelTensor3dArray[ i ].dispose();
      }
    }

    let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.

    // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
    // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
    for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor2dArray.length; ++channelIndex ) {
      let oneChannelTensor2d = vocabularyIndicesOneChannelTensor2dArray[ channelIndex ];

      // tensor2d.gather( tensor2d ) results to tensor3d.
      embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensorArray[ channelIndex ].gather( oneChannelTensor2d );

      oneChannelTensor2d.dispose(); // Release intermediate temporary tensor as soon as possible for reducing memory footprint.
      vocabularyIndicesOneChannelTensor2dArray[ channelIndex ] = null; // So that it is cleared when next time re-used.
    }

    // Concatenate along the last axis, so that it becomes tensor3d and with embedded (more) channels in the last axis.
    //
    // The result of tensor2d.gather( tensor2d ) are tensor3d, so their last axis is 2 (= 3 - 1).
    let predictResult = tf.concat( embeddedTensor3dArray, 2 );

    for ( let i = 0; i < embeddedTensor3dArray.length; ++i ) { // Release intermediate temporary tensors.
      embeddedTensor3dArray[ i ].dispose();
      embeddedTensor3dArray[ i ] = null; // So that it is cleared when next time re-used.
    }

    return predictResult;

//!!! ...unfinished... squeeze-and-excitation.
  }

//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//   /**
//    * (Used when vocabulary tables are tensor3d.)
//    *
//    * This is slower than SplitReshapeGatherConcat.
//    */
//   static apply_and_destroy_or_keep_SplitGatherConcatReshape( inputTensor3d ) {
//
//     // Extract vocabulary indices from input.
//     //
//     // The input is tensor3d, the last axis id (for splitting) is 2 (= 3 - 1).
//     //
//     // Split along the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
//     // In fact, the result is still tensor3d but has only one channel.
//     //
//     // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ inputTensor3d.shape.length - 1 ] ).
//     const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.split( this.splitCount, 2 );
//
//     this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).
//
//     let outputTensor3dShape = this.outputTensor3dShape; // Use pre-calculated array for improving performance.
//     outputTensor3dShape[ 0 ] = inputTensor3d.shape[ 0 ];
//     outputTensor3dShape[ 1 ] = inputTensor3d.shape[ 1 ];
//
//     let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.
//
//     // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
//     // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
//     for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor3dArray.length; ++channelIndex ) {
//       let oneChannelTensor3d = vocabularyIndicesOneChannelTensor3dArray[ channelIndex ];
//
//       // tensor3d.gather( tensor3d ) results to tensor5d.
//       embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensorArray[ channelIndex ].gather( oneChannelTensor3d );
//
//       oneChannelTensor3d.dispose(); // Release intermediate temporary tensor as soon as possible for reducing memory footprint.
//     }
//
//     // Concatenate along the last axis, so that it becomes tensor3d and with embedded (more) channels in the last axis.
//     //
//     // The result of tensor3d.gather( tensor3d ) are tensor5d, so their last axis is 4 (= 5 - 1).
//     let concatResult = tf.concat( embeddedTensor3dArray, 4 );
//
//     for ( let i = 0; i < embeddedTensor3dArray.length; ++i ) { // Release intermediate temporary tensors.
//       embeddedTensor3dArray[ i ].dispose();
//       embeddedTensor3dArray[ i ] = null; // So that it is cleared when next time re-used.
//     }
//
//     // Reshape tensor5d to tensor3d.
//     let predictResult = concatResult.reshape( outputTensor3dShape );
//     concatResult.dispose();
//
//     return predictResult;
//
// //!!! ...unfinished... squeeze-and-excitation.
//   }

}
