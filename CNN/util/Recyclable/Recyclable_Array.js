export { Recyclable_Array as Array };

import { Base } from "./Recyclable_Base.js";
import * as Pool from "../Pool.js";

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
  constructor( length = 0 ) {
    super( length );
    // (2022/06/27 Remarked) The constructor of parent class (i.e. Array) has already done it.
    //Recyclable_Array.setAsConstructor_self.call( this, length );
  }

  /** @override */
  static setAsConstructor( length = 0 ) {
    super.setAsConstructor();
    Recyclable_Array.setAsConstructor_self.call( this, length );
    return this;
  }

  /** @override */
  static setAsConstructor_self( length = 0 ) {
    this.length = length;
  }

}

