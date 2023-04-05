function EMULATOR_get_random_int_between(min, max) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  return Math.floor(Math.random() * (max - min) + min);
}

function EMULATOR_get_random_item_from_list(list) { // https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
  return list[EMULATOR_get_random_item_from_number(list.length)];
}
function EMULATOR_get_random_item_from_number(number) {
  return Math.floor(Math.random()*number);
}

const max_number_of_days_ago = 30;
const max_time_ago = Date.now() - 86400 * 1000 * max_number_of_days_ago;
var emulated_time = max_time_ago;

function EMULATOR_get_random_date(random_time_frame, random_time_unit) {
  let time_frame = EMULATOR_get_random_item_from_number(random_time_frame);
  let new_emulated_time = emulated_time + time_frame * random_time_unit;
  emulated_time = new_emulated_time;
  return new_emulated_time;
}

const topics = [
  'auto-generated (lite)',
  'auto-generated (heavy)'
];

function EMULATOR_make_report(topic, random_time_unit) {
  let el = EMULATOR_get_random_item_from_list(dtu.elements_to_listen_to);
  let event = SUPPORTED_INPUT_TYPES_AND_EVENTS[el.type][0];
  let r = dtu.form_report(el, event);
  dtu.make_report(r)
  dtu.report.topic = topic;
  const random_time_frame = 15;
  dtu.report.date_time = EMULATOR_get_random_date(random_time_frame, random_time_unit);
  //dtu.report.element = el;
  return dtu.report;
}

function generate_fake_data() {
  for (let i in topics) {
    const topic = topics[i];
    if (topic == 'auto-generated (heavy)')
      random_time_unit = 1000; // UNITS_NAMES_VALUES.second;
    else if (topic == 'auto-generated (lite)')
      random_time_unit = 60000; // UNITS_NAMES_VALUES.minute;

    emulated_time = max_time_ago;
    let t = max_time_ago;
    while (t < Date.now()) {
      let c = EMULATOR_make_report(topic, random_time_unit);
      t = c.date_time;
      CLIENT_SDK_EMULATOR_send_to_telemetry_api(c);
    }
  }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hostname != '') {
    let app_content = document.getElementById('app_content'); 
    app_content.style.display = 'none';
    let loading_content = document.getElementById('loading');
    loading_content.style.display = 'block';

    sleep(0).then(() => {
      generate_fake_data();
      
      app_content.style.display = 'block';
      loading_content.style.display = 'none';

      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup(); 
    });
  }
});


// SDK APP FUNCTIONS
//const excluded_events = "mousedown mouseup mousemove mouseover mouseout mousewheel";
//const events = "click focus blur keydown change dblclick keydown keyup keypress textInput touchstart touchmove touchend touchcancel resize scroll zoom select change submit reset".split(" ");

function CLIENT_SDK_EMULATOR_send_to_telemetry_api(report) {
  //console.log(report)
	//jr = JSON.stringify(report);  // till no real networking - no stringify to save CPU time
	DTU_RX_API_submint_report_endpoint(report); // send emulation
}