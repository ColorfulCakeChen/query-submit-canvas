export { async_running_Base };
export { async_running_Root };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";


//!!! ...unfinished... (2023/03/23)

/**
 *
 *
 *
 * @member {AsyncGeneratorFunction} underlie_asyncGenerator_func
 *   The function to create underlie async generator which wants to be guarded
 * by the .Xxx_asyncGenerator_running boolean flag.
 *
 * @member {boolean} Xxx_asyncGenerator_running
 *   If true, a underlie async generator (i.e. .Xxx_asyncGenerator()) is still
 * executing. Please wait it becoming false if wanting to call
 * .Xxx_asyncGenerator_create() again. The Xxx is name_prefix.
 *

//!!! ...unfinished... (2023/03/23)

 */
let async_running_Base
  = ( ParentClass = Object ) => class async_running_Base
      extends ParentClass {

  #underlie_asyncGenerator_func;

  // Whether an async generator executing.
  #asyncGenerator_running;

  // the getters' names.
  #getter_name_of_asyncGenerator_running;

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
    name_prefix, underlie_asyncGenerator_func, ...restArgs ) {

    super( ...restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      name_prefix, underlie_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor(
    name_prefix, underlie_asyncGenerator_func, ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      name_prefix, underlie_asyncGenerator_func );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix, underlie_asyncGenerator_func ) {

//!!! ...unfinished... (2023/03/24)    
//    underlie_asyncGenerator_func

    this.#getter_name_of_asyncGenerator_running
      = `${name_prefix}_asyncGenerator_running`;

    // Define read-only properties (for the two flags) as the specified names.
    {
      Reflect.defineProperty( this,
        this.#getter_name_of_asyncGenerator_running,
        async_running_Base.propertyDescriptor_asyncGenerator_running );
    }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#getter_name_of_asyncGenerator_running );

    this.#getter_name_of_asyncGenerator_running = undefined;

    this.#asyncGenerator_running = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }


//!!! ...unfinished... (2023/03/23)

  /**
   * Create JSON_ColumnMajorArrayArray_fetcher (an instance of
   * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()).
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, the async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {AsyncGenerator}
   *   Return the newly created JSON_ColumnMajorArrayArray_fetcher which is an
   * instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
   */
  asyncGenerator_create( ...restArgs ) {

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
   * Create an instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
   *
   *
   * @param {GSheets_UrlComposer} this
   *
   * @return {AsyncGenerator}
   *   Return the newly created JSON_ColumnMajorArrayArray_fetcher which is an
   * instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
   */
  static JSON_ColumnMajorArrayArray_fetcher_create_without_checking_precondition(
    progressParent, params_loading_retryWaiting, delayPromise ) {

    this.fetch_asyncGenerator_running = true;

    let fetcher = GSheets_UrlComposer
      .JSON_ColumnMajorArrayArray_fetch_asyncGenerator.call( this,
        progressParent, params_loading_retryWaiting, delayPromise );
    return fetcher;
  }


//!!!
  /**
   * Property descriptor for guarded underlie async generator.
   *
   * @param {AsyncGenerator} underlie_asyncGenerator
   *   The underlie async generator which wants to be guarded by the
   * .Xxx_asyncGenerator_running boolean flag.
   */
  static propertyDescriptor_asyncGenerator_guarded = { value: async* (
    underlie_asyncGenerator ) {

    { // Checking pre-condition.
      const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_asyncGenerator";

      GSheets_UrlComposer.throw_call_another_if_false.call( this,
        this.fetch_asyncGenerator_running, funcNameInMessage,
        "JSON_ColumnMajorArrayArray_fetcher_create" );
    }

    try {
      // 1.
      let fetcher_underlie = this.urlComposer
        .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
          progressParent, params_loading_retryWaiting );

      let ColumnMajorArrayArray = yield *fetcher_underlie;

      // 2.
      if ( delayPromise )
        await delayPromise;

      return ColumnMajorArrayArray;

    } catch ( e ) {
      //debugger;
      throw e;

    } finally {
      // 3. So that this async generator could be executed again.
      this.fetch_asyncGenerator_running = false;
    }
  }
  };


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
 * Almost the same as async_running_Base class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of async_running_Root (so it is named "Root" which can not have
 * parent class).
 */
class async_running_Root extends async_running_Base() {
}

