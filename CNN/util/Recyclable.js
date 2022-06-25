export { Base, Root };

//import * as Pool from "./Pool.js";

/**
 * The base class representing a object could be recycled (i.e. disposed without release its main object memory for re-using in the
 * future).
 *
 * Every sub-class of this Recyclable.Base MUST define a static propery named RecyclePool which is usually an instance of Pool.Base:
 * <pre>
 * class SomeClass extends Recyclable.Base {
 *
 *   static RecyclePool = new XxxPool();
 *
 * }
 * </pre>
 *
 *
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

  /**
   * This method will do the following in sequence:
   *   - call this.disposeResources() (if exists)
   *   - call this.constructor.RecyclePool.recycle()
   *
   * Sub-class should NEVER override this method (so NEVER call super.disposeResources_and_recycleToPool()).
   *
   *
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {

    if ( this.disposeResources instanceof Function ) { // If this object needs disposing, do it before being recyled.
      this.disposeResources();
    }

    this.constructor.RecyclePool.recycle( this );
  }

}


/**
 * Almost the same as Recyclable.Base class except its parent class is fixed to Object. In other words, caller can not specify the
 * parent class of Recyclable.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base {
}

