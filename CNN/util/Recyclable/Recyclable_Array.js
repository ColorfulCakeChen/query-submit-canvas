export { Recyclable_Array as Array };

import * as Pool from "../Pool.js";
import { Base } from "./Recyclable_Base.js";

/**
 * Almost the same as class Array but combined with Recyclable.Base interface.
 */
class Recyclable_Array extends Base( Array ) {

  /**
   * Used as default Recyclable.Array provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.Array.Pool", Recyclable_Array, Recyclable_Array.setAsConstructor );

  /**
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    // (2022/06/27 Remarked) No need to call .setAsConstructor_self() because the constructor of parent class (i.e. Array) has already done it.
    //Recyclable_Array.setAsConstructor_self.call( this, ...restArgs );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor();
    Recyclable_Array.setAsConstructor_self.apply( this, restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( ...restArgs ) {
    if ( 0 == restArgs.length ) { // 0. No argument: empty array.
      this.length = 0;

    } else if ( 1 == restArgs.length ) { // 1. One argument: array with specified length.
      this.length = restArgs[ 0 ];

    } else { // 2. Two (or more) arguments: array with these specified contents.
      this.length = restArgs.length;
      for ( let i = 0; i < restArgs.length; ++i ) {
        this[ i ] = restArgs[ i ];
      }
    }
  }

  /** @override */
  disposeResources() {
    this.length = 0;
    super.disposeResources();
  }

}

