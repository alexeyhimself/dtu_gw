var db = [];
var db_elements = [];

// INIT DB DATA:
db2 = [

];

function DB_SELECT_all_FROM_db() {  // debug func
  debug_helper(arguments, DEBUG);
  for(let i in db) {
    console.log(JSON.stringify(db[i]));
  }
}

function DB_SELECT_EMULATION_check_if_report_ctag_and_topic_match_them_in_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);

  if (r.ctag != user_filters.ctag)
    return false;
  if (r.topic != user_filters.topic)
    return false;

  return true;
}

function DB_SELECT_EMULATION_check_if_report_date_matches_dates_in_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);
  let datetime_from = user_filters['datetime_from'];
  let datetime_to = user_filters['datetime_to'];
  
  if (!datetime_from && !datetime_to) {
    return true;
  }
  if (!datetime_from && datetime_to) {
    if (r.date_time > datetime_to) {
      return false;
    }
  }
  if (datetime_from && !datetime_to) {
    if (r.date_time < datetime_from) {
      return false;
    }
  }
  if (datetime_from && datetime_to) {
    if (r.date_time > datetime_to || r.date_time < datetime_from) {
      return false;
    }
  }

  return true;
}

function DB_SELECT_EMULATION_check_if_report_ctag_topic_dates_match_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);

  if (!DB_SELECT_EMULATION_check_if_report_ctag_and_topic_match_them_in_user_filters(r, user_filters))
    return false;
  if (!DB_SELECT_EMULATION_check_if_report_date_matches_dates_in_user_filters(r, user_filters))
    return false;

  return true;
}

function DB_SELECT_all_WHERE_user_filters(user_filters) {
  // SELECT * FROM reports_table WHERE 1=1
  // AND ctag = user_filters.ctag
  // AND topic = user_filters.topic
  // AND date_time BETWEEN (user_filters.date_time_from, user_filters.date_time_to)
  debug_helper(arguments, DEBUG);

  let found_reports = [];
  for (let i in db) {
    let report = db[i];
    if (DB_SELECT_EMULATION_check_if_report_ctag_topic_dates_match_user_filters(report, user_filters))
      found_reports.push(report);
  }
  return found_reports;
}

function DB_SELECT_DISTINCT_topics_AND_elements_WHERE_ctag_topic(user_filters) {
  // SELECT * FROM elements_table WHERE 1=1
  // AND ctag = user_filters.ctag
  // AND topic = user_filters.topic
  debug_helper(arguments, DEBUG);
  const ctag = user_filters['ctag'];
  const topic = user_filters['topic'];
  console.log(db_elements);
  let found_elements = db_elements[ctag][topic];
  let found_topics = Object.keys(db_elements[ctag]);
  return {'topics': found_topics, 'elements': found_elements};
}