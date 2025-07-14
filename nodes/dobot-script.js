module.exports = function(RED) {
    function DobotScriptNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.action = config.action;
        this.scriptName = config.scriptName;
        
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
        this.connection.register(this);
        this.connection.on('status', updateStatus);
        updateStatus();
        
        // Handle input messages
        this.on('input', function(msg, send, done) {
            // For Node-RED 0.x compatibility
            send = send || function() { node.send.apply(node, arguments) };
            done = done || function(err) { if(err) node.error(err, msg) };
            
            const action = msg.action || node.action;
            let cmdString = "";
            
            // Build command based on action
            switch(action) {
                case "RunScript":
                    const scriptName = msg.payload || msg.scriptName || node.scriptName;
                    if (!scriptName) {
                        done("Script name required for RunScript");
                        return;
                    }
                    cmdString = `RunScript(${scriptName})`;
                    break;
                    
                case "StopScript":
                    cmdString = "StopScript()";
                    break;
                    
                case "PauseScript":
                    cmdString = "PauseScript()";
                    break;
                    
                case "ContinueScript":
                    cmdString = "ContinueScript()";
                    break;
                    
                default:
                    done(`Unknown script action: ${action}`);
                    return;
            }
            
            // Send command
            node.connection.sendCommand(cmdString, function(err, response) {
                if (err) {
                    done(err);
                    return;
                }
                
                msg.payload = response;
                msg.command = action;
                msg.raw = cmdString;
                
                send(msg);
                done();
            });
        });
        
        // Cleanup
        this.on('close', function() {
            if (node.connection) {
                node.connection.deregister(node);
            }
        });
    }
    
    RED.nodes.registerType("dobot-script", DobotScriptNode);
}