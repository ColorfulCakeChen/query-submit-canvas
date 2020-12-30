export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as Weights from "../Weights.js";

/**
 * Embedding (2d) layer parameters.
 *
 * @member {number} outChannels
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 */
class Params extends Weights.Params {

  /**
   * @param {number} channelMultiplier
   *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
   * embedding channels. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier = null ) {

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    let parameterMap = new Map( [
      [ Weights.Params.Keys.inChannels,        inChannels ],
      [ Weights.Params.Keys.channelMultiplier, channelMultiplier ],

      // For an embedding layer, its output channel count always depends on channelMultiplier.
      [ Weights.Params.Keys.outChannels,       Infinity ],
    ] );

    return super.init( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

}


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
 * @member {number} channelMultiplier
 *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. It could be viewed as embeddingChannelCountPerInputChannel.
 *
 * @member {number} outChannels
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
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
class Base {

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} inChannels
   *   The input channel count.
   *
   * @param {number} channelMultiplier
   *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
   * embedding channels. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks.
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
    inputFloat32Array, byteOffsetBegin,
    inChannels, channelMultiplier = null, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1             // for extracting parameters from inputFloat32Array.
      + inChannels  // for extracting vocabulary table of every input channel from inputFloat32Array.
      + inChannels; // for building vocabulary table tensor3d of every input channel.

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

//!!! ...unfinished...
// inverted residual connection (by add or by concatenate) ? (dense net)
// squeeze-and-excitation ?
// Shuffled Grouped Pointwise Convolution ... ? (by tf.gather() ?)

    this.disposeTensors();
    this.params = this.vocabularyTables = null; // So that distinguishable if re-initialization failed.

    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
    this.bKeepInputTensor = bKeepInputTensor;

    if ( bKeepInputTensor )
      this.destroy_or_keep_input = Base.keep_input;
    else
      this.destroy_or_keep_input = Base.destroy_input;

    // 1. Extract parameters.
    this.params = new Params();
    if ( !this.params.init( inputFloat32Array, byteOffsetBegin, inChannels, channelMultiplier ) )
      return false;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. Vocabulary Table Shape
    let vocabularyTableShape_toExtract = null; // Assume no embedding channel.

    channelMultiplier = this.channelMultiplier; // The real (adjusted) channelMultiplier. May be specified or extracted.
    if ( channelMultiplier < 1 ) { // 2.1 channelMultiplier is zero or negative. (could happen by evolution.)

      if ( bKeepInputTensor )
        // 2.1.1 For ( channelMultiplier < 1 ) and ( bKeepInputTensor == true  ), return a copy of input (as output) immediately.        
        this.apply_and_destroy_or_keep = Base.keep_input_return_copy;
      else
        // 2.1.2 For ( channelMultiplier < 1 ) and ( bKeepInputTensor == false ), return input (as output) immediately.
        this.apply_and_destroy_or_keep = Base.return_input_directly;

    } else { // 2.2 channelMultiplier is positive.

      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_SplitGatherConcat;

      if ( bEmbedVocabularyId ) {
        // 2.2.1 If there will be an auto-generated vocabulary id embedding channel, extract one less channels from data.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, channelMultiplier - 1 ];
      } else {
        // 2.2.2 Otherwise, all embedding channels are extracted from data.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, channelMultiplier ];
      }
    }

    // 3. Extract data of vocabulary tables from inputFloat32Array.
    //
    // Even if ( channelMultiplier < 1 ) (i.e. ( null == vocabularyTableShape_toExtract ) ), this.vocabularyTables[]
    // should still be created so that this.byteOffsetEnd() could work correctly.
    this.vocabularyTables = new Array( inChannels );
    {
      let nextByteOffsetBegin = this.params.defaultByteOffsetEnd;
      for ( let i = 0; i < inChannels; ++i ) {
        this.vocabularyTables[ i ] = new Weights.Base();
        if ( !this.vocabularyTables[ i ].init( inputFloat32Array, nextByteOffsetBegin, null, 0, vocabularyTableShape_toExtract ) )
          return false;  // e.g. input array do not have enough data.
        nextByteOffsetBegin = this.vocabularyTables[ i ].defaultByteOffsetEnd;

        ++progressToAdvance.value;
        yield progressRoot;  // One vocabulary table extracted. Report progress.
      }
    }

    // 4. Build tensor3d[] of vocabulary tables.

    // 4.1 If ( channelMultiplier >= 1 ), build tensor3d[] of vocabulary tables.
    if ( vocabularyTableShape_toExtract ) {

      // For tensor3d, the last axis id will be 2.
      //
      // This is pre-calculated for improving performance of apply_and_destroy_or_keep().
      let lastAxisId = this.lastAxisId = ( vocabularyTableShape_toExtract.length - 1 );

      // Build tf.tensor of vocabulary tables.
      try {
        this.vocabularyTablesTensor2dArray = new Array( this.vocabularyTables.length );

        // Need to prefix vocabulary id channel.
        if ( bEmbedVocabularyId ) {

          // Create vocabulary id list (tensor2d). (for concatenating with vocabulary table)
          let numberSequencer = new Array( vocabularyCountPerInputChannel ).keys(); // Generator: 0, 1, 2, ..., ( vocabularyCountPerInputChannel - 1 )
          const idsTensor2d = tf.tensor2d( [ ...numberSequencer ], [ vocabularyCountPerInputChannel, 1 ] );

          try {
            for ( let i = 0; i < this.vocabularyTables.length; ++i ) {

              // Create an embedding vocabulary table (without vocabulary id).
              const vocabularyTableTensor2dWithoutIds = tf.tensor2d( this.vocabularyTables[ i ].weights, vocabularyTableShape_toExtract );

              try { // Concatenate vocabulary id prefix vocabulary table (as residual connection).
                this.vocabularyTablesTensor2dArray[ i ] = idsTensor2d.concat( vocabularyTableTensor2dWithoutIds, lastAxisId );

              } finally {
                vocabularyTableTensor2dWithoutIds.dispose();
              }

              ++progressToAdvance.value;
              yield progressRoot;  // One vocabulary table tensor3d built. Report progress.
            }

          } finally {
            idsTensor2d.dispose();
          }

        } else { // No need to prefix vocabulary id channel.

          for ( let i = 0; i < this.vocabularyTables.length; ++i ) {
            // Create an embedding vocabulary table (without vocabulary id).
            this.vocabularyTablesTensor2dArray[ i ] = tf.tensor2d( this.vocabularyTables[ i ], vocabularyTableShape_toExtract );

            ++progressToAdvance.value;
            yield progressRoot;  // One vocabulary table tensor2d built. Report progress.
          }
        }

      } catch ( e ) {
        return false; // e.g. out of (GPU) memory.
      }

    // 4.2 When ( channelMultiplier < 1 ), there is no need to build this.vocabularyTablesTensor2dArray[].
    } else {
      progressToAdvance.value += inChannels; // Report progress as it built directly.
      yield progressRoot;
    }

    // 5. Prepare other auxiliary data members.

    // For a 4 color (r-g-b-a) channel image, splitCount will be 4.
    //
    // For example, suppose input is a color image (i.e. height-width-color tensor3d). The last
    // axis is a 4 color (r-g-b-a) channel. Splitting along the last axis (the color channel)
    // results in an array [ r, g, b, a ] which has 4 tensor3d (in fact, they should be
    // viewed as tensor1d).
    //
    // This is pre-calculated for improving performance of apply_and_destroy_or_keep().
    this.splitCount = this.inChannels;

    // This is an intermediate temporary array. It collects the results of every looking (vocabulary table) up. They will be
    // concatenated into one tensor3d as apply_and_destroy_or_keep()'s result.
    //
    // Pre-allocate this array shell (instead of re-allocating every time apply_and_destroy_or_keep()) for improving performance.
    this.embeddedTensor3dArray = new Array( this.splitCount );

    return true; // Initialized successfully.
  }

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {

    if ( this.channelMultiplier < 1 ) {

      // The vocabulary tables (from initer()'s inputFloat32Array) should always exist, even if channelMultiplier is zero or negative.
      //
      // But there will be no this.vocabularyTablesTensor2dArray[] because apply_and_destroy_or_keep() will just return output as input.
      if ( this.vocabularyTables )
        if ( this.vocabularyTables[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
          if ( this.vocabularyTables[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
            return true;

      return false;

    } else {

      // If channelMultiplier is positive, the tensor3d of vocabulary tables should exists.
      if ( this.vocabularyTablesTensor2dArray )
        if ( this.vocabularyTablesTensor2dArray[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
          if ( this.vocabularyTablesTensor2dArray[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
            return true;

      return false;
    }
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.vocabularyTablesTensor2dArray ) {
      tf.dispose( this.vocabularyTablesTensor2dArray );
      this.vocabularyTablesTensor2dArray = null;
    }

    this.embeddedTensor3dArray = null;
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

  /**
   * Return a copy of input (as output) immediately. Used for ( channelMultiplier < 1 ) and ( bKeepInputTensor == true  ).
   *
   * It should not be called directly. It should be called through this.apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor3d
   *   A tensor3d data. This inputTensor3d will be kept (i.e. not disposed).
   *
   * @return {tf.tensor3d} The copy of input. Return null, if input is null. Throw exception, if failed (e.g. out of GPU memory).
   */
  static keep_input_return_copy( inputTensor3d ) {
    if ( inputTensor3d )
      return inputTensor3d.clone();
    return null;
  }

