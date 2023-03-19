function DB_INSERT_report(r) {
  DB_INSERT_enrich_report(r);
  dtu_db.insert(r, 'table_reports', r.topic);
}

function DB_INSERT_enrich_report(r) {
  if (!r.topic)
    r.topic = "default";

  if (!r.element_path) // enrich
    r.element_path = ['', r.element];
  if (r.element_path[0] !== '')
    r.element_path.unshift(''); // add to the beginning as "all" elements for filter
}

function DB_UPDATE_elements(r) {
  const element = r['element'];
  const ctag = r['ctag'];
  const topic = r['topic'];

  const table_elements = dtu_db.select('table_elements', topic);

  if (!table_elements[ctag]) {
    table_elements[ctag] = {};
    table_elements[ctag][topic] = [element];
  }
  else {
    if (!table_elements[ctag][topic]) {
      table_elements[ctag][topic] = [element];
    }
    else {
      let already_saved_elements = table_elements[ctag][topic];
      if (!already_saved_elements.includes(element))
        already_saved_elements.push(element);
    }
  }

  dtu_db.update('table_elements', topic, table_elements);
}

function RX_API_save_to_db(r) {
  // let report = JSON.parse(r); // parse payload after receive
  let report = r; // till no real networking - no parse to save CPU time
  DB_INSERT_report(report);
  DB_UPDATE_elements(report);
}

function DTU_RX_API_submint_report_endpoint(report) {
  RX_API_save_to_db(report);
}