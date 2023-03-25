export { AsyncGuarder_RecyclableBase as RecyclableBase };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";
import { Base as AsyncGuarder_Base } from "./AsyncGuarder_Base.js";

/**
 * Return a recyclable wrapper class for preventing an underlied async
 * generator from being reentered.
 *
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
 *   - Its 1st parameter must be progressParent (an instance of
 *       ValueMax.Percentage.Aggregate).
 */
function AsyncGuarder_RecyclableBase(
  name_prefix, underlied_asyncGenerator_func, ParentClass = Object ) {

  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;


  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;

  const name_of_asyncPromise_create_without_checking_precondition
    = `${name_prefix}_asyncPromise_create_without_checking_precondition`;

  const name_of_asyncPromise_guarded
    = `${name_prefix}_asyncPromise_guarded`;


  const name_of_asyncPromise_progress
    = `${name_prefix}_asyncPromise_progress`;

  const name_of_asyncPromise_progress_create
    = `${name_prefix}_asyncPromise_progress_create`;

  const name_of_asyncPromise_progress_dispose
    = `${name_prefix}_asyncPromise_progress_dispose`;


  // These static methods are defined in parent class (i.e. AsyncGuarder_Base),
  // however, they will be called by this sub-class (i.e.
  // AsyncGuarder_RecyclableBase). So, their names should still be prepared.

  const name_of_asyncGenerator_create_without_checking_precondition
    = `${name_prefix}_asyncGenerator_create_without_checking_precondition`;

  const name_of_throw_if_asyncPromise_or_asyncGenerator_running
    = `${name_prefix}_throw_if_asyncPromise_or_asyncGenerator_running`;


  return (

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
   *   A method for creating the underlied async generator and looping until done.
   *   - If an old instance is still executing, it will throw exception.
   *   - It accepts almost the same parameters as underlied_asyncGenerator_func()
   *       except without the 1st parameter progressParent (which is replaced
   *       by .Xxx_asyncPromise_progress).
   *   - It returns a promise resolved to .value of { done: true, value } of
   *       awaited underlied_asyncGenerator_func().next().
   *
   * @member {Function} Xxx_asyncPromise_create_without_checking_precondition
   *   An internal static method called by .Xxx_asyncPromise_create(). 
   *
   * @member {ValueMax.Percentage.Aggregate} Xxx_asyncPromise_progress
   *   The progress of .Xxx_async(). If
   * ( .Xxx_asyncPromise_progress.valuePercentage == 100 ), the .Xxx_async() has
   * done.
   *   - It is used only if .Xxx_asyncPromise_create() is called.
   *   - It is not used if .Xxx_asyncGenerator_create() is called. In this case,
   *       its progressParent parameter will be used instead.
   */
  class AsyncGuarder_RecyclableBase extends AsyncGuarder_Base(
    name_prefix, underlied_asyncGenerator_func,
    Recyclable.Base( ParentClass ) ) {

    /**
     * Used as default AsyncGuarder_RecyclableBase provider for
     * conforming to Recyclable interface.
     */
    static Pool = new Pool.Root( "AsyncGuarder_RecyclableBase.Pool",
      AsyncGuarder_RecyclableBase,
      AsyncGuarder_RecyclableBase.setAsConstructor );


    #asyncPromise_running;
    #asyncPromise_progress;


    /**
     *
     */
    constructor( ...restArgs ) {
      super( ...restArgs );
      AsyncGuarder_RecyclableBase.setAsConstructor_self.call( this );
    }

    /** @override */
    static setAsConstructor( ...restArgs ) {
      super.setAsConstructor.apply( this, restArgs );
      AsyncGuarder_RecyclableBase.setAsConstructor_self.call( this );
      return this;
    }

    /** @override */
    static setAsConstructor_self() {

      // Define read-only and enumerable instance (i.e. this.Xxx) properties.
      {
        // Xxx_asyncPromise_running
        Reflect.defineProperty( this,
          name_of_asyncPromise_running,
          AsyncGuarder_RecyclableBase
            .propertyDescriptor_of_asyncPromise_running );

        // Xxx_asyncPromise_progress
        Reflect.defineProperty( this,
          name_of_asyncPromise_progress,
          AsyncGuarder_RecyclableBase
            .propertyDescriptor_of_asyncPromise_progress );
      }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncPromise_progress );
      Reflect.deleteProperty( this, name_of_asyncPromise_running );

      AsyncGuarder_RecyclableBase
        [ name_of_asyncPromise_progress_dispose ].call( this );

      this.#asyncPromise_running = undefined;

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
    static [ name_of_asyncPromise_progress_create ]() {
      AsyncGuarder_RecyclableBase
        [ name_of_asyncPromise_progress_dispose ].call( this );
      this.#asyncPromise_progress
        = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
    }

    /**
     * @param {AsyncGuarder_RecyclableBase} this
     */
    static [ name_of_asyncPromise_progress_dispose ]() {
      if ( this.#asyncPromise_progress ) {
        this.#asyncPromise_progress.disposeResources_and_recycleToPool();
        this.#asyncPromise_progress = null;
      }
    }


    /**
     * Create Xxx_asyncPromise (an auto-looping instance of guarded underlied
     * async generator).
     *
     * Note: The this.#asyncPromise_progress will record progress of this method.
     *
     *
     * @return {Promise}
     *   Return the newly created .guarded_async() promise.
     */
    [ name_of_asyncPromise_create ]( ...restArgs ) {

      // Note: The .throw_if_Xxx() static methods are defined in the parent classs.

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncPromise_create;

        AsyncGuarder_RecyclableBase.throw_if_an_old_still_running
          .call( this, this.#asyncPromise_running, funcNameInMessage );

        AsyncGuarder_RecyclableBase
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      // 1.
      let asyncGenerator;
      {
        // Use internal independent progress.
        AsyncGuarder_RecyclableBase[ name_of_asyncPromise_progress_create ]
          .call( this );

        // Prepare asyncGenerator
        asyncGenerator = AsyncGuarder_RecyclableBase
          [ name_of_asyncGenerator_create_without_checking_precondition ]
          .call( this, this.#asyncPromise_progress, ...restArgs );
      }

      // 2.
      return AsyncGuarder_RecyclableBase
        [ name_of_asyncPromise_create_without_checking_precondition ]
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
    static [ name_of_asyncPromise_create_without_checking_precondition ](
      asyncGenerator ) {

      this.#asyncPromise_running = true;
      let asyncPromise = AsyncGuarder_RecyclableBase
        [ name_of_asyncPromise_guarded ].call( this, asyncGenerator );
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
    static async [ name_of_asyncPromise_guarded ]( asyncGenerator ) {

      // Note: The .throw_if_Xxx() static methods are defined in the parent classs.

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncPromise_guarded;

        AsyncGuarder_RecyclableBase.throw_call_another_if_false.call(
          this,
          this.asyncPromise_running, funcNameInMessage,
          name_of_asyncPromise_create );
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
  } );

}
