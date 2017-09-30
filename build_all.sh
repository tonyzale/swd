echo "build server"
node_modules/typescript/bin/tsc -p .
echo "build client"
(cd ../swd-client; ng build)
