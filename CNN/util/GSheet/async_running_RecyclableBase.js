export { asyncGenerator_Guardian_RecyclableBase };
export { asyncGenerator_Guardian_RecyclableRoot };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";
import { asyncGenerator_Guardian_Base } from "./asyncGenerator_Guardian_Base.js";

/**
 * A recyclable wrapper class for preventing an underlied async generator from
 * being reentered.
 *
 *
 *
 * @member {boolean} Xxx_async_running
 *   If true, a underlied async method (i.e. .Xxx_async()) is still executing.
 * Please wait it becoming false if wanting to call .Xxx_promise_create()
 * again. The Xxx is name_prefix.
 *
 * @member {Function} Xxx_promise_create
 *   A method for creating the underlied async method. If an old instnace
 * is still executing, it will throw exception.
 *

//!!! ...unfinished... (2023/03/23)

 * @member {ValueMax.Percentage.Aggregate} Xxx_async_progress
 *   The progress of .Xxx_async(). If ( .Xxx_async_progress.valuePercentage == 100 ),
 * the .Xxx_async() has done.
 *   - It is used only if .Xxx_promise_create() is called.
 *   - It is not used if .Xxx_asyncGenerator_create() is called directly. In this
 *       case, its progressParent parameter will be used instead.
 */
let asyncGenerator_Guardian_RecyclableBase
  = ( ParentClass = Object ) => class asyncGenerator_Guardian_RecyclableBase
      extends asyncGenerator_Guardian_Base( Recyclable.Base( ParentClass ) ) {

  /**
   * Used as default asyncGenerator_Guardian_RecyclableBase provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "asyncGenerator_Guardian_RecyclableBase.Pool",
    asyncGenerator_Guardian_RecyclableBase,
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor );

  #async_running;
  #async_progress;

  #name_of_async_running;
  #name_of_promise_create;

  #name_of_async_progress;


  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   *
   * @param {AsyncGeneratorFunction} underlied_asyncGenerator_func
   *   A private property recording the function to create a underlied async
   * generator which wants to be guarded by the .Xxx_asyncGenerator_running
   * boolean flag.
   *   - It will be called with thisArg as "this".
   *   - Its 1st parameter must be progressParent (ValueMax.Percentage.Aggregate).
   */
  constructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super( name_prefix, underlied_asyncGenerator_func, ...restArgs );
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super.setAsConstructor.call( this,
      name_prefix, underlied_asyncGenerator_func, ...restArgs );
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix, underlied_asyncGenerator_func ) {

    this.#name_of_async_running
      = `${name_prefix}_async_running`;

    this.#name_of_promise_create
      = `${name_prefix}_promise_create`;

    this.#name_of_async_progress
      = `${name_prefix}_async_progress`;

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_async_running
      Reflect.defineProperty( this,
        this.#name_of_async_running,
        asyncGenerator_Guardian_RecyclableBase
          .propertyDescriptor_of_async_running );

      // Xxx_async_progress
      Reflect.defineProperty( this,
        this.#name_of_async_progress,
        asyncGenerator_Guardian_RecyclableBase
          .propertyDescriptor_of_async_progress );
    }

    // Define shared instance (i.e. this.constructor.prototype's) properties.
    {
      // Xxx_promise_create()
      Reflect.defineProperty( this.constructor.prototype,
        this.#name_of_promise_create,
        asyncGenerator_Guardian_RecyclableBase
          .propertyDescriptor_of_promise_create );
    }

    // Define static (i.e. this.constructor's) properties.
    {
//!!! ...unfinished... (2023/03/24)
    }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#name_of_async_progress );
    Reflect.deleteProperty( this, this.#name_of_promise_create );
    Reflect.deleteProperty( this, this.#name_of_async_running );

    this.#name_of_async_progress = undefined;
    this.#name_of_promise_create = undefined;
    this.#name_of_async_running = undefined;

    asyncGenerator_Guardian_RecyclableBase.async_progress_dispose.call( this );

    this.#async_running = undefined;

//!!! ...unfinished... (2023/03/23)

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }

  /**
   * Property descriptor for Xxx_async_running.
   * (as enumerable read-only properties).
   */
  static propertyDescriptor_of_async_running = 
    { get() { return this.#async_running; }, enumerable: true };


  /**
   * Property descriptor for Xxx_async_progress.
   * (as enumerable read-only properties).
   */
  static propertyDescriptor_of_async_progress = 
    { get() { return this.#async_progress; }, enumerable: true };

  /**
   * @param {asyncGenerator_Guardian_RecyclableBase} this
   */
  static async_progress_create() {
    asyncGenerator_Guardian_RecyclableBase.async_progress_dispose.call( this );
    this.#async_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {asyncGenerator_Guardian_RecyclableBase} this
   */
  static async_progress_dispose() {
    if ( this.#async_progress ) {
      this.#async_progress.disposeResources_and_recycleToPool();
      this.#async_progress = null;
    }
  }


  /**
   * Property descriptor for Xxx_promise_create().
   */
  static propertyDescriptor_of_promise_create = {
    value: asyncGenerator_Guardian_Base.promise_create
  };

  /**
   * Create Xxx_async (an auto-loop instance of guarded underlied asyn generator).
   *
   * Note: The this.#async_progress will record progress of this method.
   *
   *
   * @return {Promise}
   *   Return the newly created .Xxx_async() promise.
   */
  static promise_create( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_promise_create;

      asyncGenerator_Guardian_RecyclableBase.throw_if_an_old_still_running
        .call( this, this.#async_running, funcNameInMessage );

      asyncGenerator_Guardian_RecyclableBase
        .throw_if_async_or_asyncGenerator_running
        .call( this, funcNameInMessage );
    }

    // 1.
    let asyncGenerator;
    {
      // Use internal independent progress.
      asyncGenerator_Guardian_RecyclableBase.async_progress_create.call( this );

      // Prepare asyncGenerator
      //
      // Note: The .asyncGenerator_create_without_checking_precondition() is
      //       defined in the parent classs.
      asyncGenerator = asyncGenerator_Guardian_RecyclableBase
        .asyncGenerator_create_without_checking_precondition
        .call( this, this.#async_progress, ...restArgs );
    }

//!!! ...unfinished... (2023/03/24)
    // 2.
    return GSheets_UrlComposer
      .JSON_ColumnMajorArrayArray_fetch_promise_create_without_checking_precondition
      .call( this, fetcher );
  }

//!!! ...unfinished... (2023/03/24)
  /**
   *
   * @param {GSheets_UrlComposer} this
   *
   * @param {AsyncGenerator} fetcher
   *   The async generator (an instance of
   * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()) to be wrapped by the
   * created promise.
   *
   * @return {Promise( Array[] )}
   *   Return the newly created JSON_ColumnMajorArrayArray_fetch_promise which
   * is an instance of .JSON_ColumnMajorArrayArray_fetch_async().
   */
  static JSON_ColumnMajorArrayArray_fetch_promise_create_without_checking_precondition(
    fetcher ) {

    this.fetch_async_running = true;
    let fetch_promise = GSheets_UrlComposer
      .JSON_ColumnMajorArrayArray_fetch_async.call( this, fetcher );
    return JSON_ColumnMajorArrayArray_fetch_promise;
  }

//!!! ...unfinished... (2023/03/24)
  /**
   * Composing the URL (according to this object's data members), download
   * it as JSON format, extract data as a two dimension (column-major) array.
   *
   * @param {AsyncGenerator} fetcher
   *   The async generator (an instance of
   * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()) to be wrapped by the
   * created promise.
   *
   * @return {Promise( Array[] )}
   *   Return a promise.
   *   - Resolved to ( a two dimension (column-major) array ) when successful.
   *   - Resolved to ( null ) when failed.
   */
  static async JSON_ColumnMajorArrayArray_fetch_async( fetcher ) {

    { // Checking pre-condition.
      const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_async";

      GSheets_UrlComposer.throw_call_another_if_false.call( this,
        this.fetch_async_running, funcNameInMessage,
        "JSON_ColumnMajorArrayArray_fetch_promise_create" );
    }

    try {
      // 1.
      if ( !fetcher )
        throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
          + `fetcher should have already existed.` );

      let fetcherNext;
      do {
        fetcherNext = await fetcher.next();
      } while ( !fetcherNext.done );

      let resultColumnMajorArrayArray = fetcherNext.value;
      return resultColumnMajorArrayArray;

    } catch ( e ) {
      //console.error( e );
      //debugger;
      throw e; // Unknown error, should be said loundly.

    } finally {
      // 2. So that this async method could be executed again.
      this.fetch_async_running = false;
    }
  }

}


/**
 * Almost the same as asyncGenerator_Guardian_RecyclableBase class except its
 * parent class is fixed to Object. In other words, caller can not specify the
 * parent class of asyncGenerator_Guardian_RecyclableRoot (so it is named
 * "Root" which can not have parent class).
 */
class asyncGenerator_Guardian_RecyclableRoot
  extends asyncGenerator_Guardian_RecyclableBase() {
}
