# Dobot Node-RED API Reference

Complete reference for all Dobot commands available through the Node-RED palette.

## Table of Contents

1. [Dashboard Commands](#dashboard-commands)
2. [Movement Commands](#movement-commands)
3. [I/O Commands](#io-commands)
4. [Script Commands](#script-commands)
5. [Status Commands](#status-commands)

## Dashboard Commands

### EnableRobot()
Enable the robot for operation.

**Node**: dobot-dashboard  
**Command**: EnableRobot  
**Response**: Success confirmation

### DisableRobot()
Disable the robot (safety stop).

**Node**: dobot-dashboard  
**Command**: DisableRobot  
**Response**: Success confirmation

### ClearError()
Clear controller alarm information.

**Node**: dobot-dashboard  
**Command**: ClearError  
**Response**: Success confirmation

### ResetRobot()
Stop robot motion immediately.

**Node**: dobot-dashboard  
**Command**: ResetRobot  
**Response**: Success confirmation

### SpeedFactor(speed)
Set global speed factor.

**Node**: dobot-dashboard  
**Command**: SpeedFactor  
**Parameters**:
- `speed`: 1-100 (percentage)

**Example**:
```javascript
msg.payload = 50; // 50% speed
```

### User(index)
Select user coordinate system.

**Node**: dobot-dashboard  
**Command**: User  
**Parameters**:
- `index`: 0-9 (coordinate system index)

### Tool(index)
Select tool coordinate system.

**Node**: dobot-dashboard  
**Command**: Tool  
**Parameters**:
- `index`: 0-9 (tool index)

### RobotMode()
Get current robot mode.

**Node**: dobot-dashboard  
**Command**: RobotMode  
**Response**: Current mode string

### PayLoad(weight, inertia)
Set robot payload parameters.

**Node**: dobot-dashboard  
**Command**: PayLoad  
**Parameters**:
- `weight`: Load weight (kg)
- `inertia`: Load moment of inertia

**Example**:
```javascript
msg.payload = {
    weight: 2.5,
    inertia: 0.1
};
```

### DO(index, status)
Set digital output (queue command).

**Node**: dobot-dashboard  
**Command**: DO  
**Parameters**:
- `index`: 1-24 (output number)
- `status`: 0 (low) or 1 (high)

**Example**:
```javascript
msg.payload = {
    index: 1,
    status: 1
};
```

### AccJ(speed)
Set joint acceleration ratio.

**Node**: dobot-dashboard  
**Command**: AccJ  
**Parameters**:
- `speed`: 1-100 (percentage)

### AccL(speed)
Set linear acceleration ratio.

**Node**: dobot-dashboard  
**Command**: AccL  
**Parameters**:
- `speed`: 1-100 (percentage)

### SpeedJ(speed)
Set joint speed ratio.

**Node**: dobot-dashboard  
**Command**: SpeedJ  
**Parameters**:
- `speed`: 1-100 (percentage)

### SpeedL(speed)
Set linear speed ratio.

**Node**: dobot-dashboard  
**Command**: SpeedL  
**Parameters**:
- `speed`: 1-100 (percentage)

### Arch(index)
Set jump gate parameters.

**Node**: dobot-dashboard  
**Command**: Arch  
**Parameters**:
- `index`: 0-9 (parameter set index)

### CP(ratio)
Set continuous path ratio.

**Node**: dobot-dashboard  
**Command**: CP  
**Parameters**:
- `ratio`: 1-100 (smoothing percentage)

### LimZ(value)
Set maximum Z height limit.

**Node**: dobot-dashboard  
**Command**: LimZ  
**Parameters**:
- `value`: Maximum height in mm

### GetErrorID()
Get current error code.

**Node**: dobot-dashboard  
**Command**: GetErrorID  
**Response**: Error code (0 = no error)

## Movement Commands

### MovJ(x, y, z, r)
Joint interpolated motion to position.

**Node**: dobot-move  
**Move Type**: MovJ  
**Parameters**:
- `x`: X coordinate (mm)
- `y`: Y coordinate (mm)
- `z`: Z coordinate (mm)
- `r`: Rotation (degrees)

**Example**:
```javascript
msg.payload = {
    x: 250,
    y: 0,
    z: 200,
    r: 0
};
```

### MovL(x, y, z, r)
Linear interpolated motion to position.

**Node**: dobot-move  
**Move Type**: MovL  
**Parameters**: Same as MovJ

### JointMovJ(j1, j2, j3, j4)
Move to specific joint angles.

**Node**: dobot-move  
**Move Type**: JointMovJ  
**Parameters**:
- `j1`: Joint 1 angle (degrees)
- `j2`: Joint 2 angle (degrees)
- `j3`: Joint 3 angle (degrees)
- `j4`: Joint 4 angle (degrees)

**Example**:
```javascript
msg.payload = {
    j1: 0,
    j2: 45,
    j3: 45,
    j4: 0
};
```

### RelMovJ(offset1, offset2, offset3, offset4, offset5, offset6)
Relative joint motion from current position.

**Node**: dobot-move  
**Move Type**: RelMovJ  
**Parameters**:
- `offset1-6`: Offset values (typically only first 4 used)

**Example**:
```javascript
msg.payload = {
    x: 10,      // or offset1
    y: 0,       // or offset2
    z: -5,      // or offset3
    r: 0        // or offset4
};
```

### RelMovL(offset1, offset2, offset3, offset4, offset5, offset6)
Relative linear motion from current position.

**Node**: dobot-move  
**Move Type**: RelMovL  
**Parameters**: Same as RelMovJ

### Arc(midX, midY, midZ, midR, endX, endY, endZ, endR)
Arc motion through mid-point to end-point.

**Node**: dobot-move  
**Move Type**: Arc  
**Parameters**:
- `mid`: Mid-point coordinates {x, y, z, r}
- `end`: End-point coordinates {x, y, z, r}

**Example**:
```javascript
msg.payload = {
    mid: {x: 250, y: 50, z: 200, r: 0},
    end: {x: 300, y: 0, z: 200, r: 0}
};
```

### Circle(count, midX, midY, midZ, midR, endX, endY, endZ, endR)
Circular motion for specified count.

**Node**: dobot-move  
**Move Type**: Circle  
**Parameters**:
- `count`: Number of circles
- `mid`: Mid-point coordinates
- `end`: End-point coordinates

**Example**:
```javascript
msg.payload = {
    count: 2,
    mid: {x: 250, y: 50, z: 200, r: 0},
    end: {x: 300, y: 0, z: 200, r: 0}
};
```

### MoveJog(axis_id, coordType, user, tool)
Continuous jog motion.

**Node**: dobot-move  
**Move Type**: MoveJog  
**Parameters**:
- `axis`: Axis identifier (J1+/-, J2+/-, J3+/-, J4+/-, X+/-, Y+/-, Z+/-, Rx+/-, Ry+/-, Rz+/-)
- `coordType`: 1=User, 2=Tool (optional)
- `user`: User coordinate index 0-9 (optional)
- `tool`: Tool coordinate index 0-9 (optional)

**Example**:
```javascript
msg.payload = {
    axis: "X+",
    coordType: 1,
    user: 0,
    tool: 0
};
```

### StartTrace(trace_name)
Start trajectory fitting (Cartesian points).

**Node**: dobot-move  
**Move Type**: StartTrace  
**Parameters**:
- `traceName`: Trace file name (with extension)

**Example**:
```javascript
msg.payload = {
    traceName: "myTrace.txt"
};
```

### StartPath(trace_name, const, cart)
Start path reproduction (joint points).

**Node**: dobot-move  
**Move Type**: StartPath  
**Parameters**:
- `traceName`: Path file name
- `const`: 0=original speed, 1=constant speed
- `cart`: 0=joint path, 1=Cartesian path

**Example**:
```javascript
msg.payload = {
    traceName: "myPath.txt",
    const: 0,
    cart: 0
};
```

### StartFCTrace(trace_name)
Start force control trajectory.

**Node**: dobot-move  
**Move Type**: StartFCTrace  
**Parameters**:
- `traceName`: Force control trace file name

### Sync()
Synchronize command queue.

**Node**: dobot-move  
**Move Type**: Sync  
**Parameters**: None

### Wait(time)
Wait for specified time.

**Node**: dobot-move  
**Move Type**: Wait  
**Parameters**:
- `time`: Wait time in milliseconds

**Example**:
```javascript
msg.payload = {
    time: 1000  // Wait 1 second
};
```

### Pause()
Pause current motion.

**Node**: dobot-move  
**Move Type**: Pause  
**Parameters**: None

### Continue()
Continue paused motion.

**Node**: dobot-move  
**Move Type**: Continue  
**Parameters**: None

## I/O Commands

### DO(index, status)
Set digital output.

**Node**: dobot-io  
**I/O Type**: DO  
**Parameters**:
- `index`: 1-24
- `status`: 0 or 1

### ToolDO(index, status)
Set tool digital output.

**Node**: dobot-io  
**I/O Type**: ToolDO  
**Parameters**:
- `index`: 1-2
- `status`: 0 or 1

### AO(index, value)
Set analog output.

**Node**: dobot-io  
**I/O Type**: AO  
**Parameters**:
- `index`: 1-2
- `value`: Analog value

### ToolAO(index, value)
Set tool analog output.

**Node**: dobot-io  
**I/O Type**: ToolAO  
**Parameters**:
- `index`: 1
- `value`: Analog value

### DI(index)
Read digital input.

**Node**: dobot-io  
**I/O Type**: DI  
**Parameters**:
- `index`: 1-32

**Response**: Input state (0 or 1)

### ToolDI(index)
Read tool digital input.

**Node**: dobot-io  
**I/O Type**: ToolDI  
**Parameters**:
- `index`: 1-2

### AI(index)
Read analog input.

**Node**: dobot-io  
**I/O Type**: AI  
**Parameters**:
- `index`: 1-2

**Response**: Analog value

### ToolAI(index)
Read tool analog input.

**Node**: dobot-io  
**I/O Type**: ToolAI  
**Parameters**:
- `index`: 1

### GetHoldRegs(id, addr, count, type)
Read holding registers.

**Node**: dobot-io  
**I/O Type**: GetHoldRegs  
**Parameters**:
- `id`: Device ID (0-4, 0=internal)
- `addr`: Start address (3095-4095)
- `count`: Number to read (1-16)
- `type`: Data type ("U16", "U32", "F32", "F64")

**Example**:
```javascript
msg.payload = {
    id: 0,
    addr: 3095,
    count: 1,
    type: "U16"
};
```

### SetHoldRegs(id, addr, count, table, type)
Write holding registers.

**Node**: dobot-io  
**I/O Type**: SetHoldRegs  
**Parameters**:
- `id`: Device ID (0-4)
- `addr`: Start address (3095-4095)
- `count`: Number to write (1-16)
- `table`: Value to write
- `type`: Data type

## Script Commands

### RunScript(project_name)
Run a script file.

**Node**: dobot-script  
**Action**: RunScript  
**Parameters**:
- Script name (including extension)

**Example**:
```javascript
msg.payload = "myScript.lua";
```

### StopScript()
Stop running script.

**Node**: dobot-script  
**Action**: StopScript  
**Parameters**: None

### PauseScript()
Pause running script.

**Node**: dobot-script  
**Action**: PauseScript  
**Parameters**: None

### ContinueScript()
Continue paused script.

**Node**: dobot-script  
**Action**: ContinueScript  
**Parameters**: None

## Status Commands

### GetPose()
Get current position.

**Response**:
```javascript
{
    pose: {
        x: 250.0,
        y: 0.0,
        z: 200.0,
        rx: 0.0,
        ry: 0.0,
        rz: 0.0
    }
}
```

### GetAngle()
Get current joint angles.

**Response**:
```javascript
{
    joints: {
        j1: 0.0,
        j2: 45.0,
        j3: 45.0,
        j4: 0.0
    }
}
```

### Status Monitoring
The status node can monitor:
- `position`: Current pose
- `joints`: Joint angles
- `io`: I/O states
- `mode`: Robot mode
- `error`: Error status
- `all`: All information

**Control Commands**:
- `"start"`: Begin periodic monitoring
- `"stop"`: Stop monitoring
- `"status"`: One-time query

## Response Format

All commands return responses in this general format:

### Success Response
```
{command_name}() -> success
```

### Error Response
```
{command_name}() -> error:code,description
```

### Data Response
```
{command_name}() -> {data1,data2,data3,...}
```

## Notes

1. All coordinates are in millimeters
2. All angles are in degrees
3. Commands are case-sensitive
4. Queue commands execute in order
5. Some commands require robot to be enabled first
6. Path files are stored in `/dobot/userdata/project/process/trajectory/`