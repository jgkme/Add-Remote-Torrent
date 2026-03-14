#!/bin/bash
echo "SHELL environment variable: $SHELL"
echo "Available shells:"
cat /etc/shells 2>/dev/null || echo "/etc/shells not found"
echo "Current user shell:"
getent passwd $(whoami) | cut -d: -f7
