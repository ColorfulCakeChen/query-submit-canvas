export { Info };

/**
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {Function} pfn
 *   The activation function. (e.g. tf.relu6, tf.sigmoid, tf.tanh, tf.cos, tf.sin, tf.relu)
 *
 * @member {FloatValue.Bounds} inputDomainLinear
 *   The input value lower and upper bounds of the activation function for keeping the mapping from input to output almost linear. In
 * general speaking, an activation function is non-linear in the whole domain. However, inside this special part of the domain, it looks
 * almost like a linear function.
 *
 * @member {FloatValue.Bounds} outputRange
 *   The output value lower and upper bounds of the activation function.
 */
class Info {

  constructor( nActivationId, pfn, inputDomainLinear, outputRange ) {
    this.nActivationId = nActivationId;
    this.pfn = pfn;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRange = outputRange;
  }

}
