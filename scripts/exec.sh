#!/bin/bash

# Exit when any command fails
# set -e

EXEC_CMD="$1"
EXEC_ARGS="${@:2}"

# Prints a message to the terminal through stderr
printMessage(){
  echo "[ SOCKr ] $@" >&2
  return
}

# Ensure the local bash settings get loaded for the machine
sourceRCFile(){

  # Check if the bashfile exists
  local BASHRC_FILE

  # Check for .bash file
  local PROFILE=~/.bash_profile
  local BRC=~/.bashrc
  if [[ -f "$PROFILE" ]]; then
    BASH_FILE="$PROFILE"
  elif [[ -f "$BRC" ]]; then
    BASH_FILE="$BRC"
  fi

  # If there's no bash file, then we know keg-cli's not installed
  # So log an error and exit!
  if [[ -z "$BASH_FILE" ]]; then
    printMessage "Could not load bash profile. Could not find \"~/.bash_profile\" || \"~/.bashrc\""
    exit 1
  else
    # Source the bash file so we have access to the keg-cli
    source $BASH_FILE
  fi

}

# Runs a command based on the passed in arguments
execCmd(){
  # $EXEC_CMD $EXEC_ARGS
  echo "-------- EXEC_ARGS --------"
  echo "$EXEC_ARGS"
  
  exit "$?"
}

# Add the bash settings for the environment
sourceRCFile


# Run the command
execCmd
