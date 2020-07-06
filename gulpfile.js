// SPDX-License-Identifier: MIT

'use strict';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const cached = require('gulp-cached');
const vsce = require('vsce');

const extension = ts.createProject('./src/tsconfig.json');

const outDir = './out';

// 编译当前的扩展
function compileExtension() {
    let s = extension.src()
        .pipe(cached('apidoc.vscode'))

    if (extension.options.sourceMap) {
        s = s.pipe(sourcemaps.init())
            .pipe(extension())
            .pipe(sourcemaps.write('./'))
    }

    return s.pipe(gulp.dest(outDir));
}

async function clean() {
    await del(outDir);
}

function watchExtension() {
    gulp.watch('./src/**/*.ts',compileExtension);
}

function createVSIX() {
    return vsce.createVSIX();
}

// 发布当前的扩展
function publish() {
    return vsce.publish();
}

exports.compile = gulp.series(
    clean,
    compileExtension,
);

exports.clean = clean;

exports.publish = gulp.series(
    createVSIX,
    publish,
);

exports.package = gulp.series(
    compileExtension,
    createVSIX,
);

exports.watch = gulp.series(compileExtension, watchExtension)
