import React from 'react';
import ReactDOM from 'react-dom';
import Sparkline from './Sparkline';
import { shallow, mount } from 'enzyme'

describe('<Sparkline/>', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <Sparkline
        data={[1,2,3,4,5]}>
      </Sparkline>, div);
  });

  it('renders the proper tree', () => {
    const wrapper = shallow(
      <Sparkline
        data={[1,2,3,4,5]}>
      </Sparkline>
    );
    
    expect(wrapper.find('svg')).toHaveLength(1);
    expect(wrapper.find('path')).toHaveLength(1);
    expect(wrapper.find('.Sparkline')).toHaveLength(1);
    expect(wrapper.find('rect.occlusionMask')).toHaveLength(1);
  })

  it('renders a path', () => {
    const wrapper = mount(
      <Sparkline
        data={[1,2,3,4,5]}>
      </Sparkline>
    );

    // match every string except zero length strings
    expect(wrapper.find('path').props().d).toMatch(/^.+$/);
  })

  it('scales the occlusion rect', () => {
    const wrapper = mount(
      <Sparkline
        completion={0.35}
        data={[1,2,3,4,5]}>
      </Sparkline>
    );

    expect(wrapper.find('rect').props().width).not.toBeNull();
  })
})
