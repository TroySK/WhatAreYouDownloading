/**
 * Init a channel as an event-based transport layer
 * @param transport
 */
function Transport_init(transport)
{
    EventTarget.call(transport)

    /**
     *  Compose and send message
     */
    transport.emit = function()
    {
        var args = Array.prototype.slice.call(arguments, 0);

        transport.send(JSON.stringify(args), function(error)
        {
            if(error)
                console.warn(error);
        });
    }

    /**
     *  Message received
     */
    transport.onmessage = function(message)
    {
        message = JSON.parse(message.data)

        var event = {'type': message[0], 'data': message.slice(1)}

        transport.dispatchEvent(event)
    }
}