module.exports = function(RED) {
    function DobotIONode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.ioType = config.ioType;
        this.index = parseInt(config.index) || 1;
        this.value = config.value;
        
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
            
            const ioType = msg.ioType || node.ioType;
            let cmdString = "";
            let params = msg.payload || {};
            
            // Build command based on I/O type
            switch(ioType) {
                case "DO":
                    const doIndex = params.index !== undefined ? params.index : node.index;
                    const doStatus = params.status !== undefined ? params.status : 
                                    (params.value !== undefined ? params.value : parseInt(node.value));
                    
                    if (doIndex < 1 || doIndex > 24) {
                        done("DO index must be between 1 and 24");
                        return;
                    }
                    if (doStatus !== 0 && doStatus !== 1) {
                        done("DO status must be 0 or 1");
                        return;
                    }
                    cmdString = `DO(${doIndex},${doStatus})`;
                    break;
                    
                case "ToolDO":
                    const toolIndex = params.index !== undefined ? params.index : node.index;
                    const toolStatus = params.status !== undefined ? params.status : 
                                      (params.value !== undefined ? params.value : parseInt(node.value));
                    
                    if (toolIndex < 1 || toolIndex > 2) {
                        done("ToolDO index must be 1 or 2");
                        return;
                    }
                    if (toolStatus !== 0 && toolStatus !== 1) {
                        done("ToolDO status must be 0 or 1");
                        return;
                    }
                    cmdString = `ToolDO(${toolIndex},${toolStatus})`;
                    break;
                    
                case "AO":
                    const aoIndex = params.index !== undefined ? params.index : node.index;
                    const aoValue = params.value !== undefined ? params.value : parseFloat(node.value);
                    
                    if (aoIndex < 1 || aoIndex > 2) {
                        done("AO index must be 1 or 2");
                        return;
                    }
                    cmdString = `AO(${aoIndex},${aoValue})`;
                    break;
                    
                case "ToolAO":
                    const toolAoIndex = params.index !== undefined ? params.index : node.index;
                    const toolAoValue = params.value !== undefined ? params.value : parseFloat(node.value);
                    
                    if (toolAoIndex !== 1) {
                        done("ToolAO index must be 1");
                        return;
                    }
                    cmdString = `ToolAO(${toolAoIndex},${toolAoValue})`;
                    break;
                    
                case "DI":
                    const diIndex = params.index !== undefined ? params.index : node.index;
                    
                    if (diIndex < 1 || diIndex > 32) {
                        done("DI index must be between 1 and 32");
                        return;
                    }
                    cmdString = `DI(${diIndex})`;
                    break;
                    
                case "ToolDI":
                    const toolDiIndex = params.index !== undefined ? params.index : node.index;
                    
                    if (toolDiIndex < 1 || toolDiIndex > 2) {
                        done("ToolDI index must be 1 or 2");
                        return;
                    }
                    cmdString = `ToolDI(${toolDiIndex})`;
                    break;
                    
                case "AI":
                    const aiIndex = params.index !== undefined ? params.index : node.index;
                    
                    if (aiIndex < 1 || aiIndex > 2) {
                        done("AI index must be 1 or 2");
                        return;
                    }
                    cmdString = `AI(${aiIndex})`;
                    break;
                    
                case "ToolAI":
                    const toolAiIndex = params.index !== undefined ? params.index : node.index;
                    
                    if (toolAiIndex !== 1) {
                        done("ToolAI index must be 1");
                        return;
                    }
                    cmdString = `ToolAI(${toolAiIndex})`;
                    break;
                    
                case "GetHoldRegs":
                    if (!params.id || params.addr === undefined || !params.count || !params.type) {
                        done("GetHoldRegs requires {id: 0-4, addr: 3095-4095, count: 1-16, type: 'U16'|'U32'|'F32'|'F64'}");
                        return;
                    }
                    cmdString = `GetHoldRegs(${params.id},${params.addr},${params.count},${params.type})`;
                    break;
                    
                case "SetHoldRegs":
                    if (!params.id || params.addr === undefined || !params.count || 
                        params.table === undefined || !params.type) {
                        done("SetHoldRegs requires {id: 0-4, addr: 3095-4095, count: 1-16, table: value, type: 'U16'|'U32'|'F32'|'F64'}");
                        return;
                    }
                    cmdString = `SetHoldRegs(${params.id},${params.addr},${params.count},${params.table},${params.type})`;
                    break;
                    
                default:
                    done(`Unknown I/O type: ${ioType}`);
                    return;
            }
            
            // Send command
            node.connection.sendCommand(cmdString, function(err, response) {
                if (err) {
                    done(err);
                    return;
                }
                
                msg.payload = response;
                msg.command = ioType;
                msg.raw = cmdString;
                
                // Parse input values if reading
                if (ioType.endsWith("I") && !ioType.includes("Hold")) {
                    try {
                        const match = response.match(/\{([^}]+)\}/);
                        if (match) {
                            msg.value = parseInt(match[1]);
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
    
    RED.nodes.registerType("dobot-io", DobotIONode);
}