/**
 * Update the SharedPoints and hash its files
 * @param {IDBDatabase} db ShareIt! database
 * @param {Function|null} policy Function to manage the policy access
 */
function Hasher(db, policy)
{
    var queue = []
    var timeout

    var self = this

    /**
     * Refresh hashes after one hour
     */
    function updateTimeout()
    {
        clearTimeout(timeout)
        timeout = setTimeout(function()
        {
            self.refresh()
//        }, 30*1000)
        }, 60*60*1000)
    }

    /**
     * Delete a {Fileentry} (mainly because it was removed from the filesystem)
     * @param {Fileentry} fileentry {Fileentry} to be removed from database
     */
    function fileentry_delete(fileentry)
    {
        // Remove file from the database
        db.files_delete(fileentry.hash, function()
        {
            // Notify that the file have been deleted
            if(self.ondeleted)
                self.ondeleted(fileentry)
        })
    }

    /**
     * Set a {Fileentry} as hashed and store it on the database
     * @param {Fileentry} fileentry {Fileentry} to be added to the database
     */
    function fileentry_hashed(fileentry)
    {
        // Remove hashed file from the queue
        queue.splice(queue.indexOf(fileentry.file))

        /**
         * Add file to the database
         */
        function addFile(fileentry)
        {
            db.files_put(fileentry, function()
            {
                // Notify that the file have been hashed
                if(self.onhashed)
                    self.onhashed(fileentry)
            })
        }

//        // Dropbox plugin start
//        if(dropboxClient
//        && fileentry.sharedpoint == "Dropbox")
//        {
//            var options = {download: true, downloadHack: true}
//
//            dropboxClient.makeUrl(fileentry.path+'/'+name, options,
//            function(error, publicUrl)
//            {
//                if(publicUrl)
//                    fileentry.dropbox = publicUrl.url
//
//                addFile(fileentry)
//            })
//        }
//        else
//        // Dropbox plugin end
            addFile(fileentry)
    }

    var worker = new Worker('../../public/javascripts/webp2p/hasher/worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data[1]

            switch(event.data[0])
            {
                case 'delete':
                    fileentry_delete(fileentry)
                    break

                case 'hashed':
                    fileentry_hashed(fileentry)
            }

            // Update refresh timeout after each worker message
            updateTimeout()
        }

    /**
     * Hash the files from a {Sharedpoint}.
     * @param {Array} files List of files to be hashed
     */
    this.hash = function(files, sharedpoint_name)
    {
      // Ignore files that are already on the queue
      for(var j=0, q; q=queue[j]; j++)
        for(var i=0, sp; sp=files[i];)
        {
          // File has zero size
          if(!sp.size)
          {
            // Precalculated hash for zero sized files
            sp.hash = "z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg=="
            fileentry_hashed(sp)

            files.splice(i)
          }

          // File is already on the queue list
          else if(sp == q)
            files.splice(i)

          // Normal file, hash it
          else
            i++;
        }

      // If any file was not on the queue, hash it
      if(files.length)
      {
        files = Array.prototype.slice.call(files)
        queue = queue.concat(files)


        // Run over all the files on the queue and process them
        for(var i=0, file; file=files[i]; ++i)
        {
            var path = file.webkitRelativePath.split('/').slice(1,-1).join('/')
            var fileentry = {'sharedpoint': sharedpoint_name,
                             'path': path, 'file': file}

            worker.postMessage(['hash',fileentry]);
        }
      }
    }

    /**
     * Refresh the {Sharedpoint}s and {Fileentry}s on the database
     */
    this.refresh = function()
    {
        // Hasher is working, just return
        if(timeout == 'hashing')
            return

        // Hasher is not working, start hashing files
        console.info("Starting hashing refresh")

        clearTimeout(timeout)
        timeout = 'hashing'

        sharedpointsManager.getSharedpoints(function(sharedpoints)
        {
            db.files_getAll(null, function(fileentries)
            {
                /**
                 * Check if the sharedpoint of a file exists or have been removed
                 */
                function sharedpoint_exist(name)
                {
                    for(var i=0; i<sharedpoints.length; i++)
                        if(sharedpoints[i].name == name)
                            return true
                }

                // Remove all unaccesible files
                for(var i=0, fileentry; fileentry=fileentries[i]; i++)
                    if(fileentry.sharedpoint)
                    {
                        // Sharedpoint was removed, remove the file from database
                        if(!sharedpoint_exist(fileentry.sharedpoint.name))
                            delete_fileentry(fileentry)

                        // File is a real filesystem one, rehash it
                        else if(fileentry.file)
                            worker.postMessage(['refresh',fileentry]);
                    }

                // Update timeout for the next refresh walkabout
                if(sharedpoints.length & policy)
                    policy(updateTimeout)
                else
                    updateTimeout()
            })
        })
    }

    // Start hashing new files from the shared points on load
//    self.refresh()
}
