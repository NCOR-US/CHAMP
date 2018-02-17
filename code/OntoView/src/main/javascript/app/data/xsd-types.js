let xsd = 'http://www.w3.org/2001/XMLSchema:';

const XsdTypes = {
    STRING: xsd + 'string',

    BYTE: xsd + 'byte',
    DECIMAL: xsd + 'decimal',
    INT: xsd + 'int',
    INTEGER: xsd + 'integer',
    LONG: xsd + 'long',
    NEGATIVE_INTEGER: xsd + 'negativeInteger',
    NON_NEGATIVE_INTEGER: xsd + 'nonNegativeInteger',
    POSITIVE_INTEGER: xsd + 'positiveInteger',
    SHORT: xsd + 'short',
    UNSIGNED_LONG: xsd + 'unsignedLong',
    UNSIGNED_INT: xsd + 'unsignedInt',
    UNSIGNED_SHORT: xsd + 'unsignedShort',
    UNSIGNED_BYTE: xsd + 'unsignedByte',

    ANY_URI: xsd + 'anyUri',
    BOOLEAN: xsd + 'boolean',
    DOUBLE: xsd + 'double',
    FLOAT: xsd + 'float',

    DATE: xsd + 'date',
    TIME: xsd + 'time',
    DATETIME: xsd + 'dateTime'
};

const ReverseXsdTypes = Object.keys(XsdTypes).reduce((acc, key) => {
    acc[XsdTypes[key]] = key;
    return acc;
}, {});

export {
    XsdTypes,
    ReverseXsdTypes
};
