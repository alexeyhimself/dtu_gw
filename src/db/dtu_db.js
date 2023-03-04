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

function DB_SELECT_EMULATION_check_if_report_uid_matches_uids_in_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);
  let uids = user_filters['uids'];
  let uids_exclude = user_filters['uids_exclude'];

  if (uids) {
    if (!uids.includes(String(r.uid))) {
      return false;
    }
  }
  if (uids_exclude) {
    if (uids_exclude.includes(String(r.uid))) {
      return false;
    }
  }

  return true;
}

function DB_SELECT_EMULATION_check_if_report_ctag_topic_users_dates_match_user_filters(r, user_filters) {
  debug_helper(arguments, DEBUG);
  if (!DB_SELECT_EMULATION_check_if_report_uid_matches_uids_in_user_filters(r, user_filters))
    return false;

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
  // AND uid IN user_filters.uids_to_include
  // AND uid NOT IN user_filters.uids_to_exclude
  // AND date_time BETWEEN (user_filters.date_time_from, user_filters.date_time_to)
  // AND FOR each_custom_tag DO each_custom_tag = user_filters.custom_tag;
  debug_helper(arguments, DEBUG);

  var found = [];
  for (let i = 0; i < db.length; i++) {
    var r = db[i];
    if (!DB_SELECT_EMULATION_check_if_report_ctag_topic_users_dates_match_user_filters(r, user_filters))
      continue;
    found.push(r);
  }
  return found;
}