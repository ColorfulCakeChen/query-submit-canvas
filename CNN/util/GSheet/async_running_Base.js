export { async_running_Base };
export { async_running_Root };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";


//!!! ...unfinished... (2023/03/23)

/**
 *
 *
 */
let async_running_Base = ( ParentClass = Object ) =>
  class async_running_Base extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default async_running_Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "async_running_Base.Pool",
  async_running_Base, async_running_Base.setAsConstructor );

  /**
   *
   */
  constructor( ...restArgs ) {

    super( ...restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    super.disposeResources();
  }

}


/**
 * Almost the same as async_running_Base class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of async_running_Root (so it is named "Root" which can not have
 * parent class).
 */
class async_running_Root extends async_running_Base() {
}

