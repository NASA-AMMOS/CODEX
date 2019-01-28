// A parser that accepts a set of named objects (with properties) and an expression, validates
// syntax and evaluates the expression.

'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const jsep = require('jsep');
const _    = require('lodash');

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

// Private methods/data

// Forward declaration
let _handleExpressionNode;
let _handleIdentifierNode;

// This is the full set of types that any JSEP node can be.
const COMPOUND        = 'Compound';
const IDENTIFIER      = 'Identifier';
const MEMBER_EXP      = 'MemberExpression';
const LITERAL         = 'Literal';
const THIS_EXP        = 'ThisExpression';
const CALL_EXP        = 'CallExpression';
const UNARY_EXP       = 'UnaryExpression';
const BINARY_EXP      = 'BinaryExpression';
const LOGICAL_EXP     = 'LogicalExpression';
const CONDITIONAL_EXP = 'ConditionalExpression';
const ARRAY_EXP       = 'ArrayExpression';

const BINARY_OPERATOR_ALLOWED_TYPES = {
    '==': ['number', 'string', 'nullableString', 'object', 'boolean'],
    '!=': ['number', 'string', 'nullableString', 'object', 'boolean'],
    '<': ['number', 'string'],
    '>': ['number', 'string'],
    '<=': ['number', 'string'],
    '>=': ['number', 'string'],
    '+': ['number', 'string'],
    '-': ['number'],
    '*': ['number'],
    '/': ['number'],
    '%': ['number'],
    '||': ['boolean'],
    '&&': ['boolean'],
};

const UNARY_OPERATOR_ALLOWED_TYPES = {
    '+': ['number'],
    '-': ['number'],
    '!': ['number', 'boolean'],
};

const FUNCTION_DEFINITIONS = {

    // Type casting

    'Variable': {
        'params': [
            ['string'],
        ],
        'function': (variableName, variables) => {
            return _handleIdentifierNode({ name: variableName }, variables);
        },
    },

    'Member': {
        'params': [
            ['object'],
            ['string'],
        ],
        'function': (containingVariable, keyValue) => {
            const evaluatedResult = _.get(containingVariable, keyValue, undefined);

            if (evaluatedResult === undefined) {
                throw new Error(`Undefined identifier member: '${keyValue}'`);
            } else {
                return evaluatedResult;
            }
        },
    },

    'String': {
        'params': [
            ['number', 'string'],
        ],
        'function': String,

    },
    'Number': {
        'params': [
            ['number', 'string'],
        ],
        'function': (value) => {
            const result = Number(value);

            if (Number.isNaN(result) || !Number.isFinite(result)) {
                throw new Error(`Error converting value '${value}' to number`);
            }

            return result;
        },

    },
    'Boolean': {
        'params': [
            ['number', 'string'],
        ],
        'function': Boolean,

    },

    // Numeric functions

    'round': {
        'params': [
            ['number'],
        ],
        'function': (num) => { return Math.round(num); },

    },
    'floor': {
        'params': [
            ['number'],
        ],
        'function': (num) => { return Math.floor(num); },
    },

    // String modification

    'upper': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.toUpperCase(); },

    },
    'lower': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.toLowerCase(); },

    },
    'trim': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.trim(); },

    },
    'trimRight': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.trimRight(); },

    },
    'trimLeft': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.trimLeft(); },

    },
    'replace': {
        'params': [
            ['string'],  // main string
            ['string'],  // string to find
            ['string'],  // replacement string
        ],
        'function': (str, searchString, replacementString) => {
            return str.replace(searchString, replacementString);
        },
    },
    'substring': {
        'params': [
            ['string'],  // main string
            ['number'],  // index to start
            ['number'],  // index to end
        ],
        'function': (str, startIndex, endIndex) => {
            // In case we get an index that doesn't make sense - just ignore it
            if (endIndex < startIndex) {
                endIndex = undefined;
            }
            return str.substring(startIndex, endIndex);
        },
    },
    'length': {
        'params': [
            ['string'],
        ],
        'function': (str) => { return str.length; },

    },

    // String searching and matching

    'includes': {
        'params': [
            ['string'], // main string
            ['string'], // string to search for
        ],
        'function': (str, searchString) => { return str.includes(searchString); },

    },
    'indexOf': {
        'params': [
            ['string'], // main string
            ['string'], // string to search for
        ],
        'function': (str, searchString) => { return str.indexOf(searchString); },

    },
    'match': {
        'params': [
            ['string'],  // main string
            ['string'],  // regular expression
            ['boolean'],  // ignore the case?
        ],
        'function': (str, regexp, ignoreCase) => {
            return !!str.match(new RegExp(regexp, ignoreCase ? 'i' : ''));
        },
    },

};

