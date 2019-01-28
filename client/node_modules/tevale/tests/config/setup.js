//import chai, { expect } from 'chai';
//import sinon from 'sinon';
//import sinonChai from 'sinon-chai';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');


chai.use(sinonChai);

if (typeof global !== 'undefined') {
    global.expect = expect;
    global.sinon = sinon;
}
