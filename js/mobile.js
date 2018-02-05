function addCoffee() {
  let $hotIce = $('<select><option>Hot</option><option>Ice</option></select>').addClass('form-control').attr('name', 'hotice');
  $hotIce.change(() => {
    if('Ice' === $hotIce.val()) {
      $hotIce.css('background', '#17a2b8');
      $hotIce.css('color', '#ffffff');
    } else {
      $hotIce.css('background', '#dc3545');
      $hotIce.css('color', '#ffffff');
    }
  });
  $hotIce.trigger('change');

  let $hotIceComponent = $('<div></div>').addClass('col col-sm-2').append($('<div></div>').attr('class', 'form-group').append($hotIce));

  let $coffee= $('<select><option>Americano</option><option>Caramel Macchiato</option><option>Latte</option><option>Chocolate(S)</option><option>Chocolate</option><option>Vanilla Latte</option><option>Hazelnut Latte</option><option>Cappuccino</option><option>Mocha</option><option>Espresso</option><option>Sweet Sweet</option></select>').addClass('form-control').attr('name', 'coffee');
  let $coffeeComponent = $('<div></div>').addClass('col col-sm-auto').append($('<div></div>').attr('class', 'form-group').append($coffee));

  let $options = $('<select multiple="multiple"><option>Add shot</option><option>Less shot</option><option>More syrup</option><option>Less syrup</option></select>').addClass('form-control').attr('name', 'options');
  let $optionsComponent = $('<div></div>').addClass('col col-md-3').append($('<div></div>').attr('class', 'form-group').append($options));

  let $quantity = $('<select><option>0</option><option selected="selected">1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option></select>').addClass('form-control').attr('name', 'quantity');
  $quantity.change(() => {
    if('0' !== $quantity.val()) {
      $quantity.css('background', '#ffffff');
      $quantity.css('color', '#000000');
    } else {
      $quantity.css('background', '#dc3545');
      $quantity.css('color', '#ffffff');
    }
  });
  $quantity.trigger('change');

  let $quantityComponent = $('<div></div>').addClass('col col-sm-2').append($('<div></div>').attr('class', 'form-group').append($quantity));

  let $div = $('<div></div>').addClass('form-row')
    .append($hotIceComponent)
    .append($quantityComponent);

  let $div2 = $('<div></div>').addClass('form-row')
    .append($coffeeComponent)

  let $div3 = $('<div></div>').addClass('form-row')
    .append($optionsComponent);

  let $form = $('<form></form>').append($div).append($div2).append($div3);

  $('#order-display').append($form);
}

function submitOrder()
{
  $('#submit-order').click(() => {

    if(0 >= $('#order-name').val().length) {
      alert('What is your name?');
      return;
    }

    let orderList = [];
    let orderObj = {};

    $('#order-display').find('select').each((i, elem) => {
      orderObj[elem.name] = $(elem).val();

      if('options' === elem.name && orderObj.quantity > 0) {
        orderList.push({
          "hotice": orderObj.hotice,
          "coffee": orderObj.coffee,
          "options": orderObj.options,
          "quantity": orderObj.quantity,
          "mobile": true,
          "name": $('#order-name').val(),
        });
      }
    });

    $('#input-json').val(JSON.stringify(orderList));
    $('#order-form').submit();
  });
}

window.onload = function() {
  submitOrder();

  $('#add-coffee').click(addCoffee);
  addCoffee();
};
