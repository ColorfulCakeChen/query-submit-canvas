export { NonReentrant_asyncGenerator as asyncGenerator };

import * as ClassHierarchyTools from "../ClassHierarchyTools.js";

/**
 * Return a wrapper class for preventing an underlied async generator from
 * being reentered.
 *
 *
 * @param {string} name_prefix
 *   The prefix for all async operations and flags. (e.g. "init" or "fetch"
 * or "workerProxies_init" or "versus_load" or "imageData_process")
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
function NonReentrant_asyncGenerator(
  name_prefix, underlied_asyncGenerator_func,
  ParentClass = Object ) {

  /** Note:
   *
   * Although the property .Xxx_asyncPromise_running and
   * .Xxx_asyncPromise_create() will not be created by this
   * NonReentrant_asyncGenerator class (they will be created by sub-class
   * NonReentrant_asyncPromise_by_asyncGenerator), however, this class will
   * try to check these properties. So, their names should still be prepared.
   */
  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;

  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;


  const name_of_asyncGenerator_running
    = `${name_prefix}_asyncGenerator_running`;

  const name_of_asyncResultOk
    = `${name_prefix}Ok`;


  const name_of_asyncGenerator_create
    = `${name_prefix}_asyncGenerator_create`;

  const name_of_asyncGenerator_create_without_checking_precondition
    = `${name_prefix}_asyncGenerator_create_without_checking_precondition`;

  const name_of_asyncGenerator_guarded
    = `${name_prefix}_asyncGenerator_guarded`;


  const name_of_throw_if_an_old_asyncGenerator_still_running
    = `throw_if_an_old_${name_prefix}_asyncGenerator_still_running`;

  const name_of_throw_if_asyncPromise_or_asyncGenerator_running
    = `throw_if_${name_prefix}_asyncPromise_or_asyncGenerator_running`;

  const name_of_throw_if_asyncPromise_and_asyncGenerator_not_running
    = `throw_if_${name_prefix}_asyncPromise_and_asyncGenerator_not_running`;

  const name_of_throw_if_asyncResultOk_undefined
    = `throw_if_${name_of_asyncResultOk}_undefined`;

  const name_of_throw_if_not_asyncResultOk
    = `throw_if_not_${name_of_asyncResultOk}`;


  return (

  /**
   * A wrapper class for preventing an underlied async generator from being
   * reentered. (Reentrancy Preventer)
   *
   *
   * @member {boolean} Xxx_asyncGenerator_running
   *   If true, a underlied async generator (i.e. .Xxx_asyncGenerator_guarded())
   * is still executing. Please wait it becoming false if wanting to call
   * .Xxx_asyncGenerator_create() again. The Xxx is name_prefix (e.g. "init").
   *
   * @member {boolean} XxxOk
   *   A property recording whether underlied_asyncGenerator_func() is
   * succeeded.
   *   - The Xxx is name_prefix (e.g. "init").
   *   - It is not a private read-only property so that
   *       underlied_asyncGenerator_func() can set it value.
   *   - The .Xxx_asyncGenerator_create_without_checking_precondition() will
   *       clear this.XxxOk (e.g. this.initOk) to undefined.
   *   - The underlied_asyncGenerator_func() must set this.XxxOk (e.g.
   *       this.initOk) to either true or false.
   *
   * @member {Function} Xxx_asyncGenerator_create
   *   A method for creating the underlied async generator.
   *   - If an old instance is still executing, it will throw exception.
   *   - It accepts the same parameters as underlied_asyncGenerator_func().
   *   - It returns an async generator.
   *
   * @member {Function} Xxx_asyncGenerator_create_without_checking_precondition
   *   An internal static method called by .Xxx_asyncGenerator_create(). 
   *
   * @member {Function} throw_if_Xxx_asyncPromise_or_asyncGenerator_running
   *   A static method for throwing excption if .Xxx_asyncPromise_running or
   * .Xxx_asyncGenerator_running is true.
   *
   * @member {Function} throw_if_Xxx_asyncPromise_and_asyncGenerator_not_running
   *   A static method for throwing excption if .Xxx_asyncPromise_running and
   * .Xxx_asyncGenerator_running is false.
   *
   * @member {Function} throw_if_XxxOk_undefined
   *   A static method for throwing excption if ( this.XxxOk ) is undefined.
   *
   * @member {Function} throw_if_not_XxxOk
   *   A static method for throwing excption if this.XxxOk is not truthy.
   */
  class NonReentrant_asyncGenerator extends ParentClass {

    #asyncGenerator_running;

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
        // Xxx_asyncGenerator_running
        Reflect.defineProperty( this,
          name_of_asyncGenerator_running,
          NonReentrant_asyncGenerator.propertyDescriptor_of_asyncGenerator_running );
      }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncGenerator_running );

      this[ name_of_asyncResultOk ] = undefined;
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
     * Create Xxx_asyncGenerator (an instance of guarded underlied async
     * generator).
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of
     * this[ name_of_asyncGenerator_guarded ]().
     */
    [ name_of_asyncGenerator_create ]( ...restArgs ) {

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncGenerator_create;

        NonReentrant_asyncGenerator
          [ name_of_throw_if_an_old_asyncGenerator_still_running ]
          .call( this, funcNameInMessage );

        NonReentrant_asyncGenerator
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      let asyncGenerator = NonReentrant_asyncGenerator
        [ name_of_asyncGenerator_create_without_checking_precondition ]
        .apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     *
     * @param {NonReentrant_asyncGenerator} this
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of
     * this[ name_of_asyncGenerator_guarded ].
     */
    static [ name_of_asyncGenerator_create_without_checking_precondition ](
      ...restArgs ) {

      this.#asyncGenerator_running = true;
      this[ name_of_asyncResultOk ] = undefined;

      let asyncGenerator = NonReentrant_asyncGenerator
        [ name_of_asyncGenerator_guarded ].apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     * The guarded underlied async generator.
     *
     * @param {NonReentrant_asyncGenerator} this
     */
    static async* [ name_of_asyncGenerator_guarded ]( ...restArgs ) {

      const funcNameInMessage = name_of_asyncGenerator_guarded;
      { // Checking pre-condition.

        NonReentrant_asyncGenerator.throw_call_another_if_false.call( this,
          this.#asyncGenerator_running, funcNameInMessage,
          name_of_asyncGenerator_create );
      }

      try {
        // 1.
        let underlied_asyncGenerator
          = underlied_asyncGenerator_func.apply( this, restArgs );

        let resultValue = yield *underlied_asyncGenerator;

        // The resultValue should be non-undefined. If it is undefined:
        //   - The generator forgot to return meaningful result.
        //   - The generator may have been terminated previously by throwing
        //       exception. So, throw exception to inform caller the generator
        //       may be illegal.
        if ( resultValue === undefined ) {
          const mostDerivedClassName
            = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

          throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
            + `resultValue ( ${resultValue} ) `
            + `should not be undefined. `
            + `Perhaps, ${name_prefix}_asyncGenerator is illegal `
            + `(e.g. has been terminated previously by throwing exception).`
          );
        }

        // The .XxxOk should be non-undefined. If it is undefined:
        //   - The generator forgot to set it.
        NonReentrant_asyncGenerator[ name_of_throw_if_asyncResultOk_undefined ]
          .call( this, funcNameInMessage );

        return resultValue;

      } catch ( e ) {
        //debugger;
        throw e;
  
      } finally {
        // 2. So that this async generator could be executed again.
        this.#asyncGenerator_running = false;
      }
    }


    /**
     * @param {NonReentrant_asyncGenerator} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ](
      funcNameInMessage ) {

      // Note: Property .Xxx_asyncPromise_running is created by sub-class
      //       (if exists).
      if (   ( !this.#asyncGenerator_running )
          && ( !this[ name_of_asyncPromise_running ] ) // b_asyncPromise_running
         )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should not be executed while an instance of `
        + `.${name_of_asyncPromise_create}() or `
        + `.${name_of_asyncGenerator_create}() `
        + `is still running.` );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_asyncPromise_and_asyncGenerator_not_running ](
      funcNameInMessage ) {

      // Note: Property .Xxx_asyncPromise_running is created by sub-class
      //       (if exists).
      if (   ( this.#asyncGenerator_running )
          || ( this[ name_of_asyncPromise_running ] ) // b_asyncPromise_running
         )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `should be executed during an instance of `
        + `.${name_of_asyncPromise_create}() or `
        + `.${name_of_asyncGenerator_create}() `
        + `is running.` );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
     *
     * @param {boolean} b_still_running
     *   If true, throw exception.
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
      if ( !b_still_running )
        return;

      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `An old instance of .${funcNameInMessage}() is still running.` );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
     *
     * @param {string} funcNameInMessage
     *   The caller function name. (e.g. init_async)
     */
    static [ name_of_throw_if_an_old_asyncGenerator_still_running ](
      funcNameInMessage ) {
      NonReentrant_asyncGenerator.throw_if_an_old_still_running.call( this,
        this.#asyncGenerator_running, funcNameInMessage );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
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
        + `The underlied async generator must set it to either true or false.`
      );
    }

    /**
     * @param {NonReentrant_asyncGenerator} this
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
