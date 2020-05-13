export { Base };

/**
 * The base class of various neural network layer.
 *
 * @member {Layer.Base} nextLayer
 *   The next layer of this neural network layer.
 *
 */
class Base {

  /**
   *
   * @param {Layer.Base} nextLayer
   *   The layer after this neural network layer.
   *   When apply() is called, this layer object will become the to
   */
  setNextLayer( nextLayer ) {
    this.nextLayer = nextLayer;
  }

  /**
   *
   * @param {tf.tensor} inputTensor
   *   Process inputTensor, and then call the nextLayer.apply().
   */
  apply( inputTensor ) {
    this.nextLayer = nextLayer;
  }

  /**
   *
   * @param {tf.tensor} inputTensor
   *   Process inputTensor, and then call the nextLayer.apply().
   */
  apply( inputTensor ) {
    this.nextLayer = nextLayer;
  }

}
