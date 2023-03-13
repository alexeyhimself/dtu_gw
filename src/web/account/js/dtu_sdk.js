//import("src/web/common/chartjs/chart-4.2.1.js");
//import("src/web/common/chartjs/chartjs-adapter-date-fns-3.0.0.bundle.min.js");

const ctag = "DEMO MVP"; // somehow via session ID mapping in DB, not in request

function ANALYTICS_PORTAL_SDK_get_chart_size(chart_id) {
  debug_helper(arguments, DEBUG);

  const chart = Chart.getChart(chart_id);
  let chart_width_px = chart.canvas.style.width; // Math.floor(chart.chartArea.width); - not work due to constant recalcs, so, base on canvas.style.width
  chart_width_px = chart_width_px.slice(0, chart_width_px.length - 2); // cut 'px'
  return parseInt(chart_width_px);
}

function ANALYTICS_PORTAL_SDK_reset_datetime_filter() {
  debug_helper(arguments, DEBUG);
  ANALYTICS_PORTAL_SDK_set_datetime_filter();
}

function ANALYTICS_PORTAL_SDK_format_date_time_for_filter(date_time) {
  debug_helper(arguments, DEBUG);

  date = new Date(date_time).toLocaleDateString('en-GB').split('/');
  time = new Date(date_time).toLocaleTimeString('en-GB');
  return date[2] + '-' + date[1] + '-' + date[0] + 'T' + time;
}

function ANALYTICS_PORTAL_SDK_set_datetime_filter(timedelta_ms) {
  debug_helper(arguments, DEBUG);

  let datetime_to = "";
  let datetime_from = "";
  if (timedelta_ms) { // if not reset
    const now = new Date();
    const back = now - timedelta_ms;
    datetime_from = ANALYTICS_PORTAL_SDK_format_date_time_for_filter(back);
    datetime_to = ANALYTICS_PORTAL_SDK_format_date_time_for_filter(now);
  }

  const datetime_to_input = document.getElementById('datetime_to');
  const datetime_from_input = document.getElementById('datetime_from');
  datetime_to_input.value = datetime_to;
  datetime_from_input.value = datetime_from;
}

function ANALYTICS_PORTAL_SDK_init_time_shortcut_listeners() {
  debug_helper(arguments, DEBUG);

  const elements_to_track = document.querySelectorAll('.time-shortcut');
  for (let i = 0; i < elements_to_track.length; i++) {
    let el = elements_to_track[i];
    el.addEventListener("click", function(e) {
      ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts();
      this.classList.add('active-filter');
      const timedelta_ms = this.getAttribute('timedelta_ms');
      ANALYTICS_PORTAL_SDK_set_datetime_filter(timedelta_ms);
      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
    }, false);
  }
}

function ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts() {
  const elements_to_track = document.querySelectorAll('.time-shortcut');
  for (let i in elements_to_track) {
    let el = elements_to_track[i];
    if (el.classList)
      el.classList.remove('active-filter')
  }
}

function ANALYTICS_PORTAL_SDK_collect_user_filters_on_the_page() {
  debug_helper(arguments, DEBUG);

  //let topic = window.localStorage.getItem('topic');
  //if (!topic)
    topic = document.getElementById('drpd:topic').value;
  //else
    //document.getElementById('drpd:topic').value = topic;

  let user_filters = {"ctag": ctag, "topic": topic};

  const df = document.getElementById("datetime_from").value;
  if (df != '')
    user_filters["datetime_from"] = Date.parse(df);

  const dt = document.getElementById("datetime_to").value;
  if (dt != '')
    user_filters["datetime_to"] = Date.parse(dt);

  let element_path = document.getElementById("element_path").getAttribute("path");
  user_filters["element_path"] = JSON.parse(element_path);

  const e = document.getElementById("drpd:elements").value;
  if (e != '')
    user_filters["chosen_element"] = e;

  return user_filters;
}

function ANALYTICS_PORTAL_SDK_start() {
  debug_helper(arguments, DEBUG);

  // detect which tab now is opened and update accordingly
  ANALYTICS_PORTAL_SDK_init_calls_over_time_chart_for_('elements_calls_over_time_chart_id');
  ANALYTICS_PORTAL_SDK_init_time_shortcut_listeners();

  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();

  // add listeners
  ANALYTICS_PORTAL_SDK_make_refresh_button_work();
  ANALYTICS_PORTAL_SDK_make_element_dropdown_work();
  ANALYTICS_PORTAL_SDK_make_reset_filters_button_work();
  ANALYTICS_PORTAL_SDK_make_reset_active_time_filters_work();
  ANALYTICS_PORTAL_SDK_make_topic_dropdown_work();
}

