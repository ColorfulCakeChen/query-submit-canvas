export { NonReentrant_asyncPromise_by_asyncGenerator
  as asyncPromise_by_asyncGenerator };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";
import { asyncGenerator as NonReentrant_asyncGenerator }
  from "./NonReentrant_asyncGenerator.js";

/**
 * Return a recyclable wrapper class for preventing an underlied async
 * generator from being reentered.
 *
 * It is strongly suggested the ParentClass has ancestor class (i.e.
 * inherits directly or indirectly from) Recyclable.Base because the
 * .Xxx_asyncPromise_progress needs to be disposed and recycled.
 *
 *
 * Q: Why not inherit from Recyclable.Base() here?
 * A: The Recyclable.Base will be inherited multiple times, if sub-class
 *      inherits from this class multiple times for different async operation
 *      (e.g. init and versus_load). (Although it seems not harmful to inherit
 *      Recyclable.Base multiple times.
 *
 *
 * @param {string} name_prefix
 *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
 * or "workerProxies_init" or "versus_load" or "imageData_process")
 *
 * @param {string} name_of_asyncPromise_progress
 *   The property name for progress to be used by the underlied async
 * generator.
 *   - If null, Xxx_asyncPromise_progress will be used. (Xxx is name_prefix)
 *   - If not null, the specified name will be used. This is especially useful
 *       when the progress object wants to be shared among multiple
 *       NoReentrant.Xxx sub-classes.
 *
 * @param {AsyncGeneratorFunction} underlied_asyncGenerator_func
 *   A function for creating an underlied async generator which wants to be
 * guarded by the .Xxx_asyncGenerator_running boolean flag.
 *   - It will be called with thisArg as "this".
 *   - Its 1st parameter must be progressParent (an instance of
 *       ValueMax.Percentage.Aggregate).
 *   - The .value of { done: true, value } of the underlied async generator
 *       final .next() could be any value except undefined.
 *   - The underlied async generator must also set .XxxOk to either true or
 *       false.
 */
