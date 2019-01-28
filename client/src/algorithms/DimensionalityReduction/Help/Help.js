import React, { Component } from 'react';

import ReactModal from 'react-modal';
import ReactMarkdown from 'react-markdown';
import { MdClose } from 'react-icons/lib/md';

import './Help.css';

class Help extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      markdown: ''  
    };
  }

  open() {
    this.setState( { open: true } );
  }
  close() {
    this.setState( { open: false } );
  }
  setMarkdown( markdown ) {
    this.setState( { markdown: markdown } );
  }

  render() {
    return (
      <div className='Help'>
        <ReactModal 
            portalClassName='ReactModalPortal HelpModal'
            isOpen={this.state.open}
            parentSelector={this.props.parent}
            ariaHideApp={false}
            closeTimeoutMS={200}
            style={{
              overlay: {
                backgroundColor: 'rgb(255,255,255)'
              },
              content: {
                padding: 0
              }
            }}
          >
          <div id='helpClose'
            onClick={ () => this.props.close() }>
            <MdClose />
          </div>
          <div id='helpContainer' style={{ padding: '20px 20% 20px 20%' }}>
            <ReactMarkdown source={this.state.markdown} />
          </div>
        </ReactModal>
      </div>
    );
  }
}

export default Help;
