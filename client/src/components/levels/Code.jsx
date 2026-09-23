import React from 'react'
import 'highlight.js/styles/vs2015.css'
import hljs from 'highlight.js/lib/core'
import solidity from 'highlightjs-solidity'

solidity(hljs)

class Code extends React.Component {

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

  async componentDidUpdate(prevProps) {
    await this.loadContents(this.props.target);
  }

  getHighlightedCode() {
    if (this.state.source) {
      return {
        __html: hljs.highlight(this.state.source, { language: 'solidity' }).value,
      };
    }
  }

  // `target` is a loader resolving to the source text.
  async loadContents(target) {
    if (!this._isMounted) return;
    if (this.state.target === target) return;
    this.setState({ target });
    const source = await target();
    if (this._isMounted && this.props.target === target) this.setState({ source });
  }

  render() {
    return (
      <pre><code className='hljs' dangerouslySetInnerHTML={this.getHighlightedCode()}></code></pre>
    )
  }
}

export default Code
