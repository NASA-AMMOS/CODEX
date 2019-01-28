import React from 'react'
import RTU from 'react-addons-test-utils'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)
const { assert, expect } = chai

const {
  renderIntoDocument: render,
  findRenderedDOMComponentWithTag: findByTag,
  scryRenderedDOMComponentsWithTag: scryByTag,
  findRenderedComponentWithType: findByType,
  scryRenderedComponentsWithType: scryByType,
} = RTU

export {
  React,
  chai,
  sinon,
  sinonChai,
  assert,
  expect,
  RTU,
  render,
  findByTag,
  scryByTag,
  findByType,
  scryByType,
}
