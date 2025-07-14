# Dobot Error Code Reference

This document provides a comprehensive list of error codes that may be returned by the Dobot robot.

## Motion Planning Errors (16-37)

| Code | Description | Solution |
|------|-------------|----------|
| 16 | The planned point is close to the shoulder singularity point | Reselect the movement points |
| 17 | Inverse kinematics error with no solution | Reselect the movement points |
| 18 | Inverse kinematics error with result out of working area | Reselect the movement points |
| 19 | Starting and end points are the same (JUMP/ARC/Circle) | Reselect the movement points |
| 20 | Arc points are wrong | Enter correct points |
| 21 | JUMP parameters wrong (negative height or zLimit issue) | Enter correct parameters |
| 22 | Arm orientation error | Reselect the movement points |
| 23 | Planned point out of MOVL workspace | Reselect the movement points |
| 24 | Planned point out of ARC workspace | Reselect the movement points |
| 25 | Planned point out of JUMP workspace | Reselect the movement points |
| 26 | Planned point close to wrist singularity | Reselect the movement points |
| 27 | Planned point close to elbow singularity | Reselect the movement points |
| 28 | Motion command mode error | System error, restart or contact support |
| 29 | Speed parameter wrong | Enter correct parameters |
| 32 | Shoulder singularity during motion | Reselect the movement points |
| 33 | No solution during motion | Reselect the movement points |
| 34 | Out of working area during motion | Reselect the movement points |
| 35 | Wrist singularity during motion | Reselect the movement points |
| 36 | Elbow singularity during motion | Reselect the movement points |
| 37 | Joint angle changed over 180 degrees | Reselect the movement points |

## Joint Speed Errors (48-53)

| Code | Description | Solution |
|------|-------------|----------|
| 48 | Joint1 overspeed | Reset speed or move away from singularity |
| 49 | Joint2 overspeed | Reset speed or move away from singularity |
| 50 | Joint3 overspeed | Reset speed or move away from singularity |
| 51 | Joint4 overspeed | Reset speed or move away from singularity |

## Command Parameter Errors (45000+)

| Code | Description | Solution |
|------|-------------|----------|
| 45091 | Optional parameter 'arm' is wrong | Enter correct parameters |
| 45092 | Optional parameter 'ForceControl' is wrong | Enter correct parameters |
| 45136 | MoveR command parameters wrong | Enter correct parameters |
| 45137 | GoR command parameters wrong | Enter correct parameters |
| 45138 | MoveJR command parameters wrong | Enter correct parameters |
| 45139 | GoIO optional parameters wrong | Enter correct parameters |
| 45140 | MoveIO optional parameters wrong | Enter correct parameters |
| 45141 | MoveJIO optional parameters wrong | Enter correct parameters |

## Force Control Errors (177-179)

| Code | Description | Solution |
|------|-------------|----------|
| 177 | Cannot pause during force control | Stop and rerun instead of pause |
| 178 | Force control sensor data overrange | Check force control sensor |
| 179 | Force control sensor disabled | Enable force control sensor |

## Tracking Errors (192-194)

| Code | Description | Solution |
|------|-------------|----------|
| 192 | Cannot pause during tracking | Rerun the script |
| 193 | Cannot use joint commands during tracking | Select appropriate motion command |
| 194 | Tracking limit exceeded | Increase tracking range or speed |

## Trajectory Errors (208-209)

| Code | Description | Solution |
|------|-------------|----------|
| 208 | Fitting points insufficient | Trajectory needs at least 4 points |
| 209 | Playback preprocessing failed | Record new trajectory |

## Hardware Errors (1772-1773)

| Code | Description | Solution |
|------|-------------|----------|
| 1772 | Contactor is open | Check hardware and restart controller |
| 1773 | Feedback board power-on signal failure | Check hardware and restart controller |

## Using Error Codes in Node-RED

### Example: Error Handling Function

```javascript
// Function node to parse and handle errors
const errorMap = {
    16: "Shoulder singularity - adjust position",
    17: "No solution - position unreachable",
    18: "Out of workspace - reduce reach",
    // ... add more as needed
};

if (msg.payload.includes("error")) {
    const match = msg.payload.match(/error[:\s]*(\d+)/i);
    if (match) {
        const errorCode = parseInt(match[1]);
        const errorDesc = errorMap[errorCode] || "Unknown error";
        
        msg.error = {
            code: errorCode,
            description: errorDesc,
            original: msg.payload
        };
        
        // Send to error output
        return [null, msg];
    }
}

// Normal output
return [msg, null];
```

### Example: Error Recovery Flow

```javascript
// Automatic error recovery
switch(msg.error.code) {
    case 16: // Shoulder singularity
    case 26: // Wrist singularity
    case 27: // Elbow singularity
        // Move to safe position
        msg.payload = {x: 250, y: 0, z: 200, r: 0};
        msg.recovery = true;
        break;
        
    case 48: // Joint overspeed
    case 49:
    case 50:
    case 51:
        // Reduce speed
        msg.command = "SpeedJ";
        msg.payload = 30; // Reduce to 30%
        break;
        
    default:
        // Manual intervention required
        msg.alert = "Manual intervention required";
}

return msg;
```

### Dashboard Error Display

Create a dashboard to display current errors:

1. Use `dobot-dashboard` node with "GetErrorID" command
2. Parse the error code
3. Display in UI with description
4. Add clear error button

## Best Practices

1. **Always check for errors** after movement commands
2. **Implement retry logic** for transient errors
3. **Log all errors** for debugging
4. **Create safe positions** for error recovery
5. **Monitor error trends** to prevent issues

## Common Error Patterns

### Workspace Violations
- Errors 17, 18, 23, 24, 25, 34
- Solution: Validate coordinates before sending

### Singularity Issues
- Errors 16, 26, 27, 32, 35, 36
- Solution: Use alternative paths or positions

### Speed Issues
- Errors 29, 48-51
- Solution: Reduce speed near singularities

### Parameter Errors
- Errors 45000+
- Solution: Validate input parameters