export { asyncGenerator_Guardian_Base };
export { asyncGenerator_Guardian_Root };

import * as ClassHierarchyTools from "../../util/ClassHierarchyTools.js";
import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
//import * as ValueMax from "./ValueMax.js";

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
 * @member {Function} Xxx_throw_if_async_or_asyncGenerator_running
 *   A static method for throwing excption if .XXX_async_running or
 * .XXX_asyncGenerator_running is true.
 *
 */
let asyncGenerator_Guardian_Base
  = ( ParentClass = Object ) => class asyncGenerator_Guardian_Base
      extends ParentClass {

  #underlied_asyncGenerator_func;

  #asyncGenerator_running;

  #name_of_async_running;
  #name_of_asyncGenerator_running;
  #name_of_asyncGenerator_create;

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//  #name_of_asyncGenerator_create_without_checking_precondition;

  #name_of_asyncGenerator_guarded;
  #name_of_throw_if_async_or_asyncGenerator_running;


  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   */
  constructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super( ...restArgs );
    asyncGenerator_Guardian_Base.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    asyncGenerator_Guardian_Base.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix, underlied_asyncGenerator_func ) {

    this.#underlied_asyncGenerator_func = underlied_asyncGenerator_func;

    // Note:
    //
    // Although the property .Xxx_async_running will not be created by this
    // asyncGenerator_Guardian_Base class (it will be created by sub-class
    // asyncGenerator_Guardian_RecyclableBase), however, this class will
    // try to check the property. So, its name should still be prepared.
    //
    this.#name_of_async_running
      = `${name_prefix}_async_running`;

    this.#name_of_asyncGenerator_running
      = `${name_prefix}_asyncGenerator_running`;

    this.#name_of_asyncGenerator_create
      = `${name_prefix}_asyncGenerator_create`;

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//     this.#name_of_asyncGenerator_create_without_checking_precondition
//       = `${name_prefix}_asyncGenerator_create_without_checking_precondition`;

    this.#name_of_asyncGenerator_guarded
      = `${name_prefix}_asyncGenerator_guarded`;

    this.#name_of_throw_if_async_or_asyncGenerator_running
      = `${name_prefix}_throw_if_async_or_asyncGenerator_running`;

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_asyncGenerator_running
      Reflect.defineProperty( this,
        this.#name_of_asyncGenerator_running,
        asyncGenerator_Guardian_Base.propertyDescriptor_of_asyncGenerator_running );
    }

    // Define shared instance (i.e. this.constructor.prototype's) properties.
    {
      // Xxx_asyncGenerator_create()
      Reflect.defineProperty( this.constructor.prototype,
        this.#name_of_asyncGenerator_create,
        asyncGenerator_Guardian_Base
          .propertyDescriptor_of_asyncGenerator_create );
    }

    // Define static (i.e. this.constructor's) properties.
    {

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//       // Xxx_throw_if_async_or_asyncGenerator_running()
//       Reflect.defineProperty( this.constructor,
//         this.#name_of_asyncGenerator_create_without_checking_precondition,
//         asyncGenerator_Guardian_Base
//           .propertyDescriptor_of_asyncGenerator_create_without_checking_precondition );

      // Xxx_throw_if_async_or_asyncGenerator_running()
      Reflect.defineProperty( this.constructor,
        this.#name_of_throw_if_async_or_asyncGenerator_running,
        asyncGenerator_Guardian_Base
          .propertyDescriptor_of_throw_if_async_or_asyncGenerator_running );
    }
  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2023/03/24)

    Reflect.deleteProperty( this,
      this.#name_of_throw_if_async_or_asyncGenerator_running );

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//     Reflect.deleteProperty( this,
//       this.#name_of_asyncGenerator_create_without_checking_precondition );

    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_create );

    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_running );

    this.#name_of_throw_if_async_or_asyncGenerator_running = undefined;
    this.#name_of_asyncGenerator_guarded = undefined;

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//    this.#name_of_asyncGenerator_create_without_checking_precondition = undefined;

    this.#name_of_asyncGenerator_create = undefined;
    this.#name_of_asyncGenerator_running = undefined;
    this.#name_of_async_running = undefined;

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
    value: asyncGenerator_Guardian_Base.asyncGenerator_create
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

      asyncGenerator_Guardian_Base.throw_if_an_old_still_running.call( this,
        this.#asyncGenerator_running, funcNameInMessage );

      asyncGenerator_Guardian_Base.throw_if_async_or_asyncGenerator_running
        .call( this, funcNameInMessage );
    }

    let asyncGenerator = asyncGenerator_Guardian_Base
      .asyncGenerator_create_without_checking_precondition
      .apply( this, restArgs );
    return asyncGenerator;
  }

//!!! (2023/03/24 Remarked)
// sub-class should call .asyncGenerator_create_without_checking_precondition() directly.
//   /**
//    * Property descriptor for Xxx_throw_if_async_or_asyncGenerator_running().
//    */
//   static propertyDescriptor_of_asyncGenerator_create_without_checking_precondition = {
//     value: asyncGenerator_Guardian_Base
//              .asyncGenerator_create_without_checking_precondition
//   };

  /**
   *
   * @param {asyncGenerator_Guardian_Base} this
   *
   * @return {AsyncGenerator}
   *   Return the newly created instance of .guarded_underlined_asyncGenerator().
   */
  static asyncGenerator_create_without_checking_precondition( ...restArgs ) {
    this.#asyncGenerator_running = true;
    let asyncGenerator = asyncGenerator_Guardian_Base
      .guarded_underlined_asyncGenerator.apply( this, restArgs );
    return fetcher;
  }

  /**
   * The guarded underlied async generator.
   *
   * @param {asyncGenerator_Guardian_Base} this
   */
  static async* guarded_underlined_asyncGenerator( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_asyncGenerator_guarded;

      asyncGenerator_Guardian_Base.throw_call_another_if_false.call( this,
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
   * Property descriptor for Xxx_throw_if_async_or_asyncGenerator_running().
   */
  static propertyDescriptor_of_throw_if_async_or_asyncGenerator_running = {
    value: asyncGenerator_Guardian_Base.throw_if_async_or_asyncGenerator_running
  };

  /**
   * @param {asyncGenerator_Guardian_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_async_or_asyncGenerator_running( funcNameInMessage ) {

    const mostDerivedClassName
      = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

    // Note: Property .Xxx_async_running is created by sub-class (if exists).
    let b_async_running = this[ this.#name_of_async_running ];

    if (   ( b_async_running )
        || ( this.#asyncGenerator_running ) )
      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should not be executed while `
        + `.${this.#name_of_async_running}() or `
        + `.${this.#name_of_asyncGenerator_running}() `
        + `still running.` );
  }

  /**
   * @param {asyncGenerator_Guardian_Base} this
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
   * @param {asyncGenerator_Guardian_Base} this
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

//!!! ...unfinished... (2023/03/24)

}


/**
 * Almost the same as asyncGenerator_Guardian_Base class except its parent
 * class is fixed to Object. In other words, caller can not specify the parent
 * class of asyncGenerator_Guardian_Root (so it is named "Root" which can not
 * have parent class).
 */
class asyncGenerator_Guardian_Root extends asyncGenerator_Guardian_Base() {
}
