// Generated by CoffeeScript 1.6.2
(function() {
  var AdapterBase, RedisAdapter, async, error, redis, tableize, types, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  try {
    redis = require('redis');
  } catch (_error) {
    error = _error;
    console.log('Install redis module to use this adapter');
    process.exit(1);
  }

  AdapterBase = require('./base');

  types = require('../types');

  tableize = require('../inflector').tableize;

  async = require('async');

  _ = require('underscore');

  RedisAdapter = (function(_super) {
    __extends(RedisAdapter, _super);

    RedisAdapter.prototype.key_type = types.Integer;

    RedisAdapter.prototype._getKeys = function(table, conditions, callback) {
      var _this = this;

      if (Array.isArray(conditions)) {
        if (conditions.length === 0) {
          this._client.keys("" + table + ":*", function(error, keys) {
            return callback(null, keys);
          });
          return;
        }
        async.map(conditions, function(condition, callback) {
          return _this._getKeys(table, condition, callback);
        }, function(error, keys) {
          return callback(null, _.flatten(keys));
        });
        return;
      } else if (typeof conditions === 'object' && conditions.id) {
        if (conditions.id.$in) {
          callback(null, conditions.id.$in.map(function(id) {
            return "" + table + ":" + id;
          }));
        } else {
          callback(null, ["" + table + ":" + conditions.id]);
        }
        return;
      }
      return callback(null, []);
    };

    function RedisAdapter(connection) {
      this._connection = connection;
    }

    RedisAdapter.prototype.drop = function(model, callback) {
      return this["delete"](model, [], callback);
    };

    RedisAdapter.prototype.valueToDB = function(value, column, property) {
      if (value == null) {
        return;
      }
      switch (property.type) {
        case types.Number:
        case types.Integer:
          return value.toString();
        case types.Date:
          return new Date(value).getTime().toString();
        case types.Boolean:
          if (value) {
            return '1';
          } else {
            return '0';
          }
          break;
        case types.Object:
          return JSON.stringify(value);
        default:
          return value;
      }
    };

    RedisAdapter.prototype.valueToModel = function(value, column, property) {
      switch (property.type) {
        case types.Number:
        case types.Integer:
          return Number(value);
        case types.Date:
          return new Date(Number(value));
        case types.Boolean:
          return value !== '0';
        case types.Object:
          return JSON.parse(value);
        default:
          return value;
      }
    };

    RedisAdapter.prototype.create = function(model, data, callback) {
      var _this = this;

      data.$_$ = '';
      return this._client.incr("" + (tableize(model)) + ":_lastid", function(error, id) {
        if (error) {
          return callback(RedisAdapter.wrapError('unknown error', error));
        }
        return _this._client.hmset("" + (tableize(model)) + ":" + id, data, function(error) {
          if (error) {
            return callback(RedisAdapter.wrapError('unknown error', error));
          }
          return callback(null, id);
        });
      });
    };

    RedisAdapter.prototype.createBulk = function(model, data, callback) {
      return this._createBulkDefault(model, data, callback);
    };

    RedisAdapter.prototype.update = function(model, data, callback) {
      var key,
        _this = this;

      key = "" + (tableize(model)) + ":" + data.id;
      delete data.id;
      data.$_$ = '';
      return this._client.exists(key, function(error, exists) {
        if (error) {
          return callback(RedisAdapter.wrapError('unknown error', error));
        }
        if (!exists) {
          return callback(null);
        }
        return _this._client.del(key, function(error) {
          if (error) {
            return callback(RedisAdapter.wrapError('unknown error', error));
          }
          return _this._client.hmset(key, data, function(error) {
            if (error) {
              return callback(RedisAdapter.wrapError('unknown error', error));
            }
            return callback(null);
          });
        });
      });
    };

    RedisAdapter.prototype.updatePartial = function(model, data, conditions, options, callback) {
      var fields_to_del, table,
        _this = this;

      fields_to_del = Object.keys(data).filter(function(key) {
        return data[key] == null;
      });
      fields_to_del.forEach(function(key) {
        return delete data[key];
      });
      fields_to_del.push('$_$');
      table = tableize(model);
      data.$_$ = '';
      return this._getKeys(table, conditions, function(error, keys) {
        return async.forEach(keys, function(key, callback) {
          var args;

          args = _.clone(fields_to_del);
          args.unshift(key);
          return _this._client.hdel(args, function(error) {
            if (error) {
              return callback(RedisAdapter.wrapError('unknown error', error));
            }
            return _this._client.hmset(key, data, function(error) {
              if (error) {
                return callback(RedisAdapter.wrapError('unknown error', error));
              }
              return callback(null);
            });
          });
        }, function(error) {
          return callback(null, keys.length);
        });
      });
    };

    RedisAdapter.prototype.findById = function(model, id, options, callback) {
      var _this = this;

      return this._client.hgetall("" + (tableize(model)) + ":" + id, function(error, result) {
        if (error) {
          return callback(RedisAdapter.wrapError('unknown error', error));
        }
        if (result) {
          result.id = id;
          if (options.return_raw_instance) {
            return callback(null, _this._refineRawInstance(model, result, options.select));
          } else {
            return callback(null, _this._convertToModelInstance(model, result, options.select));
          }
        } else {
          return callback(new Error('not found'));
        }
      });
    };

    RedisAdapter.prototype.find = function(model, conditions, options, callback) {
      var table,
        _this = this;

      table = tableize(model);
      return this._getKeys(table, conditions, function(error, keys) {
        return async.map(keys, function(key, callback) {
          return _this._client.hgetall(key, function(error, result) {
            if (result) {
              result.id = Number(key.substr(table.length + 1));
            }
            return callback(null, result);
          });
        }, function(error, records) {
          records = records.filter(function(record) {
            return record != null;
          });
          if (options.return_raw_instance) {
            return callback(null, records.map(function(record) {
              return _this._refineRawInstance(model, record, options.select);
            }));
          } else {
            return callback(null, records.map(function(record) {
              return _this._convertToModelInstance(model, record, options.select);
            }));
          }
        });
      });
    };

    RedisAdapter.prototype._delete = function(keys, callback) {};

    RedisAdapter.prototype["delete"] = function(model, conditions, callback) {
      var _this = this;

      return this._getKeys(tableize(model), conditions, function(error, keys) {
        if (error) {
          return callback(error);
        }
        if (keys.length === 0) {
          return callback(null, 0);
        }
        return _this._client.del(keys, function(error, count) {
          if (error) {
            return callback(RedisAdapter.wrapError('unknown error', error));
          }
          return callback(null, count);
        });
      });
    };

    RedisAdapter.prototype.connect = function(settings, callback) {
      var _this = this;

      this._client = redis.createClient(settings.port || 6379, settings.host || '127.0.0.1');
      return this._client.on('connect', function() {
        return _this._client.select(settings.database || 0, function(error) {
          return callback(error);
        });
      });
    };

    return RedisAdapter;

  })(AdapterBase);

  module.exports = function(connection) {
    return new RedisAdapter(connection);
  };

}).call(this);