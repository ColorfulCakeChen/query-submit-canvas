export { OwnerArray };

import * as Pool from "../Pool.js";
import { Array as Recyclable_Array } from "./Recyclable_Array.js";

/**
 * Similar to Recyclable_Array but it owns its contents (which are instances of Recyclable.Base). It will release its contents
 * (by calling their .disposeResources_and_recycleToPool()) in .disposeResources().
 *
 *
 */
class Recyclable_OwnerArray extends Recyclable_Array {

  /**
   * Used as default Recyclable.OwnerArray  provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.OwnerArray.Pool", Recyclable_OwnerArray, Recyclable_OwnerArray.setAsConstructor );

  /**
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    Recyclable_OwnerArray.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( ...restArgs );
    Recyclable_OwnerArray.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    
    // Release all contents since they are owned by this OwnerArray.
    for ( let i = 0; i < this.length; ++i ) {
      let object = this[ i ];
      if ( object instanceof Recyclable.Base ) {
        object.disposeResources_and_recycleToPool();
        this[ i ] = null; // So that it will not become dangling object (since it has already been recycled).
      }
    }

    super.disposeResources();
  }

}

