/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object
 */
function Handshake_SimpleSignaling(configuration)
{
    var self = this

    // Connect a handshake channel to the XMPP server
    var handshake = new SimpleSignaling(configuration);
        handshake.onopen = function(uid)
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                handshake.send(uid, data);
            }

            handshake.onmessage = function(uid, data)
            {
                if(self.onmessage)
                    self.onmessage(uid, data)
            }

            // Set handshake channel as open
            if(self.onopen)
                self.onopen(uid)
        }
        handshake.onerror = function(error)
        {
            if(self.onerror)
                self.onerror(error)
        }
}