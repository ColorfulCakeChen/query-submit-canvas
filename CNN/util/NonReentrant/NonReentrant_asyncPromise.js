export { NonReentrant_asyncPromise as asyncPromise };

import * as ClassHierarchyTools from "../ClassHierarchyTools.js";

/**
 * Return a wrapper class for preventing an underlied async function from
 * being reentered.
 *
 *
 * @param {string} name_prefix
 *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
 * or "workerProxies_init" or "versus_load" or "imageData_process")
 *
 * @param {string} name_postfix_of_asyncResult 
 *   The property name postfix for recording the awaited value of
 * underlied_asyncPromise_func(). For example,
 *
 *   - If ( name_prefix == "init" ) and ( name_postfix_of_asyncResult == "Ok" ),
 *       the property name of result will be "initOk".
 *
 *   - If ( name_prefix == "imageData_process" ) and
 *       ( name_postfix_of_asyncResult == "_result_float32ArrayArray" ), the
 *       property name of result will be
 *       "imageData_process_result_float32ArrayArray".
 *
 * @param {AsyncFunction} underlied_asyncPromise_func
 *   A function for creating an underlied async function which wants to be
 * guarded by the .Xxx_asyncPromise_running boolean flag.
 *   - It will be called with thisArg as "this".
 */
function NonReentrant_asyncPromise(
  name_prefix, name_postfix_of_asyncResult, underlied_asyncPromise_func,
  ParentClass = Object ) {

  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;

  const name_of_asyncResult
    = `${name_prefix}${name_postfix_of_asyncResult}`;


  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;

  const name_of_asyncPromise_create_without_checking_precondition
    = `${name_prefix}_asyncPromise_create_without_checking_precondition`;

  const name_of_asyncPromise_guarded
    = `${name_prefix}_asyncPromise_guarded`;

//!!!
  const name_of_throw_if_asyncPromise_running
    = `throw_if_${name_prefix}_asyncPromise_running`;

  const name_of_throw_if_not_asyncResult
    = `throw_if_not_${name_of_asyncResult}`;


  return (

  /**
   * A wrapper class for preventing an underlied async function from being
   * reentered. (Reentrancy Preventer)
   *
   *
   * @member {boolean} Xxx_asyncPromise_running
   *   If true, a underlied async function (i.e. .Xxx_asyncPromise_guarded())
   * is still executing. Please wait it becoming false if wanting to call
   * .Xxx_asyncPromise_create() again. The Xxx is name_prefix (e.g. "init").
   *
   * @member {any} XxxYyy
   *   A property recording the result of underlied_asyncPromise_func().
   *   - The Xxx is name_prefix (e.g. "init").
   *   - The Yyy is name_postfix_of_asyncResult (e.g. "Ok").
   *   - The .Xxx_asyncPromise_create_without_checking_precondition() will
   *       clear this.XxxYyy (e.g. this.initOk) to undefined.
   *   - The underlied_asyncPromise_func() should set this.XxxYyy (e.g.
   *       this.initOk) to the result value.

   * @member {Function} Xxx_asyncPromise_create
   *   A method for creating the underlied async function.
   *   - If an old instance is still executing, it will throw exception.
   *   - It accepts the same parameters as underlied_asyncPromise_func().
   *   - It returns a promise.
   *
   * @member {Function} Xxx_asyncPromise_create_without_checking_precondition
   *   An internal static method called by .Xxx_asyncPromise_create(). 
   *
   * @member {Function} throw_if_Xxx_asyncPromise_running
   *   A static method for throwing excption if .Xxx_asyncPromise_running is
   * true.
   *
   * @member {Function} [ throw_if_not_XxxYyy ]
   *   A static method for throwing excption if ( !this.XxxYyy ) is true. That
   * is, if this.XxxYyy is either undefined or null or false or 0 or NaN or
   * empty string "", throw exception.
   */
  class NonReentrant_asyncPromise extends ParentClass {

    #asyncGenerator_running;

//!!! (2023/03/25) seems not necessary to keep it as a member.
//     static [ name_of_underlied_asyncGenerator_func ]
//       = underlied_asyncGenerator_func;

    /**
     *
     */
    constructor( ...restArgs ) {
      super( ...restArgs );
      NonReentrant_asyncPromise.setAsConstructor_self.call( this );
    }

    /** @override */
    static setAsConstructor( ...restArgs ) {
      super.setAsConstructor.apply( this, restArgs );
      NonReentrant_asyncPromise.setAsConstructor_self.call( this );
      return this;
    }

    /** @override */
    static setAsConstructor_self() {

      // Define read-only and enumerable instance (i.e. this.Xxx) properties.
      {
        // Xxx_asyncGenerator_running
        Reflect.defineProperty( this,
          name_of_asyncGenerator_running,
          NonReentrant_asyncPromise.propertyDescriptor_of_asyncGenerator_running );
      }

//!!! (2023/03/24 Remarked) Replaced by computed property names.
//   !!! ...unfinished... (2023/03/22)
//   // shared instance (i.e. this.constructor.prototype's) properties
//   // static (i.e. this.constructor's) properties
//   // should not defineProperty() by every instance.
//   //
//   // They should be defined as computed named property. 
//
//
//       // Define shared instance (i.e. this.constructor.prototype's) properties.
//       {
//         // Xxx_asyncGenerator_create()
//         Reflect.defineProperty( this.constructor.prototype,
//           this.#name_of_asyncGenerator_create,
//           NonReentrant_asyncPromise
//             .propertyDescriptor_of_asyncGenerator_create );
//       }
//
//       // Define static (i.e. this.constructor's) properties.
//       {
//         // Xxx_throw_if_asyncPromise_or_asyncGenerator_running()
//         Reflect.defineProperty( this.constructor,
//           this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running,
//           NonReentrant_asyncPromise
//             .propertyDescriptor_of_throw_if_asyncPromise_or_asyncGenerator_running );
//       }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncGenerator_running );

      this[ name_of_asyncResult ] = undefined;
      this.#asyncGenerator_running = undefined;

      // If parent class has the same method, call it.    
      if ( super.disposeResources instanceof Function )
        super.disposeResources();
    }


    /**
     * Property descriptor for Xxx_asyncGenerator_running.
     * (as enumerable read-only properties).
     */
    static propertyDescriptor_of_asyncGenerator_running = 
      { get() { return this.#asyncGenerator_running; }, enumerable: true };


    /**
     * Create Xxx_asyncGenerator (an instance of guarded underlied asyn generator).
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of .guarded_underlined_asyncGenerator().
     */
    [ name_of_asyncGenerator_create ]( ...restArgs ) {

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncGenerator_create;

        NonReentrant_asyncPromise.throw_if_an_old_still_running.call( this,
          this.#asyncGenerator_running, funcNameInMessage );

        NonReentrant_asyncPromise
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      let asyncGenerator = NonReentrant_asyncPromise
        [ name_of_asyncGenerator_create_without_checking_precondition ]
        .apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     *
     * @param {NonReentrant_asyncPromise} this
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of .guarded_underlined_asyncGenerator().
     */
    static [ name_of_asyncGenerator_create_without_checking_precondition ](
      ...restArgs ) {

      this.#asyncGenerator_running = true;
      this[ name_of_asyncResult ] = undefined;

      let asyncGenerator = NonReentrant_asyncPromise
        [ name_of_asyncGenerator_guarded ].apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     * The guarded underlied async generator.
     *
     * @param {NonReentrant_asyncPromise} this
     */
    static async* [ name_of_asyncGenerator_guarded ]( ...restArgs ) {

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncGenerator_guarded;

        NonReentrant_asyncPromise.throw_call_another_if_false.call( this,
          this.#asyncGenerator_running, funcNameInMessage,
          name_of_asyncGenerator_create );
      }

      try {
        // 1.

//!!! (2023/03/25) seems not necessary to keep it as a member.
//         let underlied_asyncGenerator = NonReentrant_asyncPromise
//           [ name_of_underlied_asyncGenerator_func ].apply( this, restArgs );

        let underlied_asyncGenerator
          = underlied_asyncGenerator_func.apply( this, restArgs );

        let result = yield *underlied_asyncGenerator;
        return result;

      } catch ( e ) {
        //debugger;
        throw e;
  
      } finally {
        // 2. So that this async generator could be executed again.
        this.#asyncGenerator_running = false;
      }
    }


    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ](
      funcNameInMessage ) {

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      // Note: Property .Xxx_asyncPromise_running is created by sub-class
      //       (if exists).
      let b_asyncPromise_running = this[ name_of_asyncPromise_running ];

      if (   ( b_asyncPromise_running )
          || ( this.#asyncGenerator_running ) )
        throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
          + `should not be executed while an instance of `
          + `.${name_of_asyncPromise_create}() or `
          + `.${name_of_asyncGenerator_create}() `
          + `still running.` );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {boolean} b_still_running    If true, throw exception.
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      if ( b_still_running )
        throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
          + `An old instance of .${funcNameInMessage}() is still running.` );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {boolean} b                  If false, throw exception.
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     * @param {string} funcNameShouldBeCalledInMessage
     *   The function name which should be called instead. (e.g. init_promise_create)
     */
    static throw_call_another_if_false(
      b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      if ( !b )
        throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
          + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_not_asyncResult ]( funcNameInMessage ) {
      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      if ( !this[ name_of_asyncResult ] )
        throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
          + `should be executed only if `
          + `this.${name_of_asyncResult} ( ${this[ name_of_asyncResult ]} ) `
          + `is truthy (i.e. not undefined, not null, not false, `
          + `not 0, not NaN, not empty string "").` );
    }

  } );
}
