'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('ehr', {
    id: { type: "int", primaryKey: true, autoIncrement: true },
    nhs_number: "string",
    s3_key: "string"
  }).then(
      function(result) {
        db.createTable('health', {
          id: { type: 'int', primaryKey: true, autoIncrement: true },
          completed_at: 'string'
        });
      },
      function(err) {
        return err;
      }
    );
};

exports.down = function(db) {
  return db.dropTable('ehr').then(()=>{
    db.dropTable('health');
  });
};

exports._meta = {
  "version": 1
};
