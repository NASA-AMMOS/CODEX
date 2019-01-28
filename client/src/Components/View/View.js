import React, { Component } from 'react';
import './View.css';

import Panel from '../Panel/Panel';
import Container from '../Container/Container';

class View extends Component {

  render() {
    return (
      <div className='View noselect'>
        <Panel />
        <Container />
      </div>
    );
  }
}

export default View;