  /**
   * Return the input (as output) directly immediately. Used for ( channelMultiplier < 1 ) and ( bKeepInputTensor == false ).
   *
   * It should not be called directly. It should be called through this.apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} inputTensor3d
   *   A tensor3d data. It should be viewed as already disposed by this method. However, in fact, it is returned as output
   * directly.
   *
   * @return {tf.tensor3d} The same as input.
   */
  static return_input_directly( inputTensor3d ) {
    return inputTensor3d;
  }

  /**
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
  static apply_and_destroy_or_keep_SplitGatherConcat( inputTensor3d ) {

//!!! ...unfinished... could use gahter, gather, concat instead of split, gather, concat?

    // e.g. will be 2 for tensor3d.
    //
    // This should be the same as ( inputTensor3d.shape.length - 1 ) or ( inputTensor3d.rank - 1 ).
    let lastAxisId = this.lastAxisId;

    // Extract vocabulary indices from input.
    //
    // Split the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
    // In fact, the result is still tensor3d but has only one channel.
    //
    // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ lastAxisId ] ).
    const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.split( this.splitCount, lastAxisId );

    this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).

    let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.

    // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
    // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
    for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor3dArray.length; ++channelIndex ) {
      let oneChannelTensor3d = vocabularyIndicesOneChannelTensor3dArray[ channelIndex ];
      embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensor2dArray[ channelIndex ].gather( oneChannelTensor3d );

      oneChannelTensor3d.dispose(); // Release intermediate temporary tensor as soon as possible for reducing memory footprint.
    }

    // Concatenate along the last axis, so that it is still tensor3d but with embedded (more) channels in the last axis.
    let predictResult = tf.concat( embeddedTensor3dArray, lastAxisId );

    for ( let i = 0; i < embeddedTensor3dArray.length; ++i ) { // Release intermediate temporary tensors.
      embeddedTensor3dArray[ i ].dispose();
      embeddedTensor3dArray[ i ] = null; // So that it is cleared when next time re-used.
    }

    return predictResult;


//!!! (2020/12/28 Remarked) Change to dispose as soon as possible for reducing memory footprint.
//     try {
//       let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.
//
//       try {
//
//         // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
//         // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
//         for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor3dArray.length; ++channelIndex ) {
//           let oneChannelTensor3d = vocabularyIndicesOneChannelTensor3dArray[ channelIndex ];
//           embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensor2dArray[ channelIndex ].gather( oneChannelTensor3d );
//         }
//
//         // Concatenate along the last axis, so that it is still tensor3d but with embedded (more) channels in the last axis.
//         let predictResult = tf.concat( embeddedTensor3dArray, lastAxisId );
//         return predictResult;
//
//       } finally {
//         Base.disposeTensorArray_ArrayCouldNotNull_ElementCouldNotNull( embeddedTensor3dArray );
//       }
//
//     } finally {
//       Base.disposeTensorArray_ArrayCouldNotNull_ElementCouldNotNull( vocabularyIndicesOneChannelTensor3dArray );
//     }

//!!! ...unfinished... squeeze-and-excitation.
  }

  /**
   * Release an array of tf.tensor.
   *
   * This method is a little like tf.dispose() but can only handle one-layer and non-null array (and non-null element). But
   * it should be faster than tf.dispose( an_array ) because no dynamic memory allocation.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array contains tf.tensor to be disposed. Both the tensorArray itself and its elements can not be null (for reducing
   * conditional-branch to improving performance). It can not have nested array. Its element must be tf.tensor (and can not
   * be null).
   */
  static disposeTensorArray_ArrayCouldNotNull_ElementCouldNotNull( tensorArray ) {
    for ( let i = 0; i < tensorArray.length; ++i ) {
      tensorArray[ i ].dispose();
    }
  }

  /** @return {number} The position which is started (inclusive) to extract from inputFloat32Array by initer(). */
  get byteOffsetBegin() { return this.params.defaultByteOffsetBegin; }

  /** @return {number} The position which is ended to (non-inclusive) extract from inputFloat32Array by initer(). */
  get byteOffsetEnd()   { return this.vocabularyTables[ this.params.inChannels - 1 ].defaultByteOffsetEnd; }

  get inChannels()        { return this.params.inChannels; }
  get channelMultiplier() { return this.params.channelMultiplier; }
  get outChannels()       { return this.params.outChannels; }
}
