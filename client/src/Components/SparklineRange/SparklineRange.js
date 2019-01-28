import React from 'react'
import Sparkline from '../Sparkline/Sparkline'
import PropTypes from 'prop-types'
import './SparklineRange.css'

class SparklineRange extends React.Component {
  /**
   * Construct a new SparklineRange object
   */
  constructor(props) {
    super(props);

    this.state = {
      rangeval: this.props.default || 0
    };

    this.updateRangeSlider = this.updateRangeSlider.bind(this)
  }

  /**
   * <input type="range"/> onChange watcher
   * @param e event
   */
  updateRangeSlider(e) {
    this.setState({rangeval: e.target.value})
  }

  /**
   * Render method
   * @return sparkline dom structure
   */
  render() {
    const completion = (this.state.rangeval - this.props.min) / (this.props.max - this.props.min);
    return (
      <div className="SparklineRange">
        <Sparkline
          data={this.props.data}
          completion={completion}
          completeFrom={this.props.completeFrom || "left"}/>
        <input
          type="range"
          defaultValue={this.props.default || 0}
          min={this.props.min}
          max={this.props.max}
          onChange={this.updateRangeSlider}
          onInput={this.updateRangeSlider}/>
      </div>
    );
  }
}


SparklineRange.propTypes = {
  default: PropTypes.number,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  completeFrom: PropTypes.string,
  step: PropTypes.number,
  onChange: PropTypes.func,

};


const SparklineRangeDebugger = (props) => {
  const randline = Array.apply(null, Array(7)).map(() => Math.random());

  return (
    <SparklineRange
      min={0}
      max={45}
      data={randline}
      completeFrom="left">
    </SparklineRange>
  );
}

export {SparklineRangeDebugger}
export default SparklineRange
