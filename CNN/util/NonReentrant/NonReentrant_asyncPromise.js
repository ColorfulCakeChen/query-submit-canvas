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
 *   - The awaited result value of the underlied async function could be any
 *       value except undefined.
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


  const name_of_throw_if_asyncPromise_running
    = `throw_if_${name_prefix}_asyncPromise_running`;

  const name_of_throw_if_asyncResult_undefined
    = `throw_if_${name_of_asyncResult}_undefined`;

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
   *   - The .Xxx_asyncPromise_guarded() will set this.XxxYyy (e.g.
   *       this.initOk) to the awaited result value of
   *       underlied_asyncPromise_func().

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
   * @member {Function} [ throw_if_XxxYyy_undefined ]
   *   A static method for throwing excption if ( this.XxxYyy ) is undefined.
   *
   * @member {Function} [ throw_if_not_XxxYyy ]
   *   A static method for throwing excption if ( !this.XxxYyy ) is true. That
   * is, if this.XxxYyy is either undefined or null or false or 0 or NaN or
   * empty string "", throw exception.
   */
  class NonReentrant_asyncPromise extends ParentClass {

    #asyncPromise_running;

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

      // Define read-only and enumerable instance (i.e. this.Abc) properties.
      {
        // Xxx_asyncPromise_running
        Reflect.defineProperty( this,
          name_of_asyncPromise_running,
          NonReentrant_asyncPromise.propertyDescriptor_of_asyncPromise_running );
      }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncPromise_running );

//!!! ...unfinished... (2023/03/28)
// Whether should let this[ name_of_asyncResult ] be a private read-only property.

      this[ name_of_asyncResult ] = undefined;
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
     * Create Xxx_asyncPromise (an instance of guarded underlied async
     * function).
     *
     * @return {AsyncFunction}
     *   Return the newly created instance of
     * this[ name_of_asyncPromise_guarded ]().
     */
    [ name_of_asyncPromise_create ]( ...restArgs ) {

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncPromise_create;

        NonReentrant_asyncPromise[ name_of_throw_if_asyncPromise_running ]
          .call( this, funcNameInMessage );


//!!! ...unfinished... (2023/03/28)
// How to integrate more precondition checking here?

      }

      let asyncPromise = NonReentrant_asyncPromise
        [ name_of_asyncPromise_create_without_checking_precondition ]
        .apply( this, restArgs );
      return asyncPromise;
    }

    /**
     *
     * @param {NonReentrant_asyncPromise} this
     *
     * @return {AsyncFunction}
     *   Return the newly created instance of
     * this[ name_of_asyncPromise_guarded ]().
     */
    static [ name_of_asyncPromise_create_without_checking_precondition ](
      ...restArgs ) {

      this.#asyncPromise_running = true;
      this[ name_of_asyncResult ] = undefined;

      let asyncPromise = NonReentrant_asyncPromise
        [ name_of_asyncPromise_guarded ].apply( this, restArgs );
      return asyncPromise;
    }

    /**
     * The guarded underlied async function.
     *
     * @param {NonReentrant_asyncPromise} this
     */
    static async* [ name_of_asyncPromise_guarded ]( ...restArgs ) {

      const funcNameInMessage = name_of_asyncPromise_guarded;
      { // Checking pre-condition.

        NonReentrant_asyncPromise.throw_call_another_if_false.call( this,
          this.#asyncPromise_running, funcNameInMessage,
          name_of_asyncPromise_create );
      }

      try {
        // 1.
        let underlied_asyncPromise
          = underlied_asyncPromise_func.apply( this, restArgs );

        let resultValue = await underlied_asyncPromise;
        this[ name_of_asyncResult ] = resultValue;

        // The result should be non-undefined. If result is undefined:
        //   - The async function forgets to return meaningful result.
        NonReentrant_asyncPromise[ name_of_throw_if_asyncResult_undefined ]
          .call( this, funcNameInMessage );

        return resultValue;

      } catch ( e ) {
        //debugger;
        throw e;
  
      } finally {
        // 2. So that this async method could be executed again.
        this.#asyncPromise_running = false;
      }
    }


    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncPromise_running ](
      funcNameInMessage ) {

      if ( !this.#asyncPromise_running )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should not be executed while an instance of `
        + `.${name_of_asyncPromise_create}() `
        + `is still running.` );
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

      if ( b )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncResult_undefined ]( funcNameInMessage ) {
      if ( this[ name_of_asyncResult ] !== undefined )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `this.${name_of_asyncResult} ( ${this[ name_of_asyncResult ]} ) `
        + `should not be undefined.` );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_not_asyncResult ]( funcNameInMessage ) {
      if ( this[ name_of_asyncResult ] )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should be executed only if `
        + `this.${name_of_asyncResult} ( ${this[ name_of_asyncResult ]} ) `
        + `is truthy (i.e. not undefined, not null, not false, `
        + `not 0, not NaN, not empty string "").` );
    }

  } );
}
