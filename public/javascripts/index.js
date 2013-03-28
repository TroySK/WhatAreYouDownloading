function load()
{
    // Init database
    DB_init(function(db)
    {
        // Init PeersManager
        var peersManager = new PeersManager(db)

        // Init hasher
        var hasher = new Hasher(db, policy)
            hasher.onhashed  = function(fileentry)
            {
                // Notify the other peers about the new hashed file
                peersManager._send_file_added(fileentry)
            }
            hasher.ondeleted = function(fileentry)
            {
                // Notify the other peers about the deleted file
                peersManager._send_file_deleted(fileentry)
            }

        // Init handshake manager
        var handshakeManager = new HandshakeManager('public/json/handshake.json',
                                                    peersManager)
            handshakeManager.onerror = function(error)
            {
                console.error(error)
                alert(error)
            }
//            handshake.onopen = function()
//            {
//                // Restart downloads
//                db.files_getAll(null, function(filelist)
//                {
//                    if(filelist.length)
//                        policy(function()
//                        {
//                            for(var i=0, fileentry; fileentry=filelist[i]; i++)
//                                if(fileentry.bitmap)
//                                    peersManager.transfer_query(fileentry)
//                        })
//                })
//            }

        peersManager.setHandshakeManager(handshakeManager)

        // Init cache backup system
        var cacheBackup = new CacheBackup(db, peersManager)

        // Init sharedpoints manager
        var sharedpointsManager = new SharedpointsManager(db, hasher)

        // Init user interface
        var ui = new UI()
            ui.setCacheBackup(cacheBackup)
            ui.setPeersManager(peersManager, db)
            ui.setSharedpointsManager(sharedpointsManager)
    })
}


window.addEventListener("DOMContentLoaded", function()
//window.addEventListener("load", function()
{
	var cm = new CompatibilityManager()

	// DataChannel polyfill
    switch(DCPF_install("wss://datachannel-polyfill.nodejitsu.com"))
    {
		case "old browser":
			cm.addError("DataChannel", "Your browser doesn't support PeerConnection"+
									   " so file sharing can't work.")
	        break

		case "polyfill":
	        cm.addWarning("DataChannel", "Your browser doesn't support DataChannels"+
	        						  	 " natively, so file transfers performance "+
	        						  	 "would be affected or not work at all.")
    }

	// Filereader support (be able to host files from the filesystem)
	if(typeof FileReader == "undefined")
		cm.addWarning("FileReader", "Your browser doesn't support FileReader "+
									"so it can't work as a host.")

    // Check for IndexedDB support and if it store File objects
	testIDBBlobSupport(function(supported)
	{
	    if(!supported)
	    {
	    	cm.addWarning("IndexedDB", "Your browser doesn't support storing "+
	    							   "File or Blob objects. Data will not "+
	    							   "persists between each time you run the"+
	    							   " webapp.")

	       IdbJS_install();
	    }


		// Show alert if browser requeriments are not meet
	    cm.show()

	    // Start loading the webapp
		load()
	})
})
