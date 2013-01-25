function Transport_Presence_init(transport, peersManager, max_connections)
{
    // Count the maximum number of pending connections allowed to be
    // done with this handshake server (undefined == unlimited)
    transport.connections = 0
    transport.max_connections = max_connections

    transport.presence = function()
    {
        transport.emit('presence', peersManager.uid)
    }

    transport.addEventListener('presence', function(event)
    {
        var uid = event.data[0]

        // Don't try to connect to ourselves
        if(uid != peersManager.uid)
        {
            // Check if we should ignore this new peer to increase
            // entropy in the network mesh

            // Do the connection with the new peer
            peersManager.connectTo(uid, function()
            {
                // Increase the number of connections reached throught
                // this handshake server
                transport.connections++

                // Close connection with handshake server if we got its
                // quota of peers
                if(transport.connections == transport.max_connections)
                   transport.close()
            },
            function(uid, peer, channel)
            {
                console.error(uid, peer, channel)
            },
            transport)
        }
    })
}


/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration
 */
function HandshakeManager(json_uri, peersManager)
{
    var self = this

    var channels = {}
    var status = 'disconnected'


    function nextHandshake(configuration)
    {
        // Remove the configuration from the poll
        configuration.splice(index, 1)

        // If there are more pending configurations, go to the next one
        if(configuration.length)
            getRandomHandshake(configuration)

        // There are no more pending configurations and all channels have been
        // closed, set as disconnected and notify to the PeersManager
        else if(!Object.keys(channels).length)
        {
            status = 'disconnected'

            peersManager.handshakeDisconnected()
        }
    }


    /**
     * Get a random handshake channel or test for the next one
     * @param {Object} configuration Handshake servers configuration
     */
    function getRandomHandshake(configuration)
    {
        var index = Math.floor(Math.random()*configuration.length)
        var index = 0   // Forced until redirection works

        var type = configuration[index][0]
        var conf = configuration[index][1]

        var channelConstructor
        switch(type)
        {
            case 'PubNub':
                conf.uuid = peersManager.uid
                channelConstructor = Handshake_PubNub
                break;

            case 'SimpleSignaling':
                conf.uid = peersManager.uid
                channelConstructor = Handshake_SimpleSignaling
                break;

            default:
                console.error("Invalidad handshake server type '"+type+"'")

                // Try to get an alternative handshake channel
                nextHandshake()
        }

        var channel = new channelConstructor(conf)
            channel.isPubsub = true
            channel.uid = type
            channels[channel.uid] = channel

        Transport_init(channel)
        Transport_Presence_init(channel, peersManager, conf.max_connections)
        Transport_Routing_init(channel, peersManager)

        channel.onopen = function()
        {
            status = 'connected'

            // Notify our presence to the other peers on the handshake server
            channel.presence()

            if(self.onopen)
               self.onopen()
        }
        channel.onclose = function()
        {
            // Delete the channel from the current ones
            delete channels[channel.uid]

            // Try to get an alternative handshake channel
            nextHandshake(configuration)
        }
        channel.onerror = function(error)
        {
            console.error(error)

            // Close the channel (and try with the next one)
            channel.close()
        }
    }


    /**
     * Get the channels of all the connected peers and handshake servers
     */
    this.getChannels = function()
    {
        return channels
    }


    var http_request = new XMLHttpRequest();
        http_request.open("GET", json_uri);
        http_request.onload = function()
        {
            if(this.status == 200)
            {
                status = 'connecting'

                var configuration = JSON.parse(http_request.response)

                if(configuration.length)
                    getRandomHandshake(configuration)

                else if(self.onerror)
                {
                    status = 'disconnected'

                    self.onerror('Handshake servers configuration is empty')
                }
            }

            else if(self.onerror)
                self.onerror('Unable to fetch handshake servers configuration')
        };
        http_request.onerror = function()
        {
            if(self.onerror)
                self.onerror('Unable to fetch handshake servers configuration')
        }
        http_request.send();
}