#!/bin/bash

MODEL_DIR="src/models"
ROUTE_DIR="src/routes"

mkdir -p "$ROUTE_DIR"

for model_file in "$MODEL_DIR"/*.ts; do
  base_name=$(basename "$model_file" .ts)
  route_file="$ROUTE_DIR/${base_name}.route.ts"

  echo "// Routes for $base_name" > "$route_file"
  echo "import express from 'express';" >> "$route_file"
  echo "import { ${base_name}Controller } from '../controllers/${base_name}.controller';" >> "$route_file"
  echo "" >> "$route_file"
  echo "const router = express.Router();" >> "$route_file"
  echo "const controller = new ${base_name}Controller();" >> "$route_file"
  echo "" >> "$route_file"
  echo "// TODO: define routes for $base_name" >> "$route_file"
  echo "// Example: router.get('/', controller.methodName);" >> "$route_file"
  echo "" >> "$route_file"
  echo "export default router;" >> "$route_file"

  echo "✅ Created $route_file"
done
