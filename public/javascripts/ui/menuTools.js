function MenuTools(menuId) {
  var submenu_active = false;

  var menu = $("#" + menuId)
  menu.mouseenter(function() {
    submenu_active = true;
  });

  this.open = function() {
    var submenu = $("#tools-menu-submenu")

    if(submenu.is(":hidden")) {
      function timeout(ms) {
        setTimeout(function() {
          if(!submenu_active) submenu.slideUp();
        }, ms);
      }

      submenu.mouseenter(function() {
        submenu_active = true;
      });
      submenu.mouseleave(function() {
        submenu_active = false;
        timeout(1000)
      });

      menu.mouseleave(function() {
        submenu_active = false;
        timeout(1000)
      });

      submenu.slideDown();
      timeout(3000)
    } else submenu.slideUp();
  }
}