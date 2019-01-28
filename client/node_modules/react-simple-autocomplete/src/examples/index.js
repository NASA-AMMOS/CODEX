import React, { Component } from 'react'
import { render } from 'react-dom'

import Autocomplete from '../Autocomplete'
import styles from './css/App.css'

class App extends Component {
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>React Simple Autocomplete</div>

        {/* Simple Example */}
        <div className={styles.title}>Simple Example</div>
        <Autocomplete
          className={styles.simple}
          items={['one', 'two', 'three']} />

        <code className={styles.code}>{`
          <Autocomplete items={['one', 'two', 'three']} />
        `}</code>

        {/* Custom Menu */}
        <div className={styles.title}>Custom Menu</div>
        <Autocomplete
          className={styles.menu}
          items={['Row', 'Row', 'Row your boat']}
          renderMenu={({items}) =>
            <div className={styles.renderMenu}>
              {items}
              <div className={styles.stream}>Gently down the stream!</div>
            </div>
          }
          renderItem={({item, highlighted}) =>
            <div className={highlighted ? styles.activeItem : styles.item}>{item}!</div>} >
          <input placeholder="Ahoy, captain!" />
        </Autocomplete>


        <code className={styles.code}>
          {`<Autocomplete`}<br />
          &nbsp;&nbsp;{`items={['Row', 'Row', 'Row your boat']}`}<br />
          &nbsp;&nbsp;{`renderMenu={({items}) =>`}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`<div className='menu'>{items}<div>Gently down the stream!</div></div>}`}<br />
          &nbsp;&nbsp;{`renderItem={({item, highlighted}) =>`}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`<div className={highlighted ? 'active-item' : 'item'}>{item}!</div>} />`}<br />
          &nbsp;&nbsp;{`<input placeholder="Ahoy, captain!" />`}<br />
          {`</Autocomplete>`}
        </code>


      </div>
    )
  }
}

render(<App />, document.getElementById('app'))
