#!/bin/bash

# Usage:
# ./tools/preview-snapshot-diff-outputs.sh

set -eu

OUTPUT_FILE='/tmp/preview-snapshot-diff.html'

cat > ${OUTPUT_FILE} <<EOF
<html>
<head><title>Failed Tests</title></head>
<body>
EOF

for file in $(find $(pwd) -type f -path '**/__diff_output__/*.png'); do
    echo "<h4>${file}</h4>" >> ${OUTPUT_FILE}
    echo "<p><img src=\"data:image/png;base64,$(base64 -i ${file})\" /></p>" >> ${OUTPUT_FILE}
done

cat >> ${OUTPUT_FILE} <<EOF
</body>
</html>
EOF

nohup open ${OUTPUT_FILE}
