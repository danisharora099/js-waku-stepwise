# Step 9: Debugging Utilities

This step implements a simple debugging toggle for Waku logs using the `debug=waku*` pattern. This allows developers to easily enable detailed logging for troubleshooting Waku-related issues.

## Features Added

- Simple toggle for enabling/disabling Waku debug logs
- Logging utility functions for controlling debug output
- Integration with the Waku context for application-wide access

## Implementation Details

1. **Logging Utilities**: 
   - Created functions for enabling/disabling Waku logs using the `debug=waku*` pattern
   - Implemented log level control
   - Added utility for checking if logs are enabled

2. **Debug Toggle Component**:
   - Implemented a toggle switch for enabling/disabling Waku logs
   - Added visual feedback for current log status
   - Included explanatory text about the debugging feature

3. **Context Integration**:
   - Added logging state to the Waku context
   - Implemented functions for toggling logging
   - Exposed logging status to components

## How to Use

1. Start the application with `npm run dev`
2. Navigate to the Debug Settings section in the sidebar
3. Toggle the "Waku Debug Logs" switch to enable/disable logging
4. Open your browser's developer console to view the logs
5. Perform various Waku operations to see detailed logs

## Technical Notes

- The debug setting is stored in localStorage as `debug=waku*`
- Toggling the setting requires a page reload to take effect
- When enabled, all Waku-related debug logs will appear in the console

## Next Steps

Proceed to Step 10 to implement different network connection methods.
