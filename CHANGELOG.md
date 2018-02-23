# 1.1.1
- Added checks to ensure TLS cert and key exist (closes #7)
- Fixed error in controllers not displaying to console (closes #8)
- Added ability to override default json structure by setting this.body directly

# 1.1.0
- Changed required field within JWT to 'sub' from 'userId'
- Added ability to add your own RAML trait names that should be authenticated by JWT
- Fixed: trailing slash on apiBase to constructor no longer causes a double slash. Fixes #5
- Added ability to define where the controllers are in the filesystem
- Added travisci tests
- Added checks for content-type when content-length is specified
