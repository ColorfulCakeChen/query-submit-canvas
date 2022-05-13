export { Base };

/**
 * Assert an object's properties.
 */
class Base {

  /**
   * @param {string} objectName
   *   The object's name for debug easily. 
   *
   * @param {object} object
   *   The step object for 's name for debug easily. 
   *
   * @param {string} contextDescription
   *   Context message for debug easily. 
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
    tf.util.assert( ( propertyValue == value ),
      `${this.objectName}.${propertyName} (${propertyValue}) should be (${value}). ${this.contextDescription}`);
  }

  /**
   * Assert ( this.object[ propertyName ] != value ).
   */
  propertyValueNE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    tf.util.assert( ( propertyValue != value ),
      `${this.objectName}.${propertyName} (${propertyValue}) should not be (${value}). ${this.contextDescription}`);
  }

  /**
   * Assert ( this.object[ propertyName ] <= value ).
   */
  propertyValueLE( propertyName, value ) {
    let propertyValue = this.object[ propertyName ];
    tf.util.assert( ( propertyValue <= value ),
      `${this.objectName}.${propertyName} (${propertyValue}) should be <= (${value}). ${this.contextDescription}`);
  }

}
