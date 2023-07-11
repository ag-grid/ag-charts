ARG VARIANT="jammy"
FROM mcr.microsoft.com/vscode/devcontainers/base:0-${VARIANT}

RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        pkg-config build-essential \
        # node-canvas dependencies. \
        libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev

USER vscode
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    chmod +x $HOME/.bashrc
RUN bash -il -c "nvm i 18 && npm i -g yarn nx"