// Verify that one or more expressions are of a type that is legal for the operator
function _verifyExpressionsType(operatorType, expressions) {

    let allowedTypes;
    if (expressions.length === 1) {
        allowedTypes = UNARY_OPERATOR_ALLOWED_TYPES[operatorType];
    } else if (expressions.length === 2) {
        allowedTypes = BINARY_OPERATOR_ALLOWED_TYPES[operatorType];
    } else {
        // Internal programmer error.
        throw new Error(`_verifyExpressionsType called with invalid number ${expressions.length} of expressions.`);
    }

    for (const currentType of allowedTypes) {
        if (expressions.every(
                (expression) => {
                    if (currentType === 'nullableString') {
                        return (expression === null || typeof expression === 'string');
                    } else {
                        return typeof expression === currentType; // eslint-disable-line
                    }
                }
            )) {
            return true;
        }
    }

    const expressionTypes =
              expressions.map((expression) => {
                  return expression == null ? 'null' : typeof expression;
              });

    throw new Error(`The operator ${operatorType} cannot be used with ${expressionTypes}. It can only be used with the types: ${allowedTypes}`);
}

function _handleLiteralValueNode(node) {
    return node.value;
}

function _handleUnaryExpressionNode(node, variables) {
    const expression = _handleExpressionNode(node.argument, variables);

    switch (node.operator) {
        case '+':
            _verifyExpressionsType(node.operator, [expression]);
            return 1 * expression;
        case '-':
            _verifyExpressionsType(node.operator, [expression]);
            return -1 * expression;
        case '!':
            _verifyExpressionsType(node.operator, [expression]);
            return !expression;
        default:
            throw new Error(`Invalid unary operator: ${node.operator}`);
    }
}

function _handleLogicalExpressionNode(node, variables) {
    const leftExpression  = _handleExpressionNode(node.left, variables);
    const rightExpression = _handleExpressionNode(node.right, variables);
    const expressions     = [leftExpression, rightExpression];

    switch (node.operator) {
        case '||':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression || rightExpression;
        case '&&':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression && rightExpression;
        default:
            throw new Error(`Invalid logical operator: ${node.operator}`);
    }
}

function _handleBinaryExpressionNode(node, variables) {

    const leftExpression  = _handleExpressionNode(node.left, variables);
    const rightExpression = _handleExpressionNode(node.right, variables);
    const expressions     = [leftExpression, rightExpression];
    let evaluatedResult;

    switch (node.operator) {
        case '==':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression === rightExpression;
        case '!=':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression !== rightExpression;
        case '<':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression < rightExpression;
        case '>':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression > rightExpression;
        case '<=':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression <= rightExpression;
        case '>=':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression >= rightExpression;
        case '+':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression + rightExpression;
        case '-':
            _verifyExpressionsType(node.operator, expressions);
            return leftExpression - rightExpression;

        case '*':
            _verifyExpressionsType(node.operator, expressions);
            evaluatedResult = leftExpression * rightExpression;
            if (evaluatedResult === Infinity) {
                throw new Error('Numeric overflow');
            }
            return evaluatedResult;

        case '/':
            _verifyExpressionsType(node.operator, expressions);

            evaluatedResult = leftExpression / rightExpression;
            if (evaluatedResult === Infinity) {
                throw new Error(`Division of ${leftExpression} by 0`);
            }
            return evaluatedResult;
        case '%':
            _verifyExpressionsType(node.operator, expressions);
            evaluatedResult = leftExpression % rightExpression;
            if (Number.isNaN(evaluatedResult)) {
                throw new Error(`Modulo of ${leftExpression} by 0`);
            }
            return evaluatedResult;

        default:
            throw new Error(`Invalid binary operator: ${node.operator}`);
    }
}

