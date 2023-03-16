/*
function TX_API_sum_values_of_dict(obj) { // https://stackoverflow.com/questions/16449295/how-to-sum-the-values-of-a-javascript-object
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
*/

function TX_API_get_sum(list_sorted_by_value_desc) {
  let sum = 0;
  for (let i in list_sorted_by_value_desc)
    sum += list_sorted_by_value_desc[i];

  return sum;
}

function TX_API_get_avg(list_sorted_by_value_desc) {
  let items_number = list_sorted_by_value_desc.length;
  const sum = TX_API_get_sum(list_sorted_by_value_desc);
  return sum / items_number;
}

function TX_API_get_median(list_sorted_by_value_desc) {
  const items_number = list_sorted_by_value_desc.length;
  const middle_item_id = Math.floor(items_number / 2); // floor because arr ids count from 0, not 1
  const middle_item_value = list_sorted_by_value_desc[middle_item_id];
  if (items_number % 2 != 0) // if odd
    return middle_item_value;

  const another_middle_item_id = middle_item_id + 1; // next because was floor
  const another_middle_item_value = list_sorted_by_value_desc[another_middle_item_id];
  return (middle_item_value + another_middle_item_value) / 2;
}

function TX_API_get_mode(list_sorted_by_value_desc) {
  let arr = list_sorted_by_value_desc;
  return arr.sort((a,b) => // https://stackoverflow.com/questions/1053843/get-the-element-with-the-highest-occurrence-in-an-array
      arr.filter(v => v===a).length
    - arr.filter(v => v===b).length
  ).pop();
}

function TX_API_get_range(list_sorted_by_value_desc) {
  const max = TX_API_get_max(list_sorted_by_value_desc);
  const min = TX_API_get_min(list_sorted_by_value_desc);
  return max - min;
}

function TX_API_get_min(list_sorted_by_value_desc) {
  return list_sorted_by_value_desc[list_sorted_by_value_desc.length - 1];
}

function TX_API_get_max(list_sorted_by_value_desc) {
  return list_sorted_by_value_desc[0];
}

function TX_API_get_stats_for_list(list) {
  const list_sorted_by_value_desc = list.sort(function(a, b){return b - a})
  //console.log(list_sorted_by_value_desc)

  const min = TX_API_get_min(list_sorted_by_value_desc);
  const max = TX_API_get_max(list_sorted_by_value_desc);
  const avg = TX_API_get_avg(list_sorted_by_value_desc);
  const median = TX_API_get_median(list_sorted_by_value_desc);
  const mode = TX_API_get_mode(list_sorted_by_value_desc);
  const range = TX_API_get_range(list_sorted_by_value_desc);

  return {'avg': avg, 'median': median, 'mode': mode, 'range': range, 'min': min, 'max': max};
}

function TX_API_process_user_filters_request(user_filters) {
  let kwargs = {};

  const reports_match_user_filters  = DB_SELECT_all_WHERE_user_filters(user_filters);
  kwargs['reports_match_user_filters'] = reports_match_user_filters;
  kwargs['reports_match_user_filters_length'] = reports_match_user_filters.length;

  const topics_and_elements  = DB_SELECT_DISTINCT_topics_AND_elements_WHERE_ctag_topic(user_filters);
  kwargs['elements_match_ctag_topic'] = topics_and_elements.elements;
  kwargs['topics_match_ctag'] = topics_and_elements.topics;

  //console.log(kwargs)
  return kwargs;
}

const TX_API_arrays_are_equal = (a, b) => // https://www.freecodecamp.org/news/how-to-compare-arrays-in-javascript/
  a.length === b.length && a.every((element, index) => element === b[index]);

