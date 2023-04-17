//import("src/web/common/chartjs/chart-4.2.1.js");
//import("src/web/common/chartjs/chartjs-adapter-date-fns-3.0.0.bundle.min.js");

// to adjuste phrase "all the marked with "data-dtu" elements on <better_phrase> website"
//let better_phrase = ''; //'this resource';
//if (window.location.hostname == 'dotheyuse.com')
//  better_phrase = ' on this web site';
const drpd_elements_all = '-- all the monitored elements --';// + better_phrase + ' --';

const ctag = "DEMO MVP"; // somehow via session ID mapping in DB, not in request

function ANALYTICS_PORTAL_SDK_init_time_shortcut_listeners() {
  const elements_to_track = document.querySelectorAll('.time-shortcut');
  for (let i = 0; i < elements_to_track.length; i++) {
    let el = elements_to_track[i];
    el.addEventListener("click", function(e) {
      ANALYTICS_PORTAL_SDK_remove_all_active_filter_class_from_time_shortcuts();
      this.classList.add('active-filter');
      const timedelta_ms = this.getAttribute('timedelta_ms');
      document.getElementById('timedelta_ms').setAttribute('timedelta_ms', timedelta_ms);
      //ANALYTICS_PORTAL_SDK_set_datetime_filter(timedelta_ms);
      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup_with_delay();
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
  let topic = window.localStorage.getItem('topic');
  const topic_element = document.getElementById('drpd:topic');
  if (!topic)
    topic = topic_element.value;
  else
    topic_element.value = topic;

  let user_filters = {"ctag": ctag, "topic": topic};

  const timedelta_element = document.getElementById('timedelta_ms');
  const timedelta_ms = timedelta_element.getAttribute('timedelta_ms');
  //user_filters['timedelta_ms'] = timedelta_ms;

  const datetime_to = Date.parse(new Date());
  const datetime_from = datetime_to - timedelta_ms;
  user_filters["datetime_from"] = datetime_from;
  user_filters["datetime_to"] = datetime_to;

  let in_page_path = [''];
  user_filters["element_path"] = in_page_path;

  if (topic_element.hasAttribute('changed'))
    return user_filters;

  const path = ['url_domain_name', 'url_path'];
  for (let i in path) {
    let drpd_path_suffix = path[i];
    let element = document.getElementById("drpd:" + drpd_path_suffix);
    if (element.value != '')
      user_filters[drpd_path_suffix] = element.value;
    if (element.hasAttribute("changed")) {
      return user_filters; // high level change, no need to collect other
    }
  }

  const element_path_element = document.getElementById("drpd:element");
  if (element_path_element) {
    //console.log(element_path_element.value)
    in_page_path = JSON.parse(element_path_element.value.replace(/'/g, '"'));
  }
  user_filters["element_path"] = in_page_path;

  //console.log(user_filters)
  return user_filters;
}

function ANALYTICS_PORTAL_SDK_start() {
  // detect which tab now is opened and update accordingly
  //ANALYTICS_PORTAL_SDK_init_calls_over_time_chart_for_('elements_calls_over_time_chart_id');
  ANALYTICS_PORTAL_SDK_init_time_shortcut_listeners();

  ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
  
  // add listeners
  ANALYTICS_PORTAL_SDK_make_dropdowns_work();
  // ANALYTICS_PORTAL_SDK_make_element_dropdown_work();
  // ANALYTICS_PORTAL_SDK_make_reset_filters_button_work();
}

function ANALYTICS_PORTAL_SDK_make_dropdowns_work() {
  const elements_ids = ['drpd:topic', 'drpd:url_domain_name', 'drpd:url_path'];
  for (let i in elements_ids) {
    let element_id = elements_ids[i];
    let element = document.getElementById(element_id);
    element.addEventListener("change", function(e) {
      element.setAttribute("changed", "true");
      if (element_id == 'drpd:topic')
        window.localStorage.setItem('topic', element.value);

      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup_with_delay();
      element.removeAttribute("changed");
    });
  }
}

function ANALYTICS_PORTAL_SDK_make_element_dropdown_work() {
  let elements = document.getElementsByClassName("element_path");
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    element.addEventListener("change", function(e) {
      element.setAttribute("changed", "true");
      ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup_with_delay();
      element.removeAttribute("changed");
    });
  }
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
  // https://gist.github.com/jeantimex/68e456aa4a536b245997b28330adace2
  // Step 1. Define the dimensions.
  const element_id_for_linear_chart = 'linear_chart';
  const element_with_linear_chart = document.getElementById(element_id_for_linear_chart);
  element_with_linear_chart.innerHTML = '';

  const width = element_with_linear_chart.offsetWidth;
  const height = element_with_linear_chart.offsetHeight || 300;
  const margin = {top: 10, right: 10, bottom: 30, left: 30};
  

  const chart_width_px = width - margin.left - margin.right; // ANALYTICS_PORTAL_SDK_get_chart_size(chart_id);
  const reports_match_user_filters_length = kwargs['reports_match_user_filters_length'];
  let config = {};
  if (reports_match_user_filters_length == 0)
    config = {'labels': [], 'data': [], 'unit': 'second', 'step_size': 1}; // no data case
  else
    config = TX_API_get_data_for_chart_(chart_width_px, user_filters, kwargs);          


  // Step 2. Prepare the data.
  data = [];
  for (let i in config.data.medians) {
    let value = config.data.medians[i];
    let date = config.labels[i];
    data.push({"date": date, "value": value})
  }

  // Step 3. Create x and y axes.
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.value * 1.05)]).nice() // 5% more than max value
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) => g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale)
            .ticks(width / 100) // tick per 100 pixels
      );

  const yAxis = (g) => g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale)
            .ticks(height / 50) // tick per 50 pixels
      );

  // 4. Create the grid line functions.
  const xGrid = (g) => g
    .attr('class', 'grid-lines')
    .selectAll('line')
    .data(xScale.ticks())
    .join('line')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom);

  const yGrid = (g) => g
    .attr('class', 'grid-lines')
    .selectAll('line')
    .data(yScale.ticks())
    .join('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d));

  // Step 4. Define the line function.
  const line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => xScale(d.date))
    .y(d => yScale(d.value));

  // Step 5. Draw the SVG.
    // First let's create an empty SVG.
  const svg = d3.select('#' + element_id_for_linear_chart)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

    // Draw the x and y axes.
  svg.append('g').call(xAxis)
  svg.append('g').call(yAxis)

  svg.append('g').call(xGrid);
  svg.append('g').call(yGrid);

    // Draw the line.
  svg.append('path')
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#0d6efdbb")
    .attr("stroke-width", 2)
    .attr('d', line);


  ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, config.aggr, config.aggr_unit, config.min, config.max, config.median);
}

