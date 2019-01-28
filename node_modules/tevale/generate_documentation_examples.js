'use strict';

const tevale = require('./src/tevale');

const exampleVariables = {
    'somePositiveNumericValue': 123,
    'someZeroValue': 0,
    'someNegativeNumericValue': -50,
    'stringValue': 'hello',
    'emptyStringValue': '',
    'longStringValue': 'mA26EKMPupgvp6XYlGAVJZKv6yvaD3aobXMyExvyMBa2Hi9LlJXTUaBveMR9ErHtSfXNHHW5xAKbz2DVfBOqQ8CaSMNMQRBrJRpEpsO7FygKZmKpKHvvtPviOTfyUE0HGhnSPYHb9Hbz1CMxab4T0iQxPLCwrg57Qi0sTW1sJhVSygD9ivCfhJwJmD9PNb8bV0rJJ9aWp84LeaC7PDkj5hAozkrrJVA5hozLSXGZb0A4JLKiPOe9ITvxcIqvPNaMPA2SF4AQasE01TeGyuHQICuAMTGFFAP9y0HJBm7N0XmU',
    'trueBooleanValue': true,
    'falseBooleanValue': false,
    'nullBooleanValue': null,
    'simpleObjectValue': {
        'someNumericValue': 123,
        'someStringValue': 'hello there',
        'someNullValue': null,
        'someBooleanValue': false,
    },
    'complexObjectValue': {
        'internalObjectValue': {
            'someNumericValue': 123,
            'someStringValue': 'hello there',
            'someNullValue': null,
            'someBooleanValue': false,
        },
    },
    'superComplexObjectValue': {
        'internalObjectValue': {
            'moreInternalObjectValue': {
                'someNumericValue': 123,
                'someStringValue': 'hello there',
                'someNullValue': null,
                'someBooleanValue': false,
            },
        },
    },
    'typicalObjectValue': {
        'branch_name': 'master',
        'working_dir': '/tmp/whatever',
        'success': true,
    },
    'emptyObjectValue': {},

    'author': {
        'name': 'Alon Diamant',
        'homepage': 'http://www.alondiamant.com',
        'github': {
            'repositories': 12,
            'url': 'http://www.github.com/advance512',
        },
    },
    'company': {
        'name': 'Codefresh',
        'homepage': 'http://www.codefresh.io',
        'phoneNumber': '+972-99-999-9999',
    },
};

