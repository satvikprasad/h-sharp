FROM node:23.11-slim

LABEL author="satvikprasad@gmail.com"

ENV PATH=/deps/zig-x86_64-linux-0.14.1/:$PATH

RUN apt update \
    && apt install -y curl git xz-utils

RUN mkdir -p /deps
WORKDIR /deps
RUN curl https://ziglang.org/download/0.14.1/zig-x86_64-linux-0.14.1.tar.xz -O && \
    ls && \
    tar xf zig-x86_64-linux-0.14.1.tar.xz

RUN echo export PATH="$PATH" >> ~/.bashrc

ENTRYPOINT ["bash", "-c"]
