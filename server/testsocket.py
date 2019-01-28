# python3 -m pip install websocket-client
import websocket 
 
ws = websocket.WebSocket()

sockName = input("Local or Server socket (l/<not l>): ")

# Connect to host url
if sockName == 'l':
    ws.connect( "ws://localhost:8888/codex" )
else:
    ws.connect( "wss://codex.jpl.nasa.gov/codex" )

send_string = '{"routine":"Testing WebSocket","cid":0}'

print( "Sending: " + send_string )
# Use ws.send() to send data to server
ws.send( send_string )

# Use ws.recv() to get the data sent from server
result = ws.recv()
print( "Received: " + result )

# Use ws.close() to close the WebSocket handshake
ws.close()