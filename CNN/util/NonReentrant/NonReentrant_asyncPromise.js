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
 * @param {AsyncFunction} underlied_asyncPromise_func
 *   A function for creating an underlied async function which wants to be
 * guarded by the .Xxx_asyncPromise_running boolean flag.
 *   - It will be called with thisArg as "this".
 *   - The awaited result value of the underlied async function could be any
 *       value (including undefined).
 *   - The underlied async function must set .XxxOk to either true or false.
 */
function NonReentrant_asyncPromise(
  name_prefix, underlied_asyncPromise_func,
  ParentClass = Object ) {

  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;

  const name_of_asyncResultOk
    = `${name_prefix}Ok`;


  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;

  const name_of_asyncPromise_create_without_checking_precondition
    = `${name_prefix}_asyncPromise_create_without_checking_precondition`;

  const name_of_asyncPromise_guarded
    = `${name_prefix}_asyncPromise_guarded`;


  const name_of_throw_if_asyncPromise_running
    = `throw_if_${name_prefix}_asyncPromise_running`;

  const name_of_throw_if_asyncPromise_not_running
    = `throw_if_${name_prefix}_asyncPromise_not_running`;

  const name_of_throw_if_asyncResultOk_undefined
    = `throw_if_${name_of_asyncResultOk}_undefined`;

  const name_of_throw_if_not_asyncResultOk
    = `throw_if_not_${name_of_asyncResultOk}`;


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
   * @member {boolean} XxxOk
   *   A property recording whether underlied_asyncPromise_func() is succeeded.
   *   - The Xxx is name_prefix (e.g. "init").
   *   - It is not a private read-only property so that
   *       underlied_asyncPromise_func() can set it value.
   *   - The .Xxx_asyncPromise_create_without_checking_precondition() will
   *       clear this.XxxOk (e.g. this.initOk) to undefined.
   *   - The underlied_asyncPromise_func() must set this.XxxOk (e.g.
   *       this.initOk) to either true or false.
   *
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
   * @member {Function} throw_if_Xxx_asyncPromise_not_running
   *   A static method for throwing excption if .Xxx_asyncPromise_running is
   * false.
   *
   * @member {Function} [ throw_if_XxxOk_undefined ]
   *   A static method for throwing excption if ( this.XxxOk ) is undefined.
   *
   * @member {Function} [ throw_if_not_XxxOk ]
   *   A static method for throwing excption if this.XxxOk is not truthy.
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

      this[ name_of_asyncResultOk ] = undefined;
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
      this[ name_of_asyncResultOk ] = undefined;

      let asyncPromise = NonReentrant_asyncPromise
        [ name_of_asyncPromise_guarded ].apply( this, restArgs );
      return asyncPromise;
    }

    /**
     * The guarded underlied async function.
     *
     * @param {NonReentrant_asyncPromise} this
     */
    static async [ name_of_asyncPromise_guarded ]( ...restArgs ) {

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

        // The result should be non-undefined. If result is undefined:
        //   - The async function forgot to set it.
        NonReentrant_asyncPromise[ name_of_throw_if_asyncResultOk_undefined ]
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
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
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
     * @param {NonReentrant_asyncGenerator} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncPromise_not_running ](
      funcNameInMessage ) {

      if ( this.#asyncPromise_running )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should be executed during an instance of `
        + `.${name_of_asyncPromise_create}() `
        + `is running.` );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     *
     * @param {boolean} b
     *   If false, throw exception.
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     *
     * @param {string} funcNameShouldBeCalledInMessage
     *   The function name which should be called instead. (e.g.
     * init_promise_create)
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
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncResultOk_undefined ]( funcNameInMessage ) {
      if ( this[ name_of_asyncResultOk ] !== undefined )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `this.${name_of_asyncResultOk} ( ${this[ name_of_asyncResultOk ]} ) `
        + `should not be undefined. `
        + `The underlied async function must set it to either true or false.`
      );
    }

    /**
     * @param {NonReentrant_asyncPromise} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_not_asyncResultOk ]( funcNameInMessage ) {
      if ( this[ name_of_asyncResultOk ] )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should be executed only if `
        + `this.${name_of_asyncResultOk} ( ${this[ name_of_asyncResultOk ]} ) `
        + `is true.` );
    }

  } );
}