const expressionsAndExpectedResults = {
    'empty': {
        expression: '',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'null': {
        expression: 'null',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'false': {
        expression: 'false',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'positive number': {
        expression: '1234',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'negative number': {
        expression: '-1234',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'zero number': {
        expression: '0000000',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'empty string': {
        expression: '""',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'string1': {
        expression: '"asdasd"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'string2': {
        expression: '\'asdasd\'',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'string3': {
        expression: '`asdasd`',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------
    'numeric variable value': {
        expression: 'somePositiveNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'zero variable value': {
        expression: 'someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'negative variable value': {
        expression: 'someNegativeNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    // ------------------
    'string variable value': {
        expression: 'stringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'empty string variable value': {
        expression: 'emptyStringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'long string variable value': {
        expression: 'longStringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    // ------------------
    'true boolean value': {
        expression: 'trueBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'false boolean value': {
        expression: 'falseBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },
    'not false boolean value': {
        expression: '!falseBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    'null boolean value': {
        expression: 'nullBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'invalidIdentifer': {
        expression: 'invalidIdentifer',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------

    'numeric comparison 1': {
        expression: 'somePositiveNumericValue > someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'numeric comparison 2': {
        expression: 'somePositiveNumericValue < someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'numeric comparison 3': {
        expression: 'somePositiveNumericValue >= someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'numeric comparison 4': {
        expression: 'somePositiveNumericValue <= someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'numeric comparison 5': {
        expression: 'somePositiveNumericValue >= somePositiveNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'numeric comparison 6': {
        expression: 'somePositiveNumericValue <= somePositiveNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },


    // ------------------

    'string comparison 1': {
        expression: 'longStringValue > emptyStringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string comparison 2': {
        expression: 'longStringValue < emptyStringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'string comparison 3': {
        expression: 'longStringValue == longStringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string comparison 4': {
        expression: 'longStringValue === longStringValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string comparison 5': {
        expression: 'longStringValue > stringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string comparison 6': {
        expression: 'longStringValue < stringValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    // ------------------

    'simple object value 1': {
        expression: 'simpleObjectValue.someNumericValue == 123',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'simple object value 2': {
        expression: 'simpleObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'simple object value 3': {
        expression: 'simpleObjectValue.someNullValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'simple object value 4': {
        expression: 'simpleObjectValue.someBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'simple object value 5': {
        expression: 'simpleObjectValue.someBooleanValue == false',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'complex object value 1': {
        expression: 'complexObjectValue.internalObjectValue.someNumericValue == 123',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'complex object value 2': {
        expression: 'complexObjectValue.internalObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'complex object value 3': {
        expression: 'complexObjectValue.internalObjectValue.someNullValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'complex object value 4': {
        expression: 'complexObjectValue.internalObjectValue.someBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'complex object value 5': {
        expression: 'complexObjectValue.internalObjectValue.someBooleanValue == false',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'super complex object value 1': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.someNumericValue == 123',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'super complex object value 2': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'super complex object value 3': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.someNullValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'super complex object value 4': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.someBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'super complex object value 5': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.someBooleanValue == false',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'typical object value 1': {
        expression: 'typicalObjectValue.branch_name == "master"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'typical object value 2': {
        expression: 'typicalObjectValue.working_dir == "/var/tmp"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'typical object value 3': {
        expression: '!!typicalObjectValue.success',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'typical object value 4': {
        expression: 'typicalObjectValue.success == true',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'typical object value 5': {
        expression: 'typicalObjectValue.nonExistant',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'typical object value 6': {
        expression: 'typicalObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'empty object value 1': {
        expression: 'emptyObjectValue.someBooleanValue == false',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'empty object value 2': {
        expression: 'emptyObjectValue.someBooleanValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'empty object value 3': {
        expression: 'emptyObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 1': {
        expression: 'superComplexObjectValue.',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 2': {
        expression: 'superComplexObjectValue..',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 3': {
        expression: 'superComplexObjectValue.internalObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 4': {
        expression: 'superComplexObjectValue.internalObjectValue.',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 5': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 6': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 7': {
        expression: 'superComplexObjectValue.internalObjectValue.moreInternalObjectValue.nonExistant',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 8': {
        expression: 'superComplexObjectValue.internal Object Value.moreInternalObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad object syntax 9': {
        expression: 'superComplexObjectValue.internalObject.Value.moreInternalObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------

    'weird comparison 1': {
        expression: 'somePositiveNumericValue > null',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 2': {
        expression: 'somePositiveNumericValue < stringValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 3': {
        expression: 'somePositiveNumericValue > true',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 4': {
        expression: 'somePositiveNumericValue > simpleObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 5': {
        expression: 'complexObjectValue > simpleObjectValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 6': {
        expression: 'false > null',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 7': {
        expression: 'false > true',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 8': {
        expression: 'someStringValue > null',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 9': {
        expression: 'internalObjectValue.someNumericValue > null',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 10': {
        expression: 'typicalObjectValue.working_dir > 82',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
    'weird comparison 11': {
        expression: 'typicalObjectValue.working_dir > complexObjectValue.internalObjectValue.someNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------


    'parentheses 1': {
        expression: '(somePositiveNumericValue > someZeroValue)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 2': {
        expression: '(somePositiveNumericValue >= someZeroValue) && true',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 3': {
        expression: '(longStringValue > emptyStringValue) && (longStringValue >= emptyStringValue)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 4': {
        expression: '((longStringValue > emptyStringValue) && (longStringValue >= emptyStringValue))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 5': {
        expression: '(longStringValue > emptyStringValue && (longStringValue >= emptyStringValue))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 6': {
        expression: '60 > 35 && (50 > 22 && ((90 > 33) && ((26 > 10) && 15 > 30)) || (80 > 32))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 7': {
        expression: '60 > 35 && (50 > 22 && ((90 > 33) && ((26 > 10) && 15 > 30)) || (80 < 32))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'parentheses 8': {
        expression: '60 > 35 && (50 > 22 && ((90 > 33) && ((26 > 10) && 15 > 30)) || (somePositiveNumericValue > 32))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'parentheses 9': {
        expression: '60 > 35 && (50 > 22 && ((90 > 33) && ((26 > 10) && 15 > 30)) || (somePositiveNumericValue < 32))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    // ------------------

    'division by 0': {
        expression: 'somePositiveNumericValue / someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'modulo by 0': {
        expression: 'somePositiveNumericValue % someZeroValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'division': {
        expression: 'somePositiveNumericValue / somePositiveNumericValue',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'really big number': {
        expression: '9007199254740991 * 9007199254740991',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'fractions': {
        expression: '1.231 * 5.2342',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '+true': {
        expression: '+true',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    '+234': {
        expression: '+234',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '~234': {
        expression: '~234',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'number+true': {
        expression: '555+true',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    '23423-223': {
        expression: '23423-223',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },
    '123-123': {
        expression: '123-123',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    '!true': {
        expression: '!true',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    '!!true': {
        expression: '!!true',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '!!!!!!!!!!true': {
        expression: '!!!!!!!!!!true',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '!33': {
        expression: '!33',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    '!!33': {
        expression: '!!33',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '!0': {
        expression: '!0',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    '!!0': {
        expression: '!!0',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    '55 % 10': {
        expression: '55 % 10 == 5',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'numeric overflow': {
        expression: '1.79E+308 * 1.79E+308',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'unsupported operator': {
        expression: '15 | 33',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'weird operator 1': {
        expression: '5555 @ 33333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'weird operator 2': {
        expression: '5555 $ 33333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'weird operator 3': {
        expression: '5555 \\ 33333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'weird operator 4': {
        expression: '5555 : 33333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'weird operator 5': {
        expression: '5555 :::: 33333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string division 1': {
        expression: 'stringValue / 5',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string division 2': {
        expression: 'stringValue / stringValue',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string adding 1': {
        expression: 'stringValue + 5',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string adding 2': {
        expression: 'stringValue + 5',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'this': {
        expression: 'this',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'trinary operator': {
        expression: '5 > 2 ? 4 : 1',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'array': {
        expression: '[1, 2, 3]',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------

    'function 1': {
        expression: 'upper(stringValue)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'function 2': {
        expression: 'substring(stringValue, 2, 4)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'function 3': {
        expression: 'substring(stringValue, 20, 40)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'bad function call 1': {
        expression: 'upper()',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 2': {
        expression: 'lower(123)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 3': {
        expression: 'lower("asd", 3, 5)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 4': {
        expression: 'trim(null)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 5': {
        expression: 'Number(false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 6': {
        expression: 'hello(false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad function call 7': {
        expression: '123(false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    // ------------------

    'string conversion 1': {
        expression: 'String("123")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string conversion 2': {
        expression: 'String(123)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string conversion 3': {
        expression: 'String("0")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string conversion 4': {
        expression: 'String(0)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'number conversion 1': {
        expression: 'Number("123")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'number conversion 2': {
        expression: 'Number(123)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'number conversion 3': {
        expression: 'Number("0")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'number conversion 4': {
        expression: 'Number(0)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'number conversion 5': {
        expression: 'Number("hello there")',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'boolean conversion 1': {
        expression: 'Boolean("123")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'boolean conversion 2': {
        expression: 'Boolean(123)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'boolean conversion 3': {
        expression: 'Boolean("0")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'boolean conversion 4': {
        expression: 'Boolean(0)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'boolean conversion 5': {
        expression: 'Boolean("hello there")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'boolean conversion 6': {
        expression: 'Boolean("")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'chain conversion 1': {
        expression: 'Boolean(Number(String(0)))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'chain conversion 2': {
        expression: 'Boolean(Number(String(1)))',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'round 1': {
        expression: 'round("asd")',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'round 2': {
        expression: 'round("13")',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'round 3': {
        expression: 'round(13)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'round 4': {
        expression: 'round(13) == round(13.1222)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'round 5': {
        expression: 'round(13) != round(13.9922)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'round 6': {
        expression: 'round(13) == floor(13.9922)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'floor 1': {
        expression: 'floor(13E8)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'floor 2': {
        expression: 'floor(1359 / 342)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'upper 1': {
        expression: 'upper("alon") == "ALON"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'upper 2': {
        expression: 'upper("asd") != "ALON"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'upper 3': {
        expression: 'upper("asd") != 333',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'lower 1': {
        expression: 'lower("DIAMANT") == "diamant"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'lower 2': {
        expression: 'lower("asd") != "ALON"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'lower 3': {
        expression: 'lower("ASD") == "asd"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'trim 1': {
        expression: 'trim("   ASD   ") == "ASD"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'trim 2': {
        expression: 'trim(lower("   ASD   ")) == "asd"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'trim 3': {
        expression: 'lower(trim("   ASD   ")) == "asd"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'trim left': {
        expression: 'trimLeft("   ASD   ") == "ASD   "',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'trim right': {
        expression: 'trimRight("   ASD   ") == "   ASD"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'replace1': {
        expression: 'replace("test me and you", "me", "her") == "test her and you"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'replace2 - CASE SENSITIVE': {
        expression: 'replace("test ME and you", "me", "her") == "test ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'replace3': {
        expression: 'replace("test ME and you", 123, "her") == "test ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'replace4': {
        expression: 'replace("test ME and you", 123) == "test ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'replace5': {
        expression: 'replace("test ME and you", 123, 234, "her") == "test ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'substring1': {
        expression: 'substring("test ME and you", 0, 4) == "test"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'substring2': {
        expression: 'substring("test ME and you", 4, 8) == " ME "',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'substring3': {
        expression: 'substring("test ME and you", 4, null) == " ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'substring4': {
        expression: 'substring("test ME and you", 4, -1) == " ME and you"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'length 1': {
        expression: 'length("hello") == 5',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'length 2': {
        expression: 'length(12345) == 5',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string includes 1': {
        expression: 'includes("team", "i")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'string includes 2': {
        expression: 'includes("team", "ea")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string includes 3': {
        expression: 'includes("team", 456)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string indexOf 1': {
        expression: 'indexOf("team", "i") == -1',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string indexOf 2': {
        expression: 'indexOf("team", "ea") == 1',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'string indexOf 3': {
        expression: 'indexOf("team", 456)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string indexOf 4': {
        expression: 'indexOf(234234, "234")',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'string indexOf 5': {
        expression: 'indexOf(String(999234234.23423), "234")',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'regexp match 1': {
        expression: 'match("hello there you", "..ll.", false)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'regexp match 2': {
        expression: 'match("hello there you", "..LL.", false)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'regexp match 3': {
        expression: 'match("hello there you", "hell$", true)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'regexp match 4': {
        expression: 'match("hello there you", "^hell", true)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'regexp match 5': {
        expression: 'match("hello there you", "bye", false)',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: false,
    },

    'regexp match 6': {
        expression: 'match("hello there you", 123, false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'regexp match 7': {
        expression: 'match(457457, 123, false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'regexp match 8': {
        expression: 'match("hello there you", "^hell", null)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'regexp match 9': {
        expression: 'match(123, false)',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'regexp match 10': {
        expression: 'match()',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'one for fun': {
        expression: 'match(' +
                    '   lower(String(round(99.234234)) + " is the number to call") + " in case of emergencies", ' +
                    '   "100", ' +
                    '   true' +
                    ') ' +
                    '== ' +
                    '(' +
                    '   99 * 2000 > 99 * 999 && ' +
                    '   trueBooleanValue && ' +
                    '   somePositiveNumericValue < someNegativeNumericValue' +
                    ') ',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'doc example': {
        expression: 'match(author.name, "alon", true) && ' +
                    'author.github.repositories > 10 && ' +
                    'Number(substring(company.phoneNumber, 1, 4)) / 2 == 486',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,

    },


    'bad variable': {

        expression: 'hello there.testVariable == 567',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'bad member': {

        expression: 'hello there.badly-named-variable == 890',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'Variable()': {

        expression: 'Variable("hello there").testVariable == 567',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'Member()': {

        expression: 'Member(Variable("hello there"), "badly-named-variable") == 890',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'Variable() 2': {

        expression: 'Variable("author").name == "Alon Diamant"',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'Member() 2': {

        expression: 'Member(author.github, "repositories") == 12',
        variableObjects: exampleVariables,
        expectedValidity: true,
        expectedResult: true,
    },

    'Evil stuff 1': {

        expression: 'author.toString',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },

    'Evil stuff 2': {

        expression: 'author.eval("")',
        variableObjects: exampleVariables,
        expectedValidity: false,
        expectedResult: false,
    },
};

// TODO: Ugh, why can't I just do expressionsAndExpectedResults.keys()???
for (const testCaseName of Object.keys(expressionsAndExpectedResults)) {

    const testCase = expressionsAndExpectedResults[testCaseName];

    let errorMessage =
              tevale.validateExpression(
                  testCase.expression,
                  testCase.variableObjects
              );
    errorMessage = errorMessage.length > 0 ? errorMessage[0] : '';
    const actualResult   =
              tevale.evaluateExpression(
                  testCase.expression,
                  testCase.variableObjects
              );

    console.log(`|'${testCase.expression.replace(/\|/gi, '&#124;')}'|${(errorMessage || String(actualResult)).replace(/\|/gi, '&#124;')}|`);
}

