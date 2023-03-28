//import("src/web/common/chartjs/chart-4.2.1.js");
//import("src/web/common/chartjs/chartjs-adapter-date-fns-3.0.0.bundle.min.js");

// to adjuste phrase "all the marked with "data-dtu" elements on <better_phrase> website"
//let better_phrase = ''; //'this resource';
//if (window.location.hostname == 'dotheyuse.com')
//  better_phrase = ' on this web site';
const drpd_elements_all = '-- all the monitored elements --';// + better_phrase + ' --';

const ctag = "DEMO MVP"; // somehow via session ID mapping in DB, not in request

function ANALYTICS_PORTAL_SDK_get_chart_size(chart_id) {
  const chart = Chart.getChart(chart_id);
  let chart_width_px = chart.canvas.style.width; // Math.floor(chart.chartArea.width); - not work due to constant recalcs, so, base on canvas.style.width
  chart_width_px = chart_width_px.slice(0, chart_width_px.length - 2); // cut 'px'
  return parseInt(chart_width_px);
}

function ANALYTICS_PORTAL_SDK_reset_datetime_filter() {
  ANALYTICS_PORTAL_SDK_set_datetime_filter();
}

function ANALYTICS_PORTAL_SDK_format_date_time_for_filter(date_time) {
  date = new Date(date_time).toLocaleDateString('en-GB').split('/');
  time = new Date(date_time).toLocaleTimeString('en-GB');
  return date[2] + '-' + date[1] + '-' + date[0] + 'T' + time;
}

function ANALYTICS_PORTAL_SDK_set_datetime_filter(timedelta_ms) {
  let datetime_to = "";
  let datetime_from = "";
  if (timedelta_ms != 0) { // if not reset
    console.log(timedelta_ms)
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

  //const element_path_element = document.getElementById("element_path");
  //let element_path = JSON.parse(element_path_element.getAttribute("path"));
  //user_filters["element_path"] = element_path;

  const element_path_element = document.getElementById("element_path2");
  let children = element_path_element.children;
  let in_page_path = [''];
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    if (child.type == 'select-one' && child.value && !child.value.startsWith('-- any '))
      in_page_path.push(child.value);
    if (child.hasAttribute("changed")) {
      break;
    }
  }
  user_filters["element_path"] = in_page_path;

  const path = ['url_domain_name', 'url_path', 'element'];
  for (let i in path) {
    let el = path[i];
    let e = document.getElementById("drpd:" + el).value;
    if (e != '')
      user_filters[el] = e;
  }

  //console.log(user_filters)
  return user_filters;
}

function ANALYTICS_PORTAL_SDK_start() {
  // detect which tab now is opened and update accordingly
  ANALYTICS_PORTAL_SDK_init_calls_over_time_chart_for_('elements_calls_over_time_chart_id');
  ANALYTICS_PORTAL_SDK_init_time_shortcut_listeners();

  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();

  // add listeners
  ANALYTICS_PORTAL_SDK_make_dropdowns_work();
  // ANALYTICS_PORTAL_SDK_make_element_dropdown_work();
  // ANALYTICS_PORTAL_SDK_make_reset_filters_button_work();
}

function ANALYTICS_PORTAL_SDK_make_element_path(element) {
  let p = [''];
  if (element.value != drpd_elements_all)
    p = ['', element.value];
  //document.getElementById('element_path').setAttribute('path', JSON.stringify(p));
}

function ANALYTICS_PORTAL_SDK_make_dropdowns_work() {
  const elements_ids = ['drpd:topic', 'drpd:url_domain_name', 'drpd:url_path', 'drpd:element'];
  for (let i in elements_ids) {
    let element_id = elements_ids[i];
    let element = document.getElementById(element_id);
    element.addEventListener("change", function(e) {
      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
    });
  }
}

function ANALYTICS_PORTAL_SDK_make_element_dropdown_work() {
  let elements = document.getElementsByClassName("element_path");
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.addEventListener("change", function(e) {
      element.setAttribute("changed", "true");
      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
    });
  }
}

function ANALYTICS_PORTAL_SDK_init_calls_over_time_chart_for_(chart_id) {
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
            //stepSize: 1,
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
          display: false,
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

function ANALYTICS_PORTAL_SDK_refresh_calls_over_time_for_chart_id_(chart_id, user_filters, kwargs) { 

  const chart_width_px = ANALYTICS_PORTAL_SDK_get_chart_size(chart_id);
  const reports_match_user_filters_length = kwargs['reports_match_user_filters_length'];
  let config = {};
  if (reports_match_user_filters_length == 0)
    config = {'labels': [], 'data': [], 'unit': 'second', 'step_size': 1}; // no data case
  else
    config = TX_API_get_data_for_chart_(chart_width_px, user_filters, kwargs);          

  let chart = Chart.getChart(chart_id);
  chart.config.data.labels = config.labels;

  chart.config.data.datasets[0].data = config.data.mins;
  chart.config.data.datasets[1].data = config.data.medians;
  chart.config.data.datasets[2].data = config.data.maxes;
  chart.config.options.scales.x.time.unit = config.unit;
  chart.config.options.scales.x.ticks.stepSize = config.step_size;
  chart.update();

  ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, config.aggr, config.aggr_unit, config.min, config.max, config.median);
}

function ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, aggr, aggr_unit, min, max, median) {
  const em = {'min': min, 'median': median, 'max': max, 'aggregation interval': aggr + ' ' + aggr_unit};
  for (let i in em) {
    let el = document.getElementById(i);
    if (em[i] != undefined && em[i] != 'undefined undefined')
      el.innerText = em[i];
    else
      el.innerText = '-';
  }
}

function ANALYTICS_PORTAL_SDK_reset_filters_on_elements_page() {
  ANALYTICS_PORTAL_SDK_reset_datetime_filter();
  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
}

function ANALYTICS_PORTAL_SDK_draw_dropdown_options(element_id, options, selected_option) {
  //console.log(element_id)
  let html = '';
  if (element_id == 'drpd:element')
    html += '<option>' + drpd_elements_all + '</option>';
  else if (element_id == 'drpd:url_domain_name')
    html += '<option>-- any domain --</option>';
  else if (element_id == 'drpd:url_path')
    html += '<option>-- any page --</option>';
  else
    html += '<option>-- any element --</option>';

  for (let i in options) {
    let option = options[i];
    html += '<option';
    if (option == selected_option)
      html += ' selected';
    html += '>' + option + '</option>';
  }
  const drpd_element = document.getElementById(element_id);
  drpd_element.innerHTML = html;

  if (options.length <= 1 && element_id != 'drpd:element' && element_id != 'drpd:element0' && element_id != 'drpd:element1' && element_id != 'drpd:element2' && element_id != 'drpd:element3')
    drpd_element.parentElement.style.display = 'none';
  else
    drpd_element.parentElement.style.display = 'unset';
}

function ANALYTICS_PORTAL_SDK_refresh_topics(kwargs) {
  const topics = kwargs.topics_match_ctag;
  const currently_selected = kwargs.current_topic;

  ANALYTICS_PORTAL_SDK_draw_dropdown_options('drpd:topic', topics, currently_selected);
}

function ANALYTICS_PORTAL_SDK_draw_elements_hierarchy(kwargs) {
  const elements_hierarchy = kwargs['elements_hierarchy'];
  const element_path = kwargs['element_path'];
  let parent = document.getElementById('element_path2');
  console.log(elements_hierarchy)
  let html = '';
  for (let i = 0; i < elements_hierarchy.length; i++) {
    let id = 'drpd:element' + String(i);
    let filter_elements = elements_hierarchy[i].elements;
    if (filter_elements.length > 0) {
      html += '<select id="' + id + '" class="form-control form-select element_path margin-bottom-5" data-dtu="page element(s)"></select>';
    }
  }
  parent.innerHTML = html;
console.log(kwargs)
  for (let i = 0; i < elements_hierarchy.length; i++) {
    let id = 'drpd:element' + String(i);
    let path = elements_hierarchy[i].path;
    let filter_elements = elements_hierarchy[i].elements;
    if (filter_elements.length > 0) {
      ANALYTICS_PORTAL_SDK_draw_dropdown_options(id, filter_elements, element_path[i+1]);
    }
  }
}

function ANALYTICS_PORTAL_SDK_refresh_domain_urls(kwargs) {
  const domains = kwargs.url_domains_match_ctag_topic;
  const currently_selected = kwargs.current_domain;
  //console.log(domains)
  ANALYTICS_PORTAL_SDK_draw_dropdown_options('drpd:url_domain_name', domains, currently_selected)
}

function ANALYTICS_PORTAL_SDK_refresh_url_paths(kwargs) {
  const paths = kwargs.url_paths_match_url_domain;
  const currently_selected = kwargs.current_page;

  ANALYTICS_PORTAL_SDK_draw_dropdown_options('drpd:url_path', paths, currently_selected)
}

function ANALYTICS_PORTAL_SDK_refresh_elements_list(kwargs, user_filters) {
  const elements = kwargs.elements_match_ctag_topic;
  const currently_selected = user_filters.element;

  ANALYTICS_PORTAL_SDK_draw_dropdown_options('drpd:element', elements, currently_selected);
}

function ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup() {
  let user_filters = ANALYTICS_PORTAL_SDK_collect_user_filters_on_the_page();
  let kwargs = TX_API_process_user_filters_request(user_filters);

  //console.log(user_filters)
  //console.log(kwargs.elements_hierarchy)

  ANALYTICS_PORTAL_SDK_draw_elements_hierarchy(kwargs);
  ANALYTICS_PORTAL_SDK_make_element_dropdown_work();

  ANALYTICS_PORTAL_SDK_refresh_topics(kwargs);
  ANALYTICS_PORTAL_SDK_refresh_domain_urls(kwargs);
  ANALYTICS_PORTAL_SDK_draw_elements_hierarchy(kwargs);
  ANALYTICS_PORTAL_SDK_refresh_url_paths(kwargs);
  ANALYTICS_PORTAL_SDK_refresh_elements_list(kwargs, user_filters);

  ANALYTICS_PORTAL_SDK_refresh_calls_over_time_for_chart_id_('elements_calls_over_time_chart_id', user_filters, kwargs);
}

function ANALYTICS_PORTAL_SDK_get_elements_in_reports(kwargs) {
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

ANALYTICS_PORTAL_SDK_start();
