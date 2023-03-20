const emty_db_schema = {'table_reports': []};

class DB {
  constructor() {
    this.db_m = JSON.parse(JSON.stringify(emty_db_schema)); // https://www.digitalocean.com/community/tutorials/copying-objects-in-javascript#deep-copying-objects
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

  get_storage_engine(topic) {
    if (!topic)
      return 'both';

    const in_memory_topics = ['auto-generated (lite)', 'auto-generated (heavy)'];
    if (in_memory_topics.includes(topic))
      return 'in-memory';

    return 'local';
  }

  get_records_by_engine(ctag, topic) {
    const storage_engine = this.get_storage_engine(topic);
    console.log(storage_engine, topic)
    if (storage_engine == 'in-memory')
      return this.db_m.table_reports;
    else if (storage_engine == 'local')
      return this.read_local_storage().table_reports;
    else { // both
      const in_memory = this.db_m.table_reports;
      const in_local_storage = this.read_local_storage().table_reports;
      return in_memory.concat(in_local_storage);
    }
  }

  select(ctag, topic) {
    let records = this.get_records_by_engine(ctag, topic)

    let found_reports = [];
    for (let i in records) {
      let r = records[i];
      if (topic) {
        if (r.ctag == ctag && r.topic == topic)
          found_reports.push(r);
      }
      else {
        if (r.ctag == ctag)
          found_reports.push(r);
      }
    }
    return found_reports;
  }

  insert(record) {
    const topic = record.topic;
    const storage_engine = this.get_storage_engine(topic);
    if (storage_engine == 'in-memory') {
      this.db_m.table_reports.push(record);
    }
    else if (storage_engine == 'local') {
      let db_s_json = this.read_local_storage();
      db_s_json.table_reports.push(record);
      window.localStorage.setItem('dtu_db', JSON.stringify(db_s_json));
    }
    else {
      console.error("here", record, topic)
    }
  }

  cleanup() {
    window.localStorage.setItem('dtu_db', JSON.stringify(emty_db_schema));
  }
}

let dtu_db = new DB();

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

function DB_SELECT_all_WHERE_user_filters(user_filters) {
  // SELECT * FROM reports_table WHERE 1=1
  // AND ctag = user_filters.ctag
  // AND topic = user_filters.topic
  // AND date_time BETWEEN (user_filters.date_time_from, user_filters.date_time_to)

  const ctag = user_filters['ctag'];
  const topic = user_filters['topic'];
  const table_reports = dtu_db.select(ctag, topic);

  let found_reports = [];
  for (let i in table_reports) {
    let report = table_reports[i];
    if (DB_SELECT_EMULATION_check_if_report_date_matches_dates_in_user_filters(report, user_filters))
      found_reports.push(report);
  }
  return found_reports;
}

function DB_SELECT_DISTINCT_something_FROM_somewhere(something, somewhere) {
  let found_items = [];
  if (somewhere) {
    for (let i in somewhere) {
      let r = somewhere[i];
      if (!found_items.includes(r[something]))
        found_items.push(r[something]);
    }
  }
  return found_items;
}

function DB_SELECT_DISTINCT_elements_WHERE_ctag_topic(user_filters) {
  // SELECT DISTINCT element FROM reports_table WHERE 1=1
  // AND ctag = user_filters.ctag
  // AND topic = user_filters.topic

  const ctag = user_filters['ctag'];
  const topic = user_filters['topic'];
  const table_reports = dtu_db.select(ctag, topic);

  let found_elements = DB_SELECT_DISTINCT_something_FROM_somewhere('element', table_reports);
  return {'ctag': ctag, 'topic': topic, 'elements': found_elements};
}

function DB_SELECT_DISTINCT_topics_WHERE_ctag_topic(user_filters) {
  // SELECT DISTINCT topic FROM reports_table WHERE 1=1
  // AND ctag = user_filters.ctag

  const ctag = user_filters['ctag'];
  const table_reports = dtu_db.select(ctag);
  
  let found_topics = DB_SELECT_DISTINCT_something_FROM_somewhere('topic', table_reports);
  return {'ctag': ctag, 'topics': found_topics};
}
