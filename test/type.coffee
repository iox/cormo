require './common'

_dbs =
  mysql:
    database: 'test'
  mongodb:
    database: 'test'
  sqlite3:
    database: __dirname + '/test.sqlite3'
  sqlite3_memory: {}
  postgresql:
    database: 'test'

Object.keys(_dbs).forEach (db) ->
  describe 'type-' + db, ->
    connection = undefined
    connect = (callback) ->
      connection = new Connection db, _dbs[db]
      if connection.connected
        callback()
      else
        connection.once 'connected', callback
        connection.once 'error', (error) ->
          callback error

    models = {}

    before (done) ->
      connect (error) ->
        return done error if error

        if Math.floor Math.random() * 2
          # using CoffeeScript extends keyword
          class Type extends Model
            @connection connection
            @column 'number', 'number'
            @column 'int_c', 'integer'
            @column 'date', 'date'
            @column 'boolean', 'boolean'
        else
          # using Connection method
          Type = connection.model 'Type',
            number: Number
            int_c: Connection.Integer
            date: Date
            boolean: Boolean

        models.Type = Type

        Type.drop (error) ->
          return done error if error
          connection.applySchemas (error) ->
            return done error if error
            done null

    beforeEach (done) ->
      models.Type.deleteAll (error) ->
        return done error if error
        done null

    after (done) ->
      models.Type.drop done

    require('./cases/type')(models)