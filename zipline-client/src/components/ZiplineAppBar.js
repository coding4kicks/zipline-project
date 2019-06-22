import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { Pages } from '../utility';
import logo from '../logo.svg';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  }
}));

function ZiplineAppBar({ navigate }) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position='static'>
        <Toolbar>
          <img src={logo} className={'App-logo'} alt='logo' />
          <Typography variant='h6' className={classes.title}>
            Medical Delivery
          </Typography>
          <Button onClick={() => navigate(Pages.ORDER_PLACEMENT)} color='inherit'>Order</Button>
          <Button onClick={() => navigate(Pages.ORDER_TRACKING)} color='inherit'>Status</Button>
          <Button onClick={() => navigate(Pages.ORDER_AUDIT)} color='inherit'>Audit</Button>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default ZiplineAppBar;