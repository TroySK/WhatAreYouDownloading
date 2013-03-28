function UI() {
  EventTarget.call(this)

  // Config dialog
  this.dialogConfig = new DialogConfig("j-share");
}

UI.prototype = {
  setSharedpointsManager: function(sharedpointsManager) {
    this.dialogConfig.setSharedpointsManager(sharedpointsManager)
  },

  setPeersManager: function(peersManager, db) {
    var self = this;
    peersManager.addEventListener("error.noPeers", function() {
      console.error("Not connected to any peer")

      // Allow backup of cache if there are items
      self.preferencesDialogOpen
    });
    // Set UID on user interface
    $("#UID-home").val(peersManager.uid)

    // Sharedpoints table
    var tableSharedpoints

    function sharedpoints_update() {
      // Get shared points and init them with the new ones
      db.sharepoints_getAll(null, function(sharedpoints) {
        tableSharedpoints.update(sharedpoints)
      })
    }

    tableSharedpoints = new TableSharedpoints('Sharedpoints', function(fileentry) {
      return function() {
        db.sharepoints_delete(fileentry.name, sharedpoints_update)
      }
    })

    this.addEventListener("sharedpoints.update", sharedpoints_update)
    peersManager.addEventListener("sharedpoints.update", sharedpoints_update)

    this.preferencesDialogOpen = function(tabIndex) {
      // Get shared points and init them
      sharedpoints_update()
    }


    // Downloading tab
    var tabDownloading = new TabDownloading('Downloading', this.preferencesDialogOpen)

    function tabDownloading_update(event) {
        db.files_getAll(null, function(filelist) {
          var downloading = []

          for(var i = 0, fileentry; fileentry = filelist[i]; i++)
          if(fileentry.bitmap) downloading.push(fileentry)

          // Update Downloading files list
          self.isDownloading = downloading.length
          tabDownloading.update(downloading)
        })
      }

    peersManager.addEventListener("transfer.begin", tabDownloading_update)
    peersManager.addEventListener("transfer.update", function(event) {
      var type = event.data[0]
      var value = event.data[1]

      tabDownloading.dispatchEvent({
        type: type,
        data: [value]
      })
    })
    peersManager.addEventListener("transfer.end", tabDownloading_update)


    // Sharing tab
    var tabSharing = new TabSharing('Sharing', this.preferencesDialogOpen)

    function tabSharing_update() {
        db.files_getAll(null, function(filelist) {
          var sharing = []

          for(var i = 0, fileentry; fileentry = filelist[i]; i++)
          if(!fileentry.bitmap) sharing.push(fileentry)

          // Update Sharing files list
          self.isSharing = sharing.length
          tabSharing.update(sharing)
        })
      }

    peersManager.addEventListener("transfer.end", tabSharing_update)

    peersManager.addEventListener("file.added", tabSharing_update)
    peersManager.addEventListener("file.deleted", tabSharing_update)

    // Show files being shared on Sharing tab
    tabSharing_update()


    // Peers tabs
    var tabs = new TabsPeers("tabs")

    /**
     * User initiated process to connect to a remote peer asking for the UID
     */

    function ConnectUser() {
      if(!Object.keys(peersManager.getChannels()).length) {
        alert("There's no routing available, wait some more seconds")
        return
      }

      var uid = prompt("UID to connect")
      if(uid != null && uid != '') {
        // Create connection with the other peer
        peersManager.connectTo(uid, function(channel) {
          tabs.openOrCreate(uid, self.preferencesDialogOpen, peersManager, channel)
        }, function(uid, peer, channel) {
          console.error(uid, peer, channel)
        })
      }
    }

    $("#j-connectUser").click(ConnectUser);

    /**
     * Prevent to close the webapp by accident
     */
    window.onbeforeunload = function() {
      // Allow to exit the application normally if we are not connected
      var peers = Object.keys(peersManager.getChannels()).length
      if(!peers) return

      // Downloading
      if(self.isDownloading) return "You are currently downloading files."

      // Sharing
      if(self.isSharing) return "You are currently sharing files."

      // Routing (connected to at least two peers or handshake servers)
      if(peers >= 2) return "You are currently routing between " + peers + " peers."
    }
  },

  setCacheBackup: function(cacheBackup) {
    this.dialogConfig.setCacheBackup(cacheBackup)
  }
}