# Dobot Node-RED Setup Guide

This guide will help you install and configure the Node-RED Dobot palette for your robotic arm.

## Prerequisites

- Node-RED installed (version 2.0 or higher recommended)
- Network access to your Dobot robot
- Basic understanding of Node-RED flows

## Installation Steps

### 1. Create the Palette Structure

First, create the directory structure for your palette:

```bash
mkdir -p ~/.node-red/node-red-contrib-dobot/{nodes,examples,docs}
cd ~/.node-red/node-red-contrib-dobot
```

### 2. Copy Files

Copy all the provided files into their respective directories:

```
node-red-contrib-dobot/
├── package.json
├── LICENSE
├── README.md
├── .gitignore
├── nodes/
│   ├── dobot-connection.js
│   ├── dobot-connection.html
│   ├── dobot-dashboard.js
│   ├── dobot-dashboard.html
│   ├── dobot-move.js
│   ├── dobot-move.html
│   ├── dobot-io.js
│   ├── dobot-io.html
│   ├── dobot-script.js
│   ├── dobot-script.html
│   ├── dobot-status.js
│   └── dobot-status.html
├── examples/
│   └── example-flow.json
└── docs/
    ├── error-reference.md
    └── setup-guide.md
```

### 3. Install the Palette

From the palette directory:

```bash
cd ~/.node-red/node-red-contrib-dobot
npm install
```

### 4. Restart Node-RED

```bash
node-red-stop
node-red-start
```

Or if running manually:
- Press `Ctrl+C` to stop
- Run `node-red` to start again

### 5. Verify Installation

1. Open Node-RED in your browser (typically http://localhost:1880)
2. Check the palette on the left side - you should see a "dobot" category
3. Verify all nodes are present:
   - dashboard
   - move
   - i/o
   - script
   - status

## Initial Configuration

### 1. Set Up Robot Connection

1. Drag any Dobot node onto the canvas
2. Double-click to open configuration
3. Click the pencil icon next to "Connection"
4. Enter your robot's IP address (default: 192.168.1.6)
5. Select the appropriate port:
   - 29999: Dashboard control (most common)
   - 30003: Real-time feedback
   - 30004: Real-time data
   - 30005: Movement server
6. Enable "Auto Connect" if desired
7. Click "Add" to save the connection

### 2. Test Connection

Create a simple test flow:

```
[Inject] → [Enable Robot] → [Debug]
```

1. Add an inject node
2. Add a dobot-dashboard node
3. Set command to "EnableRobot"
4. Add a debug node
5. Deploy the flow
6. Click the inject button
7. Check debug output for success message

### 3. Basic Safety Setup

Always include these safety features in your flows:

#### Emergency Stop
```
[Dashboard Button: STOP] → [Disable Robot] → [Stop Script]
```

#### Error Monitoring
```
[Status Node: Error] → [Switch: If Error] → [Alert/Log]
```

#### Speed Limiting
```
[On Deploy] → [SpeedFactor: 30%] → [SpeedJ: 30%] → [SpeedL: 30%]
```

## Network Configuration

### Finding Your Robot's IP

If you don't know your robot's IP address:

1. Check the robot's teach pendant
2. Use network scanning tools:
   ```bash
   # Linux/Mac
   arp -a | grep dobot
   
   # Or use nmap
   nmap -sn 192.168.1.0/24
   ```
3. Check your DHCP server logs

### Firewall Configuration

Ensure these ports are open:
- TCP 29999 (Dashboard)
- TCP 30003 (Feedback)
- TCP 30004 (Data)
- TCP 30005 (Movement)

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to robot
- Verify network connectivity: `ping [robot-ip]`
- Check firewall settings
- Ensure robot is powered on
- Verify no other software is using the port

**Problem**: Connection drops frequently
- Check network stability
- Increase timeout values
- Use wired connection instead of WiFi

### Node Issues

**Problem**: Nodes appear as "unknown"
- Clear browser cache
- Restart Node-RED
- Check for JavaScript errors in browser console
- Reinstall the palette

**Problem**: Commands fail with errors
- Check error codes in error-reference.md
- Verify robot is enabled
- Check coordinate limits
- Review command parameters

### Performance Issues

**Problem**: Slow response times
- Use appropriate ports (30003/30004 for real-time)
- Reduce status polling frequency
- Check network latency
- Minimize command queue size

## Best Practices

### 1. Flow Organization

- Use link nodes to organize complex flows
- Group related functionality
- Add comments to document behavior
- Use subflows for repeated patterns

### 2. Error Handling

Always implement error handling:

```javascript
// In a function node after any Dobot command
if (msg.payload.includes("error")) {
    // Handle error
    node.error("Dobot error: " + msg.payload);
    return null; // Stop flow
}
return msg;
```

### 3. State Management

Track robot state using context:

```javascript
// Store position after movement
flow.set("lastPosition", msg.payload);

// Check state before operations
const isEnabled = flow.get("robotEnabled") || false;
if (!isEnabled) {
    node.error("Robot not enabled");
    return null;
}
```

### 4. Safety First

- Always test with reduced speeds
- Implement soft limits in software
- Use physical barriers during testing
- Have emergency stop readily accessible
- Never bypass safety features

## Advanced Configuration

### Multiple Robots

To control multiple robots:

1. Create separate connection configs for each robot
2. Use different node instances for each robot
3. Consider using MQTT for coordination

### Custom Commands

For commands not covered by the nodes:

```javascript
// Function node connected to dashboard node
msg.command = "custom";
msg.payload = "YourCommand(param1,param2)";
return msg;
```

### Integration with Other Systems

- Use MQTT nodes for external integration
- HTTP endpoints for REST API access
- Dashboard UI for operator interfaces
- Database nodes for logging operations

## Getting Help

- GitHub Issues: Report bugs and request features
- Node-RED Forum: General Node-RED questions
- Dobot Documentation: Robot-specific information
- Example Flows: Import from examples folder

## Next Steps

1. Import the example flow to see all features
2. Create a simple pick-and-place application
3. Build a dashboard for robot control
4. Implement error handling and logging
5. Develop your specific application

Remember: Start simple, test thoroughly, and prioritize safety!