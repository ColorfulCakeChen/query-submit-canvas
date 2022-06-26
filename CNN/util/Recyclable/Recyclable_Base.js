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

  /**
  * Sub-class's constructor could call itself SubClassXxx.setAsConstructor_self() (i.e. do NOT call .setAsConstructor() because super()
  * will do revursively already).
  */
  constructor( ...restArgs ) {
   super( ...restArgs );
   Base.setAsConstructor_self.call( this );
  }

  /**
   * Setup self only (i.e. NOT recursively).
   *
   * Sub-class should override this static method (and NEVER call super.setAsConstructor() in the beginning of this method).
   *
   * Note: This method needs NOT return "this".
   *
   *
   * @param {Base} this
   *   The Recyclable.Base object to be initialized.
   */
  static setAsConstructor_self() {
    // Nothing to do here (for Recyclable.Base).
  }

  /**
   * Setup recursively.
   *
   * Sub-class should override this static method:
   *   - Call super.setAsConstructor( ... ) in the beginning of this method. And then,
   *   - Call SelfClassXxx.setAsConstructor_self.call( this, ... ).
   *
   * Note: This method must return "this" because Pool.Base.get_or_create_by() needs it.
   *
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

    Base.setAsConstructor_self.call( this );

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

