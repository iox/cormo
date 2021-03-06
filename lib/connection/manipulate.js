// Generated by CoffeeScript 1.7.1
(function() {
  var ConnectionManipulate, Promise, bindDomain, inflector, types;

  bindDomain = require('../util').bindDomain;

  inflector = require('../inflector');

  Promise = require('bluebird');

  types = require('../types');

  ConnectionManipulate = (function() {
    function ConnectionManipulate() {}

    ConnectionManipulate.prototype._manipulateCreate = function(model, data) {
      model = inflector.camelize(model);
      if (!this.models[model]) {
        return Promise.reject(new Error("model " + model + " does not exist"));
      }
      model = this.models[model];
      return model.create(data, {
        skip_log: true
      });
    };

    ConnectionManipulate.prototype._manipulateDelete = function(model, data) {
      model = inflector.camelize(model);
      if (!this.models[model]) {
        return Promise.reject(new Error("model " + model + " does not exist"));
      }
      model = this.models[model];
      return model.where(data)["delete"]({
        skip_log: true
      });
    };

    ConnectionManipulate.prototype._manipulateDeleteAllModels = function() {
      var promises;
      promises = Object.keys(this.models).map((function(_this) {
        return function(model) {
          if (model === '_Archive') {
            return Promise.resolve();
          }
          model = _this.models[model];
          return model.where()["delete"]({
            skip_log: true
          });
        };
      })(this));
      return Promise.all(promises);
    };

    ConnectionManipulate.prototype._manipulateDropModel = function(model) {
      model = inflector.camelize(model);
      if (!this.models[model]) {
        return Promise.reject(new Error("model " + model + " does not exist"));
      }
      model = this.models[model];
      return model.drop();
    };

    ConnectionManipulate.prototype._manipulateDropAllModels = function() {
      var promises;
      promises = Object.keys(this.models).map((function(_this) {
        return function(model) {
          model = _this.models[model];
          return model.drop();
        };
      })(this));
      return Promise.all(promises);
    };

    ConnectionManipulate.prototype._manipulateFind = function(model, data) {
      model = inflector.camelize(inflector.singularize(model));
      if (!this.models[model]) {
        return Promise.reject(new Error("model " + model + " does not exist"));
      }
      model = this.models[model];
      return model.where(data).exec({
        skip_log: true
      });
    };

    ConnectionManipulate.prototype._manipulateConvertIds = function(id_to_record_map, model, data) {
      var column, property, record, _ref, _results;
      model = inflector.camelize(model);
      if (!this.models[model]) {
        return;
      }
      model = this.models[model];
      _ref = model._schema;
      _results = [];
      for (column in _ref) {
        property = _ref[column];
        if (property.record_id && data.hasOwnProperty(column)) {
          if (property.array && Array.isArray(data[column])) {
            _results.push(data[column] = data[column].map(function(value) {
              var record;
              record = id_to_record_map[value];
              if (record) {
                return record.id;
              } else {
                return value;
              }
            }));
          } else {
            record = id_to_record_map[data[column]];
            if (record) {
              _results.push(data[column] = record.id);
            } else {
              _results.push(void 0);
            }
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ConnectionManipulate.prototype.manipulate = function(commands, callback) {
      this.log('<conn>', 'manipulate', commands);
      return this._checkSchemaApplied().then((function(_this) {
        return function() {
          var current, id_to_record_map, promises;
          id_to_record_map = {};
          if (!Array.isArray(commands)) {
            commands = [commands];
          }
          current = Promise.resolve();
          promises = commands.map(function(command) {
            return current = current.then(function() {
              var data, id, key, model;
              if (typeof command === 'object') {
                key = Object.keys(command);
                if (key.length === 1) {
                  key = key[0];
                  data = command[key];
                } else {
                  key = void 0;
                }
              } else if (typeof command === 'string') {
                key = command;
              }
              if (!key) {
                return Promise.reject(new Error('invalid command: ' + JSON.stringify(command)));
              } else if (key.substr(0, 7) === 'create_') {
                model = key.substr(7);
                id = data.id;
                delete data.id;
                _this._manipulateConvertIds(id_to_record_map, model, data);
                return _this._manipulateCreate(model, data).then(function(record) {
                  if (id) {
                    return id_to_record_map[id] = record;
                  }
                });
              } else if (key.substr(0, 7) === 'delete_') {
                model = key.substr(7);
                return _this._manipulateDelete(model, data);
              } else if (key === 'deleteAll') {
                return _this._manipulateDeleteAllModels();
              } else if (key.substr(0, 5) === 'drop_') {
                model = key.substr(5);
                return _this._manipulateDropModel(model);
              } else if (key === 'dropAll') {
                return _this._manipulateDropAllModels();
              } else if (key.substr(0, 5) === 'find_') {
                model = key.substr(5);
                id = data.id;
                delete data.id;
                if (!id) {
                  return callback(null);
                }
                return _this._manipulateFind(model, data).then(function(records) {
                  return id_to_record_map[id] = records;
                });
              } else {
                return Promise.reject(new Error('unknown command: ' + key));
              }
            });
          });
          return Promise.all(promises).then(function() {
            return Promise.resolve(id_to_record_map);
          });
        };
      })(this)).nodeify(bindDomain(callback));
    };

    return ConnectionManipulate;

  })();

  module.exports = ConnectionManipulate;

}).call(this);
