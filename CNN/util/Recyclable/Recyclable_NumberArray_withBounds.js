export { NumberArray_withBounds };

import * as Pool from "../Pool.js";
import { Base } from "./Recyclable_Base.js";
import { Array as Recyclable_Array } from "./Recyclable_Array.js";

/**
 * Similar to Recyclable_Array but it is mainly used for number array and has two extra properties:
 *   - lowerBounds
 *   - upperBounds
 *
 *
 *
 */
class NumberArray_withBounds extends Recyclable_Array {

  /**
   * Used as default Recyclable.NumberArray_withBounds provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.NumberArray_withBounds.Pool",
    NumberArray_withBounds, NumberArray_withBounds.setAsConstructor );

  /**
   * Every element of restArgs should be instance of Recyclable.Base (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    NumberArray_withBounds.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( ...restArgs );
    NumberArray_withBounds.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.lowerBound = undefined;
    this.upperBound = undefined;
    super.disposeResources();
  }

}

