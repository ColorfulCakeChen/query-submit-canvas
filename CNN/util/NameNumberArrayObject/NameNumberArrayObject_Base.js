export { NameNumberArrayObject_Base as Base };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";

/**
 * This object has string named properties and integer numeric properties (just
 * like an Array). No matter string named or integer numeric properties, their
 * values should be either a number or a number array.
 *
 * It is mainly used for composing the input parameters and weights of Block,
 * Stage, Embedding, NeuralNet. The composing order are:
 *  - All string named properties first according to nameOrderArray. And then,
 *  - All integer numeric properties according to the incremental order (i.e.
 *      0, 1, 2, ...) 
 *
 *
 */
class NameNumberArrayObject_Base extends Recyclable.Array {

  /**
   * Used as default NameNumberArrayObject.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NameNumberArrayObject.Base.Pool",
    NameNumberArrayObject_Base, NameNumberArrayObject_Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor() {
    super.setAsConstructor();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}
