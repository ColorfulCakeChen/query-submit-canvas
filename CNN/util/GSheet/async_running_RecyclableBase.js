export { asyncGenerator_Guardian_RecyclableBase };
export { asyncGenerator_Guardian_RecyclableRoot };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";
import { asyncGenerator_Guardian_Base } from "./asyncGenerator_Guardian_Base.js";


//!!! ...unfinished... (2023/03/23)

/**
 *
 *
 *
 *
 * @member {boolean} async_running
 *   If true, a .Xxx_async() is still executing. Please wait it becoming false
 * if wanting to call .Xxx_async() again. From outside caller's view, this
 * property is represented by a getter named as name_of_async_running.
 *

//!!! ...unfinished... (2023/03/23)

 * @member {ValueMax.Percentage.Aggregate} fetch_progress
 *   The progress of fetching. If ( .fetch_progress.valuePercentage == 100 ),
 * the fetching has done.
 *   - It is used only if .JSON_ColumnMajorArrayArray_fetch_async() is called.
 *   - If .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() is called directly,
 *       its progressParent parameter will be used instead.
 */
let asyncGenerator_Guardian_RecyclableBase
  = ( ParentClass = Object ) => class asyncGenerator_Guardian_RecyclableBase
      extends asyncGenerator_Guardian_Base( Recyclable.Base( ParentClass ) ) {

//!!! (2023/03/23 Remarked)

  /**
   * Used as default asyncGenerator_Guardian_RecyclableBase provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "asyncGenerator_Guardian_RecyclableBase.Pool",
    asyncGenerator_Guardian_RecyclableBase,
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor );

  // Whether an async method executing.
  #async_running;

  // getters' names.
  #getter_name_of_async_running;

  // Property descriptor for the getters (as enumerable read-only properties).
  static propertyDescriptor_of_async_running = 
    { get() { return this.#async_running; }, enumerable: true };


  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   */
  constructor( name_prefix, ...restArgs ) {

    super( name_prefix, ...restArgs );
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor_self.call( this, name_prefix );
  }

  /** @override */
  static setAsConstructor( name_prefix, ...restArgs ) {

    super.setAsConstructor.call( this, name_prefix,...restArgs );
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor_self.call( this, name_prefix );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix ) {

    this.#getter_name_of_async_running
      = `${name_prefix}_async_running`;

    // Define read-only properties (for the two flags) as the specified names.
    {
      Reflect.defineProperty( this,
        this.#getter_name_of_async_running,
        asyncGenerator_Guardian_RecyclableBase.propertyDescriptor_async_running );
    }

//!!! ...unfinished... (2023/03/23)

  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#getter_name_of_async_running );

    this.#getter_name_of_async_running = undefined;

    this.#async_running = undefined;

//!!! ...unfinished... (2023/03/23)

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }


//!!! ...unfinished... (2023/03/23)
// Problem: these will force asyncGenerator_Guardian_Base inheriting from Recyclable.
//
// Perhaps, separate to another class asyncGenerator_Guardian_RecyclableBase.

  /**
   * @param {GSheets_UrlComposer} this
   */
  static fetch_progress_create() {
    GSheets_UrlComposer.fetch_progress_dispose.call( this );
    this.fetch_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {GSheets_UrlComposer} this
   */
  static fetch_progress_dispose() {
    if ( this.fetch_progress ) {
      this.fetch_progress.disposeResources_and_recycleToPool();
      this.fetch_progress = null;
    }
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
 * Almost the same as asyncGenerator_Guardian_RecyclableBase class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of asyncGenerator_Guardian_RecyclableRoot (so it is named "Root" which can not have
 * parent class).
 */
class asyncGenerator_Guardian_RecyclableRoot
  extends asyncGenerator_Guardian_RecyclableBase() {
}

