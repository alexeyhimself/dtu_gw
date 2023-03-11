function DB_INSERT_report(r) {
  debug_helper(arguments, DEBUG);

  if (!r.topic) // enrich
    r.topic = "default";
  if (!r.element_path) // enrich
    r.element_path = [''];
  if (r.element_path[0] !== '')
    r.element_path.unshift(''); // add to the beginning as "all" elements for filter

  db2.insert([r], 'table_reports', r.topic);
  //db.push(r);
}

function DB_UPDATE_elements(r) {
  debug_helper(arguments, DEBUG);

  const element = r['element'];
  const ctag = r['ctag'];
  const topic = r['topic'];

  const table_elements = db2.select('table_elements', topic);

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

  db2.update('table_elements', topic, table_elements);
}

function RX_API_save_to_db(r) {
  debug_helper(arguments, DEBUG);
  
  // let report = JSON.parse(r); // parse payload after receive
  let report = r; // till no real networking - no parse to save CPU time
  DB_INSERT_report(report);
  DB_UPDATE_elements(report);
}

function DTU_RX_API_submint_report_endpoint(report) {
  debug_helper(arguments, DEBUG);
  RX_API_save_to_db(report);
}