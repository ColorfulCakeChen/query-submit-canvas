export { AsyncGuarder_Base as Base };

import * as ClassHierarchyTools from "../ClassHierarchyTools.js";
import * as Pool from "../Pool.js";
//import * as Recyclable from "../Recyclable.js";
//import * as ValueMax from "../ValueMax.js";

/**
 * Return a wrapper class for preventing an underlied async generator from
 * being reentered.
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
 *   - Its 1st parameter must be progressParent (ValueMax.Percentage.Aggregate).
 */
function AsyncGuarder_Base(
  name_prefix, underlied_asyncGenerator_func, ParentClass = Object ) {

//!!! (2023/03/25) seems not necessary to keep it as a member.
//   const name_of_underlied_asyncGenerator_func
//     = `${name_prefix}_underlied_asyncGenerator_func`;

  /** Note:
   *
   * Although the property .Xxx_asyncPromise_running and
   * .Xxx_asyncPromise_create() will not be created by this AsyncGuarder_Base
   * class (they will be created by sub-class AsyncGuarder_RecyclableBase),
   * however, this class will try to check these properties. So, their names
   * should still be prepared.
   */
  const name_of_asyncPromise_running
    = `${name_prefix}_asyncPromise_running`;

  const name_of_asyncPromise_create
    = `${name_prefix}_asyncPromise_create`;


  const name_of_asyncGenerator_running
    = `${name_prefix}_asyncGenerator_running`;


  const name_of_asyncGenerator_create
    = `${name_prefix}_asyncGenerator_create`;

  const name_of_asyncGenerator_create_without_checking_precondition
    = `${name_prefix}_asyncGenerator_create_without_checking_precondition`;

  const name_of_asyncGenerator_guarded
    = `${name_prefix}_asyncGenerator_guarded`;

  const name_of_throw_if_asyncPromise_or_asyncGenerator_running
    = `${name_prefix}_throw_if_asyncPromise_or_asyncGenerator_running`;

  return (

  /**
   * A wrapper class for preventing an underlied async generator from being
   * reentered.
   *
   *

//!!! (2023/03/25) seems not necessary to keep it as a member.
//    * @member {AsyncGeneratorFunction} Xxx_underlied_asyncGenerator_func
//    *   A private property recording the function to create a underlied async
//    * generator which wants to be guarded by the .Xxx_asyncGenerator_running
//    * boolean flag.
//    *   - It will be called with thisArg as "this".
//    *   - Its 1st parameter must be progressParent (ValueMax.Percentage.Aggregate).

   *
   * @member {boolean} Xxx_asyncGenerator_running
   *   If true, a underlied async generator (i.e. .Xxx_asyncGenerator_guarded())
   * is still executing. Please wait it becoming false if wanting to call
   * .Xxx_asyncGenerator_create() again. The Xxx is name_prefix.
   *

!!! ...unfinished... (2023/03/26)
// .XxxOk = undefined;
   * @member {boolean} XxxOk

   * @member {Function} Xxx_asyncGenerator_create
   *   A method for creating the underlied async generator.
   *   - If an old instance is still executing, it will throw exception.
   *   - It accepts the same parameters as underlied_asyncGenerator_func().
   *   - It returns an async generator.
   *
   * @member {Function} Xxx_asyncGenerator_create_without_checking_precondition
   *   An internal static method called by .Xxx_asyncGenerator_create(). 
   *
   * @member {Function} Xxx_throw_if_asyncPromise_or_asyncGenerator_running
   *   A static method for throwing excption if .Xxx_asyncPromise_running or
   * .Xxx_asyncGenerator_running is true.
   *

!!! ...unfinished... (2023/03/26)
// need static throw_if_not_XxxOk()
   * @member {Function} Xxx_throw_if_not_XxxOk
 
   */
  class AsyncGuarder_Base extends ParentClass {

    #asyncGenerator_running;

//!!! (2023/03/25) seems not necessary to keep it as a member.
//     static [ name_of_underlied_asyncGenerator_func ]
//       = underlied_asyncGenerator_func;

    /**
     *
     */
    constructor( ...restArgs ) {
      super( ...restArgs );
      AsyncGuarder_Base.setAsConstructor_self.call( this );
    }

    /** @override */
    static setAsConstructor( ...restArgs ) {
      super.setAsConstructor.apply( this, restArgs );
      AsyncGuarder_Base.setAsConstructor_self.call( this );
      return this;
    }

    /** @override */
    static setAsConstructor_self() {

      // Define read-only and enumerable instance (i.e. this.Xxx) properties.
      {
        // Xxx_asyncGenerator_running
        Reflect.defineProperty( this,
          name_of_asyncGenerator_running,
          AsyncGuarder_Base.propertyDescriptor_of_asyncGenerator_running );
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
//           AsyncGuarder_Base
//             .propertyDescriptor_of_asyncGenerator_create );
//       }
//
//       // Define static (i.e. this.constructor's) properties.
//       {
//         // Xxx_throw_if_asyncPromise_or_asyncGenerator_running()
//         Reflect.defineProperty( this.constructor,
//           this.#name_of_throw_if_asyncPromise_or_asyncGenerator_running,
//           AsyncGuarder_Base
//             .propertyDescriptor_of_throw_if_asyncPromise_or_asyncGenerator_running );
//       }
    }

    /** @override */
    disposeResources() {

      Reflect.deleteProperty( this, name_of_asyncGenerator_running );

!!! ...unfinished... (2023/03/26)
// .XxxOk = undefined;

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

        AsyncGuarder_Base.throw_if_an_old_still_running.call( this,
          this.#asyncGenerator_running, funcNameInMessage );

        AsyncGuarder_Base
          [ name_of_throw_if_asyncPromise_or_asyncGenerator_running ]
          .call( this, funcNameInMessage );
      }

      let asyncGenerator = AsyncGuarder_Base
        [ name_of_asyncGenerator_create_without_checking_precondition ]
        .apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     *
     * @param {AsyncGuarder_Base} this
     *
     * @return {AsyncGenerator}
     *   Return the newly created instance of .guarded_underlined_asyncGenerator().
     */
    static [ name_of_asyncGenerator_create_without_checking_precondition ](
      ...restArgs ) {


      this.#asyncGenerator_running = true;

!!! ...unfinished... (2023/03/26)
// need clear .XxxOk flag to undefined here.
// e.g. this.initOk = undefined;


      let asyncGenerator = AsyncGuarder_Base
        [ name_of_asyncGenerator_guarded ].apply( this, restArgs );
      return asyncGenerator;
    }

    /**
     * The guarded underlied async generator.
     *
     * @param {AsyncGuarder_Base} this
     */
    static async* [ name_of_asyncGenerator_guarded ]( ...restArgs ) {

      { // Checking pre-condition.
        const funcNameInMessage = name_of_asyncGenerator_guarded;

        AsyncGuarder_Base.throw_call_another_if_false.call( this,
          this.#asyncGenerator_running, funcNameInMessage,
          name_of_asyncGenerator_create );
      }

      try {
        // 1.

//!!! (2023/03/25) seems not necessary to keep it as a member.
//         let underlied_asyncGenerator = AsyncGuarder_Base
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
     * @param {AsyncGuarder_Base} this
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
     * @param {AsyncGuarder_Base} this
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
     * @param {AsyncGuarder_Base} this
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


!!! ...unfinished... (2023/03/26)
// need static Xxx_throw_if_not_XxxOk()

    /**
     * @param {NeuralOrchestra_Base} this
     * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
     */
    static throw_if_not_versus_loadOk( funcNameInMessage ) {
      if ( !this.versus_loadOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `should be executed only if `
          + `this.versus_loadOk ( ${this.versus_loadOk} ) is true.` );
    }

  } );
}
