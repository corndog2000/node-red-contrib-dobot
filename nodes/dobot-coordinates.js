module.exports = function(RED) {
    // Global storage for coordinate presets
    if (!RED.settings.functionGlobalContext) {
        RED.settings.functionGlobalContext = {};
    }
    if (!RED.settings.functionGlobalContext.dobotCoordinates) {
        RED.settings.functionGlobalContext.dobotCoordinates = {};
    }
    
    function DobotCoordinatesNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        this.coordinatesData = config.coordinatesData || "[]";
        this.storeName = config.storeName || "default";
        
        // Parse and validate coordinates
        try {
            const coordinates = JSON.parse(this.coordinatesData);
            node.log(`Loading ${coordinates.length} coordinates into store "${this.storeName}"`);
            
            // Validate each coordinate entry
            const validatedCoords = [];
            coordinates.forEach((coord, index) => {
                if (!coord.name) {
                    node.warn(`Coordinate at index ${index} missing name, skipping`);
                    return;
                }
                
                // Check if it's a cartesian coordinate
                if (coord.x !== undefined && coord.y !== undefined && coord.z !== undefined && coord.r !== undefined) {
                    validatedCoords.push({
                        name: coord.name,
                        type: "cartesian",
                        x: Number(coord.x),
                        y: Number(coord.y),
                        z: Number(coord.z),
                        r: Number(coord.r)
                    });
                }
                // Check if it's a joint coordinate
                else if (coord.j1 !== undefined && coord.j2 !== undefined && coord.j3 !== undefined && coord.j4 !== undefined) {
                    validatedCoords.push({
                        name: coord.name,
                        type: "joint",
                        j1: Number(coord.j1),
                        j2: Number(coord.j2),
                        j3: Number(coord.j3),
                        j4: Number(coord.j4)
                    });
                }
                // Check if it's an arc coordinate
                else if (coord.mid && coord.end) {
                    validatedCoords.push({
                        name: coord.name,
                        type: "arc",
                        mid: {
                            x: Number(coord.mid.x),
                            y: Number(coord.mid.y),
                            z: Number(coord.mid.z),
                            r: Number(coord.mid.r)
                        },
                        end: {
                            x: Number(coord.end.x),
                            y: Number(coord.end.y),
                            z: Number(coord.end.z),
                            r: Number(coord.end.r)
                        }
                    });
                }
                // Check if it's a circle coordinate
                else if (coord.count !== undefined && coord.mid && coord.end) {
                    validatedCoords.push({
                        name: coord.name,
                        type: "circle",
                        count: Number(coord.count),
                        mid: {
                            x: Number(coord.mid.x),
                            y: Number(coord.mid.y),
                            z: Number(coord.mid.z),
                            r: Number(coord.mid.r)
                        },
                        end: {
                            x: Number(coord.end.x),
                            y: Number(coord.end.y),
                            z: Number(coord.end.z),
                            r: Number(coord.end.r)
                        }
                    });
                }
                else {
                    node.warn(`Invalid coordinate format for "${coord.name}", skipping`);
                }
            });
            
            // Store in global context
            RED.settings.functionGlobalContext.dobotCoordinates[this.storeName] = validatedCoords;
            
            node.status({fill: "green", shape: "dot", text: `${validatedCoords.length} coordinates loaded`});
            
        } catch (error) {
            node.error("Failed to parse coordinates JSON: " + error.message);
            node.status({fill: "red", shape: "ring", text: "parse error"});
            return;
        }
        
        // Handle input messages
        this.on('input', function(msg, send, done) {
            // For Node-RED 0.x compatibility
            send = send || function() { node.send.apply(node, arguments) };
            done = done || function(err) { if(err) node.error(err, msg) };
            
            const coordinates = RED.settings.functionGlobalContext.dobotCoordinates[node.storeName] || [];
            
            // If specific coordinate name is requested
            if (msg.coordinateName) {
                const coord = coordinates.find(c => c.name === msg.coordinateName);
                if (coord) {
                    // Create a copy without the name and type fields
                    const payload = {...coord};
                    delete payload.name;
                    delete payload.type;
                    msg.payload = payload;
                    msg.coordinateType = coord.type;
                } else {
                    msg.payload = null;
                    msg.error = `Coordinate "${msg.coordinateName}" not found`;
                }
            } else {
                // Return all coordinates
                msg.payload = coordinates;
            }
            
            send(msg);
            done();
        });
        
        // Cleanup
        this.on('close', function() {
            // Optionally remove from global context
            if (RED.settings.functionGlobalContext.dobotCoordinates[node.storeName]) {
                delete RED.settings.functionGlobalContext.dobotCoordinates[node.storeName];
            }
        });
    }
    
    RED.nodes.registerType("dobot-coordinates", DobotCoordinatesNode);
    
    // Add HTTP endpoint to get available coordinates for a store
    RED.httpAdmin.get("/dobot-coordinates/:storeName", function(req, res) {
        const storeName = req.params.storeName || "default";
        const coordinates = RED.settings.functionGlobalContext.dobotCoordinates[storeName] || [];
        res.json(coordinates.map(c => ({name: c.name, type: c.type})));
    });
}