export { ObjectPropertyAsserter_Base as Base };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";

/**
 * Assert an object's properties.
 */
class ObjectPropertyAsserter_Base extends Recyclable.Root {

  /**
   * Used as default ObjectPropertyAsserter.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "ObjectPropertyAsserter.Base.Pool",
    ObjectPropertyAsserter_Base,
    ObjectPropertyAsserter_Base.setAsConstructor );

  /**
   * @param {string} objectName
   *   The object's name for debug easily. 
   *
   * @param {Object} object
   *   The object whose properties will be asserted by method .propertyXxx().
   *
   * @param {Object} contextDescription
   *   Its .toString() will become the context message for debug easily. 
   */
  constructor( objectName, object, contextDescription ) {
    super();
    this.#setAsConstructor_self( objectName, object, contextDescription );
  }

  /** @override */
  setAsConstructor( objectName, object, contextDescription ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( objectName, object, contextDescription );
  }

  /**  */
  #setAsConstructor_self( objectName, object, contextDescription ) {
    this.objectName = objectName;
    this.object = object;
    this.contextDescription = contextDescription;
  }

  /** @override */
  disposeResources() {
    this.contextDescription = null;
    this.object = null;
    this.objectName = null;
    super.disposeResources();
  }

  /**
   * Assert ( this.object[ propertyName ] == value ).
   */
  propertyValue( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue != value )
      throw Error( `${this.objectName}.${propertyName} ( ${propertyValue} ) `
        + `should be ( ${value} ). ${this.contextDescription}` );
  }

  /**
   * Assert ( this.object[ propertyName ] != value ).
   */
  propertyValueNE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue == value )
      throw Error( `${this.objectName}.${propertyName} ( ${propertyValue} ) `
        + `should not be ( ${value} ). ${this.contextDescription}` );
  }

  /**
   * Assert ( this.object[ propertyName ] <= value ).
   */
  propertyValueLE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue > value )
      throw Error( `${this.objectName}.${propertyName} ( ${propertyValue} ) `
        + `should be <= ( ${value} ). ${this.contextDescription}` );
  }

  /**
   * Assert ( this.object[ propertyName ] >= value ).
   */
  propertyValueGE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue < value )
      throw Error( `${this.objectName}.${propertyName} ( ${propertyValue} ) `
        + `should be >= ( ${value} ). ${this.contextDescription}` );
  }

}
