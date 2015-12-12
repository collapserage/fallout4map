import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins({pattern: ['gulp-*', 'main-bower-files', 'merge-stream', 'webpack-stream']});

gulp.task('bower-styles', () => {
    return gulp.src('app/components/leaflet/dist/leaflet.css')
        .pipe($.concat('vendor.css'))
        .pipe($.minifyCss())
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('bower-scripts', () => {
    return gulp.src(['app/components/babel-polyfill/browser-polyfill.js',
                      'app/components/fetch/fetch.js',
                      'app/components/leaflet/dist/leaflet.js'])
        .pipe($.concat('vendor.js'))
        .pipe($.uglify())
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('styles', () => {
    let sass = gulp.src('app/styles/*.sass')
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({browsers: ['last 1 version']}))
        .pipe(gulp.dest('.tmp/styles'));

    let css = gulp.src('.tmp/styles/*.css');

    return $.mergeStream(sass, css)
        .pipe($.concat('main.css'))
        .pipe($.minifyCss())
        .pipe(gulp.dest('dist/styles'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', () => {
    return gulp.src('app/scripts/*.js')
        .pipe($.webpackStream({
            output: {filename: 'main.js'},
            module: {
                loaders: [{
                    exclude: /(node_modules)/,
                    loader: 'babel-loader',
                    query: {presets: ['es2015']}
                }]
            }
        }))
        .pipe(gulp.dest('dist/scripts'))
});

gulp.task('lint', () => {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError());
});

gulp.task('html', () => {
    gulp.src('.tmp/images/*.svg')
        .pipe(gulp.dest('dist/images'));

    return gulp.src('app/*.html')
        //.pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
        .pipe(gulp.dest('dist'));
});

gulp.task('svg', () => {
    return gulp.src('**/*.svg', {cwd: 'app'})
        .pipe($.svgSprite({
            shape: {id: {separator: '-'}},
            mode: {
                view: {
                    dest: '',
                    sprite: 'images/marker-sprite.svg',
                    bust: false,
                    //layout: 'vertical',
                    dimensions: true,
                    render: {css: {dest: 'styles/sprite.css'}}
                }
            }
        }))
        .pipe(gulp.dest('.tmp'))
});

gulp.task('images', () => {
    return gulp.src(['app/images/*', '.tmp/images/*'])
        .pipe($.if(
                $.if.isFile,
                $.cache($.imagemin({
                    progressive: true,
                    interlaced: true,
                    svgoPlugins: [{cleanupIDs: false}]
                }))
        ))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['html'], () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['.tmp', 'app'],
            routes: {
                '/bower_components': 'app/components'
            }
        }
    });

    gulp.watch([
        'app/*.html',
        '.tmp/scripts/**/*.js',
        'app/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.sass', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

gulp.task('build', ['svg', 'images', 'bower-styles', 'bower-scripts', 'styles', 'scripts', 'html'], () => {
    return gulp.src('dist/**/*')
        .pipe($.size({
            gzip: true
        }));
});

gulp.task('build-light', ['styles', 'scripts', 'html'], () => {
    return gulp.src('dist/**/*')
        .pipe($.size({
            gzip: true
        }));
});

