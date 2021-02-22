
## Setup
### Server
* Create a new instance of Sockr class
  * Pass in the server and config
  * Config should include settings for the Process class
    * Process Settings
      * `command.default`
        * Type of terminal to run the exec script with
        * Default is `/bin/bash`
      * `exec script`
        * Script used to execute command
        * Relative to the apps root directory
