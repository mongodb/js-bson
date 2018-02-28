'use strict';
/**
 * A class representation of the BSON DBRef type.
 *
 * @class
 * @param {string} collection the collection name.
 * @param {ObjectID} oid the reference ObjectID.
 * @param {string} [db] optional db name, if omitted the reference is local to the current db.
 * @return {DBRef}
 */
function DBRef(collection, oid, db, fields) {
  if (!(this instanceof DBRef)) return new DBRef(collection, oid, db, fields);

  // check if namespace has been provided
  var parts = collection.split('.');
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
DBRef.prototype.toJSON = function() {
  var o = {
    $ref: this.collection,
    $id: this.oid
  };

  if (this.db != null) o.$db = this.db;
  o = Object.assign(o, this.fields);
  return o;
};

module.exports = DBRef;
module.exports.DBRef = DBRef;
