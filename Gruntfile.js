module.exports = function(grunt){
    // load plugins
    [
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-exec',
    ].forEach(function(task){
    grunt.loadNpmTasks(task);
    });
    // configure plugins
    grunt.initConfig({
    cafemocha: {
    all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
    },
    jshint: {
        options: {
            jshintrc: ".jshintrc"
        },
    app: ['meadowlark.js', 'public/js/**/*.js',
    'lib/**/*.js'],
    qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
    },
   exec: {
    linkchecker:
    { cmd: '"C:\\Program Files (x86)\\LinkChecker\\linkchecker.exe" http://localhost:3000' }
 },
 });
 // register tasks
 grunt.registerTask('default', ['cafemocha','jshint','exec']);
};
   