function NonReentrant_asyncPromise_by_asyncGenerator(
  name_prefix, underlied_asyncGenerator_func,
  name_of_asyncPromise_progress = null,
  ParentClass = Object ) {

  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;


  const name_of_asyncGenerator_create_with_asyncPromise_progress
    = `${name_prefix}_asyncGenerator_create_with_asyncPromise_progress`;

  const name_of_asyncGenerator_create_with_asyncPromise_progress_without_checking_precondition
    = `${name_prefix}_asyncPromise_create_with_asyncPromise_progress_without_checking_precondition`;


  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;

  const name_of_asyncPromise_create_without_checking_precondition
    = `${name_prefix}_asyncPromise_create_without_checking_precondition`;

  const name_of_asyncPromise_guarded
    = `${name_prefix}_asyncPromise_guarded`;


  if ( !name_of_asyncPromise_progress )
    name_of_asyncPromise_progress
      = `${name_prefix}_asyncPromise_progress`;

  const name_of_asyncPromise_progress_create
    = `${name_of_asyncPromise_progress}_create`;

  const name_of_asyncPromise_progress_dispose
    = `${name_of_asyncPromise_progress}_dispose`;


  const name_of_throw_if_an_old_asyncPromise_still_running
    = `throw_if_an_old_${name_prefix}_asyncPromise_still_running`;


  // These static methods are defined in parent class (i.e.
  // NonReentrant_asyncGenerator), however, they will be called by this
  // sub-class (i.e. NonReentrant_asyncPromise_by_asyncGenerator). So, their
  // names should still be prepared here.

  const name_of_asyncGenerator_create_without_checking_precondition
    = `${name_prefix}_asyncGenerator_create_without_checking_precondition`;

  const name_of_throw_if_an_old_asyncGenerator_still_running
    = `throw_if_an_old_${name_prefix}_asyncGenerator_still_running`;

  const name_of_throw_if_asyncPromise_or_asyncGenerator_running
    = `throw_if_${name_prefix}_asyncPromise_or_asyncGenerator_running`;


  return (

  /**
   * A recyclable wrapper class for preventing an underlied async generator
   * from being reentered. (Reentrancy Preventer)
   *
   * It is strongly suggested the ParentClass has ancestor class (i.e.
   * inherits directly or indirectly from) Recyclable.Base because the
   * .Xxx_asyncPromise_progress needs to be disposed and recycled.
   *
   *
   * @member {Function} Xxx_asyncGenerator_create_with_asyncPromise_progress
   *   A method for creating the underlied async generator by using
   * .Xxx_asyncPromise_progress as 1st parameter.
   *   - If an old instance is still executing, it will throw exception.
   *   - It is mutually exclusive with .Xxx_asyncGenerator_create().
   *   - It accepts almost the same parameters as
   *       underlied_asyncGenerator_func() except without the 1st parameter
   *       progressParent (which is replaced by .Xxx_asyncPromise_progress).
   *   - It returns an async generator.
   *
   * @member {boolean} Xxx_asyncPromise_running
   *   If true, a underlied async method (i.e. .Xxx_asyncPromise_guarded())
   * is still executing. Please wait it becoming false if wanting to call
   * .Xxx_asyncPromise_create() again. The Xxx is name_prefix.
   *
   * @member {Function} Xxx_asyncPromise_create
   *   A method for creating the underlied async generator and looping until
   *     done.
   *   - If an old instance is still executing, it will throw exception.
   *   - It accepts almost the same parameters as
   *       underlied_asyncGenerator_func() except without the 1st parameter
   *       progressParent (which is replaced by .Xxx_asyncPromise_progress).
   *   - It returns a promise resolved to .value of { done: true, value } of
   *       awaited underlied_asyncGenerator_func().next().
   *
   * @member {Function} Xxx_asyncPromise_create_without_checking_precondition
   *   An internal static method called by .Xxx_asyncPromise_create(). 
   *
   * @member {ValueMax.Percentage.Aggregate} Xxx_asyncPromise_progress
   *   The progress of .Xxx_async(). If
   * ( .Xxx_asyncPromise_progress.valuePercentage == 100 ), the .Xxx_async()
   * has done.
   *   - It is used only if .Xxx_asyncPromise_create() is called.
   *   - It is not used if .Xxx_asyncGenerator_create() is called. In this
   *       case, its progressParent parameter will be used instead.
   */
  class NonReentrant_asyncPromise_by_asyncGenerator
    extends NonReentrant_asyncGenerator(
      name_prefix, underlied_asyncGenerator_func,
      ParentClass ) {

    /**
     * Used as default NonReentrant.asyncPromise_by_asyncGenerator provider
     * for conforming to Recyclable interface.
     */
    static Pool = new Pool.Root(
      "NonReentrant.asyncPromise_by_asyncGenerator.Pool",
      NonReentrant_asyncPromise_by_asyncGenerator,
      NonReentrant_asyncPromise_by_asyncGenerator.setAsConstructor );


    #asyncPromise_running;


    /**
     *
     */
    constructor( ...restArgs ) {
      super( ...restArgs );
      this.#setAsConstructor_self();
    }

    /** @override */
    setAsConstructor( ...restArgs ) {
      super.setAsConstructor.apply( this, restArgs );
      this.#setAsConstructor_self();
    }

    /**  */
    #setAsConstructor_self() {

      // Define read-only and enumerable instance (i.e. this.Abc) properties.
      {
        // Xxx_asyncPromise_running
        Reflect.defineProperty( this,
          name_of_asyncPromise_running,
          NonReentrant_asyncPromise_by_asyncGenerator
            .propertyDescriptor_of_asyncPromise_running );
      }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncPromise_running );

      NonReentrant_asyncPromise_by_asyncGenerator
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
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
     */
    static [ name_of_asyncPromise_progress_create ]() {
      NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncPromise_progress_dispose ].call( this );
      this[ name_of_asyncPromise_progress ]
        = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
    }

    /**
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
     */
    static [ name_of_asyncPromise_progress_dispose ]() {
      if ( this[ name_of_asyncPromise_progress ] ) {
        this[ name_of_asyncPromise_progress ].disposeResources_and_recycleToPool();
        this[ name_of_asyncPromise_progress ] = null;
      }
    }


    /**
     * Create Xxx_asyncGenerator (an instance of guarded underlied async
     * generator).
     *
     * Note: The this[ name_of_asyncPromise_progress ] will record progress of
     *       this method.
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of
     * this[ name_of_asyncGenerator_guarded ]().
     */
    [ name_of_asyncGenerator_create_with_asyncPromise_progress ]( ...restArgs ) {

      // Note: The .throw_if_Xxx() static methods are defined in the parent
      //       class.

      { // Checking pre-condition.
        const funcNameInMessage
          = name_of_asyncGenerator_create_with_asyncPromise_progress;

        NonReentrant_asyncPromise_by_asyncGenerator
          [ name_of_throw_if_an_old_asyncGenerator_still_running ]
          .call( this, funcNameInMessage );

        NonReentrant_asyncPromise_by_asyncGenerator
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      let asyncGenerator = NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncGenerator_create_with_asyncPromise_progress_without_checking_precondition ]
        .apply( this, restArgs );

      return asyncGenerator;
    }

    /**
     *
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of
     * this[ name_of_asyncGenerator_guarded ] by internal progress.
     */
    static
      [ name_of_asyncGenerator_create_with_asyncPromise_progress_without_checking_precondition ](
        ...restArgs ) {

      // 1. Use internal independent progress.
      NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncPromise_progress_create ]
        .call( this );

      // 2. Create asyncGenerator
      //
      // Note: The Xxx_asyncGenerator_create_without_checking_precondition()
      //       (which is a static method defined in parent class) will also
      //       set this[ name_of_asyncResultOk ] to undefined.
      //
      let asyncGenerator = NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncGenerator_create_without_checking_precondition ]
        .call( this, this[ name_of_asyncPromise_progress ], ...restArgs );

      return asyncGenerator;
    }


    /**
     * Create Xxx_asyncPromise (an auto-looping instance of guarded underlied
     * async generator).
     *
     * Note: The this[ name_of_asyncPromise_progress ] will record progress of
     *       this method.
     *
     *
     * @return {Promise}
     *   Return the newly created .guarded_async() promise.
     */
    [ name_of_asyncPromise_create ]( ...restArgs ) {

      // Note: The .throw_if_Xxx() static methods are defined in the parent
      //       class.

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncPromise_create;

        NonReentrant_asyncPromise_by_asyncGenerator
          [ name_of_throw_if_an_old_asyncPromise_still_running ]
          .call( this, funcNameInMessage );

        NonReentrant_asyncPromise_by_asyncGenerator
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      // 1. Prepare asyncGenerator
      let asyncGenerator = NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncGenerator_create_with_asyncPromise_progress_without_checking_precondition ]
        .apply( this, restArgs );

      // 2. Wrapped as asyncPromise.
      let asyncPromise = NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncPromise_create_without_checking_precondition ]
        .call( this, asyncGenerator );

      return asyncPromise;
    }

    /**
     *
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
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
      let asyncPromise = NonReentrant_asyncPromise_by_asyncGenerator
        [ name_of_asyncPromise_guarded ].call( this, asyncGenerator );
      return asyncPromise;
    }

    /**
     * The guarded async method for looping the underlied async generator.
     *
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
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

      // Note: The .throw_if_Xxx() static methods are defined in the parent
      //       class.

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncPromise_guarded;

        NonReentrant_asyncPromise_by_asyncGenerator
          .throw_call_another_if_false.call( this,
            this.#asyncPromise_running, funcNameInMessage,
            name_of_asyncPromise_create );
      }

      try {
        // 1.
        let asyncGeneratorNext;
        do {
          asyncGeneratorNext = await asyncGenerator.next();
        } while ( !asyncGeneratorNext.done );

        let resultValue = asyncGeneratorNext.value;
        return resultValue;

      } catch ( e ) {
        //console.error( e );
        //debugger;
        throw e; // Unknown error, should be said loundly.

      } finally {
        // 2. So that this async method could be executed again.
        this.#asyncPromise_running = false;
      }
    }


    /**
     * @param {NonReentrant_asyncPromise_by_asyncGenerator} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_an_old_asyncPromise_still_running ](
      funcNameInMessage ) {

      // Note: The .throw_if_Xxx() static methods are defined in the parent
      //       class.

      NonReentrant_asyncPromise_by_asyncGenerator
        .throw_if_an_old_still_running
        .call( this, this.#asyncPromise_running, funcNameInMessage );
    }
  } );

}
