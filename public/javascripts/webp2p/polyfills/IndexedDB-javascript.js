/**
 * Polyfill to add full support for JavaScript objects with an IndexedDB
 * interface. This is primary purpose because a bug storing files on Chromium
 * implementation (http://code.google.com/p/chromium/issues/detail?id=108012).
 * The drawback is that since it's implemented using pure JavaScript objects,
 * well... the data persistence lacks about some functionality... :-P
 * @author piranna
 */
window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;


/**
 * Test if IndexedDB has support for Blob objects
 * @param {Function} callback Callback called when support have been checked
 */
function testIDBBlobSupport(callback)
{
  var dbname = "detect-blob-support";
  var idb = indexedDB;

  idb.deleteDatabase(dbname).onsuccess = function()
  {
    var request = idb.open(dbname, 1);
    request.onupgradeneeded = function()
    {
      request.result.createObjectStore("store");
    };
    request.onsuccess = function()
    {
      var db = request.result;
      try
      {
        db.transaction("store", "readwrite").objectStore("store").put(new Blob(), "key");
        callback(true);
      }
      catch(e)
      {
        callback(false);
      }
      finally
      {
        db.close();
        idb.deleteDatabase(dbname);
      }
    };
  };
}


/**
 * Overwrites and install an only-memory IndexedDB object with support for Blob
 */
function IdbJS_install()
{
    /**
     * @constructor
     */
	function IDBRequest()
	{
	  this.target = {}
	}
	IDBRequest.prototype =
	{
	  set onsuccess(func)
	  {
	    this._onsuccess = func
	    var event = {target: this.target}
	    func.call(this, event)
	  }
	}

    /**
     * @constructor
     */
	function IDBOpenRequest()
	{
	  IDBRequest.call(this)

//      this.prototype.__defineSetter__("onupgradeneeded", function(func)
//      {
//        var event = {target: this.target}
//        func.call(this, event)
//      })
	}
	IDBOpenRequest.prototype = new IDBRequest()


    /**
     * @constructor
     */
	function IDBCursor()
	{
	  this._objects = []
	  this._index = 0

	  this.continue = function()
	  {
	    this._index += 1

        var event = {target: {}}
        if(this.value)
            event.target.result = this
	    this._request._onsuccess(event)
	  }
	}
    IDBCursor.prototype =
    {
      get value()
      {
        return this._objects[this._index]
      }
    }

    /**
     * @constructor
     */
	function IDBObjectStore()
	{
	  var objects = {}

      this.add = function(value, key)
      {
        return this.put(value, key)
      }
      this.delete = function(key)
      {
        delete objects[key]

        return new IDBRequest()
      }
	  this.get = function(key)
	  {
	    var request = new IDBRequest()
	        request.result = objects[key]
	    return request
	  }
	  this.openCursor = function(range)
	  {
        var request = new IDBRequest()

        if(Object.keys(objects).length)
        {
            // Fill the cursor with the objectstore objects
            var cursor = new IDBCursor()
            for(var key in objects)
                cursor._objects.push(objects[key])

            // Link the request and the cursor between them
            request.target.result = cursor
            cursor._request = request
        }

	    return request
	  }
	  this.put = function(value, key)
	  {
	    if(this.keyPath)
	    {
	       if(key)
	           throw DOMException
	       key = value[this.keyPath]
	    }

       if(!key)
           throw DOMException

	    objects[key] = value

	    var request = new IDBRequest()
	        request.result = objects[key]
	    return request
	  }
	}

    /**
     * @constructor
     */
	function IDBTransaction()
	{
	  this.objectStore = function(name)
	  {
	    return this.db._stores[name]
	  }
	}

	function IDBDatabase()
	{
	  this._stores = {}

      this.createObjectStore = function(name, optionalParameters)
      {
        var objectStore = new IDBObjectStore()
        if(optionalParameters)
            objectStore.keyPath = optionalParameters.keyPath

        this._stores[name] = objectStore
      }

      this.setVersion = function(version)
      {
        this.version = version

        return new IDBRequest()
      }

	  this.transaction = function(storeNames, mode)
	  {
	    var result = new IDBTransaction()
	        result.db = this

	    return result
	  }
	}


    window.indexedDB._dbs = {}
    window.indexedDB.open = function(name, version)
	{
	  this._dbs[name] = this._dbs[name] || new IDBDatabase()

	  var request = new IDBOpenRequest()
	      request.result = this._dbs[name]
	  return request
	}
}