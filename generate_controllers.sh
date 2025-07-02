#!/bin/bash

MODEL_DIR="src/models"
CONTROLLER_DIR="src/controllers"

mkdir -p "$CONTROLLER_DIR"

for model_file in "$MODEL_DIR"/*.ts; do
  base_name=$(basename "$model_file" .ts)
  controller_file="$CONTROLLER_DIR/${base_name}.controller.ts"

  echo "// Controller for $base_name" > "$controller_file"
  echo "import { ${base_name}Service } from '../services/${base_name}.service';" >> "$controller_file"
  echo "" >> "$controller_file"
  echo "export class ${base_name}Controller {" >> "$controller_file"
  echo "  private service = new ${base_name}Service();" >> "$controller_file"
  echo "" >> "$controller_file"
  echo "  // TODO: implement controller methods for $base_name" >> "$controller_file"
  echo "}" >> "$controller_file"

  echo "✅ Created $controller_file"
done
