import React from 'react';
import {v4 as uuid} from 'uuid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Divider from '@material-ui/core/Divider';
import Input from '@material-ui/core/Input';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Pages, findByProp } from '../utility';
import '../App.css';

const Hospitals = [{
  'flight_time_s':2134,
  'id':1,
  'name':'Bigogwe'
}, {
  'flight_time_s':2434,
  'id':2,
  'name':'Littgogwe'
}];

const Inventory = [{
  'id':1,
  'mass_g':700.0,
  'product':'RBC A+ Adult',
  'quantity':30
},
{
  'id':2,
  'mass_g':600.0,
  'product':'RBC B+ Adult',
  'quantity':30
},
{
  'id':3,
  'mass_g':750.0,
  'product':'RBC C+ Adult',
  'quantity':3
}]

class OrderPlacement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hospital: Hospitals[0].id,
      count: 1,
      product: Inventory[0].id,
      products: [],
      dialogOpen: false,
      dialogTitle: "",
      dialogDescription: "",
      dialogCloseText: "",
      dialogConfirmText: ""
    }
  }

  addItems = () => {
    const products = this.state.products.slice();
    const { count, product: productId } = this.state;
    const productItem = findByProp(Inventory, productId, 'id');
    
    // Don't add if product is already in order or count is more than inventory
    if (findByProp(products, productItem.id, 'productId')) {
      return this.setState({
        dialogOpen: true,
        dialogTitle: "Item already in order",
        dialogDescription: "Please remove the item prior to adding again.",
        dialogCloseText: "Okay"
      });
    } else if (count > productItem.quantity) {
      return this.setState({
        dialogOpen: true,
        dialogTitle: "Not enough items in inventory",
        dialogDescription: "Please select fewer items.",
        dialogCloseText: "Okay"
      });
    }


    const productOrder = {
      id: uuid(),
      count,
      productId: productItem.id,
      product: productItem.product,
      mass: productItem.mass_g
    }
    products.push(productOrder);
    this.setState({ products });
  }

  removeItem = id => {
    const products = this.state.products.filter(product => product.id !== id);
    this.setState({ products });
  }

  handleClose = () => {
    this.setState({dialogOpen: false})
  }

  handleConfirm = () => {
    console.log("order", this.state.products);
    this.setState({ dialogOpen: false }, () => this.props.navigate(Pages.ORDER_TRACKING))
  }

  scheduleOrder = () => {
    // TODO: call back end to schedule then launch dialog
    this.setState({
      dialogOpen: true,
      dialogTitle: "Confirm Your Order",
      dialogDescription: (
        <span>
          {this.state.products.map(productItem => {
            const {id, count, product} = productItem;
            return (
              <span key={id}>
                {`${count} of ${product}`}<br />
              </span>
            );
          })}
        </span>
      ),
      dialogCloseText: "Cancel",
      dialogConfirmText: "Confirm"
    })
  }

  renderHospitalMenuItems = () => {
    const menuItems = [
      <MenuItem key='0' value=''><em>None</em></MenuItem>
    ]

    Hospitals.forEach(hospital => {
      const {id, name} = hospital;
      menuItems.push(<MenuItem key={id} value={id}>{name}</MenuItem>);
    })

    return menuItems;
  }

  renderProductMenuItems = () => {
    return Inventory.map(item => {
      const {id, product} = item;
      return <MenuItem key={id} value={id}>{product}</MenuItem>;
    })
  }

  renderProducts = () => {

    if (this.state.products.length < 1) {
      return <div>No items in order</div>
    }

    return this.state.products.map(productOrder => {
      const { id, count, product, mass } = productOrder
      return (
        <ListItem key={id}>
          <ListItemAvatar>
            <Avatar>
              <FolderIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${count} of ${product}`}
            secondary={`Mass: ${mass}`}
          />
          <ListItemSecondaryAction>
            <IconButton onClick={() => this.removeItem(id)} edge="end" aria-label="Delete">
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
  }

  render() {
    const { 
      hospital, 
      count, 
      product, 
      products,
      dialogOpen, 
      dialogTitle, 
      dialogDescription,
      dialogCloseText,
      dialogConfirmText
    } = this.state;
  
    return (
      <div>
        <Paper className='Paper'>
          <Typography variant='h5' component='h3'>
            Order Placement
          </Typography>
          <Typography component='p'>
            Order medical products for a hospital.
          </Typography>

          <br />
          <Divider />
          <br />

          <div>
            <FormControl>
              <InputLabel htmlFor='age-simple'>Hospital</InputLabel>
              <Select
                value={hospital}
                onChange={e => this.setState({hospital: e.target.value})}
                inputProps={{
                  name: 'hospital',
                  id: 'hospital',
                }}
              >
                {this.renderHospitalMenuItems()}
              </Select>
            </FormControl>
          </div>

          <br />
          <br />

          <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline'}}>
            <Input
              value={count}
              onChange={e => this.setState({count: e.target.value})}
              className=''
              inputProps={{
                'aria-label': 'Description',
              }}
            />

            <FormControl style={{margin: '0 36px'}}>
              <InputLabel htmlFor='age-simple'>Product</InputLabel>
              <Select
                value={product}
                onChange={e => this.setState({product: e.target.value})}
                inputProps={{
                  name: 'product',
                  id: 'product',
                }}
              >
                {this.renderProductMenuItems()}
              </Select>
            </FormControl>

            <Fab onClick={this.addItems} color='primary' aria-label='Add'>
              <AddIcon />
            </Fab>
          </div>

          <br />
          <br />

          <div>
            <h5>Order</h5>
            <List dense={true} style={{maxWidth: "500px"}}>
              {this.renderProducts()}
            </List>
          </div>

          <br />
          <br />

          <Button onClick={this.scheduleOrder} variant="contained" color="primary" disabled={products.length < 1}>
            Schedule Order
          </Button>
        </Paper>

        <Dialog
          open={dialogOpen}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{dialogTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {dialogDescription}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              {dialogCloseText}
            </Button>
            { dialogConfirmText ? (
              <Button onClick={this.handleConfirm} color="primary" autoFocus>
                {dialogConfirmText}
              </Button>
            ) : null}
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default OrderPlacement;