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
   * @param {boolean} bVocabularyTableUseTensor2d
   *   If true, the vocabulary table will be built as tf.tensor2d. Otherwise, the vocabulary table will be built as tf.tensor3d.
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
    bKeepInputTensor,
    bVocabularyTableUseTensor2d
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
    this.bVocabularyTableUseTensor2d = bVocabularyTableUseTensor2d;

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

    // 2.1 Shortcut operation.
    if ( // If channelMultiplier is illegal (i.e. zero or negative). (could happen by evolution.)
           ( channelMultiplier < 1 )

        // Or, if there is only one output channel per input channel and the only one output channel is just vocabulary id.
        || ( ( channelMultiplier == 1 ) & ( bEmbedVocabularyId ) )
       ) {

      if ( bKeepInputTensor )
        // 2.1.1 For ( channelMultiplier < 1 ) and ( bKeepInputTensor == true  ), return a copy of input (as output) immediately.        
        this.apply_and_destroy_or_keep = Base.keep_input_return_copy;
      else
        // 2.1.2 For ( channelMultiplier < 1 ) and ( bKeepInputTensor == false ), return input (as output) immediately.
        this.apply_and_destroy_or_keep = Base.return_input_directly;

    } else { // 2.2 channelMultiplier is positive.

      if ( bVocabularyTableUseTensor2d ) {
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_SplitReshapeGatherConcat; // When vocabulary tables are tensor2d.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, channelMultiplier ];
      } else {
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_SplitGatherConcatReshape; // When vocabulary tables are tensor3d.
        vocabularyTableShape_toExtract = [ vocabularyCountPerInputChannel, 1, channelMultiplier ];
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

    // 4. Build tensor3d[] (or tensor2d[]) of vocabulary tables.

    // 4.1 If ( channelMultiplier >= 1 ), build tensor3d[] of vocabulary tables.
    if ( vocabularyTableShape_toExtract ) {

      // For tensor2d, the last axis id will be 1.
      // For tensor3d, the last axis id will be 2.
//       //
//       // This is pre-calculated for improving performance of apply_and_destroy_or_keep().
//       let concatAxisId = this.concatAxisId = ( vocabularyTableShape_toExtract.length - 1 );
      let concatAxisId = ( vocabularyTableShape_toExtract.length - 1 );

      // Build tf.tensor of vocabulary tables.
      try {
        this.vocabularyTablesTensorArray = new Array( this.vocabularyTables.length ); // could be tensor3d or tensor2d.

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
            for ( let i = 0; i < this.vocabularyTables.length; ++i ) {

              // Create an embedding vocabulary table (without vocabulary id).
              const vocabularyTableTensorWithoutIds = tf.tensor( this.vocabularyTables[ i ].weights, vocabularyTableShape_toExtract ); // 2d or 3d

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

          for ( let i = 0; i < this.vocabularyTables.length; ++i ) {
            // Create an embedding vocabulary table (without vocabulary id).
            this.vocabularyTablesTensorArray[ i ] = tf.tensor( this.vocabularyTables[ i ].weights, vocabularyTableShape_toExtract ); // 2d or 3d

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

//!!! (2021/01/03 Modified) Use constant directly.
//     // For tensor3d, the splitted axis id is the last axis id (i.e. 2).
//     //
//     // This is pre-calculated for improving performance of apply_and_destroy_or_keep().
//     this.splitAxisId = 2;

    // The followings are intermediate temporary arrays. Pre-allocate these array shells (instead of re-allocating every
    // time apply_and_destroy_or_keep()) for improving performance.
    {
      if ( bVocabularyTableUseTensor2d ) {
        // For collecting the rank reduced tensor2d (from the splitted inputTensor3d). They will be used to look up vocabulary table.
        this.vocabularyIndicesOneChannelTensor2dArray = new Array( this.splitCount );

        // The first 2 dimension of apply_and_destroy_or_keep()'s inputTensor3d. When the input is splitted and reduce to tensor2d,
        // their shape should be this. It is used for reshape from tensor3d to tensor2d.
        //
        // (Used when vocabulary tables are tensor2d.)
        this.inputTensor2dShape = new Array( 2 );
      } else {
        // The 3 dimension of apply_and_destroy_or_keep()'s outputTensor3d. When the input is splitted to tensor3d and the
        // vocabulary tables are tensor3d, the result of tf.gather() will be tensor5d. This shape is used for reshape the
        // output from tensor5d to tensor3d.
        //
        // (Used when vocabulary tables are tensor3d.)
        this.outputTensor3dShape = [ 0, 0, this.outChannels ];
      }

      // For collecting the results of every looking (vocabulary table) up. They will be concatenated into one tensor3d as
      // apply_and_destroy_or_keep()'s result.
      this.embeddedTensor3dArray = new Array( this.splitCount );
    }

    return true; // Initialized successfully.
  }

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {

    if ( this.channelMultiplier < 1 ) {

      // The vocabulary tables (from initer()'s inputFloat32Array) should always exist, even if channelMultiplier is zero or negative.
      //
      // But there will be no this.vocabularyTablesTensorArray[] because apply_and_destroy_or_keep() will just return output as input.
      if ( this.vocabularyTables )
        if ( this.vocabularyTables[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
          if ( this.vocabularyTables[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
            return true;

      return false;

    } else {

      // If channelMultiplier is positive, the tensor3d (or tensor2d) of vocabulary tables should exists.
      if ( this.vocabularyTablesTensorArray )
        if ( this.vocabularyTablesTensorArray[ this.params.inChannels - 1 ] ) // At least, there should be one vocabulary table.
          if ( this.vocabularyTablesTensorArray[ this.params.inChannels - 1 ].isValid() )  // the last vocabulary table is valid.
            return true;

      return false;
    }
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.vocabularyTablesTensorArray ) {
      tf.dispose( this.vocabularyTablesTensorArray );
      this.vocabularyTablesTensorArray = null;
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
   * (Used when vocabulary tables are tensor3d.)
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
  static apply_and_destroy_or_keep_SplitReshapeGatherConcat( inputTensor3d ) {

//!!! ...unfinished... could use gahter, gather, concat instead of split, gather, concat?
//!!! ...unfinished... could use unstack, gather, stack instead of split, gather, concat?
//!!! ...unfinished... could use oneHot, pointwise convolution instead of split, gather, concat?

//     // e.g. will be 1 for tensor2d.
//     //
//     // This is the last axis id of vocabulary table (tensor2d). It is the last second axis of inputTensor3d (tensor3d).
//     let concatAxisId = this.concatAxisId;

    // Using pre-allocated array as local variable to improving performance.
    let vocabularyIndicesOneChannelTensor2dArray = this.vocabularyIndicesOneChannelTensor2dArray;

//!!! (2021/01/03 Modified) Use constant directly.
//     // For tensor3d, the splitted axis id is the last axis id (i.e. 2).
//     //
//     // Use pre-calculated value for improving performance of apply_and_destroy_or_keep().
//     let splitAxisId = this.splitAxisId;

//!!! could use unstack?
//     // Extract vocabulary indices from input.
//     //
//     // Split the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
//     // In fact, the result is still tensor3d but has only one channel.
//     //
//     // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ concatAxisId ] ).
//     const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.unstack( this.splitCount, concatAxisId );

    // Extract vocabulary indices from input.
    {
      // The input is tensor3d, the last axis id (for splitting) is 2 (= 3 - 1).
      //
      // Split along the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
      // In fact, the result is still tensor3d but has only one channel.
      //
      // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ inputTensor3d.shape.length - 1 ] ).
//!!! (2021/01/03 Modified) Use constant directly.
//      const oneChannelTensor3dArray = inputTensor3d.split( this.splitCount, splitAxisId );
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

//!!! (2020/12/30 Remarked) should use tf.unstack() so that the rank will reduce one (i.e. tensor3d to tensor2d).
//     // Extract vocabulary indices from input.
//     //
//     // Split the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
//     // In fact, the result is still tensor3d but has only one channel.
//     //
//     // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ concatAxisId ] ).
//     const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.split( this.splitCount, this.splitAxisId );
//
//    this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).

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
//!!! (2021/01/03 Modified) Use constant directly.
//    let predictResult = tf.concat( embeddedTensor3dArray, splitAxisId );
    let predictResult = tf.concat( embeddedTensor3dArray, 2 );

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
//         let predictResult = tf.concat( embeddedTensor3dArray, concatAxisId );
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
   * (Used when vocabulary tables are tensor3d.)
   */
  static apply_and_destroy_or_keep_SplitGatherConcatReshape( inputTensor3d ) {

//!!! ...unfinished... could use gahter, gather, concat instead of split, gather, concat?
//!!! ...unfinished... could use unstack, gather, stack instead of split, gather, concat?
//!!! ...unfinished... could use oneHot, pointwise convolution instead of split, gather, concat?

//!!! (2021/01/03 Modified) Use constant directly.
//     // For tensor3d, the splitted axis id is the last axis id (i.e. 2).
//     //
//     // Use pre-calculated value for improving performance of apply_and_destroy_or_keep().
//     let splitAxisId = this.splitAxisId;

    // Extract vocabulary indices from input.
    //
    // The input is tensor3d, the last axis id (for splitting) is 2 (= 3 - 1).
    //
    // Split along the last axis (of input) as many as the shape size (of the last axis) (i.e. become tensor2d).
    // In fact, the result is still tensor3d but has only one channel.
    //
    // The splitCount should be the same as ( this.inChannels ) or ( inputTensor3d.shape[ inputTensor3d.shape.length - 1 ] ).
//!!! (2021/01/03 Modified) Use constant directly.
//    const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.split( this.splitCount, splitAxisId );
    const vocabularyIndicesOneChannelTensor3dArray = inputTensor3d.split( this.splitCount, 2 );

    this.destroy_or_keep_input( inputTensor3d ); // Destroy or keep input according to ( this.bKeepInputTensor ).

    let outputTensor3dShape = this.outputTensor3dShape; // Use pre-calculated array for improving performance.
    outputTensor3dShape[ 0 ] = inputTensor3d.shape[ 0 ];
    outputTensor3dShape[ 1 ] = inputTensor3d.shape[ 1 ];

    let embeddedTensor3dArray = this.embeddedTensor3dArray; // Using pre-allocated array as local variable to improving performance.

    // Embedding (looking up different vocabulary tables according to channel index of vocabulary indices).
    // Every tensor3d (one channel) will be expanded to tensor3d (multiple channels).
    for ( let channelIndex = 0; channelIndex < vocabularyIndicesOneChannelTensor3dArray.length; ++channelIndex ) {
      let oneChannelTensor3d = vocabularyIndicesOneChannelTensor3dArray[ channelIndex ];

      // tensor3d.gather( tensor3d ) results to tensor5d.
      embeddedTensor3dArray[ channelIndex ] = this.vocabularyTablesTensorArray[ channelIndex ].gather( oneChannelTensor3d );

      oneChannelTensor3d.dispose(); // Release intermediate temporary tensor as soon as possible for reducing memory footprint.
    }

    // Concatenate along the last axis, so that it becomes tensor3d and with embedded (more) channels in the last axis.
    //
    // The result of tensor3d.gather( tensor3d ) are tensor5d, so their last axis is 4 (= 5 - 1).
//!!! (2021/01/03 Modified) wrong! embeddedTensor3dArray[] are tensor5d, the last axis should be 4.
//    let concatResult = tf.concat( embeddedTensor3dArray, splitAxisId );
    let concatResult = tf.concat( embeddedTensor3dArray, 4 );

    for ( let i = 0; i < embeddedTensor3dArray.length; ++i ) { // Release intermediate temporary tensors.
      embeddedTensor3dArray[ i ].dispose();
      embeddedTensor3dArray[ i ] = null; // So that it is cleared when next time re-used.
    }

    // Reshape tensor5d to tensor3d.
    let predictResult = concatResult.reshape( outputTensor3dShape );
    concatResult.dispose();

    return predictResult;

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