function ANALYTICS_PORTAL_SDK_refresh_stats_for_chart_id_(chart_id, aggr, aggr_unit, min, max, median) {
  const em = {'min': min, 'median': median, 'max': max, 'aggregation interval': aggr + ' ' + aggr_unit};
  for (let i in em) {
    let el = document.getElementById(i);
    if (em[i] != undefined && em[i] != 'undefined undefined') // yes, 2 times undefined
      el.innerText = em[i];
    else
      el.innerText = '-';
  }
}

function ANALYTICS_PORTAL_SDK_draw_dropdown_options(element_id, options, selected_option, types, labels) {
  //console.log(element_id)
  let html = '';
  if (element_id == 'drpd:topic')
    ;
  else if (element_id == 'drpd:url_domain_name')
    html += '<option value="">-- any domain --</option>';
  else if (element_id == 'drpd:url_path')
    html += '<option value="">-- any page --</option>';
  else
    html += '<option value="[\'\']">-- any element --</option>';

  let em = {};
  let new_options = [];
  for (let i in options) {
    let option = options[i];
    let new_option = option;
    if (types) {
      let type = types[i];
      if (type == 'anchor') type = 'link';
      if (type == 'select-one') type = 'dropdown';
      if (type != 'has children' && type !== undefined)
        new_option = option + ' (' + type + ')';
      else if (type === undefined)
        new_option = option;
      else
        new_option = ' ' + option + ' ...';
    }
    em[new_option] = option;
    new_options.push(new_option);
  }

  for (let i in new_options) {
    let new_option = new_options[i];
    let option = em[new_option];
    html += '<option value="' + option + '"';
    if (option == selected_option)
      html += ' selected';
    html += '>';
    if (labels)
      html += labels[i];
    else
      html += new_option;
    html += '</option>';
  }
  
  const drpd_element = document.getElementById(element_id);
  drpd_element.innerHTML = html;

  //if (options.length <= 1 && element_id != 'drpd:element')
  if (options.length < 1 && element_id == 'drpd:element')
    drpd_element.parentElement.style.display = 'none';
  else if (options.length <= 1 && element_id != 'drpd:element')
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
  let parent = document.getElementById('element_path');
  let html = '<label for="drpd:element" class="form-label no-margin-bottom custom-label">Page element:</label>';
  let id = 'drpd:element';
  html += '<select id="' + id + '" class="form-control form-select element_path margin-bottom-5" data-dtu="Page element"></select>';
  parent.innerHTML = html;

  let options = [];
  let types = [];
  let paths = [];
  for (let i = 1; i < elements_hierarchy.length; i++) {
    let element_path = elements_hierarchy[i];
    let offset = element_path.offset;
    let option = element_path.element;
    let type = element_path.type;
    if (type == 'anchor') type = 'link';
    if (type == 'select-one') type = 'dropdown';  
    let counter = element_path.number_of_calls;
    let path = element_path.element_path_string;
    options.push(offset + option + ' (' + type + ')');
    types.push(type);
    paths.push(path.replace(/"/g, "'"));
  }
  let selected_option = JSON.stringify(element_path).replace(/"/g, "'");
  ANALYTICS_PORTAL_SDK_draw_dropdown_options(id, paths, selected_option, types, options);
}

function ANALYTICS_PORTAL_SDK_get_datatable(table_id) { // https://datatables.net/manual/tech-notes/3#Object-instance-retrieval
  if ($.fn.dataTable.isDataTable('#' + table_id))
    return $('#' + table_id).DataTable();
  else
    return ANALYTICS_PORTAL_SDK_init_datatable(table_id);
}

function ANALYTICS_PORTAL_SDK_init_datatable(table_id) {
  if (table_id == 'elements_interactions_table')
    return ANALYTICS_PORTAL_SDK_init_elements_interactions_table(table_id);
  else if (table_id == 'uids_interactions_table')
    return ANALYTICS_PORTAL_SDK_init_uids_interactions_table(table_id);
  else
    console.error('unknown datatable:', table_id)
}

function ANALYTICS_PORTAL_SDK_init_uids_interactions_table(table_id) {
  return new DataTable('#' + table_id, {
    "createdRow": function(row, data, dataIndex) {
      let td_interactions = row.children[1];
      td_interactions.setAttribute('style', 'background-size: ' + data[2] + '% 100%');
      td_interactions.classList.add('percent');
    },
    "columnDefs": [
      {
        "targets": [0, 1],
        "className": 'dt-body-left'
      }
    ],
    "order": [[1, "desc"]],
    "columns": [
      { "width": "auto" },
      { "width": "auto" },
    ],
    "searching": false, 
    "paging": false, 
    "info": false,
    "bStateSave": true, // remember sorting
    responsive: true,
  });
}

function ANALYTICS_PORTAL_SDK_init_elements_interactions_table(table_id) {
  return new DataTable('#' + table_id, {
    "createdRow": function(row, data, dataIndex) {
      let td_element = row.children[1];
      td_element.setAttribute('title', data[3]);
      let td_interactions = row.children[2];
      td_interactions.setAttribute('style', 'background-size: ' + data[5] + '% 100%');
      td_interactions.classList.add('percent');
    },
    "columnDefs": [
      {
        "targets": [0, 1],
        "className": 'dt-body-left'
      }
    ],
    "order": [[2, "desc"]],
    "columns": [
      { "width": "auto" },
      { "width": "auto" },
      null
    ],
    "searching": false, 
    "paging": false, 
    "info": false,
    "bStateSave": true, // remember sorting
  });
}

function ANALYTICS_PORTAL_SDK_expand_datatable(table_id, number_of_records) {
  $('#' + table_id + '>tbody').css('display', 'table-row-group');
  localStorage.setItem(table_id + '_is_expanded', 'true');
  document.getElementById('toggle_' + table_id).innerHTML = 'Collapse table';
  if (number_of_records != null)
    document.getElementById('number_of_records_' + table_id).innerHTML = '(' + number_of_records + ' records)';
}

function ANALYTICS_PORTAL_SDK_collapse_datatable(table_id, number_of_records) {
  $('#' + table_id + '>tbody').css('display', 'none');
  localStorage.setItem(table_id + '_is_expanded', 'false');
  document.getElementById('toggle_' + table_id).innerHTML = 'Expand table';
  if (number_of_records != null)
    document.getElementById('number_of_records_' + table_id).innerHTML = '(' + number_of_records + ' records)';
}

function ANALYTICS_PORTAL_SDK_expand_collapse_datatable(table_id, number_of_records) {
  const datatable_is_expanded = localStorage.getItem(table_id + '_is_expanded');
  if ([null, 'false'].includes(datatable_is_expanded))
    ANALYTICS_PORTAL_SDK_collapse_datatable(table_id, number_of_records);
  else
    ANALYTICS_PORTAL_SDK_expand_datatable(table_id, number_of_records);
}

function ANALYTICS_PORTAL_SDK_toggle_table_display(table_id) {
  const datatable_is_expanded = localStorage.getItem(table_id + '_is_expanded');
  if ([null, 'false'].includes(datatable_is_expanded))
    ANALYTICS_PORTAL_SDK_expand_datatable(table_id);
  else
    ANALYTICS_PORTAL_SDK_collapse_datatable(table_id);
}

function ANALYTICS_PORTAL_SDK_refresh_uids_interactions_table(kwargs) {
  const uids = kwargs['uids'];
  let rows = [];
  const max_number_of_calls = Object.values(uids).sort(function(a, b){return b - a})[0];
  for (let uid in uids) {
    let number_of_calls = uids[uid];
    rows.push([uid, number_of_calls, Math.floor(number_of_calls * 100 / max_number_of_calls)]);
  }

  const table_id = 'uids_interactions_table';
  let table = ANALYTICS_PORTAL_SDK_get_datatable(table_id);
  table.clear(); // https://stackoverflow.com/questions/27778389/how-to-manually-update-datatables-table-with-new-json-data
  table.rows.add(rows);
  table.draw();

  ANALYTICS_PORTAL_SDK_expand_collapse_datatable(table_id, rows.length);
}

function ANALYTICS_PORTAL_SDK_refresh_elements_interactions_table(kwargs) {
  const elements_hierarchy = kwargs['elements_hierarchy'];
  let new_rows = [];
  let max_number_of_calls = 0;
  for (let i in elements_hierarchy) {
    let element = elements_hierarchy[i];
    let type = element.type;
    if (type == 'anchor') type = 'link';
    if (type == 'select-one') type = 'dropdown';
    let row = [type];
    if (element.element) 
      row.push(element.element);
    else
      row.push('All');
    row.push(element.number_of_calls);
    row.push('All' + element.element_path.join(' → '));
    row.push(element.element_path);
    if (element.number_of_calls > max_number_of_calls)
      max_number_of_calls = element.number_of_calls;
    row.push(Math.floor(element.number_of_calls * 100 / max_number_of_calls)); // don't know how it works: thanks to pointer to max_number_of_calls this value is automatically adjusted in new_rows - so no need to find max value first
    new_rows.push(row);
  }
  const table_id = 'elements_interactions_table';
  $('#' + table_id + ' tbody').off('click'); // remove previously set listeners

  let table = ANALYTICS_PORTAL_SDK_get_datatable(table_id);
  table.clear(); // https://stackoverflow.com/questions/27778389/how-to-manually-update-datatables-table-with-new-json-data
  table.rows.add(new_rows);
  table.draw();

  ANALYTICS_PORTAL_SDK_expand_collapse_datatable(table_id, new_rows.length);

  $('#' + table_id + ' tbody').on('click', 'tr', function () {
    var data = table.row(this).data();
    if (data)
      ANALYTICS_PORTAL_SDK_update_page_elements_dropdown_value(data[4]);
  });
}

function ANALYTICS_PORTAL_SDK_update_page_elements_dropdown_value(target_path) {
  let new_value = JSON.stringify(target_path).replace(/"/g, "'");
  const element = document.getElementById('drpd:element');
  element.value = new_value;
  let change = new Event('change'); // https://www.youtube.com/watch?v=RS-t3TC2iUo
  element.dispatchEvent(change);
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

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup_with_delay() {
  sleep(100).then(() => { // wait till sdk send data into db
    ANALYTICS_PORTAL_SDK_refresh_elements_page_data_according_to_user_filters_setup();
  });
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
  ANALYTICS_PORTAL_SDK_refresh_url_paths(kwargs);

  ANALYTICS_PORTAL_SDK_refresh_calls_over_time_for_chart_id_('elements_calls_over_time_chart_id', user_filters, kwargs);

  ANALYTICS_PORTAL_SDK_get_data_for_sankey_chart(kwargs);
  ANALYTICS_PORTAL_SDK_draw_sankey_chart(kwargs);

  ANALYTICS_PORTAL_SDK_refresh_elements_interactions_table(kwargs);
  ANALYTICS_PORTAL_SDK_refresh_uids_interactions_table(kwargs);
}

function ANALYTICS_PORTAL_SDK_get_data_for_sankey_chart(kwargs) {
  const elements_hierarchy = kwargs['elements_hierarchy'];
  //console.log(elements_hierarchy);
  let nodes_list = [];
  let nodes_dict = {}
  let paths = [];
  for (let i in elements_hierarchy) {
    let node_id = parseInt(i);
    let element = elements_hierarchy[i];
    let name = element['element'];
    if (name == '')
      name = 'All';
    nodes_list.push({"node": node_id, "name": name, "path": element['element_path']});
    nodes_dict[name] = node_id;
    paths.push({'path': element['element_path'], 'number_of_calls': element['number_of_calls']});
  }

  let links = [];
  for (let i in paths) {
    let p = paths[i];
    let path = p.path;
    if (path.length <= 1)
      continue;

    let path_length = path.length;
    let target = path[path_length - 1];
    let source = path[path_length - 2];
    if (source == '')
      source = 'All';
    let target_id = nodes_dict[target];
    let source_id = nodes_dict[source];
    let value = p.number_of_calls;
    links.push({"source": source_id, "target": target_id, "value": value});
  }

  //console.log(nodes_dict, links, paths)
  let data = {
    "nodes": nodes_list,
    "links": links
  };
  kwargs['sankey_chart_data'] = data;
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

function ANALYTICS_PORTAL_SDK_draw_sankey_chart(kwargs) { // https://d3-graph-gallery.com/graph/sankey_basic.html
  const element_id_for_sankey = 'sankey_chart';
  const element_with_sankey = document.getElementById(element_id_for_sankey);
  element_with_sankey.innerHTML = '';

  let node_padding = 20;
  let sankey_chart_data = kwargs['sankey_chart_data'];
  if (sankey_chart_data.nodes.length > 15) {
    node_padding = 10;
  }

  let sankey_width = element_with_sankey.offsetWidth;
  let sankey_height = sankey_chart_data.nodes.length * 20;

// set the dimensions and margins of the graph
var margin = {top: 20, right: 0, bottom: 25, left: 0},
    width = sankey_width// - margin.left - margin.right,
    height = sankey_height// - margin.top - margin.bottom;  

// format variables
var formatNumber = d3.format(",.0f"), // zero decimal places
    format = function(d) { return formatNumber(d); },
    color = d3.scaleOrdinal(d3.schemeCategory10);
  
// append the svg object to the body of the page
var svg = d3.select("#" + element_id_for_sankey).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

function left(node) {
  return node.depth;
}

function right(node, n) {
  return n - 1 - node.height;
}

function justify(node, n) {
  return node.sourceLinks.length ? node.depth : n - 1;
}

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(3)
    .nodePadding(node_padding)
    .size([width, height])
    .nodeAlign(left);

var path = sankey.links();
if (sankey_chart_data.nodes.length < 1)
  return;

graph = sankey(sankey_chart_data);

// add in the links
  var link = svg.append("g").selectAll(".link")
      .data(graph.links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d3.sankeyLinkHorizontal())
      .style("cursor", "pointer")
      .attr("stroke-width", function(d) { return d.width; });  

/*
link.on("mouseover", function(d){
  let target_path = d.target.__data__.target.path;
  let table = ANALYTICS_PORTAL_SDK_get_datatable();

  for (let i = 0; i < table.rows().eq(0).length; i++) {
    let element_path = table.row(i).data()[3];
    if ('All' + target_path.join(' → ') == element_path) {
      console.log(table.row(i).select());
    }
  }
})
*/

link.on("click", function(d) {
  let target_path = d.target.__data__.target.path;
  ANALYTICS_PORTAL_SDK_update_page_elements_dropdown_value(target_path);
})

// add the link titles
  link.append("title")
      .text(function(d) {
        return d.source.name + " → " + 
               d.target.name + "\n" + format(d.value) + " interactions"; })
      .style("cursor", "pointer");

// add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .style("font", "13px sans-serif")
      .attr("class", "node");

// add the rectangles for the nodes
  node.append("rect")
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("width", sankey.nodeWidth())
      .style("fill", '#0d6efdff')
      .append("title")
      .text(function(d) { 
      return d.name + "\n" + format(d.value); });

// add in the title for the nodes
  node.append("text")
      .attr("x", function(d) { return d.x0 - 6; })
      .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(function(d) { return d.name; })
      .filter(function(d) { return d.x0 < width / 2; })
      .attr("x", function(d) { return d.x1 + 6; })
      .attr("text-anchor", "start")
}

ANALYTICS_PORTAL_SDK_start();
