export { Recyclable_Array as Array };

import * as Pool from "../Pool.js";
import { Base } from "./Recyclable_Base.js";

/**
 * Almost the same as class Array but combined with Recyclable.Base interface.
 */
class Recyclable_Array extends Base( Array ) {

  /**
   * Used as default Recyclable.Array provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Recyclable.Array.Pool",
    Recyclable_Array );

  /**
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    // (2022/06/27 Remarked) No need to call .#setAsConstructor_self()
    // because the constructor of parent class (i.e. Array) has already done
    // it.
    //this.#setAsConstructor_self( restArgs ); // No need to spread restArgs.
  }

  /** @override */
  setAsConstructor( ...restArgs ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( restArgs ); // No need to spread restArgs.
  }

  /**  */
  #setAsConstructor_self( restArgs ) {
    if ( 0 == restArgs.length ) { // 0. No argument: empty array.
      this.length = 0;

    // 1. One argument: array with specified length.
    } else if ( 1 == restArgs.length ) {
      this.length = restArgs[ 0 ];

    // 2. Two (or more) arguments: array with these specified contents.
    } else {
      this.length = restArgs.length;
      for ( let i = 0; i < restArgs.length; ++i ) {
        this[ i ] = restArgs[ i ];
      }
    }
  }

  //!!! (2022/07/06 Remarked) For speed-up a little.
  /** @override */
  disposeResources() {
   this.length = 0;
   super.disposeResources();
  }

}