function ANALYTICS_PORTAL_SDK_make_element_dropdown_work() {
  debug_helper(arguments, DEBUG);

  let btn = document.getElementById('drpd:elements');
  btn.addEventListener("change", function(e) {
    let p = [''];
    if (this.value != '-- all the marked with "data-dtu" elements on this website --')
      p = ['', this.value];
    document.getElementById('element_path').setAttribute('path', JSON.stringify(p));
    ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
  })
}

function ANALYTICS_PORTAL_SDK_make_topic_dropdown_work() {
  debug_helper(arguments, DEBUG);

  let btn = document.getElementById('drpd:topic');
  btn.addEventListener("change", function(e) {
    ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
  })
}

function ANALYTICS_PORTAL_SDK_make_refresh_button_work() {
  debug_helper(arguments, DEBUG);

  let btn = document.getElementById('btn:refresh_elements_page_data_according_to_filters_setup');
  btn.addEventListener("click", function(e) {
    ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
  })
}

function ANALYTICS_PORTAL_SDK_make_reset_filters_button_work() {
  debug_helper(arguments, DEBUG);

  let btn = document.getElementById('btn:reset_elements_page_filters');
  btn.addEventListener("click", function(e) {
    ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts();
    ANALYTICS_PORTAL_SDK_reset_filters_on_elements_page();
  })
}

function ANALYTICS_PORTAL_SDK_make_reset_active_time_filters_work() {
  debug_helper(arguments, DEBUG);

  const from = document.getElementById('datetime_from');
  from.addEventListener("change", function(e) {
    ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts();
  });

  const to = document.getElementById('datetime_to');
  to.addEventListener("change", function(e) {
    ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts();
  });
}

function ANALYTICS_PORTAL_SDK_init_calls_over_time_chart_for_(chart_id) {
  debug_helper(arguments, DEBUG);
  const config = {
    type: 'line',
    data: {
      datasets: [{
          borderWidth: 1,
          tension: 0.2,
          backgroundColor: '#f6f6b788',
          fill: false
        },
        {
          borderWidth: 2,
          tension: 0.2,
          //borderColor: '#058dc7',
          borderColor: '#0d6efdbb',
          //borderColor: '#777777',
          //backgroundColor: '#e7f4f988',
          backgroundColor: '#f6f6b788',
          fill: '-1',
        },
        {
          borderWidth: 1,
          tension: 0.2,
          //backgroundColor: '#e7f4f999',
          backgroundColor: '#f6f6b788',
          fill: '-1'
        }
      ]
    },
    options: {
      elements: {
        line: {
          fill: false
        },
        point: {
          radius: 0,
        },
      },
      scales: {
        y: {
          //display: false,
          //min: 0,
          //suggestedMin: 2,
          beginAtZero: true, 
          title: {
            display: false,
          },
          ticks: {
            precision: 0,
            stepSize: 1,
          }
        },
        x: {
          type: 'time',
          time: {
            //unit: 'minute',
            displayFormats: {
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
            }
          },
          title: {
            display: false,
            text: "time", 
          },
          ticks: {
            display: true,
            crossAlign: 'far'
            //source: 'data',
            //stepSize: 1,
          }
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      layout: {
        //autoPadding: false,
        //padding: 100
      },
      plugins: {
        legend: {
          display: false,
          position: "right",
          maxWidth: 1000,
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 8,
            usePointStyle: true,
          }
        },
        title: {
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label;
            }
          }
        },
      }
    },
    plugins: [{
      afterDraw: function(chart) { // https://stackoverflow.com/questions/55564508/pie-chart-js-display-a-no-data-held-message
        try {
          if (chart.data.datasets[0].data.length == 0) {
            ANALYTICS_PORTAL_SDK_display_message_on_chart(chart, 'No data to display for current filter condition(s)');
          }
        } 
        catch (error) {
          let message = 'An error occured while trying to draw the chart'
          ANALYTICS_PORTAL_SDK_display_message_on_chart(chart, message);
        }
      },
    }]
  };
  
  if ('elements_calls_over_time_chart_id' == chart_id) {
    config.options.scales.y.title.text = "# of calls for selected element(s) at the same time";
    config.options.plugins.title.text = "Median calls (with max and min bursts) for the selected element in time";
  }
  //config.options.animations = false;

  const chart_element = document.getElementById(chart_id);
  new Chart(chart_element, config);   
}

function ANALYTICS_PORTAL_SDK_display_message_on_chart(chart, message) {
  let ctx = chart.ctx;
  chart.clear();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "14px Arial";
  ctx.fillText(message, chart.width / 2, chart.height / 2);
  ctx.restore();
}

