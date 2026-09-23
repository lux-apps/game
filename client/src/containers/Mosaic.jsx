import React from 'react';
import { Link } from 'react-router-dom'
import * as constants from '../constants';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import getlevelsdata, { levelImageFallback } from '../utils/getlevelsdata';
//import moment from 'moment'

class Mosaic extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      lang: localStorage.getItem('lang')
    }
  }

  render() {

    // Array for tiles in the Mosaic
    var [levelData,] = getlevelsdata(this.props, 'mosaic');

    return (
      <section className="game">
        {levelData.map((level) => {
          return (
            <Link
              key={level.name}
              to={
                this.props.connected && level.deployedAddress //on read only mode in custom network this field 'deployedAddress' isnt present
                  ? `${constants.PATH_LEVEL_ROOT}${level.deployedAddress}`
                  : `${constants.PATH_LEVEL_ROOT}${level.id}`
              }
            >
              <div className="content_img">
                <img className='level-tile' alt="" src={level.src} onError={levelImageFallback(level.fallback)} />
                <div>
                  {`${level.completed ? ' ✔' : ''}`}{' '}
                  {level.name}
                  <br /> {level.difficulty}
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    );
  }
}

function mapStateToProps(state) {
  return {
    connected: state.network.connected,
    levels: state.gamedata.levels,
    player: state.player,
    activeLevel: state.gamedata.activeLevel
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
  }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Mosaic);
