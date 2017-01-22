const EventEmitter = require('events');
const SerialPort = require("serialport");
const parsers = SerialPort.parsers;

class Serial extends EventEmitter {

  constructor(options) {
    super();

    this.device_options = Object.assign({
      baudRate: 9600, // bound rate as specified in the `firmware`
      hupcl: false, // disable hangup on close
      parser: SerialPort.parsers.readline('\n') // emit data when find a new line
      // parser: SerialPort.parsers.byteLength(2)
    }, options);

    this.deviceOpen = false;

    this._init();

  }

  _init() {

    SerialPort.list((err, ports) => {
      let ports_filtered = ports.filter((port) => {
        return port.manufacturer != undefined &&
        port.manufacturer.toLowerCase().indexOf('arduino') >= 0;
      });

      if(ports_filtered.length > 0) {

        let name = ports_filtered[0].comName;
        this.emit('device-found', name);

        this.device = new SerialPort(name, this.device_options);

        this.device.on('data', this._parseData.bind(this));
        this.device.on('open', () => {
          this.deviceOpen = true;
          this.emit('device-open');
        });
        this.device.on('error', this.emit.bind(this, 'error'));

      } else {
        this.emit('error', 'No arduino was found. Too bad');
      }

    }); // .list

  } // ._init()

  _parseData(data) {
    if(data.startsWith('t:')) {
      this.emit('data:temperature', data.replace('t:', ''));
    }

    if(data.startsWith('s:')) {
      this.emit('data:status', data=='s:0' ? false : true );
    }

    this.emit('data', data);
  }

  isOpen() {
    return this.deviceOpen;
  }

  write(data, cb) {
    let promise = new Promise((resolve, reject) => {

      if(!this.deviceOpen) {
        reject('Device is not open');
        return;
      }

      this.device.write(data, (err) => {
        if(err) {
          reject(err);
          return;
        }

        resolve();
      });

    });
    if(cb) {
      promise.then(cb.bind(null)).catch(cb);
    } else {
      return promise;
    }
  }

  close() {
    this.device.close();
  }

  getTemp(cb) {
    return this.write('3', cb);
  }

  getStatus(cb) {
    return this.write('4', cb);
  }

  setStatus(status, cb) {
    return this.write(status ? '1' : '2', cb);
  }

}


module.exports = Serial;
