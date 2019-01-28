import React, { Component } from 'react';
import './Preview.css';

import { controller } from '../../../Controller/controller';
import { formulas } from '../../../formulas/formulas';
import simplescatter from '../simplescatter';

import ReactEcharts from 'echarts-for-react';

class Preview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      overallPreview: new simplescatter(),
      parameterPreviews: [ 0,0,0,0,0,0,0,0,0,0,0,0,0,0 ]
    };

    let o = this.state.overallPreview.option;
    o.grid.left = 30; o.grid.right = 30; o.grid.top = 30; o.grid.bottom = 30;
    o.xAxis[0].axisLabel.show = true; o.yAxis[0].axisLabel.show = true;


    this.props.l( this.update.bind(this) );

    controller.subscribeChosenFeaturesUpdate( this.update.bind(this), 'preview' );
    controller.subscribeChosenSelectionsUpdate( this.update.bind(this), 'preview' );
  }

  reaction( r ) {

    if( this._ismounted ) {
      if( this.overallSample )
        this.overallSample.style.opacity = 1;

      let g = this.state.overallPreview;
      let o = g.getOption();
      o.series = [];

      this.echarts_react_overallpreview.getEchartsInstance().clear();

      let tempDataArray = [];
      for( let d in r.data ) {
          tempDataArray.push( r.data[d] );
      }

      o.series.push( g.getSeriesKey() );
      o.series[ o.series.length - 1 ].data = tempDataArray;
        

      this.echarts_react_overallpreview.getEchartsInstance().setOption( o );
      this.forceUpdate();
      this.echarts_react_overallpreview.getEchartsInstance().hideLoading();

    }
  }

  update() {
    if( this.overallSample )
      this.overallSample.style.opacity = 0.15;
    if( this.echarts_react_overallpreview )
      this.echarts_react_overallpreview.getEchartsInstance().showLoading();
    this.props.invoke( {}, this.reaction.bind(this), { downsampled: 20 } );
  }

  getParameterPreviews() {
    let parameterPreviews = [];
    for( let i in this.state.parameterPreviews ) {
      parameterPreviews.push(
        <li key={i} className={'parameterpreview'}>
        </li>
      );
    }
    return parameterPreviews;
  }

  disable() {
    this.ref_preview.style.pointerEvents = 'none';
    this.echarts_react_overallpreview.getEchartsInstance().clear();
    let g = this.state.overallPreview;
    let o = g.getOption();
    o.series = [];
    o.series.push( g.getSeriesKey() );
    o.series[ o.series.length - 1 ].symbolSize = 0;
    o.series[ o.series.length - 1 ].data = [[0,0],[10,10]];
    this.echarts_react_overallpreview.getEchartsInstance().setOption( o );
  }
  enable() {
    this.ref_preview.style.pointerEvents = 'inherit';
  }


  componentDidMount() { 
    this._ismounted = true;
    if( this.echarts_react_overallpreview )
      this.echarts_react_overallpreview.getEchartsInstance().showLoading();
  }
  componentWillUnmount() {
    this._ismounted = false;
    controller.unsubscribeChosenFeaturesUpdate( this.update.bind(this), 'preview' );
    controller.unsubscribeChosenSelectionsUpdate( this.update.bind(this), 'preview' );
  }

  render() {
    
    console.log( 'Preview render' );
    return (
      <div className='Preview' ref={(r) => { this.ref_preview = r; }}>
        <div id='title'>Preview</div>
        <div id='previewcontainer'>
          <div id='overallpreview' ref={(e) => { this.overallSample = e; }}>
          <ReactEcharts ref={(e) => { this.echarts_react_overallpreview = e; }}
            option={this.state.overallPreview.getOption()}
            showLoading={false}
            style={{height: '100%', width: '100%'}}
          />
          </div>
        </div>
      </div>
    );
  }
}

export default Preview;
