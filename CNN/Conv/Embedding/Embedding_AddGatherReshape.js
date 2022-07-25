export { AddGatherReshape };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
//import { Base } from "./Operation_Base.js";
import * as Weights from "../../Unpacker/Weights.js";

//!!! ...unfinished... (2022/07/25)
// Perhaps, provide a parameter control whether different input channel uses the same
// or different look-up (i.e. vocabulary) table.

/**
 *
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
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 * 
 * @param {number} input_channelCount
 *   The input channel count.
 *
 * @member {number} channelMultiplier
 *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. It could be viewed as embeddingChannelCountPerInputChannel.
 *
 * @member {number} vocabularyCountPerInputChannel
 *   Every input channel will have how many vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A four channels), there will be 256
 * vocabularies per input channel because every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 *
 * @member {boolean} bEmbedVocabularyId
 *   If true, one of embedding channels will be an auto-generated vocabulary id (i.e. 0, 1, 2, ...). So only
 * ( channelMultiplier - 1 ) embedding channels will be extracted from inputWeightArray. The extra vocabulary id
 * channel achieves residual connection. Residual connection means apply_and_destroy_or_keep() will append (concatenate)
 * input to output. Since apply_and_destroy_or_keep()'s input is just vocabulary id (one channel or multiple channels),
 * pre-embedded vocabulary id inside the embedding table acheives the same effect by less computation (but more memory).
 *
 * @member {number} output_channelCount
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 *
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this embedding.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputWeightArray.
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
 *
 * @see Weight.Root
 *
 */
class AddGatherReshape extends Weights.Root {

  /**
   * Used as default Embedding.AddGatherReshape provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.AddGatherReshape.Pool", AddGatherReshape, AddGatherReshape.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    AddGatherReshape.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    AddGatherReshape.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {

!!! ...unfinished... (2022/07/17)

  }

  /** @override */
  disposeResources() {

!!! ...unfinished... (2022/07/17)

    super.disposeResources();
  }

  /**
   * Generator for initializing this object.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   *
   */
  * init( inputWeightArray, weightElementOffsetBegin,
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor,
    inputScaleBoundsArray0
  ) {

   
 
  }

}
