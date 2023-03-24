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
 *   - If .Xxx_asyncGenerator_create() is called directly, its progressParent
 *       parameter will be used instead.
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

  #async_running;

  #name_of_async_running;
  #name_of_asyncGenerator_create;


  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   */
  constructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super( name_prefix, underlied_asyncGenerator_func, ...restArgs );
    asyncGenerator_Guardian_RecyclableBase.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor( name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

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

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_async_running
      Reflect.defineProperty( this,
        this.#name_of_async_running,
        asyncGenerator_Guardian_RecyclableBase.propertyDescriptor_async_running );
    }

//!!! ...unfinished... (2023/03/24)
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
    }

  }

  /** @override */
  disposeResources() {

    asyncGenerator_Guardian_RecyclableBase.async_progress_dispose.call( this );

    Reflect.deleteProperty( this, this.#name_of_promise_create );
    Reflect.deleteProperty( this, this.#name_of_async_running );

    this.#name_of_promise_create = undefined;
    this.#name_of_async_running = undefined;

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
   * @param {asyncGenerator_Guardian_RecyclableBase} this
   */
  static async_progress_create() {
    asyncGenerator_Guardian_RecyclableBase.async_progress_dispose.call( this );
    this.async_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {asyncGenerator_Guardian_RecyclableBase} this
   */
  static async_progress_dispose() {
    if ( this.async_progress ) {
      this.async_progress.disposeResources_and_recycleToPool();
      this.async_progress = null;
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

