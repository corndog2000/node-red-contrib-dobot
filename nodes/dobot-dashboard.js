module.exports = function(RED) {
    function DobotDashboardNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.command = config.command;
        this.parameter = config.parameter;
        
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
            
            // Determine command to execute
            let command = msg.command || node.command;
            let cmdString = "";
            let params = null;
            
            // Build command string based on command type
            switch(command) {
                case "EnableRobot":
                    cmdString = "EnableRobot()";
                    break;
                    
                case "DisableRobot":
                    cmdString = "DisableRobot()";
                    break;
                    
                case "ClearError":
                    cmdString = "ClearError()";
                    break;
                    
                case "ResetRobot":
                    cmdString = "ResetRobot()";
                    break;
                    
                case "SpeedFactor":
                    params = msg.payload || parseInt(node.parameter) || 50;
                    if (params < 1 || params > 100) {
                        done("SpeedFactor must be between 1 and 100");
                        return;
                    }
                    cmdString = `SpeedFactor(${params})`;
                    break;
                    
                case "User":
                    params = msg.payload || parseInt(node.parameter) || 0;
                    if (params < 0 || params > 9) {
                        done("User index must be between 0 and 9");
                        return;
                    }
                    cmdString = `User(${params})`;
                    break;
                    
                case "Tool":
                    params = msg.payload || parseInt(node.parameter) || 0;
                    if (params < 0 || params > 9) {
                        done("Tool index must be between 0 and 9");
                        return;
                    }
                    cmdString = `Tool(${params})`;
                    break;
                    
                case "RobotMode":
                    cmdString = "RobotMode()";
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
                    
                case "AccJ":
                case "AccL":
                case "SpeedJ":
                case "SpeedL":
                    params = msg.payload || parseInt(node.parameter) || 50;
                    if (params < 1 || params > 100) {
                        done(`${command} must be between 1 and 100`);
                        return;
                    }
                    cmdString = `${command}(${params})`;
                    break;
                    
                case "Arch":
                    params = msg.payload || parseInt(node.parameter) || 0;
                    if (params < 0 || params > 9) {
                        done("Arch index must be between 0 and 9");
                        return;
                    }
                    cmdString = `Arch(${params})`;
                    break;
                    
                case "CP":
                    params = msg.payload || parseInt(node.parameter) || 50;
                    if (params < 1 || params > 100) {
                        done("CP ratio must be between 1 and 100");
                        return;
                    }
                    cmdString = `CP(${params})`;
                    break;
                    
                case "LimZ":
                    params = msg.payload || parseInt(node.parameter) || 200;
                    cmdString = `LimZ(${params})`;
                    break;
                    
                case "GetErrorID":
                    cmdString = "GetErrorID()";
                    break;
                    
                case "custom":
                    cmdString = msg.payload || "";
                    if (!cmdString) {
                        done("No command specified in payload");
                        return;
                    }
                    break;
                    
                default:
                    done(`Unknown command: ${command}`);
                    return;
            }
            
            // Send command
            node.connection.sendCommand(cmdString, function(err, response) {
                if (err) {
                    done(err);
                    return;
                }
                
                // Parse response
                msg.payload = response;
                msg.command = command;
                msg.raw = cmdString;
                
                // Special handling for certain responses
                if (command === "RobotMode" || command === "GetErrorID") {
                    try {
                        // Try to extract meaningful data from response
                        const match = response.match(/\{([^}]+)\}/);
                        if (match) {
                            msg.result = match[1];
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
                
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
    
    RED.nodes.registerType("dobot-dashboard", DobotDashboardNode);
}