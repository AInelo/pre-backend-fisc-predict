#!/bin/bash

MODEL_DIR="src/models"
SERVICE_DIR="src/services"

mkdir -p "$SERVICE_DIR"

for model_file in "$MODEL_DIR"/*.ts; do
  base_name=$(basename "$model_file" .ts)
  service_file="$SERVICE_DIR/${base_name}.service.ts"

  echo "// Service for $base_name" > "$service_file"
  echo "import { $base_name } from '../models/${base_name}';" >> "$service_file"
  echo "" >> "$service_file"
  echo "export class ${base_name}Service {" >> "$service_file"
  echo "  // TODO: implement service methods for $base_name" >> "$service_file"
  echo "}" >> "$service_file"

  echo "✅ Created $service_file"
done
