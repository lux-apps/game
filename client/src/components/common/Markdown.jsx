import React from 'react'
import ReactMarkdown from 'react-markdown'

// Renders `target`: markdown text, or a loader resolving to it.
class Markdown extends React.Component {

  constructor() {
    super()
    this.state = {
      target: undefined,
      source: undefined
    }
  }

  async componentDidMount() {
    this._isMounted = true
    await this.loadContents(this.props.target)
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  async componentDidUpdate() {
    await this.loadContents(this.props.target);
  }

  async loadContents(target) {
    if(!this._isMounted) return
    if(this.state.target === target) return
    this.setState({ target })
    const source = typeof target === 'function' ? await target() : target
    if(this._isMounted && this.props.target === target) this.setState({ source })
  }

  render() {
    const children = this.state.source;
    return <div>{ children && <ReactMarkdown children={children}/> }</div>
  }
}

export default Markdown
