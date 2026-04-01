[app]
title = TPV Ultra Smart
package.name = tpvultrasmart
package.domain = com.universidad.tpv
version = 1.0

source.dir = .
source.main = main.py

source.include_exts = py,png,jpg,jpeg,kv,atlas,json,html,css,js,xml,ttf,woff,woff2
source.include_patterns = frontend/**,backend/**,database/**,config/**,logs/**
source.exclude_patterns = .buildozer/*,bin/*,*.pyc,__pycache__/*,compilacion/*,*.backup

requirements = python3,flask==2.2.5,werkzeug==2.2.3,requests,urllib3

orientation = portrait
fullscreen = 0

android.permissions = INTERNET,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE
android.request_legacy_external_storage = True
android.uses_cleartext_traffic = True
android.res_dirs = res/

android.minapi = 21
android.api = 33
android.archs = arm64-v8a,armeabi-v7a

p4a.bootstrap = webview
p4a.branch = v2024.01.21

[buildozer]
log_level = 2
warn_on_root = 1
