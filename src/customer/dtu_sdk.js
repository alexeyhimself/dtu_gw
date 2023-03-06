// SDK APP FUNCTIONS
//const excluded_events = "mousedown mouseup mousemove mouseover mouseout mousewheel";
//const events = "click focus blur keydown change dblclick keydown keyup keypress textInput touchstart touchmove touchend touchcancel resize scroll zoom select change submit reset".split(" ");

const DEFAULT_CTAG = 'ABCD';
const DEFAULT_TOPIC = 'default';
const DEFAULT_DTU_DATASET_ATTRIBUTE = "dtu";
const DEFAULT_ELEMENTS_EVENTS = {
        'select-one': ['change'],
        'datetime-local': ['change'],
        'button': ['click'],
        '': ['click'], // link button in bootstrap 5 at least
        undefined: ['click'],
      };

class DoTheyUse {
  constructor(config) {
    this.ctag = DEFAULT_CTAG;
    this.topic = DEFAULT_TOPIC;
    this.dtu_attr = DEFAULT_DTU_DATASET_ATTRIBUTE;
    this.listen_default_evemts = true;

    if (config) {
      if (config.ctag)
        this.ctag = config.ctag;
      if (config.topic)
        this.topic = config.topic;
      if (config.dtu_attr)
        this.dtu_attr = config.dtu_attr;
      if (config.listen)
        this.listen_default_evemts = config.listen;
    }
    
    this.collect_dtu_elements();
    if (this.listen_default_evemts)
      this.listen();
  }

  init_report() {
    this.report = {};
    this.report.ctag = this.ctag;
    this.report.topic = this.topic;
  }

  enrich_report(element, value) {
    this.report.feature = element;
    this.report.feature_path = ['', element];
    this.report.value = value;
    this.report.date_time = Date.now();
  }

  make_report(element, value) {
    this.init_report();
    this.enrich_report(element, value);
  }

  send_report_to_dtu_api() {
    console.log(this.report)
    // const json_report = JSON.stringify(this.report); // stringify before sending as payload
    const json_report = this.report; // till no real networking - no stringify as well to save CPU time
    DTU_RX_API_submint_report_endpoint(json_report);
  }

  send(element, value) {
    this.make_report(element, value);
    this.send_report_to_dtu_api();
  }

  collect_dtu_elements() {
    this.elements_to_listen_to = document.querySelectorAll('[data-' + this.dtu_attr + ']');
  }
  listen() {
    for (let i = 0; i < this.elements_to_listen_to.length; i++) {
      let element = this.elements_to_listen_to[i];
      let events_to_listen = DEFAULT_ELEMENTS_EVENTS[element.type];
      let dtu_this = this;
      for (let j = 0; j < events_to_listen.length; j++) {
        try {
          element.addEventListener(events_to_listen[j], function (e) {
            const el = this.dataset[DEFAULT_DTU_DATASET_ATTRIBUTE];
            const val = this.value;
            dtu_this.send(el, val);
          }, false);
        }
        catch (error) {
          console.error(error, 'at:', element);
        }
      }
    }
  }
};

function dotheyuse(config) {
  const dtu = new DoTheyUse(config);
};
