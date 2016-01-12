var EMULATOR = {
	enabled: false,
	latitude: 47.497912,
	longitude: 19.040235
};

var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var log = function(msg, params) {
	console.log(new Date() + ': ' + msg + ' [' + params.join() + '].');	
};

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

log('Starting fiak application. Emulator mode:', [EMULATOR.enabled]);
main.show();
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

function locationSuccess(pos) {
    var params = {
				"language": "hu",
        "type": "ALL",
				"atmCurrency":"348", //Ft
				"latitude": EMULATOR.enabled ? EMULATOR.latitude : pos.coords.latitude,
        "longitude": EMULATOR.enabled ? EMULATOR.longitude : pos.coords.longitude,
        "services": [1],
				"atmAvailability": "HozzáF1",
				"branchServiceType": "lak"
    };
    log('Latitude, longitude', [params.latitude, params.longitude]);
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
								var d = distance(entry.lat, entry.lng, params.latitude, params.longitude);
                fiokok.push({
                    subtitle: subtitleCreator(entry, d),
                    title: entry.address,
									  distance: d,
										entry: entry
                });
            });
						fiokok.sort(distanceComparator);
            var fiokokMenu = new UI.Menu({
                sections: [{
                    title: 'Fiókok és ATM-ek a közelben',
										style: 'small',
                    items: fiokok
                }]
            });
            fiokokMenu.show();
						main.hide();
						Vibe.vibrate('short');
						log('Data on screen.', []);
						
						fiokokMenu.on('select', function(event) {
							log('event index ', [event.itemIndex]);
							var selected = fiokok[event.itemIndex];
							var detailCard = new UI.Card({
								title: selected.title,
								scrollable: true,
								body: selected.entry.type=='BRANCH' ? bodyCreatorBranch(selected.entry) : bodyCreatorATM(selected.entry)
							});
							detailCard.show();
						});
        },
        function(error) {
            log('The ajax request failed', [error]);
            main.body('Sajnos hiba történt.');
        }
    );
}

function locationError(err) {
		log('Location error: code, message', [err.code, err.message]);
		main.body('Nem sikerült a pozíció meghatározása.');
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
	return '\nH: ' + openingCreator(b.openingHours[0]) +
					'\nK: ' + openingCreator(b.openingHours[1]) +
					'\nSz: ' + openingCreator(b.openingHours[2]) +
					'\nCs: ' + openingCreator(b.openingHours[3]) +
					'\nP: ' + openingCreator(b.openingHours[4]) +
					'\nSzo: ' + openingCreator(b.openingHours[5]) +
					'\nV: ' + openingCreator(b.openingHours[6]) +
					'\nTel.: ' + b.tel + 
					'\n' + b.comment;
}

function bodyCreatorATM(a) {
	console.log(JSON.stringify(a));
	return 'Hozzáférhetőség: ' + a.availability;
}

function subtitleCreator(entry, distance) {
	return (entry.type=='BRANCH'?'*':'•') + ' ' + distanceText(distance) +' - ' + entry.zipCode + ' ' + entry.town;
}

function openingCreator(oh) {
	return oh ? oh : '-';
}