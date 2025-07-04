export { NumberArray_withBounds };

import * as Pool from "../Pool.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import { Base } from "./Recyclable_Base.js";
import { Array as Recyclable_Array } from "./Recyclable_Array.js";

/**
 * Similar to Recyclable_Array but it is mainly used for number array and has
 * extra properties:
 *   - boundsArray_byChannel
 *
 *
 *
 */
class NumberArray_withBounds extends Recyclable_Array {

  /**
   * Used as default Recyclable.NumberArray_withBounds provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.NumberArray_withBounds.Pool",
    NumberArray_withBounds );

  /**
   * Every element of restArgs should be instance of Recyclable.Base (even if
   * restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the
   *       argement is length (not element) if only one argument is given.
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( ...restArgs ) {
    super.setAsConstructor( ...restArgs );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    this.boundsArray_byChannel
      = FloatValue.BoundsArray.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    if ( this.boundsArray_byChannel ) {
      this.boundsArray_byChannel.disposeResources_and_recycleToPool();
      this.boundsArray_byChannel = null;
    }
    super.disposeResources();
  }

}
