import React from 'react'
import PropTypes from 'prop-types'
import { scaleLinear } from 'd3-scale'
import { max } from 'd3-array'
import { area } from 'd3-shape'
import './Sparkline.css'

class Sparkline extends React.Component {
  constructor(props){
    super(props);
    this.renderPath = this.renderPath.bind(this);
    this.parent = React.createRef();
  }

  componentDidMount() {
    // rerender the svg with the proper parent width
    this.forceUpdate();
  }

  /**
   * Get the svg container width
   * @return 0 if not mounted
   */
  getParentWidth() {
    return (this.parent.current) ? this.parent.current.offsetWidth : 0;
  }

  /**
   * Get the svg container height
   * @return 0 if not mounted
   */
  getParentHeight() {
    return (this.parent.current) ? this.parent.current.offsetHeight : 0;
  }

  /**
   * Create the sparkline path
   * @return an svg object
   */
  renderPath() {
    // scaling
    const yScale = scaleLinear()
      .domain([0, max(this.props.data)])
      .range( [this.getParentHeight(), 0]);
    const xScale = scaleLinear()
      .domain([0, this.props.data.length - 1])
      .range( [0, this.getParentWidth()]);

    // create a line with the specified scales
    const lineGen = area()
      .x((d,i) => xScale(i))
      .y1((d,i) => yScale(d))
      .y0(yScale(0))

    // create the SVG path string for the line
    const sparklinePath = lineGen(this.props.data);

    // Compute mask properties
    const maskWidth = (this.props.completion || 0) * this.getParentWidth();
    const maskOffset = (this.props.completeFrom === "right") ? this.getParentWidth() - maskWidth : 0;
    
    return (
      <svg
        preserveAspectRatio="none"
        width={this.getParentWidth()}
        height="100%">
        <path
          className="sparkline"
          d={sparklinePath}>
        </path>
        <rect
          x={maskOffset}
          y="0"
          height={this.getParentHeight()}
          className="occlusionMask"
          width={maskWidth}>
        </rect>
      </svg>
    );
  }

  /**
   * render the svg container
   */
  render() {
    return (
      <div className="Sparkline" ref={this.parent}>
        {this.renderPath()}
      </div>
    )
  }
}

Sparkline.propTypes = {
  completion: PropTypes.number,
  completeFrom: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default Sparkline
