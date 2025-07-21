module.exports = function(RED) {
    function DobotConnectionControlNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.action = config.action || "connect";
        
        if (!this.connection) {
            this.error("No connection configured");
            return;
        }
        
        // Update status based on connection
        const updateStatus = () => {
            if (node.connection.connected) {
                node.status({fill: "green", shape: "dot", text: "connected"});
            } else {
                node.status({fill: "red", shape: "ring", text: "disconnected"});
            }
        };
        
        // Register with connection
        this.connection.on('status', updateStatus);
        updateStatus();
        
        // Handle input messages
        this.on('input', function(msg, send, done) {
            // For Node-RED 0.x compatibility
            send = send || function() { node.send.apply(node, arguments) };
            done = done || function(err) { if(err) node.error(err, msg) };
            
            const action = msg.action || node.action;
            
            try {
                if (action === "connect") {
                    if (node.connection.connected) {
                        msg.payload = "Already connected";
                        msg.connected = true;
                    } else {
                        node.connection.connect();
                        msg.payload = "Connection initiated";
                        msg.connected = false;
                    }
                } else if (action === "disconnect") {
                    if (!node.connection.connected) {
                        msg.payload = "Already disconnected";
                        msg.connected = false;
                    } else {
                        node.connection.disconnect();
                        msg.payload = "Disconnected";
                        msg.connected = false;
                    }
                } else if (action === "status") {
                    msg.payload = node.connection.connected ? "Connected" : "Disconnected";
                    msg.connected = node.connection.connected;
                } else {
                    done(`Unknown action: ${action}`);
                    return;
                }
                
                send(msg);
                done();
            } catch(err) {
                done(err);
            }
        });
        
        // Cleanup
        this.on('close', function() {
            if (node.connection) {
                node.connection.removeListener('status', updateStatus);
            }
        });
    }
    
    RED.nodes.registerType("dobot-connection-control", DobotConnectionControlNode);
}