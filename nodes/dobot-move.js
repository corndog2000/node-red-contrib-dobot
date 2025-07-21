module.exports = function(RED) {
    function DobotMoveNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get connection
        this.connection = RED.nodes.getNode(config.connection);
        this.moveType = config.moveType;
        this.coordType = config.coordType;
        this.waitForComplete = config.waitForComplete;
        this.coordinateStore = config.coordinateStore || "";
        this.coordinateName = config.coordinateName || "";
        this.robotSpeed = parseInt(config.robotSpeed) || 100;
        
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
        
        // Validate coordinate values
        function validateCoords(coords, isJoint) {
            if (!coords || typeof coords !== 'object') {
                return "Invalid coordinates object";
            }
            
            if (isJoint) {
                // Joint coordinates
                if (typeof coords.j1 !== 'number' || typeof coords.j2 !== 'number' || 
                    typeof coords.j3 !== 'number' || typeof coords.j4 !== 'number') {
                    return "Joint coordinates must have j1, j2, j3, j4 as numbers";
                }
            } else {
                // Cartesian coordinates
                if (typeof coords.x !== 'number' || typeof coords.y !== 'number' || 
                    typeof coords.z !== 'number' || typeof coords.r !== 'number') {
                    return "Cartesian coordinates must have x, y, z, r as numbers";
                }
            }
            return null;
        }
        
        // Handle input messages
        this.on('input', function(msg, send, done) {
            // For Node-RED 0.x compatibility
            send = send || function() { node.send.apply(node, arguments) };
            done = done || function(err) { if(err) node.error(err, msg) };
            
            const moveType = msg.moveType || node.moveType;
            const waitForComplete = msg.waitForComplete !== undefined ? msg.waitForComplete : node.waitForComplete;
            // Always use the node's configured speed, not from incoming message
            const robotSpeed = parseInt(node.robotSpeed) || 100;
            
            // Debug log the speed setting
            // node.warn(`[MOVE NODE] config.robotSpeed=${config.robotSpeed}, node.robotSpeed=${node.robotSpeed}, final robotSpeed=${robotSpeed}, moveType=${moveType}`);
            let cmdString = "";
            let coords = msg.payload;
            
            // Check if payload appears to be a command response (contains semicolon and curly braces)
            const isCommandResponse = typeof coords === 'string' && 
                (coords.includes(';') || coords.includes('{') || coords.includes('}'));
            
            // Check if payload is empty or invalid for coordinates
            const isInvalidPayload = !coords || 
                isCommandResponse ||
                (typeof coords === 'string' && coords.trim() === '') ||
                (typeof coords === 'object' && Object.keys(coords).length === 0);
            
            // Check if we should use predefined coordinates
            if (isInvalidPayload && node.coordinateStore && node.coordinateName) {
                const globalCoords = RED.settings.functionGlobalContext?.dobotCoordinates?.[node.coordinateStore];
                if (globalCoords) {
                    const presetCoord = globalCoords.find(c => c.name === node.coordinateName);
                    if (presetCoord) {
                        coords = {...presetCoord};
                        delete coords.name;
                        delete coords.type;
                    } else {
                        done(`Coordinate "${node.coordinateName}" not found in store "${node.coordinateStore}"`);
                        return;
                    }
                } else {
                    done(`Coordinate store "${node.coordinateStore}" not found`);
                    return;
                }
            }
            
            // If still no valid coordinates, error
            if (!coords || 
                (typeof coords === 'string' && !coords.includes(',')) || // String but not valid coords
                (typeof coords === 'object' && Object.keys(coords).length === 0)) {
                done("No valid coordinates provided in msg.payload and no preset coordinates configured");
                return;
            }
            
            // Build command based on move type
            switch(moveType) {
                case "MovJ":
                case "MovL":
                    const err = validateCoords(coords, false);
                    if (err) {
                        done(err);
                        return;
                    }
                    cmdString = `${moveType}(${coords.x},${coords.y},${coords.z},${coords.r})`;
                    break;
                    
                case "JointMovJ":
                    const jointErr = validateCoords(coords, true);
                    if (jointErr) {
                        done(jointErr);
                        return;
                    }
                    cmdString = `JointMovJ(${coords.j1},${coords.j2},${coords.j3},${coords.j4})`;
                    break;
                    
                case "RelMovJ":
                case "RelMovL":
                    if (!coords || typeof coords !== 'object') {
                        done("RelMov requires offset object");
                        return;
                    }
                    const offset1 = coords.offset1 || coords.x || 0;
                    const offset2 = coords.offset2 || coords.y || 0;
                    const offset3 = coords.offset3 || coords.z || 0;
                    const offset4 = coords.offset4 || coords.r || 0;
                    const offset5 = coords.offset5 || 0;
                    const offset6 = coords.offset6 || 0;
                    cmdString = `${moveType}(${offset1},${offset2},${offset3},${offset4},${offset5},${offset6})`;
                    break;
                    
                case "Arc":
                    if (!coords || !coords.mid || !coords.end) {
                        done("Arc requires {mid: {x,y,z,r}, end: {x,y,z,r}}");
                        return;
                    }
                    const midErr = validateCoords(coords.mid, false);
                    const endErr = validateCoords(coords.end, false);
                    if (midErr || endErr) {
                        done(midErr || endErr);
                        return;
                    }
                    cmdString = `Arc(${coords.mid.x},${coords.mid.y},${coords.mid.z},${coords.mid.r},${coords.end.x},${coords.end.y},${coords.end.z},${coords.end.r})`;
                    break;
                    
                case "Circle":
                    if (!coords || typeof coords.count !== 'number' || !coords.mid || !coords.end) {
                        done("Circle requires {count: number, mid: {x,y,z,r}, end: {x,y,z,r}}");
                        return;
                    }
                    const midErr2 = validateCoords(coords.mid, false);
                    const endErr2 = validateCoords(coords.end, false);
                    if (midErr2 || endErr2) {
                        done(midErr2 || endErr2);
                        return;
                    }
                    cmdString = `Circle(${coords.count},${coords.mid.x},${coords.mid.y},${coords.mid.z},${coords.mid.r},${coords.end.x},${coords.end.y},${coords.end.z},${coords.end.r})`;
                    break;
                    
                case "MoveJog":
                    if (!coords || !coords.axis) {
                        done("MoveJog requires {axis: 'J1+'|'J1-'|...|'X+'|'X-'|...}");
                        return;
                    }
                    cmdString = `MoveJog(${coords.axis}`;
                    
                    // Add optional parameters if provided
                    if (coords.coordType !== undefined || coords.user !== undefined || coords.tool !== undefined) {
                        const coordType = coords.coordType || 1;
                        const user = coords.user || 0;
                        const tool = coords.tool || 0;
                        cmdString += `, CoordType=${coordType}, User=${user}, Tool=${tool}`;
                    }
                    cmdString += ")";
                    break;
                    
                case "StartTrace":
                    if (!coords || !coords.traceName) {
                        done("StartTrace requires {traceName: 'filename'}");
                        return;
                    }
                    cmdString = `StartTrace(${coords.traceName})`;
                    break;
                    
                case "StartPath":
                    if (!coords || !coords.traceName) {
                        done("StartPath requires {traceName: 'filename', const: 0|1, cart: 0|1}");
                        return;
                    }
                    const constSpeed = coords.const !== undefined ? coords.const : 0;
                    const cartesian = coords.cart !== undefined ? coords.cart : 0;
                    cmdString = `StartPath(${coords.traceName}, ${constSpeed}, ${cartesian})`;
                    break;
                    
                case "StartFCTrace":
                    if (!coords || !coords.traceName) {
                        done("StartFCTrace requires {traceName: 'filename'}");
                        return;
                    }
                    cmdString = `StartFCTrace(${coords.traceName})`;
                    break;
                    
                case "Sync":
                    cmdString = "Sync()";
                    break;
                    
                case "Wait":
                    if (!coords || typeof coords.time !== 'number') {
                        done("Wait requires {time: milliseconds}");
                        return;
                    }
                    cmdString = `Wait(${coords.time})`;
                    break;
                    
                case "Pause":
                    cmdString = "Pause()";
                    break;
                    
                case "Continue":
                    cmdString = "Continue()";
                    break;
                    
                default:
                    done(`Unknown move type: ${moveType}`);
                    return;
            }
            
            // Send movement command with speed setting
            const sendMovementCommand = (callback) => {
                if (robotSpeed > 0 && robotSpeed <= 100) {
                    // Always send SpeedFactor command since 100% isn't default speed
                    const speedFactorCmd = `SpeedFactor(${robotSpeed})`;
                    
                    // node.log(`[SPEED DEBUG] Sending speed command: ${speedFactorCmd}`);
                    // node.warn(`Setting speed to ${robotSpeed}% before ${moveType}`);
                    
                    // Send SpeedFactor command first
                    node.connection.sendCommand(speedFactorCmd, function(speedErr, speedResponse) {
                        if (speedErr) {
                            node.error(`[SPEED DEBUG] Speed command failed: ${speedErr.message}`);
                            // node.warn(`Failed to set speed: ${speedErr.message}`);
                        } else {
                            // node.log(`[SPEED DEBUG] Speed response: ${speedResponse}`);
                            // node.warn(`Speed command response: ${speedResponse}`);
                        }
                        
                        // node.log(`[SPEED DEBUG] Now sending movement: ${cmdString}`);
                        
                        // Always continue with movement command
                        node.connection.sendCommand(cmdString, callback);
                    });
                } else {
                    // node.log(`[SPEED DEBUG] Invalid speed ${robotSpeed}, using direct movement: ${cmdString}`);
                    // Send movement command directly for invalid speeds
                    node.connection.sendCommand(cmdString, callback);
                }
            };
            
            // Send command
            sendMovementCommand(function(err, response) {
                if (err) {
                    done(err);
                    return;
                }
                
                // If waitForComplete is enabled and this is a movement command, send Sync()
                const movementCommands = ["MovJ", "MovL", "JointMovJ", "RelMovJ", "RelMovL", "Arc", "Circle"];
                if (waitForComplete && movementCommands.includes(moveType)) {
                    node.connection.sendCommand("Sync()", function(syncErr, syncResponse) {
                        if (syncErr) {
                            // node.warn(`Sync command failed: ${syncErr.message}`);
                        }
                        
                        msg.payload = response;
                        msg.command = moveType;
                        msg.raw = cmdString;
                        msg.synced = !syncErr;
                        msg.robotSpeed = robotSpeed;
                        msg.speedCommand = robotSpeed !== 100 ? `SpeedFactor(${robotSpeed})` : "none";
                        
                        send(msg);
                        done();
                    });
                } else {
                    msg.payload = response;
                    msg.command = moveType;
                    msg.raw = cmdString;
                    msg.robotSpeed = robotSpeed;
                    msg.speedCommand = robotSpeed !== 100 ? `SpeedFactor(${robotSpeed})` : "none";
                    
                    send(msg);
                    done();
                }
            });
        });
        
        // Cleanup
        this.on('close', function() {
            if (node.connection) {
                node.connection.deregister(node);
            }
        });
    }
    
    RED.nodes.registerType("dobot-move", DobotMoveNode);
}