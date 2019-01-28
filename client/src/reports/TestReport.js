import React, { Component } from 'react';

// redux
import { connect } from 'react-redux'

class TestReport extends Component {
  constructor(props) { 
    super(props);
  }


  render() {

    return (
      <div className='TestReport'>
        Testing
      </div>
    );
  }
  
}

// redux connection
const mapStateToProps = (state) => {
	return {
		data: state.getIn(['data', 'data'])
	}
}
const mapDispatchToProps = () => ({})

export { TestReport }
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(TestReport);
