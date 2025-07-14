# Node-RED Dobot Control Palette

A comprehensive Node-RED palette for controlling Dobot robotic arms. This palette provides nodes for movement control, I/O operations, script management, and real-time monitoring.

## Features

- **Connection Management**: Configure multiple connections to different Dobot ports
- **Movement Control**: Support for all movement types (MovJ, MovL, Arc, Circle, etc.)
- **I/O Operations**: Read/write digital and analog I/O
- **Dashboard Control**: Robot enable/disable, speed control, error management
- **Script Management**: Run, pause, stop, and continue Dobot scripts
- **Real-time Monitoring**: Monitor robot position, joint angles, and status

## Installation

### Method 1: Install from npm (when published)
```bash
cd ~/.node-red
npm install node-red-contrib-dobot
```

### Method 2: Install from source
```bash
cd ~/.node-red
git clone https://github.com/yourusername/node-red-contrib-dobot.git
cd node-red-contrib-dobot
npm install
```

Then restart Node-RED:
```bash
node-red-restart
```

## Quick Start

1. **Add a Connection**: 
   - Drag a Dobot node into your flow
   - Double-click to configure
   - Add a new connection with your robot's IP address
   - Select the appropriate port (typically 29999 for control)

2. **Enable the Robot**:
   - Add a `dobot-dashboard` node
   - Set command to "Enable Robot"
   - Deploy and inject a message to enable

3. **Move the Robot**:
   - Add a `dobot-move` node
   - Choose movement type (e.g., MovJ)
   - Send position coordinates

## Node Types

### Connection Configuration
Configure connections to Dobot robots. Supports multiple port types:
- **29999**: Dashboard Server (Robot Control)
- **30003**: Real-time Feedback Port
- **30004**: Real-time Data Port
- **30005**: Movement Server

### Dashboard Node
Control robot state and parameters:
- Enable/Disable robot
- Clear errors
- Set speed factors
- Configure coordinate systems
- Set payload

### Movement Node
Execute various movement commands:
- **MovJ/MovL**: Point-to-point and linear motion
- **JointMovJ**: Direct joint control
- **Arc/Circle**: Path movements
- **MoveJog**: Manual jogging
- **Trajectory**: Path recording and playback

### I/O Node
Control and read I/O ports:
- Digital inputs/outputs (DO, DI)
- Analog inputs/outputs (AO, AI)
- Tool I/O
- Hold registers

### Script Node
Manage Dobot script execution:
- Run scripts
- Pause/Continue execution
- Stop scripts

### Status Node
Monitor robot state in real-time:
- Current position (pose)
- Joint angles
- I/O states
- Error status
- Robot mode

## Example Flows

### Basic Movement
```json
[
    {
        "id": "inject1",
        "type": "inject",
        "payload": "{\"x\": 250, \"y\": 0, \"z\": 200, \"r\": 0}",
        "payloadType": "json",
        "wires": [["move1"]]
    },
    {
        "id": "move1",
        "type": "dobot-move",
        "connection": "config1",
        "moveType": "MovJ",
        "wires": [["debug1"]]
    },
    {
        "id": "debug1",
        "type": "debug"
    }
]
```

### I/O Control
```json
{
    "payload": {
        "index": 1,
        "status": 1
    }
}
```

### Real-time Monitoring
```javascript
// Start monitoring
msg.payload = "start";
return msg;

// Stop monitoring
msg.payload = "stop";
return msg;
```

## Message Formats

### Movement Commands

**MovJ/MovL**:
```javascript
msg.payload = {
    x: 250,    // X coordinate (mm)
    y: 0,      // Y coordinate (mm)
    z: 200,    // Z coordinate (mm)
    r: 0       // Rotation (degrees)
}
```

**JointMovJ**:
```javascript
msg.payload = {
    j1: 0,     // Joint 1 angle (degrees)
    j2: 0,     // Joint 2 angle (degrees)
    j3: 0,     // Joint 3 angle (degrees)
    j4: 0      // Joint 4 angle (degrees)
}
```

**Arc Motion**:
```javascript
msg.payload = {
    mid: {x: 250, y: 50, z: 200, r: 0},
    end: {x: 300, y: 0, z: 200, r: 0}
}
```

### I/O Commands

**Digital Output**:
```javascript
msg.payload = {
    index: 1,    // I/O index (1-24)
    status: 1    // 0=Low, 1=High
}
```

**Analog Output**:
```javascript
msg.payload = {
    index: 1,    // AO index (1-2)
    value: 3.3   // Voltage value
}
```

## Error Handling

All nodes include error information in their responses. Check the alarm controller reference for error codes:

```javascript
// In a function node after a Dobot command
if (msg.payload.includes("error")) {
    // Handle error
    const errorMatch = msg.payload.match(/error:(\d+)/);
    if (errorMatch) {
        const errorCode = parseInt(errorMatch[1]);
        // Look up error in alarm controller
    }
}
```

## Safety Considerations

1. **Always test movements in a safe environment**
2. **Use speed limits during development**
3. **Implement emergency stop functionality**
4. **Monitor error states continuously**
5. **Ensure proper workspace boundaries**

## Troubleshooting

### Connection Issues
- Verify robot IP address and network connectivity
- Ensure the correct port is selected
- Check if robot is powered on and initialized
- Verify no other applications are using the port

### Movement Errors
- Check if robot is enabled
- Verify coordinates are within workspace
- Ensure no singularity points
- Check speed and acceleration settings

### I/O Issues
- Verify I/O index is within valid range
- Check electrical connections
- Ensure proper voltage levels

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [your-repo-url]/issues
- Node-RED Forum: https://discourse.nodered.org
- Dobot Documentation: [dobot-docs-url]

## Changelog

### Version 1.0.0
- Initial release
- Support for Dobot CR series
- Basic movement commands
- I/O control
- Status monitoring
- Script management