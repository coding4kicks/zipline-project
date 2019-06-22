import React from 'react';
import ZiplineAppBar from './components/ZiplineAppBar';
import Router from './components/Router';
import { Pages } from './utility';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: Pages.ORDER_PLACEMENT
    };
  }

  navigate = location => this.setState({ location });

  render() {
    return (
      <div className="App">
        <ZiplineAppBar navigate={this.navigate} />
        <div className="Page">
          <Router location={this.state.location} navigate={this.navigate} />
        </div>
      </div>
    );
  }
}

export default App;
