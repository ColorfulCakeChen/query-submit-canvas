export { AsyncGuarder_RecyclableBase as RecyclableBase };
export { AsyncGuarder_RecyclableRoot as RecyclableRoot};

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "./ValueMax.js";
import { AsyncGuarder_Base } from "./AsyncGuarder_Base.js";

/**
 * A recyclable wrapper class for preventing an underlied async generator from
 * being reentered.
 *
 *
 *
 * @member {boolean} Xxx_asyncPromise_running
 *   If true, a underlied async method (i.e. .Xxx_async()) is still executing.
 * Please wait it becoming false if wanting to call .Xxx_asyncPromise_create()
 * again. The Xxx is name_prefix.
 *
 * @member {Function} Xxx_asyncPromise_create
 *   A method for creating the underlied async method. If an old instnace
 * is still executing, it will throw exception.
 *
 * @member {ValueMax.Percentage.Aggregate} Xxx_asyncPromise_progress
 *   The progress of .Xxx_async(). If ( .Xxx_asyncPromise_progress.valuePercentage == 100 ),
 * the .Xxx_async() has done.
 *   - It is used only if .Xxx_asyncPromise_create() is called.
 *   - It is not used if .Xxx_asyncGenerator_create() is called directly. In this
 *       case, its progressParent parameter will be used instead.
 */
