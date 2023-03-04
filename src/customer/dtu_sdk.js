// ENV-DEPENDANT PARAMS
//var c = {};
//c.ctag = "ABC";
//c.category = "web";  // to be used here without get from elements
//c.topic = "default";
//c.app_name = "Analytics";

// ENV-INDEPENDANT PARAMS
//c.app_version = "4.26.1";
//c.release = "0.1.0.0";

// SDK APP FUNCTIONS
//const excluded_events = "mousedown mouseup mousemove mouseover mouseout mousewheel";
//const events = "click focus blur keydown change dblclick keydown keyup keypress textInput touchstart touchmove touchend touchcancel resize scroll zoom select change submit reset".split(" ");

function CLIENT_SDK_send_to_telemetry_api(report) {
  debug_helper(arguments, DEBUG);
  //console.log(report)
	jr = JSON.stringify(report);
	RX_API_submint_report(jr); // send emulation
}

const CLIENT_SDK_topic = "real usage";
const CLIENT_SDK_ctag = "ABCD";

//const DTU_TAG = "dtu";
//const DTU_ELEMENTS_TO_TRACK = document.querySelectorAll('[data-dtu]');

for (let i = 0; i < DTU_ELEMENTS_TO_TRACK.length; i++) {
	let element = DTU_ELEMENTS_TO_TRACK[i];

  if (element.type == "select-one") { // dropdown
    element.addEventListener("change", function(e) {
      var clicked = this.dataset[DTU_TAG];
      var value = this.value;

      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else if (element.type == "datetime-local") {
    element.addEventListener("change", function(e) {
      var clicked = this.dataset[DTU_TAG];
      var value = this.value;
      //ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts(); // has to be separate listener, just done here for fast try
      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else { // some link or any clickable thing
    //console.log(element.type)
    element.addEventListener("click", function(e) {
      const clicked = 'link';
      const value = this.dataset[DTU_TAG];

      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      //console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
}

function CLIENT_SDK_prepare_data_before_send(clicked, value) {
  let c = {};
  c.ctag = CLIENT_SDK_ctag;
  c.topic = CLIENT_SDK_topic;
  c.feature = clicked;
  c.feature_path = ['', clicked];
  c.value = value;
  c.date_time = Date.now();
  return c;
}