function TX_API_get_dates_from_to(user_filters, kwargs) {
  const reports_match_user_filters_length = kwargs['reports_match_user_filters_length'];
  let datetime_from = user_filters['datetime_from'];
  let datetime_to = user_filters['datetime_to'];
  if (!datetime_to)
    datetime_to = Date.now(); // if not set then till now

  if (reports_match_user_filters_length == 0) {
    if (!datetime_from)
      datetime_from = Date.now();

    let time_range = datetime_to - datetime_from;
    return {'datetime_from': datetime_from, 'datetime_to': datetime_to, 'time_range': time_range};
  }

  const reports_match_user_filters = kwargs['reports_match_user_filters'];
  if (!datetime_from)
    datetime_from = reports_match_user_filters[0].date_time; // if not set then from first date in all related reports

  let time_range = datetime_to - datetime_from;
  return {'datetime_from': datetime_from, 'datetime_to': datetime_to, 'time_range': time_range};
}

function TX_API_get_ms_in_1_px(chart_width_px, displayed_time_range) {
  return Math.floor(displayed_time_range / chart_width_px); // how many milliseconds in 1 px
}

const CHART_SIZE = {'xs': 500, 's': 800, 'm': 1000, 'l': 1200}; // https://getbootstrap.com/docs/4.1/layout/grid/
const UNITS_NAMES = [ // https://www.chartjs.org/docs/latest/axes/cartesian/time.html#time-units
  'second',
  'minute',
  'hour',
  'day',
  //'week', // don't want weeks
  'month',
  //'quarter', // don't want quarters
  'year'
];
const UNITS_NAMES_VALUES = {
  'second': 10**3,
  'minute': 60 * 10**3,
  'hour': 60 * 60 * 10**3,
  'day': 24 * 60 * 60 * 10**3,
  // 'week': 7 * 24 * 60 * 60 * 10**3, // don't want weeks
  'month': 30 * 24 * 60 * 60 * 10**3,
  // 'quarter': 3 * 30 * 24 * 60 * 60 * 10**3, // don't want quarters
  'year': 365 * 24 * 60 * 60 * 10**3
};

function TX_API_get_display_unit_and_step(displayed_time_range, chart_width_px) {
  
  // CHART_SIZE.l and higher
  let min_pixels_for_tick = 100;
  let max_pixels_for_tick = 200;

  if (chart_width_px <= CHART_SIZE.xs) {
    min_pixels_for_tick = 50;
    max_pixels_for_tick = 150;
  }
  else if (chart_width_px <= CHART_SIZE.s) {
    min_pixels_for_tick = 80;
    max_pixels_for_tick = 160;
  }
  else if (chart_width_px <= CHART_SIZE.m) {
    min_pixels_for_tick = 90;
    max_pixels_for_tick = 180;
  }
  
  // has to be sorted - that's why list, but not dict
  const units_names = [...UNITS_NAMES].reverse(); // to go from largest to lowest to detect first > 0
  const units_values = [];
  for (let i in units_names) {
    let unit = units_names[i];
    units_values.push(UNITS_NAMES_VALUES[unit]);
  } // due to reverse of units_names this appears reverse automatically

  if (0 == displayed_time_range) { // artificial case of 0 seconds
    return {'unit': 'second', 'step_size': 1};
  }

  preferred_steps_for_units = {
    'year': [1, 2, 5, 10], 
    'month': [1, 2, 3, 6, 12], 
    'day': [1, 2, 3, 7, 10], 
    'hour': [1, 2, 3, 6, 12, 24], 
    'minute': [1, 2, 3, 5, 10, 12, 15, 20, 30, 60], 
    'second': [1, 2, 3, 5, 10, 12, 15, 20, 30, 60]
  };
  let min_steps = Math.floor(chart_width_px / max_pixels_for_tick);
  let max_steps = Math.floor(chart_width_px / min_pixels_for_tick);
  //console.log(min_steps, max_steps)

  let unit = 'second';
  let step_size = 1;

  for (let i in units_values) {
    let em = displayed_time_range / units_values[i]; // how many each of them in this time range
    let em_min = Math.floor(em / max_steps); // how many items in one step for min steps case
    let em_max = Math.floor(em / min_steps); // how many items in one step for max steps case

    //console.log(units_names[i], em, em_min, em_max);
  }
  for (let i in units_values) {
    let em = displayed_time_range / units_values[i]; // how many each of them in this time range
    let em_min = Math.floor(em / max_steps); // how many items in one step for min steps case
    let em_max = Math.floor(em / min_steps); // how many items in one step for max steps case

    if (em_min + 1 > 0 && em_max > 0) {
      unit = units_names[i];
      let preferred_steps_for_this_unit = preferred_steps_for_units[unit];
      for (let j in preferred_steps_for_this_unit) {
        let candidate = preferred_steps_for_this_unit[j];
        if (candidate >= em_min && candidate <= em_max) {
            if (em / candidate <= max_steps && em / candidate >= min_steps) {
              step_size = candidate;
              break;
            }
        }
        step_size = em_min;
      }
      break;
    }
  }

  //console.log(chart_width_px, unit, step_size);        
  return {'unit': unit, 'step_size': step_size};
}

