# verdaccio-pacman
Verdaccio Middleware Plugin to manage tags and versions of packages

[![verdaccio-pacman (latest)](https://img.shields.io/npm/v/verdaccio-pacman/latest.svg)](https://www.npmjs.com/package/verdaccio-pacman)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![node](https://img.shields.io/node/v/verdaccio-pacman/latest.svg)](https://www.npmjs.com/package/verdaccio-pacman)

## Requirements

* verdaccio@4.x or higher

```
 npm install --global verdaccio-pacman
```

## Usage

To enable the plugin you need to add following lines to your configuration file.  
```
middlewares:
  pacman:
    # Enables the plugin - the only required config parameter
    enabled: true
    # List of tags to protect. Protected tags or package versions with assigned protected tags can not be deleted.
    # Tag "latest" is always protected!
    protectedTags:
      - dev
      - stage
      - prod
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)