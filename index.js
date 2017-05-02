var request = require('request');

var orders = [];
getJson(1);

// Recursive async request to get all orders.
function getJson(pageNumber) {
  request('https://backend-challenge-fall-2017.herokuapp.com/orders.json?page=' + pageNumber,
    function(error, response, body) {
      var json = JSON.parse(body);
      addOrders(orders, json);

      if (hasNext(json)) {
        getJson(pageNumber + 1);
      } else {
        processOrders(orders, json.available_cookies);
      }
    });
}

// Add orders from given json file to given orders array.
function addOrders(orders, json) {
  json.orders.forEach(function(order) {
    orders.push(order);
  });
}

/* Returns true if there are additional json requests to make based on
   current pagination page and total number of orders.
*/
function hasNext(json) {
  return json.pagination.current_page * json.pagination.per_page < json.pagination.total;
}

/* Process orders by removing all orders marked fulfilled and fulfilling all
   non-cookie orders. For cookie orders, fulfill all possible cookie orders.
   Print to console the amount of cookie remaining and the ids of unfulfilled
   orders.
*/
function processOrders(orders, availableCookies) {
  var cookieOrders = fulfillNonCookieOrders(orders);
  var unfulfilledResults = fulfillCookieOrders(cookieOrders, availableCookies);
  console.log(unfulfilledResults);
}

/* Return an array of unfullfilled cookie orders, sorted in decscending order
   by the amount of cookies. In case of a tie, lower order id will be first.
*/
function fulfillNonCookieOrders(orders) {
  return orders.filter(function(order) {
      return !order.fulfilled && order.products.reduce(function(acc, val) {
        return acc || val.title === "Cookie";
      }, false);
    })
    .sort(function(a, b) {
      if (getCookieAmount(a) > getCookieAmount(b)) return -1;
      if (getCookieAmount(a) < getCookieAmount(b)) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
}

/* Fulfill all possible cookie orders by first fulfilling orders with most
   amount of cookies (as long as there are enough cookies available). If two
   orders require the same amount of cookies, the order with lowest id will be
   fulfilled first. Returns object with amount of remaining cookies and the
   unfulfilled orders.
*/
function fulfillCookieOrders(orders, availableCookies) {
  var unfulfilledOrders = orders.filter(function(order) {
    if (getCookieAmount(order) <= availableCookies) {
      availableCookies -= getCookieAmount(order);
      return false;
    }
    return true;
  });

  var unfulfilledOrderIds = unfulfilledOrders.map(function(order) {
      return order.id;
    })
    .sort(function(a, b) {
      return a - b;
    });

  return {
    'remaining_cookies': availableCookies,
    'unfulfilled_orders': unfulfilledOrderIds
  };
}

// Return the amount of cookies in a given order
function getCookieAmount(order) {
  for (var i = 0; i < order.products.length; i++) {
    if (order.products[i].title === "Cookie") {
      return order.products[i].amount;
    }
  }
}