function ANALYTICS_PORTAL_SDK_update_element_path(element) {
  debug_helper(arguments, DEBUG);
  let element_path_element = document.getElementById("element_path");
  let current_element_path = element_path_element.getAttribute("path");
  
  new_element_path = JSON.parse(current_element_path);
  new_element_path.push(element);
  new_element_path = JSON.stringify(new_element_path);
  element_path_element.setAttribute("path", new_element_path);
}

function ANALYTICS_PORTAL_SDK_refresh_calls_over_time_for_chart_id_(chart_id, user_filters, kwargs) {
  debug_helper(arguments, DEBUG); 

  const chart_width_px = ANALYTICS_PORTAL_SDK_get_chart_size(chart_id);
  const reports_match_user_filters_length = kwargs['reports_match_user_filters_length'];
  let config = {};
  if (reports_match_user_filters_length == 0)
    config = {'labels': [], 'data': [], 'unit': 'second', 'step_size': 1}; // no data case
  else
    config = TX_API_get_data_for_chart_(chart_width_px, user_filters, kwargs);          

  let chart = Chart.getChart(chart_id);
  chart.config.data.labels = config.labels;

  chart.config.data.datasets[0].data = config.data[0];
  chart.config.data.datasets[1].data = config.data[1];
  chart.config.data.datasets[2].data = config.data[2];
  chart.config.options.scales.x.time.unit = config.unit;
  chart.config.options.scales.x.ticks.stepSize = config.step_size;
  //console.log("sec in 1 px: ", config.ms_in_pixel / 1000)
  chart.update();

  ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, config);
}

function ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, config) {
  ; // here
}

function ANALYTICS_PORTAL_SDK_reset_filters_on_elements_page() {
  debug_helper(arguments, DEBUG);

  ANALYTICS_PORTAL_SDK_reset_datetime_filter();
  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
}

/*
function ANALYTICS_PORTAL_SDK_refresh_topics(kwargs) {
  debug_helper(arguments, DEBUG);

  const topics = kwargs.topics_match_ctag;
  let topics_html = '';
  for (let i in topics) {
    topics_html += '<option>' + topics[i] + '</option>';
  }
  topics_html += '<option>real usage</option>';
  document.getElementById('drpd:topic').innerHTML = topics_html;
}
*/
function ANALYTICS_PORTAL_SDK_refresh_elements_list(kwargs, user_filters) {
  debug_helper(arguments, DEBUG);

  const chosen_element = user_filters.chosen_element;
  const elements = kwargs.elements_match_ctag_topic;
  let elements_html = '<option>-- all the marked with "data-dtu" elements on this website --</option>';
  for (let i in elements) {
    let element = elements[i];
    if (element == chosen_element)
      elements_html += '<option selected>';
    else 
      elements_html += '<option>';

    elements_html += element + '</option>';
  }
  document.getElementById('drpd:elements').innerHTML = elements_html;
}

function ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup() {
  debug_helper(arguments, DEBUG);

  let user_filters = ANALYTICS_PORTAL_SDK_collect_user_filters_on_the_page();
  let kwargs = TX_API_process_user_filters_request(user_filters);

  // ANALYTICS_PORTAL_SDK_refresh_topics(kwargs);
  ANALYTICS_PORTAL_SDK_refresh_elements_list(kwargs, user_filters);
  // ANALYTICS_PORTAL_SDK_refresh_element_path(user_filters, kwargs);
  ANALYTICS_PORTAL_SDK_refresh_calls_over_time_for_chart_id_('elements_calls_over_time_chart_id', user_filters, kwargs);
}

/*
function ANALYTICS_PORTAL_SDK_refresh_element_path(user_filters, kwargs) {
  debug_helper(arguments, DEBUG);

  const elements = ANALYTICS_PORTAL_SDK_get_elements_in_reports(kwargs);
  let element_path_element = document.getElementById("element_path");
  let element_path = user_filters.element_path;
}
*/

function ANALYTICS_PORTAL_SDK_get_elements_in_reports(kwargs) {
  debug_helper(arguments, DEBUG);

  // TODO: not in reports, but overall.
  let elements = [''];
  const reports_match_user_filters = kwargs['reports_match_user_filters'];
  for (let i in reports_match_user_filters) {
    let r = reports_match_user_filters[i];
    if (!elements.includes(r.element))
      elements.push(r.element);
  }
  return elements;
}

/*
function ANALYTICS_PORTAL_SDK_element_path_click(element) {
  let new_element_path = element.getAttribute("path");
  document.getElementById("element_path").setAttribute("path", new_element_path);
  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
}
*/

ANALYTICS_PORTAL_SDK_start();
