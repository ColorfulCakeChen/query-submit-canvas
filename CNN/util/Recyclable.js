export { Base, Root };

//import * as Pool from "./Pool.js";

/**
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

//   static Pool = new BasePool();


  /**
   * This method will do the following in sequence:
   *   - call this.disposeResources() (if exists), and then
   *   - call this.constructor.Pool.recycle().
   *
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   *
   * Sub-class should NEVER override this method (so NEVER call super.disposeResources_and_recycleToPool()).
   */
  disposeResources_and_recycleToPool() {

    if ( this.disposeResources instanceof Function ) { // If this object needs dispose, do it before being recyled.
      this.disposeResources();
    }

    this.constructor.Pool.recycle( this );
  }

}


/**
 * Almost the same as Recyclable.Base class except its parent class is fixed to Object. In other words, caller can not specify the
 * parent class of Operation.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base {
}

