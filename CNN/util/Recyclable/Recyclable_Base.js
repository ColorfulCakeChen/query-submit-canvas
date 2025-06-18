export { Recyclable_Base as Base, Root };

import * as Pool from "../Pool.js";

/**
 * The base class representing a object could be recycled (i.e. disposed
 * without release its main object memory for re-using in the future).
 *
 *
 * 1.
 *
 * Every sub-class of this Recyclable.Base MUST define a static propery named
 * Pool which is usually an instance of Pool.Base:
 * <pre>
 * class SomeClass extends Recyclable.Base {
 *
 *   static Pool = new Pool.Root( "SomeNamespace.SomeClass",
 *     SomeClass );
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
 * SomeClass.Pool = new Pool.Root( "SomeNamespace.SomeClass",
 *   SomeClass );
 *
 * </pre>
 *
 *
 * 2.
 *
 * Every sub-class of this Recyclable.Base MUST define:
 *
 *   - An instance method named .setAsConstructor().
 *
 *       - It is responsible for initializing the object just like the object
 *           itself's constructor.
 *
 *       - (That is, call super.setAsConstructor() and then initialize itself's
 *           data members.)
 *
 *       - Before Pool.Base.get_or_create_by() returns a  recycled object, the
 *           recycled object's .setAsConstructor() method will be called to
 *           (re-)initilaize the object.
 *
 *   - An instance method named .disposeResources().
 *
 *       - It should release itself's resources and then call
 *           super.disposeResources() in cascade.
 *
 *       - It is called by
 *           Recyclable_Base.disposeResources_and_recycleToPool().
 *
 */
let Recyclable_Base = ( ParentClass = Object ) => class Recyclable_Base
  extends ParentClass {

  /**
   * Sub-class's constructor could call itself .#setAsConstructor_self() (i.e.
   * do NOT call .setAsConstructor() because super() will do revursively
   * already).
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    this.#setAsConstructor_self();
  }

  /**
   * Setup recursively. This method mimics constructor's behavior.
   *
   * Sub-class should override this static method:
   *   - Call super.setAsConstructor( ... ) in the beginning of this method.
   *       And then,
   *   - Call this.#setAsConstructor_self( ... ).
   *
   */
  setAsConstructor( ...restArgs ) {

    // If parent class has the same method, call it.
    if ( super.setAsConstructor instanceof Function )
      super.setAsConstructor( ...restArgs );

    this.#setAsConstructor_self();
  }

  /**
   * Setup self only (i.e. NOT recursively).
   *
   * Sub-class should override this static method (and NEVER call
   * super.setAsConstructor() in the beginning of this method).
   *
   * Note: This method needs NOT return "this".
   *
   *
   * @param {Base} this
   *   The Recyclable.Base object to be initialized.
   */
  #setAsConstructor_self() {
    // Nothing to do here (for Recyclable.Base).
  }

  /**
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   */
  disposeResources() {

    // Nothing to do here (for Recyclable.Base).

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }

  /**
   * This method will do the following in sequence:
   *   - call this.disposeResources() (if exists)
   *   - call this.constructor.Pool.recycle()
   *
   * Sub-class should NEVER override this method (so NEVER call
   * super.disposeResources_and_recycleToPool()).
   *
   *
   * After calling this method, this object should be viewed as disposed and
   * should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    this.constructor.Pool.recycle( this ); // The most derived class's Pool.
  }

}


/**
 * Almost the same as Recyclable.Base class except its parent class is fixed to
 * Object. In other words, caller can not specify the parent class of
 * Recyclable.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Recyclable_Base() {
}

