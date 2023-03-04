var db = [];
var db_tags = {};

// INIT DB DATA:
db2 = [
  {"gtag":"ABCD","date_time":1671532440488,"uid":52,"feature_path":["Posts","Multiple media objects","Videos"],"feature":"Videos","topic":"default"},
]

function DB_SELECT_EMULATION_check_if_report_ctag_and_topic_match_them_in_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);
  let ctag = user_filters['ctag']
  let topic = user_filters['topic']

  if (r.ctag != ctag)
    return false;

  if (r.topic != topic)
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
    if (!DB_SELECT_EMULATION_check_if_report_ctag_topic_dates_match_user_filters(report, user_filters))
      continue;
    found_reports.push(report);
  }
  return found_reports;
}