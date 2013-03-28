// Fallbacks for vendor-specific variables until the spec is finalized.
var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;


/**
 * @classdesc Manager of the communications with the other peers
 * @constructor
 * @param {IDBDatabase} db ShareIt! database
 * @param {String} [stun_server="stun.l.google.com:19302"] URL of the server
 * used for the STUN communications
 */
function PeersManager(db, stun_server)
{
    // Set a default STUN server if none is specified
    if(stun_server == undefined)
		stun_server = "stun.l.google.com:19302";

    EventTarget.call(this)

    var peers = {}

    var self = this


    /**
     * UUID generator
     */
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

    this.uid = UUIDv4()

    /**
     * Get the channel of one of the peers that have the file from its hash.
     * Since the hash and the tracker system are currently not implemented we'll
     * get just the channel of the peer where we got the file that we added
     * ad-hoc before
     * @param {Fileentry} Fileentry of the file to be downloaded
     * @returns {RTCDataChannel} Channel where we can ask for data of the file
     */
    function getChannel(fileentry)
    {
        return fileentry.channel
    }

    /**
     * Request (more) data for a file
     * @param {Fileentry} Fileentry of the file to be requested
     */
    function transfer_query(fileentry)
    {
        var channel = getChannel(fileentry)
        var chunk = fileentry.bitmap.getRandom(false)

        channel.transfer_query(fileentry, chunk)
    }

    /**
     * Start the download of a file
     * @param {Fileentry} Fileentry of the file to be downloaded
     */
    this._transferbegin = function(fileentry)
    {
        function onerror(errorCode)
        {
            console.error("Transfer begin: '"+fileentry.name+"' is already in database.")
        }

        // Add a blob container to our file stub
        fileentry.blob = new Blob([''], {"type": fileentry.type})

        // File size is zero, generate the file instead of request it
        if(!fileentry.size)
        {
            // Insert new empty "file" inside IndexedDB
            db.files_add(fileentry,
            function()
            {
                self.transfer_end(fileentry)
            },
            onerror)

            return
        }

        // Calc number of necesary chunks to download
        // and add a bitmap to our file stub
        var chunks = fileentry.size/chunksize;
        if(chunks % 1 != 0)
            chunks = Math.floor(chunks) + 1;

        fileentry.bitmap = new Bitmap(chunks)

        // Insert new "file" inside IndexedDB
        db.files_add(fileentry,
        function()
        {
            self.dispatchEvent({type: "transfer.begin", data: [fileentry]})

            // Demand data from the begining of the file
            transfer_query(fileentry)
        },
        onerror)
    }

    this.transfer_update = function(fileentry, pending_chunks)
    {
        var chunks = fileentry.size/chunksize;
        if(chunks % 1 != 0)
            chunks = Math.floor(chunks) + 1;

        // Notify about transfer update
        this.dispatchEvent({type: "transfer.update",
                            data: [fileentry, 1 - pending_chunks/chunks]})
    }

    this.transfer_end = function(fileentry)
    {
        // Auto-save downloaded file
        savetodisk(fileentry.blob, fileentry.name)

        // Notify about transfer end
        self.dispatchEvent({type: "transfer.end", data: [fileentry]})
        console.log("Transfer of "+fileentry.name+" finished!");
    }

    /**
     * Update the data content of a {Fileentry}
     * @param {Fileentry} fileentry {Fileentry} to be updated
     * @param {Number} chunk Chunk position to be updated
     * @param data Data to be set
     */
    this.updateFile = function(fileentry, chunk, data)
    {
        fileentry.bitmap.set(chunk, true)

        // Create new FileWriter
        var fw = new FileWriter(fileentry.blob)

        // Calc and set pos, and increase blob size if necessary
        var pos = chunk * chunksize;
        if(fw.length < pos)
            fw.truncate(pos)
        fw.seek(pos)

        // Write data to the blob
        var blob = fw.write(data)

        // This is not standard, but it's the only way to get out the
        // created blob
        if(blob != undefined)
            fileentry.blob = blob

        // Check for pending chunks and require them or save the file
        var pending_chunks = fileentry.bitmap.indexes(false).length

        if(pending_chunks)
        {
            // Demand more data from one of the pending chunks after update
            // the fileentry status on the database
            db.files_put(fileentry, function()
            {
                self.transfer_update(fileentry, pending_chunks)

                transfer_query(fileentry)
            })
        }
        else
        {
            // There are no more chunks, set file as fully downloaded
            delete fileentry.bitmap;

            db.files_put(fileentry, function()
            {
                self.transfer_end(fileentry)
            })
        }
    }

    /**
     * Notify to all peers that I have added a new file (both by the user or
     * downloaded)
     * @param {Fileentry} Fileentry of the file that have been added
     */
    this._send_file_added = function(fileentry)
    {
        var self = this

        this.dispatchEvent({type: "file.added", data: [fileentry]})

        for(var uid in peers)
            peers[uid]._channel._send_file_added(fileentry);

        // Update fileentry sharedpoint size
        db.sharepoints_get(fileentry.sharedpoint,
        function(sharedpoint)
        {
            // Increase sharedpoint shared size
            sharedpoint.size += fileentry.file.size

            db.sharepoints_put(sharedpoint, function()
            {
                self.dispatchEvent({type: "sharedpoints.update"})
            })
        })
    }

    /**
     * Notify to all peers that I have deleted a file (so it's not accesible)
     * @param {Fileentry} Fileentry of the file that have been deleted
     */
    this._send_file_deleted = function(fileentry)
    {
        var self = this

        this.dispatchEvent({type: "file.deleted", data: [fileentry]})

        for(var uid in peers)
            peers[uid]._channel._send_file_deleted(fileentry);

        // Update fileentry sharedpoint size
        db.sharepoints_get(fileentry.sharedpoint,
        function(sharedpoint)
        {
            // Increase sharedpoint shared size
            sharedpoint.size -= fileentry.file.size

            db.sharepoints_put(sharedpoint, function()
            {
                self.dispatchEvent({type: "sharedpoints.update"})
            })
        })
    }


    /**
     * Create a new RTCPeerConnection
     * @param {UUID} id Identifier of the other peer so later can be accessed
     * @returns {RTCPeerConnection}
     */
    function createPeerConnection(id)
	{
	    var pc = peers[id] = new RTCPeerConnection({"iceServers": [{"url": 'stun:'+stun_server}]});
	        pc.onstatechange = function(event)
	        {
	            // Remove the peer from the list of peers when gets closed
	            if(event.target.readyState == "closed")
	                delete peers[id]
	        }

	    return pc
	}

    /**
     * Initialize a {RTCDataChannel}
     * @param {RTCPeerConnection} pc PeerConnection owner of the DataChannel
     * @param {RTCDataChannel} channel Communication channel with the other peer
     */
	function initDataChannel(pc, channel, uid)
	{
        channel.uid = uid

        pc._channel = channel

        Transport_init(channel)

        Transport_Host_init(channel, db)
        Transport_Peer_init(channel, db, self)
        Transport_Routing_init(channel, self)
        Transport_Search_init(channel, db, self)

		channel.onclose = function()
		{
			delete pc._channel

			pc.close()
		}
	}


    /**
     * Process the offer to connect to a new peer
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Session Description Protocol data of the other peer
     * @returns {RTCPeerConnection} The (newly created) peer
     */
    this.onoffer = function(uid, sdp)
    {
        // Search the peer between the list of currently connected peers
        var peer = peers[uid]

        // Peer is not connected, create a new channel
        if(!peer)
        {
            peer = createPeerConnection(uid)
            peer.ondatachannel = function(event)
            {
                console.log("Created datachannel with peer "+uid)
                initDataChannel(peer, event.channel, uid)
            }
            peer.onerror = function(event)
            {
                if(onerror)
                    onerror(uid, event)
            }
        }

        // Process offer
        peer.setRemoteDescription(new RTCSessionDescription({sdp:  sdp,
                                                             type: 'offer'}));

        return peer
    }

    /**
     * Process the answer received while attempting to connect to the other peer
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Session Description Protocol data of the other peer
     * @param {Function} onerror Callback called if we don't have previously
     * wanted to connect to the other peer
     */
    this.onanswer = function(uid, sdp, onerror)
    {
        // Search the peer on the list of currently connected peers
        var peer = peers[uid]
        if(peer)
            peer.setRemoteDescription(new RTCSessionDescription({sdp:  sdp,
                                                               type: 'answer'}))
        else if(onerror)
            onerror(uid)
    }

    /**
     * Set the {SandshakeManager} to be used
     * @param {SandshakeManager} newHandshake The new {HandshakeManager}
     */
    this.setHandshakeManager = function(handshakeManager)
    {
        /**
         * Connects to another peer based on its UID. If we are already connected,
         * it does nothing.
         * @param {UUID} uid Identifier of the other peer to be connected
         * @param {Function} onsuccess Callback called when the connection was done
         * @param {Function} onerror Callback called when connection was not possible
         * @param {MessageChannel} incomingChannel Optional channel where to
         * send the offer. If not defined send it to all connected peers
         */
        this.connectTo = function(uid, onsuccess, onerror, incomingChannel)
        {
            // Search the peer between the list of currently connected peers
            var peer = peers[uid]

            // Peer is not connected, create a new channel
            if(!peer)
            {
                // Create PeerConnection
                peer = createPeerConnection(uid);
                peer.onopen = function()
                {
                    var channel = peer.createDataChannel('webp2p')
                    channel.onopen = function()
                    {
                        initDataChannel(peer, channel, uid)

                        if(onsuccess)
                            onsuccess(channel)
                    }
                    channel.onerror = function()
                    {
                        if(onerror)
                            onerror(uid, peer, channel)
                    }
                }
                peer.onerror = function()
                {
                    if(onerror)
                        onerror(uid, peer)
                }

                // Send offer to new PeerConnection
                peer.createOffer(function(offer)
                {
                    // Send the offer only for the incoming channel
                    if(incomingChannel)
                        incomingChannel.sendOffer(uid, offer.sdp)

                    // Send the offer throught all the peers
                    else
                    {
                        var channels = self.getChannels()

                        // Send the connection offer to the other connected peers
                        for(var channel_id in channels)
                            channels[channel_id].sendOffer(uid, offer.sdp)
                    }

                    // Set the peer local description
                    peer.setLocalDescription(new RTCSessionDescription({sdp: offer.sdp,
                                                                        type: 'offer'}))
                });
            }

            // Peer is connected and we have defined an 'onsucess' callback
            else if(onsuccess)
                onsuccess(peer._channel)
        }

        /**
         * Get the channels of all the connected peers and handshake servers
         */
        this.getChannels = function()
        {
            var channels = {}

            // Peers channels
            for(var uid in peers)
            {
                var channel = peers[uid]._channel
                if(channel)
                    channels[uid] = channel
            }

            // Handshake servers channels
            var handshakeChannels = handshakeManager.getChannels()
            for(var uid in handshakeChannels)
                if(handshakeChannels.hasOwnProperty(uid))
                    channels[uid] = handshakeChannels[uid]

            return channels
        }
    }


    this.handshakeDisconnected = function()
    {
        if(!this.numPeers())
            this.dispatchEvent({type: "error.noPeers"})
    }


    /**
     * Get the number of peers currently connected with this node
     * @returns {Number} The number of peers connected
     */
    this.numPeers = function()
    {
        return Object.keys(peers).length
    }
}
