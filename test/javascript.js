require('./common');

_dbs = [ 'mysql', 'mongodb', 'sqlite3', 'sqlite3_memory', 'postgresql' ];
_dbs.forEach(function (db) {
  describe('javascript-' + db, function () {
    before(function (done) {
      _g.connection = new _g.Connection(db, _g.db_configs[db]);

      var User = _g.connection.model('User', { name: String, age: Number });

      _g.dropModels([User], done);
    });

    beforeEach(function (done) {
      _g.deleteAllRecords([_g.connection.User], done);
    });

    after(function (done) {
      _g.dropModels([_g.connection.User], done);
    });

    require('./cases/javascript')();
  });
});
