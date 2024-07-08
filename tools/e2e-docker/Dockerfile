FROM ubuntu:noble

# System essentials
RUN apt update
RUN apt install -y \
    ca-certificates \
    curl \
    git \
    gnupg \
    vim \

# Install Python
RUN DEBIAN_FRONTEND=noninteractive apt install -y python3 python3-setuptools

# Install Node.js
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN nvm install 20
RUN npm install -g yarn nx

# Install additional ag-charts dependencies
RUN DEBIAN_FRONTEND=noninteractive apt install -y \
    build-essential \
    cargo \
    libcairo2-dev \
    libpng-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpango1.0-dev \

#
# npx playwright install --with-deps
# yarn install --build-from-source canvas
# yarn install
