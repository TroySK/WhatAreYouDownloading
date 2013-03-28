# WebP2P - Pure Javascript framework for Peer to Peer applications over WebRTC
## How handshake works

3The initial connections of the peers to the WebP2P network is achieved thanks
to a handshake server. The purposes of this servers are just two:

1. Register new peers wanting to connect to the network and notify it's presence
   to another ones already connected.
2. Share SDPs between new and old, already connected peers so new peers would
   be able to connect to the WebP2P network using old ones as "reverse proxies".

To do it, the HandshakeManager has a list of configuration values for different
handshake servers to whom connect (A handshake server is an external service
that allow to send a receive messages both in broadcast and unicast (directly or
with some coding) in an anonimous way. Examples of it would be PubNub,
SimpleSignaling or the PubSubHubbub (PuSH) protocols.). This handshake servers
are being connected one at a time in order or randomly, until their peers quota
is connected (by default the half of the maximus simultaneously connected peers)
before disconnect and connect to the next one until there's no more handshake
servers configured. On that moment, the system checks if we are currently
connected to any peer and if not the user is informed to re-try the reconnection
to the WebP2P network by hand re-trying to connect to the configured handshake
servers or adding a new one. If trying to connect to a handshake server this
wouldn't be possible by an error, the HandshakeManager will try to connect to
the next one inmediatly.

The format of the handshake messages is just a JSON encoded plain array, being
the first element the peer UUID (the "origin" field), the second one the remote
peer UUID or null/undefined for broadcast (the "dest" field) and the third one
the data to be send (the "data" field). When a peer gets connected to a
handshake server, it sends a message just with just the "origin" field. Since
this message don't have a "dest" field (broadcast) and has no data, it's
detected by others peers as a "presence message". When other peers detect this
message, they would decide to connect to it by two algorithms: try to connect to
every new connection they detect until their handshake server quota is filled
(they get to be fullfilled connected faster but on peers very concentrate on the
time) or with a random proportionality to their pending quota (slower to fill
their quota and maybe would reach the handshake server maximus simultaneous
peers but more distributed over the time while maintaining a lot of connections
at the begining). If they decide to stablish a connection with the new peer,
they send a message with their peer UUID, the newly connecte peer UUID and a two
elements array as the data field filled with the "offer" string on the first one
(the "action") and the SDP content on string format (the "data").

After the connection is stablished, the old peer increase its peers quota and if
it has fully filled it, close the connection with the handshake server and
connect to the next one. This way, the old ones don't consume resources on the
handshake server and can get disconnected from any public network and server as
early as they can keep working exclusively on the WebP2P network reducing the
danger of getting disconnected because all their connecte peers has dissapeared,
while forcing to the new ones to help to increase the arity of the network
maintaining all the peers connected to only one mesh.