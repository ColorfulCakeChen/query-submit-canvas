export { Base };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";

/**
 *
 *
 *
 *
 */
class Base extends Recyclable.Array {

  /**
   * Used as default NameNumberArrayObject.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NameNumberArrayObject.Base.Pool", Base, Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.weightsArray = Recyclable.Array.Pool.get_or_create_by( 0 );
  }

  /** @override */
  disposeResources() {
    this.weightsElementOffsetBegin = undefined;

    if ( this.weightsArray ) {
      this.weightsArray.disposeResources_and_recycleToPool();
      this.weightsArray = null;
    }

    super.disposeResources();
  }


}
