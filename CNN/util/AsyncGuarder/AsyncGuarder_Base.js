export { AsyncGuarder_Base as Base };
export { AsyncGuarder_Root as Root };

import * as ClassHierarchyTools from "../ClassHierarchyTools.js";
import * as Pool from "../Pool.js";
//import * as Recyclable from "../Recyclable.js";
//import * as ValueMax from "../ValueMax.js";

/**
 * A wrapper class for preventing an underlied async generator from being
 * reentered.
 *
 *
 * @member {AsyncGeneratorFunction} underlied_asyncGenerator_func
 *   A private property recording the function to create a underlied async
 * generator which wants to be guarded by the .Xxx_asyncGenerator_running
 * boolean flag.
 *   - It will be called with thisArg as "this".
 *   - Its 1st parameter must be progressParent (ValueMax.Percentage.Aggregate).
 *
 * @member {boolean} Xxx_asyncGenerator_running
 *   If true, a underlied async generator (i.e. .Xxx_asyncGenerator_guarded())
 * is still executing. Please wait it becoming false if wanting to call
 * .Xxx_asyncGenerator_create() again. The Xxx is name_prefix.
 *
 * @member {Function} Xxx_asyncGenerator_create
 *   A method for creating the underlied async generator. If an old instnace
 * is still executing, it will throw exception.
 *
 * @member {Function} Xxx_throw_if_asyncPromise_or_asyncGenerator_running
 *   A static method for throwing excption if .XXX_asyncPromise_running or
 * .XXX_asyncGenerator_running is true.
 *
 */
