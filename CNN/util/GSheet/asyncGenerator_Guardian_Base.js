export { asyncGenerator_Guardian_Base };
export { asyncGenerator_Guardian_Root };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";


//!!! ...unfinished... (2023/03/23)

/**
 * A wrapper class for preventing an underlied async generator from being
 * reentered.
 *
 *
 * @member {AsyncGeneratorFunction} underlied_asyncGenerator_func
 *   The function to create a underlied async generator which wants to be
 * guarded by the .Xxx_asyncGenerator_running boolean flag. It will be called
 * with thisArg as "this".
 *
 * @member {boolean} Xxx_asyncGenerator_running
 *   If true, a underlied async generator (i.e. .Xxx_asyncGenerator_guarded())
 * is still executing. Please wait it becoming false if wanting to call
 * .Xxx_asyncGenerator_create() again. The Xxx is name_prefix.
 *

//!!! ...unfinished... (2023/03/23)

 */
let asyncGenerator_Guardian_Base
  = ( ParentClass = Object ) => class asyncGenerator_Guardian_Base
      extends ParentClass {

  #underlied_asyncGenerator_func;

  // Whether an async generator executing.
  #asyncGenerator_running;

  // the properties' names.
  #name_of_asyncGenerator_running;
  #name_of_asyncGenerator_create;
  #name_of_guarded_asyncGenerator;

  // Property descriptor for the getters (as enumerable read-only properties).
  static propertyDescriptor_asyncGenerator_running = 
    { get() { return this.#asyncGenerator_running; }, enumerable: true };



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

//!!! ...unfinished... (2023/03/24)    
    this.#underlied_asyncGenerator_func = underlied_asyncGenerator_func;

    this.#name_of_asyncGenerator_running
      = `${name_prefix}_asyncGenerator_running`;

    this.#name_of_asyncGenerator_create
      = `${name_prefix}_asyncGenerator_create`;

    this.#name_of_guarded_asyncGenerator
      = `${name_prefix}_guarded_asyncGenerator`;

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_asyncGenerator_running
      Reflect.defineProperty( this,
        this.#name_of_asyncGenerator_running,
        asyncGenerator_Guardian_Base.propertyDescriptor_asyncGenerator_running );
    }

    // Define static (i.e. this.constructor's) properties.
    {
      // Xxx_guarded_asyncGenerator_create
      Reflect.defineProperty( this.constructor,
        this.#name_of_asyncGenerator_create,
        asyncGenerator_Guardian_Base
          .propertyDescriptor_of_asyncGenerator_create );

      // Xxx_guarded_asyncGenerator
      Reflect.defineProperty( this.constructor,
        this.#name_of_guarded_asyncGenerator,
        asyncGenerator_Guardian_Base
          .propertyDescriptor_of_guarded_asyncGenerator );
    }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#name_of_guarded_asyncGenerator );
    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_create );

//!!! ...unfinished... (2023/03/24)    
    
    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_running );

    this.#name_of_guarded_asyncGenerator = undefined;
    this.#name_of_asyncGenerator_running = undefined;

    this.#asyncGenerator_running = undefined;

    this.#underlied_asyncGenerator_func = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }


  /**
   * Property descriptor for Xxx_asyncGenerator_create().
   *
   * @param {asyncGenerator_Guardian_Base} this
   */
  static propertyDescriptor_of_asyncGenerator_create = {
    value( ...restArgs ) {

//!!! ...unfinished... (2023/03/23)

    { // Checking pre-condition.
      const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetcher_create";

      GSheets_UrlComposer.throw_if_an_old_still_running.call( this,
        this.fetch_asyncGenerator_running, funcNameInMessage );

      GSheets_UrlComposer.throw_if_fetching.call( this, funcNameInMessage );
    }

    let fetcher = GSheets_UrlComposer
      .JSON_ColumnMajorArrayArray_fetcher_create_without_checking_precondition
      .call( this, progressParent, params_loading_retryWaiting, delayPromise );
    return fetcher;
  }

//!!!
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

//!!! ...unfinished... (2023/03/24)    
//   /**
//    * Property descriptor for guarded underlied async generator.
//    */
//   static propertyDescriptor_of_guarded_asyncGenerator = {
//     value: asyncGenerator_Guardian_Base.guarded_asyncGenerator
//   };

  /**
   * The guarded underlied async generator.
   *
   * @param {asyncGenerator_Guardian_Base} this
   */
  static async* guarded_underlined_asyncGenerator( ...restArgs ) {

//!!! ...unfinished... (2023/03/24)    

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_guarded_asyncGenerator;

      GSheets_UrlComposer.throw_call_another_if_false.call( this,
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
   * @param {GSheets_UrlComposer} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_fetching( funcNameInMessage ) {
    if (   ( this.fetch_async_running )
        || ( this.fetch_asyncGenerator_running ) )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `should not be executed while still fetching.` );
  }

  /**
   * @param {GSheets_UrlComposer} this
   * @param {boolean} b_still_running    If true, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
    if ( b_still_running )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `An old .${funcNameInMessage}() is still running.` );
  }

  /**
   * @param {GSheets_UrlComposer} this
   * @param {boolean} b                  If false, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   * @param {string} funcNameShouldBeCalledInMessage
   *   The function name which should be called instead. (e.g. init_promise_create)
   */
  static throw_call_another_if_false(
    b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

    if ( !b )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
  }

//!!! ...unfinished... (2023/03/23)
// These methods' names should also be specified by caller.
//
// Xxx_promise_create()
// Xxxer_create()
//
// Define static method as property of this.constructor
// Define non-static shared method as property of this.constructor.prototype
}


/**
 * Almost the same as asyncGenerator_Guardian_Base class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of asyncGenerator_Guardian_Root (so it is named "Root" which can not have
 * parent class).
 */
class asyncGenerator_Guardian_Root extends asyncGenerator_Guardian_Base() {
}

