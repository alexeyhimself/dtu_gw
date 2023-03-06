const EMULATOR_CTAG = 'ABCD';
const DTU_TAG = "dtu";
const DTU_ELEMENTS_TO_TRACK = document.querySelectorAll('[data-' + DTU_TAG + ']');

function EMULATOR_get_random_int_between(min, max) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  return Math.floor(Math.random() * (max - min) + min);
}

function EMULATOR_get_random_item_from_list(list) { // https://stackoverflow.com/questions/5915096/get-a-random-item-from-a-javascript-array
  debug_helper(arguments, DEBUG);
  return list[EMULATOR_get_random_item_from_number(list.length)];
}
function EMULATOR_get_random_item_from_number(number) {
  debug_helper(arguments, DEBUG);
  return Math.floor(Math.random()*number);
}

const max_number_of_days_ago = 50;
const max_time_ago = Date.now() - 86400 * 1000 * max_number_of_days_ago;
var emulated_time = max_time_ago;

function EMULATOR_get_random_date(random_time_frame, random_time_unit) {
  debug_helper(arguments, DEBUG);
  let time_frame = EMULATOR_get_random_item_from_number(random_time_frame);
  let new_emulated_time = emulated_time + time_frame * random_time_unit;
  emulated_time = new_emulated_time;
  return new_emulated_time;
}

const elements = [];
for (let i in DTU_ELEMENTS_TO_TRACK) {
  const element = DTU_ELEMENTS_TO_TRACK[i];
  if (element.dataset)
    elements.push(element.dataset[DTU_TAG]);
}

const topic_dropdown = document.getElementById('drpd:topic');
const topics = [
    //null,  // null - for 'default' by back-end
  ];
for (let i in topic_dropdown.options) {
  const topic = topic_dropdown.options[i].value;
  topics.push(topic);
}

function EMULATOR_make_report(topic, random_time_unit) {
  debug_helper(arguments, DEBUG);

  let c = {};
  c.ctag = EMULATOR_CTAG;
  c.topic = topic;
  const random_time_frame = 15;
  c.date_time = EMULATOR_get_random_date(random_time_frame, random_time_unit);
  let f = EMULATOR_get_random_item_from_list(elements);
  c.feature = f;
  c.feature_path = ['', f];
  return c;
}

function generate_fake_data() {
  for (let i in topics) {
    const topic = topics[i];
    if (topic == 'auto-generated (heavy)') {
      emulated_time = max_time_ago;
      let t = max_time_ago;
      while (t < Date.now()) {
        let c = EMULATOR_make_report(topic, 1000); // UNITS_NAMES_VALUES.second);
        t = c.date_time;
        CLIENT_SDK_EMULATOR_send_to_telemetry_api(c);
      }
    }
    else if (topic == 'auto-generated (light)') {
      emulated_time = max_time_ago;
      let t = max_time_ago;
      while (t < Date.now()) {
        let c = EMULATOR_make_report(topic, 60000); // UNITS_NAMES_VALUES.minute);
        t = c.date_time;
        CLIENT_SDK_EMULATOR_send_to_telemetry_api(c);
      }
    }
  }
}

generate_fake_data();

// SDK APP FUNCTIONS
//const excluded_events = "mousedown mouseup mousemove mouseover mouseout mousewheel";
//const events = "click focus blur keydown change dblclick keydown keyup keypress textInput touchstart touchmove touchend touchcancel resize scroll zoom select change submit reset".split(" ");

function CLIENT_SDK_EMULATOR_send_to_telemetry_api(report) {
  debug_helper(arguments, DEBUG);
  //console.log(report)
	jr = JSON.stringify(report);
	RX_API_submint_report(jr); // send emulation
}