module.exports = function(RED) {
    function DobotCommandNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.command = config.command;
        this.commandType = config.commandType;
        
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
            
            let cmdString = "";
            
            // Determine command to execute
            if (node.commandType === "custom") {
                // Use command from message or config
                cmdString = msg.payload || node.command || "";
                if (!cmdString) {
                    done("No command specified");
                    return;
                }
            } else if (node.commandType === "predefined") {
                // Use predefined command
                const command = msg.command || node.command;
                
                // Handle commands with parameters
                switch(command) {
                    case "EnableRobot":
                    case "DisableRobot":
                    case "ClearError":
                    case "ResetRobot":
                    case "RobotMode":
                    case "GetErrorID":
                    case "StopScript":
                    case "PauseScript":
                    case "ContinueScript":
                    case "Sync":
                    case "Pause":
                    case "Continue":
                        cmdString = `${command}()`;
                        break;
                        
                    case "SpeedFactor":
                    case "User":
                    case "Tool":
                    case "AccJ":
                    case "AccL":
                    case "SpeedJ":
                    case "SpeedL":
                    case "Arch":
                    case "CP":
                    case "LimZ":
                        const param = msg.payload || msg.parameter;
                        if (param === undefined) {
                            done(`${command} requires a parameter`);
                            return;
                        }
                        cmdString = `${command}(${param})`;
                        break;
                        
                    case "PayLoad":
                        if (msg.payload && typeof msg.payload === 'object') {
                            const weight = parseFloat(msg.payload.weight) || 0;
                            const inertia = parseFloat(msg.payload.inertia) || 0;
                            cmdString = `PayLoad(${weight},${inertia})`;
                        } else {
                            done("PayLoad requires {weight: number, inertia: number}");
                            return;
                        }
                        break;
                        
                    case "DO":
                        if (msg.payload && typeof msg.payload === 'object') {
                            const index = parseInt(msg.payload.index);
                            const status = parseInt(msg.payload.status);
                            if (index < 1 || index > 24) {
                                done("DO index must be between 1 and 24");
                                return;
                            }
                            if (status !== 0 && status !== 1) {
                                done("DO status must be 0 or 1");
                                return;
                            }
                            cmdString = `DO(${index},${status})`;
                        } else {
                            done("DO requires {index: 1-24, status: 0|1}");
                            return;
                        }
                        break;
                        
                    case "RunScript":
                        const scriptName = msg.payload || msg.scriptName;
                        if (!scriptName) {
                            done("RunScript requires script name");
                            return;
                        }
                        cmdString = `RunScript(${scriptName})`;
                        break;
                        
                    case "GetHoldRegs":
                        if (msg.payload && typeof msg.payload === 'object') {
                            const {id, addr, count, type} = msg.payload;
                            if (id === undefined || addr === undefined || 
                                count === undefined || !type) {
                                done("GetHoldRegs requires {id, addr, count, type}");
                                return;
                            }
                            cmdString = `GetHoldRegs(${id},${addr},${count},${type})`;
                        } else {
                            done("GetHoldRegs requires parameters object");
                            return;
                        }
                        break;
                        
                    case "SetHoldRegs":
                        if (msg.payload && typeof msg.payload === 'object') {
                            const {id, addr, count, table, type} = msg.payload;
                            if (id === undefined || addr === undefined || 
                                count === undefined || table === undefined || !type) {
                                done("SetHoldRegs requires {id, addr, count, table, type}");
                                return;
                            }
                            cmdString = `SetHoldRegs(${id},${addr},${count},${table},${type})`;
                        } else {
                            done("SetHoldRegs requires parameters object");
                            return;
                        }
                        break;
                        
                    default:
                        // For movement commands or other commands not listed
                        if (msg.payload) {
                            cmdString = command + "(" + msg.payload + ")";
                        } else {
                            done(`Unknown or unsupported command: ${command}`);
                            return;
                        }
                }
            }
            
            // Allow override of port selection
            const portType = msg.portType || null;
            
            // Send command
            node.connection.sendCommand(cmdString, function(err, response) {
                if (err) {
                    done(err);
                    return;
                }
                
                // Parse response
                msg.payload = response;
                msg.command = cmdString;
                
                // Try to extract meaningful data from response
                try {
                    const match = response.match(/\{([^}]+)\}/);
                    if (match) {
                        msg.result = match[1];
                        
                        // For certain commands, parse the result
                        if (node.command === "GetErrorID") {
                            try {
                                msg.errors = JSON.parse("[" + match[1] + "]");
                            } catch (e) {
                                // Ignore parsing errors
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
                
                send(msg);
                done();
            }, portType);
        });
        
        // Cleanup
        this.on('close', function() {
            if (node.connection) {
                node.connection.deregister(node);
            }
        });
    }
    
    RED.nodes.registerType("dobot-command", DobotCommandNode);
}