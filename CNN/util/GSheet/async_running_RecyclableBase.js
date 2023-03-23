export { async_running_RecyclableBase };
export { async_running_RecyclableRoot };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";
import { async_running_Base } from "./async_running_Base.js";


//!!! ...unfinished... (2023/03/23)

/**
 *
 *
 *
 *

//!!! ...unfinished... (2023/03/23)

 * @member {ValueMax.Percentage.Aggregate} fetch_progress
 *   The progress of fetching. If ( .fetch_progress.valuePercentage == 100 ),
 * the fetching has done.
 *   - It is used only if .JSON_ColumnMajorArrayArray_fetch_async() is called.
 *   - If .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() is called directly,
 *       its progressParent parameter will be used instead.
 */
let async_running_RecyclableBase
  = ( ParentClass = Object ) => class async_running_RecyclableBase
      extends async_running_Base( Recyclable.Base( ParentClass ) ) {

//!!! (2023/03/23 Remarked)

  /**
   * Used as default async_running_RecyclableBase provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "async_running_RecyclableBase.Pool",
    async_running_RecyclableBase, async_running_RecyclableBase.setAsConstructor );

  /**
   *
   * @param {string} name_prefix
   *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
   * or "versus_load")
   */
  constructor( name_prefix, ...restArgs ) {

    super( name_prefix, ...restArgs );
    async_running_RecyclableBase.setAsConstructor_self.call( this, name_prefix );
  }

  /** @override */
  static setAsConstructor( name_prefix, ...restArgs ) {

    super.setAsConstructor.call( this, name_prefix,...restArgs );
    async_running_RecyclableBase.setAsConstructor_self.call( this, name_prefix );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix ) {

//!!! ...unfinished... (2023/03/23)

  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2023/03/23)

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }


//!!! ...unfinished... (2023/03/23)
// Problem: these will force async_running_Base inheriting from Recyclable.
//
// Perhaps, separate to another class async_running_RecyclableBase.

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
 * Almost the same as async_running_RecyclableBase class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of async_running_RecyclableRoot (so it is named "Root" which can not have
 * parent class).
 */
class async_running_RecyclableRoot extends async_running_RecyclableBase() {
}

