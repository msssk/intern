# Installing Intern

Intern is distributed as an npm package. To install, just run:

```sh
npm install intern
```

## Project structure

Intern is very flexible, and doesn’t enforce any particular directory structure.
However, this is one we’ve found to be convenient:

```
project_root/
  intern.json    - Intern config
  build/         - Built code
  node_modules/  - Node.js dependencies (including Intern)
  src/           - Front-end source code
    app/         - Application code
    index.html   - Application entry point
  tests/         - Intern tests
    functional/  - Functional tests
    support/     - Test support code (utility functions, custom reporters, etc.)
    unit/        - Unit tests
```

The only assumptions made by Intern are that it will be run from the project
root (the default if run using `npm`) and that an `intern.json` file will exist
in the project root. Neither of these are hard requirements, but following them
will make using Intern a bit easier.
