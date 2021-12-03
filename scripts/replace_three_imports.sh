#!/usr/bin/env bash

echo -n "$(grep -Po '(?<=THREE\.)[A-Za-z0-9_]+' "$1" | sort | uniq)" \
  | sed -z ';s/\n/, /g' | xargs -0 printf 'import { %s } from "three";\n\n'

sed 's/THREE\.//g' "$1"
