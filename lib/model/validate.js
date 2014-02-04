// Generated by CoffeeScript 1.6.2
(function() {
  var ModelValidate, types, util;

  types = require('../types');

  util = require('../util');

  ModelValidate = (function() {
    function ModelValidate() {}

    ModelValidate._validateType = function(column, type, value) {
      switch (type) {
        case types.Number:
          value = Number(value);
          if (isNaN(value)) {
            throw "'" + column + "' is not a number";
          }
          break;
        case types.Boolean:
          if (typeof value !== 'boolean') {
            throw "'" + column + "' is not a boolean";
          }
          break;
        case types.Integer:
          value = Number(value);
          if (isNaN(value) || (value >> 0) !== value) {
            throw "'" + column + "' is not an integer";
          }
          break;
        case types.GeoPoint:
          if (!(Array.isArray(value) && value.length === 2)) {
            throw "'" + column + "' is not a geo point";
          } else {
            value[0] = Number(value[0]);
            value[1] = Number(value[1]);
          }
          break;
        case types.Date:
          value = new Date(value);
          if (isNaN(value.getTime())) {
            throw "'" + column + "' is not a date";
          }
      }
      return value;
    };

    ModelValidate._validateColumn = function(data, column, property) {
      var error, i, last, obj, v, value, _i, _len, _ref;

      _ref = util.getLeafOfPath(data, property._parts, false), obj = _ref[0], last = _ref[1];
      value = obj != null ? obj[last] : void 0;
      if (value != null) {
        if (property.array) {
          if (!Array.isArray(value)) {
            throw "'" + column + "' is not an array";
          }
          try {
            for (i = _i = 0, _len = value.length; _i < _len; i = ++_i) {
              v = value[i];
              value[i] = this._validateType(column, property.type, v);
            }
          } catch (_error) {
            error = _error;
            throw "'" + column + "' is not an array";
          }
        } else {
          obj[last] = this._validateType(column, property.type, value);
        }
      } else {
        if (property.required) {
          throw "'" + column + "' is required";
        }
      }
    };

    ModelValidate.prototype.validate = function(callback) {
      var column, ctor, error, errors, property, schema,
        _this = this;

      this._runCallbacks('validate', 'before');
      errors = [];
      ctor = this.constructor;
      schema = ctor._schema;
      for (column in schema) {
        property = schema[column];
        try {
          ctor._validateColumn(this, column, property);
        } catch (_error) {
          error = _error;
          errors.push(error);
        }
      }
      this.constructor._validators.forEach(function(validator) {
        var e, r;

        try {
          r = validator(_this);
          if (r === false) {
            return errors.push('validation failed');
          } else if (typeof r === 'string') {
            return errors.push(r);
          }
        } catch (_error) {
          e = _error;
          return errors.push(e.message);
        }
      });
      if (errors.length > 0) {
        this._runCallbacks('validate', 'after');
        if (typeof callback === "function") {
          callback(new Error(errors.join(',')));
        }
        return false;
      } else {
        this._runCallbacks('validate', 'after');
        if (typeof callback === "function") {
          callback(null);
        }
        return true;
      }
    };

    ModelValidate.addValidator = function(validator) {
      this._checkConnection();
      return this._validators.push(validator);
    };

    return ModelValidate;

  })();

  module.exports = ModelValidate;

}).call(this);