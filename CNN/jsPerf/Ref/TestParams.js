export { Base };

/**
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter configuration.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of some (e.g. PointDepthPoint) Params's constructor. Besides,
 * it also has the following properties:
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *   - weights
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of some (e.g. PointDepthPoint) Params.extract().
 * That is, it has the data members of this.in except inputFloat32Array, byteOffsetBegin, weights.
 *
 */
class Base {
  constructor() {
    this.id = -1;
    this.in = {};
    this.out = {};
  }
}