function TX_API_prepare_time_windows_agregations(chart_width_px, user_filters, kwargs) {
  let dates = TX_API_get_dates_from_to(user_filters, kwargs)
  let ms_in_1_px = TX_API_get_ms_in_1_px(chart_width_px, dates.time_range);

  let agregation_result = [];
  if (ms_in_1_px > 0) {
    if (dates.datetime_from != dates.datetime_to) {
      for (let t = dates.datetime_to - ms_in_1_px; // from "datetime_to -" to make most recent window always available
               t >= dates.datetime_from + ms_in_1_px * 1; // till "datetime_from +" - to not to include oldest partial frame data
               t -= ms_in_1_px) {
        agregation_result.push(t);
      }
    }
    else
      agregation_result.push(dates.datetime_from);
  }

  //console.log(new Date(dates.datetime_from))
  //console.log(new Date(dates.datetime_to))
  //console.log(dates.time_range, ms_in_1_px)

  return {'agregation_result': agregation_result.reverse(), 
          'displayed_time_range': dates.time_range, 
          'datetime_from': dates.datetime_from, 
          'datetime_to': dates.datetime_to, 
          'ms_in_1_px': ms_in_1_px};
}

function TX_API_get_reports_with_elements_path_match(user_filters, kwargs) {
  let reports_with_matched_element_paths = [];

  const element_path_user_filters = user_filters['element_path'];
  const element_path_user_filters_length = element_path_user_filters.length;
  const reports_match_user_filters = kwargs['reports_match_user_filters'];
  const reports_match_user_filters_length = kwargs['reports_match_user_filters_length'];

  for (let i = 0; i < reports_match_user_filters_length; i++) {
    let report = reports_match_user_filters[i];
    let reports_match = true;
    if (!(element_path_user_filters_length == 1 && element_path_user_filters[0] == '')) { // if not [""]
      for (let j = 0; j < element_path_user_filters_length; j++) {
        if (report.element_path[j] != element_path_user_filters[j]) {
          reports_match = false;
          break;
        }
      }
    }

    if (reports_match)
      reports_with_matched_element_paths.push(report);
  }
  return reports_with_matched_element_paths;
}

function TX_API_get_optimal_time_step_for_agregations(chart_width_px, ms_in_1_px) {
  let step = 10;

  const AGREGATION_TRESHOLDS = {
    'xs': UNITS_NAMES_VALUES.second * 25,
    's':  UNITS_NAMES_VALUES.minute * 10,
    'm':  UNITS_NAMES_VALUES.minute * 25,
    'l':  UNITS_NAMES_VALUES.day * 1,
  };

  if (chart_width_px <= CHART_SIZE.xs) {
    console.log("CHART_SIZE.xs")
    if (ms_in_1_px <= AGREGATION_TRESHOLDS.xs)
      step = 7;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.s)
      step = 7;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.m)
      step = 7;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.l)
      step = 10;
  }
  else if (chart_width_px <= CHART_SIZE.s) {
    console.log("CHART_SIZE.s")
    step = 1;
  }
  else if (chart_width_px <= CHART_SIZE.m) {
    console.log("CHART_SIZE.m")
    if (ms_in_1_px <= AGREGATION_TRESHOLDS.xs)
      step = 1;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.s)
      step = 4;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.m)
      step = 5;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.l)
      step = 7;
  }
  else if (chart_width_px <= CHART_SIZE.l) {
    console.log("CHART_SIZE.l")
    step = 1;
  }
  else {
    console.log("else")
    if (ms_in_1_px <= AGREGATION_TRESHOLDS.xs)
      step = 7;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.s)
      step = 10;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.m)
      step = 10;
    else if (ms_in_1_px <= AGREGATION_TRESHOLDS.l)
      step = 10;
  }
  
  for (key in UNITS_NAMES_VALUES) {
    console.log(key, ms_in_1_px / UNITS_NAMES_VALUES[key]);
  }
  console.log('chart_width_px:', chart_width_px, 'ms_in_1_px:', ms_in_1_px, 'step:', step, AGREGATION_TRESHOLDS);
  return step;
}

