window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

/**
 * Initializes the database
 * @param {Function} onsuccess Callback called when database is ready
 */
function DB_init(onsuccess)
{
	var version = 2

	function upgradedb(db)
	{
	    // Create an objectStore to hold information about the share points.
	    db.createObjectStore("sharepoints", { keyPath: "name" });

	    // Create an objectStore to hold information about the shared files.
	    // We're going to use "hash" as our key path because it's guaranteed to
	    // be unique.
	    db.createObjectStore("files", { keyPath: "hash" });
	}

	var request = indexedDB.open("ShareIt", version);
	    request.onerror = function(event)
	    {
	        alert("Why didn't you allow my web app to use IndexedDB?!");
	    };
	    request.onsuccess = function(event)
	    {
	        var db = request.result;

	        // Hack for old versions of Chrome/Chromium
	        if(version != db.version)
	        {
	            var setVrequest = db.setVersion(version);
	                setVrequest.onsuccess = function(e)
	                {
	                    upgradedb(db);
	                };
	        }

	        /**
	         * Add an object to the specified {IDBObjectStore}
	         * @param {String} objectStore Name of the {IDBObjectStore}
	         * @param {Object} data Object to be added to the {IDBObjectStore}
             * @param {Function} onsuccess Callback called when object was added
             * @param {Function} onerror Callback called when object was not
             * able to be added
	         */
            db._add = function(objectStore, data, onsuccess, onerror)
            {
                var transaction = db.transaction(objectStore, "readwrite");
                var objectStore = transaction.objectStore(objectStore);

                var request = objectStore.add(data);
                if(onsuccess != undefined)
                    request.onsuccess = function(event)
                    {
                        onsuccess(request.result)
                    };
                if(onerror != undefined)
                    request.onerror = function(event)
                    {
                        onerror(event.target.errorCode)
                    }
            }

            /**
             * Delete an object from the specified {IDBObjectStore}
             * @param {String} objectStore Name of the {IDBObjectStore}
             * @param {String} key Name of the key to deleted on the
             * {IDBObjectStore}
             * @param {Function} onsuccess Callback called when object was
             * deleted
             * @param {Function} onerror Callback called when key was not able
             * to be deleted
             */
            db._delete = function(objectStore, key, onsuccess, onerror)
            {
                var transaction = db.transaction(objectStore, "readwrite");
                var objectStore = transaction.objectStore(objectStore);

                var request = objectStore.delete(key);
                if(onsuccess != undefined)
                    request.onsuccess = function(event)
                    {
                        onsuccess(request.result)
                    };
                if(onerror != undefined)
                    request.onerror = function(event)
                    {
                        onerror(event.target.errorCode)
                    }
            }

            /**
             * Get an object from the specified {IDBObjectStore}
             * @param {String} objectStore Name of the {IDBObjectStore}
             * @param {String} key Name of the key to be get from the
             * {IDBObjectStore}
             * @param {Function} onsuccess Callback called when object was
             * gotten
             * @param {Function} onerror Callback called when object was not
             * able to be gotten
             */
	        db._get = function(objectStore, key, onsuccess, onerror)
	        {
	            var transaction = db.transaction(objectStore);
	            var objectStore = transaction.objectStore(objectStore);

		        var request = objectStore.get(key);
                    request.onsuccess = function(event)
                    {
                        onsuccess(request.result);
                    };
                if(onerror != undefined)
                    request.onerror = function(event)
                    {
                        onerror(event.target.errorCode)
                    };
	        }

            /**
             * Get all objects from the specified {IDBObjectStore}
             * @param {String} objectStore Name of the {IDBObjectStore}
             * @param {IDBRange|null} range Range to delimit keys to be gotten
             * @param {Function} onsuccess Callback called when objects were
             * gotten
             * @param {Function} onerror Callback called when object were not
             * able to be gotten
             */
	        db._getAll = function(objectStore, range, onsuccess, onerror)
	        {
	            var result = [];

	            var transaction = db.transaction(objectStore);
	            var objectStore = transaction.objectStore(objectStore);

		        var request = objectStore.openCursor(range)
                    request.onsuccess = function(event)
                    {
                        var cursor = event.target.result;
                        if(cursor)
                        {
                            result.push(cursor.value);
                            cursor.continue();
                        }
                        else
                            onsuccess(result);
                    };
                if(onerror != undefined)
                    request.onerror = function(event)
                    {
                        onerror(event.target.errorCode);
                    };
	        }

            /**
             * Update or add an object on the specified {IDBObjectStore}
             * @param {String} objectStore Name of the {IDBObjectStore}
             * @param {Object} data Object to be added to the {IDBObjectStore}
             * @param {Function} onsuccess Callback called when object was
             * updated or added
             * @param {Function} onerror Callback called when object was not
             * able to be updated or added
             */
	        db._put = function(objectStore, data, onsuccess, onerror)
	        {
	            var transaction = db.transaction(objectStore, "readwrite");
	            var objectStore = transaction.objectStore(objectStore);

	            var request = objectStore.put(data);
	            if(onsuccess != undefined)
	                request.onsuccess = function(event)
	                {
	                    onsuccess(request.result)
	                };
	            if(onerror != undefined)
	                request.onerror = function(event)
	                {
	                    onerror(event.target.errorCode)
	                }
	        }

            /**
             * Add a {Sharedpoint}
             * @param {Sharedpoint} sharedpoint {Sharedpoint} to be added
             * @param {Function} onsuccess Callback called when the
             * {Sharedpoint} was added
             * @param {Function} onerror Callback called when the {Sharedpoint}
             * was not able to be added
             */
            db.sharepoints_add = function(sharedpoint, onsuccess, onerror)
            {
                db._add("sharepoints", sharedpoint, onsuccess, onerror);
            }

            /**
             * Delete a {Sharedpoint}
             * @param {String} key {Sharedpoint} to be deleted
             * @param {Function} onsuccess Callback called when the
             * {Sharedpoint} was deleted
             * @param {Function} onerror Callback called when the {Sharedpoint}
             * was not able to be deleted
             */
            db.sharepoints_delete = function(key, onsuccess, onerror)
            {
                db._delete("sharepoints", key, onsuccess, onerror);
            }

            /**
             * Get a {Sharedpoint}
             * @param {String} key {Sharedpoint} to be gotten
             * @param {Function} onsuccess Callback called when the
             * {Sharedpoint} was gotten
             * @param {Function} onerror Callback called when the {Sharedpoint}
             * was not able to be gotten
             */
            db.sharepoints_get = function(key, onsuccess, onerror)
            {
                db._get("sharepoints", key, onsuccess, onerror);
            }

            /**
             * Get all the {Sharedpoint}s
             * @param {IDBRange|null} range Range of {Sharedpoint}s to be gotten
             * @param {Function} onsuccess Callback called when the
             * {Sharedpoint}s were gotten
             * @param {Function} onerror Callback called when the {Sharedpoint}s
             * were not able to be gotten
             */
            db.sharepoints_getAll = function(range, onsuccess, onerror)
            {
                db._getAll("sharepoints", range, onsuccess, onerror);
            }

            /**
             * Update or add a {Sharedpoint}
             * @param {Sharedpoint} sharedpoint {Sharedpoint} to be updated or
             * added
             * @param {Function} onsuccess Callback called when the
             * {Sharedpoint} was updated or added
             * @param {Function} onerror Callback called when the {Sharedpoint}
             * was not able to be updated or added
             */
            db.sharepoints_put = function(sharedpoint, onsuccess, onerror)
            {
                db._put("sharepoints", sharedpoint, onsuccess, onerror);
            }

            /**
             * Add a {Fileentry}
             * @param {Fileentry} fileentry {Fileentry} to be added
             * @param {Function} onsuccess Callback called when the {Fileentry}
             * was added
             * @param {Function} onerror Callback called when the {Fileentry}
             * was not able to be added
             */
            db.files_add = function(fileentry, onsuccess, onerror)
            {
                db._add("files", fileentry, onsuccess, onerror);
            }

            /**
             * Delete a {Fileentry}
             * @param {String} key {Fileentry} to be deleted
             * @param {Function} onsuccess Callback called when the {Fileentry}
             * was deleted
             * @param {Function} onerror Callback called when the {Fileentry}
             * was not able to be deleted
             */
            db.files_delete = function(key, onsuccess, onerror)
            {
                db._delete("files", key, onsuccess, onerror);
            }

            /**
             * Get a {Fileentry}
             * @param {String} key {Fileentry} to be gotten
             * @param {Function} onsuccess Callback called when the {Fileentry}
             * was gotten
             * @param {Function} onerror Callback called when the {Fileentry}
             * was not able to be gotten
             */
            db.files_get = function(key, onsuccess, onerror)
            {
                db._get("files", key, onsuccess, onerror);
            }

            /**
             * Get all the {Fileentry}s
             * @param {IDBRange|null} range Range of {Fileentry}s to be gotten
             * @param {Function} onsuccess Callback called when the {Fileentry}s
             * were gotten
             * @param {Function} onerror Callback called when the {Fileentry}
             * was not able to be gotten
             */
            db.files_getAll = function(range, onsuccess, onerror)
            {
                db._getAll("files", range, onsuccess, onerror);
            }

            /**
             * Update or add a {Fileentry}
             * @param {Fileentry} fileentry {Fileentry} to be updated or added
             * @param {Function} onsuccess Callback called when the {Fileentry}
             * was updated or added
             * @param {Function} onerror Callback called when the {Fileentry}
             * was not able to be updated or added
             */
            db.files_put = function(fileentry, onsuccess, onerror)
            {
                db._put("files", fileentry, onsuccess, onerror);
            }

			if(onsuccess)
				onsuccess(db);
	    };
	    request.onupgradeneeded = function(event)
	    {
	        upgradedb(event.target.result);
	    };
}