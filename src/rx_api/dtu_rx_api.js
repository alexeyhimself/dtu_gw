function DB_INSERT_report(r) {
  debug_helper(arguments, DEBUG);

  if (!r.topic) // enrich
    r.topic = "default";
  if (!r.feature_path) // enrich
    r.feature_path = [''];
  if (r.feature_path[0] !== '')
    r.feature_path.unshift(''); // add to the beginning as "all" features for filter

  db.push(r);
}

function DB_UPDATE_elements(r) {
  debug_helper(arguments, DEBUG);
  const element = r['feature'];
  const ctag = r['ctag'];
  const topic = r['topic'];

  if (!db_elements[ctag]) {
    db_elements[ctag] = {};
    db_elements[ctag][topic] = [element];
  }
  else {
    if (!db_elements[ctag][topic]) {
      db_elements[ctag][topic] = [element];
    }
    else {
      let already_saved_elements = db_elements[ctag][topic];
      if (!already_saved_elements.includes(element))
        already_saved_elements.push(element);
    }
  }
}

function RX_API_save_to_db(r) {
  debug_helper(arguments, DEBUG);

  DB_INSERT_report(r);
  DB_UPDATE_elements(r);
}

function RX_API_submint_report(report) {
  debug_helper(arguments, DEBUG);
  RX_API_save_to_db(JSON.parse(report));
}