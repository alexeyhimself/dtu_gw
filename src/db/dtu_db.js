const emty_db_schema = {'table_reports': [], 'table_elements': {}}; // https://www.digitalocean.com/community/tutorials/copying-objects-in-javascript#deep-copying-objects

class DB {
  constructor() {
    this.db_m = JSON.parse(JSON.stringify(emty_db_schema));
    this.init_local_storage();
  }

  init_local_storage() {
    if (!window.localStorage.getItem('dtu_db')) {
      window.localStorage.setItem('dtu_db', JSON.stringify(emty_db_schema));
    }
  }

  read_local_storage() {
    const db_ls = window.localStorage.getItem('dtu_db');
    return JSON.parse(db_ls);
  }

  get_type_of_storage(topic) {
    let type_of_storage = 'local';
    if (topic != 'real usage')
      type_of_storage = 'in-memory';
    return type_of_storage;
  }

  select(table_name, topic) {
    const type_of_storage = this.get_type_of_storage(topic);
    if (table_name == 'table_reports') {
      if (type_of_storage == 'in-memory')
        return this.db_m.table_reports;
      else
        return this.read_local_storage().table_reports;
    }
    else if (table_name == 'table_elements') {
      if (type_of_storage == 'in-memory')
        return this.db_m.table_elements;
      else
        return this.read_local_storage().table_elements;
    }
  }

  insert(record, table_name, topic) {
    const type_of_storage = this.get_type_of_storage(topic);

    if (table_name == 'table_reports') {
      if (type_of_storage == 'in-memory') {
        this.db_m.table_reports.push(record);
      }
      else {
        let db_s_json = this.read_local_storage();
        db_s_json.table_reports.push(record);
        window.localStorage.setItem('dtu_db', JSON.stringify(db_s_json));
      }
    }
    else if (table_name == 'table_elements') {
      console.error('Insert into table_elements not supported');
    }
  }

  update(table_name, topic, new_data) {
    const type_of_storage = this.get_type_of_storage(topic);

    if (table_name == 'table_reports') {
      console.error('Update table_reports not supported');
    }
    else if (table_name == 'table_elements') {
      if (type_of_storage == 'in-memory')
        this.db_m.table_elements = new_data;
      else {
        let db_s_json = this.read_local_storage();
        db_s_json.table_elements = new_data;
        window.localStorage.setItem('dtu_db', JSON.stringify(db_s_json));
      }
    }
  }

  cleanup() {
    window.localStorage.setItem('dtu_db', JSON.stringify(emty_db_schema));
  }
}

let dtu_db = new DB();

function DB_SELECT_EMULATION_check_if_report_ctag_and_topic_match_them_in_user_filters(r, user_filters) {
  if (r.ctag != user_filters.ctag)
    return false;
  if (r.topic != user_filters.topic)
    return false;

  return true;
}

function DB_SELECT_EMULATION_check_if_report_date_matches_dates_in_user_filters(r, user_filters) {
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

  const table_reports = dtu_db.select('table_reports', user_filters.topic);

  let found_reports = [];
  for (let i in table_reports) {
    let report = table_reports[i];
    if (DB_SELECT_EMULATION_check_if_report_ctag_topic_dates_match_user_filters(report, user_filters))
      found_reports.push(report);
  }
  return found_reports;
}

function DB_SELECT_DISTINCT_topics_AND_elements_WHERE_ctag_topic(user_filters) {
  // SELECT * FROM elements_table WHERE 1=1
  // AND ctag = user_filters.ctag
  // AND topic = user_filters.topic

  const ctag = user_filters['ctag'];
  const topic = user_filters['topic'];

  const table_elements = dtu_db.select('table_elements', topic);

  let found_elements = [];
  let found_topics = [];

  if (table_elements) {
    let topics = table_elements[ctag];
    if (topics) {
      found_elements = table_elements[ctag][topic];
      found_topics = Object.keys(table_elements[ctag]);  
    }
  }

  return {'topics': found_topics, 'elements': found_elements};
}