function EMULATOR_get_random_int_between(min, max) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  return Math.floor(Math.random() * (max - min) + min);
}

function make_normal_distribution(list) {
  let mean_i = Math.floor(list.length / 2); // works both for odd and even, floor because id's are from 0
  let standard_deviation = 4//Math.floor(list.length / 3);

  let new_i = [];
  let debug = [];
  for (let i in list) {
    let new_number_of_i = (2000 * Math.exp(-0.5 * Math.pow((i - mean_i) / standard_deviation, 2))) / (standard_deviation * Math.pow(2 * Math.PI, 0.5));
    debug.push(new_number_of_i);
    new_i.push(Math.floor(new_number_of_i));
  }

  let normal_list = [];
  for (let i in list) {
    let list_item = list[i];
    let number_of_repeats = new_i[i];
    for (let j = 0; j < number_of_repeats; j++) {
      normal_list.push(list_item);
    }
  }
  return normal_list;
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

function EMULATOR_make_report(topic, random_time_unit, list) {
  let el = EMULATOR_get_random_item_from_list(list);
  let event = SUPPORTED_INPUT_TYPES_AND_EVENTS[el.type][0];
  let r = dtu.process_element_event(el, event);
  dtu.make_report(r)
  dtu.report.topic = topic;
  const random_time_frame = 15;
  dtu.report.date_time = EMULATOR_get_random_date(random_time_frame, random_time_unit);
  return dtu.report;
}

function generate_fake_data() {
  const list = [...dtu.elements_to_listen_to].sort(() => Math.random() - 0.5);
  const normal_list = make_normal_distribution(list);

  for (let i in topics) {
    const topic = topics[i];
    if (topic == 'auto-generated (heavy)')
      random_time_unit = 1000; // UNITS_NAMES_VALUES.second;
    else if (topic == 'auto-generated (lite)')
      random_time_unit = 60000; // UNITS_NAMES_VALUES.minute;

    emulated_time = max_time_ago;
    let t = max_time_ago;
    while (t < Date.now()) {
      let c = EMULATOR_make_report(topic, random_time_unit, normal_list);
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

    sleep(500).then(() => {
      generate_fake_data();
      
      app_content.style.display = 'block';
      loading_content.style.display = 'none';

      if (!window.localStorage.getItem('topic'))
        document.getElementById('drpd:topic').value = 'auto-generated (lite)';

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