// Handle an identifier node - an identifier is a variable name. It is always just one variable,
// never deeper.
_handleIdentifierNode = function (node, variables) {
    let evaluatedResult;

    if (variables.hasOwnProperty(node.name)) { // eslint-disable-line
        evaluatedResult = _.get(variables, node.name, undefined);
    }

    if (evaluatedResult === undefined) {
        throw new Error(`Invalid identifier: '${node.name}'`);
    } else {
        return evaluatedResult;
    }
};

// Handle a member node - a member node is a member of a variable. This is always a variable and
// its members, not deeper nor is it flat (otherwise it'd be an identifier)
function _handleMemberNode(node, variables) {
    const containingVariable = _handleExpressionNode(node.object, variables);

    if (node.property.type !== IDENTIFIER) {
        throw new Error(`Invalid identifier member: '${node.property.name}'`);
    }

    const keyValue = node.property.name;

    let evaluatedResult;

    if (containingVariable.hasOwnProperty(keyValue)) { // eslint-disable-line
        evaluatedResult = _.get(containingVariable, keyValue, undefined);
    }


    if (evaluatedResult === undefined) {
        throw new Error(`Undefined identifier member: '${node.property.name}'`);
    } else {
        return evaluatedResult;
    }
}

// Handle a compound node - which can be an empty node (legit) or a node with several expressions
// separated by spaces (not legit)
function _handleCompoundNode(node /* , variables*/) {
    if (node.body.length === 0) {
        // Empty expression
        return false;
    } else {
        throw new Error(`Cannot handle compound expressions.`);
    }
}

// Handle a function call node - based on the function definitions above.
function _handleFunctionCallExpressionNode(node, variables) {

    if (node.callee.type !== IDENTIFIER) {
        throw new Error(`Invalid function name type: '${node.callee.type}'`);
    }

    const functionName       = node.callee.name;
    const functionDefinition = _.get(FUNCTION_DEFINITIONS, functionName, undefined);

    if (functionDefinition === undefined) {
        throw new Error(`Unknown function: '${functionName}'`);
    }

    // Verify the validity of the arguments
    const args =
              node.arguments.map(
                  (arg) => { return _handleExpressionNode(arg, variables); }
              );

    if (args.length !== functionDefinition.params.length) {
        throw new Error(`Expected ${functionDefinition.params.length} arguments for function '${functionName}'.`);
    }

    // Valid arguments?
    for (let currentArgIndex = 0;
         currentArgIndex < args.length;
         currentArgIndex += 1) {

        const currentArgType   = args[currentArgIndex] == null ? 'null' :
            typeof args[currentArgIndex];
        const expectedArgTypes = functionDefinition.params[currentArgIndex];

        // TODO: ES6 this mofo
        if (_.includes(expectedArgTypes, currentArgType) === false) {
            throw new Error(`Invalid argument #${currentArgIndex
                } of type ${currentArgType} for function '${functionName
                }': expected ${expectedArgTypes}`);
        }

    }

    // Got here? all is well! Call the function.

    // Always pass in the variables so Variable aware functions can be called.
    const evaluatedResult = functionDefinition.function(...args, variables);

    return evaluatedResult;
}

