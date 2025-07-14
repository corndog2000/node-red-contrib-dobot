module.exports = function(RED) {
    const net = require('net');
    
    function DobotConnectionNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        this.host = config.host || '192.168.1.6';
        this.port = parseInt(config.port) || 29999;
        this.name = config.name;
        this.autoConnect = config.autoConnect;
        
        // Connection state
        this.connected = false;
        this.connecting = false;
        this.socket = null;
        this.users = {};
        
        // Command queue for handling responses
        this.commandQueue = [];
        this.currentCommand = null;
        
        // Update node status
        this.updateStatus = function() {
            if (node.connected) {
                node.emit('status', {fill: "green", shape: "dot", text: "connected"});
            } else if (node.connecting) {
                node.emit('status', {fill: "yellow", shape: "ring", text: "connecting"});
            } else {
                node.emit('status', {fill: "red", shape: "ring", text: "disconnected"});
            }
        };
        
        // Connect to Dobot
        this.connect = function() {
            if (node.connected || node.connecting) {
                return;
            }
            
            node.connecting = true;
            node.updateStatus();
            
            node.socket = new net.Socket();
            
            node.socket.on('connect', function() {
                node.connected = true;
                node.connecting = false;
                node.updateStatus();
                node.log(`Connected to Dobot at ${node.host}:${node.port}`);
                node.emit('connected');
            });
            
            node.socket.on('data', function(data) {
                const response = data.toString('utf-8').trim();
                node.log(`Received: ${response}`);
                
                if (node.currentCommand) {
                    const callback = node.currentCommand.callback;
                    node.currentCommand = null;
                    
                    // Process next command in queue
                    if (node.commandQueue.length > 0) {
                        const nextCmd = node.commandQueue.shift();
                        node.sendCommand(nextCmd.command, nextCmd.callback);
                    }
                    
                    if (callback) {
                        callback(null, response);
                    }
                }
            });
            
            node.socket.on('error', function(err) {
                node.error(`Socket error: ${err.message}`);
                node.disconnect();
            });
            
            node.socket.on('close', function() {
                node.connected = false;
                node.connecting = false;
                node.updateStatus();
                node.emit('disconnected');
            });
            
            try {
                node.socket.connect(node.port, node.host);
            } catch (err) {
                node.error(`Connection failed: ${err.message}`);
                node.connecting = false;
                node.updateStatus();
            }
        };
        
        // Disconnect from Dobot
        this.disconnect = function() {
            if (node.socket) {
                node.socket.destroy();
                node.socket = null;
            }
            node.connected = false;
            node.connecting = false;
            node.updateStatus();
        };
        
        // Send command to Dobot
        this.sendCommand = function(command, callback) {
            if (!node.connected) {
                if (callback) {
                    callback(new Error('Not connected to Dobot'));
                }
                return;
            }
            
            // If a command is currently being processed, queue this one
            if (node.currentCommand) {
                node.commandQueue.push({command: command, callback: callback});
                return;
            }
            
            node.currentCommand = {command: command, callback: callback};
            node.log(`Sending: ${command}`);
            
            try {
                node.socket.write(command + '\n', 'utf-8');
            } catch (err) {
                node.currentCommand = null;
                if (callback) {
                    callback(err);
                }
            }
        };
        
        // Register a node as a user of this connection
        this.register = function(nodeToRegister) {
            node.users[nodeToRegister.id] = nodeToRegister;
            if (Object.keys(node.users).length === 1) {
                // First user, connect if autoConnect is enabled
                if (node.autoConnect) {
                    node.connect();
                }
            }
        };
        
        // Deregister a node
        this.deregister = function(nodeToDeregister) {
            delete node.users[nodeToDeregister.id];
            if (Object.keys(node.users).length === 0) {
                // No more users, disconnect
                node.disconnect();
            }
        };
        
        // Handle node close
        node.on('close', function(done) {
            node.disconnect();
            done();
        });
        
        // Initial status
        node.updateStatus();
    }
    
    RED.nodes.registerType("dobot-connection", DobotConnectionNode);
    
    // HTTP endpoints for connection management
    RED.httpAdmin.post("/dobot/:id/connect", RED.auth.needsPermission("dobot.write"), function(req, res) {
        const node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.connect();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    });
    
    RED.httpAdmin.post("/dobot/:id/disconnect", RED.auth.needsPermission("dobot.write"), function(req, res) {
        const node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                node.disconnect();
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    });
}