let AsyncGuarder_Base
  = ( ParentClass = Object ) => class AsyncGuarder_Base
      extends ParentClass {

  #underlied_asyncGenerator_func;

  #asyncGenerator_running;

  #name_of_asyncPromise_running;
  #name_of_asyncGenerator_running;
  #name_of_asyncGenerator_create;
  #name_of_asyncGenerator_guarded;
  #name_of_throw_if_asyncPromise_or_asyncGenerator_running;


  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   */
  constructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super( ...restArgs );
    AsyncGuarder_Base.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    AsyncGuarder_Base.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix, underlied_asyncGenerator_func ) {

    this.#underlied_asyncGenerator_func = underlied_asyncGenerator_func;

    // Note:
    //
    // Although the property .Xxx_asyncPromise_running will not be created by this
    // AsyncGuarder_Base class (it will be created by sub-class
    // AsyncGuarder_RecyclableBase), however, this class will
    // try to check the property. So, its name should still be prepared.
    //
    this.#name_of_asyncPromise_running
      = `${name_prefix}_asyncPromise_running`;

    this.#name_of_asyncGenerator_running
      = `${name_prefix}_asyncGenerator_running`;

    this.#name_of_asyncGenerator_create
      = `${name_prefix}_asyncGenerator_create`;

    this.#name_of_asyncGenerator_guarded
      = `${name_prefix}_asyncGenerator_guarded`;

    this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running
      = `${name_prefix}_throw_if_asyncPromise_or_asyncGenerator_running`;

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_asyncGenerator_running
      Reflect.defineProperty( this,
        this.#name_of_asyncGenerator_running,
        AsyncGuarder_Base.propertyDescriptor_of_asyncGenerator_running );
    }

    // Define shared instance (i.e. this.constructor.prototype's) properties.
    {
      // Xxx_asyncGenerator_create()
      Reflect.defineProperty( this.constructor.prototype,
        this.#name_of_asyncGenerator_create,
        AsyncGuarder_Base
          .propertyDescriptor_of_asyncGenerator_create );
    }

    // Define static (i.e. this.constructor's) properties.
    {
      // Xxx_throw_if_asyncPromise_or_asyncGenerator_running()
      Reflect.defineProperty( this.constructor,
        this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running,
        AsyncGuarder_Base
          .propertyDescriptor_of_throw_if_asyncPromise_or_asyncGenerator_running );
    }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this,
      this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running );

    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_create );

    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_running );

    this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running = undefined;
    this.#name_of_asyncGenerator_guarded = undefined;
    this.#name_of_asyncGenerator_create = undefined;
    this.#name_of_asyncGenerator_running = undefined;
    this.#name_of_asyncPromise_running = undefined;

    this.#asyncGenerator_running = undefined;

    this.#underlied_asyncGenerator_func = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }


  /**
   * Property descriptor for Xxx_asyncGenerator_running.
   * (as enumerable read-only properties).
   */
  static propertyDescriptor_of_asyncGenerator_running = 
    { get() { return this.#asyncGenerator_running; }, enumerable: true };


  /**
   * Property descriptor for Xxx_asyncGenerator_create().
   */
  static propertyDescriptor_of_asyncGenerator_create = {
    value: AsyncGuarder_Base.asyncGenerator_create
  };

  /**
   * Create Xxx_asyncGenerator (an instance of guarded underlied asyn generator).
   *
   * @return {AsyncGenerator}
   *   Return the newly created instance of .guarded_underlined_asyncGenerator().
   */
  static asyncGenerator_create( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_asyncGenerator_create;

      AsyncGuarder_Base.throw_if_an_old_still_running.call( this,
        this.#asyncGenerator_running, funcNameInMessage );

      AsyncGuarder_Base.throw_if_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );
    }

    let asyncGenerator = AsyncGuarder_Base
      .asyncGenerator_create_without_checking_precondition
      .apply( this, restArgs );
    return asyncGenerator;
  }

  /**
   *
   * @param {AsyncGuarder_Base} this
   *
   * @return {AsyncGenerator}
   *   Return the newly created instance of .guarded_underlined_asyncGenerator().
   */
  static asyncGenerator_create_without_checking_precondition( ...restArgs ) {
    this.#asyncGenerator_running = true;
    let asyncGenerator = AsyncGuarder_Base
      .guarded_underlined_asyncGenerator.apply( this, restArgs );
    return asyncGenerator;
  }

  /**
   * The guarded underlied async generator.
   *
   * @param {AsyncGuarder_Base} this
   */
  static async* guarded_underlined_asyncGenerator( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_asyncGenerator_guarded;

      AsyncGuarder_Base.throw_call_another_if_false.call( this,
        this.#asyncGenerator_running, funcNameInMessage,
        this.#name_of_asyncGenerator_create );
    }

    try {
      // 1.
      let underlied_asyncGenerator
        = this.#underlied_asyncGenerator_func.apply( this, restArgs );

      let result = yield *underlied_asyncGenerator;
      return result;

    } catch ( e ) {
      //debugger;
      throw e;

    } finally {
      // 2. So that this async generator could be executed again.
      this.#asyncGenerator_running = false;
    }
  }


  /**
   * Property descriptor for Xxx_throw_if_asyncPromise_or_asyncGenerator_running().
   */
  static propertyDescriptor_of_throw_if_asyncPromise_or_asyncGenerator_running = {
    value: AsyncGuarder_Base
             .throw_if_asyncPromise_or_asyncGenerator_running
  };

  /**
   * @param {AsyncGuarder_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_asyncPromise_or_asyncGenerator_running(
    funcNameInMessage ) {

    const mostDerivedClassName
      = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

    // Note: Property .Xxx_asyncPromise_running is created by sub-class
    //       (if exists).
    let b_asyncPromise_running = this[ this.#name_of_asyncPromise_running ];

    if (   ( b_asyncPromise_running )
        || ( this.#asyncGenerator_running ) )
      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should not be executed while `
        + `.${this.#name_of_asyncPromise_running}() or `
        + `.${this.#name_of_asyncGenerator_running}() `
        + `still running.` );
  }

  /**
   * @param {AsyncGuarder_Base} this
   * @param {boolean} b_still_running    If true, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {

    const mostDerivedClassName
      = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

    if ( b_still_running )
      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `An old .${funcNameInMessage}() is still running.` );
  }

  /**
   * @param {AsyncGuarder_Base} this
   * @param {boolean} b                  If false, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   * @param {string} funcNameShouldBeCalledInMessage
   *   The function name which should be called instead. (e.g. init_promise_create)
   */
  static throw_call_another_if_false(
    b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

    const mostDerivedClassName
      = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

    if ( !b )
      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
  }

}


/**
 * Almost the same as AsyncGuarder_Base class except its parent
 * class is fixed to Object. In other words, caller can not specify the parent
 * class of AsyncGuarder_Root (so it is named "Root" which can not
 * have parent class).
 */
class AsyncGuarder_Root extends AsyncGuarder_Base() {
}
