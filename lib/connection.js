// Generated by CoffeeScript 1.7.1
(function() {
  var Connection, EventEmitter, Model, Promise, bindDomain, inspect, redis, _, _use,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  Model = require('./model');

  _ = require('underscore');

  bindDomain = require('./util').bindDomain;

  Promise = require('bluebird');

  try {
    redis = require('redis');
  } catch (_error) {}

  inspect = require('util').inspect;

  Connection = (function(_super) {
    __extends(Connection, _super);

    function Connection(adapter_name, settings) {
      var redis_cache;
      if (settings.is_default !== false) {
        Connection.defaultConnection = this;
      }
      redis_cache = settings.redis_cache || {};
      this._redis_cache_settings = redis_cache;
      this.connected = false;
      this.models = {};
      this._pending_associations = [];
      this._schema_changed = false;
      this._adapter = Promise.promisifyAll(require(__dirname + '/adapters/' + adapter_name)(this));
      this._promise_connection = this._adapter.connectAsync(settings).then(function() {
        return this.connected = true;
      })["catch"](function(error) {
        this._adapter = null;
        return Promise.reject(error);
      });
    }

    Connection.prototype.close = function() {
      if (Connection.defaultConnection === this) {
        Connection.defaultConnection = null;
      }
      this._adapter.close();
      return this._adapter = null;
    };

    Connection.prototype.model = function(name, schema) {
      return Model.newModel(this, name, schema);
    };

    Connection.prototype._checkSchemaApplied = function() {
      if (!this._applying_schemas && !this._schema_changed) {
        return Promise.resolve();
      }
      return this.applySchemas();
    };

    Connection.prototype._checkArchive = function() {
      var model, modelClass, _Archive, _ref, _results;
      _ref = this.models;
      _results = [];
      for (model in _ref) {
        modelClass = _ref[model];
        if (modelClass.archive && !modelClass._connection.models.hasOwnProperty('_Archive')) {
          _results.push(_Archive = (function(_super1) {
            __extends(_Archive, _super1);

            function _Archive() {
              return _Archive.__super__.constructor.apply(this, arguments);
            }

            _Archive.connection(modelClass._connection);

            _Archive.archive = false;

            _Archive.column('model', String);

            _Archive.column('data', Object);

            return _Archive;

          })(Model));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Connection.prototype.applySchemas = function(callback) {
      return Promise.resolve().then((function(_this) {
        return function() {
          if (!_this._schema_changed) {
            return;
          }
          _this._applyAssociations();
          if (!_this._applying_schemas) {
            _this._applying_schemas = true;
            _this._checkArchive();
            _this._promise_schema_applied = _this._promise_connection.then(function() {
              var promises;
              promises = Object.keys(_this.models).map(function(model) {
                var modelClass;
                modelClass = _this.models[model];
                if (!modelClass._schema_changed) {
                  return Promise.resolve();
                }
                return _this._adapter.applySchemaAsync(model).then(function() {
                  return modelClass._schema_changed = false;
                });
              });
              return Promise.all(promises)["finally"](function() {
                _this._applying_schemas = false;
                return _this._schema_changed = false;
              });
            });
          }
          return _this._promise_schema_applied;
        };
      })(this)).nodeify(bindDomain(callback));
    };

    Connection.prototype.log = function(model, type, data) {};

    Connection.prototype._connectRedisCache = function() {
      var client, settings;
      if (this._redis_cache_client) {
        return Promise.resolve(this._redis_cache_client);
      } else if (!redis) {
        return Promise.reject(new Error('cache needs Redis'));
      } else {
        settings = this._redis_cache_settings;
        this._redis_cache_client = client = settings.client || (redis.createClient(settings.port || 6379, settings.host || '127.0.0.1'));
        if (settings.database != null) {
          client.select(settings.database);
          client.once('connect', function() {
            client.send_anyways = true;
            client.select(settings.database);
            return client.send_anyways = false;
          });
        }
        return Promise.resolve(client);
      }
    };

    Connection.prototype.inspect = function(depth) {
      return inspect(this.models);
    };

    return Connection;

  })(EventEmitter);

  _use = function(file) {
    var MixClass;
    MixClass = require("./connection/" + file);
    _.extend(Connection, MixClass);
    return _.extend(Connection.prototype, MixClass.prototype);
  };

  _use('association');

  _use('manipulate');

  Model._Connection = Connection;

  module.exports = Connection;

}).call(this);
