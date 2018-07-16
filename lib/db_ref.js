'use strict';
/**
 * A class representation of the BSON DBRef type.
 */
class DBRef {
  /**
   * Create a DBRef type
   *
   * @param {string} collection the collection name.
   * @param {ObjectID} oid the reference ObjectID.
   * @param {string} [db] optional db name, if omitted the reference is local to the current db.
   * @return {DBRef}
   */
  constructor(collection, oid, db, fields) {
    // check if namespace has been provided
    const parts = collection.split('.');
    if (parts.length === 2) {
      db = parts.shift();
      collection = parts.shift();
    }

    this._bsontype = 'DBRef';
    this.collection = collection;
    this.oid = oid;
    this.db = db;
    this.fields = fields || {};
  }

  /**
   * @ignore
   * @api private
   */
  toJSON() {
    const o = Object.assign(
      {
        $ref: this.collection,
        $id: this.oid
      },
      this.fields
    );

    if (this.db != null) o.$db = this.db;
    return o;
  }
}

module.exports = DBRef;
