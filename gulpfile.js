var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var serve = require('gulp-serve');
var jshint = require('gulp-jshint');
var map = require('map-stream');

var paths = {
  build: { //Тут мы укажем куда складывать готовые после сборки файлы
    html: './public/',
    js: './public/js/',
    css: './public/css/',
    img: './public/img/',
    fonts: './public/fonts/',
    tempates: './public/templates/'
  },
  src: { //Пути откуда брать исходники
    html: './src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
    templates: './src/templates/*.html',
    js: './src/js/**/*.js',//В стилях и скриптах нам понадобятся только main файлы
    sass: './src/scss/**/*.scss',
    img: './src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
    fonts: './src/lib/ionic/release/fonts/*.*',
    libs: ['./src/lib/ionic/release/js/*.min.js', './src/lib/angular/angular.min.js']
  },
  watch: {
    html: './src/**/*.html',
    js: './src/js/**/*.js',
    sass: './src/scss/**/*.scss',
    img: './src/img/**/*.*',
    fonts: './src/fonts/**/*.*'
  },
  clean: './public'
};

//var paths = {
//  sass: ['./src/scss/**/*.scss']
//};

gulp.task('serve', ['install', 'lint', 'libs', 'sass-build', 'templates-build', 'html-build', 'fonts-build', 'image-build', 'js-build', 'http-serve']);

var myReporter = map(function (file, cb) {
  if (!file.jshint.success) {
    console.log('JSHINT fail in '+file.path);
    file.jshint.results.forEach(function (err) {
      if (err) {
        console.log(' '+file.path + ': line ' + err.line + ', col ' + err.character + ', code ' + err.code + ', ' + err.reason);
      }
    });
  }
  cb(null, file);
});

gulp.task('lint', function() {
  return gulp.src(paths.src.js)
      .pipe(jshint())
      .pipe(myReporter)
});

gulp.task('libs', function() {
    return gulp.src(paths.src.libs)
        .pipe(gulp.dest(paths.build.js))
});


gulp.task('html-build', function (done) {
  gulp.src(paths.src.html)
      .pipe(gulp.dest(paths.build.html))
      .on('end', done);
});

gulp.task('templates-build', function (done) {
    gulp.src(paths.src.templates)
        .pipe(gulp.dest(paths.build.tempates))
        .on('end', done);
});

gulp.task('sass-build', function(done) {
  gulp.src(paths.src.sass)
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest(paths.build.css))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(paths.build.css))
    .on('end', done);
});

gulp.task('image-build', function (done) {
  gulp.src(paths.src.img) //Выберем наши картинки
      //.pipe(imagemin({ //Сожмем их
      //  progressive: true,
      //  svgoPlugins: [{removeViewBox: false}],
      //  use: [pngquant()],
      //  interlaced: true
      //}))
      .pipe(gulp.dest(paths.build.img)) //И бросим в build
      .on('end', done);
});

gulp.task('fonts-build', function() {
  gulp.src(paths.src.fonts)
      .pipe(gulp.dest(paths.build.fonts))
});

gulp.task('js-build', function (done) {
  gulp.src(paths.src.js) //Найдем наш main файл
      //.pipe(sourcemaps.init()) //Инициализируем sourcemap
      .pipe(concat('app.js'))
      //.pipe(uglify())
      .pipe(concat('app.js', {newLine: ';'}))
      .pipe(gulp.dest(paths.build.js)) //Выплюнем готовый файл в build
      .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.watch.sass, ['sass-build']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('http-serve', serve({
  root: ['public'],
  port: 8080
}));