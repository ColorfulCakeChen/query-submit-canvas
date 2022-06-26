export { Base, Root };

import * as Pool from "../Pool.js";

/**
 * The base class representing a object could be recycled (i.e. disposed without release its main object memory for re-using in the
 * future).
 *
 * Every sub-class of this Recyclable.Base MUST define a static propery named Pool which is usually an instance of Pool.Base:
 * <pre>
 * class SomeClass extends Recyclable.Base {
 *
 *   static Pool = new Pool.Root( "SomeNamespace.SomeClass", SomeClass, SomeClass.setAsConstructor );
 *
 *   static setAsConstructor( ...restArgs ) {
 *     super.setAsConstructor.apply( restArgs ); // All other arguments passed to parent class.
 *
 *       :
 *
 *     return this;
 *   }
 *
 * }
 * </pre>
 *
 * Or,
 * <pre>
 * class SomeClass extends Recyclable.Base {
 *
 *   ... (if static property definition is not supported by your web browser) ...
 *
 * }
 *
 * SomeClass.Pool = new Pool.Root( "SomeNamespace.SomeClass", SomeClass, SomeClass.setAsConstructor );
 *
 * </pre>
 *
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

  ///**
  // * Sub-class's constructor could call itself SubClassXxx.setAsConstructor() (i.e. not call Base.setAsConstructor() directly here).
  // */
  //constructor( ...restArgs ) {
  //  super( ...restArgs );
  //  Base.setAsConstructor.call( this );
  //}

  /**
   * Sub-class should override this static method (and call super.setAsConstructor() in the beginning of this method).
   *
   * @param {Base} this
   *   The Recyclable.Base object to be initialized.
   *
   * @return {Base}
   *   Return the this object.
   */
  static setAsConstructor( ...restArgs ) {

    if ( super.setAsConstructor instanceof Function ) // If parent class has the same method, call it.
      super.setAsConstructor.apply( this, restArgs );

    // Nothing to do here (for Recyclable.Base).

    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {

    // Nothing to do here (for Recyclable.Base).

    if ( super.disposeResources instanceof Function ) // If parent class has the same method, call it.
      super.disposeResources();
  }

  /**
   * This method will do the following in sequence:
   *   - call this.disposeResources() (if exists)
   *   - call this.constructor.Pool.recycle()
   *
   * Sub-class should NEVER override this method (so NEVER call super.disposeResources_and_recycleToPool()).
   *
   *
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    this.constructor.Pool.recycle( this );
  }

}


/**
 * Almost the same as Recyclable.Base class except its parent class is fixed to Object. In other words, caller can not specify the
 * parent class of Recyclable.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

