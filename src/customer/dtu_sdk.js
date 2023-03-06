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

const CLIENT_SDK_DTU_TAG = "dtu";
const CLIENT_SDK_DTU_ELEMENTS_TO_TRACK = document.querySelectorAll('[data-' + CLIENT_SDK_DTU_TAG + ']');
const CLIENT_SDK_topic = "real usage";
const CLIENT_SDK_ctag = "ABCD";

function CLIENT_SDK_send_to_telemetry_api(report) {
  //console.log(report)
	jr = JSON.stringify(report);
	RX_API_submint_report(jr); // send emulation
}

for (let i = 0; i < CLIENT_SDK_DTU_ELEMENTS_TO_TRACK.length; i++) {
	let element = CLIENT_SDK_DTU_ELEMENTS_TO_TRACK[i];

  if (element.type == "select-one") { // dropdown
    element.addEventListener("change", function(e) {
      console.log("element type: ", element.type)
      var clicked = this.dataset[CLIENT_SDK_DTU_TAG];
      var value = this.value;

      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else if (element.type == "datetime-local") {
    element.addEventListener("change", function(e) {
      console.log("element type: ", element.type)
      var clicked = this.dataset[CLIENT_SDK_DTU_TAG];
      var value = this.value;
      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      //console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else if (element.type == "button") {
    element.addEventListener("click", function(e) {
      console.log("element type: ", element.type)
      var clicked = this.dataset[CLIENT_SDK_DTU_TAG];
      var value = this.value;
      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      //console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else if (element.type == "") { // link but button in bootstrap 5
    element.addEventListener("click", function(e) {
      console.log("element type: ", element.type)
      var clicked = this.dataset[CLIENT_SDK_DTU_TAG];
      var value = this.value;
      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      //console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else if (element.type === undefined) { // link
    element.addEventListener("click", function(e) {
      var clicked = 'link';
      var value = this.dataset[CLIENT_SDK_DTU_TAG];
      const c = CLIENT_SDK_prepare_data_before_send(clicked, value);
      //console.log(c);
      CLIENT_SDK_send_to_telemetry_api(c);
    }, false);
  }
  else { // some link or any clickable thing
    element.addEventListener("click", function(e) {
      console.error("clicked unknown element type: ", element.type)
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