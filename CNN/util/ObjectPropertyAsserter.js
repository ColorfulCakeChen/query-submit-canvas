export { Base };

/**
 * Assert an object's properties.
 */
class Base {

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
    this.objectName = objectName;
    this.object = object;
    this.contextDescription = contextDescription;
  }

  /**
   * Assert ( this.object[ propertyName ] == value ).
   */
  propertyValue( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue != value )
      throw Error( `${this.objectName}.${propertyName} (${propertyValue}) should be (${value}). ${this.contextDescription}` );
  }

  /**
   * Assert ( this.object[ propertyName ] != value ).
   */
  propertyValueNE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue == value )
      throw Error( `${this.objectName}.${propertyName} (${propertyValue}) should not be (${value}). ${this.contextDescription}` );
  }

  /**
   * Assert ( this.object[ propertyName ] <= value ).
   */
  propertyValueLE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    if ( propertyValue > value )
      throw Error( `${this.objectName}.${propertyName} (${propertyValue}) should be <= (${value}). ${this.contextDescription}` );
  }

}
