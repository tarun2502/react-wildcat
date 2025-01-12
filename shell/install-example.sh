#!/bin/bash

set -u

example=example
version=$(<VERSION)

# Set up links
for directory in packages/*; do
    if [ -d "${directory}" ]; then
        package=${directory##*/}

        if [ -f "${directory}/package.json" ]; then
            # Link module / package in example
            (
                cd ${example};

                # Link package to npm
                npm link ${package};

                if [[ "$package" != "react-wildcat" && "$package" != "react-wildcat-test-runners" ]]; then
                    # Link package to jspm
                    jspm install --link npm:${package}@${version} --log warn -y;
                fi
            )
        fi
    fi
done

# Install remaining modules / packages
(
    cd ${example};

    # Install node modules
    npm install;

    # Install jspm packages
    jspm install --log warn -y;
)
