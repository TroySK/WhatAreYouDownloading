var chunksize = 65536


/**
 * Addapt a transport layer to be used as a peer
 * @param transport
 * @param {IDBdatabase} db WebP2P database
 * @param {PeersManager} peersManager {PeersManager} object
 */
function Transport_Peer_init(transport, db, peersManager)
{
    /**
     * Check if we already have the file and set it references to our copy
     * @param {Fileentry} fileentry {Fileentry} to be checked
     * @param {Array} fileslist List of {Fileentry}s
     */
    function check_ifOwned(fileentry, fileslist)
    {
        // We add here ad-hoc the channel of the peer where we got
        // the file since we currently don't have support for hashes
        // nor tracker systems
        fileentry.channel = transport

        // Check if we have the file already, and if so set it our copy
        // bitmap and blob reference
        for(var j=0, file_hosted; file_hosted = fileslist[j]; j++)
            if(fileentry.hash == file_hosted.hash)
            {
                fileentry.bitmap = file_hosted.bitmap
                fileentry.blob   = file_hosted.file || file_hosted.blob

                break;
            }
    }

    // fileslist

    var _fileslist = []

    /**
     * Catch new sended data for the other peer fileslist
     */
    transport.addEventListener('fileslist.send', function(event)
    {
        var fileentries = event.data[0]

        // Check if we have already any of the files
        // It's stupid to try to download it... and also give errors
        db.files_getAll(null, function(fileslist)
        {
            for(var i=0, fileentry; fileentry = fileentries[i]; i++)
                check_ifOwned(fileentry, fileslist)

            // Update the peer's fileslist with the checked data
            _fileslist = fileentries

            // Notify about fileslist update
            transport.dispatchEvent({type: "fileslist._updated",
                                     data: [_fileslist]})
        })
    })

    /**
     * Request the other peer fileslist
     */
    transport.fileslist_query = function(flags)
    {
        transport.emit('fileslist.query', flags);
    }

    /**
     * Request to the other peer don't send fileslist updates
     */
    transport.fileslist_disableUpdates = function()
    {
        transport.emit('fileslist.disableUpdates');
    }


    // fileslist updates

    /**
     * Catch when the other peer has added a new file
     */
    transport.addEventListener('fileslist.added', function(event)
    {
        var fileentry = event.data[0]

        // Check if we have the file previously listed
        for(var i=0, listed; listed = _fileslist[i]; i++)
            if(fileentry.path == listed.path
            && fileentry.name == listed.name)
                return

        // Check if we have already the files
        db.files_getAll(null, function(fileslist)
        {
            check_ifOwned(fileentry, fileslist)

            // Add the fileentry to the fileslist
            _fileslist.push(fileentry)

            // Notify about fileslist update
            transport.dispatchEvent({type: "fileslist._updated",
                                     data: [_fileslist]})
        })
    })

    /**
     * Catch when the other peer has deleted a file
     */
    transport.addEventListener('fileslist.deleted', function(event)
    {
        var fileentry = event.data[0]

        // Search for the fileentry on the fileslist
        for(var i=0, listed; listed = _fileslist[i]; i++)
            if(fileentry.path == listed.path
            && fileentry.name == listed.name)
            {
                // Remove the fileentry for the fileslist
                _fileslist.splice(i, 1)

                // Notify about fileslist update
                transport.dispatchEvent({type: "fileslist._updated",
                                         data: [_fileslist]})

                return
            }
    })


    // transfer

    /**
     * Catch new sended data for a file
     */
    transport.addEventListener('transfer.send', function(event)
    {
        var hash = event.data[0]
        var chunk = parseInt(event.data[1])
        var data = event.data[2]

        // Fix back data transmited as UTF-8 to binary
        var byteArray = new Uint8Array(data.length);
        for(var i = 0; i < data.length; i++)
            byteArray[i] = data.charCodeAt(i) & 0xff;

        data = byteArray

        db.files_get(hash, function(fileentry)
        {
            peersManager.updateFile(fileentry, chunk, data)
        })
    })

    /**
     * Request (more) data for a file
     * @param {Fileentry} Fileentry of the file to be requested
     * @param {Number} chunk Chunk of the file to be requested
     */
    transport.transfer_query = function(fileentry, chunk)
    {
        transport.emit('transfer.query', fileentry.hash, chunk)
    }
}