function EMULATOR_get_random_int_between(min, max) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
  return Math.floor(Math.random() * (max - min) + min);
}

function make_new_list(repeats_list) {
  let new_list = [];
  for (let i = 0; i < repeats_list.length; i++) {
    let number_of_repeats = repeats_list[i];
    for (let j = 0; j < number_of_repeats; j++)
      new_list.push(i);
  }
  return new_list;
}

function make_normal_distribution(list_length) {
  let mean_i = Math.floor(list_length / 2); // works both for odd and even, floor because id's are from 0
  let standard_deviation = 4//Math.floor(list.length / 3);

  let repeats_list = [];
  //let debug = [];
  for (let i = 0; i < list_length; i++) {
    let number_of_repeats = (2000 * Math.exp(-0.5 * Math.pow((i - mean_i) / standard_deviation, 2))) / (standard_deviation * Math.pow(2 * Math.PI, 0.5));
    //debug.push(number_of_repeats);
    repeats_list.push(Math.floor(number_of_repeats));
  }
  const normal_list = make_new_list(repeats_list); // repeats_list.length == list_length, so no need to pass list_length
  return normal_list;
}

function make_linear_distribution(list_length) {
  let repeats_list = [];
  for (let i = 0; i < list_length; i++) {
    let new_number_of_i = parseInt(i) + 1;
    repeats_list.push(new_number_of_i);
  }
  const linear_list = make_new_list(repeats_list); // repeats_list.length == list_length, so no need to pass list_length
  return linear_list;
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

function EMULATOR_make_report(topic, random_time_unit, element, uid) {
  let event = SUPPORTED_INPUT_TYPES_AND_EVENTS[element.type][0];
  let r = dtu.process_element_event(element, event);
  dtu.make_report(r)
  dtu.report.topic = topic;
  dtu.report.uid = uid;
  const random_time_frame = 15;
  dtu.report.date_time = EMULATOR_get_random_date(random_time_frame, random_time_unit);
  return dtu.report;
}

function generate_fake_data() {
  // sort with random within a list because elements_to_listen_to go as in the page 
  // and if normal distribution then middle page elements will get the most usage all the time
  // but we want random elements got more and less
  const list_of_elements = [...dtu.elements_to_listen_to].sort(() => Math.random() - 0.5);
  const normal_list_of_elements_ids = make_normal_distribution(list_of_elements.length);

  const base_uid = parseInt(dtu.get_uid());
  const uids_step = -111;
  const number_of_uids = 42;
  const list_of_uids = [];
  for (let i = 0; i < number_of_uids; i++)
    list_of_uids.push(base_uid + uids_step * i);
  const linear_list_of_uid_ids = make_linear_distribution(list_of_uids.length);

  for (let i in topics) {
    const topic = topics[i];
    if (topic == 'auto-generated (heavy)')
      random_time_unit = 1000; // UNITS_NAMES_VALUES.second;
    else if (topic == 'auto-generated (lite)')
      random_time_unit = 60000; // UNITS_NAMES_VALUES.minute;

    emulated_time = max_time_ago;
    let t = max_time_ago;
    while (t < Date.now()) {
      const element_id = EMULATOR_get_random_item_from_list(normal_list_of_elements_ids);
      const element = list_of_elements[element_id];
      const uid_id = EMULATOR_get_random_item_from_list(linear_list_of_uid_ids);
      const uid = list_of_uids[uid_id];
      const c = EMULATOR_make_report(topic, random_time_unit, element, uid);
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