function TX_API_get_data_for_chart_(chart_width_px, user_filters, kwargs) {
  const reports_with_elements_path_match = TX_API_get_reports_with_elements_path_match(user_filters, kwargs)
  let agregations = TX_API_prepare_time_windows_agregations(chart_width_px, user_filters, kwargs);
  let agregation_result = agregations.agregation_result;

  let stats = [];
  let position_in_reports = 0; // to continue from this, not from the beginning again
  for (let i in agregation_result) {
    stats.push(0); // create next step
    let date = agregation_result[i];
    for (let j = position_in_reports; j < reports_with_elements_path_match.length; j++) {
      let r = reports_with_elements_path_match[j];
      if (r.date_time <= date) { // this report is in this time frame, so collect it
        stats[i] += 1;
        position_in_reports += 1;
      }
      else {
        break; // this report from next frame, so go for next time frame
      }
    }
  }

  let zeros = 0;
  let non_zeros = 0;
  for (let i in stats) {
    let item = stats[i];
    if (item == 0)
      zeros++
    else
      non_zeros++
  }
  //console.log('>> ', zeros, non_zeros, chart_width_px / non_zeros)
  let step = 1;
  if (chart_width_px / non_zeros < 32)
    step = TX_API_get_optimal_time_step_for_agregations(chart_width_px, agregations.ms_in_1_px);

  let aggr_dates = [];
  let mins = [];
  let maxes = [];
  let medians = [];
  for (let i = 0; i < stats.length / step; i++) {
    let pack = stats.slice(i * step, i * step + step);
    const pack_stats = TX_API_get_stats_for_list(pack);

    mins.push(pack_stats.min);
    maxes.push(pack_stats.max);
    medians.push(pack_stats.median);
    aggr_dates.push(agregation_result[i * step]);
  }

  //console.table(TX_API_get_stats_for_list(stats))

  let labels = [];
  let data = {};
  for (let i in aggr_dates) {
    labels.push(parseInt(aggr_dates[i]));
  }
  data['mins'] = mins;
  data['medians'] = medians;
  data['maxes'] = maxes;

  let displayed_time_range = agregations.displayed_time_range;
  let display_unit_and_step = TX_API_get_display_unit_and_step(displayed_time_range, chart_width_px);

  console.log('prettify me')
  // 8 hours
  let aggr;
  let aggr_unit;
  const aggregation_ms = Math.floor(agregations.ms_in_1_px * display_unit_and_step.step_size);
  const em = [...UNITS_NAMES].reverse();
  for (key in em) {
    let v = Math.round(aggregation_ms * 10 / UNITS_NAMES_VALUES[em[key]]) / 10; // https://stackoverflow.com/questions/7342957/how-do-you-round-to-1-decimal-place-in-javascript
    if (v >= 1) {
      aggr = v;
      aggr_unit = em[key];
      break;
    }
  }

  if (aggr > 1)
    aggr_unit += 's';

  console.log('and me')
  // min, medium, max
  let min;
  let median;
  let max;
  if (mins) {
    min = [...mins].sort(function(a, b){return a - b})[0];
    median = TX_API_get_median([...medians].sort(function(a, b){return b - a}));
    max = [...maxes].sort(function(a, b){return b - a})[0];
  }

  return Object.assign({}, {'labels': labels, 'data': data, 'ms_in_pixel': agregations.ms_in_1_px, 'min': min, 'median': median, 'max': max, 'aggr': aggr, 'aggr_unit': aggr_unit}, display_unit_and_step);
}