# BSON parser

BSON is short for Bin­ary JSON and is the bin­ary-en­coded seri­al­iz­a­tion of JSON-like doc­u­ments. You can learn more about it in [the specification](http://bsonspec.org).

This browser version of the BSON parser is compiled using [rollup](https://rollupjs.org/) and the current version is pre-compiled in the `dist` directory.

This is the default BSON parser, however, there is a C++ Node.js addon version as well that does not support the browser. It can be found at [mongod-js/bson-ext](https://github.com/mongodb-js/bson-ext).

## Usage

To build a new version perform the following operations:

```
npm install
npm run build
```

A simple example of how to use BSON in the browser:

```html
<script src="./dist/bson.js"></script>

<script>
  function start() {
    // Get the Long type
    const Long = BSON.Long;

    // Serialize document
    const doc = { long: Long.fromNumber(100) }

    // Serialize a document
    const data = BSON.serialize(doc)
    // De serialize it again
    const doc_2 = BSON.deserialize(data)
  }
</script>
```

A simple example of how to use BSON in `Node.js`:

```js
const BSON = require('bson');
const Long = BSON.Long;

const doc = { long: Long.fromNumber(100) };

// Serialize a document
const data = BSON.serialize(doc);
console.log('data:', data);

// Deserialize the resulting Buffer
const doc_2 = BSON.deserialize(data);
console.log('doc_2:', doc_2);
```

## Installation

`npm install bson`

## Documentation

### Functions

<dl>
<dt><a href="#setInternalBufferSize">setInternalBufferSize(size)</a></dt>
<dd><p>Sets the size of the internal serialization buffer.</p>
</dd>
<dt><a href="#serialize">serialize(object)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Serialize a Javascript object.</p>
</dd>
<dt><a href="#serializeWithBufferAndIndex">serializeWithBufferAndIndex(object, buffer)</a> ⇒ <code>Number</code></dt>
<dd><p>Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.</p>
</dd>
<dt><a href="#deserialize">deserialize(buffer)</a> ⇒ <code>Object</code></dt>
<dd><p>Deserialize data as BSON.</p>
</dd>
<dt><a href="#calculateObjectSize">calculateObjectSize(object)</a> ⇒ <code>Number</code></dt>
<dd><p>Calculate the bson size for a passed in Javascript object.</p>
</dd>
<dt><a href="#deserializeStream">deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, [options])</a> ⇒ <code>Number</code></dt>
<dd><p>Deserialize stream data as BSON documents.</p>
</dd>
</dl>

<a name="setInternalBufferSize"></a>

### setInternalBufferSize(size)

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | The desired size for the internal serialization buffer |

Sets the size of the internal serialization buffer.

<a name="serialize"></a>

### serialize(object)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to serialize. |
| [options.checkKeys] | <code>Boolean</code> |  | the serializer will check if keys are valid. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |

Serialize a Javascript object.

**Returns**: <code>Buffer</code> - returns the Buffer object containing the serialized object.  
<a name="serializeWithBufferAndIndex"></a>

### serializeWithBufferAndIndex(object, buffer)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to serialize. |
| buffer | <code>Buffer</code> |  | the Buffer you pre-allocated to store the serialized BSON object. |
| [options.checkKeys] | <code>Boolean</code> |  | the serializer will check if keys are valid. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |
| [options.index] | <code>Number</code> |  | the index in the buffer where we wish to start serializing into. |

Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.

**Returns**: <code>Number</code> - returns the index pointing to the last written byte in the buffer.  
<a name="deserialize"></a>

### deserialize(buffer)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| buffer | <code>Buffer</code> |  | the buffer containing the serialized set of BSON documents. |
| [options.evalFunctions] | <code>Object</code> | <code>false</code> | evaluate functions in the BSON document scoped to the object deserialized. |
| [options.cacheFunctions] | <code>Object</code> | <code>false</code> | cache evaluated functions for reuse. |
| [options.cacheFunctionsCrc32] | <code>Object</code> | <code>false</code> | use a crc32 code for caching, otherwise use the string of the function. |
| [options.promoteLongs] | <code>Object</code> | <code>true</code> | when deserializing a Long will fit it into a Number if it's smaller than 53 bits |
| [options.promoteBuffers] | <code>Object</code> | <code>false</code> | when deserializing a Binary will return it as a node.js Buffer instance. |
| [options.promoteValues] | <code>Object</code> | <code>false</code> | when deserializing will promote BSON values to their Node.js closest equivalent types. |
| [options.fieldsAsRaw] | <code>Object</code> | <code></code> | allow to specify if there what fields we wish to return as unserialized raw buffer. |
| [options.bsonRegExp] | <code>Object</code> | <code>false</code> | return BSON regular expressions as BSONRegExp instances. |
| [options.allowObjectSmallerThanBufferSize] | <code>boolean</code> | <code>false</code> | allows the buffer to be larger than the parsed BSON object |

Deserialize data as BSON.

**Returns**: <code>Object</code> - returns the deserialized Javascript Object.  
<a name="calculateObjectSize"></a>

### calculateObjectSize(object)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to calculate the BSON byte size for. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |

Calculate the bson size for a passed in Javascript object.

**Returns**: <code>Number</code> - returns the number of bytes the BSON object will take up.  
<a name="deserializeStream"></a>

### deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>Buffer</code> |  | the buffer containing the serialized set of BSON documents. |
| startIndex | <code>Number</code> |  | the start index in the data Buffer where the deserialization is to start. |
| numberOfDocuments | <code>Number</code> |  | number of documents to deserialize. |
| documents | <code>Array</code> |  | an array where to store the deserialized documents. |
| docStartIndex | <code>Number</code> |  | the index in the documents array from where to start inserting documents. |
| [options] | <code>Object</code> |  | additional options used for the deserialization. |
| [options.evalFunctions] | <code>Object</code> | <code>false</code> | evaluate functions in the BSON document scoped to the object deserialized. |
| [options.cacheFunctions] | <code>Object</code> | <code>false</code> | cache evaluated functions for reuse. |
| [options.cacheFunctionsCrc32] | <code>Object</code> | <code>false</code> | use a crc32 code for caching, otherwise use the string of the function. |
| [options.promoteLongs] | <code>Object</code> | <code>true</code> | when deserializing a Long will fit it into a Number if it's smaller than 53 bits |
| [options.promoteBuffers] | <code>Object</code> | <code>false</code> | when deserializing a Binary will return it as a node.js Buffer instance. |
| [options.promoteValues] | <code>Object</code> | <code>false</code> | when deserializing will promote BSON values to their Node.js closest equivalent types. |
| [options.fieldsAsRaw] | <code>Object</code> | <code></code> | allow to specify if there what fields we wish to return as unserialized raw buffer. |
| [options.bsonRegExp] | <code>Object</code> | <code>false</code> | return BSON regular expressions as BSONRegExp instances. |

Deserialize stream data as BSON documents.

**Returns**: <code>Number</code> - returns the next index in the buffer after deserialization **x** numbers of documents.  

## FAQ

#### Why does `undefined` get converted to `null`?

The `undefined` BSON type has been [deprecated for many years](http://bsonspec.org/spec.html), so this library has dropped support for it. Use the `ignoreUndefined` option (for example, from the [driver](http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#connect) ) to instead remove `undefined` keys.

#### How do I add custom serialization logic?

This library looks for `toBSON()` functions on every path, and calls the `toBSON()` function to get the value to serialize.

```javascript
const BSON = require('bson');

class CustomSerialize {
  toBSON() {
    return 42;
  }
}

const obj = { answer: new CustomSerialize() };
// "{ answer: 42 }"
console.log(BSON.deserialize(BSON.serialize(obj)));
```
