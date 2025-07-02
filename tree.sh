#!/bin/bash
print_tree() {
    local prefix="$1"
    local dir="$2"
    for entry in "$dir"/*; do
        if [[ -d "$entry" ]]; then
            echo "${prefix}├── $(basename "$entry")/"
            print_tree "${prefix}│   " "$entry"
        elif [[ -f "$entry" ]]; then
            echo "${prefix}├── $(basename "$entry")"
        fi
    done
}

for d in */; do
    if [[ "${d}" != "node_modules/" ]]; then
        echo "$(basename "$d")/"
        print_tree "    " "${d%/}"
        echo
    fi
done
