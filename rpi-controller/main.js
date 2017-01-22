const Serial = require('./serial');
var bleno = require('bleno');

let serial = new Serial();

var deviceName = 'auto-fan';
var serviceUuids = ['fffffffffffffffffffffffffffffff0']

serial.on('device-found', (name) => {
  console.log(`Connecting to ${name}...`);
});

serial.on('device-open', () => {

  serial.setStatus(true);

});

//services
var autoFanServices = [
  // Temperature
  new bleno.PrimaryService({
    uuid : 'fff0',
    characteristics : [

      // temperature characteristic
      new bleno.Characteristic({
        value : null,
        uuid : 'ff00',
        properties: ['read', 'notify'],
        descriptors: [
          new bleno.Descriptor({
            uuid: 'fff0',
            value: 'Temperature'
          })
        ],
        onReadRequest : function(offset, callback) {
          console.log("Read Temp request received");
          serial.once('data:temperature', temp => {
            console.log('Temp: '+temp);
            callback(this.RESULT_SUCCESS, new Buffer(temp));
          });
          serial.getTemp();
        },
        onSubscribe: function(maxValueSize, updateValueCallback) {
          setInterval(function(){
              serial.once('data:temperature', temp => {
                console.log('Temp: '+temp);
                updateValueCallback(new Buffer(temp));
              });
              serial.getTemp();
          }, 5000);
        }
      })

    ]
  }), // Temperature service

  // Status
  new bleno.PrimaryService({
    uuid : 'fff1',
    characteristics : [

      // temperature characteristic
      new bleno.Characteristic({
        value : null,
        uuid : 'ff00',
        properties: ['write', 'read', 'notify'],
        descriptors: [
          new bleno.Descriptor({
            uuid: 'fff0',
            value: 'Fan Status'
          })
        ],
        onReadRequest : function(offset, callback) {
          console.log("Read Status request received");
          serial.once('data:status', status => {
            console.log('Status: '+status);
            callback(this.RESULT_SUCCESS, new Buffer(status ? 'on' : 'off'));
          });
          serial.getStatus();
        },
        onSubscribe: function(maxValueSize, updateValueCallback) {
          setInterval(function(){
              serial.once('data:status', status => {
                console.log('Status: '+status);
                updateValueCallback(new Buffer(status ? 'on' : 'off'));
              });
              serial.getStatus();
          }, 5000);
        },
        onWriteRequest: function(data, offset, withoutResponse, callback) {
          let dataStr = data.toString('utf-8');
          let status = dataStr == '1' || dataStr.toLowerCase() == 'on';
          serial.setStatus(status).then(() => {
            callback(this.RESULT_SUCCESS);
          }).catch((err) => {
            console.log(err);
            callback(this.RESULT_UNLIKELY_ERROR);
          });
        }
      })

    ]
  }) // Status service

];

// Once bleno starts, begin advertising our BLE address
bleno.on('stateChange', function(state) {
  console.log('State change: ' + state);
  if (state === 'poweredOn') {
    bleno.startAdvertising(deviceName, serviceUuids);
  } else {
    bleno.stopAdvertising();
  }
});

// Notify the console that we've accepted a connection
bleno.on('accept', function(clientAddress) {
  console.log("Accepted connection from address: " + clientAddress);
});

// Notify the console that we have disconnected from a client
bleno.on('disconnect', function(clientAddress) {
  console.log("Disconnected from address: " + clientAddress);
});

// When we begin advertising, create a new service and characteristic
bleno.on('advertisingStart', function(error) {
  if (error) {
    console.log("Advertising start error:" + error);
  } else {
    console.log("Advertising start success");
    bleno.setServices(autoFanServices);
  }
});
