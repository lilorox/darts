# darts
Web app to keep score and stats at darts

## Build

To build this app, you will need the following:
- npm
- bower
- gulp

### Install bower
```
npm install --global bower
```

### Install gulp
```
npm install --global gulp-cli
```

### Production environment
```
gulp
```

The generated files will be placed in the `build/` folder.

## Development environment
```
gulp dev
```
or
```
gulp watch
```

This will generate an `index.html` file and add a `libs/` in `frontend/` without compiling and minifying the CSS and JS for debug purposes.
