module.exports = function(RED) {
    function DobotStatusNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection - for real-time data, use port 30003 or 30004
        this.connection = RED.nodes.getNode(config.connection);
        this.interval = parseInt(config.interval) || 1000;
        this.dataType = config.dataType || "position";
        this.autoStart = config.autoStart;
        
        this.intervalId = null;
        this.monitoring = false;
        
        if (!this.connection) {
            this.error("No connection configured");
            return;
        }
        
        // Update node status
        const updateStatus = () => {
            if (!node.connection.connected) {
                node.status({fill: "red", shape: "ring", text: "disconnected"});
            } else if (node.monitoring) {
                node.status({fill: "green", shape: "dot", text: "monitoring"});
            } else {
                node.status({fill: "yellow", shape: "ring", text: "connected"});
            }
        };
        
        // Register with connection
        this.connection.register(this);
        this.connection.on('status', updateStatus);
        updateStatus();
        
        // Query robot status
        const queryStatus = () => {
            if (!node.connection.connected || !node.monitoring) {
                return;
            }
            
            let commands = [];
            
            switch(node.dataType) {
                case "position":
                    commands = ["GetPose()"];
                    break;
                case "joints":
                    commands = ["GetAngle()"];
                    break;
                case "io":
                    commands = ["GetDI()", "GetDO()", "GetAI(1)", "GetAI(2)"];
                    break;
                case "mode":
                    commands = ["RobotMode()"];
                    break;
                case "error":
                    commands = ["GetErrorID()"];
                    break;
                case "all":
                    commands = ["GetPose()", "GetAngle()", "RobotMode()", "GetErrorID()"];
                    break;
            }
            
            // Execute commands sequentially
            let results = {};
            let cmdIndex = 0;
            
            const executeNext = () => {
                if (cmdIndex >= commands.length) {
                    // All commands executed, send results
                    const msg = {
                        payload: results,
                        timestamp: Date.now()
                    };
                    node.send(msg);
                    return;
                }
                
                const cmd = commands[cmdIndex];
                const cmdName = cmd.split("(")[0];
                cmdIndex++;
                
                node.connection.sendCommand(cmd, (err, response) => {
                    if (err) {
                        results[cmdName] = { error: err.message };
                    } else {
                        // Try to parse the response
                        try {
                            const match = response.match(/\{([^}]+)\}/);
                            if (match) {
                                const values = match[1].split(",").map(v => v.trim());
                                
                                switch(cmdName) {
                                    case "GetPose":
                                        if (values.length >= 6) {
                                            results.pose = {
                                                x: parseFloat(values[0]),
                                                y: parseFloat(values[1]),
                                                z: parseFloat(values[2]),
                                                rx: parseFloat(values[3]),
                                                ry: parseFloat(values[4]),
                                                rz: parseFloat(values[5])
                                            };
                                        }
                                        break;
                                    case "GetAngle":
                                        if (values.length >= 4) {
                                            results.joints = {
                                                j1: parseFloat(values[0]),
                                                j2: parseFloat(values[1]),
                                                j3: parseFloat(values[2]),
                                                j4: parseFloat(values[3])
                                            };
                                        }
                                        break;
                                    case "RobotMode":
                                        results.mode = values[0];
                                        break;
                                    case "GetErrorID":
                                        results.errorId = parseInt(values[0]);
                                        break;
                                    default:
                                        results[cmdName] = values.length === 1 ? values[0] : values;
                                }
                            } else {
                                results[cmdName] = response;
                            }
                        } catch (e) {
                            results[cmdName] = response;
                        }
                    }
                    
                    // Execute next command
                    executeNext();
                });
            };
            
            executeNext();
        };
        
        // Start monitoring
        const startMonitoring = () => {
            if (node.monitoring) {
                return;
            }
            
            node.monitoring = true;
            updateStatus();
            
            // Query immediately
            queryStatus();
            
            // Set up interval
            node.intervalId = setInterval(queryStatus, node.interval);
        };
        
        // Stop monitoring
        const stopMonitoring = () => {
            if (!node.monitoring) {
                return;
            }
            
            node.monitoring = false;
            if (node.intervalId) {
                clearInterval(node.intervalId);
                node.intervalId = null;
            }
            updateStatus();
        };
        
        // Handle input messages
        this.on('input', function(msg, send, done) {
            // For Node-RED 0.x compatibility
            send = send || function() { node.send.apply(node, arguments) };
            done = done || function(err) { if(err) node.error(err, msg) };
            
            const command = msg.payload;
            
            if (command === "start") {
                startMonitoring();
                done();
            } else if (command === "stop") {
                stopMonitoring();
                done();
            } else if (command === "status") {
                // One-time query
                queryStatus();
                done();
            } else {
                done("Invalid command. Use 'start', 'stop', or 'status'");
            }
        });
        
        // Auto-start if configured
        if (node.autoStart && node.connection.connected) {
            setTimeout(startMonitoring, 1000);
        }
        
        // Handle connection events
        node.connection.on('connected', () => {
            updateStatus();
            if (node.autoStart && !node.monitoring) {
                setTimeout(startMonitoring, 1000);
            }
        });
        
        node.connection.on('disconnected', () => {
            stopMonitoring();
            updateStatus();
        });
        
        // Cleanup
        this.on('close', function() {
            stopMonitoring();
            if (node.connection) {
                node.connection.deregister(node);
            }
        });
    }
    
    RED.nodes.registerType("dobot-status", DobotStatusNode);
}