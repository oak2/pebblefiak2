var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var main = new UI.Card({
    title: 'OTP Bank',
    scrollable: true,
		body: 'Pozíció meghatározása...'
});

var locationOptions = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
};

console.log(new Date() + ' Starting fiak application...');
main.show();
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

function locationSuccess(pos) {
		main.body('Közeli filókok és ATM-ek listája');
    console.log(new Date() + ' lat= ' + pos.coords.latitude + ' lon= ' + pos.coords.longitude);
    var params = {
				"language": "hu",
        "type": "ALL",
				"atmCurrency":"348", //Ft
        "latitude": pos.coords.latitude,
        "longitude": pos.coords.longitude,
        "services": [1],
				"atmAvailability": "HozzáF1",
				"branchServiceType": "lak"
    };
      //  "latitude":pos.coords.latitude,
      //  "longitude": pos.coords.longitude,
      //  "latitude": 47.497912,
      //  "longitude": 19.040235,
    ajax({
            url: 'http://otp.active.hu/search',
            method: 'post',
            type: 'json',
            data: params,
            crossDomain: true
        },
        function(result) {
            var fiokok = [];
            result.forEach(function(entry) {
							var d = distance(entry.lat, entry.lng, pos.coords.latitude, pos.coords.longitude);
							//	var d = distance(entry.lat, entry.lng, 47.497912, 19.040235);
								//console.log(JSON.stringify(entry));
                var subtitle;
                if(entry.type=='BRANCH') {
                  subtitle = '(f)';
                } else {
                  subtitle = '(a)';
                }
                subtitle += '(' + distanceText(d) +')' + entry.zipCode + ' ' + entry.town;
                fiokok.push({
                    subtitle: subtitle,
                    title: entry.address,
									  distance: d,
										branchAtm: entry
                });
            });
						fiokok.sort(distanceComparator);
            var fiokokMenu = new UI.Menu({
                sections: [{
                    title: 'Fiókok és ATM-ek a közelben',
                    items: fiokok
                }]
            });
            fiokokMenu.show();
						Vibe.vibrate('short');
						console.log(new Date() + ' data on screen.');
						
						fiokokMenu.on('select', function(event) {
							console.log('event index ' + event.itemIndex);
							//console.log('event ' + JSON.stringify(event));
							var selected = fiokok[event.itemIndex];
							var detailCard = new UI.Card({
								title: selected.title,
								scrollable: true,
								body: selected.type=='BRANCH' ? bodyCreatorBranch(selected) : bodyCreatorATM(selected)
							});
							detailCard.show();
						});
						fiokokMenu.on('back', function(event) {
							console.log('event back' + event);
							//console.log('event ' + JSON.stringify(event));
							var selected = fiokok[event.itemIndex];
							var detailCard = new UI.Card({
								title: selected.title,
								scrollable: true,
								body: selected.type=='BRANCH' ? bodyCreatorBranch(selected) : bodyCreatorATM(selected)
							});
							detailCard.show();
						});
        },
        function(error) {
            console.log(new Date() + ' The ajax request failed: ' + error);
            main.body('Sajnos hiba történt.');
        }
    );
}

function locationError(err) {
    console.log(new Date() + ' location error (' + err.code + '): ' + err.message);
		main.body('Nem sikerült a pozíció letöltése.');
}

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371000; //meters
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function distanceComparator(a, b) {
  if (a.distance < b.distance)
    return -1;
  else if (a.distance > b.distance)
    return 1;
  else 
    return 0;
}

function distanceText(d) {
	if(d > 1000) {
		return Math.round(d / 10) / 100 + 'km';
	}
	return Math.floor(d) + ' m';
}

function bodyCreatorBranch(b) {
	return b.address;
}

function bodyCreatorATM(a) {
	return a.address;
}