'use strict';

// [START app]
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.locals.pretty = true;
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/js'));
app.use(express.static('public'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getModel () {
    return require('./model');
}

const coffeeMenu = [
  'Americano',
  'Caramel Macchiato',
  'Latte',
  'Vanilla Latte',
  'Chocolate',
  'Chocolate(S)',
  'Cappuccino',
  'Mocha',
  'Sweet Sweet'
]

const keyboardButton = {
	"type": "buttons",
	"buttons": coffeeMenu
};

function getZeroFill(n)
{
  if(10 > n) {
    return '0' + n;
  }

  return '' + n;
}

function getOrderId()
{
  const today = new Date();
  return today.getFullYear()
    + getZeroFill(today.getMonth()+1)
    + getZeroFill(today.getDate()) 
    + getZeroFill(today.getHours()) 
    + getZeroFill(today.getMinutes()) 
    + getZeroFill(today.getSeconds());
}

app.get('/', (req, res, next) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res, next) => {
  getModel().list((err, entities) => {
    if (err) {
      console.log(err);
      next(err);
      return;
    }

    const orderInfo = entities.map((e) => {
      let obj = {
        total: parseInt(e.quantity, 10),
        pending: 0,
        making: 0,
        cancel: 0,
        done: 0
      };
      obj[e.state] = parseInt(e.quantity);

      return obj;

    }).reduce((acc, v) => {
      return {
        total: acc.total + v.total,
        pending: acc.pending + v.pending,
        making: acc.making + v.making,
        cancel: acc.cancel + v.cancel,
        done: acc.done + v.done
      };
    }, {
      total: 0,
      pending: 0,
      making: 0,
      cancel: 0,
      done: 0
    });

    entities = entities.filter((e) => {
      if(e.state !== 'cancel' && e.state !== 'done')
        return true;
      return false;
    });

    // pending => start
    // making => done

    const data = entities.reverse().map((e) => {
      const obj = {
        order_id: e.order_id,
        hotice: e.hotice,
        coffee: e.coffee,
        quantity: e.quantity,
        state: e.state,
        options: e.options,
        id: e.id
      }

      return {
        order_id: e.order_id.substr(9, 4),
        hotice: e.hotice,
        coffee: e.coffee + ' ' + (e.options.length > 0 ? '(' + e.options.join(', ') + ')' : ''),
        quantity: e.quantity,
        state: e.state,
        next: JSON.stringify(obj),
        cancel: JSON.stringify(obj)
      };
    });

    // get order_id list
    const orderList = new Set(data.map((e) => e.order_id));

    let groupData = [];
    orderList.forEach((e) => {
      groupData.push(data.filter((d) => e === d.order_id))
    });

    res.render('dashboard', {
      orderInfo: orderInfo,
      data: groupData
    });

  });
});

app.get('/orderlist', (req, res, next) => {
  getModel().list((err, entities) => {
    if (err) {
      console.log(err);
      next(err);
      return;
    }

    const orderInfo = entities.map((e) => {
      let obj = {
        total: parseInt(e.quantity, 10),
        pending: 0,
        making: 0,
        cancel: 0,
        done: 0
      };
      obj[e.state] = parseInt(e.quantity);

      return obj;

    }).reduce((acc, v) => {
      return {
        total: acc.total + v.total,
        pending: acc.pending + v.pending,
        making: acc.making + v.making,
        cancel: acc.cancel + v.cancel,
        done: acc.done + v.done
      };
    }, {
      total: 0,
      pending: 0,
      making: 0,
      cancel: 0,
      done: 0
    });

    // pending => start
    // making => done

    const data = entities.reverse().map((e) => {
      const obj = {
        order_id: e.order_id,
        hotice: e.hotice,
        coffee: e.coffee,
        quantity: e.quantity,
        state: e.state,
        options: e.options,
        id: e.id
      }

      return {
        order_id: e.order_id.substr(9, 4),
        hotice: e.hotice,
        coffee: e.coffee + ' ' + (e.options.length > 0 ? '(' + e.options.join(', ') + ')' : ''),
        quantity: e.quantity,
        state: e.state
      };
    });

    // get order_id list
    const orderList = new Set(data.map((e) => e.order_id));

    let groupData = [];
    orderList.forEach((e) => {
      groupData.push(data.filter((d) => e === d.order_id))
    });

    res.render('orderlist', {
      orderInfo: orderInfo,
      data: groupData
    });

  });
});



app.post('/order', (req, res, next) => {
  const orderList = JSON.parse(req.body.json);

  console.log(orderList);

  orderList.forEach((order) => {
    order.order_id = getOrderId();
    order.state = 'pending';
    getModel().create(order, (err, savedData) => {
      console.log(savedData);
      if(err) {
        next(err);
        return;
      }
    });
  });

  res.redirect('/dashboard')
});

app.post('/order_update', (req, res, next) => {
  const order = JSON.parse(req.body.json);

  const id = order.id;
  delete order.id;

  getModel().update(id, order, (err, savedData) => {
    if(err) {
      next(err);
      return;
    }

    res.redirect('/dashboard')
  });
});

// for plus friends
app.get('/keyboard', function(req, res, next) {
  res.json(keyboardButton);
});

app.post('/message', function(req, res, next) {
  var msg = {
	  "text": 'okok: ' + req.body['content']
  }

  res.json({"message": msg, "keyboard": keyboardButton});
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT);
// [END app]