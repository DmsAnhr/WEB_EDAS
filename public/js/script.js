$(document).ready(function () {
  
  if ($('.container-fluid').hasClass('calculate-page')) {
    $(".side-menu").css("top", $(".side-menu").offset().top);
  }


  // Cache selectors
  var topMenuHeight = $(".navbar").outerHeight() + 100;
  $(".side-menu a").click(function (e) {
      var href = $(this).attr("href"),
        offsetTop = href === "#" ? 0 : $(href).offset().top - topMenuHeight + 1;
      if (href === "#top") {
        $("html, body").stop().animate(
          {
            scrollTop: 0,
          },
          500
        );
      } else {
        $("html, body").stop().animate(
          {
            scrollTop: offsetTop,
          },
          500
        );
      }
      e.preventDefault();
  });

  $(window).on("scroll", function () {
      var scrollPos = $(window).scrollTop();
      var windowHeight = $(window).height();
      var documentHeight = $(document).height();

      $(".content-area section").each(function () {
        var contentTop = $(this).offset().top - topMenuHeight;
        var contentBottom = contentTop + $(this).outerHeight();

        if (scrollPos >= contentTop && scrollPos < contentBottom) {
          var targetId = $(this).attr("id");
          $(".side-menu a").removeClass("active");
          $('.side-menu a[href="#' + targetId + '"]').addClass("active");
        }

        if (scrollPos + windowHeight === documentHeight) {
          $(".side-menu a").removeClass("active");
          $('.side-menu a[href="#skor"]').addClass("active");
        }
      });
  });

  $('.btn-show-edit').click(function() {
    idRow = $(this).attr('data-target');
    $('.collapse-row').not(idRow).collapse('hide')
  });


});
