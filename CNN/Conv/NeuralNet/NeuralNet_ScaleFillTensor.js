export { NeuralNet_ScaleFillTensor as ScaleFillTensor };

/**
 * A helper class for preparing input tensor of a neural network.
 *
 */
class NeuralNet_ScaleFillTensor {

  /** */
  constructor() {

  }

  /**
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray. It may be modified by filling with
   * alignment mark and feedback information (i.e. previous time output of the
   * neural network).
   *
   * @param {number} source_height
   *
   *
   * @param {number} source_width
   *
   *
   * @param {number} source_channelCount
   *
   *
   */
  scale_fill_tensor(
    source_TypedArray,
    source_height, source_width, //source_channelCount,
    target_height, target_width, //target_channelCount,

  ) {
    const funcNameInMessage = "scale_fill_tensor";

    const source_size_per_channel = source_height * source_width;

    if ( ( source_TypedArray.length % source_size_per_channel ) != 0 )
      throw Error( `NeuralNet_ScaleFillTensor.${funcNameInMessage}(): `
        + `source_TypedArray.length ( ${source_TypedArray.length} ) ` 
        + `should be divisible by `
        + `source_size_per_channel ( `
        + `= source_height * source_width `
        + `= ${source_height} * ${source_width} )`
        + `= ${source_size_per_channel} )`
      );

    let source_channelCount = source_TypedArray.length / source_size_per_channel;



  }

}
