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
 * @member {boolean} async_running
 *   If true, a .Xxx_async() is still executing. Please wait it becoming false
 * if wanting to call .Xxx_async() again. From outside caller's view, this
 * property is represented by a getter named as name_of_async_running.
 *
 * @member {boolean} asyncGenerator_running
 *   If true, a .Xxx_asyncGenerator() is still executing. Please wait it
 * becoming false if wanting to call .Xxx_asyncGenerator() again. From outside
 * caller's view, this property is represented by a getter named as
 * name_of_asyncGenerator_running.
 *

//!!! ...unfinished... (2023/03/23)

 * @member {ValueMax.Percentage.Aggregate} fetch_progress
 *   The progress of fetching. If ( .fetch_progress.valuePercentage == 100 ),
 * the fetching has done.
 *   - It is used only if .JSON_ColumnMajorArrayArray_fetch_async() is called.
 *   - If .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() is called directly,
 *       its progressParent parameter will be used instead.
 */
let async_running_Base
  = ( ParentClass = Object ) => class async_running_Base
      extends ParentClass {

//!!! (2023/03/23 Remarked)
//      extends Recyclable.Base( ParentClass ) {
//
//   /**
//    * Used as default async_running_Base provider for conforming to
//    * Recyclable interface.
//    */
//   static Pool = new Pool.Root( "async_running_Base.Pool",
//     async_running_Base, async_running_Base.setAsConstructor );


  #async_running;           // Whether an async method executing.
  #asyncGenerator_running;  // Whether an async generator executing.

  // Record the getters' names.
  #name_of_async_running;
  #name_of_asyncGenerator_running;

  // Property descriptor for the getters (as enumerable read-only properties).
  static propertyDescriptor_of_async_running = 
    { get() { return this.#async_running; }, enumerable: true };

  static propertyDescriptor_asyncGenerator_running = 
    { get() { return this.#asyncGenerator_running; }, enumerable: true };


  /**
   *
   * @param {string} name_of_async_running
   *   The getter method name of async_running flag.
   *
   * @param {string} name_of_asyncGenerator_running
   *   The getter method name of asyncGenerator_running flag.
   */
  constructor(
    name_of_async_running, name_of_asyncGenerator_running, ...restArgs ) {

    super( ...restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      name_of_async_running, name_of_asyncGenerator_running );
  }

  /** @override */
  static setAsConstructor(
    name_of_async_running, name_of_asyncGenerator_running, ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    async_running_Base.setAsConstructor_self.call( this,
      name_of_async_running, name_of_asyncGenerator_running );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    name_of_async_running, name_of_asyncGenerator_running ) {

    this.#name_of_async_running = name_of_async_running;
    this.#name_of_asyncGenerator_running = name_of_asyncGenerator_running;

    // Define read-only properties (for the two flags) as the specified names.
    {
      Reflect.defineProperty( this, name_of_async_running,
        async_running_Base.propertyDescriptor_async_running );

      Reflect.defineProperty( this, name_of_asyncGenerator_running,
        async_running_Base.propertyDescriptor_asyncGenerator_running );
    }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_running );
    Reflect.deleteProperty( this, this.#name_of_async_running );

    this.#name_of_asyncGenerator_running = undefined;
    this.#name_of_async_running = undefined;

    this.#asyncGenerator_running = undefined;
    this.#async_running = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
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