let AsyncGuarder_RecyclableBase
  = ( ParentClass = Object ) => class AsyncGuarder_RecyclableBase
      extends AsyncGuarder_Base( Recyclable.Base( ParentClass ) ) {

  /**
   * Used as default AsyncGuarder_RecyclableBase provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "AsyncGuarder_RecyclableBase.Pool",
    AsyncGuarder_RecyclableBase,
    AsyncGuarder_RecyclableBase.setAsConstructor );


  #asyncPromise_running;
  #asyncPromise_progress;

  #name_of_asyncPromise_running;
  #name_of_asyncPromise_create;
  #name_of_asyncPromise_guarded;
  #name_of_asyncPromise_progress;


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
    AsyncGuarder_RecyclableBase.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
  }

  /** @override */
  static setAsConstructor(
    name_prefix, underlied_asyncGenerator_func, ...restArgs ) {

    super.setAsConstructor.call( this,
      name_prefix, underlied_asyncGenerator_func, ...restArgs );
    AsyncGuarder_RecyclableBase.setAsConstructor_self.call( this,
      name_prefix, underlied_asyncGenerator_func );
    return this;
  }

  /** @override */
  static setAsConstructor_self( name_prefix, underlied_asyncGenerator_func ) {

    this.#name_of_asyncPromise_running
      = `${name_prefix}_asyncPromise_running`;

    this.#name_of_asyncPromise_create
      = `${name_prefix}_asyncPromise_create`;

    this.#name_of_asyncPromise_guarded
      = `${name_prefix}_asyncPromise_guarded`;

    this.#name_of_asyncPromise_progress
      = `${name_prefix}_asyncPromise_progress`;

    // Define read-only and enumerable instance (i.e. this.Xxx) properties.
    {
      // Xxx_asyncPromise_running
      Reflect.defineProperty( this,
        this.#name_of_asyncPromise_running,
        AsyncGuarder_RecyclableBase
          .propertyDescriptor_of_asyncPromise_running );

      // Xxx_asyncPromise_progress
      Reflect.defineProperty( this,
        this.#name_of_asyncPromise_progress,
        AsyncGuarder_RecyclableBase
          .propertyDescriptor_of_asyncPromise_progress );
    }

    // Define shared instance (i.e. this.constructor.prototype's) properties.
    {
      // Xxx_asyncPromise_create()
      Reflect.defineProperty( this.constructor.prototype,
        this.#name_of_asyncPromise_create,
        AsyncGuarder_RecyclableBase
          .propertyDescriptor_of_asyncPromise_create );
    }

    // Define static (i.e. this.constructor's) properties.
    // {
    // }
  }

  /** @override */
  disposeResources() {

    Reflect.deleteProperty( this, this.#name_of_asyncPromise_progress );
    Reflect.deleteProperty( this, this.#name_of_asyncPromise_create );
    Reflect.deleteProperty( this, this.#name_of_asyncPromise_running );

    this.#name_of_asyncPromise_progress = undefined;
    this.#name_of_asyncPromise_guarded = undefined;
    this.#name_of_asyncPromise_create = undefined;
    this.#name_of_asyncPromise_running = undefined;

    AsyncGuarder_RecyclableBase.asyncPromise_progress_dispose.call( this );

    this.#asyncPromise_running = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
  }

  /**
   * Property descriptor for Xxx_asyncPromise_running.
   * (as enumerable read-only properties).
   */
  static propertyDescriptor_of_asyncPromise_running = 
    { get() { return this.#asyncPromise_running; }, enumerable: true };


  /**
   * Property descriptor for Xxx_asyncPromise_progress.
   * (as enumerable read-only properties).
   */
  static propertyDescriptor_of_asyncPromise_progress = 
    { get() { return this.#asyncPromise_progress; }, enumerable: true };

  /**
   * @param {AsyncGuarder_RecyclableBase} this
   */
  static asyncPromise_progress_create() {
    AsyncGuarder_RecyclableBase.asyncPromise_progress_dispose.call( this );
    this.#asyncPromise_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {AsyncGuarder_RecyclableBase} this
   */
  static asyncPromise_progress_dispose() {
    if ( this.#asyncPromise_progress ) {
      this.#asyncPromise_progress.disposeResources_and_recycleToPool();
      this.#asyncPromise_progress = null;
    }
  }


  /**
   * Property descriptor for Xxx_asyncPromise_create().
   */
  static propertyDescriptor_of_asyncPromise_create = {
    value: AsyncGuarder_RecyclableBase.asyncPromise_create
  };

  /**
   * Create Xxx_async (an auto-loop instance of guarded underlied asyn generator).
   *
   * Note: The this.#asyncPromise_progress will record progress of this method.
   *
   *
   * @return {Promise}
   *   Return the newly created .guarded_async() promise.
   */
  static asyncPromise_create( ...restArgs ) {

    // Note: The .throw_if_Xxx() static methods are defined in the parent classs.

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_asyncPromise_create;

      AsyncGuarder_RecyclableBase.throw_if_an_old_still_running
        .call( this, this.#asyncPromise_running, funcNameInMessage );

      AsyncGuarder_RecyclableBase
        .throw_if_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );
    }

    // 1.
    let asyncGenerator;
    {
      // Use internal independent progress.
      AsyncGuarder_RecyclableBase.asyncPromise_progress_create
        .call( this );

      // Prepare asyncGenerator
      //
      // Note: The .asyncGenerator_create_without_checking_precondition() is
      //       defined in the parent classs.
      asyncGenerator = AsyncGuarder_RecyclableBase
        .asyncGenerator_create_without_checking_precondition.call( this,
          this.#asyncPromise_progress, ...restArgs );
    }

    // 2.
    return AsyncGuarder_RecyclableBase
      .asyncPromise_create_without_checking_precondition
      .call( this, asyncGenerator );
  }

  /**
   *
   * @param {AsyncGuarder_RecyclableBase} this
   *
   * @param {AsyncGenerator} asyncGenerator
   *   The async generator (an instance of
   * .guarded_underlined_asyncGenerator()) to be wrapped by the
   * created promise.
   *
   * @return {Promise}
   *   Return the newly created .guarded_async() promise.
   */
  static asyncPromise_create_without_checking_precondition( asyncGenerator ) {
    this.#asyncPromise_running = true;
    let asyncPromise
      = AsyncGuarder_RecyclableBase.guarded_async.call( this,
          asyncGenerator );
    return asyncPromise;
  }

  /**
   * The guarded async method for looping the underlied async generator.
   *
   * @param {AsyncGuarder_RecyclableBase} this
   *
   * @param {AsyncGenerator} asyncGenerator
   *   The async generator (an instance of
   * .guarded_underlined_asyncGenerator()) to be wrapped by the
   * created promise.
   *
   * @return {Promise}
   *   Return a promise resolved to .value of asyncGenerator.next()
   * { done: true, value }.
   */
  static async guarded_async( asyncGenerator ) {

    // Note: The .throw_if_Xxx() static methods are defined in the parent classs.

    { // Checking pre-condition.
      const funcNameInMessage = this.#name_of_asyncPromise_guarded;

      AsyncGuarder_RecyclableBase.throw_call_another_if_false.call(
        this,
        this.asyncPromise_running, funcNameInMessage,
        this.#name_of_asyncPromise_create );
    }

    try {
      // 1.
      let asyncGeneratorNext;
      do {
        asyncGeneratorNext = await asyncGenerator.next();
      } while ( !asyncGeneratorNext.done );

      let result = asyncGeneratorNext.value;
      return result;

    } catch ( e ) {
      //console.error( e );
      //debugger;
      throw e; // Unknown error, should be said loundly.

    } finally {
      // 2. So that this async method could be executed again.
      this.#asyncPromise_running = false;
    }
  }

}


/**
 * Almost the same as AsyncGuarder_RecyclableBase class except its
 * parent class is fixed to Object. In other words, caller can not specify the
 * parent class of AsyncGuarder_RecyclableRoot (so it is named
 * "Root" which can not have parent class).
 */
class AsyncGuarder_RecyclableRoot
  extends AsyncGuarder_RecyclableBase() {
}
