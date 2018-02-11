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
  'Hazelnut Latte',
  'Chocolate',
  'Chocolate(S)',
  'Cappuccino',
  'Mocha',
  'Espresso',
  'Sweet Sweet'
]

const keyboardButton = {
	"type": "buttons",
	"buttons": ['Order']
};

function getZeroFill(n)
{
  if(10 > n) {
    return '0' + n;
  }

  return '' + n;
}

function getTimestamp()
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
        start_timestamp: e.start_timestamp,
        mobile: e.mobile,
        name: e.name,
        id: e.id
      }

      return {
        order_id: e.order_id,
        hotice: e.hotice,
        coffee: e.coffee + ' ' + (e.options.length > 0 ? '(' + e.options.join(', ') + ')' : ''),
        quantity: e.quantity,
        state: e.state,
        mobile: e.mobile,
        name: e.name,
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
      return {
        order_id: e.order_id,
        hotice: e.hotice,
        coffee: e.coffee + ' ' + (e.options.length > 0 ? '(' + e.options.join(', ') + ')' : ''),
        quantity: e.quantity,
        state: e.state,
        mobile: e.mobile,
        name: e.name,
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

  Promise.all(orderList.map((order) => {
    order.state = 'pending';
    order.start_timestamp = getTimestamp();
    return new Promise((resolve, reject) => {
      getModel().create(order, (err, savedData) => {
        if(err) {
          reject(err);
        } else {
          resolve(savedData);
        }
      });
    });
  })).then((values) => {
    res.redirect('/dashboard')
  }).catch((err) => {
    console.log(err);
  });
});

app.post('/order_update', (req, res, next) => {
  const order = JSON.parse(req.body.json);

  const id = order.id;
  delete order.id;

  switch(order.state) {
    case 'cancel':
    case 'done':
      order.end_timestamp = getTimestamp();
  }

  getModel().update(id, order, (err, savedData) => {
    if(err) {
      next(err);
      return;
    }

    res.redirect('/dashboard')
  });
});

app.get('/mobile', (req, res, next) => {
  res.render('mobile', { });
});


app.post('/order_mobile', (req, res, next) => {
  const orderList = JSON.parse(req.body.json);
  console.log(orderList);

  Promise.all(orderList.map((order) => {
    if(order.coffee.length > 0) {
      order.state = 'pending';
      order.start_timestamp = getTimestamp();
      return new Promise((resolve, reject) => {
        getModel().create(order, (err, savedData) => {
          if(err) {
            reject(err);
          } else {
            resolve(savedData);
          }
        });
      });
    }
  })).then((values) => {
    res.render('mobile_result', {data: values });
  }).catch((err) => {
    console.log(err);
  });
});

app.get('/statall', function(req, res, next) {
  getModel().list((err, result) => {
    res.json(result);
  });
});

app.get('/stat', function(req, res, next) {
  getModel().list((err, result) => {
    let coffee = {};
    let coffee_ratio = {};
    coffeeMenu.forEach((e) => {
      coffee[e] = 0;
      coffee_ratio[e] = 0;
    });
    let hot = 0;
    let ice = 0;

    result.filter((e) => e.state !== 'cancel').forEach((e) => {
      const size = parseInt(e.quantity, 10);
      if(e.hotice === 'Hot')
        hot += size;
      else
        ice += size;
      coffee[e.coffee] += size;
    });

    const total = hot + ice;

    coffeeMenu.forEach((e) => {
      coffee_ratio[e] = (1.0 * coffee[e]) / total;
    });

    res.json([
      {
        hot: hot,
        ice: ice,
        coffee: coffee,
      },
      {
        hot: hot / total,
        ice: ice / total,
        coffee: coffee_ratio,
      }]);
  });
});

// for plus friends
app.get('/keyboard', function(req, res, next) {
  res.json(keyboardButton);
});

app.post('/message', function(req, res, next) {
  var msg = {
	  "text": 'https://coffee-order-simulator.appspot.com/mobile'
  }

  res.json({"message": msg, "keyboard": keyboardButton});
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT);
// [END app]
