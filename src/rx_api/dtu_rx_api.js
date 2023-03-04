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

function DB_UPDATE_tags(r) {
  debug_helper(arguments, DEBUG);

  if (!db_tags[r.gtag]) {
    let topic = r.topic;
    db_tags[r.gtag] = {topic: r.tags};
  }
  else {
    if (!db_tags[r.gtag][r.topic]) {
      db_tags[r.gtag][r.topic] = r.tags;
    }
    else {
      let already_saved_tags = db_tags[r.gtag][r.topic];
      for (let tag in r.tags) {
        let value = r.tags[tag][0]; // support multiselect here
        if (tag in already_saved_tags) {
          if (already_saved_tags[tag].includes(value))
            continue;
          already_saved_tags[tag].push(value);
        }
        else {
          already_saved_tags[tag] = [r.tags[tag]];
        }
      }
    }
  }
}

function RX_API_save_to_db(r) {
  debug_helper(arguments, DEBUG);

  DB_INSERT_report(r);
  DB_UPDATE_tags(r);
}

function RX_API_submint_report(report) {
  debug_helper(arguments, DEBUG);
  let r = JSON.parse(report);
  RX_API_save_to_db(r);
  //ANALYTICS_PORTAL_SDK_refresh_features_page_data_according_to_user_filters_setup(); // temporary for debug
}