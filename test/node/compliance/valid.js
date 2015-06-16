var data = {
    "description": "Valid bson documents",
    "documents": [
        {
            "encoded": "160000000268656c6c6f0006000000776f726c640000",
            "document": {
              "hello": "world"
            }
        },
        {
            "encoded": "ab0100000268656c6c6f0006000000776f726c640008626f6f6c65616e000110696e743332000200000012696e743634003868d9f60400000001646f75626c65001f85eb51b81e09400562696e6172790020000000044667414141414a6f5a5778736277414741414141643239796247514141413d3d0964617465008805c3fb4d0100001174696d657374616d700001000000010000000b646174615f7265676578006100730007646174615f6f69640011111111111111111111111103646174615f72656600250000000224726566000b000000636f6c6c656374696f6e000224696400020000003100000a646174615f756e646566696e656400ff646174615f6d696e6b6579007f646174615f6d61786b6579000f636f646500210000000d00000066756e6374696f6e28297b7d000c000000106100010000000003656d626564646564002c0000000f636f646500210000000d00000066756e6374696f6e28297b7d000c00000010610001000000000004617272617900300000000f3000210000000d00000066756e6374696f6e28297b7d000c0000001061000100000000103100010000000000",
            "document": {
              "hello": "world",
              "boolean": true,
              "int32": 2,
              "int64": {
                "$numberLong": "21321312312"
              },
              "double": 3.14,
              "binary": {
                "$binary": "FgAAAAJoZWxsbwAGAAAAd29ybGQAAA==", "$type": 4
              },
              "date": {
                "$date": {"$numberLong": "1434447971720"}
              },
              "timestamp": {
                "$timestamp": {"t": "1", "i": "1"}
              },
              "data_regex": {
                "$regexp": "a", "$options": "g"
              },
              "data_oid": {
                "$oid": "111111111111111111111111"
              },
              "data_ref": {
                "$ref": "collection", "$id": '1'
              },
              "data_undefined": {
                "$undefined": true
              },
              "data_minkey": {
                "$minKey": 1
              },
              "data_maxkey": {
                "$maxKey": 1
              },
              "code": {
                "$code": "function(){}"
              },
              "code": {
                "$code": "function(){}", "$scope": {"a":1}
              },
              "embedded": {
                "code": {
                  "$code": "function(){}", "$scope": {"a":1}
                },
              },
              "array": [{"$code": "function(){}", "$scope": {"a":1}}, 1]
            }
        },
    ]
}

module.exports = data;
