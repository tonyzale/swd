echo "build server"
node_modules/typescript/bin/tsc -p .
echo "build client"
node_modules/typescript/bin/tsc -p client_ts #--outDir client/js client_ts/client_game.ts
