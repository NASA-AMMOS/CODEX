const gulp       = require('gulp');
const isparta    = require('isparta');
// const babel      = require('babel/register');
const plugins    = require('gulp-load-plugins')();

function unitTests() {
    return gulp.src(['tests/config/setup.js', 'tests/unit/**/*.js'])
        .pipe(
            plugins.mocha(
                {
                    reporter: 'spec',
                    //compilers: { js: babel },
                }
            )
        );
}

gulp.task(
    'lint', () => {

        // TODO: This is broken due to gulp-eslint not supporting enum strings

        // return gulp.src(['src/**/*.js', 'tests/**/*.js'])
        //     .pipe(plugins.eslint())
        //     .pipe(plugins.eslint.format())
        //     .pipe(plugins.eslint.failAfterError());
    }
);

gulp.task(
    'coverage', (done) => {
        gulp.src(['src/**/*.js'])
            .pipe(
                plugins.istanbul(
                    {
                        instrumenter: isparta.Instrumenter,
                        includeUntested: true,
                    }
                )
            )
            .pipe(plugins.istanbul.hookRequire())
            .on(
                'finish', () => {
                    unitTests()
                        .pipe(plugins.istanbul.writeReports())
                        .pipe(plugins.istanbul.enforceThresholds({ thresholds: { global: 90 } }))
                        .on('end', done);
                }
            );
    }
);

gulp.task(
    'test:unit', () => {
        return unitTests();
    }
);

gulp.task('test', plugins.sequence('coverage', 'test:integration'));
gulp.task('default', plugins.sequence('lint', 'test'));

