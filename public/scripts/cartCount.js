// public/scripts/cartCount.js
// Ensure cart count is persistent for guest users on all pages with the header
(function() {
  var userMeta = document.querySelector('meta[name="user-logged-in"]');
  var isLoggedIn = userMeta && userMeta.content === 'true';
  if (!isLoggedIn) {
    var guestCart = JSON.parse(localStorage.getItem('guestCart')) || { items: [] };
    var count = guestCart.items.reduce(function(total, item) { return total + item.quantity; }, 0);
    document.querySelectorAll('.cart-count, #cartCount').forEach(function(el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
})();