// Handle an expression node, based on its type.
_handleExpressionNode = function (node, variables) {

    let evaluatedValue = false;

    switch (node.type) {
        case COMPOUND:
            // console.log('COMPOUND detected.');
            evaluatedValue = _handleCompoundNode(node, variables);
            break;

        case IDENTIFIER:
            // console.log('IDENTIFIER detected.');
            evaluatedValue = _handleIdentifierNode(node, variables);
            break;

        case MEMBER_EXP:
            // console.log('MEMBER_EXP detected.');
            evaluatedValue = _handleMemberNode(node, variables);
            break;

        case LITERAL:
            // console.log('LITERAL detected.');
            evaluatedValue = _handleLiteralValueNode(node);
            break;

        case THIS_EXP:
            // console.log('THIS_EXP detected.');
            throw new Error(`keyword 'this' not supported.`);

        case CALL_EXP:
            // console.log('CALL_EXP detected.');
            evaluatedValue = _handleFunctionCallExpressionNode(node, variables);
            break;

        case UNARY_EXP:
            // console.log('UNARY_EXP detected.');
            evaluatedValue = _handleUnaryExpressionNode(node, variables);
            break;

        case BINARY_EXP:
            // console.log('BINARY_EXP detected.');
            evaluatedValue = _handleBinaryExpressionNode(node, variables);
            break;

        case LOGICAL_EXP:
            // console.log('LOGICAL_EXP detected.');
            evaluatedValue = _handleLogicalExpressionNode(node, variables);
            break;

        case CONDITIONAL_EXP:
            // console.log('CONDITIONAL_EXP detected.');
            throw new Error(`Trinary operator (?:) currently not supported.`);

        case ARRAY_EXP:
            // console.log('ARRAY_EXP detected.');
            throw new Error(`Array literals ([1, 2, 3]) currently not supported.`);

        default:
            throw new Error(`Unknown expression detected! Very strange.`);
    }

    return evaluatedValue;
};

// Evaluate an expression node - converting its value to a boolean
function _evaluateExpressionNode(node, variables) {

    const evaluatedResult = _handleExpressionNode(node, variables);

    if (evaluatedResult === null) {
        return false;
    }

    if (typeof evaluatedResult === 'object') {
        throw new Error(`Cannot evaluate object variable directly`);
    }

    return !!evaluatedResult;
}

// Validate and evaluate an expression
function _validateAndEvaluateExpression(expression, variables) {
    const trimmedExpression = (String(expression)).trim();

    try {
        let parsedExpression = null;
        parsedExpression     = jsep(trimmedExpression);

        // Evaluate the expression. Any errors will cause an exception and get to the catch
        const evaluatedResult = _evaluateExpressionNode(parsedExpression, variables);

        return { evaluatedResult, errorMessage: null };
    } catch (err) {
        // console.log(err.stack);
        return { evaluatedResult: null, errorMessage: err.message };
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// Exported objects/methods

// Verify an expression, making sure it is valid. It will return an empty array if fine, otherwise
// an array of one or more strings found when verifying the expression.
function validateExpression(expression, variables) {

    const validateAndEvaluateResult = _validateAndEvaluateExpression(expression, variables);

    if (validateAndEvaluateResult.errorMessage === null) {
        return [];
    } else {
        return [validateAndEvaluateResult.errorMessage];
    }
}

// Evaluate a single expression, seeing whether its value is truthy or not. If it does not pass
// validation, it will be falsey.
function evaluateExpression(expression, variables) {

    const validateAndEvaluateResult = _validateAndEvaluateExpression(expression, variables);

    if (validateAndEvaluateResult.errorMessage === null) {
        return validateAndEvaluateResult.evaluatedResult;
    } else {
        // console.log(`Invalid expression '${expression}' due to:\n    ${
        //     validateAndEvaluateResult.errorMessage}`);
        return false;
    }
}

module.exports = {
    evaluateExpression,
    validateExpression,
};
