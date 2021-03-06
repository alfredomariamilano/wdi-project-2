const App = App || {};

App.addInfoWindowForEvent = function(event, marker){
  google.maps.event.addListener(marker, 'click', () => {
    App.people(event);
    if (typeof this.infoWindow !== 'undefined') this.infoWindow.close();
    this.infoWindow = new google.maps.InfoWindow({
      content: `
      <div class='iw-title'>
      <h2><a href='${event.link}' target="_blank">${event.name}</a></h2>
      </div>
      <div class='iw-container'>
      <img src='${event.imageurl}'>
      <h3>${event.venue}</h3>
      <h4>${event.date}</h4>
      <h4>${event.address}</h4>
      <h4>${event.postCode}</h4>
      <h4>${event.town}</h4>
      <p>${event.description}</p>
      <h4>Going: ${event.going.length}</h4>
      <div class="peopleGoing">${App.peopleGoing}</div>
      <br>
      <div class="iw-bottom-gradient"></div>
      </div>
      `});

      App.infoWindowsArray.push(this.infoWindow);
      App.customizeInfoWindow(App.infoWindowsArray[App.infoWindowsArray.length-1]);
      App.map.setCenter(marker.getPosition());
      App.map.panBy(0, -250);
      this.infoWindow.open(this.map, marker);
    });
  };

  App.people = function (event) {
    App.peopleGoing = ``;
    $.each(event.going, function (index, person) {
      App.peopleGoing = App.peopleGoing +
      `<div class="card">
      <img class="card-img-top" src="${person.image}" alt="Card image cap">
      <div class="card-block">
      <h4 class="card-text">${person.name}</h4>
      </div>
      </div>`;
    });
  };

  App.myClick = function(id){
    google.maps.event.trigger(App.markers[id], 'click');
    toggleBurger();
  };

  App.markerIcon = function(type){
    let iconURL = "";
    switch (type) {
      case "FEST":
      iconURL = 'images/festivals.png';
      break;
      case "LIVE":
      iconURL = 'images/livemusic.png';
      break;
      case "CLUB":
      iconURL = 'images/disco.png';
      break;
      case "DATE":
      iconURL = 'images/date.png';
      break;
      case "THEATRE":
      iconURL = 'images/theater.png';
      break;
      case "COMEDY":
      iconURL = 'images/comedy.png';
      break;
      case "EXHIB":
      iconURL = 'images/exhibitions.png';
      break;
      case "KIDS":
      iconURL = 'images/family.png';
      break;
      case "BARPUB":
      iconURL = 'images/barpub.png';
      break;
      case "LGB":
      iconURL = 'images/lgb.png';
      break;
      case "SPORT":
      iconURL = 'images/sport.png';
      break;
      case "ARTS":
      iconURL = 'images/arts.png';
      break;
      default:
      break;
    }
    return iconURL;
  };

  App.createMarkerForEvent = function(event){
    let link = "";
    if (event.lat && event.lng) {
      let latLng = new google.maps.LatLng(event.lat, event.lng);
      let icon = {
        url:        App.markerIcon(event.eventType), // url
        scaledSize: new google.maps.Size(40, 40), // scaled size
        origin:     new google.maps.Point(0,0), // origin
        anchor:     new google.maps.Point(0, 0) // anchor
      };
      let marker = new google.maps.Marker({
        position:  latLng,
        map:       this.map,
        icon:      icon,
        animation: google.maps.Animation.DROP
      });
      this.markers.push(marker);

      $('.burger-content').append(`
        <div class='result' onclick='App.myClick(${App.markers.length-1})'>
        <img src='${event.imageurl}'>
        <h2><a href='${event.link}' target="_blank">${event.name}</a></h2>
        <h3>${event.venue}</h3>
        <img class='typeIcon' src=${App.markerIcon(event.eventType)}>
        <h4>${event.date}</h4>
        <h4>${event.address}</h4>
        <h4>${event.town}</h4>
        <h4>Going: ${event.going.length}</h4>
        </div>
        `);

        App.addInfoWindowForEvent(event, App.markers[App.markers.length-1]);
      }
    };

    App.loopThroughEvents = function (data){
      $.each(data.events, (index, event) => {
        window.setTimeout(()=>{
          App.createMarkerForEvent(event);
        }, index*50);
      });
    };

    App.getEvents = function(){
      App.clearMap();
      App.currentSearch = $(this).val();
      $.ajax({
        url: App.urlSelector(),
        method: 'get',
        dataType: 'json',
        beforeSend: App.setRequestHeader
      }).done(App.loopThroughEvents);
    };

    App.urlSelector = function(){
      if (App.currentSearch === "ALL") {
        return `https://eventi-map.herokuapp.com/api/events/London/`;
      } else {
        return `https://eventi-map.herokuapp.com/api/events/London/${App.currentSearch}`;
      }
    };

    App.clearMap = function(){
      if (typeof App.markers !== 'undefined') {
        for (var i = 0; i < App.markers.length; i++) {
          App.markers[i].setMap(null);
        }
      }
      if (typeof App.infoWindowsArray !== 'undefined') {
        for (var x = 0; x < App.infoWindowsArray.length; x++) {
          if (App.infoWindowsArray[x] !== null) {
            google.maps.event.clearInstanceListeners(App.infoWindowsArray[x]);
            App.infoWindowsArray[x].close();
            App.infoWindowsArray[x] = null;
          }
        }
      }
      App.infoWindowsArray = [];
      App.markers = [];
      $('.burger-content').empty();
    };

    App.mapSetup = function(){
      App.clearMap();
      let canvas = document.getElementById('map-canvas');

      let mapOptions = {
        zoom:      14,
        center:    new google.maps.LatLng(51.506178,-0.088369),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyle,
        disableDefaultUI: true
      };
      this.map = new google.maps.Map(canvas, mapOptions);
      setEventListeners();
      App.setOwnLocation();
      var iwOuter = $('.gm-style-iw');

      /* The DIV we want to change is above the .gm-style-iw DIV.
      * So, we use jQuery and create a iwBackground variable,
      * and took advantage of the existing reference to .gm-style-iw for the previous DIV with .prev().
      */
      var iwBackground = iwOuter.prev();

      // Remove the background shadow DIV
      iwBackground.children(':nth-child(2)').css({'display' : 'none'});

      // Remove the white background DIV
      iwBackground.children(':nth-child(4)').css({'display' : 'none'});
    };

    function setEventListeners (){
      $('select').on('change', App.getEvents);
      $('#start').click(App.startMap);
      $('#position').click(App.panToLocation);
      $('#burger').click(toggleBurger);
      $('.index').click(toggleBurger);
      $('.new').click(toggleBurger);
      App.apiUrl = "https://eventi-map.herokuapp.com/api";
      App.$modal  = $(".modal-body");

      $(".register").on("click", App.register.bind(App));
      $(".login").on("click", App.login.bind(App));
      $(".logout").on("click", App.logout.bind(App));
      App.$modal.on("submit", "form", App.handleForm);

      let iwOuter = $('.gm-style-iw');
      let iwBackground = iwOuter.prev();
      iwBackground.children(':nth-child(2)').css({'display' : 'none'});
      iwBackground.children(':nth-child(4)').css({'display' : 'none'});
    }

    function toggleBurger() {
      $('#burger').toggleClass('expanded').siblings('div').slideToggle();
    }

    $(App.mapSetup.bind(App));

    App.panToLocation = ()=>App.map.panTo(App.pos);

    App.startMap = function() {
      console.log(this);
      $('#start').hide();
      $('.hiddenStart').css('display', 'inline');
    };

    App.setOwnLocation = function(){
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          App.pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          let icon = {
            url:        "images/position.png", // url
            scaledSize: new google.maps.Size(50, 50), // scaled size
            origin:     new google.maps.Point(0,0), // origin
            anchor:     new google.maps.Point(0, 0) // anchor
          };

          let marker = new google.maps.Marker({
            position:  App.pos,
            icon,
            map:       App.map,
            animation: google.maps.Animation.DROP
          });
          App.panToLocation();
          if (App.getToken()) {
            App.loggedInState();
          } else {
            App.loggedOutState();
          }
        }, function() {
          handleLocationError(true, infoWindow, App.map.getCenter());
        });
      } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, App.map.getCenter());
      }

      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
          'Error: The Geolocation service failed.' :
          'Error: Your browser doesn\'t support geolocation.');
        }
      };

      // User authentication-----------------------------------------------

      App.loggedInState = function(){
        $('#start').hide();
        $(".loggedOut").hide();
        $(".loggedIn").show();
      };

      App.loggedOutState = function(){
        $('#start').show();
        $(".loggedOut").show();
        $(".loggedIn").hide();
        App.clearMap();
      };

      App.register = function() {
        if (event) event.preventDefault();
        this.$modal.html(`
          <h2>Register</h2>
          <form method="post" action="/register">
          <div class="form-group">
          <input class="form-control" type="text" name="user[username]" placeholder="Username">
          </div>
          <div class="form-group">
          <input class="form-control" type="email" name="user[email]" placeholder="Email">
          </div>
          <div class="form-group">
          <input class="form-control" type="password" name="user[password]" placeholder="Password">
          </div>
          <div class="form-group">
          <input class="form-control" type="password" name="user[passwordConfirmation]" placeholder="Password Confirmation">
          </div>
          <input class="btn btn-primary" type="submit" value="Register">
          </form>
          `);
        };

        App.login = function() {
          event.preventDefault();
          this.$modal.html(`
            <h2>Login</h2>
            <form method="post" action="/login">
            <div class="form-group">
            <input class="form-control" type="email" name="email" placeholder="Email">
            </div>
            <div class="form-group">
            <input class="form-control" type="password" name="password" placeholder="Password">
            </div>
            <input class="btn btn-primary" type="submit" value="Login">
            </form>
            `);
          };

          App.logout = function() {
            event.preventDefault();
            this.removeToken();
            this.loggedOutState();
            App.clearMap();
          };

          App.handleForm = function(){
            event.preventDefault();
            $('#myModalHorizontal').modal('hide');

            let url    = `${App.apiUrl}${$(this).attr("action")}`;
            let method = $(this).attr("method");
            let data   = $(this).serialize();

            return App.ajaxRequest(url, method, data, (data) => {
              if (data.token) App.setToken(data.token);
              App.loggedInState();
            });
          };

          App.ajaxRequest = function(url, method, data, callback){
            return $.ajax({
              url,
              method,
              data,
              beforeSend: App.setRequestHeader
            })
            .done(callback)
            .fail(data => {
              console.log(data);
            });
          };

          App.setRequestHeader = function(xhr, settings) {
            return xhr.setRequestHeader("Authorization", `Bearer ${App.getToken()}`);
          };

          App.setToken = function(token){
            return window.localStorage.setItem("token", token);
          };

          App.getToken = function(){
            return window.localStorage.getItem("token");
          };

          App.removeToken = function(){
            return window.localStorage.clear();
          };



          App.customizeInfoWindow = function(infowindow){

            google.maps.event.addListener(infowindow, 'domready', function() {
              var iwOuter = $('.gm-style-iw');
              var iwBackground = iwOuter.prev();
              iwBackground.children(':nth-child(2)').css({'display' : 'none'});

              iwBackground.children(':nth-child(4)').css({'display' : 'none'});

              // Moves the infowindow 115px to the right.
              iwOuter.parent().parent().css({left: '115px'});

              // Moves the shadow of the arrow 76px to the left margin.
              iwBackground.children(':nth-child(1)').attr('style', function(i,s){ return s + 'left: 76px !important;';});

              // Moves the arrow 76px to the left margin.
              iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;';});

              // Changes the desired tail shadow color.
              iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(0, 0, 0, 0.7) 0px 1px 6px', 'z-index' : '1'});

              // Reference to the div that groups the close button elements.
              var iwCloseBtn = iwOuter.next();

              // Apply the desired effect to the close button
              iwCloseBtn.css({opacity: '1', right: '60px', top: '25px', border: '7px solid rgba(255, 0, 0, 0.7)', 'border-radius': '13px', 'box-shadow': '0 0 5px rgba(0, 0, 0, 0.7)'});

              // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
              if($('.iw-content').height() < 140){
                $('.iw-bottom-gradient').css({display: 'none'});
              }

              // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
              iwCloseBtn.mouseout(function(){
                $(this).css({opacity: '1'});
              });
            });
          };


          const mapStyle = [{"featureType":"all","stylers":[{"saturation":0},{"hue":"#e7ecf0"}]},{"featureType":"road","stylers":[{"saturation":-70}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"visibility":"simplified"},{"saturation":-60}]}];
          //  [{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#165c64"},{"saturation":34},{"lightness":-69},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"hue":"#b7caaa"},{"saturation":-14},{"lightness":-18},{"visibility":"on"}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"hue":"#cbdac1"},{"saturation":-6},{"lightness":-9},{"visibility":"on"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#8d9b83"},{"saturation":-89},{"lightness":-12},{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"hue":"#d4dad0"},{"saturation":-88},{"lightness":54},{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"hue":"#bdc5b6"},{"saturation":-89},{"lightness":-3},{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"hue":"#bdc5b6"},{"saturation":-89},{"lightness":-26},{"visibility":"on"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"hue":"#c17118"},{"saturation":61},{"lightness":-45},{"visibility":"on"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"hue":"#8ba975"},{"saturation":-46},{"lightness":-28},{"visibility":"on"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"hue":"#a43218"},{"saturation":74},{"lightness":-51},{"visibility":"simplified"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"simplified"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"labels","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":0},{"lightness":100},{"visibility":"off"}]},{"featureType":"administrative","elementType":"all","stylers":[{"hue":"#3a3935"},{"saturation":5},{"lightness":-57},{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"geometry","stylers":[{"hue":"#cba923"},{"saturation":50},{"lightness":-46},{"visibility":"on"}]},{"featureType":"all", "elementType":"labels","stylers": [{"visibility":"off"}]}];
