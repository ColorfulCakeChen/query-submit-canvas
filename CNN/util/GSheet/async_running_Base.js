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
 * @member {boolean} fetch_async_running
 *   If true, a .JSON_ColumnMajorArrayArray_fetch_async() is still executing.
 * Please wait it becoming false if wanting to call
 * .JSON_ColumnMajorArrayArray_fetch_async() again.
 *
 * @member {boolean} this.name_of_asyncGenerator_running
 *   If true, a .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() is still
 * executing. Please wait it becoming false if wanting to call
 * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() again.
 *
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


  #async_running;
  #asyncGenerator_running;

  // Record the getters' names.
  #name_of_async_running;
  #name_of_asyncGenerator_running;

//!!! ...unfinished... (2023/03/23)
// let the name of getters are specified.

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

    // Define 

//!!! ...unfinished... (2023/03/23)
    Reflect.defineProperty( this, name_of_async_running,
      { get() { return this.#async_running; }, enumerable: true } );

    Reflect.defineProperty( this, name_of_asyncGenerator_running,
      { get() { return this.#asyncGenerator_running; }, enumerable: true } );
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#name_of_async_running );
    Reflect.deleteProperty( this, this.#name_of_asyncGenerator_running );

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }

}


/**
 * Almost the same as async_running_Base class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of async_running_Root (so it is named "Root" which can not have
 * parent class).
 */
class async_running_Root extends async_running_Base() {
}

